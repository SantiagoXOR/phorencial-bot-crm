import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseLeadService } from '@/server/services/supabase-lead-service'
import { LeadCreateSchema, LeadQuerySchema } from '@/lib/validators'
import { checkPermission } from '@/lib/rbac'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    checkPermission(session.user.role, 'leads:write')

    const body = await request.json()
    const validatedData = LeadCreateSchema.parse(body)

    // Crear lead usando el servicio de Supabase
    const lead = await supabaseLeadService.createLead(validatedData)

    return NextResponse.json({
      id: lead.id,
      estado: lead.estado,
      isUpdate: false,
    }, { status: 201 })

  } catch (error: any) {
    logger.error('Error in POST /api/leads', { error: error.message })
    
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    
    if (error.message.includes('Insufficient permissions')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    checkPermission(session.user.role, 'leads:read')

    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams.entries())

    const validatedQuery = LeadQuerySchema.parse(query)

    // Obtener leads usando el servicio de Supabase
    const page = validatedQuery.page || 1
    const limit = validatedQuery.limit || 10

    const { leads, total } = await supabaseLeadService.getLeads({
      estado: validatedQuery.estado,
      origen: validatedQuery.origen,
      search: validatedQuery.q,
      limit: limit,
      offset: (page - 1) * limit
    })

    return NextResponse.json({
      leads,
      total,
      page: page,
      limit: limit,
    })

  } catch (error: any) {
    logger.error('Error in GET /api/leads', { error: error.message })
    
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.errors }, { status: 400 })
    }
    
    if (error.message.includes('Insufficient permissions')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
