// server/routes/admin.js
// Admin-only routes — all require idRol === 1
//
// GET    /api/admin/catalogos          — lookup tables
// GET    /api/admin/clientes           — list all clients
// POST   /api/admin/clientes           — create client
// PATCH  /api/admin/clientes/:id       — update client
// DELETE /api/admin/clientes/:id       — soft-delete client
// GET    /api/admin/clientes/:id       — full client detail
// PATCH  /api/admin/refacciones/:id    — edit refaccion fields
// PATCH  /api/admin/tickets/:id        — update ticket status
// PATCH  /api/admin/cotizaciones/:id   — update cotizacion estado/notas

import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import prisma from '../lib/prisma.js';

const router = Router();

// ─── Inline admin guard ───────────────────────────────────────────────────────

function adminOnly(req, res, next) {
  if (req.user?.idRol !== 1) {
    return res.status(403).json({ error: 'Acceso restringido a administradores' });
  }
  next();
}

router.use('/admin', adminOnly);

// ─── Zod schemas ─────────────────────────────────────────────────────────────

const clienteCreateSchema = z.object({
  nombre: z.string().min(2, 'Nombre requerido (mínimo 2 caracteres)').max(200),
  rfc:    z.string().max(20).optional(),
});

const clientePatchSchema = z.object({
  nombre: z.string().min(2).max(200).optional(),
  rfc:    z.string().max(20).optional(),
  activo: z.boolean().optional(),
});

const refaccionPatchSchema = z.object({
  descripcion: z.string().max(500).optional(),
  noParte:     z.string().max(100).optional(),
  precioVenta: z.number().min(0).optional(),
  stockActual: z.number().int().min(0).optional(),
});

const ticketPatchSchema = z.object({
  idEstadoSolicitud: z.number().int().positive(),
});

const cotizacionPatchSchema = z.object({
  estado: z.enum(['pendiente', 'aceptada', 'rechazada', 'modificada']),
  notas:  z.string().max(2000).optional(),
});

// ─── GET /api/admin/catalogos ─────────────────────────────────────────────────

router.get('/admin/catalogos', async (_req, res) => {
  try {
    const [estados, prioridades, tipos, estadosRobot] = await Promise.all([
      prisma.estadoSolicitud.findMany({
        select:  { idEstadoSolicitud: true, estado: true },
        orderBy: { idEstadoSolicitud: 'asc' },
      }),
      prisma.prioridad.findMany({
        select:  { idPrioridad: true, prioridad: true },
        orderBy: { idPrioridad: 'asc' },
      }),
      prisma.tipoSolicitud.findMany({
        select:  { idTipoSolicitud: true, tipo: true },
        orderBy: { idTipoSolicitud: 'asc' },
      }),
      prisma.estadoRobot.findMany({
        select:  { idEstado: true, estado: true },
        orderBy: { idEstado: 'asc' },
      }),
    ]);
    return res.json({ estados, prioridades, tipos, estadosRobot });
  } catch (err) {
    console.error('[admin/catalogos]', err instanceof Error ? err.message : String(err));
    return res.status(500).json({ error: 'Error al obtener catálogos' });
  }
});

// ─── GET /api/admin/clientes ──────────────────────────────────────────────────

router.get('/admin/clientes', async (_req, res) => {
  try {
    const clientes = await prisma.cliente.findMany({
      include: { _count: { select: { robots: true } } },
      orderBy: { nombre: 'asc' },
    });
    const result = clientes.map((c) => ({
      id:     c.idCliente,
      nombre: c.nombre,
      rfc:    c.rfc ?? '',
      activo: c.activo,
      robots: c._count.robots,
    }));
    return res.json(result);
  } catch (err) {
    console.error('[admin/clientes GET]', err instanceof Error ? err.message : String(err));
    return res.status(500).json({ error: 'Error al obtener clientes' });
  }
});

// ─── POST /api/admin/clientes ─────────────────────────────────────────────────

router.post('/admin/clientes', async (req, res) => {
  const parsed = clienteCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors });
  }
  try {
    const cliente = await prisma.cliente.create({
      data:    { nombre: parsed.data.nombre, rfc: parsed.data.rfc ?? null },
      include: { _count: { select: { robots: true } } },
    });
    return res.status(201).json({
      id:     cliente.idCliente,
      nombre: cliente.nombre,
      rfc:    cliente.rfc ?? '',
      activo: cliente.activo,
      robots: cliente._count.robots,
    });
  } catch (err) {
    console.error('[admin/clientes POST]', err instanceof Error ? err.message : String(err));
    return res.status(500).json({ error: 'Error al crear cliente' });
  }
});

// ─── PATCH /api/admin/clientes/:id ───────────────────────────────────────────

router.patch('/admin/clientes/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  const parsed = clientePatchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors });
  }
  try {
    const cliente = await prisma.cliente.update({
      where:   { idCliente: id },
      data:    parsed.data,
      include: { _count: { select: { robots: true } } },
    });
    return res.json({
      id:     cliente.idCliente,
      nombre: cliente.nombre,
      rfc:    cliente.rfc ?? '',
      activo: cliente.activo,
      robots: cliente._count.robots,
    });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Cliente no encontrado' });
    console.error('[admin/clientes PATCH]', err instanceof Error ? err.message : String(err));
    return res.status(500).json({ error: 'Error al actualizar cliente' });
  }
});

// ─── DELETE /api/admin/clientes/:id ──────────────────────────────────────────
// Soft delete: sets activo = false

router.delete('/admin/clientes/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
  try {
    await prisma.cliente.update({
      where: { idCliente: id },
      data:  { activo: false },
    });
    return res.json({ success: true });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Cliente no encontrado' });
    console.error('[admin/clientes DELETE]', err instanceof Error ? err.message : String(err));
    return res.status(500).json({ error: 'Error al desactivar cliente' });
  }
});

// ─── GET /api/admin/clientes/:id ─────────────────────────────────────────────
// Full detail: robots, tickets, cotizaciones

router.get('/admin/clientes/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  try {
    // 1. Fetch base cliente
    const cliente = await prisma.cliente.findUnique({
      where: { idCliente: id },
    });
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });

    // 2. Robots for this client
    const robots = await prisma.robot.findMany({
      where:   { idCliente: id },
      include: {
        marca:  { select: { marca: true } },
        estado: { select: { estado: true } },
      },
      orderBy: { idRobot: 'asc' },
    });

    // 3. Tickets via robot.idCliente
    const tickets = await prisma.ticket.findMany({
      where:   { robot: { idCliente: id } },
      include: {
        robot:           { select: { modelo: true, noSerie: true } },
        tipoSolicitud:   { select: { tipo: true } },
        prioridad:       { select: { prioridad: true } },
        estadoSolicitud: { select: { estado: true, idEstadoSolicitud: true } },
      },
      orderBy: { creado: 'desc' },
      take:    200,
    });

    // 4. Cotizaciones — find usuarios for this cliente then match cuentas by correo
    const usuarios = await prisma.usuario.findMany({
      where:  { idCliente: id },
      select: { correo: true },
    });
    const correos = usuarios.map((u) => u.correo);

    const cotizaciones = correos.length === 0 ? [] : await prisma.cotizacion.findMany({
      where: { cuenta: { correo: { in: correos } } },
      include: {
        cuenta: { select: { nombre: true, correo: true } },
        items: {
          include: {
            refaccion: { select: { noParte: true, descripcion: true } },
          },
        },
      },
      orderBy: { creado: 'desc' },
    });

    // Normalize
    const robotsResult = robots.map((r) => ({
      id:               r.idRobot,
      modelo:           r.modelo,
      noSerie:          r.noSerie,
      marca:            r.marca.marca,
      celda:            r.celda ?? '',
      estado:           r.estado.estado,
      fechaInstalacion: r.fechaInstalacion ? r.fechaInstalacion.toISOString().split('T')[0] : null,
      fechaProxMant:    r.fechaProxMant    ? r.fechaProxMant.toISOString().split('T')[0]    : null,
      horasOperacion:   r.horasOperacion ?? 0,
    }));

    const ticketsResult = tickets.map((t) => ({
      id:              t.idTicket,
      numero:          `TKT-${String(t.idTicket).padStart(5, '0')}`,
      robot:           `${t.robot.modelo} — ${t.robot.noSerie}`,
      tipo:            t.tipoSolicitud.tipo,
      prioridad:       t.prioridad.prioridad,
      estado:          t.estadoSolicitud.estado,
      idEstadoSolicitud: t.estadoSolicitud.idEstadoSolicitud,
      fecha:           t.creado.toISOString().split('T')[0],
      detalle:         t.detalle ?? '',
    }));

    const cotizacionesResult = cotizaciones.map((c) => {
      const total = c.items.reduce((sum, i) => sum + i.cantidad * Number(i.precioRef), 0);
      return {
        id:         c.idCotizacion,
        solicitante: c.cuenta.nombre,
        correo:     c.cuenta.correo,
        fecha:      c.creado.toISOString().split('T')[0],
        estado:     c.estado,
        notas:      c.notas ?? '',
        total,
        items: c.items.map((i) => ({
          id:          i.idItem,
          codigo:      i.refaccion.noParte,
          descripcion: i.refaccion.descripcion ?? i.refaccion.noParte,
          cantidad:    i.cantidad,
          precioRef:   Number(i.precioRef),
          subtotal:    i.cantidad * Number(i.precioRef),
        })),
      };
    });

    return res.json({
      cliente: {
        id:     cliente.idCliente,
        nombre: cliente.nombre,
        rfc:    cliente.rfc ?? '',
        activo: cliente.activo,
      },
      robots:       robotsResult,
      tickets:      ticketsResult,
      cotizaciones: cotizacionesResult,
    });
  } catch (err) {
    console.error('[admin/clientes/:id GET]', err instanceof Error ? err.message : String(err));
    return res.status(500).json({ error: 'Error al obtener detalle del cliente' });
  }
});

// ─── PATCH /api/admin/refacciones/:id ────────────────────────────────────────

router.patch('/admin/refacciones/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  const parsed = refaccionPatchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors });
  }
  try {
    const data = {};
    if (parsed.data.descripcion !== undefined) data.descripcion = parsed.data.descripcion;
    if (parsed.data.noParte     !== undefined) data.noParte     = parsed.data.noParte;
    if (parsed.data.precioVenta !== undefined) data.precioVenta = parsed.data.precioVenta;
    if (parsed.data.stockActual !== undefined) data.stockActual = parsed.data.stockActual;
    const updated = await prisma.refaccion.update({
      where: { idRefaccion: id },
      data,
    });
    return res.json({ id: updated.idRefaccion, noParte: updated.noParte, descripcion: updated.descripcion, precioVenta: Number(updated.precioVenta), stockActual: updated.stockActual });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Refacción no encontrada' });
    console.error('[admin/refacciones PATCH]', err instanceof Error ? err.message : String(err));
    return res.status(500).json({ error: 'Error al actualizar refacción' });
  }
});

// ─── PATCH /api/admin/tickets/:id ────────────────────────────────────────────

router.patch('/admin/tickets/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  const parsed = ticketPatchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors });
  }
  try {
    const updated = await prisma.ticket.update({
      where: { idTicket: id },
      data:  { idEstadoSolicitud: parsed.data.idEstadoSolicitud },
    });
    return res.json({ id: updated.idTicket, idEstadoSolicitud: updated.idEstadoSolicitud });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Ticket no encontrado' });
    console.error('[admin/tickets PATCH]', err instanceof Error ? err.message : String(err));
    return res.status(500).json({ error: 'Error al actualizar ticket' });
  }
});

// ─── PATCH /api/admin/cotizaciones/:id ───────────────────────────────────────

router.patch('/admin/cotizaciones/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  const parsed = cotizacionPatchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors });
  }
  try {
    const updated = await prisma.cotizacion.update({
      where: { idCotizacion: id },
      data:  { estado: parsed.data.estado, notas: parsed.data.notas },
    });
    return res.json({ id: updated.idCotizacion, estado: updated.estado });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Cotización no encontrada' });
    console.error('[admin/cotizaciones PATCH]', err instanceof Error ? err.message : String(err));
    return res.status(500).json({ error: 'Error al actualizar cotización' });
  }
});

// ─── Schemas: usuarios ───────────────────────────────────────────────────────

const usuarioCreateSchema = z.object({
  idCliente: z.number().int().positive(),
  nombre:    z.string().min(2).max(120),
  correo:    z.string().email().max(200),
  telefono:  z.string().max(40).optional().default(''),
  password:  z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').max(200),
});

const usuarioPatchSchema = z.object({
  nombre:   z.string().min(2).max(120).optional(),
  correo:   z.string().email().max(200).optional(),
  telefono: z.string().max(40).optional(),
  password: z.string().min(6).max(200).optional(),
});

// ─── GET /api/admin/clientes/:id/usuarios ────────────────────────────────────

router.get('/admin/clientes/:id/usuarios', async (req, res) => {
  const idCliente = parseInt(req.params.id, 10);
  if (isNaN(idCliente)) return res.status(400).json({ error: 'ID inválido' });

  try {
    const usuarios = await prisma.usuario.findMany({
      where:   { idCliente },
      orderBy: { nombre: 'asc' },
    });

    const correos = usuarios.map((u) => u.correo);
    const cuentas = correos.length > 0
      ? await prisma.cuenta.findMany({
          where:  { correo: { in: correos } },
          select: { correo: true, activo: true, idCuenta: true },
        })
      : [];

    const byCorreo = Object.fromEntries(cuentas.map((c) => [c.correo, c]));

    return res.json(usuarios.map((u) => ({
      id:           u.idUsuario,
      nombre:       u.nombre,
      correo:       u.correo,
      telefono:     u.telefono ?? '',
      activo:       u.activo,
      portalActivo: byCorreo[u.correo]?.activo ?? false,
      idCuenta:     byCorreo[u.correo]?.idCuenta ?? null,
    })));
  } catch (err) {
    console.error('[admin/clientes/:id/usuarios]', err instanceof Error ? err.message : String(err));
    return res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// ─── POST /api/admin/usuarios ─────────────────────────────────────────────────

router.post('/admin/usuarios', async (req, res) => {
  const parsed = usuarioCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors });
  }

  const { idCliente, nombre, correo, telefono, password } = parsed.data;

  try {
    const exists = await prisma.cuenta.findUnique({ where: { correo } });
    if (exists) return res.status(409).json({ error: 'El correo ya está registrado en el portal' });

    const rolUsuario = await prisma.rol.findFirst({
      where:   { nombre: { not: 'Admin' } },
      orderBy: { idRol: 'asc' },
    });
    if (!rolUsuario) return res.status(500).json({ error: 'No se encontró rol de usuario' });

    const hash = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.usuario.create({
        data: { nombre, correo, telefono: telefono || null, idCliente, idRol: rolUsuario.idRol, activo: true },
      }),
      prisma.cuenta.create({
        data: { nombre, correo, passwordHash: hash, idRol: rolUsuario.idRol, activo: true },
      }),
    ]);

    return res.status(201).json({ success: true });
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'El correo ya está registrado' });
    console.error('[admin/usuarios POST]', err instanceof Error ? err.message : String(err));
    return res.status(500).json({ error: 'Error al crear usuario' });
  }
});

// ─── PATCH /api/admin/usuarios/:id ───────────────────────────────────────────

router.patch('/admin/usuarios/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  const parsed = usuarioPatchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors });
  }

  try {
    const usuario = await prisma.usuario.findUnique({ where: { idUsuario: id } });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    const { nombre, correo, telefono, password } = parsed.data;

    await prisma.usuario.update({
      where: { idUsuario: id },
      data: {
        ...(nombre   !== undefined ? { nombre }                    : {}),
        ...(correo   !== undefined ? { correo }                    : {}),
        ...(telefono !== undefined ? { telefono: telefono || null } : {}),
      },
    });

    const cuentaData = {};
    if (nombre   !== undefined) cuentaData.nombre = nombre;
    if (correo   !== undefined) cuentaData.correo = correo;
    if (password !== undefined) cuentaData.passwordHash = await bcrypt.hash(password, 12);

    if (Object.keys(cuentaData).length > 0) {
      await prisma.cuenta.updateMany({ where: { correo: usuario.correo }, data: cuentaData });
    }

    return res.json({ success: true });
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'El correo ya está en uso' });
    console.error('[admin/usuarios PATCH]', err instanceof Error ? err.message : String(err));
    return res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

// ─── DELETE /api/admin/usuarios/:id (desactivar) ─────────────────────────────

router.delete('/admin/usuarios/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  try {
    const usuario = await prisma.usuario.findUnique({ where: { idUsuario: id } });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    await prisma.$transaction([
      prisma.usuario.update({ where: { idUsuario: id }, data: { activo: false } }),
      prisma.cuenta.updateMany({ where: { correo: usuario.correo }, data: { activo: false } }),
    ]);

    return res.json({ success: true });
  } catch (err) {
    console.error('[admin/usuarios DELETE]', err instanceof Error ? err.message : String(err));
    return res.status(500).json({ error: 'Error al desactivar usuario' });
  }
});

// ─── PUT /api/admin/usuarios/:id/reactivar ────────────────────────────────────

router.put('/admin/usuarios/:id/reactivar', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  try {
    const usuario = await prisma.usuario.findUnique({ where: { idUsuario: id } });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    await prisma.$transaction([
      prisma.usuario.update({ where: { idUsuario: id }, data: { activo: true } }),
      prisma.cuenta.updateMany({ where: { correo: usuario.correo }, data: { activo: true } }),
    ]);

    return res.json({ success: true });
  } catch (err) {
    console.error('[admin/usuarios reactivar]', err instanceof Error ? err.message : String(err));
    return res.status(500).json({ error: 'Error al reactivar usuario' });
  }
});

export default router;
