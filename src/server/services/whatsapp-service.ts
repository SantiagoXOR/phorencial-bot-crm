import { PrismaClient } from '@prisma/client'
import { ConversationService } from './conversation-service'
import { ManychatService } from './manychat-service'
import { ManychatSyncService } from './manychat-sync-service'
import { ManychatMessage } from '@/types/manychat'

const prisma = new PrismaClient()

export interface WhatsAppMessage {
  id: string
  from: string
  to: string
  type: 'text' | 'image' | 'video' | 'audio' | 'document'
  text?: {
    body: string
  }
  image?: {
    id: string
    mime_type: string
    sha256: string
  }
  video?: {
    id: string
    mime_type: string
    sha256: string
  }
  audio?: {
    id: string
    mime_type: string
    sha256: string
  }
  document?: {
    id: string
    mime_type: string
    sha256: string
    filename: string
  }
  timestamp: string
}

export interface SendMessageData {
  to: string
  message: string
  mediaUrl?: string
  messageType?: 'text' | 'image' | 'video' | 'audio' | 'document'
}

export class WhatsAppService {
  // Mantener credenciales de Meta como fallback
  private static readonly WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0'
  private static readonly WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
  private static readonly WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN
  
  // Usar Manychat como prioridad
  private static readonly USE_MANYCHAT = ManychatService.isConfigured()

  /**
   * Procesar mensaje entrante de WhatsApp
   */
  static async processIncomingMessage(webhookData: any) {
    try {
      const message = webhookData.entry?.[0]?.changes?.[0]?.value?.messages?.[0]
      if (!message) {
        console.log('No message found in webhook data')
        return
      }

      const from = message.from
      const platformId = message.id
      const content = this.extractMessageContent(message)
      const messageType = this.extractMessageType(message)
      const mediaUrl = this.extractMediaUrl(message)

      // Buscar o crear conversación
      let conversation = await ConversationService.findConversationByPlatform('whatsapp', platformId)
      
      if (!conversation) {
        // Buscar lead existente por teléfono
        const lead = await prisma.lead.findFirst({
          where: { telefono: from }
        })

        // Crear nueva conversación
        conversation = await ConversationService.createConversation({
          platform: 'whatsapp',
          platformId,
          leadId: lead?.id
        })
      }

      // Crear mensaje
      await this.createMessage({
        conversationId: conversation.id,
        direction: 'inbound',
        content,
        messageType,
        mediaUrl,
        platformMsgId: platformId
      })

      // Actualizar última actividad
      await ConversationService.updateLastActivity(conversation.id)

      console.log(`Processed incoming WhatsApp message from ${from}`)
      return conversation
    } catch (error) {
      console.error('Error processing incoming WhatsApp message:', error)
      throw error
    }
  }

  /**
   * Enviar mensaje por WhatsApp (usando Manychat o Meta API)
   */
  static async sendMessage(data: SendMessageData) {
    try {
      // Si Manychat está configurado, usarlo
      if (this.USE_MANYCHAT) {
        return await this.sendMessageViaManychat(data)
      }

      // Fallback a Meta API
      return await this.sendMessageViaMetaAPI(data)
    } catch (error) {
      console.error('Error sending WhatsApp message:', error)
      throw error
    }
  }

  /**
   * Enviar mensaje usando Manychat
   */
  private static async sendMessageViaManychat(data: SendMessageData) {
    try {
      // Buscar subscriber por teléfono
      let subscriber = await ManychatService.getSubscriberByPhone(data.to)

      // Si no existe, buscar lead en CRM y sincronizar
      if (!subscriber) {
        const lead = await prisma.lead.findFirst({
          where: { telefono: data.to },
        })

        if (lead) {
          // Sincronizar lead a Manychat
          await ManychatSyncService.syncLeadToManychat(lead.id)
          // Intentar obtener subscriber nuevamente
          subscriber = await ManychatService.getSubscriberByPhone(data.to)
        }
      }

      if (!subscriber) {
        throw new Error(`No se encontró subscriber en Manychat para ${data.to}`)
      }

      // Construir mensaje para Manychat
      const messages: ManychatMessage[] = []

      if (data.messageType === 'image' && data.mediaUrl) {
        messages.push({
          type: 'image',
          url: data.mediaUrl,
          caption: data.message,
        })
      } else if (data.messageType === 'video' && data.mediaUrl) {
        messages.push({
          type: 'video',
          url: data.mediaUrl,
          caption: data.message,
        })
      } else if (data.messageType === 'audio' && data.mediaUrl) {
        messages.push({
          type: 'audio',
          url: data.mediaUrl,
        })
      } else if (data.messageType === 'document' && data.mediaUrl) {
        messages.push({
          type: 'file',
          url: data.mediaUrl,
          filename: 'document.pdf',
        })
      } else {
        // Mensaje de texto por defecto
        messages.push({
          type: 'text',
          text: data.message,
        })
      }

      // Enviar mensaje
      const response = await ManychatService.sendMessage(subscriber.id, messages)

      if (response.status === 'success') {
        return {
          success: true,
          messageId: response.data?.message_id,
          provider: 'manychat',
        }
      } else {
        throw new Error(response.error || 'Error enviando mensaje por Manychat')
      }
    } catch (error) {
      console.error('Error en sendMessageViaManychat:', error)
      throw error
    }
  }

  /**
   * Enviar mensaje usando Meta API (fallback)
   */
  private static async sendMessageViaMetaAPI(data: SendMessageData) {
    try {
      if (!this.WHATSAPP_ACCESS_TOKEN || !this.WHATSAPP_PHONE_NUMBER_ID) {
        throw new Error('WhatsApp credentials not configured')
      }

      const messageData = this.buildMessagePayload(data)
      
      const response = await fetch(
        `${this.WHATSAPP_API_URL}/${this.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(messageData)
        }
      )

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`WhatsApp API error: ${error}`)
      }

      const result = await response.json()
      return {
        success: true,
        messageId: result.messages?.[0]?.id,
        provider: 'meta',
        ...result,
      }
    } catch (error) {
      console.error('Error en sendMessageViaMetaAPI:', error)
      throw error
    }
  }

  /**
   * Crear mensaje en la base de datos
   */
  static async createMessage(data: {
    conversationId: string
    direction: 'inbound' | 'outbound'
    content: string
    messageType: string
    mediaUrl?: string
    platformMsgId?: string
  }) {
    try {
      const message = await prisma.message.create({
        data: {
          conversationId: data.conversationId,
          direction: data.direction,
          content: data.content,
          messageType: data.messageType,
          mediaUrl: data.mediaUrl,
          platformMsgId: data.platformMsgId,
          sentAt: new Date(),
          ...(data.direction === 'outbound' && { deliveredAt: new Date() })
        }
      })

      return message
    } catch (error) {
      console.error('Error creating message:', error)
      throw error
    }
  }

  /**
   * Marcar mensaje como leído
   */
  static async markAsRead(messageId: string) {
    try {
      await prisma.message.update({
        where: { id: messageId },
        data: { readAt: new Date() }
      })
    } catch (error) {
      console.error('Error marking message as read:', error)
      throw error
    }
  }

  /**
   * Obtener historial de conversación
   */
  static async getConversationHistory(conversationId: string) {
    try {
      const messages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { sentAt: 'asc' }
      })

      return messages
    } catch (error) {
      console.error('Error fetching conversation history:', error)
      throw error
    }
  }

  /**
   * Extraer contenido del mensaje
   */
  private static extractMessageContent(message: WhatsAppMessage): string {
    if (message.text?.body) {
      return message.text.body
    }
    
    if (message.image) {
      return '[Imagen]'
    }
    
    if (message.video) {
      return '[Video]'
    }
    
    if (message.audio) {
      return '[Audio]'
    }
    
    if (message.document) {
      return `[Documento: ${message.document.filename}]`
    }
    
    return '[Mensaje no soportado]'
  }

  /**
   * Extraer tipo de mensaje
   */
  private static extractMessageType(message: WhatsAppMessage): string {
    if (message.text) return 'text'
    if (message.image) return 'image'
    if (message.video) return 'video'
    if (message.audio) return 'audio'
    if (message.document) return 'document'
    return 'text'
  }

  /**
   * Extraer URL de media
   */
  private static extractMediaUrl(message: WhatsAppMessage): string | undefined {
    const media = message.image || message.video || message.audio || message.document
    return media?.id ? `${this.WHATSAPP_API_URL}/${media.id}` : undefined
  }

  /**
   * Construir payload para envío de mensaje
   */
  private static buildMessagePayload(data: SendMessageData) {
    const basePayload = {
      messaging_product: 'whatsapp',
      to: data.to,
    }

    if (data.messageType === 'text' || !data.messageType) {
      return {
        ...basePayload,
        type: 'text',
        text: { body: data.message }
      }
    }

    if (data.messageType === 'image' && data.mediaUrl) {
      return {
        ...basePayload,
        type: 'image',
        image: {
          link: data.mediaUrl,
          caption: data.message
        }
      }
    }

    if (data.messageType === 'document' && data.mediaUrl) {
      return {
        ...basePayload,
        type: 'document',
        document: {
          link: data.mediaUrl,
          filename: 'document.pdf'
        }
      }
    }

    // Fallback a texto
    return {
      ...basePayload,
      type: 'text',
      text: { body: data.message }
    }
  }
}