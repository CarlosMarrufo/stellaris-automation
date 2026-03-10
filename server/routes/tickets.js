// server/routes/tickets.js
// GET  /api/tickets — Lista tickets del usuario autenticado.
// POST /api/tickets — Crea un nuevo ticket de servicio.
//
// Requiere autenticación JWT (middleware authRequired ya aplicado en server.js).

import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { graphConfigured, getGraphToken, sendMailViaGraph, esc } from '../lib/graph.js';

const router = Router();

const RECIPIENT = process.env.MICROSOFT_RECIPIENT_EMAIL || 'contacto@stellarisautomation.com';
const ESCALATION_CC = 'bernardo.rodriguez@soldaduras.com.mx';

// ─── Validación POST ─────────────────────────────────────────────────────────

const createTicketSchema = z.object({
  idRobot:        z.number().int().positive('Robot requerido'),
  tipo_servicio:  z.string().min(1, 'Tipo de servicio requerido').max(80),
  prioridad:      z.string().min(1, 'Prioridad requerida').max(50),
  descripcion:    z.string().min(1, 'Descripción requerida').max(2000),
  fecha_programada: z.string().optional().nullable(),
});

// ─── GET /api/tickets ─────────────────────────────────────────────────────────

router.get('/tickets', async (req, res) => {
  try {
    const { idCuenta, idRol } = req.user;

    // Admin ve todos; otros ven solo los suyos
    const where = idRol === 1 ? {} : { idCuenta };

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        robot:          { select: { modelo: true, noSerie: true } },
        prioridad:      { select: { prioridad: true } },
        tipoSolicitud:  { select: { tipo: true } },
        estadoSolicitud:{ select: { estado: true } },
        cuenta:         { select: { nombre: true } },
      },
      orderBy: { creado: 'desc' },
      take: 100,
    });

    const result = tickets.map((t) => ({
      id:              t.idTicket,
      numero_ticket:   `TKT-${String(t.idTicket).padStart(5, '0')}`,
      robot:           `${t.robot.modelo} — ${t.robot.noSerie}`,
      tipo_servicio:   t.tipoSolicitud.tipo,
      prioridad:       t.prioridad.prioridad.toLowerCase(),
      estado:          t.estadoSolicitud.estado.toLowerCase(),
      descripcion:     t.detalle ?? '',
      notas_tecnico:   t.notasTecnico ?? null,
      fecha_creacion:  t.creado.toISOString().split('T')[0],
      fecha_programada: t.fechaProgramada ? t.fechaProgramada.toISOString().split('T')[0] : null,
      tecnico_asignado: null,
    }));

    return res.json(result);
  } catch (err) {
    console.error('[api/tickets GET]', err instanceof Error ? err.message : String(err));
    return res.status(500).json({ error: 'Error al obtener tickets' });
  }
});

// ─── POST /api/tickets ────────────────────────────────────────────────────────

router.post('/tickets', async (req, res) => {
  const parsed = createTicketSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error:   'Datos inválidos',
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const { idRobot, tipo_servicio, prioridad, descripcion, fecha_programada } = parsed.data;
  const { idCuenta } = req.user;

  try {
    // Resolver catálogos por nombre (case-insensitive)
    const [tipoSolicitud, prioridadRec, estadoAbierto] = await Promise.all([
      prisma.tipoSolicitud.findFirst({
        where: { tipo: { contains: tipo_servicio } },
      }),
      prisma.prioridad.findFirst({
        where: { prioridad: { contains: prioridad } },
      }),
      prisma.estadoSolicitud.findFirst({
        where: { estado: { contains: 'Abierto' } },
      }),
    ]);

    if (!tipoSolicitud || !prioridadRec || !estadoAbierto) {
      return res.status(422).json({
        error: 'Catálogos no encontrados. Asegúrese de haber ejecutado el seed de la base de datos.',
      });
    }

    // Verificar que el robot existe
    const robot = await prisma.robot.findUnique({
      where: { idRobot },
      include: { marca: { select: { marca: true } }, cliente: { select: { nombre: true } } },
    });
    if (!robot) {
      return res.status(404).json({ error: 'Robot no encontrado' });
    }

    // Verificar que no haya un ticket pendiente (abierto) para este robot
    const ticketPendiente = await prisma.ticket.findFirst({
      where: {
        idRobot,
        idEstadoSolicitud: estadoAbierto.idEstadoSolicitud,
      },
      select: { idTicket: true },
    });

    if (ticketPendiente) {
      return res.status(409).json({
        error: `Ya existe un ticket abierto (TKT-${String(ticketPendiente.idTicket).padStart(5, '0')}) para este robot. Debe ser atendido antes de crear otro.`,
      });
    }

    const ticket = await prisma.ticket.create({
      data: {
        idCuenta,
        idRobot,
        idUsuario:        1,
        idPrioridad:      prioridadRec.idPrioridad,
        idTipoSolicitud:  tipoSolicitud.idTipoSolicitud,
        idEstadoSolicitud: estadoAbierto.idEstadoSolicitud,
        fechaProgramada:  fecha_programada ? new Date(fecha_programada) : null,
        detalle:          descripcion,
      },
    });

    const numTicket = `TKT-${String(ticket.idTicket).padStart(5, '0')}`;

    // Enviar email de notificación interna
    if (graphConfigured) {
      try {
        const cuenta = await prisma.cuenta.findUnique({ where: { idCuenta }, select: { nombre: true, correo: true } });
        const token = await getGraphToken();
        await sendMailViaGraph(token, {
          to:      RECIPIENT,
          replyTo: cuenta ? { name: cuenta.nombre, address: cuenta.correo } : null,
          subject: `[Stellaris] Nuevo ticket ${numTicket} — ${robot.marca.marca} ${robot.modelo}`,
          html:    buildTicketEmail({
            numTicket,
            cliente:     robot.cliente.nombre,
            solicitante: cuenta?.nombre ?? 'N/D',
            correo:      cuenta?.correo ?? 'N/D',
            robot:       `${robot.marca.marca} ${robot.modelo} — S/N ${robot.noSerie}`,
            tipo:        tipoSolicitud.tipo,
            prioridad:   prioridadRec.prioridad,
            descripcion,
            fechaProgramada: fecha_programada || null,
          }),
        });
      } catch (emailErr) {
        console.error('[tickets/email]', emailErr instanceof Error ? emailErr.message : String(emailErr));
      }
    }

    return res.status(201).json({
      success:       true,
      numero_ticket: numTicket,
      idTicket:      ticket.idTicket,
    });
  } catch (err) {
    console.error('[api/tickets POST]', err instanceof Error ? err.message : String(err));
    return res.status(500).json({ error: 'Error al crear el ticket' });
  }
});

// ─── Escalation check helper (called from server.js interval) ───────────────

export async function checkEscalation() {
  if (!graphConfigured) return;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find tickets created today that are still "abierto"
    const estadoAbierto = await prisma.estadoSolicitud.findFirst({
      where: { estado: { contains: 'Abierto' } },
    });
    if (!estadoAbierto) return;

    const ticketsSinAtender = await prisma.ticket.findMany({
      where: {
        idEstadoSolicitud: estadoAbierto.idEstadoSolicitud,
        creado: { gte: today, lt: tomorrow },
      },
      include: {
        robot:          { select: { modelo: true, noSerie: true, marca: { select: { marca: true } }, cliente: { select: { nombre: true } } } },
        cuenta:         { select: { nombre: true, correo: true } },
        tipoSolicitud:  { select: { tipo: true } },
        prioridad:      { select: { prioridad: true } },
      },
    });

    if (ticketsSinAtender.length === 0) return;

    const token = await getGraphToken();

    const listHtml = ticketsSinAtender.map((t) => `
      <tr>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;font-family:monospace;">TKT-${String(t.idTicket).padStart(5, '0')}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;">${esc(t.robot.cliente.nombre)}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;">${esc(t.robot.marca.marca)} ${esc(t.robot.modelo)}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;">${esc(t.tipoSolicitud.tipo)}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;">${esc(t.prioridad.prioridad)}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;">${esc(t.cuenta.nombre)}</td>
      </tr>
    `).join('');

    const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
  <table width="100%" style="background:#f1f5f9;padding:24px 0;"><tr><td align="center">
    <table width="700" style="max-width:700px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
      <tr><td style="background:#dc2626;padding:24px 32px;text-align:center;">
        <p style="margin:0;font-size:20px;font-weight:700;color:#fff;">ESCALAMIENTO — Tickets sin atender</p>
        <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,.8);">${ticketsSinAtender.length} ticket(s) creados hoy sin respuesta del equipo técnico</p>
      </td></tr>
      <tr><td style="padding:24px 32px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;">
          <thead><tr style="background:#f8fafc;">
            <th style="padding:8px 10px;text-align:left;color:#475569;">Ticket</th>
            <th style="padding:8px 10px;text-align:left;color:#475569;">Cliente</th>
            <th style="padding:8px 10px;text-align:left;color:#475569;">Robot</th>
            <th style="padding:8px 10px;text-align:left;color:#475569;">Tipo</th>
            <th style="padding:8px 10px;text-align:left;color:#475569;">Prioridad</th>
            <th style="padding:8px 10px;text-align:left;color:#475569;">Solicitante</th>
          </tr></thead>
          <tbody>${listHtml}</tbody>
        </table>
        <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;text-align:center;">
          Este correo fue generado automáticamente por el sistema Stellaris.
        </p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;

    await sendMailViaGraph(token, {
      to:      RECIPIENT,
      cc:      ESCALATION_CC,
      subject: `[Stellaris] ESCALAMIENTO — ${ticketsSinAtender.length} ticket(s) sin atender hoy`,
      html,
    });

    console.log(`[escalation] Sent escalation email for ${ticketsSinAtender.length} ticket(s)`);
  } catch (err) {
    console.error('[escalation]', err instanceof Error ? err.message : String(err));
  }
}

// ─── Ticket notification email builder ──────────────────────────────────────

function buildTicketEmail({ numTicket, cliente, solicitante, correo, robot, tipo, prioridad, descripcion, fechaProgramada }) {
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" style="background:#f1f5f9;padding:32px 0;"><tr><td align="center">
    <table width="600" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
      <tr><td style="background:linear-gradient(135deg,#1a0a3e 0%,#3d1478 40%,#9b3010 75%,#d4560a 100%);padding:28px 32px;text-align:center;">
        <p style="margin:0;font-size:20px;font-weight:700;color:#fff;">STELLARIS AUTOMATION</p>
        <p style="margin:6px 0 0;font-size:14px;color:rgba(255,255,255,.75);">Nuevo ticket de servicio</p>
      </td></tr>
      <tr><td style="padding:28px 32px;">
        <p style="margin:0 0 16px;font-size:18px;font-weight:700;color:#1e293b;">${esc(numTicket)}</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:8px 0;color:#64748b;width:140px;">Cliente</td><td style="padding:8px 0;color:#0f172a;font-weight:600;">${esc(cliente)}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Solicitante</td><td style="padding:8px 0;color:#0f172a;">${esc(solicitante)} (${esc(correo)})</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Robot</td><td style="padding:8px 0;color:#0f172a;">${esc(robot)}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Tipo de servicio</td><td style="padding:8px 0;color:#0f172a;">${esc(tipo)}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Prioridad</td><td style="padding:8px 0;color:#0f172a;font-weight:600;">${esc(prioridad)}</td></tr>
          ${fechaProgramada ? `<tr><td style="padding:8px 0;color:#64748b;">Fecha programada</td><td style="padding:8px 0;color:#0f172a;">${esc(fechaProgramada)}</td></tr>` : ''}
        </table>
        <div style="margin-top:16px;padding:12px 16px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
          <p style="margin:0 0 4px;font-size:12px;color:#64748b;">Descripción</p>
          <p style="margin:0;font-size:14px;color:#1e293b;">${esc(descripcion).replace(/\n/g, '<br>')}</p>
        </div>
        <p style="margin:20px 0 0;font-size:11px;color:#94a3b8;text-align:center;">
          Notificación automática del Portal de Cliente — stellarisautomation.com
        </p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

export default router;
