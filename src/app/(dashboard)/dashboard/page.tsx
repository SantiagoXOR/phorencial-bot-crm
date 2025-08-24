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
  Activity
} from 'lucide-react'
import Link from 'next/link'
import LeadsTrendChart from '@/components/dashboard/LeadsTrendChart'
import LeadsStatusChart from '@/components/dashboard/LeadsStatusChart'

interface DashboardMetrics {
  totalLeads: number
  newLeadsToday: number
  conversionRate: number
  leadsThisWeek: number
  leadsThisMonth: number
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
    leads: number
    conversions: number
  }>
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Card className="border-red-200 bg-red-50">
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
    )
  }

  if (!metrics) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-500">No hay datos disponibles</p>
          </CardContent>
        </Card>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button asChild>
          <Link href="/leads/new">
            <Users className="w-4 h-4 mr-2" />
            Nuevo Lead
          </Link>
        </Button>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalLeads}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.leadsThisMonth} este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nuevos Hoy</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.newLeadsToday}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.leadsThisWeek} esta semana
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa Conversión</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Preaprobados/Total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Revisión</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.leadsByStatus['EN_REVISION'] || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Requieren atención
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Leads recientes */}
      <Card>
        <CardHeader>
          <CardTitle>Leads Recientes</CardTitle>
          <CardDescription>
            Últimos leads ingresados al sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.recentLeads.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No hay leads recientes
              </p>
            ) : (
              metrics.recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="font-medium">{lead.nombre}</p>
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
                      <Badge variant="outline" className="text-xs">
                        {lead.origen}
                      </Badge>
                    )}
                    <Badge className={getStatusColor(lead.estado)}>
                      {lead.estado.replace('_', ' ')}
                    </Badge>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/leads/${lead.id}`}>
                        Ver
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          {metrics.recentLeads.length > 0 && (
            <div className="mt-4 text-center">
              <Button asChild variant="outline">
                <Link href="/leads">
                  Ver todos los leads
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LeadsTrendChart data={metrics.trendData} loading={loading} />
        <LeadsStatusChart data={metrics.leadsByStatus} loading={loading} />
      </div>
    </div>
  )
}
