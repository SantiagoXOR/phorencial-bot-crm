# 🚀 CRM Phorencial - Sistema de Gestión de Leads para Formosa

## 📋 Descripción

**CRM Phorencial** es un sistema de gestión de leads específicamente diseñado para la provincia de Formosa, Argentina.

**🚧 ESTADO ACTUAL:** Sistema en desarrollo activo con funcionalidades básicas implementadas. Ver [Plan de Implementación](docs/PLAN-IMPLEMENTACION-CRM-PHORENCIAL.md) para roadmap completo.

**📊 COMPLETITUD:** ~35% implementado

- ✅ Arquitectura base y APIs básicas
- 🔄 UI y funcionalidades en desarrollo
- ❌ Tests E2E y integraciones pendientes

### ✨ Características Implementadas

#### **✅ Completamente Funcionales**

- 🏗️ **Arquitectura Moderna**: Next.js 14 + TypeScript + Supabase
- 🔐 **Autenticación**: Sistema de login con NextAuth.js
- 📊 **APIs Básicas**: CRUD de leads, dashboard, pipeline
- 🎨 **Componentes UI**: shadcn/ui + componentes personalizados
- 📱 **Responsive Design**: Layout adaptativo básico

#### **🔄 En Desarrollo**

- 👥 **Gestión de Leads**: CRUD básico implementado, filtros avanzados pendientes
- 📊 **Dashboard**: Estructura creada, métricas en desarrollo
- 📁 **Gestión de Documentos**: UI creada, funcionalidad backend pendiente
- ⚙️ **Configuración**: Páginas creadas, integración pendiente

#### **❌ Pendientes de Implementar**

- 🔗 **Integración WhatsApp**: Solo documentación
- 🎯 **Sistema de Scoring**: Planificado
- 📈 **Reportes Avanzados**: En roadmap
- 🔍 **Filtros Inteligentes**: Básicos implementados
- 📝 **Audit Trail**: Estructura básica

## 🏗 Arquitectura Técnica

### **Stack Tecnológico**

- **Framework**: Next.js 14 + App Router + TypeScript
- **UI Library**: shadcn/ui + Tailwind CSS
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: NextAuth.js
- **Gráficos**: Recharts
- **Deployment**: Vercel
- **Integración**: Activepieces Cloud (flujos serverless)

### **Componentes Principales**

```
src/
├── components/
│   ├── dashboard/
│   │   ├── MetricsCard.tsx          # Métricas modernas con gradientes
│   │   └── DashboardCharts.tsx      # Gráficos avanzados
│   ├── layout/
│   │   └── Sidebar.tsx              # Navegación moderna
│   └── ui/                          # Componentes shadcn/ui
├── app/(dashboard)/
│   ├── dashboard/                   # Dashboard principal
│   ├── leads/                       # Gestión de leads
│   ├── documents/                   # Gestión de documentos
│   └── settings/                    # Configuración del sistema
```

## 📊 Datos Específicos de Formosa

### **Zonas Geográficas (20 zonas)**

- Formosa Capital, Clorinda, Pirané, El Colorado
- Las Lomitas, Ingeniero Juárez, Ibarreta, Comandante Fontana
- Villa Dos Trece, General Güemes, Laguna Blanca, Pozo del Mortero
- Y más zonas específicas de la provincia

### **Códigos de Área Locales**

- `+543704` - Formosa Capital
- `+543705` - Clorinda
- `+543711` - Interior
- `+543718` - Zonas rurales

### **Estados de Leads**

- `NUEVO` - Leads recién ingresados
- `EN_REVISION` - En proceso de evaluación
- `PREAPROBADO` - Aprobados preliminarmente
- `RECHAZADO` - No califican
- `DOC_PENDIENTE` - Documentación pendiente
- `DERIVADO` - Derivados a otras áreas

## 🚀 Instalación y Desarrollo

### **Prerrequisitos**

- Node.js 18+
- npm o yarn
- Cuenta de Supabase
- Variables de entorno configuradas

### **Instalación**

```bash
# Clonar repositorio
git clone https://github.com/SantiagoXOR/phorencial-bot-crm.git
cd phorencial-bot-crm

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# Ejecutar en desarrollo
npm run dev
```

### **Variables de Entorno**

```env
# Database (Supabase)
DATABASE_URL="postgresql://username:password@db.supabase.co:5432/postgres"

# NextAuth
NEXTAUTH_SECRET="tu-secret-key-aqui"
NEXTAUTH_URL="http://localhost:3000"

# JWT
JWT_SECRET="tu-jwt-secret-aqui"

# Webhook Security
ALLOWED_WEBHOOK_TOKEN="super-seguro"

# App Environment
APP_ENV="development"
```

### 3. Configurar la base de datos

```bash
# Generar cliente Prisma
npm run db:generate

# Ejecutar migraciones
npm run db:migrate

# Poblar con datos iniciales
npm run db:seed
```

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 👥 Usuarios Demo

Después del seed, puedes usar estos usuarios:

| Email                   | Contraseña  | Rol      |
| ----------------------- | ----------- | -------- |
| admin@phorencial.com    | admin123    | ADMIN    |
| ludmila@phorencial.com  | ludmila123  | ANALISTA |
| facundo@phorencial.com  | facundo123  | ANALISTA |
| vendedor@phorencial.com | vendedor123 | VENDEDOR |

## 🚀 Deployment

### Vercel + Supabase

1. **Crear proyecto en Supabase**:

   - Ve a [supabase.com](https://supabase.com)
   - Crea un nuevo proyecto
   - Copia la URL de conexión de PostgreSQL

2. **Deploy en Vercel**:

   ```bash
   # Instalar Vercel CLI
   npm i -g vercel

   # Deploy
   vercel
   ```

3. **Configurar variables de entorno en Vercel**:

   - Ve al dashboard de Vercel
   - Configura todas las variables del `.env.example`
   - Redeploy el proyecto

4. **Ejecutar migraciones en producción**:
   ```bash
   # Desde tu máquina local con DATABASE_URL de producción
   DATABASE_URL="tu-url-de-supabase" npx prisma migrate deploy
   DATABASE_URL="tu-url-de-supabase" npm run db:seed
   ```

## 📡 API Endpoints

### Leads

- `POST /api/leads` - Crear/actualizar lead (upsert)
- `GET /api/leads` - Listar leads con filtros
- `GET /api/leads/[id]` - Obtener lead específico
- `PATCH /api/leads/[id]` - Actualizar lead

### Eventos WhatsApp

- `POST /api/events/whatsapp` - Recibir evento de WhatsApp (webhook)

### Scoring

- `POST /api/scoring/eval` - Evaluar lead con sistema de scoring

### Configuración

- `GET /api/rules` - Obtener reglas de scoring
- `POST /api/rules` - Crear/actualizar regla
- `DELETE /api/rules/[key]` - Eliminar regla

### Monitoreo

- `GET /api/health` - Estado del sistema

## 🔗 Integración con Activepieces

Ver documentación completa en [`docs/activepieces.md`](docs/activepieces.md)

### Configuración rápida:

1. **Crear cuenta en Activepieces Cloud**
2. **Configurar variables**:
   - `CRM_BASE_URL`: URL de tu app en Vercel
   - `WEBHOOK_TOKEN`: Mismo valor que `ALLOWED_WEBHOOK_TOKEN`
3. **Importar flows**:
   - Flow de ingreso de WhatsApp
   - Flow de reportes semanales

## 📊 Sistema de Scoring

### Reglas por defecto:

- **Edad**: 18-75 años (+20 puntos si cumple, -50 si no)
- **Ingresos**: Mínimo $200,000 (+25 puntos si cumple, -30 si no)
- **Zona**: CABA, GBA, Córdoba (+15 puntos si cumple, -20 si no)
- **Datos completos**: +10 puntos si tiene 3+ campos

### Decisiones:

- **≥50 puntos**: PREAPROBADO
- **0-49 puntos**: EN_REVISION
- **<0 puntos**: RECHAZADO

## 🔒 Seguridad

- **Autenticación**: JWT con NextAuth.js
- **Autorización**: RBAC con permisos granulares
- **Rate Limiting**: Protección en endpoints públicos
- **Validación**: Zod en todos los inputs
- **Sanitización**: Logs sin datos sensibles
- **Webhook Security**: Token compartido para Activepieces

## 📈 Monitoreo

- **Health Check**: `/api/health` para UptimeRobot
- **Logs estructurados**: JSON con contexto
- **Audit Trail**: Todos los cambios en tabla `Event`
- **Métricas**: Dashboard de reportes integrado

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Tests con UI
npm run test:ui

# Type checking
npm run type-check
```

## 📝 Scripts Disponibles

```bash
npm run dev          # Desarrollo
npm run build        # Build para producción
npm run start        # Servidor de producción
npm run lint         # Linting
npm run db:migrate   # Migraciones de DB
npm run db:seed      # Poblar DB con datos demo
npm run db:studio    # Prisma Studio (GUI para DB)
npm test             # Ejecutar tests
```

## 🔧 Configuración Avanzada

### Personalizar reglas de scoring

1. Ve a `/settings` como usuario ADMIN
2. Modifica las reglas existentes o agrega nuevas
3. Las reglas se evalúan automáticamente en `/api/scoring/eval`

### Agregar nuevos orígenes

Modifica el enum en `src/lib/validators.ts`:

```typescript
origen: z.enum([
  "whatsapp",
  "instagram",
  "facebook",
  "comentario",
  "web",
  "ads",
  "nuevo_origen",
]);
```

### Personalizar estados de lead

Modifica el enum en `prisma/schema.prisma`:

```prisma
enum LeadEstado {
  NUEVO
  EN_REVISION
  PREAPROBADO
  RECHAZADO
  DOC_PENDIENTE
  DERIVADO
  NUEVO_ESTADO
}
```

## 🐛 Troubleshooting

### Error de conexión a DB

- Verificar `DATABASE_URL` en variables de entorno
- Asegurar que la DB esté accesible desde tu IP

### Webhook no funciona

- Verificar `ALLOWED_WEBHOOK_TOKEN` en ambos sistemas
- Revisar logs en Activepieces y `/api/health`

### Problemas de autenticación

- Verificar `NEXTAUTH_SECRET` y `JWT_SECRET`
- Limpiar cookies del navegador

## 📞 Soporte

Para problemas técnicos:

1. Revisar logs en Vercel/Supabase
2. Verificar configuración de variables de entorno
3. Consultar documentación de Activepieces

## 🎨 Diseño y UI

### **Gradientes Modernos**

- `gradient-primary` - Azul a Púrpura
- `gradient-success` - Verde esmeralda
- `gradient-warning` - Amarillo a Naranja
- `gradient-danger` - Rojo a Rosa

### **Badges Específicos de Formosa**

- `formosa-badge-nuevo` - Azul para NUEVO
- `formosa-badge-preaprobado` - Verde para PREAPROBADO
- `formosa-badge-rechazado` - Rojo para RECHAZADO
- `formosa-badge-revision` - Amarillo para EN_REVISION

### **Animaciones**

- `animate-fade-in` - Aparición suave
- `animate-slide-up` - Deslizamiento hacia arriba
- `hover-lift` - Efecto de elevación al hover

## 📈 Datos del Sistema

### **Estadísticas Actuales**

- **1000+ leads reales** importados desde Excel
- **Nombres argentinos** realistas y locales
- **Teléfonos con códigos de área** de Formosa
- **Distribución realista** por estados:
  - RECHAZADO: 35 leads
  - PREAPROBADO: 7 leads
  - NUEVO: Mayoría de leads
- **Ingresos**: Entre $69.400.000 y $215.400.000 ARS

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👨‍💻 Autor

**Santiago Martinez** - [@SantiagoXOR](https://github.com/SantiagoXOR)

---

## 🎉 Migración Selectiva Completada

Este proyecto es el resultado de una **migración selectiva exitosa** que combinó:

- **UI moderna** del Formosa Leads Hub
- **Funcionalidad robusta** del CRM Phorencial original
- **Datos reales** específicos de Formosa
- **Páginas nuevas** (Documents, Settings)

**Resultado**: Un CRM moderno, funcional y específicamente diseñado para las necesidades de Formosa. 🚀

---

## 📚 Documentación Técnica Completa

### **🔄 Migración Selectiva**

- [`docs/analisis-comparativo-formosa-leads-hub.md`](docs/analisis-comparativo-formosa-leads-hub.md) - Análisis comparativo completo
- [`docs/plan-migracion-selectiva.md`](docs/plan-migracion-selectiva.md) - Plan de migración ejecutado
- [`docs/migracion-completada-resumen.md`](docs/migracion-completada-resumen.md) - Resumen de migración exitosa

### **🧪 Tests End-to-End (1,078 tests)**

- [`docs/plan-implementacion-tests.md`](docs/plan-implementacion-tests.md) - Plan para 1,078 tests E2E
- [`docs/seguimiento-implementacion.md`](docs/seguimiento-implementacion.md) - Tracking de progreso
- [`docs/arquitectura-implementacion.md`](docs/arquitectura-implementacion.md) - Arquitectura técnica
- [`tests/README.md`](tests/README.md) - Guía completa de tests

### **🏗️ Arquitectura y Desarrollo**

- [`FRONTEND_SETUP.md`](FRONTEND_SETUP.md) - Setup del frontend
- [`docs/activepieces.md`](docs/activepieces.md) - Integración con Activepieces
- [`playwright.config.ts`](playwright.config.ts) - Configuración de tests

### **📊 Estado Actual**

- ✅ **Migración selectiva completada** - UI moderna + funcionalidad preservada
- ✅ **1000+ leads reales de Formosa** - Datos específicos mantenidos
- ✅ **Suite de tests E2E implementada** - 1,078 tests en 7 navegadores
- 🔄 **Implementación en progreso** - Plan de 3 fases para tests exitosos

**¡El CRM Phorencial está evolucionando hacia el sistema más robusto y validado de gestión de leads!** 🎯
