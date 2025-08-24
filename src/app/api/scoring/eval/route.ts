import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ScoringService } from '@/server/services/scoring-service'
import { ScoringRequestSchema } from '@/lib/validators'
import { checkPermission } from '@/lib/rbac'
import { logger } from '@/lib/logger'

const scoringService = new ScoringService()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    checkPermission(session.user.role, 'leads:write')

    const body = await request.json()
    const { leadId } = ScoringRequestSchema.parse(body)

    const result = await scoringService.evaluateLead(leadId, session.user.id)

    return NextResponse.json(result)

  } catch (error: any) {
    logger.error('Error in POST /api/scoring/eval', { error: error.message })
    
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    
    if (error.message.includes('Insufficient permissions')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (error.message === 'Lead not found') {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
