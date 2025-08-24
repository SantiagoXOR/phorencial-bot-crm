'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { hasPermission } from '@/lib/rbac'
import { Save, Trash2 } from 'lucide-react'

interface Rule {
  id: string
  key: string
  value: any
  createdAt: string
  updatedAt: string
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newRule, setNewRule] = useState({ key: '', value: '' })

  const canWrite = session?.user ? hasPermission(session.user.role, 'settings:write') : false

  const fetchRules = async () => {
    try {
      const response = await fetch('/api/rules')
      if (response.ok) {
        const data = await response.json()
        setRules(data)
      }
    } catch (error) {
      console.error('Error fetching rules:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveRule = async (key: string, value: any) => {
    try {
      setSaving(true)
      const response = await fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      })
      
      if (response.ok) {
        await fetchRules()
      }
    } catch (error) {
      console.error('Error saving rule:', error)
    } finally {
      setSaving(false)
    }
  }

  const deleteRule = async (key: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta regla?')) return

    try {
      const response = await fetch(`/api/rules/${key}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        await fetchRules()
      }
    } catch (error) {
      console.error('Error deleting rule:', error)
    }
  }

  const addNewRule = async () => {
    if (!newRule.key || !newRule.value) return

    try {
      let parsedValue = newRule.value
      
      // Intentar parsear como JSON si es posible
      try {
        parsedValue = JSON.parse(newRule.value)
      } catch {
        // Si no es JSON válido, usar como string
      }

      await saveRule(newRule.key, parsedValue)
      setNewRule({ key: '', value: '' })
    } catch (error) {
      console.error('Error adding rule:', error)
    }
  }

  useEffect(() => {
    fetchRules()
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando configuración...</div>
  }

  const defaultRules = [
    { key: 'edadMin', description: 'Edad mínima permitida', defaultValue: 18 },
    { key: 'edadMax', description: 'Edad máxima permitida', defaultValue: 75 },
    { key: 'minIngreso', description: 'Ingreso mínimo requerido', defaultValue: 200000 },
    { key: 'zonasPermitidas', description: 'Zonas geográficas permitidas', defaultValue: ['CABA', 'GBA', 'Córdoba'] },
    { key: 'requiereBlanco', description: 'Requiere ingresos en blanco', defaultValue: true },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Configuración</h1>
        <Badge variant={canWrite ? 'default' : 'secondary'}>
          {canWrite ? 'Edición permitida' : 'Solo lectura'}
        </Badge>
      </div>

      {/* Reglas de scoring */}
      <Card>
        <CardHeader>
          <CardTitle>Reglas de Pre-calificación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {defaultRules.map((defaultRule) => {
            const existingRule = rules.find(r => r.key === defaultRule.key)
            const currentValue = existingRule?.value ?? defaultRule.defaultValue

            return (
              <div key={defaultRule.key} className="space-y-2">
                <Label htmlFor={defaultRule.key}>{defaultRule.description}</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id={defaultRule.key}
                    value={JSON.stringify(currentValue)}
                    onChange={(e) => {
                      if (!canWrite) return
                      
                      try {
                        const newValue = JSON.parse(e.target.value)
                        const updatedRules = rules.map(r => 
                          r.key === defaultRule.key 
                            ? { ...r, value: newValue }
                            : r
                        )
                        if (!existingRule) {
                          updatedRules.push({
                            id: '',
                            key: defaultRule.key,
                            value: newValue,
                            createdAt: '',
                            updatedAt: ''
                          })
                        }
                        setRules(updatedRules)
                      } catch {
                        // Ignorar errores de parsing mientras se escribe
                      }
                    }}
                    disabled={!canWrite}
                    className="flex-1"
                  />
                  {canWrite && (
                    <Button
                      onClick={() => saveRule(defaultRule.key, currentValue)}
                      disabled={saving}
                      size="sm"
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-500">{defaultRule.description}</p>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Reglas personalizadas */}
      <Card>
        <CardHeader>
          <CardTitle>Reglas Personalizadas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {rules
            .filter(rule => !defaultRules.some(dr => dr.key === rule.key))
            .map((rule) => (
              <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{rule.key}</div>
                  <div className="text-sm text-gray-600">
                    {JSON.stringify(rule.value)}
                  </div>
                  <div className="text-xs text-gray-400">
                    Actualizada: {new Date(rule.updatedAt).toLocaleDateString('es-AR')}
                  </div>
                </div>
                {canWrite && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteRule(rule.key)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}

          {canWrite && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Agregar Nueva Regla</h4>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="newRuleKey">Clave</Label>
                  <Input
                    id="newRuleKey"
                    value={newRule.key}
                    onChange={(e) => setNewRule({ ...newRule, key: e.target.value })}
                    placeholder="nombreRegla"
                  />
                </div>
                <div>
                  <Label htmlFor="newRuleValue">Valor (JSON)</Label>
                  <Input
                    id="newRuleValue"
                    value={newRule.value}
                    onChange={(e) => setNewRule({ ...newRule, value: e.target.value })}
                    placeholder='{"ejemplo": "valor"} o "texto" o 123'
                  />
                </div>
                <Button onClick={addNewRule} disabled={!newRule.key || !newRule.value || saving}>
                  Agregar Regla
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Información del sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Sistema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Usuario:</span> {session?.user.name} ({session?.user.role})
          </div>
          <div>
            <span className="font-medium">Email:</span> {session?.user.email}
          </div>
          <div>
            <span className="font-medium">Permisos:</span> {canWrite ? 'Lectura y escritura' : 'Solo lectura'}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
