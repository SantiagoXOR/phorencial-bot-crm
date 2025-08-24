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
      let query = 'Lead?select=*'
      const conditions: string[] = []

      // Filtros
      if (filters.estado) {
        conditions.push(`estado.eq.${filters.estado}`)
        logger.info('Adding estado filter', { estado: filters.estado })
      }

      if (filters.origen) {
        conditions.push(`origen.eq.${filters.origen}`)
        logger.info('Adding origen filter', { origen: filters.origen })
      }

      if (filters.search) {
        conditions.push(`or=(nombre.ilike.*${filters.search}*,telefono.ilike.*${filters.search}*,email.ilike.*${filters.search}*)`)
        logger.info('Adding search filter', { search: filters.search })
      }

      if (conditions.length > 0) {
        query += `&${conditions.join('&')}`
      }

      // Ordenar por fecha de creación (más recientes primero)
      query += '&order=createdAt.desc'

      // Paginación
      if (filters.limit) {
        query += `&limit=${filters.limit}`
      }
      if (filters.offset) {
        query += `&offset=${filters.offset}`
      }

      logger.info('Generated Supabase query', { query, filters })

      const response = await this.makeRequest(query)
      const leads = await response.json()

      logger.info('Supabase response received', {
        leadsCount: leads.length,
        firstLeadEstado: leads[0]?.estado,
        allEstados: leads.map((l: any) => l.estado)
      })

      // Obtener total count
      const countResponse = await this.makeRequest('Lead?select=count', {
        headers: {
          'Prefer': 'count=exact'
        }
      })
      const countData = await countResponse.json()
      const total = Array.isArray(countData) && countData[0]?.count ? countData[0].count : leads.length

      return { leads, total }

    } catch (error: any) {
      logger.error('Error fetching leads', { error: error.message })
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
