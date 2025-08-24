import { RuleRepository } from '../repositories/rule-repository'
import { LeadRepository } from '../repositories/lead-repository'
import { EventRepository } from '../repositories/event-repository'
import { logger } from '@/lib/logger'

export interface ScoringResult {
  score: number
  decision: 'PREAPROBADO' | 'EN_REVISION' | 'RECHAZADO'
  motivos: string[]
}

export class ScoringService {
  private ruleRepo = new RuleRepository()
  private leadRepo = new LeadRepository()
  private eventRepo = new EventRepository()

  async evaluateLead(leadId: string, userId?: string): Promise<ScoringResult> {
    try {
      logger.info('Starting lead evaluation', { leadId, userId })

      // Verificar que el lead existe
      const lead = await this.leadRepo.findById(leadId)
      if (!lead) {
        logger.error('Lead not found', { leadId })
        throw new Error('Lead not found')
      }

      logger.info('Lead found', { leadId, leadData: lead })

      // Obtener reglas de scoring
      let rules
      try {
        rules = await this.ruleRepo.findAll()
        logger.info('Rules fetched', { rulesCount: rules.length })
      } catch (error) {
        logger.error('Error fetching rules', { error })
        throw new Error('Error fetching scoring rules')
      }

      if (!rules || rules.length === 0) {
        logger.error('No scoring rules found')
        throw new Error('No scoring rules configured')
      }

      const ruleMap = new Map<string, any>(rules.map((r: any) => [r.key, r.value]))
      logger.info('Rule map created', { ruleKeys: Array.from(ruleMap.keys()) })

      const result = await this.calculateScore(lead, ruleMap)
      logger.info('Score calculated', { result })

      // Actualizar estado del lead
      try {
        if (result.decision === 'PREAPROBADO') {
          await this.leadRepo.update(leadId, { estado: 'PREAPROBADO' })
        } else if (result.decision === 'RECHAZADO') {
          await this.leadRepo.update(leadId, { estado: 'RECHAZADO' })
        } else {
          await this.leadRepo.update(leadId, { estado: 'EN_REVISION' })
        }
        logger.info('Lead status updated', { leadId, newStatus: result.decision })
      } catch (error) {
        logger.error('Error updating lead status', { error, leadId })
        // No lanzar error aquí, el scoring ya se calculó
      }

      // Registrar evento
      try {
        await this.eventRepo.create({
          leadId,
          tipo: 'scoring_evaluated',
          payload: { userId, result },
        })
        logger.info('Scoring event created', { leadId })
      } catch (error) {
        logger.error('Error creating scoring event', { error, leadId })
        // No lanzar error aquí, el scoring ya se calculó
      }

      logger.info('Lead scoring evaluation completed', { leadId, result })
      return result

    } catch (error: any) {
      logger.error('Error evaluating lead scoring', {
        error: error.message,
        stack: error.stack,
        leadId
      })
      throw error
    }
  }

  private async calculateScore(lead: any, rules: Map<string, any>): Promise<ScoringResult> {
    let score = 0
    const motivos: string[] = []

    // Validar edad (si tenemos DNI)
    if (lead.dni && lead.dni.length >= 8) {
      const edad = this.calculateAge(lead.dni)
      const edadMin = rules.get('edadMin') || 18
      const edadMax = rules.get('edadMax') || 75

      if (edad < edadMin) {
        motivos.push(`Edad menor a ${edadMin} años`)
        score -= 50
      } else if (edad > edadMax) {
        motivos.push(`Edad mayor a ${edadMax} años`)
        score -= 50
      } else {
        score += 20
        motivos.push('Edad dentro del rango permitido')
      }
    }

    // Validar ingresos
    const minIngreso = rules.get('minIngreso') || 200000
    if (lead.ingresos) {
      if (lead.ingresos < minIngreso) {
        motivos.push(`Ingresos menores a $${minIngreso.toLocaleString()}`)
        score -= 30
      } else {
        score += 25
        motivos.push('Ingresos suficientes')
      }
    } else {
      motivos.push('Ingresos no declarados')
      score -= 10
    }

    // Validar zona
    const zonasPermitidas = rules.get('zonasPermitidas') || ['CABA', 'GBA', 'Córdoba']
    if (lead.zona) {
      if (zonasPermitidas.includes(lead.zona)) {
        score += 15
        motivos.push('Zona permitida')
      } else {
        motivos.push('Zona no permitida')
        score -= 20
      }
    } else {
      motivos.push('Zona no especificada')
      score -= 5
    }

    // Validar datos completos
    const camposCompletos = [lead.nombre, lead.telefono, lead.email, lead.dni].filter(Boolean).length
    if (camposCompletos >= 3) {
      score += 10
      motivos.push('Datos completos')
    } else {
      motivos.push('Datos incompletos')
      score -= 5
    }

    // Determinar decisión
    let decision: ScoringResult['decision']
    if (score >= 50) {
      decision = 'PREAPROBADO'
    } else if (score >= 0) {
      decision = 'EN_REVISION'
    } else {
      decision = 'RECHAZADO'
    }

    return { score, decision, motivos }
  }

  private calculateAge(dni: string): number {
    // Extraer fecha de nacimiento del DNI (simplificado)
    // En un caso real, usarías una API de RENAPER
    const year = parseInt(dni.substring(0, 2))
    const currentYear = new Date().getFullYear()
    
    // Asumir que si el año es > 50, es del siglo XX
    const birthYear = year > 50 ? 1900 + year : 2000 + year
    
    return currentYear - birthYear
  }
}
