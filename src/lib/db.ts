/**
 * Adaptador de base de datos para Supabase
 * Reemplaza Prisma para operaciones de base de datos
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

class SupabaseClient {
  private baseUrl: string
  private serviceKey: string

  constructor() {
    // Usar valores por defecto si las variables de entorno no están disponibles
    this.baseUrl = SUPABASE_URL || 'https://aozysydpwvkkdvhfsvsu.supabase.co'
    this.serviceKey = SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvenlzeWRwd3Zra2R2aGZzdnN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNDk4NCwiZXhwIjoyMDcxMzkwOTg0fQ.S0VZQD26wTUcoTeo9ZSqoO0JbQq1zvP_uT0LZsXmCPw'
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}/rest/v1${endpoint}`

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.serviceKey,
        'Authorization': `Bearer ${this.serviceKey}`,
        ...options.headers
      },
      ...options
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Supabase error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  // Operaciones para User
  async findUserByEmail(email: string) {
    const users = await this.request(`/User?email=eq.${email}&select=*`)
    if (!users[0]) return null

    // Mapear campos de Supabase a nuestro esquema
    return {
      id: users[0].id,
      email: users[0].email,
      nombre: users[0].name,
      hash: users[0].password,
      rol: users[0].role,
      createdAt: users[0].createdAt
    }
  }



  async countUsers() {
    const response = await this.request('/User?select=count', {
      headers: { 'Prefer': 'count=exact' }
    })
    return response[0]?.count || 0
  }

  // Operaciones para Lead
  async createLead(leadData: any) {
    const leads = await this.request('/Lead', {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify(leadData)
    })
    return leads[0]
  }

  async findLeadById(id: string) {
    const leads = await this.request(`/Lead?id=eq.${id}&select=*`)
    if (!leads[0]) return null

    // Obtener eventos del lead
    const events = await this.request(`/Event?leadId=eq.${id}&select=*&order=createdAt.desc`)

    return {
      ...leads[0],
      events: events.map((event: any) => ({
        ...event,
        payload: event.payload ? JSON.parse(event.payload) : null,
      }))
    }
  }

  async findLeadByPhoneOrDni(telefono: string, dni?: string) {
    let query = `telefono=eq.${telefono}`
    if (dni) {
      query = `or=(telefono.eq.${telefono},dni.eq.${dni})`
    }

    const leads = await this.request(`/Lead?${query}&select=*&limit=1`)
    return leads[0] || null
  }

  async updateLead(id: string, leadData: any) {
    const leads = await this.request(`/Lead?id=eq.${id}`, {
      method: 'PATCH',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify(leadData)
    })
    return leads[0]
  }

  async deleteLead(id: string) {
    await this.request(`/Lead?id=eq.${id}`, {
      method: 'DELETE'
    })
  }

  async findManyLeads(query: any = {}) {
    const {
      estado,
      origen,
      q,
      from,
      to,
      page = 1,
      limit = 10,
    } = query

    let endpoint = '/Lead?select=*'
    const conditions: string[] = []

    if (estado) {
      conditions.push(`estado=eq.${estado}`)
    }

    if (origen) {
      conditions.push(`origen=eq.${origen}`)
    }

    if (q) {
      conditions.push(`or=(nombre.ilike.*${q}*,telefono.ilike.*${q}*,email.ilike.*${q}*,dni.ilike.*${q}*)`)
    }

    if (from) {
      conditions.push(`createdAt=gte.${from}`)
    }

    if (to) {
      conditions.push(`createdAt=lte.${to}`)
    }

    if (conditions.length > 0) {
      endpoint += '&' + conditions.join('&')
    }

    endpoint += `&order=createdAt.desc&limit=${limit}&offset=${(page - 1) * limit}`

    const leads = await this.request(endpoint)

    // Obtener el total para paginación
    let countEndpoint = '/Lead?select=count'
    if (conditions.length > 0) {
      countEndpoint += '&' + conditions.join('&')
    }

    const countResponse = await this.request(countEndpoint, {
      headers: { 'Prefer': 'count=exact' }
    })
    const total = countResponse[0]?.count || 0

    return {
      leads,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  // Operaciones para Event
  async createEvent(eventData: any) {
    const events = await this.request('/Event', {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify({
        ...eventData,
        payload: eventData.payload ? JSON.stringify(eventData.payload) : null
      })
    })
    return events[0]
  }

  async findEventsByLeadId(leadId: string) {
    const events = await this.request(`/Event?leadId=eq.${leadId}&select=*&order=createdAt.desc`)
    return events.map((event: any) => ({
      ...event,
      payload: event.payload ? JSON.parse(event.payload) : null,
    }))
  }

  async findEventsByType(tipo: string, limit = 100) {
    const events = await this.request(`/Event?tipo=eq.${tipo}&select=*&order=createdAt.desc&limit=${limit}`)
    return events.map((event: any) => ({
      ...event,
      payload: event.payload ? JSON.parse(event.payload) : null,
    }))
  }

  // Operaciones para Rule
  async findAllRules() {
    const rules = await this.request('/Rule?select=*&order=key.asc')
    return rules.map((rule: any) => ({
      ...rule,
      value: this.parseRuleValue(rule.value),
    }))
  }

  async findRuleByKey(key: string) {
    const rules = await this.request(`/Rule?key=eq.${key}&select=*`)
    if (!rules[0]) return null

    return {
      ...rules[0],
      value: this.parseRuleValue(rules[0].value),
    }
  }

  private parseRuleValue(value: any) {
    // Si ya es un objeto/array, devolverlo tal como está
    if (typeof value === 'object' && value !== null) {
      return value
    }

    // Si es string, intentar parsearlo como JSON
    if (typeof value === 'string') {
      try {
        return JSON.parse(value)
      } catch {
        // Si no es JSON válido, devolver el string tal como está
        return value
      }
    }

    return value
  }

  async upsertRule(key: string, value: any) {
    // Primero intentar actualizar
    const existing = await this.findRuleByKey(key)

    if (existing) {
      const rules = await this.request(`/Rule?key=eq.${key}`, {
        method: 'PATCH',
        headers: { 'Prefer': 'return=representation' },
        body: JSON.stringify({ value: JSON.stringify(value) })
      })
      return {
        ...rules[0],
        value: JSON.parse(rules[0].value),
      }
    } else {
      const rules = await this.request('/Rule', {
        method: 'POST',
        headers: { 'Prefer': 'return=representation' },
        body: JSON.stringify({ key, value: JSON.stringify(value) })
      })
      return {
        ...rules[0],
        value: JSON.parse(rules[0].value),
      }
    }
  }

  async deleteRule(key: string) {
    return this.request(`/Rule?key=eq.${key}`, {
      method: 'DELETE'
    })
  }

  // Nuevas funciones para el sistema de usuarios mejorado
  async findUserByEmailNew(email: string) {
    const users = await this.request(`/users?email=eq.${email}&limit=1`)
    return users[0] || null
  }

  async updateUserLastLogin(userId: string) {
    await this.request(`/users?id=eq.${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        last_login: new Date().toISOString()
      })
    })
  }

  async getUserPermissions(userId: string) {
    // Obtener permisos por rol del usuario
    const user = await this.request(`/users?id=eq.${userId}&select=role`)
    if (!user[0]) return { rolePermissions: [], userPermissions: [] }

    const rolePermissions = await this.request(`
      /role_permissions?role=eq.${user[0].role}&select=permissions(name,resource,action)
    `)

    // Obtener permisos específicos del usuario
    const userPermissions = await this.request(`
      /user_permissions?user_id=eq.${userId}&granted=eq.true&select=permissions(name,resource,action)
    `)

    return {
      rolePermissions: rolePermissions || [],
      userPermissions: userPermissions || []
    }
  }

  async checkUserPermission(userId: string, resource: string, action: string) {
    try {
      const result = await this.request(`
        /rpc/user_has_permission?p_user_id=${userId}&p_resource=${resource}&p_action=${action}
      `)
      return result || false
    } catch (error) {
      console.error('Error checking permission:', error)
      return false
    }
  }

  async createUser(userData: any) {
    const users = await this.request('/users', {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify(userData)
    })
    return users[0]
  }

  async updateUser(userId: string, userData: any) {
    const users = await this.request(`/users?id=eq.${userId}`, {
      method: 'PATCH',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify(userData)
    })
    return users[0]
  }

  async findAllUsers() {
    return this.request('/users?select=*&order=created_at.desc')
  }

  async findUserById(userId: string) {
    const users = await this.request(`/users?id=eq.${userId}&limit=1`)
    return users[0] || null
  }
}

// Crear instancia singleton
const globalForSupabase = globalThis as unknown as {
  supabase: SupabaseClient | undefined
}

export const supabase =
  globalForSupabase.supabase ??
  new SupabaseClient()

if (process.env.NODE_ENV !== 'production') globalForSupabase.supabase = supabase

// Mantener compatibilidad con código existente que usa prisma
export const prisma = supabase as any
