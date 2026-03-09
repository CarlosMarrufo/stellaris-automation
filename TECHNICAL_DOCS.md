# Stellaris Automation — Portal de Cliente: Documentación Técnica Completa

**Documento generado:** 2026-03-09
**Versión del sistema:** post-migración Express + Prisma + JWT (Base44/Vercel removido)

---

## Tabla de Contenidos

1. [Stack Tecnológico](#1-stack-tecnológico)
2. [Estructura de Directorios](#2-estructura-de-directorios)
3. [Esquema de Base de Datos (Prisma)](#3-esquema-de-base-de-datos-prisma)
4. [API Endpoints](#4-api-endpoints)
5. [Flujo de Autenticación](#5-flujo-de-autenticación)
6. [Rutas del Frontend](#6-rutas-del-frontend)
7. [Catálogo de Componentes](#7-catálogo-de-componentes)
8. [Sistema de Colores](#8-sistema-de-colores)
9. [Inventario de Textos / Copy](#9-inventario-de-textos--copy)
10. [Flujos de Usuario (Cliente)](#10-flujos-de-usuario-cliente)
11. [Flujos de Administrador](#11-flujos-de-administrador)
12. [Configuración de Despliegue](#12-configuración-de-despliegue)
13. [Limitaciones Conocidas / TODO](#13-limitaciones-conocidas--todo)

---

## 1. Stack Tecnológico

### Frontend

| Tecnología | Versión / Detalle |
|------------|------------------|
| React | 18 |
| Bundler | Vite |
| CSS | TailwindCSS |
| Componentes UI | shadcn/ui (`@/components/ui/*`) |
| Fetching / Cache | `@tanstack/react-query` |
| Fechas | `date-fns` |
| Iconos | `lucide-react` |
| Enrutamiento | React Router Dom (o equivalente, con `createPageUrl()` helper) |

### Backend

| Tecnología | Versión / Detalle |
|------------|------------------|
| Runtime | Node.js (ESM — módulos ES nativos) |
| Framework | Express.js |
| ORM | Prisma ORM |
| Base de datos | MySQL / MariaDB |
| Autenticación | JWT via cookie httpOnly `stellaris_token` |
| Hash contraseñas | `bcrypt` (12 rounds) |
| JWT library | `jose` o `jsonwebtoken` |
| JWT payload | `{ idCuenta, idRol }` |
| Cookie expiración | 8 horas |

### Infraestructura / Deploy

| Componente | Detalle |
|------------|---------|
| Web server | Apache2 (reverse proxy) → Node.js en puerto 4000 |
| Process manager | PM2 |
| Ruta en servidor | `/var/www/stellaris/stellaris-automation` |

---

## 2. Estructura de Directorios

```
/
├── src/
│   ├── App.jsx                          # Router principal (React Router Dom o equivalente)
│   ├── utils.js                         # Helper createPageUrl
│   ├── pages/
│   │   ├── ClientLogin.jsx              # Página de login
│   │   └── Dashboard.jsx                # Dashboard principal (bifurca cliente / admin)
│   └── components/
│       ├── admin/
│       │   ├── AdminPanel.jsx           # Shell admin con tabs
│       │   ├── ClientesTab.jsx          # CRUD lista de clientes
│       │   ├── ClienteDetalleDialog.jsx # Modal detalle de cliente (Usuarios / Robots / Tickets / Cotizaciones)
│       │   └── RefaccionesAdminTab.jsx  # Edición de refacciones (admin)
│       └── dashboard/
│           ├── PerfilFlotillaTab.jsx    # Tarjetas de robots con historial + creación de tickets
│           ├── ResumenVidaTab.jsx       # Overview de salud de robots
│           ├── RefaccionesTab.jsx       # Catálogo de partes + carrito (cliente) o edición (admin)
│           ├── CotizacionesHistorialTab.jsx # Historial de cotizaciones (cliente)
│           ├── TicketsPendientesTab.jsx # Lista de tickets con filtros
│           ├── TicketTab.jsx            # Formulario de ticket legacy (standalone)
│           └── PreciosTab.jsx           # Legacy, puede estar sin uso
├── server/
│   ├── server.js                        # App Express, registro de rutas, middleware
│   ├── lib/
│   │   ├── prisma.js                    # Singleton del cliente Prisma
│   │   ├── auth.js                      # Middleware JWT (authRequired)
│   │   └── graph.js                     # Microsoft Graph (envío de correos)
│   ├── routes/
│   │   ├── auth.js                      # POST /api/auth/login, GET /api/auth/me, POST /api/auth/logout
│   │   ├── robots.js                    # GET /api/robots, GET /api/robots/:id/mantenimientos
│   │   ├── tickets.js                   # GET /api/tickets, POST /api/tickets
│   │   ├── cotizaciones.js              # GET /api/cotizaciones, POST /api/cotizaciones
│   │   ├── refacciones.js               # GET /api/refacciones, GET /api/marcas, GET /api/categorias
│   │   └── admin.js                     # Todas las rutas /api/admin/* (solo admin)
│   └── prisma/
│       └── schema.prisma                # Esquema de base de datos
├── public/                              # Assets estáticos
├── vite.config.js                       # Config Vite + proxy (dev: /api → localhost:4000)
└── package.json
```

---

## 3. Esquema de Base de Datos (Prisma)

### Tabla: `rol`

| Campo | Tipo | Notas |
|-------|------|-------|
| idRol | Int @id @autoincrement | PK |
| nombre | VarChar(50) | "Admin" o "Usuario" |

### Tabla: `marca`

| Campo | Tipo | Notas |
|-------|------|-------|
| idMarca | Int @id | PK |
| marca | VarChar(100) | Nombre de marca (ABB, FANUC, etc.) |
| activo | Boolean @default(true) | |
| creado | DateTime | |
| actualizado | DateTime @updatedAt | |

### Tabla: `estadoRobot`

| Campo | Tipo | Notas |
|-------|------|-------|
| idEstado | Int @id | PK |
| estado | VarChar(50) | "Operativo", "En mantenimiento", "Requiere atención", "Falla activa", "Sin atencion" |

### Tabla: `prioridad`

| Campo | Tipo | Notas |
|-------|------|-------|
| idPrioridad | Int @id | PK |
| prioridad | VarChar(50) | "Baja", "Media", "Alta", "Crítica" |

### Tabla: `tipoSolicitud`

| Campo | Tipo | Notas |
|-------|------|-------|
| idTipoSolicitud | Int @id | PK |
| tipo | VarChar(80) | "preventivo", "correctivo_urgente", "diagnostico", "post_colision" |

### Tabla: `estadoSolicitud`

| Campo | Tipo | Notas |
|-------|------|-------|
| idEstadoSolicitud | Int @id | PK |
| estado | VarChar(50) | "Abierto", "En proceso", "Resuelto", "Cancelado" |

### Tabla: `categoriaRefaccion`

| Campo | Tipo | Notas |
|-------|------|-------|
| idCategoria | Int @id | PK |
| nombre | VarChar(100) | Nombre de categoría de refacción |

### Tabla: `cuenta`

| Campo | Tipo | Notas |
|-------|------|-------|
| idCuenta | Int @id | PK |
| idRol | Int FK→rol | |
| nombre | VarChar(120) | |
| passwordHash | VarChar(255) | Hash bcrypt |
| correo | VarChar(200) @unique | Identificador de login |
| activo | Boolean @default(true) | |
| creado | DateTime | |
| actualizado | DateTime @updatedAt | |

### Tabla: `cliente`

| Campo | Tipo | Notas |
|-------|------|-------|
| idCliente | Int @id | PK |
| nombre | VarChar(200) | Nombre de empresa |
| rfc | VarChar(20)? | RFC opcional |
| activo | Boolean @default(true) | Soft-delete flag |
| creado | DateTime | |
| actualizado | DateTime @updatedAt | |

### Tabla: `usuario`

| Campo | Tipo | Notas |
|-------|------|-------|
| idUsuario | Int @id | PK |
| idCliente | Int FK→cliente | |
| idRol | Int FK→rol | |
| nombre | VarChar(120) | |
| correo | VarChar(200) | Debe coincidir con un `cuenta.correo` para acceso al portal |
| telefono | VarChar(40)? | |
| activo | Boolean @default(true) | |
| creado | DateTime | |
| actualizado | DateTime @updatedAt | |

> **Nota importante:** `Usuario.correo === Cuenta.correo` es el vínculo entre un empleado del cliente y su login en el portal. No existe FK directa — se relacionan por coincidencia de correo electrónico.

### Tabla: `fuentePoder`

| Campo | Tipo | Notas |
|-------|------|-------|
| idFuente | Int @id | PK |
| idMarca | Int FK→marca | |
| modelo | VarChar(100) | Ej. "AW11/DSQC662" |
| noSerie | VarChar(100) | **Globalmente único** (validado a nivel de aplicación) |
| activo | Boolean @default(true) | |
| creado | DateTime | |
| actualizado | DateTime @updatedAt | |

### Tabla: `robot`

| Campo | Tipo | Notas |
|-------|------|-------|
| idRobot | Int @id | PK |
| idCliente | Int FK→cliente | |
| idFuente | Int? FK→fuentePoder | Opcional, SetNull al eliminar |
| idMarca | Int FK→marca | |
| idEstado | Int FK→estadoRobot | |
| modelo | VarChar(100) | Ej. "IRB 2600" |
| noSerie | VarChar(100) | **Único por cliente** (validado a nivel de aplicación) |
| fechaInstalacion | Date? | |
| celda | VarChar(50)? | Identificador de celda de producción |
| fechaProxMant | Date? | Próximo mantenimiento programado |
| horasOperacion | Int @default(0) | |
| creado | DateTime | |
| actualizado | DateTime @updatedAt | |

### Tabla: `refaccion`

| Campo | Tipo | Notas |
|-------|------|-------|
| idRefaccion | Int @id | PK |
| idCategoria | Int FK→categoriaRefaccion | |
| idMarca | Int FK→marca | Marca compatible |
| noParte | VarChar(100) | Número/código de parte |
| stockActual | Int @default(0) | Stock actual |
| precioVenta | Decimal(12,2) @default(0) | Precio de referencia |
| descripcion | Text? | |
| activo | Boolean @default(true) | |
| creado | DateTime | |
| actualizado | DateTime @updatedAt | |

### Tabla: `ticket`

| Campo | Tipo | Notas |
|-------|------|-------|
| idTicket | Int @id | PK |
| idCuenta | Int FK→cuenta | Quién lo creó |
| idRobot | Int FK→robot | |
| idUsuario | Int FK→usuario | |
| idPrioridad | Int FK→prioridad | |
| idTipoSolicitud | Int FK→tipoSolicitud | |
| idEstadoSolicitud | Int FK→estadoSolicitud | |
| fechaProgramada | Date? | |
| detalle | Text? | Descripción del problema |
| creado | DateTime | |
| actualizado | DateTime @updatedAt | |

### Tabla: `mantenimiento`

| Campo | Tipo | Notas |
|-------|------|-------|
| idMantenimiento | Int @id | PK |
| idCuenta | Int FK→cuenta | |
| idTicket | Int FK→ticket | |
| idRobot | Int FK→robot | |
| idFuente | Int? FK→fuentePoder | SetNull al eliminar |
| idTipoSolicitud | Int FK→tipoSolicitud | |
| idEstadoSolicitud | Int FK→estadoSolicitud | |
| fechaMantenimiento | Date? | |
| costoTotal | Decimal(12,2)? | |
| reporte | Text? | |
| creado | DateTime | |
| actualizado | DateTime @updatedAt | |

### Tabla: `cotizacion`

| Campo | Tipo | Notas |
|-------|------|-------|
| idCotizacion | Int @id | PK |
| idCuenta | Int FK→cuenta | |
| estado | VarChar(20) @default("pendiente") | "pendiente", "aceptada", "rechazada", "modificada" |
| notas | Text? | |
| creado | DateTime | |
| actualizado | DateTime @updatedAt | |

### Tabla: `cotizacionItem`

| Campo | Tipo | Notas |
|-------|------|-------|
| idItem | Int @id | PK |
| idCotizacion | Int FK→cotizacion Cascade | |
| idRefaccion | Int FK→refaccion | |
| cantidad | Int | |
| precioRef | Decimal(12,2) | Precio de referencia al momento de cotizar |

### Tabla: `ventaRefaccion`

| Campo | Tipo | Notas |
|-------|------|-------|
| idVentaRefaccion | Int @id | PK |
| idCliente | Int FK→cliente | |
| idRobot | Int? FK→robot | Opcional |
| idRefaccion | Int FK→refaccion | |
| idMantenimiento | Int? FK→mantenimiento | Opcional |
| cantidad | Int | |
| precioVenta | Decimal(12,2) | |
| fechaInstalacion | Date? | |
| creado | DateTime | |
| actualizado | DateTime @updatedAt | |

---

## 4. API Endpoints

Todas las rutas privadas requieren la cookie JWT `stellaris_token`. Todas las respuestas son JSON. Los errores devuelven `{ error: string }`.

---

### 4.1 Rutas Públicas

#### `POST /api/contact`

Rate-limited: 10 solicitudes / 15 minutos por IP. Envía correo vía Microsoft Graph.

**Body (JSON):**

| Campo | Tipo | Requerido |
|-------|------|-----------|
| nombre | string | Sí |
| empresa | string | No |
| cargo | string | No |
| telefono | string | No |
| correo | string | Sí |
| ciudad | string | No |
| servicios | string | No |
| marcaRobot | string | No |
| numeroParte | string | No |
| modelo | string | No |
| descripcion | string | No |

**Respuestas:**
- `200 OK`: `{ success: true }`
- `400 Bad Request`: Errores de validación de Zod

---

#### `GET /api/health`

**Respuesta:**
- `200 OK`: `{ status: "ok", timestamp: "<ISO8601>" }`

---

### 4.2 Rutas de Autenticación (`/api/auth/*`)

#### `POST /api/auth/login`

**Body (JSON):**

| Campo | Tipo | Requerido |
|-------|------|-----------|
| correo | string | Sí |
| password | string | Sí |

**Respuestas:**
- `200 OK`: `{ user: { idCuenta, nombre, correo, rol } }` + establece cookie `stellaris_token` (httpOnly, sameSite=strict, secure en prod, maxAge=8h)
- `401 Unauthorized`: Credenciales inválidas
- `403 Forbidden`: Cuenta inactiva

---

#### `GET /api/auth/me`

**Respuestas:**
- `200 OK`: `{ user: { idCuenta, nombre, correo, rol } }` donde `rol` es `"Admin"` o `"Usuario"`
- `401 Unauthorized`: No autenticado

---

#### `POST /api/auth/logout`

Limpia la cookie `stellaris_token`.

**Respuesta:**
- `200 OK`: `{ success: true }`

---

### 4.3 Rutas de Robots

#### `GET /api/robots`

Devuelve los robots del cliente autenticado. El admin ve todos.

**Respuesta `200 OK`:** Array de objetos:

```json
{
  "id": 1,
  "modelo": "IRB 2600",
  "numero_serie_robot": "ABC123",
  "fuente_poder": "AW11/DSQC662",
  "numero_serie_fuente": "XYZ789",
  "marca": "ABB",
  "fecha_instalacion": "2020-01-15",
  "celda": "C1",
  "estado": "operativo",
  "proximo_mantenimiento": "2026-06-01",
  "ultimo_mantenimiento": "2025-12-01",
  "horas_operacion": 12500
}
```

> Nota: `estado` se devuelve en **minúsculas**.

---

#### `GET /api/robots/:id/mantenimientos`

Devuelve el historial de mantenimiento de un robot específico (máx. 50, ordenado por fecha desc). Un no-admin solo puede acceder a robots de su cliente.

**Respuesta `200 OK`:** Array de objetos:

```json
{
  "id": 1,
  "fecha": "2025-12-01",
  "tipo": "Mantenimiento Preventivo",
  "estado": "Resuelto",
  "costo": 15000.00,
  "reporte": "Cambio de grasa y calibración de ejes"
}
```

**Respuesta `403 Forbidden`:** El robot no pertenece al cliente del usuario autenticado.

---

### 4.4 Rutas de Tickets

#### `GET /api/tickets`

Devuelve tickets del usuario autenticado. Admin ve todos (máx. 100, ordenado por `creado` desc).

**Respuesta `200 OK`:** Array de objetos:

```json
{
  "id": 1,
  "numero_ticket": "TKT-00001",
  "robot": "IRB 2600 — ABC123",
  "tipo_servicio": "Mantenimiento Preventivo",
  "prioridad": "media",
  "estado": "abierto",
  "descripcion": "Vibración anormal en eje 3",
  "fecha_creacion": "2026-03-01",
  "fecha_programada": "2026-03-15",
  "tecnico_asignado": null
}
```

> Nota: `prioridad` y `estado` se devuelven en **minúsculas**.

---

#### `POST /api/tickets`

**Body (JSON):**

| Campo | Tipo | Requerido | Notas |
|-------|------|-----------|-------|
| idRobot | number | Sí | |
| tipo_servicio | string | Sí | Ver valores válidos abajo |
| prioridad | string | Sí | Ver valores válidos abajo |
| descripcion | string | Sí | |
| fecha_programada | string (date) | No | |

**Valores válidos para `tipo_servicio`:** `"preventivo"`, `"correctivo_urgente"`, `"diagnostico"`, `"post_colision"`

**Valores válidos para `prioridad`:** `"baja"`, `"media"`, `"alta"`, `"critica"`

Los registros de catálogo se resuelven por nombre (coincidencia contains, case-insensitive).

**Respuestas:**
- `201 Created`: `{ success: true, numero_ticket: "TKT-00001", idTicket: 1 }`
- `400 Bad Request`: Error de validación Zod
- `404 Not Found`: Robot no encontrado
- `422 Unprocessable Entity`: Registros de catálogo no encontrados (seed no ejecutado)

---

### 4.5 Rutas de Refacciones

#### `GET /api/refacciones`

Catálogo de partes paginado y con búsqueda.

**Query params:**

| Param | Default | Descripción |
|-------|---------|-------------|
| skip | 0 | Offset de paginación |
| take | 20 | Tamaño de página |
| search | — | Texto (busca en noParte + descripcion) |
| marca | — | idMarca (filtro por marca) |
| categoria | — | idCategoria (filtro por categoría) |

**Respuesta `200 OK`:**

```json
{
  "data": [
    {
      "id": 1,
      "codigo": "3HAC026682-001",
      "nombre": "Motor Axis 1",
      "categoria": "Motores",
      "marca_compatible": "ABB",
      "precio_venta": 12500.00,
      "stock_disponible": 3
    }
  ],
  "total": 3601
}
```

---

#### `GET /api/marcas`

**Respuesta `200 OK`:** `[{ idMarca: 1, marca: "ABB" }, ...]`

---

#### `GET /api/categorias`

**Respuesta `200 OK`:** `[{ idCategoria: 1, nombre: "Motores" }, ...]`

---

### 4.6 Rutas de Cotizaciones

#### `GET /api/cotizaciones`

Devuelve cotizaciones del usuario autenticado. Admin ve todas.

**Respuesta `200 OK`:** Array de objetos cotizacion con items anidados.

---

#### `POST /api/cotizaciones`

**Body (JSON):**

```json
{
  "items": [
    { "idRefaccion": 1, "cantidad": 2, "precioRef": 12500.00 }
  ]
}
```

**Respuestas:**
- `201 Created`: `{ success: true, idCotizacion: 1 }`

---

### 4.7 Rutas de Administración (`/api/admin/*`)

> Todas las rutas admin requieren `idRol === 1`. Prefijo: `/api/admin/`

---

#### `GET /api/admin/catalogos`

Devuelve tablas de lookup para dropdowns.

**Respuesta `200 OK`:**
```json
{
  "estados": [...],
  "prioridades": [...],
  "tipos": [...],
  "estadosRobot": [{ "idEstado": 1, "estado": "Operativo" }]
}
```

---

#### `GET /api/admin/clientes`

**Respuesta `200 OK`:** `[{ id, nombre, rfc, activo, robots: count }]`

---

#### `POST /api/admin/clientes`

**Body (JSON):**

| Campo | Tipo | Requerido | Validación |
|-------|------|-----------|------------|
| nombre | string | Sí | min 2 caracteres |
| rfc | string | No | |

**Respuesta `201 Created`:** Objeto del cliente creado.

---

#### `PATCH /api/admin/clientes/:id`

**Body (JSON):** `{ nombre?, rfc?, activo? }`

**Respuesta `200 OK`:** Objeto del cliente actualizado.

---

#### `DELETE /api/admin/clientes/:id`

Soft-delete (establece `activo=false`).

**Respuesta `200 OK`:** `{ success: true }`

---

#### `GET /api/admin/clientes/:id`

Detalle completo del cliente con todos los datos relacionados.

**Respuesta `200 OK`:**

```json
{
  "cliente": { "..." },
  "robots": [
    {
      "id": 1,
      "modelo": "IRB 2600",
      "noSerie": "ABC123",
      "marca": "ABB",
      "celda": "C1",
      "estado": "Operativo",
      "fechaInstalacion": "2020-01-15",
      "fechaProxMant": "2026-06-01",
      "horasOperacion": 12500,
      "fuente": {
        "id": 1,
        "modelo": "AW11/DSQC662",
        "noSerie": "XYZ789",
        "marca": "ABB"
      }
    }
  ],
  "tickets": [
    {
      "id": 1,
      "numero": "TKT-00001",
      "robot": "IRB 2600 — ABC123",
      "tipo": "Mantenimiento Preventivo",
      "prioridad": "Media",
      "estado": "Abierto",
      "idEstadoSolicitud": 1,
      "fecha": "2026-03-01",
      "detalle": "Vibración en eje 3"
    }
  ],
  "cotizaciones": [
    {
      "id": 1,
      "solicitante": "Juan Pérez",
      "correo": "juan@empresa.com",
      "fecha": "2026-03-01",
      "estado": "pendiente",
      "notas": null,
      "total": 25000.00,
      "items": [{ "..." }]
    }
  ]
}
```

---

#### `GET /api/admin/clientes/:id/usuarios`

**Respuesta `200 OK`:** `[{ id, nombre, correo, telefono, activo, portalActivo, idCuenta }]`

> `portalActivo` = `cuenta.activo` (si el login al portal está activo)

---

#### `POST /api/admin/usuarios`

Crea registros `usuario` y `cuenta` en una transacción.

**Body (JSON):**

| Campo | Tipo | Requerido | Validación |
|-------|------|-----------|------------|
| idCliente | number | Sí | |
| nombre | string | Sí | |
| correo | string | Sí | |
| telefono | string | No | |
| password | string | Sí | min 6 caracteres |

**Respuestas:**
- `201 Created`: `{ success: true }`
- `409 Conflict`: Correo ya registrado

---

#### `PATCH /api/admin/usuarios/:id`

Actualiza registros `usuario` y la `cuenta` correspondiente.

**Body (JSON):** `{ nombre?, correo?, telefono?, password? }`

**Respuesta `200 OK`:** `{ success: true }`

---

#### `DELETE /api/admin/usuarios/:id`

Desactiva (soft) tanto `usuario` como `cuenta`.

**Respuesta `200 OK`:** `{ success: true }`

---

#### `PUT /api/admin/usuarios/:id/reactivar`

Reactiva tanto `usuario` como `cuenta`.

**Respuesta `200 OK`:** `{ success: true }`

---

#### `PATCH /api/admin/refacciones/:id`

**Body (JSON):** `{ descripcion?, noParte?, precioVenta?, stockActual? }`

**Respuesta `200 OK`:** `{ id, noParte, descripcion, precioVenta, stockActual }`

---

#### `PATCH /api/admin/tickets/:id`

**Body (JSON):** `{ idEstadoSolicitud: number }`

**Respuesta `200 OK`:** `{ id, idEstadoSolicitud }`

---

#### `PATCH /api/admin/cotizaciones/:id`

**Body (JSON):**

| Campo | Tipo | Requerido | Valores válidos |
|-------|------|-----------|-----------------|
| estado | string | Sí | `"pendiente"`, `"aceptada"`, `"rechazada"`, `"modificada"` |
| notas | string | No | |

**Respuesta `200 OK`:** `{ id, estado }`

---

#### `POST /api/admin/robots`

Crea robot. Valida unicidad de `noSerie` por cliente.

**Body (JSON):**

| Campo | Tipo | Requerido |
|-------|------|-----------|
| idCliente | number | Sí |
| idMarca | number | Sí |
| idEstado | number | Sí |
| modelo | string | Sí |
| noSerie | string | Sí |
| celda | string | No |
| fechaInstalacion | string (date) | No |
| fechaProxMant | string (date) | No |
| horasOperacion | number | No |

**Respuestas:**
- `201 Created`: `{ success: true, id: idRobot }`
- `409 Conflict`: `"Ya existe un robot con el No. Serie '...' para este cliente"`

---

#### `PATCH /api/admin/robots/:id`

Valida unicidad de `noSerie` dentro del mismo cliente.

**Body (JSON):** `{ idMarca?, idEstado?, modelo?, noSerie?, celda?, fechaInstalacion?, fechaProxMant?, horasOperacion? }`

**Respuestas:**
- `200 OK`: `{ success: true }`
- `409 Conflict`: noSerie duplicado

---

#### `DELETE /api/admin/robots/:id`

Hard delete. Bloqueado por FK si el robot tiene tickets o mantenimientos.

**Respuestas:**
- `200 OK`: `{ success: true }`
- `409 Conflict`: `"No se puede eliminar: el robot tiene tickets o mantenimientos asociados. Cambia su estado a Inactivo."`

---

#### `POST /api/admin/fuentes`

Crea FuentePoder y la asigna a un robot. Valida unicidad de `noSerie` globalmente.

**Body (JSON):**

| Campo | Tipo | Requerido |
|-------|------|-----------|
| idRobot | number | Sí |
| idMarca | number | Sí |
| modelo | string | Sí |
| noSerie | string | Sí |

**Respuestas:**
- `201 Created`: `{ id, modelo, noSerie }`
- `409 Conflict`: `"Ya existe una fuente de poder con el No. Serie '...' (asignada al robot '...' del cliente '...')"`

---

#### `PATCH /api/admin/fuentes/:id`

**Body (JSON):** `{ idMarca?, modelo?, noSerie? }`

**Respuestas:**
- `200 OK`: `{ success: true }`
- `409 Conflict`: noSerie duplicado con contexto

---

## 5. Flujo de Autenticación

### Diagrama de flujo

1. Usuario visita `/` o `/ClientLogin` → se renderiza `ClientLogin.jsx`
2. Usuario ingresa correo + contraseña → `POST /api/auth/login`
3. El servidor verifica el hash bcrypt, comprueba `cuenta.activo`, emite cookie JWT
4. El navegador almacena `stellaris_token` como cookie httpOnly
5. `Dashboard.jsx` se monta → `GET /api/auth/me` verifica la cookie → devuelve `{ user }`
6. Si `user.rol === 'Admin'` → renderiza `<AdminPanel />`, si no → renderiza el portal cliente con 5 tabs
7. Todas las llamadas API subsiguientes usan `credentials: 'include'` para enviar la cookie

### Payload del JWT

```json
{ "idCuenta": 1, "idRol": 1 }
```

### Configuración de la Cookie

| Propiedad | Valor |
|-----------|-------|
| Nombre | `stellaris_token` |
| httpOnly | `true` (no accesible desde JS) |
| sameSite | `strict` |
| secure | `true` en producción (solo HTTPS) |
| maxAge | 8 horas |

---

## 6. Rutas del Frontend

La app usa `createPageUrl()` de `src/utils.js` para generar URLs de navegación (basado en nombre de página → ruta).

| Página | Componente | Ruta |
|--------|-----------|------|
| Login | `ClientLogin.jsx` | `/` o `/ClientLogin` |
| Dashboard | `Dashboard.jsx` | `/Dashboard` o `/` |

---

## 7. Catálogo de Componentes

### `src/pages/ClientLogin.jsx`

Formulario de login. Al montarse, llama a `GET /api/auth/me` — si ya está autenticado, redirige al Dashboard.

**Elementos de UI:**
- Logo de Stellaris + encabezado de marca
- Input de correo (`type="email"`)
- Input de contraseña (`type="password"`)
- Botón "Iniciar Sesión" (azul, ancho completo)
- Mensaje de error (texto rojo) en caso de login fallido

---

### `src/pages/Dashboard.jsx`

**Props:** ninguna (lee auth de la API)

**Estado:** `user`, `loading`, `cart[]`

**Comportamiento:**
1. Al montarse: `GET /api/auth/me` → si falla, redirige a ClientLogin
2. Si `user.rol === 'Admin'` → devuelve `<AdminPanel user onLogout />`
3. En caso contrario: renderiza portal cliente con 5 tabs

**Estado del carrito gestionado aquí, pasado como props a RefaccionesTab:**

| Función | Descripción |
|---------|-------------|
| `addToCart(item, cantidad)` | Agrega o incrementa item |
| `removeFromCart(id)` | Elimina item |
| `updateQty(id, cantidad)` | Actualiza cantidad |
| `clearCart()` | Vacía el carrito |

**Encabezado:**
- Título: "Portal de Cliente" (`text-2xl font-bold text-slate-900`)
- Subtítulo: "Bienvenido, {nombre || correo}" (`text-slate-600`)
- Botón "Cerrar Sesión" (outline, alineado a la derecha, ícono LogOut)

**Tabs (en orden):**

| Orden | Key | Etiqueta (sm+) | Etiqueta (xs) | Ícono |
|-------|-----|----------------|---------------|-------|
| 1 | `flotilla` | "Perfil Flotilla" | "Flotilla" | Database |
| 2 | `vida` | "Vida Robot" | "Vida" | Activity |
| 3 | `refacciones` | "Refacciones" | "Refacciones" | Package |
| 4 | `cotizaciones` | "Cotizaciones" | "Cotizaciones" | ClipboardList |
| 5 | `tickets` | "Tickets" | "Tickets" | FileText |

---

### `src/components/admin/AdminPanel.jsx`

**Props:** `{ user, onLogout }`

**Encabezado:**
- Título: "Panel Administrador"
- Botón "Cerrar Sesión"

**Tabs:**

| Orden | Key | Ícono | Componente |
|-------|-----|-------|-----------|
| 1 | `clientes` | Users | `<ClientesTab />` |
| 2 | `refacciones` | Package | `<RefaccionesAdminTab />` |

---

### `src/components/admin/ClientesTab.jsx`

Lista CRUD de todos los clientes.

**Funcionalidades:**
- Input de búsqueda filtra clientes por nombre
- Botón "Nuevo Cliente" → abre diálogo de creación
- Tabla de clientes: Nombre | RFC | Robots | Estado | Acciones
- Acciones por fila: "Ver" (abre diálogo de detalle) | Ícono Pencil (Editar) | Trash2/RotateCcw (desactivar/reactivar)
- Cliente activo → ícono Trash2 (rojo en hover) = desactivar
- Cliente inactivo → ícono RotateCcw (verde en hover) = reactivar

**Llamadas API:**
- `GET /api/admin/clientes`
- `POST /api/admin/clientes`
- `PATCH /api/admin/clientes/:id`
- `DELETE /api/admin/clientes/:id` (soft delete)
- `PATCH /api/admin/clientes/:id` con `{ activo: true }` (reactivar)

---

### `src/components/admin/ClienteDetalleDialog.jsx`

Modal de diálogo que muestra el detalle completo del cliente. Overlay con `z-50`.

**Props:** `{ cliente: { id, nombre, rfc }, onClose }`

**Queries React Query:**

| Query key | Endpoint |
|-----------|---------|
| `['admin-cliente-detail', cliente.id]` | `GET /api/admin/clientes/:id` |
| `['admin-catalogos']` | `GET /api/admin/catalogos` |
| `['admin-usuarios', cliente.id]` | `GET /api/admin/clientes/:id/usuarios` |
| `['marcas']` | `GET /api/marcas` |

**Tabs internas:**

**1. Usuarios**
Tabla: Nombre | Correo | Teléfono | Portal (badge) | Acciones (Pencil + Trash2/RotateCcw)

**2. Robots**
Tabla: Modelo | No. Serie Robot | Marca | Estado | Fuente de Poder | No. Serie FdP | Celda | Acciones

**3. Tickets**
Tabla: # | Robot | Tipo | Prioridad | Estado | Fecha | Cambiar Estado (Select)

**4. Cotizaciones**
Tarjetas expandibles: folio | solicitante | fecha | total | badge de estado + botón "Gestionar"

**Acciones por fila de robot:**
- Pencil (hover ámbar) = editar robot
- ⚡ botón (azul si tiene fuente / gris si no) = agregar/editar fuente de poder
- Trash2 (hover rojo) = eliminar robot

**Diálogos internos (`z-60`):**
- Crear/Editar Usuario
- Crear/Editar Robot
- Confirmación de eliminación de Robot
- Prompt de Fuente de Poder (mostrado tras creación de robot): "¿Agregar Fuente de Poder?" con botones "Omitir" / "Agregar"
- Formulario de Fuente de Poder (crear/editar): Marca (Select) | Modelo | No. Serie

**Validaciones de unicidad (nivel de aplicación):**
- `noSerie` de Robot: único por cliente → error 409 mostrado en `robotError`
- `noSerie` de Fuente: globalmente único → error 409 con contexto (robot + nombre del cliente) mostrado en `fuenteError`

---

### `src/components/admin/RefaccionesAdminTab.jsx`

Mismo layout que el RefaccionesTab del cliente pero con capacidad de edición.

**Funcionalidades:**
- Mismos filtros: búsqueda, marca, categoría
- Misma tabla, pero la columna "Stock" muestra el número real (con código de colores)
- Alerta admin para items con bajo stock en la página actual
- Botón "Editar" por fila → diálogo: noParte | descripcion (textarea) | precioVenta | stockActual
- `PATCH /api/admin/refacciones/:id`

---

### `src/components/dashboard/PerfilFlotillaTab.jsx`

Vista cliente de su flota de robots.

**Barra de resumen (5 tarjetas):**

| Tarjeta | Fuente del conteo | Color del número |
|---------|------------------|-----------------|
| Total Robots | todos | `text-slate-900` |
| Operativos | `estado === 'operativo'` | `text-green-600` |
| En Mantenimiento | `estado` includes `'mantenimient'` | `text-blue-600` |
| Requiere Atención | `estado` includes `'atenci'` | `text-yellow-600` |
| Con Falla | `estado` includes `'falla'` | `text-red-600` |

**Botón "+ Nuevo Ticket"** (arriba a la derecha, azul) → abre panel de ticket lateral sin robot preseleccionado.

**Tarjetas de robot** (expandibles, una por robot):

*Estado colapsado (siempre visible):*
- Marca + Modelo (`font-semibold text-slate-900`) + Celda si está definida (`text-xs text-slate-500`)
- No. Serie (`font-mono text-sm text-slate-500`, oculto en xs)
- Badge de Estado (con color, ver Sistema de Colores)
- Badge de Salud (% con color, ver abajo, oculto en xs/sm)
- Ícono ChevronDown / ChevronUp

*Estado expandido:*
- **Detalles técnicos** (grid `bg-slate-50`): No. Serie | Fuente de Poder (+ noSerie debajo) | Instalación | Próximo Mantenimiento (rojo si vencido) | Horas de Operación
- **Botón "Crear Ticket"** (azul, alineado a la derecha) → abre panel con este robot preseleccionado
- **Sección Historial de Mantenimientos:**
  - 3 cajas de estadísticas (`bg-slate-100`): Total | Último Costo | Costo Promedio
  - Gráfico de barras (CSS, barras azules) mostrando conteo por año (solo si >1 año)
  - Lista timeline (`max-h-52 overflow-y-auto`): fecha | tipo | reporte | costo | estado

**Panel lateral de ticket** (drawer derecho, `z-50`):
- Robot preseleccionado (del botón de tarjeta) o en blanco (del botón "Nuevo Ticket")
- Campos: Robot (Select) | Tipo de Servicio | Prioridad | Fecha Programada (opcional) | Descripción
- Botón "Crear Ticket" (azul)
- Estado de éxito: ✅ + "Ticket creado exitosamente" + "Nuestro equipo técnico se pondrá en contacto contigo a la brevedad." + botón "Cerrar"

---

### `src/components/dashboard/ResumenVidaTab.jsx`

Vista general de salud de todos los robots.

**Algoritmo de puntuación de salud:**

| Condición | Penalización |
|-----------|-------------|
| Punto de inicio | 100 |
| Mantenimiento vencido (`fechaProxMant < hoy`) | −25 |
| Estado includes `'falla'` | −30 |
| Estado includes `'atenci'` | −15 |
| Estado includes `'mantenimient'` | −10 |
| Estado includes `'sin'` | −5 |
| Mínimo posible | 0 |

**Colores de puntuación:**

| Puntuación | Color | Etiqueta |
|------------|-------|---------|
| ≥ 80 | `text-green-600` | Óptima |
| ≥ 60 | `text-yellow-600` | Regular |
| ≥ 40 | `text-orange-600` | Baja |
| < 40 | `text-red-600` | Crítica |

---

### `src/components/dashboard/RefaccionesTab.jsx`

**Props:** `{ isAdmin?, onAddToCart?, cart?, onRemove?, onUpdateQty?, onClear?, user? }`

**Filtros:** Input de búsqueda | Select de Marca | Select de Categoría

**Columnas de la tabla:** Código | Descripción | Categoría | Marca | Precio Ref. | Stock | (Cotizar si `!isAdmin`)

**Visualización del stock:**
- Admin: muestra el número real (rojo si 0, amarillo si <5, verde si ≥5)
- Cliente: Badge — stock <5 → "Bajo Pedido" (amarillo), stock ≥5 → "En Stock" (verde)

**Botón "Mi Cotización"** (azul, arriba a la derecha, solo para no-admin): muestra badge con conteo de items del carrito (rojo, posición absoluta)

**Diálogo "Agregar a cotización":**
- Muestra nombre del item, codigo, precio_venta (ref.)
- Input de cantidad
- Advertencia si la cantidad bajaría el stock por debajo de 5: "La disponibilidad del stock puede cambiar en el transcurso de la solicitud." (ámbar)
- Siempre muestra: "Los precios son de referencia. La cotización formal y condiciones de venta se coordinarán con nuestro equipo comercial." (ámbar)

**Panel lateral del carrito:**
- Muestra items con editor de cantidad y botón Trash2 para eliminar
- Total estimado (suma de `precio_venta × cantidad`)
- "Se enviará a nombre de {user.nombre}" (`text-xs`)
- Nota ámbar: "Los precios son de referencia..."
- Botón "Enviar Cotización" → `POST /api/cotizaciones`
- Botón "Vaciar cotización" (outline rojo)
- Estado de éxito: ✅ + "Solicitud enviada" + "Nuestro equipo se pondrá en contacto contigo a la brevedad."

---

### `src/components/dashboard/CotizacionesHistorialTab.jsx`

Historial de cotizaciones del cliente.

**Tarjetas de resumen (4):**

| Tarjeta | Color |
|---------|-------|
| Total | slate |
| Pendientes | yellow |
| Aceptadas | green |
| Rechazadas | red |

**Filtro:** Select de Estado (Todos / Pendiente / Aceptada / Rechazada / Modificada)

**Filas expandibles:**
- Folio (COT-XXXXX) | fecha | N artículos | total | badge de estado | ChevronDown/Up
- Expandido: tabla de items (Código | Descripción | Cantidad | Precio Ref. | Subtotal) + Notas

---

### `src/components/dashboard/TicketsPendientesTab.jsx`

Lista de tickets con filtros.

**Tarjetas de resumen (4):**

| Tarjeta | Color |
|---------|-------|
| Total | slate |
| Abiertos | yellow |
| En Proceso | purple |
| Resueltos | green |

**Filtros:** Select de Estado | Select de Prioridad

**Tarjetas de ticket (una por ticket):**
- Encabezado: `numero_ticket` | badge de estado | badge de prioridad
- Línea de info: ícono AlertCircle + `tipo_servicio` | ícono Clock + "Robot: {robot}"
- Cuerpo: `descripcion`
- Pie: fecha Creado | fecha Programado (azul, si definida) | Técnico (si asignado)
- Notas del técnico: caja `bg-blue-50` (si presente)

---

## 8. Sistema de Colores

### 8.1 Colores de Badge de Estado del Robot

Aplicados en: `EstadoRobotBadge` (ClienteDetalleDialog), `getEstadoColor()` (PerfilFlotillaTab)

| Estado (coincidencia case-insensitive) | Background | Texto | Borde |
|---------------------------------------|-----------|-------|-------|
| `=== 'operativo'` | `bg-green-100` | `text-green-800` | `border-green-200` |
| includes `'mantenimient'` | `bg-blue-100` | `text-blue-800` | `border-blue-200` |
| includes `'atenci'` | `bg-yellow-100` | `text-yellow-800` | `border-yellow-200` |
| includes `'falla'` | `bg-red-100` | `text-red-800` | `border-red-200` |
| default (Sin atencion) | `bg-slate-100` | `text-slate-800` | `border-slate-200` |

---

### 8.2 Colores de Badge de Salud del Robot (PerfilFlotillaTab)

| Puntuación | Background | Texto | Etiqueta |
|------------|-----------|-------|---------|
| ≥ 80 | `bg-green-100` | `text-green-700` | Óptima |
| 60–79 | `bg-yellow-100` | `text-yellow-700` | Regular |
| 40–59 | `bg-orange-100` | `text-orange-700` | Baja |
| < 40 | `bg-red-100` | `text-red-700` | Crítica |

---

### 8.3 Colores de Badge de Estado de Ticket (TicketsPendientesTab — vista cliente)

| Estado | Background | Texto | Borde |
|--------|-----------|-------|-------|
| `abierto` | `bg-yellow-100` | `text-yellow-800` | `border-yellow-200` |
| `en proceso` / `en_proceso` | `bg-purple-100` | `text-purple-800` | `border-purple-200` |
| `resuelto` | `bg-green-100` | `text-green-800` | `border-green-200` |
| `cancelado` | `bg-slate-100` | `text-slate-800` | `border-slate-200` |

---

### 8.4 Colores de Badge de Estado de Ticket (ClienteDetalleDialog — vista admin)

| Estado (case-insensitive) | Background | Texto | Borde |
|--------------------------|-----------|-------|-------|
| includes `'abiert'` | `bg-blue-100` | `text-blue-800` | `border-blue-200` |
| includes `'progreso'` o `'proceso'` | `bg-yellow-100` | `text-yellow-800` | `border-yellow-200` |
| includes `'cerrad'` o `'resuelto'` | `bg-slate-100` | `text-slate-600` | `border-slate-200` |
| default | `bg-slate-100` | `text-slate-600` | `border-slate-200` |

---

### 8.5 Colores de Badge de Estado de Cotización

| Estado | Background | Texto | Borde |
|--------|-----------|-------|-------|
| `pendiente` | `bg-yellow-100` | `text-yellow-800` | `border-yellow-200` |
| `aceptada` | `bg-green-100` | `text-green-800` | `border-green-200` |
| `rechazada` | `bg-red-100` | `text-red-800` | `border-red-200` |
| `modificada` | `bg-blue-100` | `text-blue-800` | `border-blue-200` |

---

### 8.6 Colores de Badge de Prioridad de Ticket (TicketsPendientesTab)

| Prioridad | Background | Texto |
|-----------|-----------|-------|
| `baja` | `bg-green-100` | `text-green-800` |
| `media` | `bg-yellow-100` | `text-yellow-800` |
| `alta` | `bg-orange-100` | `text-orange-800` |
| `critica` | `bg-red-100` | `text-red-800` |

---

### 8.7 Colores de Stock de Refacción (vista admin)

| Condición | Color de texto |
|-----------|---------------|
| `stock === 0` | `text-red-600` |
| `stock < 5` | `text-yellow-600` |
| `stock ≥ 5` | `text-green-600` |

---

### 8.8 Badge de Stock de Refacción (vista cliente)

| Condición | Etiqueta | Background | Texto | Borde |
|-----------|---------|-----------|-------|-------|
| `stock < 5` (incluyendo 0) | "Bajo Pedido" | `bg-yellow-100` | `text-yellow-800` | `border-yellow-200` |
| `stock ≥ 5` | "En Stock" | `bg-green-100` | `text-green-800` | `border-green-200` |

---

### 8.9 Badge de Portal de Usuario (admin)

| Estado | Background | Texto | Borde | Etiqueta |
|--------|-----------|-------|-------|---------|
| `portalActivo = true` | `bg-green-100` | `text-green-800` | `border-green-200` | "Activo" |
| `portalActivo = false` | `bg-slate-100` | `text-slate-600` | `border-slate-200` | "Inactivo" |

---

### 8.10 Colores de UI Primarios

| Elemento | Clases Tailwind |
|---------|----------------|
| Botones de acción primaria | `bg-blue-600 hover:bg-blue-700 text-white` |
| Botones de acción peligrosa | `bg-red-600 hover:bg-red-700 text-white` |
| Botones outline | `variant="outline"` (shadcn default: `border-input bg-background`) |
| Fondo de página | `bg-slate-50` |
| Fondo de tarjetas | `bg-white` |
| Bordes | `border-slate-200` |
| Texto silenciado | `text-slate-500`, `text-slate-600` |
| Encabezados / títulos | `text-slate-900` |
| Texto secundario | `text-slate-700` |

---

### 8.11 Cajas de Advertencia / Info

| Tipo | Background | Borde | Texto |
|------|-----------|-------|-------|
| Advertencia ámbar (notas, stock) | `bg-amber-50` | `border border-amber-200` | `text-amber-800` |
| Info azul (notas técnicas) | `bg-blue-50` | `border border-blue-200` | `text-blue-900` |
| Error rojo (formularios) | — (inline) | — | `text-red-600` |
| Alerta naranja (bajo stock, admin) | `bg-orange-50` | `border-orange-200` | `text-orange-900` |

---

## 9. Inventario de Textos / Copy

### `ClientLogin.jsx`

| Elemento | Texto |
|---------|-------|
| Encabezado de página | "Portal de Cliente" (con logo Stellaris) |
| Label de correo | "Correo electrónico" (o "Correo") |
| Label de contraseña | "Contraseña" |
| Botón de envío | "Iniciar Sesión" |
| Error de credenciales | "Credenciales inválidas" (servidor devuelve "Credenciales incorrectas" o similar) |
| Error de cuenta inactiva | "Cuenta inactiva" |

---

### `Dashboard.jsx` — Encabezado del portal cliente

| Elemento | Texto |
|---------|-------|
| Título | "Portal de Cliente" |
| Subtítulo | "Bienvenido, {user.nombre \|\| user.correo}" |
| Botón de logout | "Cerrar Sesión" |

### `Dashboard.jsx` — Tabs del portal cliente

| Orden | Etiqueta (sm+) | Etiqueta (xs) |
|-------|---------------|---------------|
| 1 | "Perfil Flotilla" | "Flotilla" |
| 2 | "Vida Robot" | "Vida" |
| 3 | "Refacciones" | "Refacciones" |
| 4 | "Cotizaciones" | "Cotizaciones" |
| 5 | "Tickets" | "Tickets" |

---

### `AdminPanel.jsx` — Encabezado y tabs

| Elemento | Texto |
|---------|-------|
| Título | "Panel Administrador" |
| Botón de logout | "Cerrar Sesión" |
| Tab 1 | "Clientes" |
| Tab 2 | "Refacciones" |

---

### `PerfilFlotillaTab.jsx`

| Elemento | Texto |
|---------|-------|
| Tarjeta resumen 1 | "Total Robots" |
| Tarjeta resumen 2 | "Operativos" |
| Tarjeta resumen 3 | "En Mantenimiento" |
| Tarjeta resumen 4 | "Requiere Atención" |
| Tarjeta resumen 5 | "Con Falla" |
| Botón nuevo ticket | "+ Nuevo Ticket" |
| Encabezado de sección | "Detalle de Flotilla — haz clic en un robot para ver detalles e historial" |
| Estado vacío | "No hay robots registrados en el sistema" |
| Label detalle: no. serie | "No. Serie Robot" |
| Label detalle: fuente | "Fuente de Poder" |
| Label detalle: instalación | "Instalación" |
| Label detalle: próximo mant. | "Próximo Mantenimiento" |
| Label detalle: horas | "Horas de Operación" |
| Indicador vencido | "(vencido)" (texto rojo, `text-xs`, junto a la fecha) |
| Botón crear ticket (en card) | "Crear Ticket" |
| Título sección historial | "Historial de Mantenimientos" |
| Historial vacío | "Sin registros de mantenimiento en el sistema" |
| Stat historial 1 | "Total" |
| Stat historial 2 | "Último costo" |
| Stat historial 3 | "Costo promedio" |
| Gráfico etiqueta | "Frecuencia por año" |
| Panel ticket: título | "Nuevo Ticket de Servicio" |
| Panel ticket: label robot | "Robot" |
| Panel ticket: label tipo | "Tipo de Servicio" |
| Panel ticket: label prioridad | "Prioridad" |
| Panel ticket: label fecha | "Fecha Programada (Opcional)" |
| Panel ticket: label descripción | "Descripción del Problema o Servicio" |
| Tipo opción 1 | "Mantenimiento Preventivo" |
| Tipo opción 2 | "Mantenimiento Correctivo" |
| Tipo opción 3 | "Diagnóstico" |
| Tipo opción 4 | "Post-Colisión" |
| Prioridad opción 1 | "Baja" |
| Prioridad opción 2 | "Media" |
| Prioridad opción 3 | "Alta" |
| Prioridad opción 4 | "Crítica" |
| Botón submit | "Crear Ticket" |
| Botón en carga | "Creando ticket..." |
| Éxito: encabezado | ✅ "Ticket creado exitosamente" |
| Éxito: mensaje | "Nuestro equipo técnico se pondrá en contacto contigo a la brevedad." |
| Éxito: botón | "Cerrar" |

---

### `RefaccionesTab.jsx`

| Elemento | Texto |
|---------|-------|
| Placeholder de búsqueda | "Buscar por código o descripción..." |
| Filtro marca | "Todas las marcas" |
| Filtro categoría | "Todas las categorías" |
| Título de tabla | "Catálogo de Refacciones" |
| Columna 1 | "Código" |
| Columna 2 | "Descripción" |
| Columna 3 | "Categoría" |
| Columna 4 | "Marca" |
| Columna 5 | "Precio Ref." |
| Columna 6 | "Stock" |
| Columna 7 | "Cotizar" |
| Sin resultados | "No se encontraron resultados" |
| Nota inferior | "Los precios mostrados son de referencia. El precio final depende de las condiciones de su contrato con Stellaris." |
| Botón carrito | "Mi Cotización" |
| Diálogo agregar: título | "Agregar a cotización" |
| Diálogo agregar: label | "Cantidad" |
| Diálogo agregar: advertencia stock | "La disponibilidad del stock puede cambiar en el transcurso de la solicitud." |
| Diálogo agregar: nota precios | "Los precios son de referencia. La cotización formal y condiciones de venta se coordinarán con nuestro equipo comercial." |
| Diálogo agregar: cancelar | "Cancelar" |
| Diálogo agregar: confirmar | "Agregar" |
| Panel carrito: título | "Mi Cotización" |
| Carrito vacío | (ícono) + "Agrega refacciones desde el catálogo" |
| Label total | "Total estimado" |
| Atribución | "Se enviará a nombre de {user.nombre}" |
| Nota precios (carrito) | "Los precios son de referencia. La cotización formal y condiciones de venta se coordinarán con nuestro equipo comercial." |
| Botón enviar | "Enviar Cotización" |
| Botón en carga | "Enviando..." |
| Botón vaciar | "Vaciar cotización" |
| Éxito: encabezado | ✅ "Solicitud enviada" |
| Éxito: mensaje | "Nuestro equipo se pondrá en contacto contigo a la brevedad." |
| Éxito: botón | "Cerrar" |

---

### `TicketsPendientesTab.jsx`

| Elemento | Texto |
|---------|-------|
| Label filtro estado | "Estado:" |
| Label filtro prioridad | "Prioridad:" |
| Opción estado 1 | "Todos los estados" |
| Opción estado 2 | "Abierto" |
| Opción estado 3 | "En proceso" |
| Opción estado 4 | "Resuelto" |
| Opción estado 5 | "Cancelado" |
| Opción prioridad 1 | "Todas las prioridades" |
| Opción prioridad 2 | "Baja" |
| Opción prioridad 3 | "Media" |
| Opción prioridad 4 | "Alta" |
| Opción prioridad 5 | "Crítica" |
| Resumen: label 1 | "Total" |
| Resumen: label 2 | "Abiertos" |
| Resumen: label 3 | "En Proceso" |
| Resumen: label 4 | "Resueltos" |
| Sin resultados | "No hay tickets que coincidan con los filtros seleccionados" |
| Label fecha creación | "Creado" |
| Label fecha programada | "Programado" |
| Label técnico | "Técnico" |
| Label notas | "Notas del Técnico:" |

---

### `CotizacionesHistorialTab.jsx`

| Elemento | Texto |
|---------|-------|
| Resumen: label 1 | "Total" |
| Resumen: label 2 | "Pendientes" |
| Resumen: label 3 | "Aceptadas" |
| Resumen: label 4 | "Rechazadas" |
| Label filtro | "Filtrar por estado:" |
| Título sección | "Historial de Cotizaciones" |
| Sin resultados | "No hay cotizaciones que coincidan con el filtro seleccionado." |
| Fila: artículos | "{N} artículo(s)" |
| Columna items 1 | "Código" |
| Columna items 2 | "Descripción" |
| Columna items 3 | "Cantidad" |
| Columna items 4 | "Precio Ref." |
| Columna items 5 | "Subtotal" |
| Label notas | "Notas:" |

---

### `ClientesTab.jsx` (admin)

| Elemento | Texto |
|---------|-------|
| Título | "Gestión de Clientes" |
| Botón crear | "Nuevo Cliente" |
| Placeholder búsqueda | "Buscar cliente..." |
| Columna 1 | "Nombre" |
| Columna 2 | "RFC" |
| Columna 3 | "Robots" |
| Columna 4 | "Estado" |
| Columna 5 | "Acciones" |
| Badge activo | "Activo" (verde) |
| Badge inactivo | "Inactivo" (slate) |
| Acción 1 | "Ver" |
| Acción 2 | Ícono Pencil (Editar) |
| Acción 3 | Ícono Trash2 (Desactivar) |
| Acción 4 | Ícono RotateCcw (Reactivar) |
| Diálogo crear: título | "Nuevo Cliente" |
| Diálogo editar: título | "Editar Cliente" |
| Form label nombre | "Nombre *" |
| Form label RFC | "RFC (opcional)" |
| Diálogo desactivar | "¿Desactivar cliente?" (confirmación) |

---

### `ClienteDetalleDialog.jsx` (admin)

| Elemento | Texto |
|---------|-------|
| Título del diálogo | "Cliente: {nombre}" |
| RFC (si definido) | "RFC: {rfc}" |
| Tab 1 | "Usuarios {count}" |
| Tab 2 | "Robots {count}" |
| Tab 3 | "Tickets {count}" |
| Tab 4 | "Cotizaciones {count}" |
| Usuarios vacío | "No hay usuarios registrados" |
| Robots vacío | "No hay robots registrados" |
| Tickets vacío | "No hay tickets registrados" |
| Cotizaciones vacío | "No hay cotizaciones registradas" |
| Botón nuevo usuario | "+ Nuevo Usuario" |
| Botón nuevo robot | "+ Nuevo Robot" |
| Col usuarios 1 | "Nombre" |
| Col usuarios 2 | "Correo" |
| Col usuarios 3 | "Teléfono" |
| Col usuarios 4 | "Portal" |
| Col usuarios 5 | "Acciones" |
| Col robots 1 | "Modelo" |
| Col robots 2 | "No. Serie Robot" |
| Col robots 3 | "Marca" |
| Col robots 4 | "Estado" |
| Col robots 5 | "Fuente de Poder" |
| Col robots 6 | "No. Serie FdP" |
| Col robots 7 | "Celda" |
| Col robots 8 | "Acciones" |
| Robot sin fuente | "Sin asignar" (itálica, `text-slate-400`) |
| Tooltip ⚡ (sin fuente) | "Agregar Fuente de Poder" |
| Tooltip ⚡ (con fuente) | "Editar Fuente de Poder" |
| Col tickets 1 | "#" |
| Col tickets 2 | "Robot" |
| Col tickets 3 | "Tipo" |
| Col tickets 4 | "Prioridad" |
| Col tickets 5 | "Estado" |
| Col tickets 6 | "Fecha" |
| Col tickets 7 | "Cambiar Estado" |
| Gestionar cotización | "Gestionar" |
| Guardar cotización | "Guardar" |
| Cancelar cotización | "Cancelar" |
| Diálogo usuario crear | "Nuevo Usuario" |
| Diálogo usuario editar | "Editar Usuario" |
| Form usuario: nombre | "Nombre *" |
| Form usuario: correo | "Correo *" |
| Form usuario: teléfono | "Teléfono" |
| Form usuario: contraseña (crear) | "Contraseña *" |
| Form usuario: contraseña (editar) | "Nueva Contraseña (dejar vacío para no cambiar)" |
| Diálogo robot crear | "Nuevo Robot" |
| Diálogo robot editar | "Editar Robot" |
| Form robot: modelo | "Modelo *" |
| Form robot: no. serie | "No. Serie *" |
| Form robot: marca | "Marca *" |
| Form robot: estado | "Estado *" |
| Form robot: celda | "Celda" |
| Form robot: horas | "Horas de Operación" |
| Form robot: f. instalación | "Fecha Instalación" |
| Form robot: próx. mant. | "Próximo Mantenimiento" |
| Diálogo eliminar robot: título | "Eliminar Robot" |
| Diálogo eliminar robot: mensaje | "¿Deseas eliminar {modelo} — {noSerie}? Esta acción no se puede deshacer." |
| Diálogo eliminar robot: advertencia | "Si el robot tiene tickets o mantenimientos asociados, no se podrá eliminar. Cambia su estado a Inactivo en su lugar." |
| Prompt fuente: título | "¿Agregar Fuente de Poder?" |
| Prompt fuente: mensaje | "El robot {modelo} — {noSerie} fue creado exitosamente. ¿Deseas asignarle una Fuente de Poder ahora?" |
| Prompt fuente: omitir | "Omitir" |
| Prompt fuente: agregar | "Agregar Fuente" |
| Diálogo fuente crear | "Agregar Fuente de Poder" |
| Diálogo fuente editar | "Editar Fuente de Poder" |
| Form fuente: marca | "Marca *" |
| Form fuente: modelo | "Modelo *" |
| Form fuente: placeholder modelo | "Ej. AW11/DSQC662" |
| Form fuente: no. serie | "No. Serie *" |
| Botón cerrar diálogo | "Cerrar" |

---

### Mensajes de Error (desde API)

| Evento | Mensaje |
|--------|---------|
| `noSerie` de robot duplicado (por cliente) | "Ya existe un robot con el No. Serie '{noSerie}' para este cliente" |
| `noSerie` de fuente duplicado (globalmente) | "Ya existe una fuente de poder con el No. Serie '{noSerie}' (asignada al robot '{modelo}' del cliente '{cliente}')" |
| Robot tiene registros relacionados | "No se puede eliminar: el robot tiene tickets o mantenimientos asociados. Cambia su estado a Inactivo." |
| Correo ya registrado | "El correo ya está registrado en el portal" |
| Credenciales inválidas | Varía según implementación del servidor |
| Catálogos no encontrados (tickets) | "Catálogos no encontrados. Asegúrese de haber ejecutado el seed de la base de datos." |

---

## 10. Flujos de Usuario (Cliente)

### 10.1 Login del Cliente

1. Abrir `/` o `/ClientLogin`
2. Ingresar correo + contraseña → enviar formulario
3. Servidor valida credenciales, verifica `cuenta.activo`, devuelve cookie JWT
4. Redirigir al Dashboard
5. Dashboard carga y muestra el portal de 5 tabs

---

### 10.2 Ver Flota de Robots (tab "Perfil Flotilla")

1. Las 5 tarjetas de resumen cargan inmediatamente
2. Las tarjetas de robot cargan (una por robot), colapsadas por default
3. Clic en cualquier tarjeta → se expande:
   - Muestra todos los detalles del robot en un grid
   - Si el mantenimiento está vencido → fecha en rojo + "(vencido)"
   - Si no tiene fuente asignada → "—" en el campo Fuente de Poder
   - Debajo de los detalles: botón "Crear Ticket" (azul)
   - Sección de historial de mantenimientos: estadísticas + gráfico de barras (si >1 año) + timeline
4. Clic en "Crear Ticket" → panel lateral se abre con ese robot preseleccionado

---

### 10.3 Crear Ticket

1. Clic en "Nuevo Ticket" (encabezado) O "Crear Ticket" en tarjeta de robot
2. Panel derecho se despliega desde la derecha
3. Seleccionar robot (si no fue preseleccionado), tipo, prioridad, fecha opcional, descripción
4. Clic en "Crear Ticket" → `POST /api/tickets`
5. Éxito: panel muestra ✅ + mensaje de confirmación
6. Cache de query `['tickets']` se invalida

---

### 10.4 Solicitar una Cotización (tab "Refacciones")

1. Explorar catálogo con búsqueda y filtros
2. Clic en "Agregar" en cualquier fila → se abre diálogo
3. Establecer cantidad, confirmar nota sobre precios de referencia
4. "Agregar" añade al carrito (estado en memoria en `Dashboard.jsx`)
5. Repetir para otras partes
6. Clic en botón "Mi Cotización" (muestra badge con conteo de items)
7. Revisar carrito, ajustar cantidades, eliminar items
8. Clic en "Enviar Cotización" → `POST /api/cotizaciones`
9. Éxito: carrito se vacía, panel muestra ✅

---

### 10.5 Ver Historial de Cotizaciones (tab "Cotizaciones")

1. Carga todas las cotizaciones del usuario
2. Tarjetas de resumen: Total / Pendientes / Aceptadas / Rechazadas
3. Filtrar por estado
4. Clic en cualquier fila → se expande mostrando tabla de items y notas

---

### 10.6 Ver Tickets (tab "Tickets")

1. Carga todos los tickets del usuario
2. Filtrar por estado y/o prioridad
3. Las tarjetas muestran: número de ticket, badge de estado, badge de prioridad, tipo, info del robot
4. Cuerpo de tarjeta: descripción
5. Pie de tarjeta: fechas + técnico (si asignado) + notas del técnico (caja azul)

---

## 11. Flujos de Administrador

### 11.1 Login de Admin

Misma página de login. En el Dashboard, `user.rol === 'Admin'` → renderiza AdminPanel en lugar del portal cliente.

---

### 11.2 Gestionar Clientes (tab "Clientes" en AdminPanel)

1. Buscar / filtrar lista de clientes
2. "Nuevo Cliente" → diálogo de creación
3. "Ver" → abrir `ClienteDetalleDialog`
4. Pencil → diálogo de edición (nombre, RFC)
5. Trash2 → desactivar (soft delete)
6. RotateCcw → reactivar

---

### 11.3 Detalle de Cliente — Gestionar Usuarios

1. En `ClienteDetalleDialog`, ir a tab "Usuarios"
2. "Nuevo Usuario" → formulario (nombre, correo, teléfono, contraseña)
3. Crea ambos registros `usuario` y `cuenta` → el usuario ya puede iniciar sesión en el portal
4. Pencil → editar (se puede cambiar correo, lo que actualiza ambos registros)
5. Trash2 → desactivar (tanto `usuario` como `cuenta` se establecen a `activo=false`)
6. RotateCcw → reactivar (ambos se establecen a `activo=true`)

---

### 11.4 Detalle de Cliente — Gestionar Robots

1. Ir a tab "Robots"
2. "Nuevo Robot" → formulario:
   - Modelo, No. Serie (validado único por cliente), Marca, Estado, Celda, Horas, fechas
   - Tras creación: aparece prompt "¿Agregar Fuente de Poder?"
3. "Omitir" → listo
4. "Agregar Fuente" → formulario de fuente: Marca, Modelo, No. Serie (validado globalmente único)
5. Botón ⚡ en robot existente:
   - Gris (sin fuente) → abre formulario de creación de fuente
   - Azul (con fuente) → abre formulario de edición de fuente
6. Pencil → editar campos del robot
7. Trash2 → confirmación de eliminación
   - Si el robot tiene tickets / mantenimientos → se muestra error (no se puede eliminar)
   - Si no → hard delete

---

### 11.5 Detalle de Cliente — Gestionar Tickets

1. Ir a tab "Tickets"
2. Ver lista de tickets de los robots de este cliente
3. La columna "Cambiar Estado" tiene un Select dropdown por ticket
4. Cambiar el estado → `PATCH /api/admin/tickets/:id`

---

### 11.6 Detalle de Cliente — Gestionar Cotizaciones

1. Ir a tab "Cotizaciones"
2. Clic en "Gestionar" en cualquier cotización → formulario inline aparece debajo de la fila
3. Cambiar estado (pendiente/aceptada/rechazada/modificada) + agregar notas
4. Clic en "Guardar" → `PATCH /api/admin/cotizaciones/:id`

---

### 11.7 Gestionar Refacciones (tab "Refacciones" en AdminPanel)

1. Misma vista de catálogo que el cliente pero con botón "Editar" por fila
2. Clic en "Editar" → diálogo con: noParte, descripción, precioVenta, stockActual
3. Guardar → `PATCH /api/admin/refacciones/:id`

---

## 12. Configuración de Despliegue

### 12.1 Servidor

| Componente | Detalle |
|------------|---------|
| Sistema operativo | Linux (Ubuntu/Debian en VPS) |
| Web server | Apache2 con mod_proxy → reverse proxy a Node.js en puerto 4000 |
| Process manager | PM2 |
| Node.js | v18+ (ESM, fetch nativo) |
| Base de datos | MariaDB, nombre de BD `stellaris_dev` |
| Ruta de la app | `/var/www/stellaris/stellaris-automation` |

---

### 12.2 Configuración de Apache (`apache/stellaris.conf`)

Hace proxy de las solicitudes `/api/*` a `http://127.0.0.1:4000` y sirve el build de Vite para todas las demás solicitudes.

---

### 12.3 Configuración de PM2 (`server/ecosystem.config.cjs`)

Gestiona el proceso `server/server.js` con reinicio automático.

---

### 12.4 Comandos de Deploy

```bash
cd /var/www/stellaris/stellaris-automation
git pull
npm run build           # Build del frontend Vite
cd server
npm install             # Instalar / actualizar dependencias
npx prisma generate     # Regenerar cliente Prisma
pm2 restart stellaris   # Reiniciar Node.js
```

---

### 12.5 Variables de Entorno (`server/.env`)

```env
PORT=4000
NODE_ENV=production

DATABASE_URL="mysql://stellaris_dev:PASSWORD@127.0.0.1:3306/stellaris_dev"

JWT_SECRET="<cadena aleatoria de 32+ caracteres>"
JWT_EXPIRES_IN="8h"

# Opcional — requerido para el formulario de contacto por correo
MICROSOFT_TENANT_ID=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_SENDER_EMAIL=
MICROSOFT_RECIPIENT_EMAIL=ventas@stellarisautomation.com
```

---

### 12.6 Notas de Seguridad

| Consideración | Detalle |
|--------------|---------|
| MariaDB bind | Debe estar vinculado a `127.0.0.1` (no `0.0.0.0`) en producción |
| Archivo `.env` | Debe estar en `.gitignore`; nunca debe subirse al repositorio |
| Cookie JWT | httpOnly + sameSite=strict + secure (solo HTTPS en prod) |
| Rate limiting | 10 req/15min por IP en `/api/contact` |
| Express trust proxy | `trust proxy = 1` (Apache establece X-Forwarded-For) |
| Headers HTTP | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin` |
| Límite de body | 32KB para prevenir ataques con payloads grandes |

---

### 12.7 Seed de Base de Datos

El seed debe ejecutarse antes de usar la aplicación para poblar los catálogos (estados, prioridades, tipos de solicitud) y crear la cuenta de administrador inicial.

```bash
cd server
npx prisma db seed
```

**Cuenta de admin creada por el seed:**
- Correo: `admin@stellarisautomation.com`
- Contraseña: `StellarisTempAdmin2026!`

> Cambiar la contraseña del administrador inmediatamente después del primer login en producción.

---

## 13. Limitaciones Conocidas / TODO

| # | Área | Descripción | Impacto |
|---|------|-------------|---------|
| 1 | Tickets | `idUsuario` está hardcodeado a `1` en `POST /api/tickets`. Debe resolverse desde `cuenta.correo → usuario.idUsuario`. | El ticket no queda correctamente asociado al usuario que lo creó |
| 2 | Tickets | `tecnico_asignado: null` en la respuesta del ticket — el sistema de asignación de técnicos no está implementado. | Los técnicos asignados no se muestran en el portal |
| 3 | Correo | El formulario de contacto solo funciona cuando todas las variables `MICROSOFT_*` están configuradas. | El formulario falla silenciosamente o con error si no está configurado Microsoft Graph |
| 4 | MariaDB | El `bind-address` debe estar en `127.0.0.1` en producción (fue temporalmente configurado como `0.0.0.0` para túnel de desarrollo). | Exposición de la BD a interfaces de red en producción |
| 5 | Seed | `npx prisma db seed` debe ejecutarse para poblar catálogos y cuenta admin. Si no se ejecuta, la creación de tickets devuelve error 422. | Portal no funcional sin seed |

---

---

## 14. Flujo de Creación de Fuente de Poder (2 pasos — Admin)

La creación de una Fuente de Poder ocurre en dos pasos opcionales después de crear un robot.

### Estados de React en `ClienteDetalleDialog`

| Estado              | Tipo                          | Descripción                                      |
|---------------------|-------------------------------|--------------------------------------------------|
| `fuentePrompt`      | `{ id, modelo, noSerie }` \| null | Robot recién creado que espera asignación de fuente |
| `fuenteDialog`      | `null \| 'create' \| 'edit'`  | Modo del formulario de fuente                    |
| `fuenteTargetRobotId` | number \| null              | ID del robot al que se asignará la fuente        |
| `fuenteEditId`      | number \| null                | ID de la fuente que se está editando             |
| `fuenteForm`        | `{ idMarca, modelo, noSerie }` | Valores del formulario                          |
| `fuenteSaving`      | boolean                       | Spinner de guardado                              |
| `fuenteError`       | string                        | Mensaje de error del formulario                  |

### Secuencia completa

```
1. Admin crea robot → POST /api/admin/robots → { success: true, id: N }
2. handleRobotSave captura isCreate=true y la respuesta
3. closeRobotDialog() cierra el formulario de robot
4. setFuentePrompt({ id: N, modelo, noSerie }) activa el dialog de prompt
5. Dialog muestra:
   - "¿Deseas agregar la Fuente de Poder para el robot {modelo} ({noSerie})?"
   - Botón "Sí, agregar Fuente de Poder" → openFuenteCreate(id)
   - Botón "Omitir por ahora" → setFuentePrompt(null)
6. openFuenteCreate(robotId):
   - setFuentePrompt(null)
   - setFuenteTargetRobotId(robotId)
   - setFuenteForm({ idMarca: '', modelo: '', noSerie: '' })
   - setFuenteDialog('create')
7. Admin completa formulario de fuente → handleFuenteSave()
8. POST /api/admin/fuentes { idRobot, idMarca, modelo, noSerie }
9. Transacción atómica: crea FuentePoder + actualiza robot.idFuente
10. queryClient.invalidateQueries(['admin-cliente-detail', cliente.id])
11. closeFuenteDialog()
```

### Edición de Fuente Existente

```
1. En tabla de robots, botón ⚡ (azul si robot.fuente !== null)
2. openFuenteEdit(robot):
   - setFuenteEditId(robot.fuente.id)
   - setFuenteTargetRobotId(robot.id)
   - setFuenteForm({ idMarca: robot.fuente.marca, modelo: robot.fuente.modelo, noSerie: robot.fuente.noSerie })
   - setFuenteDialog('edit')
3. PATCH /api/admin/fuentes/:id { idMarca?, modelo?, noSerie? }
```

### Validaciones de Número de Serie

| Contexto            | Regla                                     | Error                                                      |
|---------------------|-------------------------------------------|-------------------------------------------------------------|
| Robot — crear       | Único por cliente                         | `Ya existe un robot con el No. Serie "X" para este cliente` |
| Robot — editar      | Único por cliente, excluyendo robot actual | Mismo mensaje                                              |
| Fuente — crear      | Único globalmente                         | `Ya existe una fuente de poder con el No. Serie "X" (asignada al robot "M" del cliente "C")` |
| Fuente — editar     | Único globalmente, excluyendo fuente actual | `Ya existe una fuente con el No. Serie "X" (asignada al robot "M" del cliente "C")` |

---

## 15. Algoritmos de Salud de Robot (detalle técnico)

### `calcularSalud(robot)` — usado en `PerfilFlotillaTab`

```js
function calcularSalud(robot) {
  let score = 100;
  if (robot.proximo_mantenimiento && new Date(robot.proximo_mantenimiento) < new Date()) score -= 25;
  const lc = (robot.estado ?? '').toLowerCase();
  if (lc.includes('falla'))             score -= 30;
  else if (lc.includes('atenci'))       score -= 15;
  else if (lc.includes('mantenimient')) score -= 10;
  else if (lc.includes('sin'))          score -= 5;
  return Math.max(0, score);
}
```

### `calcularSaludGeneral(robot)` — usado en `ResumenVidaTab`

```js
function calcularSaludGeneral(robot) {
  let score = 100;
  if (!robot.ultimo_mantenimiento) {
    score -= 20;
  } else {
    const diasSinMtto = differenceInDays(new Date(), new Date(robot.ultimo_mantenimiento));
    if (diasSinMtto > 180) score -= 15;
    else if (diasSinMtto > 90) score -= 10;
  }
  if (robot.proximo_mantenimiento && new Date(robot.proximo_mantenimiento) < new Date()) score -= 25;
  const lc = (robot.estado ?? '').toLowerCase();
  if (lc.includes('falla'))             score -= 30;
  else if (lc.includes('atenci'))       score -= 15;
  else if (lc.includes('mantenimient')) score -= 10;
  else if (lc.includes('sin'))          score -= 5;
  return Math.max(0, score);
}
```

**Diferencia clave:** ResumenVidaTab también penaliza por tiempo sin mantenimiento (días desde `ultimo_mantenimiento`), mientras PerfilFlotillaTab solo penaliza por próximo mantenimiento vencido.

### Gráfica de Frecuencia por Año (PerfilFlotillaTab)

La gráfica de barras es CSS puro. Algoritmo de alturas:

```js
// Agrupar mantenimientos por año
const porAnio = mantenimientos.reduce((acc, m) => {
  if (!m.fecha) return acc;
  const anio = m.fecha.slice(0, 4);
  acc[anio] = (acc[anio] ?? 0) + 1;
  return acc;
}, {});
const maxPorAnio = Math.max(...Object.values(porAnio), 1);

// Altura de cada barra: mínimo 4px, máximo 32px
height: `${Math.max(Math.round((count / maxPorAnio) * 32), 4)}px`
```

La gráfica solo se renderiza si `Object.keys(porAnio).length > 1` (más de un año con datos).

---

*Documentación técnica completa del Portal de Cliente Stellaris Automation*
*Generado: 2026-03-09 | Versión: post-migración Express + Prisma + JWT (Base44/Vercel removido)*
