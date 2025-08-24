import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { whatsappService } from '@/server/services/whatsapp-service'
import { EventRepository } from '@/server/repositories/event-repository'
import { checkPermission } from '@/lib/rbac'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const eventRepo = new EventRepository()

// Esquema de validación para envío de mensajes
const SendMessageSchema = z.object({
  leadId: z.string().cuid(),
  telefono: z.string().min(10),
  mensaje: z.string().min(1).max(4096),
  tipo: z.enum(['text', 'template']).default('text'),
  templateName: z.string().optional(),
  templateParams: z.array(z.string()).optional()
})

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permisos
    checkPermission(session.user.role, 'leads:write')

    // Validar datos
    const body = await request.json()
    const validatedData = SendMessageSchema.parse(body)

    // Verificar que WhatsApp esté configurado
    if (!whatsappService.isConfigured()) {
      return NextResponse.json({ 
        error: 'WhatsApp no está configurado' 
      }, { status: 503 })
    }

    let result
    
    // Enviar mensaje según el tipo
    if (validatedData.tipo === 'template' && validatedData.templateName) {
      result = await whatsappService.sendTemplateMessage(
        validatedData.telefono,
        validatedData.templateName,
        'es',
        validatedData.templateParams || []
      )
    } else {
      result = await whatsappService.sendTextMessage(
        validatedData.telefono,
        validatedData.mensaje
      )
    }

    if (!result) {
      return NextResponse.json({ 
        error: 'No se pudo enviar el mensaje' 
      }, { status: 500 })
    }

    // Registrar evento de mensaje enviado
    await eventRepo.create({
      leadId: validatedData.leadId,
      tipo: 'whatsapp_out',
      payload: {
        mensaje: validatedData.mensaje,
        telefono: validatedData.telefono,
        messageId: result.messages?.[0]?.id,
        tipo: validatedData.tipo,
        templateName: validatedData.templateName,
        templateParams: validatedData.templateParams,
        sentBy: session.user.id,
        sentAt: new Date().toISOString()
      }
    })

    logger.info('WhatsApp message sent from CRM', {
      leadId: validatedData.leadId,
      telefono: validatedData.telefono,
      messageId: result.messages?.[0]?.id,
      sentBy: session.user.id
    })

    return NextResponse.json({
      success: true,
      messageId: result.messages?.[0]?.id,
      contact: result.contacts?.[0]
    })

  } catch (error: any) {
    logger.error('Error sending WhatsApp message', {
      error: error.message,
      stack: error.stack
    })

    if (error.name === 'ZodError') {
      return NextResponse.json({ 
        error: 'Datos inválidos', 
        details: error.errors 
      }, { status: 400 })
    }

    if (error.message.includes('Insufficient permissions')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}

// Endpoint para obtener templates disponibles
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    checkPermission(session.user.role, 'leads:read')

    const config = whatsappService.getConfig()
    
    // Templates predefinidos (en producción estos vendrían de la API de Meta)
    const templates = [
      {
        name: 'bienvenida_phorencial',
        displayName: 'Bienvenida',
        description: 'Mensaje de bienvenida para nuevos leads',
        parameters: ['nombre']
      },
      {
        name: 'seguimiento_lead',
        displayName: 'Seguimiento',
        description: 'Mensaje de seguimiento para leads en proceso',
        parameters: ['nombre', 'estado']
      },
      {
        name: 'solicitud_documentos',
        displayName: 'Solicitud de Documentos',
        description: 'Solicitar documentación al lead',
        parameters: ['nombre', 'documentos']
      },
      {
        name: 'prestamo_aprobado',
        displayName: 'Préstamo Aprobado',
        description: 'Notificar aprobación del préstamo',
        parameters: ['nombre', 'monto']
      },
      {
        name: 'prestamo_rechazado',
        displayName: 'Préstamo Rechazado',
        description: 'Notificar rechazo del préstamo',
        parameters: ['nombre', 'motivo']
      }
    ]

    return NextResponse.json({
      config,
      templates
    })

  } catch (error: any) {
    logger.error('Error getting WhatsApp templates', {
      error: error.message
    })

    if (error.message.includes('Insufficient permissions')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}
