import { logger } from '@/lib/logger'

interface WhatsAppMessage {
  to: string
  type: 'text' | 'template'
  text?: {
    body: string
  }
  template?: {
    name: string
    language: {
      code: string
    }
    components?: Array<{
      type: string
      parameters: Array<{
        type: string
        text: string
      }>
    }>
  }
}

interface WhatsAppResponse {
  messaging_product: string
  contacts: Array<{
    input: string
    wa_id: string
  }>
  messages: Array<{
    id: string
  }>
}

export class WhatsAppService {
  private accessToken: string
  private phoneNumberId: string
  private baseUrl: string

  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || ''
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || ''
    this.baseUrl = `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`
    
    if (!this.accessToken || !this.phoneNumberId) {
      logger.warn('WhatsApp credentials not configured')
    }
  }

  /**
   * Enviar mensaje de texto simple
   */
  async sendTextMessage(to: string, message: string): Promise<WhatsAppResponse | null> {
    try {
      const payload: WhatsAppMessage = {
        to: this.normalizePhoneNumber(to),
        type: 'text',
        text: {
          body: message
        }
      }

      return await this.sendMessage(payload)
    } catch (error: any) {
      logger.error('Error sending text message', {
        error: error.message,
        to,
        message: message.substring(0, 100)
      })
      throw error
    }
  }

  /**
   * Enviar mensaje usando template
   */
  async sendTemplateMessage(
    to: string, 
    templateName: string, 
    languageCode: string = 'es',
    parameters: string[] = []
  ): Promise<WhatsAppResponse | null> {
    try {
      const components = parameters.length > 0 ? [{
        type: 'body',
        parameters: parameters.map(param => ({
          type: 'text',
          text: param
        }))
      }] : undefined

      const payload: WhatsAppMessage = {
        to: this.normalizePhoneNumber(to),
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: languageCode
          },
          components
        }
      }

      return await this.sendMessage(payload)
    } catch (error: any) {
      logger.error('Error sending template message', {
        error: error.message,
        to,
        templateName
      })
      throw error
    }
  }

  /**
   * Enviar mensaje genérico
   */
  private async sendMessage(payload: WhatsAppMessage): Promise<WhatsAppResponse | null> {
    if (!this.accessToken || !this.phoneNumberId) {
      logger.warn('WhatsApp not configured, skipping message send')
      return null
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          ...payload
        })
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`WhatsApp API error: ${response.status} - ${errorData}`)
      }

      const result: WhatsAppResponse = await response.json()
      
      logger.info('WhatsApp message sent successfully', {
        to: payload.to,
        type: payload.type,
        messageId: result.messages?.[0]?.id
      })

      return result
    } catch (error: any) {
      logger.error('Error calling WhatsApp API', {
        error: error.message,
        to: payload.to,
        type: payload.type
      })
      throw error
    }
  }

  /**
   * Normalizar número de teléfono para WhatsApp
   */
  private normalizePhoneNumber(phone: string): string {
    // Remover todos los caracteres no numéricos
    let normalized = phone.replace(/\D/g, '')
    
    // Si empieza con 54 (Argentina), mantenerlo
    if (normalized.startsWith('54')) {
      return normalized
    }
    
    // Si empieza con 9 después del código de país, removerlo
    if (normalized.startsWith('549')) {
      return '54' + normalized.substring(3)
    }
    
    // Si no tiene código de país, agregar 54 (Argentina)
    if (normalized.length === 10) {
      return '54' + normalized
    }
    
    return normalized
  }

  /**
   * Verificar si WhatsApp está configurado
   */
  isConfigured(): boolean {
    return !!(this.accessToken && this.phoneNumberId)
  }

  /**
   * Obtener información de configuración (sin credenciales sensibles)
   */
  getConfig() {
    return {
      configured: this.isConfigured(),
      phoneNumberId: this.phoneNumberId ? `***${this.phoneNumberId.slice(-4)}` : null,
      hasAccessToken: !!this.accessToken
    }
  }
}

// Templates predefinidos comunes
export const WhatsAppTemplates = {
  BIENVENIDA: 'bienvenida_phorencial',
  SEGUIMIENTO: 'seguimiento_lead',
  DOCUMENTOS: 'solicitud_documentos',
  APROBACION: 'prestamo_aprobado',
  RECHAZO: 'prestamo_rechazado'
} as const

// Instancia singleton
export const whatsappService = new WhatsAppService()
