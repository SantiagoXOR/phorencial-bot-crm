'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

interface LeadFormData {
  nombre: string
  telefono: string
  email: string
  dni: string
  ingresos: string
  zona: string
  producto: string
  monto: string
  origen: string
  utmSource: string
  estado: string
  agencia: string
  notas: string
}

export default function NewLeadPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<LeadFormData>({
    nombre: '',
    telefono: '',
    email: '',
    dni: '',
    ingresos: '',
    zona: '',
    producto: '',
    monto: '',
    origen: '',
    utmSource: '',
    estado: 'NUEVO',
    agencia: '',
    notas: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validaciones básicas
      if (!formData.nombre.trim()) {
        throw new Error('El nombre es obligatorio')
      }
      if (!formData.telefono.trim()) {
        throw new Error('El teléfono es obligatorio')
      }

      // Preparar datos para envío
      const leadData = {
        ...formData,
        telefono: formData.telefono.replace(/[^\d]/g, ''), // Solo números
        ingresos: formData.ingresos ? parseInt(formData.ingresos) : null,
        monto: formData.monto ? parseInt(formData.monto) : null,
        // Limpiar campos vacíos
        email: formData.email.trim() || null,
        dni: formData.dni.trim() || null,
        zona: formData.zona.trim() || null,
        producto: formData.producto.trim() || null,
        origen: formData.origen.trim() || null,
        utmSource: formData.utmSource.trim() || null,
        agencia: formData.agencia.trim() || null,
        notas: formData.notas.trim() || null
      }

      console.log('Sending lead data:', leadData)

      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(leadData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        throw new Error(errorData.error || 'Error al crear el lead')
      }

      const newLead = await response.json()
      
      // Redirigir al lead creado
      router.push(`/leads/${newLead.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/leads">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Leads
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Nuevo Lead</h1>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Información Personal */}
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>Datos básicos del lead</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  placeholder="Nombre completo"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="telefono">Teléfono *</Label>
                <Input
                  id="telefono"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  placeholder="+54 11 1234-5678"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="email@ejemplo.com"
                />
              </div>
              
              <div>
                <Label htmlFor="dni">DNI</Label>
                <Input
                  id="dni"
                  name="dni"
                  value={formData.dni}
                  onChange={handleInputChange}
                  placeholder="12345678"
                />
              </div>
            </CardContent>
          </Card>

          {/* Información Comercial */}
          <Card>
            <CardHeader>
              <CardTitle>Información Comercial</CardTitle>
              <CardDescription>Datos del negocio y producto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="ingresos">Ingresos Mensuales</Label>
                <Input
                  id="ingresos"
                  name="ingresos"
                  type="number"
                  value={formData.ingresos}
                  onChange={handleInputChange}
                  placeholder="50000"
                />
              </div>
              
              <div>
                <Label htmlFor="zona">Zona</Label>
                <Input
                  id="zona"
                  name="zona"
                  value={formData.zona}
                  onChange={handleInputChange}
                  placeholder="CABA, GBA Norte, etc."
                />
              </div>
              
              <div>
                <Label htmlFor="producto">Producto</Label>
                <Input
                  id="producto"
                  name="producto"
                  value={formData.producto}
                  onChange={handleInputChange}
                  placeholder="Préstamo personal, hipotecario, etc."
                />
              </div>
              
              <div>
                <Label htmlFor="monto">Monto Solicitado</Label>
                <Input
                  id="monto"
                  name="monto"
                  type="number"
                  value={formData.monto}
                  onChange={handleInputChange}
                  placeholder="100000"
                />
              </div>
            </CardContent>
          </Card>

          {/* Información de Marketing */}
          <Card>
            <CardHeader>
              <CardTitle>Origen y Marketing</CardTitle>
              <CardDescription>Fuente y tracking del lead</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="origen">Origen</Label>
                <select
                  id="origen"
                  name="origen"
                  value={formData.origen}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Seleccionar origen</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                  <option value="comentario">Comentario</option>
                  <option value="web">Web</option>
                  <option value="ads">Ads</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="utmSource">UTM Source</Label>
                <Input
                  id="utmSource"
                  name="utmSource"
                  value={formData.utmSource}
                  onChange={handleInputChange}
                  placeholder="google, facebook, etc."
                />
              </div>
              
              <div>
                <Label htmlFor="agencia">Agencia</Label>
                <Input
                  id="agencia"
                  name="agencia"
                  value={formData.agencia}
                  onChange={handleInputChange}
                  placeholder="Nombre de la agencia"
                />
              </div>
            </CardContent>
          </Card>

          {/* Estado y Notas */}
          <Card>
            <CardHeader>
              <CardTitle>Estado y Observaciones</CardTitle>
              <CardDescription>Estado actual y notas adicionales</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="estado">Estado</Label>
                <select
                  id="estado"
                  name="estado"
                  value={formData.estado}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="NUEVO">Nuevo</option>
                  <option value="EN_REVISION">En Revisión</option>
                  <option value="PREAPROBADO">Preaprobado</option>
                  <option value="RECHAZADO">Rechazado</option>
                  <option value="DOC_PENDIENTE">Doc. Pendiente</option>
                  <option value="DERIVADO">Derivado</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="notas">Notas</Label>
                <Textarea
                  id="notas"
                  name="notas"
                  value={formData.notas}
                  onChange={handleInputChange}
                  placeholder="Observaciones adicionales..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Botones */}
        <div className="flex items-center justify-end space-x-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/leads">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              'Guardando...'
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Crear Lead
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
