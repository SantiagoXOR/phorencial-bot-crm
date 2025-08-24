// Mock dependencies first
jest.mock('next-auth')
jest.mock('@/server/services/supabase-lead-service', () => ({
  supabaseLeadService: {
    createLead: jest.fn(),
    getLeads: jest.fn()
  }
}))
jest.mock('@/lib/rbac', () => ({
  checkPermission: jest.fn()
}))

import { NextRequest } from 'next/server'
import { POST, GET } from '../route'
import { getServerSession } from 'next-auth'
import { supabaseLeadService } from '@/server/services/supabase-lead-service'

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockSupabaseLeadService = supabaseLeadService as jest.Mocked<typeof supabaseLeadService>

describe('/api/leads', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/leads', () => {
    it('should create a lead successfully', async () => {
      // Mock session
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' }
      } as any)

      // Mock lead creation
      const mockLead = {
        id: 'lead-1',
        nombre: 'Test Lead',
        telefono: '1234567890',
        estado: 'NUEVO'
      }
      mockSupabaseLeadService.createLead.mockResolvedValue(mockLead)

      // Create request
      const request = new NextRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        body: JSON.stringify({
          nombre: 'Test Lead',
          telefono: '1234567890',
          email: 'test@example.com'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toEqual({
        id: 'lead-1',
        estado: 'NUEVO',
        isUpdate: false
      })
      expect(mockSupabaseLeadService.createLead).toHaveBeenCalledWith({
        nombre: 'Test Lead',
        telefono: '1234567890',
        email: 'test@example.com'
      })
    })

    it('should return 401 if not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        body: JSON.stringify({
          nombre: 'Test Lead',
          telefono: '1234567890'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 400 for invalid data', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' }
      } as any)

      const request = new NextRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        body: JSON.stringify({
          // Missing required fields
          email: 'invalid-email'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid data')
      expect(data.details).toBeDefined()
    })

    it('should handle service errors', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' }
      } as any)

      mockSupabaseLeadService.createLead.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        body: JSON.stringify({
          nombre: 'Test Lead',
          telefono: '1234567890'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })

  describe('GET /api/leads', () => {
    it('should fetch leads successfully', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' }
      } as any)

      const mockLeads = [
        { id: '1', nombre: 'Lead 1', telefono: '111' },
        { id: '2', nombre: 'Lead 2', telefono: '222' }
      ]

      mockSupabaseLeadService.getLeads.mockResolvedValue({
        leads: mockLeads,
        total: 2
      })

      const request = new NextRequest('http://localhost:3000/api/leads?page=1&limit=10')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        leads: mockLeads,
        total: 2,
        page: 1,
        limit: 10
      })
    })

    it('should handle query parameters correctly', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' }
      } as any)

      mockSupabaseLeadService.getLeads.mockResolvedValue({
        leads: [],
        total: 0
      })

      const request = new NextRequest('http://localhost:3000/api/leads?estado=NUEVO&origen=whatsapp&q=test&page=2&limit=5')

      await GET(request)

      expect(mockSupabaseLeadService.getLeads).toHaveBeenCalledWith({
        estado: 'NUEVO',
        origen: 'whatsapp',
        search: 'test',
        limit: 5,
        offset: 5 // (page - 1) * limit = (2 - 1) * 5
      })
    })

    it('should use default pagination values', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' }
      } as any)

      mockSupabaseLeadService.getLeads.mockResolvedValue({
        leads: [],
        total: 0
      })

      const request = new NextRequest('http://localhost:3000/api/leads')

      await GET(request)

      expect(mockSupabaseLeadService.getLeads).toHaveBeenCalledWith({
        estado: undefined,
        origen: undefined,
        search: undefined,
        limit: 10,
        offset: 0
      })
    })

    it('should return 401 if not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/leads')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })
})
