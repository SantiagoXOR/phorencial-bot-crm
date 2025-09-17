'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Users,
  TrendingUp,
  Phone,
  Mail,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  DollarSign,
  Target,
  Download,
  Plus
} from 'lucide-react'
import Link from 'next/link'
import { MetricsCard, FormosaMetricsCard, useFormosaMetrics } from '@/components/dashboard/MetricsCard'
import { FormosaLeadsMetricsCard } from '@/components/dashboard/FormosaMetricsCard'
import { DashboardCharts } from '@/components/dashboard/DashboardCharts'
import { cn } from '@/lib/utils'
import LeadsTrendChart from '@/components/dashboard/LeadsTrendChart'
import LeadsStatusChart from '@/components/dashboard/LeadsStatusChart'

interface DashboardMetrics {
  totalLeads: number
  newLeadsToday: number
  conversionRate: number
  leadsThisWeek: number
  leadsThisMonth: number
  projectedRevenue: number
  leadsByStatus: Record<string, number>
  recentLeads: Array<{
    id: string
    nombre: string
    telefono: string
    email?: string
    estado: string
    origen?: string
    createdAt: string
  }>
  trendData: Array<{
    date: string
    month?: string
    leads: number
    conversions: number
  }>
  leadsByZone?: Array<{
    zona: string
    count: number
    percentage: number
  }>
  revenueData?: Array<{
    month: string
    ingresos: number
    proyectado: number
  }>
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [allLeads, setAllLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Hook de métricas de Formosa (debe estar al inicio)
  const formosaMetrics = useFormosaMetrics({
    totalLeads: metrics?.totalLeads || 0,
    leadsThisMonth: metrics?.leadsThisMonth || 0,
    conversionRate: metrics?.conversionRate || 0,
    projectedRevenue: metrics?.projectedRevenue || 215400000,
    leadsByStatus: metrics?.leadsByStatus || {}
  })

  // Funciones para contadores dinámicos exactos
  const getEstadoCount = (estadoFilter: string) => {
    return allLeads.filter(lead => lead.estado === estadoFilter).length
  }

  // Función para obtener todos los leads para contadores dinámicos
  const fetchAllLeads = async () => {
    try {
      const response = await fetch('/api/leads?limit=1000')
      if (response.ok) {
        const data = await response.json()
        setAllLeads(data.leads || [])
      }
    } catch (error) {
      console.error('Error fetching all leads:', error)
    }
  }

  useEffect(() => {
    fetchAllLeads() // Cargar todos los leads para contadores dinámicos
  }, [])

  useEffect(() => {
    fetchDashboardMetrics()
  }, [])

  const fetchDashboardMetrics = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard/metrics')
      
      if (!response.ok) {
        throw new Error('Error al cargar métricas')
      }
      
      const data = await response.json()
      setMetrics(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <div className="space-y-8 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-48 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-64 mt-2 animate-pulse"></div>
            </div>
            <div className="flex space-x-3">
              <div className="h-9 bg-gray-200 rounded w-24 animate-pulse"></div>
              <div className="h-9 bg-gray-200 rounded w-32 animate-pulse"></div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="formosa-card animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <Card key={i} className="formosa-card animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-gray-100 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <div className="space-y-8 p-6">
          <div>
            <h1 className="text-4xl font-bold gradient-text">Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Resumen de actividad y métricas principales de Formosa
            </p>
          </div>
          <Card className="border-red-200 bg-gradient-to-r from-red-50 to-pink-50 formosa-card">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-red-600">
                <Activity className="w-5 h-5" />
                <span>Error: {error}</span>
              </div>
              <Button
                onClick={fetchDashboardMetrics}
                variant="outline"
                className="mt-4"
              >
                Reintentar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <div className="space-y-8 p-6">
          <div>
            <h1 className="text-4xl font-bold gradient-text">Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Resumen de actividad y métricas principales de Formosa
            </p>
          </div>
          <Card className="formosa-card">
            <CardContent className="pt-6">
              <p className="text-gray-500">No hay datos disponibles</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const getStatusColor = (estado: string) => {
    const colors: Record<string, string> = {
      'NUEVO': 'bg-blue-100 text-blue-800',
      'EN_REVISION': 'bg-yellow-100 text-yellow-800',
      'PREAPROBADO': 'bg-green-100 text-green-800',
      'RECHAZADO': 'bg-red-100 text-red-800',
      'DOC_PENDIENTE': 'bg-orange-100 text-orange-800',
      'DERIVADO': 'bg-purple-100 text-purple-800'
    }
    return colors[estado] || 'bg-gray-100 text-gray-800'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }



  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="space-y-8 p-6">
        {/* Header moderno */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold gradient-text" data-testid="dashboard-title">Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Resumen de actividad y métricas principales de Formosa
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" className="hover-lift">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button asChild className="gradient-primary text-white hover-lift" data-testid="new-lead-button">
              <Link href="/leads/new">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Lead
              </Link>
            </Button>
          </div>
        </div>

        {/* Métricas específicas de Formosa */}
        <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <FormosaLeadsMetricsCard
            totalLeads={allLeads.length}
            newLeads={getEstadoCount('NUEVO')}
            preapproved={getEstadoCount('PREAPROBADO')}
            rejected={getEstadoCount('RECHAZADO')}
            className="mb-6"
          />
        </div>

        {/* Métricas principales con diseño moderno */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in" data-testid="metrics-cards">
          <FormosaMetricsCard
            type="totalLeads"
            value={formosaMetrics.totalLeads.value}
            subtitle={formosaMetrics.totalLeads.subtitle}
            trend={formosaMetrics.totalLeads.trend}
            className="animate-slide-up"
          />

          <FormosaMetricsCard
            type="conversion"
            value={formosaMetrics.conversion.value}
            subtitle={formosaMetrics.conversion.subtitle}
            trend={formosaMetrics.conversion.trend}
            className="animate-slide-up"
          />

          <FormosaMetricsCard
            type="revenue"
            value={formosaMetrics.revenue.value}
            subtitle={formosaMetrics.revenue.subtitle}
            trend={formosaMetrics.revenue.trend}
            className="animate-slide-up"
          />

          <FormosaMetricsCard
            type="preapproved"
            value={formosaMetrics.preapproved.value}
            subtitle={formosaMetrics.preapproved.subtitle}
            trend={formosaMetrics.preapproved.trend}
            className="animate-slide-up"
          />
        </div>

        {/* Gráficos modernos */}
        <div className="animate-fade-in" style={{ animationDelay: '0.4s' }} data-testid="dashboard-charts">
          <DashboardCharts
            metrics={{
              trendData: metrics.trendData.map(item => ({
                month: item.date,
                leads: item.leads,
                conversions: item.conversions
              })),
              leadsByStatus: metrics.leadsByStatus,
              leadsByZone: metrics.leadsByZone,
              revenueData: metrics.revenueData
            }}
          />
        </div>

        {/* Leads recientes con diseño moderno */}
        <Card className="formosa-card animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold">Leads Recientes</CardTitle>
                <CardDescription>
                  Últimos leads ingresados desde Formosa
                </CardDescription>
              </div>
              <Button asChild variant="link" className="text-primary">
                <Link href="/leads">
                  Ver todos →
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.recentLeads.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No hay leads recientes</p>
                </div>
              ) : (
                metrics.recentLeads.map((lead, index) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-gray-50 to-white border border-gray-100 hover-lift transition-all duration-200"
                    style={{ animationDelay: `${0.6 + index * 0.1}s` }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{lead.nombre}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <Phone className="w-3 h-3 mr-1" />
                              {lead.telefono}
                            </span>
                            {lead.email && (
                              <span className="flex items-center">
                                <Mail className="w-3 h-3 mr-1" />
                                {lead.email}
                              </span>
                            )}
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {formatDate(lead.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {lead.origen && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                          {lead.origen}
                        </Badge>
                      )}
                      <Badge className={cn(
                        "text-xs font-medium",
                        lead.estado === 'NUEVO' && 'formosa-badge-nuevo',
                        lead.estado === 'PREAPROBADO' && 'formosa-badge-preaprobado',
                        lead.estado === 'RECHAZADO' && 'formosa-badge-rechazado',
                        lead.estado === 'EN_REVISION' && 'formosa-badge-revision',
                        lead.estado === 'DOC_PENDIENTE' && 'formosa-badge-pendiente',
                        lead.estado === 'DERIVADO' && 'formosa-badge-derivado'
                      )}>
                        {lead.estado.replace('_', ' ')}
                      </Badge>
                      <Button asChild variant="ghost" size="sm" className="hover:bg-blue-50">
                        <Link href={`/leads/${lead.id}`}>
                          Ver
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Gráficos adicionales (mantener compatibilidad) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in" style={{ animationDelay: '0.7s' }}>
          <LeadsTrendChart data={metrics.trendData} loading={loading} />
          <LeadsStatusChart data={metrics.leadsByStatus} loading={loading} />
        </div>
      </div>
    </div>
  )
}
