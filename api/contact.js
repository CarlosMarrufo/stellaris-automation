// api/contact.js
// Vercel Serverless Function — ESM
// Receives contact form submissions, validates with Zod,
// obtains an OAuth 2.0 access token via Client Credentials Flow
// and sends the email through Microsoft Graph API.

import { z } from 'zod';

// ─── Validation schema ────────────────────────────────────────────────────────

const contactSchema = z.object({
  nombre:      z.string().min(2, 'El nombre es obligatorio'),
  empresa:     z.string().optional().default(''),
  cargo:       z.string().optional().default(''),
  telefono:    z.string().optional().default(''),
  correo:      z.string().email('Correo electrónico inválido'),
  ciudad:      z.string().optional().default(''),
  servicios:   z.array(z.string()).optional().default([]),
  marcaRobot:  z.string().optional().default(''),
  numeroParte: z.string().optional().default(''),
  modelo:      z.string().optional().default(''),
  descripcion: z.string().optional().default(''),
});

// ─── Token acquisition ────────────────────────────────────────────────────────

/**
 * Obtains an OAuth 2.0 access token using the Client Credentials Flow.
 * Requires Mail.Send Application permission granted with Admin Consent.
 * @returns {Promise<string>} Bearer access token
 */
async function getGraphToken() {
  const tenantId     = process.env.MICROSOFT_TENANT_ID;
  const clientId     = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error('Missing Microsoft identity environment variables');
  }

  const body = new URLSearchParams({
    grant_type:    'client_credentials',
    client_id:     clientId,
    client_secret: clientSecret,
    scope:         'https://graph.microsoft.com/.default',
  });

  const response = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    body.toString(),
    }
  );

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(
      `Token request failed (${response.status}): ${payload.error_description ?? payload.error ?? 'unknown'}`
    );
  }

  const { access_token } = await response.json();
  return access_token;
}

// ─── Email HTML builder ───────────────────────────────────────────────────────

/**
 * Builds the HTML body for the contact email.
 * @param {z.infer<typeof contactSchema>} data
 * @returns {string}
 */
function buildEmailHtml(data) {
  const row = (label, value) =>
    value
      ? `<tr>
           <td style="padding:8px 12px;font-weight:600;color:#475569;white-space:nowrap;vertical-align:top;">${label}</td>
           <td style="padding:8px 12px;color:#0f172a;">${value}</td>
         </tr>`
      : '';

  const servicios = data.servicios.length
    ? data.servicios.join(', ')
    : '—';

  const infoTecnica = [
    data.marcaRobot  && `<b>Marca:</b> ${data.marcaRobot}`,
    data.modelo      && `<b>Modelo:</b> ${data.modelo}`,
    data.numeroParte && `<b>Número de parte:</b> ${data.numeroParte}`,
    data.descripcion && `<b>Descripción:</b> ${data.descripcion}`,
  ]
    .filter(Boolean)
    .join('<br>');

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a0a3e 0%,#3d1478 40%,#9b3010 75%,#d4560a 100%);padding:32px 40px;text-align:center;">
            <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:.5px;">
              STELLARIS AUTOMATION
            </p>
            <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,.75);">
              Nueva solicitud de atención técnica
            </p>
          </td>
        </tr>

        <!-- Contact data -->
        <tr>
          <td style="padding:32px 40px 0;">
            <p style="margin:0 0 16px;font-size:16px;font-weight:700;color:#1e293b;border-bottom:2px solid #e2e8f0;padding-bottom:8px;">
              Datos de contacto
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              ${row('Nombre',  data.nombre)}
              ${row('Empresa', data.empresa)}
              ${row('Cargo',   data.cargo)}
              ${row('Teléfono',data.telefono)}
              ${row('Correo',  `<a href="mailto:${data.correo}" style="color:#3b82f6;">${data.correo}</a>`)}
              ${row('Ciudad',  data.ciudad)}
              ${row('Servicios solicitados', servicios)}
            </table>
          </td>
        </tr>

        <!-- Technical info -->
        ${infoTecnica ? `
        <tr>
          <td style="padding:24px 40px 0;">
            <p style="margin:0 0 16px;font-size:16px;font-weight:700;color:#1e293b;border-bottom:2px solid #e2e8f0;padding-bottom:8px;">
              Información técnica
            </p>
            <p style="margin:0;color:#334155;line-height:1.7;">${infoTecnica}</p>
          </td>
        </tr>` : ''}

        <!-- Footer -->
        <tr>
          <td style="padding:32px 40px;">
            <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;text-align:center;border-top:1px solid #e2e8f0;padding-top:16px;">
              Este mensaje fue generado automáticamente desde el formulario de contacto de stellarisautomation.com
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Graph API send ───────────────────────────────────────────────────────────

/**
 * Sends the contact email via Microsoft Graph sendMail endpoint.
 * @param {string} accessToken
 * @param {z.infer<typeof contactSchema>} data
 */
async function sendMailViaGraph(accessToken, data) {
  const senderEmail    = process.env.MICROSOFT_SENDER_EMAIL;
  const recipientEmail = process.env.MICROSOFT_RECIPIENT_EMAIL;

  if (!senderEmail || !recipientEmail) {
    throw new Error('Missing Microsoft email environment variables');
  }

  const subject = `[Stellaris] Solicitud técnica — ${data.nombre}${data.empresa ? ` · ${data.empresa}` : ''}`;

  const payload = {
    message: {
      subject,
      body: {
        contentType: 'HTML',
        content:     buildEmailHtml(data),
      },
      toRecipients: [
        { emailAddress: { address: recipientEmail } },
      ],
      replyTo: data.correo
        ? [{ emailAddress: { name: data.nombre, address: data.correo } }]
        : [],
    },
    saveToSentItems: true,
  };

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(senderEmail)}/sendMail`,
    {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  // 202 Accepted is the success response for sendMail
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      `Graph sendMail failed (${response.status}): ${errorBody.error?.message ?? 'unknown'}`
    );
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

/**
 * Vercel Serverless Function handler.
 * POST /api/contact
 * @param {import('@vercel/node').VercelRequest}  req
 * @param {import('@vercel/node').VercelResponse} res
 */
export default async function handler(req, res) {
  // ── 1. Method guard ────────────────────────────────────────────────────────
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // ── 2. Parse body ──────────────────────────────────────────────────────────
  let rawBody;
  try {
    rawBody = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  if (!rawBody || typeof rawBody !== 'object') {
    return res.status(400).json({ error: 'Request body is required' });
  }

  // ── 3. Validate with Zod ───────────────────────────────────────────────────
  const parsed = contactSchema.safeParse(rawBody);

  if (!parsed.success) {
    return res.status(400).json({
      error:   'Validation failed',
      details: parsed.error.flatten().fieldErrors,
    });
  }

  // ── 4. Send via Microsoft Graph ────────────────────────────────────────────
  try {
    const token = await getGraphToken();
    await sendMailViaGraph(token, parsed.data);

    return res.status(200).json({ success: true });
  } catch (err) {
    // Log the real error server-side; never expose internals to the client
    console.error('[api/contact] Error:', err instanceof Error ? err.message : String(err));
    return res.status(500).json({ error: 'No se pudo enviar el mensaje. Intente de nuevo.' });
  }
}
