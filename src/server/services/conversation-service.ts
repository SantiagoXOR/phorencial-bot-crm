import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface CreateConversationData {
  platform: string
  platformId: string
  leadId?: string
}

export interface ConversationWithDetails {
  id: string
  platform: string
  platformId: string
  status: string
  assignedTo?: string
  lastMessageAt: Date
  createdAt: Date
  updatedAt: Date
  lead?: {
    id: string
    nombre: string
    telefono: string
    email?: string
  }
  assignedUser?: {
    id: string
    nombre: string
    email: string
  }
  messages: Array<{
    id: string
    direction: string
    content: string
    messageType: string
    sentAt: Date
    readAt?: Date
  }>
}

export class ConversationService {
  /**
   * Crear una nueva conversación
   */
  static async createConversation(data: CreateConversationData) {
    try {
      const conversation = await prisma.conversation.create({
        data: {
          platform: data.platform,
          platformId: data.platformId,
          leadId: data.leadId,
        },
        include: {
          lead: {
            select: {
              id: true,
              nombre: true,
              telefono: true,
              email: true,
            }
          },
          assignedUser: {
            select: {
              id: true,
              nombre: true,
              email: true,
            }
          },
          messages: {
            orderBy: { sentAt: 'desc' },
            take: 10,
            select: {
              id: true,
              direction: true,
              content: true,
              messageType: true,
              sentAt: true,
              readAt: true,
            }
          }
        }
      })

      return conversation
    } catch (error) {
      console.error('Error creating conversation:', error)
      throw new Error('Failed to create conversation')
    }
  }

  /**
   * Obtener conversación por ID
   */
  static async getConversationById(id: string): Promise<ConversationWithDetails | null> {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id },
        include: {
          lead: {
            select: {
              id: true,
              nombre: true,
              telefono: true,
              email: true,
            }
          },
          assignedUser: {
            select: {
              id: true,
              nombre: true,
              email: true,
            }
          },
          messages: {
            orderBy: { sentAt: 'asc' },
            select: {
              id: true,
              direction: true,
              content: true,
              messageType: true,
              sentAt: true,
              readAt: true,
            }
          }
        }
      })

      return conversation
    } catch (error) {
      console.error('Error fetching conversation:', error)
      throw new Error('Failed to fetch conversation')
    }
  }

  /**
   * Obtener conversaciones activas
   */
  static async getActiveConversations(userId?: string) {
    try {
      const where = userId 
        ? { assignedTo: userId, status: { in: ['open', 'assigned'] } }
        : { status: { in: ['open', 'assigned'] } }

      const conversations = await prisma.conversation.findMany({
        where,
        include: {
          lead: {
            select: {
              id: true,
              nombre: true,
              telefono: true,
              email: true,
            }
          },
          assignedUser: {
            select: {
              id: true,
              nombre: true,
              email: true,
            }
          },
          messages: {
            orderBy: { sentAt: 'desc' },
            take: 1,
            select: {
              id: true,
              direction: true,
              content: true,
              messageType: true,
              sentAt: true,
            }
          }
        },
        orderBy: { lastMessageAt: 'desc' }
      })

      return conversations
    } catch (error) {
      console.error('Error fetching active conversations:', error)
      throw new Error('Failed to fetch conversations')
    }
  }

  /**
   * Asignar conversación a un usuario
   */
  static async assignConversation(conversationId: string, userId: string) {
    try {
      const conversation = await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          assignedTo: userId,
          status: 'assigned',
          updatedAt: new Date()
        },
        include: {
          lead: {
            select: {
              id: true,
              nombre: true,
              telefono: true,
              email: true,
            }
          },
          assignedUser: {
            select: {
              id: true,
              nombre: true,
              email: true,
            }
          }
        }
      })

      return conversation
    } catch (error) {
      console.error('Error assigning conversation:', error)
      throw new Error('Failed to assign conversation')
    }
  }

  /**
   * Cerrar conversación
   */
  static async closeConversation(conversationId: string) {
    try {
      const conversation = await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          status: 'closed',
          updatedAt: new Date()
        }
      })

      return conversation
    } catch (error) {
      console.error('Error closing conversation:', error)
      throw new Error('Failed to close conversation')
    }
  }

  /**
   * Buscar conversación por plataforma e ID
   */
  static async findConversationByPlatform(platform: string, platformId: string) {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: {
          platform_platformId: {
            platform,
            platformId
          }
        },
        include: {
          lead: {
            select: {
              id: true,
              nombre: true,
              telefono: true,
              email: true,
            }
          }
        }
      })

      return conversation
    } catch (error) {
      console.error('Error finding conversation by platform:', error)
      throw new Error('Failed to find conversation')
    }
  }

  /**
   * Actualizar última actividad de conversación
   */
  static async updateLastActivity(conversationId: string) {
    try {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageAt: new Date(),
          updatedAt: new Date()
        }
      })
    } catch (error) {
      console.error('Error updating conversation activity:', error)
      throw new Error('Failed to update conversation activity')
    }
  }
}
