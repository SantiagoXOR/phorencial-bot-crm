import { z } from 'zod'

export const LeadCreateSchema = z.object({
  nombre: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
  telefono: z.string().min(10, 'Teléfono debe tener al menos 10 dígitos'),
  email: z.string().email('Email inválido').optional().or(z.literal('').transform(() => undefined)),
  dni: z.string().optional().or(z.literal('').transform(() => undefined)),
  ingresos: z.number().positive('Ingresos deben ser positivos').optional().nullable(),
  zona: z.string().optional().or(z.literal('').transform(() => undefined)),
  producto: z.string().optional().or(z.literal('').transform(() => undefined)),
  monto: z.number().positive('Monto debe ser positivo').optional().nullable(),
  origen: z.enum(['whatsapp', 'instagram', 'facebook', 'comentario', 'web', 'ads', 'otro']).optional().or(z.literal('').transform(() => undefined)),
  utmSource: z.string().optional().or(z.literal('').transform(() => undefined)),
  estado: z.enum(['NUEVO', 'EN_REVISION', 'PREAPROBADO', 'RECHAZADO', 'DOC_PENDIENTE', 'DERIVADO']).optional(),
  agencia: z.string().optional().or(z.literal('').transform(() => undefined)),
  notas: z.string().optional().or(z.literal('').transform(() => undefined)),
})

export const LeadUpdateSchema = z.object({
  nombre: z.string().min(2).optional(),
  telefono: z.string().min(10).optional(),
  email: z.string().email().optional().or(z.literal('')),
  dni: z.string().optional(),
  ingresos: z.number().positive().optional(),
  zona: z.string().optional(),
  producto: z.string().optional(),
  monto: z.number().positive().optional(),
  origen: z.enum(['whatsapp', 'instagram', 'facebook', 'comentario', 'web', 'ads', 'otro']).optional(),
  utmSource: z.string().optional(),
  estado: z.enum(['NUEVO', 'EN_REVISION', 'PREAPROBADO', 'RECHAZADO', 'DOC_PENDIENTE', 'DERIVADO']).optional(),
  agencia: z.string().optional(),
  notas: z.string().optional(),
})

export const WhatsAppEventSchema = z.object({
  telefono: z.string().min(10),
  type: z.enum(['text', 'template', 'image', 'status']),
  messageId: z.string().optional(),
  timestamp: z.number().optional(),
  payload: z.any().optional(),
})

export const ScoringRequestSchema = z.object({
  leadId: z.string().uuid(),
})

export const LeadQuerySchema = z.object({
  estado: z.enum(['NUEVO', 'EN_REVISION', 'PREAPROBADO', 'RECHAZADO', 'DOC_PENDIENTE', 'DERIVADO']).optional(),
  origen: z.enum(['whatsapp', 'instagram', 'facebook', 'comentario', 'web', 'ads', 'otro']).optional(),
  q: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.string().transform(val => parseInt(val) || 1).optional(),
  limit: z.string().transform(val => Math.min(parseInt(val) || 10, 100)).optional(),
})

export type LeadCreate = z.infer<typeof LeadCreateSchema>
export type LeadUpdate = z.infer<typeof LeadUpdateSchema>
export type WhatsAppEvent = z.infer<typeof WhatsAppEventSchema>
export type ScoringRequest = z.infer<typeof ScoringRequestSchema>
export type LeadQuery = z.infer<typeof LeadQuerySchema>
