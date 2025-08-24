import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { LeadService } from '@/server/services/lead-service'
import { LeadCreateSchema, LeadQuerySchema } from '@/lib/validators'
import { checkPermission } from '@/lib/rbac'
import { logger } from '@/lib/logger'

const leadService = new LeadService()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    checkPermission(session.user.role, 'leads:write')

    const body = await request.json()
    const validatedData = LeadCreateSchema.parse(body)

    const { lead, isUpdate } = await leadService.upsertLead(validatedData, session.user.id)

    return NextResponse.json({
      id: lead.id,
      estado: lead.estado,
      isUpdate,
    }, { status: isUpdate ? 200 : 201 })

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
    const result = await leadService.getLeads(validatedQuery)

    return NextResponse.json(result)

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
