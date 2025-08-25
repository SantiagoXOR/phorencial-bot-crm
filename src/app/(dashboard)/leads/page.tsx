'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatCurrency, cn } from '@/lib/utils'
import { Search, Plus, Filter, Download, Users, TrendingUp } from 'lucide-react'

interface Lead {
  id: string
  nombre: string
  telefono: string
  email?: string
  estado: string
  origen?: string
  ingresos?: number
  zona?: string
  createdAt: string
}

interface LeadsResponse {
  leads: Lead[]
  total: number
  page: number
  totalPages: number
}

export default function LeadsPage() {
  const { data: session } = useSession()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [estado, setEstado] = useState('')
  const [origen, setOrigen] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalLeads, setTotalLeads] = useState(0)

  const fetchLeads = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { q: search }),
        ...(estado && { estado }),
        ...(origen && { origen }),
      })

      const response = await fetch(`/api/leads?${params}`)
      if (response.ok) {
        const data: LeadsResponse = await response.json()
        setLeads(data.leads)
        setTotalPages(data.totalPages)
        setTotalLeads(data.total)
      }
    } catch (error) {
      console.error('Error fetching leads:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()
  }, [page, search, estado, origen])

  const getEstadoBadge = (estado: string) => {
    const badgeClasses = {
      NUEVO: 'formosa-badge-nuevo',
      EN_REVISION: 'formosa-badge-revision',
      PREAPROBADO: 'formosa-badge-preaprobado',
      RECHAZADO: 'formosa-badge-rechazado',
      DOC_PENDIENTE: 'formosa-badge-pendiente',
      DERIVADO: 'formosa-badge-derivado',
    }

    return (
      <Badge className={cn(
        "text-xs font-medium",
        badgeClasses[estado as keyof typeof badgeClasses] || 'formosa-badge-revision'
      )}>
        {estado.replace('_', ' ')}
      </Badge>
    )
  }

  const exportCSV = async () => {
    try {
      const params = new URLSearchParams({
        ...(search && { q: search }),
        ...(estado && { estado }),
        ...(origen && { origen }),
        limit: '1000', // Export más leads
      })

      const response = await fetch(`/api/leads?${params}`)
      if (response.ok) {
        const data: LeadsResponse = await response.json()
        
        // Crear CSV
        const headers = ['Nombre', 'Teléfono', 'Email', 'Estado', 'Origen', 'Ingresos', 'Zona', 'Fecha']
        const csvContent = [
          headers.join(','),
          ...data.leads.map(lead => [
            lead.nombre,
            lead.telefono,
            lead.email || '',
            lead.estado,
            lead.origen || '',
            lead.ingresos || '',
            lead.zona || '',
            new Date(lead.createdAt).toLocaleDateString('es-AR')
          ].join(','))
        ].join('\n')

        // Descargar archivo
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error exporting CSV:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="space-y-8 p-6">
        {/* Header moderno */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold gradient-text">Gestión de Leads</h1>
            <p className="text-muted-foreground mt-2">
              Administración de leads de Formosa - Total: {totalLeads}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button onClick={exportCSV} variant="outline" className="hover-lift">
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
            <Button asChild className="gradient-primary text-white hover-lift">
              <Link href="/leads/new">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Lead
              </Link>
            </Button>
          </div>
        </div>

        {/* Métricas rápidas */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <Card className="formosa-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalLeads}</p>
                  <p className="text-sm text-muted-foreground">Total Leads</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="formosa-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {leads.filter(l => l.estado === 'PREAPROBADO').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Preaprobados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="formosa-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg flex items-center justify-center">
                  <Filter className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {leads.filter(l => l.estado === 'EN_REVISION').length}
                  </p>
                  <p className="text-sm text-muted-foreground">En Revisión</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="formosa-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
                  <Plus className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {leads.filter(l => l.estado === 'NUEVO').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Nuevos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros mejorados */}
        <Card className="formosa-card">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar leads..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Todos los estados</option>
              <option value="NUEVO">Nuevo</option>
              <option value="EN_REVISION">En Revisión</option>
              <option value="PREAPROBADO">Preaprobado</option>
              <option value="RECHAZADO">Rechazado</option>
              <option value="DOC_PENDIENTE">Doc. Pendiente</option>
              <option value="DERIVADO">Derivado</option>
            </select>
            <select
              value={origen}
              onChange={(e) => setOrigen(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Todos los orígenes</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
              <option value="web">Web</option>
              <option value="ads">Ads</option>
            </select>
          </div>
        </CardContent>
      </Card>

        {/* Lista de leads mejorada */}
        <Card className="formosa-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold">
                  Leads de Formosa ({totalLeads})
                </CardTitle>
                {(estado || origen || search) && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Filtrado{estado && ` por estado: ${estado}`}{origen && ` por origen: ${origen}`}{search && ` por búsqueda: "${search}"`}
                  </p>
                )}
              </div>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                Página {page} de {totalPages}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="formosa-card animate-pulse">
                    <div className="p-4">
                      <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : leads.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  No se encontraron leads
                </h3>
                <p className="text-gray-500 mb-4">
                  No hay leads que coincidan con los filtros aplicados
                </p>
                <Button asChild className="gradient-primary text-white">
                  <Link href="/leads/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Crear primer lead
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {leads.map((lead, index) => (
                  <div
                    key={lead.id}
                    className="formosa-card hover-lift p-4 transition-all duration-200 animate-fade-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <Link
                              href={`/leads/${lead.id}`}
                              className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                            >
                              {lead.nombre}
                            </Link>
                            <div className="flex items-center space-x-2 mt-1">
                              {getEstadoBadge(lead.estado)}
                              {lead.origen && (
                                <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700">
                                  {lead.origen}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="ml-13 space-y-1">
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>📞 {lead.telefono}</span>
                            <span>✉️ {lead.email || 'Sin email'}</span>
                            {lead.zona && <span>📍 {lead.zona}</span>}
                          </div>

                          {lead.ingresos && (
                            <div className="text-sm text-green-600 font-medium">
                              💰 {formatCurrency(lead.ingresos)}
                            </div>
                          )}

                          <div className="text-xs text-gray-400">
                            📅 {formatDate(new Date(lead.createdAt))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button asChild variant="ghost" size="sm" className="hover:bg-blue-50">
                          <Link href={`/leads/${lead.id}`}>
                            Ver Detalles
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Paginación moderna */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                <div className="text-sm text-muted-foreground">
                  Mostrando {((page - 1) * 10) + 1} - {Math.min(page * 10, totalLeads)} de {totalLeads} leads
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="hover-lift"
                  >
                    ← Anterior
                  </Button>

                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1
                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPage(pageNum)}
                          className={cn(
                            "w-8 h-8",
                            page === pageNum && "gradient-primary text-white"
                          )}
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="hover-lift"
                  >
                    Siguiente →
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
