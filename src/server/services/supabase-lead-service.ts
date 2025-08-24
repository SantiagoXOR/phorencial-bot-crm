import { logger } from '@/lib/logger'

interface Lead {
  id?: string
  nombre: string
  telefono: string
  email?: string | null
  dni?: string | null
  ingresos?: number | null
  zona?: string | null
  producto?: string | null
  monto?: number | null
  origen?: string | null
  utmSource?: string | null
  estado?: string
  agencia?: string | null
  notas?: string | null
  createdAt?: string
  updatedAt?: string
}

export class SupabaseLeadService {
  private supabaseUrl: string
  private serviceRoleKey: string

  constructor() {
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    this.serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    
    if (!this.supabaseUrl || !this.serviceRoleKey) {
      throw new Error('Supabase credentials not configured')
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.supabaseUrl}/rest/v1/${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'apikey': this.serviceRoleKey,
        'Authorization': `Bearer ${this.serviceRoleKey}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error('Supabase API error', {
        endpoint,
        status: response.status,
        error: errorText
      })
      throw new Error(`Supabase API error: ${response.status} - ${errorText}`)
    }

    return response
  }

  async createLead(leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lead> {
    try {
      // Limpiar datos nulos/undefined
      const cleanData = Object.fromEntries(
        Object.entries(leadData).filter(([_, value]) => value !== null && value !== undefined && value !== '')
      )

      // Agregar timestamps
      const dataWithTimestamps = {
        ...cleanData,
        estado: cleanData.estado || 'NUEVO',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      logger.info('Creating lead with data', { data: dataWithTimestamps })

      const response = await this.makeRequest('Lead', {
        method: 'POST',
        headers: {
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(dataWithTimestamps)
      })

      const result = await response.json()
      const lead = Array.isArray(result) ? result[0] : result

      logger.info('Lead created successfully', { leadId: lead.id })
      return lead

    } catch (error: any) {
      logger.error('Error creating lead', { error: error.message })
      throw error
    }
  }

  async getLeads(filters: {
    estado?: string
    origen?: string
    search?: string
    limit?: number
    offset?: number
  } = {}): Promise<{ leads: Lead[], total: number }> {
    try {
      logger.info('SupabaseLeadService.getLeads called', { filters })

      // SOLUCIÓN ALTERNATIVA: Obtener todos los leads y filtrar en memoria
      // Esto es temporal hasta identificar el problema con la consulta SQL
      const allLeadsResponse = await this.makeRequest('Lead?select=*&order=createdAt.desc')
      let allLeads = await allLeadsResponse.json()

      logger.info('All leads fetched from database', {
        totalLeads: allLeads.length,
        uniqueEstados: [...new Set(allLeads.map((l: any) => l.estado))],
        sampleLead: allLeads[0]
      })

      // Aplicar filtros en memoria
      let filteredLeads = allLeads

      if (filters.estado) {
        const beforeFilter = filteredLeads.length
        filteredLeads = filteredLeads.filter((lead: any) => lead.estado === filters.estado)
        logger.info('Applied estado filter', {
          filterValue: filters.estado,
          beforeFilter,
          afterFilter: filteredLeads.length,
          matchingLeads: filteredLeads.map((l: any) => ({ nombre: l.nombre, estado: l.estado }))
        })
      }

      if (filters.origen) {
        const beforeFilter = filteredLeads.length
        filteredLeads = filteredLeads.filter((lead: any) => lead.origen === filters.origen)
        logger.info('Applied origen filter', {
          filterValue: filters.origen,
          beforeFilter,
          afterFilter: filteredLeads.length
        })
      }

      if (filters.search) {
        const beforeFilter = filteredLeads.length
        const searchLower = filters.search.toLowerCase()
        filteredLeads = filteredLeads.filter((lead: any) =>
          lead.nombre?.toLowerCase().includes(searchLower) ||
          lead.telefono?.toLowerCase().includes(searchLower) ||
          lead.email?.toLowerCase().includes(searchLower)
        )
        logger.info('Applied search filter', {
          filterValue: filters.search,
          beforeFilter,
          afterFilter: filteredLeads.length
        })
      }

      const total = filteredLeads.length

      // Aplicar paginación
      const offset = filters.offset || 0
      const limit = filters.limit || 10
      const paginatedLeads = filteredLeads.slice(offset, offset + limit)

      logger.info('Final result after filtering and pagination', {
        totalFiltered: total,
        paginatedCount: paginatedLeads.length,
        offset,
        limit
      })

      return { leads: paginatedLeads, total }

    } catch (error: any) {
      logger.error('Error fetching leads', { error: error.message, stack: error.stack })
      throw error
    }
  }

  async getLeadById(id: string): Promise<Lead | null> {
    try {
      const response = await this.makeRequest(`Lead?id=eq.${id}&select=*`)
      const result = await response.json()
      
      return Array.isArray(result) && result.length > 0 ? result[0] : null

    } catch (error: any) {
      logger.error('Error fetching lead by ID', { error: error.message, leadId: id })
      throw error
    }
  }

  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
    try {
      // Limpiar datos y agregar timestamp de actualización
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== null && value !== undefined && value !== '')
      )

      const dataWithTimestamp = {
        ...cleanUpdates,
        updatedAt: new Date().toISOString()
      }

      const response = await this.makeRequest(`Lead?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(dataWithTimestamp)
      })

      const result = await response.json()
      const lead = Array.isArray(result) ? result[0] : result

      logger.info('Lead updated successfully', { leadId: id })
      return lead

    } catch (error: any) {
      logger.error('Error updating lead', { error: error.message, leadId: id })
      throw error
    }
  }

  async deleteLead(id: string): Promise<void> {
    try {
      await this.makeRequest(`Lead?id=eq.${id}`, {
        method: 'DELETE'
      })

      logger.info('Lead deleted successfully', { leadId: id })

    } catch (error: any) {
      logger.error('Error deleting lead', { error: error.message, leadId: id })
      throw error
    }
  }

  async findLeadByPhone(telefono: string): Promise<Lead | null> {
    try {
      const response = await this.makeRequest(`Lead?telefono=eq.${telefono}&select=*`)
      const result = await response.json()
      
      return Array.isArray(result) && result.length > 0 ? result[0] : null

    } catch (error: any) {
      logger.error('Error finding lead by phone', { error: error.message, telefono })
      throw error
    }
  }
}

// Instancia singleton
export const supabaseLeadService = new SupabaseLeadService()
