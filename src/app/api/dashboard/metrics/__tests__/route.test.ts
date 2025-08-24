import { NextRequest } from 'next/server'
import { GET } from '../route'
import { getServerSession } from 'next-auth'

// Mock dependencies
jest.mock('next-auth')

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('/api/dashboard/metrics', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  })

  it('should return dashboard metrics successfully', async () => {
    // Mock session
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-1', role: 'ADMIN' }
    } as any)

    // Mock Supabase response with leads data
    const mockLeads = [
      {
        id: '1',
        nombre: 'Lead 1',
        telefono: '111',
        estado: 'NUEVO',
        origen: 'whatsapp',
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        nombre: 'Lead 2',
        telefono: '222',
        estado: 'PREAPROBADO',
        origen: 'facebook',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Yesterday
      }
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockLeads
    })

    const request = new NextRequest('http://localhost:3000/api/dashboard/metrics')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('totalLeads', 2)
    expect(data).toHaveProperty('newLeadsToday', 1)
    expect(data).toHaveProperty('conversionRate', 50) // 1 preaprobado / 2 total * 100
    expect(data).toHaveProperty('leadsByStatus')
    expect(data).toHaveProperty('recentLeads')
    expect(data).toHaveProperty('trendData')
    
    expect(data.leadsByStatus).toEqual({
      'NUEVO': 1,
      'PREAPROBADO': 1
    })
    
    expect(data.recentLeads).toHaveLength(2)
    expect(Array.isArray(data.trendData)).toBe(true)
    expect(data.trendData).toHaveLength(7) // Last 7 days
  })

  it('should return 401 if not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/dashboard/metrics')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('No autorizado')
  })

  it('should return fallback metrics on Supabase error', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-1', role: 'ADMIN' }
    } as any)

    // Mock Supabase error
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const request = new NextRequest('http://localhost:3000/api/dashboard/metrics')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({
      totalLeads: 0,
      newLeadsToday: 0,
      conversionRate: 0,
      leadsThisWeek: 0,
      leadsThisMonth: 0,
      leadsByStatus: {
        'NUEVO': 0,
        'EN_REVISION': 0,
        'PREAPROBADO': 0,
        'RECHAZADO': 0,
        'DOC_PENDIENTE': 0,
        'DERIVADO': 0
      },
      recentLeads: [],
      trendData: []
    })
  })

  it('should calculate metrics correctly for different time periods', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-1', role: 'ADMIN' }
    } as any)

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const lastWeek = new Date(today.getTime() - 8 * 24 * 60 * 60 * 1000)
    const lastMonth = new Date(today.getTime() - 35 * 24 * 60 * 60 * 1000)

    const mockLeads = [
      { id: '1', estado: 'NUEVO', createdAt: now.toISOString() }, // Today
      { id: '2', estado: 'PREAPROBADO', createdAt: today.toISOString() }, // Today
      { id: '3', estado: 'NUEVO', createdAt: yesterday.toISOString() }, // Yesterday (this week)
      { id: '4', estado: 'RECHAZADO', createdAt: lastWeek.toISOString() }, // Last week (not this week)
      { id: '5', estado: 'NUEVO', createdAt: lastMonth.toISOString() } // Last month (not this month)
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockLeads
    })

    const request = new NextRequest('http://localhost:3000/api/dashboard/metrics')

    const response = await GET(request)
    const data = await response.json()

    expect(data.totalLeads).toBe(5)
    expect(data.newLeadsToday).toBe(2) // Only leads from today
    expect(data.leadsThisWeek).toBe(3) // Today + yesterday
    expect(data.leadsThisMonth).toBe(4) // All except last month
    expect(data.conversionRate).toBe(20) // 1 preaprobado / 5 total * 100
  })

  it('should generate trend data for last 7 days', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-1', role: 'ADMIN' }
    } as any)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const mockLeads = [
      {
        id: '1',
        estado: 'NUEVO',
        createdAt: today.toISOString()
      },
      {
        id: '2',
        estado: 'PREAPROBADO',
        createdAt: today.toISOString()
      },
      {
        id: '3',
        estado: 'NUEVO',
        createdAt: new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString()
      }
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockLeads
    })

    const request = new NextRequest('http://localhost:3000/api/dashboard/metrics')

    const response = await GET(request)
    const data = await response.json()

    expect(data.trendData).toHaveLength(7)
    
    // Check today's data
    const todayData = data.trendData[6] // Last item should be today
    expect(todayData.leads).toBe(2)
    expect(todayData.conversions).toBe(1)
    
    // Check yesterday's data
    const yesterdayData = data.trendData[5]
    expect(yesterdayData.leads).toBe(1)
    expect(yesterdayData.conversions).toBe(0)
  })
})
