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
import { graphConfigured, getGraphToken, sendMailViaGraph, esc } from '../lib/graph.js';

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
  idEstadoSolicitud: z.number().int().positive().optional(),
  fechaProgramada:   z.string().optional().nullable(),
  motivo:            z.string().min(1, 'Motivo requerido').max(2000),
  idEstadoRobot:     z.number().int().positive().optional(),
});

const mantenimientoCreateSchema = z.object({
  idRobot:           z.number().int().positive(),
  idTicket:          z.number().int().positive().optional().nullable(),
  idFuente:          z.number().int().positive().optional().nullable(),
  idTipoSolicitud:   z.number().int().positive(),
  idEstadoSolicitud: z.number().int().positive(),
  fechaMantenimiento: z.string().optional().nullable(),
  costoTotal:        z.number().min(0).optional().nullable(),
  reporte:           z.string().max(5000).optional().nullable(),
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
        fuente: {
          select: {
            idFuente: true,
            modelo:   true,
            noSerie:  true,
            marca:    { select: { marca: true } },
          },
        },
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
      fuente: r.fuente ? {
        id:      r.fuente.idFuente,
        modelo:  r.fuente.modelo,
        noSerie: r.fuente.noSerie,
        marca:   r.fuente.marca.marca,
      } : null,
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

// ─── GET /api/admin/tickets ──────────────────────────────────────────────────

router.get('/admin/tickets', async (_req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      include: {
        robot:           { select: { idRobot: true, modelo: true, noSerie: true, estado: { select: { idEstado: true } }, cliente: { select: { idCliente: true, nombre: true } } } },
        cuenta:          { select: { nombre: true, correo: true } },
        tipoSolicitud:   { select: { tipo: true } },
        prioridad:       { select: { prioridad: true } },
        estadoSolicitud: { select: { estado: true, idEstadoSolicitud: true } },
      },
      orderBy: { creado: 'desc' },
      take: 500,
    });

    const result = tickets.map((t) => ({
      id:                t.idTicket,
      numero:            `TKT-${String(t.idTicket).padStart(5, '0')}`,
      cliente:           t.robot.cliente.nombre,
      idCliente:         t.robot.cliente.idCliente,
      idRobot:           t.robot.idRobot,
      robot:             `${t.robot.modelo} — ${t.robot.noSerie}`,
      solicitante:       t.cuenta.nombre,
      correo:            t.cuenta.correo,
      tipo:              t.tipoSolicitud.tipo,
      prioridad:         t.prioridad.prioridad,
      estado:            t.estadoSolicitud.estado,
      idEstadoSolicitud: t.estadoSolicitud.idEstadoSolicitud,
      idEstadoRobot:     t.robot.estado?.idEstado ?? null,
      fecha:             t.creado.toISOString().split('T')[0],
      fechaProgramada:   t.fechaProgramada ? t.fechaProgramada.toISOString().split('T')[0] : null,
      detalle:           t.detalle ?? '',
      notasTecnico:      t.notasTecnico ?? null,
    }));

    return res.json(result);
  } catch (err) {
    console.error('[admin/tickets GET]', err instanceof Error ? err.message : String(err));
    return res.status(500).json({ error: 'Error al obtener tickets' });
  }
});

// ─── GET /api/admin/cotizaciones ────────────────────────────────────────────

router.get('/admin/cotizaciones', async (_req, res) => {
  try {
    const cotizaciones = await prisma.cotizacion.findMany({
      include: {
        cuenta: { select: { nombre: true, correo: true } },
        items: {
          include: {
            refaccion: { select: { noParte: true, descripcion: true } },
          },
        },
      },
      orderBy: { creado: 'desc' },
      take: 500,
    });

    // Resolve client name via cuenta.correo → usuario.idCliente → cliente.nombre
    const correos = [...new Set(cotizaciones.map((c) => c.cuenta.correo))];
    const usuarios = correos.length > 0
      ? await prisma.usuario.findMany({
          where:   { correo: { in: correos } },
          select:  { correo: true, idCliente: true, cliente: { select: { nombre: true } } },
        })
      : [];
    const clienteByCorreo = Object.fromEntries(
      usuarios.map((u) => [u.correo, { idCliente: u.idCliente, nombre: u.cliente.nombre }])
    );

    const result = cotizaciones.map((c) => {
      const total = c.items.reduce((sum, i) => sum + i.cantidad * Number(i.precioRef), 0);
      const cli = clienteByCorreo[c.cuenta.correo];
      return {
        id:          c.idCotizacion,
        folio:       `COT-${String(c.idCotizacion).padStart(5, '0')}`,
        cliente:     cli?.nombre ?? '—',
        idCliente:   cli?.idCliente ?? null,
        solicitante: c.cuenta.nombre,
        correo:      c.cuenta.correo,
        fecha:       c.creado.toISOString().split('T')[0],
        estado:      c.estado,
        notas:       c.notas ?? '',
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

    return res.json(result);
  } catch (err) {
    console.error('[admin/cotizaciones GET]', err instanceof Error ? err.message : String(err));
    return res.status(500).json({ error: 'Error al obtener cotizaciones' });
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
    const data = {};
    if (parsed.data.idEstadoSolicitud !== undefined) data.idEstadoSolicitud = parsed.data.idEstadoSolicitud;
    if (parsed.data.fechaProgramada !== undefined) {
      data.fechaProgramada = parsed.data.fechaProgramada ? new Date(parsed.data.fechaProgramada) : null;
    }
    // Persist motivo as notasTecnico
    data.notasTecnico = parsed.data.motivo;

    const updated = await prisma.ticket.update({
      where:   { idTicket: id },
      data,
      include: {
        robot:           { select: { idRobot: true, modelo: true, noSerie: true, marca: { select: { marca: true } } } },
        cuenta:          { select: { nombre: true, correo: true } },
        estadoSolicitud: { select: { estado: true } },
      },
    });

    // Optionally change robot estado
    if (parsed.data.idEstadoRobot !== undefined) {
      await prisma.robot.update({
        where: { idRobot: updated.robot.idRobot },
        data:  { idEstado: parsed.data.idEstadoRobot },
      });
    }

    // Send email notification to client about the update
    if (graphConfigured && updated.cuenta.correo) {
      try {
        const numTicket = `TKT-${String(updated.idTicket).padStart(5, '0')}`;
        const token = await getGraphToken();
        await sendMailViaGraph(token, {
          to: updated.cuenta.correo,
          subject: `[Stellaris] Actualización de ticket ${numTicket}`,
          html: buildTicketUpdateEmail({
            numTicket,
            robot:      `${updated.robot.marca.marca} ${updated.robot.modelo} — ${updated.robot.noSerie}`,
            nuevoEstado: updated.estadoSolicitud.estado,
            motivo:      parsed.data.motivo,
            fechaProgramada: updated.fechaProgramada
              ? updated.fechaProgramada.toISOString().split('T')[0]
              : null,
          }),
        });
      } catch (emailErr) {
        console.error('[admin/tickets email]', emailErr instanceof Error ? emailErr.message : String(emailErr));
      }
    }

    return res.json({ id: updated.idTicket, idEstadoSolicitud: updated.idEstadoSolicitud });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Ticket no encontrado' });
    console.error('[admin/tickets PATCH]', err instanceof Error ? err.message : String(err));
    return res.status(500).json({ error: 'Error al actualizar ticket' });
  }
});

function buildTicketUpdateEmail({ numTicket, robot, nuevoEstado, motivo, fechaProgramada }) {
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" style="background:#f1f5f9;padding:32px 0;"><tr><td align="center">
    <table width="600" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
      <tr><td style="background:linear-gradient(135deg,#1a0a3e 0%,#3d1478 40%,#9b3010 75%,#d4560a 100%);padding:28px 32px;text-align:center;">
        <p style="margin:0;font-size:20px;font-weight:700;color:#fff;">STELLARIS AUTOMATION</p>
        <p style="margin:6px 0 0;font-size:14px;color:rgba(255,255,255,.75);">Actualización de ticket de servicio</p>
      </td></tr>
      <tr><td style="padding:28px 32px;">
        <p style="margin:0 0 16px;font-size:18px;font-weight:700;color:#1e293b;">${esc(numTicket)}</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:8px 0;color:#64748b;width:160px;">Robot</td><td style="padding:8px 0;color:#0f172a;">${esc(robot)}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Nuevo estado</td><td style="padding:8px 0;color:#0f172a;font-weight:700;">${esc(nuevoEstado)}</td></tr>
          ${fechaProgramada ? `<tr><td style="padding:8px 0;color:#64748b;">Fecha programada</td><td style="padding:8px 0;color:#0f172a;">${esc(fechaProgramada)}</td></tr>` : ''}
        </table>
        <div style="margin-top:16px;padding:12px 16px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
          <p style="margin:0 0 4px;font-size:12px;color:#64748b;">Motivo / Comentario del equipo técnico</p>
          <p style="margin:0;font-size:14px;color:#1e293b;">${esc(motivo).replace(/\n/g, '<br>')}</p>
        </div>
        <p style="margin:20px 0 0;font-size:11px;color:#94a3b8;text-align:center;">
          Notificación automática de Stellaris Automation — contacto@soldaduras.com.mx
        </p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

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

// ─── Schemas: robots ─────────────────────────────────────────────────────────

const robotCreateSchema = z.object({
  idCliente:        z.number().int().positive(),
  idMarca:          z.number().int().positive(),
  idEstado:         z.number().int().positive(),
  modelo:           z.string().min(1).max(100),
  noSerie:          z.string().min(1).max(100),
  celda:            z.string().max(50).optional(),
  fechaInstalacion: z.string().optional().nullable(),
  fechaProxMant:    z.string().optional().nullable(),
  horasOperacion:   z.number().int().min(0).optional().default(0),
});

const robotPatchSchema = z.object({
  idMarca:          z.number().int().positive().optional(),
  idEstado:         z.number().int().positive().optional(),
  modelo:           z.string().min(1).max(100).optional(),
  noSerie:          z.string().min(1).max(100).optional(),
  celda:            z.string().max(50).optional().nullable(),
  fechaInstalacion: z.string().optional().nullable(),
  fechaProxMant:    z.string().optional().nullable(),
  horasOperacion:   z.number().int().min(0).optional(),
});

// ─── POST /api/admin/robots ───────────────────────────────────────────────────

router.post('/admin/robots', async (req, res) => {
  const parsed = robotCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors });
  }
  const { idCliente, idMarca, idEstado, modelo, noSerie, celda, fechaInstalacion, fechaProxMant, horasOperacion } = parsed.data;
  try {
    // noSerie uniqueness per client
    const dup = await prisma.robot.findFirst({ where: { noSerie, idCliente } });
    if (dup) {
      return res.status(409).json({ error: `Ya existe un robot con el No. Serie "${noSerie}" para este cliente` });
    }
    const robot = await prisma.robot.create({
      data: {
        idCliente,
        idMarca,
        idEstado,
        modelo,
        noSerie,
        celda:            celda || null,
        fechaInstalacion: fechaInstalacion ? new Date(fechaInstalacion) : null,
        fechaProxMant:    fechaProxMant    ? new Date(fechaProxMant)    : null,
        horasOperacion:   horasOperacion ?? 0,
      },
    });
    return res.status(201).json({ success: true, id: robot.idRobot });
  } catch (err) {
    console.error('[admin/robots POST]', err instanceof Error ? err.message : String(err));
    return res.status(500).json({ error: 'Error al crear robot' });
  }
});

// ─── PATCH /api/admin/robots/:id ──────────────────────────────────────────────

router.patch('/admin/robots/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  const parsed = robotPatchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors });
  }
  try {
    // noSerie uniqueness per client (if changing noSerie)
    if (parsed.data.noSerie !== undefined) {
      const robotActual = await prisma.robot.findUnique({ where: { idRobot: id }, select: { idCliente: true } });
      if (!robotActual) return res.status(404).json({ error: 'Robot no encontrado' });
      const dup = await prisma.robot.findFirst({
        where: { noSerie: parsed.data.noSerie, idCliente: robotActual.idCliente, NOT: { idRobot: id } },
      });
      if (dup) {
        return res.status(409).json({ error: `Ya existe un robot con el No. Serie "${parsed.data.noSerie}" para este cliente` });
      }
    }

    const data = {};
    if (parsed.data.idMarca          !== undefined) data.idMarca          = parsed.data.idMarca;
    if (parsed.data.idEstado         !== undefined) data.idEstado         = parsed.data.idEstado;
    if (parsed.data.modelo           !== undefined) data.modelo           = parsed.data.modelo;
    if (parsed.data.noSerie          !== undefined) data.noSerie          = parsed.data.noSerie;
    if (parsed.data.celda            !== undefined) data.celda            = parsed.data.celda;
    if (parsed.data.horasOperacion   !== undefined) data.horasOperacion   = parsed.data.horasOperacion;
    if (parsed.data.fechaInstalacion !== undefined) data.fechaInstalacion = parsed.data.fechaInstalacion ? new Date(parsed.data.fechaInstalacion) : null;
    if (parsed.data.fechaProxMant    !== undefined) data.fechaProxMant    = parsed.data.fechaProxMant    ? new Date(parsed.data.fechaProxMant)    : null;

    await prisma.robot.update({ where: { idRobot: id }, data });
    return res.json({ success: true });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Robot no encontrado' });
    console.error('[admin/robots PATCH]', err instanceof Error ? err.message : String(err));
    return res.status(500).json({ error: 'Error al actualizar robot' });
  }
});

// ─── DELETE /api/admin/robots/:id ─────────────────────────────────────────────

router.delete('/admin/robots/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  try {
    await prisma.robot.delete({ where: { idRobot: id } });
    return res.json({ success: true });
  } catch (err) {
    if (err.code === 'P2003') return res.status(409).json({ error: 'No se puede eliminar: el robot tiene tickets o mantenimientos asociados. Cambia su estado a Inactivo.' });
    if (err.code === 'P2025') return res.status(404).json({ error: 'Robot no encontrado' });
    console.error('[admin/robots DELETE]', err instanceof Error ? err.message : String(err));
    return res.status(500).json({ error: 'Error al eliminar robot' });
  }
});

// ─── Schemas: fuentes de poder ───────────────────────────────────────────────

const fuenteCreateSchema = z.object({
  idRobot: z.number().int().positive(),
  idMarca: z.number().int().positive(),
  modelo:  z.string().min(1).max(100),
  noSerie: z.string().min(1).max(100),
});

const fuentePatchSchema = z.object({
  idMarca: z.number().int().positive().optional(),
  modelo:  z.string().min(1).max(100).optional(),
  noSerie: z.string().min(1).max(100).optional(),
});

// ─── POST /api/admin/fuentes ──────────────────────────────────────────────────
// Creates a FuentePoder and assigns it to a robot

router.post('/admin/fuentes', async (req, res) => {
  const parsed = fuenteCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors });
  }
  const { idRobot, idMarca, modelo, noSerie } = parsed.data;
  try {
    // Global noSerie uniqueness check
    const existing = await prisma.fuentePoder.findFirst({
      where:   { noSerie },
      include: { robots: { take: 1, include: { cliente: { select: { nombre: true } } } } },
    });
    if (existing) {
      const r = existing.robots[0];
      const ctx = r ? ` (asignada al robot "${r.modelo}" del cliente "${r.cliente.nombre}")` : '';
      return res.status(409).json({ error: `Ya existe una fuente de poder con el No. Serie "${noSerie}"${ctx}` });
    }

    const fuente = await prisma.$transaction(async (tx) => {
      const f = await tx.fuentePoder.create({ data: { idMarca, modelo, noSerie } });
      await tx.robot.update({ where: { idRobot }, data: { idFuente: f.idFuente } });
      return f;
    });
    return res.status(201).json({ id: fuente.idFuente, modelo: fuente.modelo, noSerie: fuente.noSerie });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Robot no encontrado' });
    console.error('[admin/fuentes POST]', err instanceof Error ? err.message : String(err));
    return res.status(500).json({ error: 'Error al crear fuente de poder' });
  }
});

// ─── PATCH /api/admin/fuentes/:id ─────────────────────────────────────────────

router.patch('/admin/fuentes/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  const parsed = fuentePatchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors });
  }
  try {
    if (parsed.data.noSerie !== undefined) {
      const existing = await prisma.fuentePoder.findFirst({
        where:   { noSerie: parsed.data.noSerie, NOT: { idFuente: id } },
        include: { robots: { take: 1, include: { cliente: { select: { nombre: true } } } } },
      });
      if (existing) {
        const r = existing.robots[0];
        const ctx = r ? ` (asignada al robot "${r.modelo}" del cliente "${r.cliente.nombre}")` : '';
        return res.status(409).json({ error: `Ya existe una fuente con el No. Serie "${parsed.data.noSerie}"${ctx}` });
      }
    }
    const data = {};
    if (parsed.data.idMarca !== undefined) data.idMarca = parsed.data.idMarca;
    if (parsed.data.modelo  !== undefined) data.modelo  = parsed.data.modelo;
    if (parsed.data.noSerie !== undefined) data.noSerie = parsed.data.noSerie;

    await prisma.fuentePoder.update({ where: { idFuente: id }, data });
    return res.json({ success: true });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Fuente no encontrada' });
    console.error('[admin/fuentes PATCH]', err instanceof Error ? err.message : String(err));
    return res.status(500).json({ error: 'Error al actualizar fuente de poder' });
  }
});

// ─── GET /api/admin/mantenimientos ───────────────────────────────────────────

router.get('/admin/mantenimientos', async (_req, res) => {
  try {
    const mantenimientos = await prisma.mantenimiento.findMany({
      include: {
        robot:           { select: { modelo: true, noSerie: true, marca: { select: { marca: true } }, cliente: { select: { idCliente: true, nombre: true } } } },
        cuenta:          { select: { nombre: true } },
        ticket:          { select: { idTicket: true } },
        fuente:          { select: { modelo: true, noSerie: true } },
        tipoSolicitud:   { select: { tipo: true } },
        estadoSolicitud: { select: { estado: true } },
      },
      orderBy: { creado: 'desc' },
      take: 500,
    });

    const result = mantenimientos.map((m) => ({
      id:                  m.idMantenimiento,
      folio:               `MNT-${String(m.idMantenimiento).padStart(5, '0')}`,
      cliente:             m.robot.cliente.nombre,
      idCliente:           m.robot.cliente.idCliente,
      robot:               `${m.robot.marca.marca} ${m.robot.modelo} — ${m.robot.noSerie}`,
      tecnico:             m.cuenta.nombre,
      ticket:              m.ticket ? `TKT-${String(m.ticket.idTicket).padStart(5, '0')}` : null,
      idTicket:            m.idTicket,
      fuente:              m.fuente ? `${m.fuente.modelo} — ${m.fuente.noSerie}` : null,
      tipo:                m.tipoSolicitud.tipo,
      estado:              m.estadoSolicitud.estado,
      fechaMantenimiento:  m.fechaMantenimiento ? m.fechaMantenimiento.toISOString().split('T')[0] : null,
      costoTotal:          m.costoTotal ? Number(m.costoTotal) : null,
      reporte:             m.reporte ?? '',
      fecha:               m.creado.toISOString().split('T')[0],
    }));

    return res.json(result);
  } catch (err) {
    console.error('[admin/mantenimientos GET]', err instanceof Error ? err.message : String(err));
    return res.status(500).json({ error: 'Error al obtener mantenimientos' });
  }
});

// ─── POST /api/admin/mantenimientos ──────────────────────────────────────────

router.post('/admin/mantenimientos', async (req, res) => {
  const parsed = mantenimientoCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors });
  }

  const { idRobot, idTicket, idFuente, idTipoSolicitud, idEstadoSolicitud, fechaMantenimiento, costoTotal, reporte } = parsed.data;

  try {
    const mantenimiento = await prisma.mantenimiento.create({
      data: {
        idCuenta:          req.user.idCuenta,
        idRobot,
        idTicket:          idTicket || null,
        idFuente:          idFuente || null,
        idTipoSolicitud,
        idEstadoSolicitud,
        fechaMantenimiento: fechaMantenimiento ? new Date(fechaMantenimiento) : null,
        costoTotal:        costoTotal ?? null,
        reporte:           reporte || null,
      },
    });

    return res.status(201).json({
      success: true,
      id:      mantenimiento.idMantenimiento,
      folio:   `MNT-${String(mantenimiento.idMantenimiento).padStart(5, '0')}`,
    });
  } catch (err) {
    console.error('[admin/mantenimientos POST]', err instanceof Error ? err.message : String(err));
    return res.status(500).json({ error: 'Error al crear mantenimiento' });
  }
});

export default router;

