import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { LeadService } from '@/server/services/lead-service'
import { LeadUpdateSchema } from '@/lib/validators'
import { checkPermission } from '@/lib/rbac'
import { logger } from '@/lib/logger'

const leadService = new LeadService()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    checkPermission(session.user.role, 'leads:read')

    const lead = await leadService.getLeadById(params.id)

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    return NextResponse.json(lead)

  } catch (error: any) {
    logger.error('Error in GET /api/leads/[id]', { error: error.message, leadId: params.id })
    
    if (error.message.includes('Insufficient permissions')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    checkPermission(session.user.role, 'leads:write')

    const body = await request.json()
    const validatedData = LeadUpdateSchema.parse(body)

    const lead = await leadService.updateLead(params.id, validatedData, session.user.id)

    return NextResponse.json(lead)

  } catch (error: any) {
    logger.error('Error in PATCH /api/leads/[id]', { error: error.message, leadId: params.id })
    
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    
    if (error.message.includes('Insufficient permissions')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
