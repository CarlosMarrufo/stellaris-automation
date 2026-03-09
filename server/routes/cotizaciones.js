// server/routes/cotizaciones.js
// GET    /api/cotizaciones      — listar cotizaciones
// POST   /api/cotizaciones      — crear cotización + enviar email
// PATCH  /api/cotizaciones/:id  — admin: actualizar estado

import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { graphConfigured, getGraphToken, sendMailViaGraph, esc } from '../lib/graph.js';

const router = Router();

const RECIPIENT = process.env.MICROSOFT_RECIPIENT_EMAIL || 'contacto@stellarisautomation.com';

const itemSchema = z.object({
  idRefaccion: z.number().int().positive(),
  cantidad:    z.number().int().positive(),
  precioRef:   z.number().min(0),
});

const cotizacionSchema = z.object({
  items: z.array(itemSchema).min(1, 'Se requiere al menos un artículo'),
});

const patchSchema = z.object({
  estado: z.enum(['pendiente', 'aceptada', 'rechazada', 'modificada']),
  notas:  z.string().max(2000).optional(),
});

// ─── GET /api/cotizaciones ─────────────────────────────────────────────────

router.get('/cotizaciones', async (req, res) => {
  try {
    const isAdmin = req.user.idRol === 1;

    const cotizaciones = await prisma.cotizacion.findMany({
      where: isAdmin ? {} : { idCuenta: req.user.idCuenta },
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

    const result = cotizaciones.map((c) => ({
      id:      c.idCotizacion,
      estado:  c.estado,
      notas:   c.notas,
      creado:  c.creado,
      cliente: c.cuenta.nombre,
      correo:  c.cuenta.correo,
      items:   c.items.map((i) => ({
        id:          i.idItem,
        idRefaccion: i.idRefaccion,
        codigo:      i.refaccion.noParte,
        nombre:      i.refaccion.descripcion ?? i.refaccion.noParte,
        cantidad:    i.cantidad,
        precioRef:   Number(i.precioRef),
      })),
    }));

    return res.json(result);
  } catch (err) {
    console.error('[api/cotizaciones GET]', err instanceof Error ? err.message : String(err));
    return res.status(500).json({ error: 'Error al obtener cotizaciones' });
  }
});

// ─── POST /api/cotizaciones ────────────────────────────────────────────────

router.post('/cotizaciones', async (req, res) => {
  const parsed = cotizacionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors });
  }

  const { items } = parsed.data;

  try {
    const cuenta = await prisma.cuenta.findUnique({
      where: { idCuenta: req.user.idCuenta },
    });

    const cotizacion = await prisma.cotizacion.create({
      data: {
        idCuenta: req.user.idCuenta,
        items: {
          create: items.map((i) => ({
            idRefaccion: i.idRefaccion,
            cantidad:    i.cantidad,
            precioRef:   i.precioRef,
          })),
        },
      },
      include: {
        items: {
          include: { refaccion: { select: { noParte: true, descripcion: true } } },
        },
      },
    });

    if (graphConfigured) {
      try {
        const token = await getGraphToken();
        await sendMailViaGraph(token, {
          to:      RECIPIENT,
          replyTo: { name: cuenta.nombre, address: cuenta.correo },
          subject: `[Stellaris Portal] Solicitud de cotización — ${cuenta.nombre}`,
          html:    buildCotizacionEmail(cuenta, cotizacion),
        });
      } catch (emailErr) {
        console.error('[cotizaciones/email]', emailErr instanceof Error ? emailErr.message : String(emailErr));
      }
    }

    return res.status(201).json({ id: cotizacion.idCotizacion, estado: cotizacion.estado });
  } catch (err) {
    console.error('[api/cotizaciones POST]', err instanceof Error ? err.message : String(err));
    return res.status(500).json({ error: 'Error al crear cotización' });
  }
});

// ─── PATCH /api/cotizaciones/:id ──────────────────────────────────────────

router.patch('/cotizaciones/:id', async (req, res) => {
  if (req.user.idRol !== 1) {
    return res.status(403).json({ error: 'No autorizado' });
  }

  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  const parsed = patchSchema.safeParse(req.body);
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
    console.error('[api/cotizaciones PATCH]', err instanceof Error ? err.message : String(err));
    return res.status(500).json({ error: 'Error al actualizar cotización' });
  }
});

// ─── Email builder ─────────────────────────────────────────────────────────

function buildCotizacionEmail(cuenta, cotizacion) {
  const total = cotizacion.items.reduce((sum, i) => sum + i.cantidad * Number(i.precioRef), 0);

  const itemRows = cotizacion.items.map((i) => `
    <tr>
      <td style="padding:8px 14px;border-bottom:1px solid #f1f5f9;font-family:monospace;font-size:13px;">${esc(i.refaccion.noParte)}</td>
      <td style="padding:8px 14px;border-bottom:1px solid #f1f5f9;">${esc(i.refaccion.descripcion ?? i.refaccion.noParte)}</td>
      <td style="padding:8px 14px;border-bottom:1px solid #f1f5f9;text-align:center;">${i.cantidad}</td>
      <td style="padding:8px 14px;border-bottom:1px solid #f1f5f9;text-align:right;">$${Number(i.precioRef).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
      <td style="padding:8px 14px;border-bottom:1px solid #f1f5f9;text-align:right;">$${(i.cantidad * Number(i.precioRef)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
    <tr><td align="center">
      <table width="700" cellpadding="0" cellspacing="0"
             style="max-width:700px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#1a0a3e 0%,#3d1478 40%,#9b3010 75%,#d4560a 100%);padding:32px 40px;text-align:center;">
            <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">STELLARIS AUTOMATION</p>
            <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,.75);">Solicitud de cotización desde el portal de cliente</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px 16px;">
            <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#1e293b;border-bottom:2px solid #e2e8f0;padding-bottom:8px;">Datos del cliente</p>
            <p style="margin:8px 0;color:#334155;"><b>Nombre:</b> ${esc(cuenta.nombre)}</p>
            <p style="margin:8px 0;color:#334155;"><b>Correo:</b> <a href="mailto:${esc(cuenta.correo)}" style="color:#3b82f6;">${esc(cuenta.correo)}</a></p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 40px 32px;">
            <p style="margin:0 0 16px;font-size:16px;font-weight:700;color:#1e293b;border-bottom:2px solid #e2e8f0;padding-bottom:8px;">Artículos solicitados</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              <thead>
                <tr style="background:#f8fafc;">
                  <th style="padding:8px 14px;text-align:left;color:#475569;font-size:13px;">Código</th>
                  <th style="padding:8px 14px;text-align:left;color:#475569;font-size:13px;">Descripción</th>
                  <th style="padding:8px 14px;text-align:center;color:#475569;font-size:13px;">Cant.</th>
                  <th style="padding:8px 14px;text-align:right;color:#475569;font-size:13px;">P. Unit.</th>
                  <th style="padding:8px 14px;text-align:right;color:#475569;font-size:13px;">Subtotal</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
              <tfoot>
                <tr>
                  <td colspan="4" style="padding:12px 14px;font-weight:700;color:#1e293b;text-align:right;">Total estimado:</td>
                  <td style="padding:12px 14px;font-weight:700;color:#1e293b;text-align:right;">$${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                </tr>
              </tfoot>
            </table>
            <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:16px;text-align:center;">
              Solicitud enviada desde el Portal de Cliente de stellarisautomation.com. Los precios son de referencia y pueden variar.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export default router;
