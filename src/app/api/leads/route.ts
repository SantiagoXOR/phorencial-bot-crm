import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseLeadService } from '@/server/services/supabase-lead-service'
import { LeadCreateSchema, LeadQuerySchema } from '@/lib/validators'
import { checkPermission, hasPermission } from '@/lib/rbac'
import { logger } from '@/lib/logger'
import { pipelineService } from '@/server/services/pipeline-service'
import { withMonitoring, captureDbError, setSentryUser, captureBusinessMetric } from '@/lib/monitoring-temp'
import { withValidation, createValidationErrorResponse } from '@/lib/validation-middleware'

/**
 * @swagger
 * /api/leads:
 *   post:
 *     summary: Create a new lead
 *     description: Creates a new lead in the system
 *     tags:
 *       - Leads
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - telefono
 *             properties:
 *               nombre:
 *                 type: string
 *                 description: Lead name
 *                 example: "Juan Pérez"
 *               telefono:
 *                 type: string
 *                 description: Phone number
 *                 example: "+5491155556789"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address
 *                 example: "juan.perez@example.com"
 *               origen:
 *                 type: string
 *                 description: Lead source
 *                 example: "WhatsApp"
 *               notas:
 *                 type: string
 *                 description: Additional notes
 *                 example: "Interesado en el producto premium"
 *     responses:
 *       201:
 *         description: Lead created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Lead'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   get:
 *     summary: Get leads with pagination and filtering
 *     description: Retrieves a paginated list of leads with optional filtering
 *     tags:
 *       - Leads
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search term for filtering leads
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [NUEVO, CONTACTADO, CALIFICADO, PROPUESTA, GANADO, PERDIDO]
 *         description: Filter by lead status
 *       - in: query
 *         name: origen
 *         schema:
 *           type: string
 *         description: Filter by lead source
 *       - in: query
 *         name: include_pipeline
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include pipeline information in response
 *     responses:
 *       200:
 *         description: List of leads retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 leads:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Lead'
 *                 total:
 *                   type: integer
 *                   example: 150
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

async function postHandler(
  request: NextRequest,
  context: { body?: any }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'Debe iniciar sesión para crear leads'
      }, { status: 401 })
    }

    // Verificar permisos
    try {
      checkPermission(session.user.role, 'leads:write')
    } catch (error) {
      return NextResponse.json({
        error: 'Forbidden',
        message: 'No tiene permisos para crear leads'
      }, { status: 403 })
    }

    // Los datos ya están validados por el middleware
    const validatedData = context.body

    logger.info('Creating new lead', {
      userId: session.user.id,
      leadData: { ...validatedData, telefono: '***' } // Ocultar teléfono en logs
    })

    // Crear lead usando el servicio de Supabase
    const lead = await supabaseLeadService.createLead(validatedData)

    // Verificar que el lead fue creado correctamente con un ID
    if (!lead.id) {
      throw new Error('Lead created but no ID returned')
    }

    // Crear pipeline automáticamente para el nuevo lead
    try {
      if (session.user?.id) {
        await pipelineService.createLeadPipeline(lead.id, session.user.id)
        logger.info('Pipeline created automatically for new lead', { leadId: lead.id })
      }
    } catch (pipelineError) {
      // Log error pero no fallar la creación del lead
      logger.error('Error creating pipeline for new lead', {
        leadId: lead.id,
        error: pipelineError
      })
    }

    logger.info('Lead created successfully', {
      leadId: lead.id,
      estado: lead.estado,
      userId: session.user.id
    })

    return NextResponse.json({
      id: lead.id,
      estado: lead.estado,
      isUpdate: false,
      message: 'Lead creado exitosamente'
    }, { status: 201 })

  } catch (error: any) {
    logger.error('Error in POST /api/leads', {
      error: error.message,
      stack: error.stack,
      userId: (await getServerSession(authOptions))?.user?.id
    })

    return NextResponse.json({
      error: 'Internal server error',
      message: 'Error interno del servidor al crear el lead'
    }, { status: 500 })
  }
}

// Export wrapped handlers with validation and monitoring
export const POST = withMonitoring(
  withValidation(postHandler, {
    bodySchema: LeadCreateSchema
  }),
  '/api/leads'
)

export const GET = withMonitoring(
  withValidation(getHandler, {
    querySchema: LeadQuerySchema
  }),
  '/api/leads'
)

async function getHandler(
  request: NextRequest,
  context: { query?: any }
) {
  try {
    const session = await getServerSession(authOptions)

    // Permitir acceso sin autenticación en modo testing
    const isTestingMode = process.env.TESTING_MODE === 'true'

    if (!session && !isTestingMode) {
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'Debe iniciar sesión para ver los leads'
      }, { status: 401 })
    }

    // Solo verificar permisos si hay sesión
    if (session) {
      try {
        checkPermission(session.user.role, 'leads:read')
      } catch (error) {
        return NextResponse.json({
          error: 'Forbidden',
          message: 'No tiene permisos para ver los leads'
        }, { status: 403 })
      }
    }

    // Los query params ya están validados por el middleware
    const validatedQuery = context.query || {}
    const { searchParams } = new URL(request.url)
    const includePipeline = searchParams.get('include_pipeline') === 'true'

    logger.info('GET /api/leads - Validated query', {
      validatedQuery,
      includePipeline,
      userId: session?.user?.id
    })

    // Obtener leads usando el servicio de Supabase
    const page = validatedQuery.page || 1
    const limit = validatedQuery.limit || 10

    const filters = {
      estado: validatedQuery.estado,
      origen: validatedQuery.origen,
      zona: validatedQuery.zona,
      search: validatedQuery.q,
      ingresoMin: validatedQuery.ingresoMin,
      ingresoMax: validatedQuery.ingresoMax,
      fechaDesde: validatedQuery.fechaDesde,
      fechaHasta: validatedQuery.fechaHasta,
      sortBy: validatedQuery.sortBy,
      sortOrder: validatedQuery.sortOrder,
      limit: limit,
      offset: (page - 1) * limit,
      includePipeline: includePipeline
    }

    logger.info('GET /api/leads - Calling supabaseLeadService.getLeads', {
      filters: { ...filters, search: filters.search ? '***' : undefined } // Ocultar búsqueda en logs
    })

    const { leads, total } = await supabaseLeadService.getLeads(filters)

    logger.info('GET /api/leads - Response from service', {
      leadsCount: leads.length,
      total,
      page,
      limit,
      userId: session?.user?.id
    })

    return NextResponse.json({
      leads,
      total,
      page: page,
      limit: limit,
      filters: {
        estado: validatedQuery.estado,
        origen: validatedQuery.origen,
        zona: validatedQuery.zona,
        hasSearch: !!validatedQuery.q,
        sortBy: validatedQuery.sortBy,
        sortOrder: validatedQuery.sortOrder
      }
    })

  } catch (error: any) {
    logger.error('Error in GET /api/leads', {
      error: error.message,
      stack: error.stack,
      userId: (await getServerSession(authOptions))?.user?.id
    })

    return NextResponse.json({
      error: 'Internal server error',
      message: 'Error interno del servidor al obtener los leads'
    }, { status: 500 })
  }
}
