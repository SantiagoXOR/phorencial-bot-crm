"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  FileText, 
  Upload, 
  Download, 
  Eye, 
  Trash2, 
  Search,
  Filter,
  Plus,
  File,
  Image,
  FileSpreadsheet,
  Calendar,
  User
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Document {
  id: string
  leadId: string
  leadName: string
  fileName: string
  fileType: string
  fileSize: number
  category: "DNI" | "COMPROBANTE_INGRESOS" | "RECIBO_SUELDO" | "OTROS"
  uploadedAt: string
  uploadedBy: string
  status: "PENDIENTE" | "APROBADO" | "RECHAZADO"
  url?: string
}

const DOCUMENT_CATEGORIES = {
  DNI: { label: "DNI", icon: User, color: "blue" },
  COMPROBANTE_INGRESOS: { label: "Comprobante Ingresos", icon: FileSpreadsheet, color: "green" },
  RECIBO_SUELDO: { label: "Recibo de Sueldo", icon: FileText, color: "yellow" },
  OTROS: { label: "Otros", icon: File, color: "gray" }
}

const FILE_TYPE_ICONS = {
  "application/pdf": FileText,
  "image/jpeg": Image,
  "image/png": Image,
  "image/jpg": Image,
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": FileSpreadsheet,
  "application/vnd.ms-excel": FileSpreadsheet,
  default: File
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string>("")

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      // Simular datos para demostración
      const mockDocuments: Document[] = [
        {
          id: "doc_001",
          leadId: "lead_001",
          leadName: "Karen Vanina Paliza",
          fileName: "dni_karen_paliza.pdf",
          fileType: "application/pdf",
          fileSize: 2048576,
          category: "DNI",
          uploadedAt: "2024-01-15T10:30:00Z",
          uploadedBy: "admin@phorencial.com",
          status: "APROBADO"
        },
        {
          id: "doc_002",
          leadId: "lead_002",
          leadName: "Jorge Lino Bazan",
          fileName: "recibo_sueldo_jorge.jpg",
          fileType: "image/jpeg",
          fileSize: 1536000,
          category: "RECIBO_SUELDO",
          uploadedAt: "2024-01-14T09:15:00Z",
          uploadedBy: "admin@phorencial.com",
          status: "PENDIENTE"
        },
        {
          id: "doc_003",
          leadId: "lead_003",
          leadName: "Barrios Norma Beatriz",
          fileName: "comprobante_ingresos.xlsx",
          fileType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          fileSize: 512000,
          category: "COMPROBANTE_INGRESOS",
          uploadedAt: "2024-01-16T16:45:00Z",
          uploadedBy: "admin@phorencial.com",
          status: "RECHAZADO"
        }
      ]
      
      setDocuments(mockDocuments)
    } catch (error) {
      console.error("Error fetching documents:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.leadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.fileName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !categoryFilter || doc.category === categoryFilter
    const matchesStatus = !statusFilter || doc.status === statusFilter
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString))
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      PENDIENTE: "formosa-badge-pendiente",
      APROBADO: "formosa-badge-preaprobado", 
      RECHAZADO: "formosa-badge-rechazado"
    }
    return variants[status as keyof typeof variants] || "formosa-badge-revision"
  }

  const getFileIcon = (fileType: string) => {
    const IconComponent = FILE_TYPE_ICONS[fileType as keyof typeof FILE_TYPE_ICONS] || FILE_TYPE_ICONS.default
    return IconComponent
  }

  const getCategoryInfo = (category: string) => {
    return DOCUMENT_CATEGORIES[category as keyof typeof DOCUMENT_CATEGORIES] || DOCUMENT_CATEGORIES.OTROS
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <div className="space-y-8 p-6">
          <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-48 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="formosa-card animate-pulse">
                <CardContent className="p-6">
                  <div className="h-32 bg-gray-100 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="space-y-8 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold gradient-text">Documentos</h1>
            <p className="text-muted-foreground mt-2">
              Gestión de documentos de leads de Formosa
            </p>
          </div>
          <Button className="gradient-primary text-white hover-lift">
            <Plus className="h-4 w-4 mr-2" />
            Subir Documento
          </Button>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <Card className="formosa-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{documents.length}</p>
                  <p className="text-sm text-muted-foreground">Total Documentos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="formosa-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {documents.filter(d => d.status === "PENDIENTE").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Pendientes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="formosa-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
                  <Eye className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {documents.filter(d => d.status === "APROBADO").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Aprobados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="formosa-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 rounded-lg flex items-center justify-center">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {documents.filter(d => d.status === "RECHAZADO").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Rechazados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="formosa-card">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar documentos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Todas las categorías</option>
                {Object.entries(DOCUMENT_CATEGORIES).map(([key, category]) => (
                  <option key={key} value={key}>
                    {category.label}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Todos los estados</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="APROBADO">Aprobado</option>
                <option value="RECHAZADO">Rechazado</option>
              </select>

              <div className="flex items-center space-x-2">
                <Badge variant="outline">
                  {filteredDocuments.length} documentos
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de documentos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((doc, index) => {
            const categoryInfo = getCategoryInfo(doc.category)
            const FileIcon = getFileIcon(doc.fileType)
            
            return (
              <Card 
                key={doc.id} 
                className="formosa-card hover-lift animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge className={cn("text-xs", getStatusBadge(doc.status))}>
                      {doc.status}
                    </Badge>
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Icono y tipo de archivo */}
                  <div className="flex items-center justify-center">
                    <div className={cn(
                      "w-16 h-16 rounded-lg flex items-center justify-center",
                      `bg-gradient-to-br from-${categoryInfo.color}-100 to-${categoryInfo.color}-200`
                    )}>
                      <FileIcon className={cn("h-8 w-8", `text-${categoryInfo.color}-600`)} />
                    </div>
                  </div>

                  {/* Información del documento */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm truncate" title={doc.fileName}>
                      {doc.fileName}
                    </h3>
                    
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p><strong>Lead:</strong> {doc.leadName}</p>
                      <p><strong>Categoría:</strong> {categoryInfo.label}</p>
                      <p><strong>Tamaño:</strong> {formatFileSize(doc.fileSize)}</p>
                      <p><strong>Subido:</strong> {formatDate(doc.uploadedAt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredDocuments.length === 0 && (
          <Card className="formosa-card">
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No se encontraron documentos
              </h3>
              <p className="text-gray-500 mb-4">
                No hay documentos que coincidan con los filtros aplicados
              </p>
              <Button className="gradient-primary text-white">
                <Plus className="h-4 w-4 mr-2" />
                Subir primer documento
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
