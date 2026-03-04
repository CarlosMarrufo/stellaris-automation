// server/server.js
// Stellaris Automation — Express API Server — ESM
//
// POST /api/contact  — Valida con Zod, obtiene token OAuth 2.0
//                      y envía el correo mediante Microsoft Graph API.
// GET  /api/health   — Health-check para monitoreo.
//
// Requiere Node.js >=18 (fetch nativo disponible desde v18).

import 'dotenv/config';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';

// ─── Startup: validación de variables de entorno ──────────────────────────────

const REQUIRED_ENV = [
  'MICROSOFT_TENANT_ID',
  'MICROSOFT_CLIENT_ID',
  'MICROSOFT_CLIENT_SECRET',
  'MICROSOFT_SENDER_EMAIL',
  'MICROSOFT_RECIPIENT_EMAIL',
];

const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);

if (missingEnv.length > 0) {
  console.error(
    `[startup] FATAL — Variables de entorno faltantes:\n  ${missingEnv.join('\n  ')}\n` +
    `  Copia server/.env.example → server/.env y rellena los valores.`
  );
  process.exit(1);
}

const {
  MICROSOFT_TENANT_ID,
  MICROSOFT_CLIENT_ID,
  MICROSOFT_CLIENT_SECRET,
  MICROSOFT_SENDER_EMAIL,
  MICROSOFT_RECIPIENT_EMAIL,
  PORT = '4000',
  NODE_ENV = 'development',
} = process.env;

const isProd = NODE_ENV === 'production';

// ─── Express — setup ──────────────────────────────────────────────────────────

const app = express();

// Detrás de Apache el IP real llega en X-Forwarded-For.
// trust proxy = 1 → Express confía en el primer proxy (Apache).
app.set('trust proxy', 1);

// Previene que Express filtre la versión de Node/Express en las respuestas.
app.disable('x-powered-by');

// Body parser — límite de 32 KB para prevenir ataques de payload grande.
app.use(express.json({ limit: '32kb' }));

// ─── Middleware: cabeceras de seguridad HTTP ──────────────────────────────────

app.use((req, res, next) => {
  // Ya configuradas en Apache para HTTPS; se definen también aquí como defensa
  // en profundidad y para que funcionen en desarrollo sin Apache.
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// ─── Rate limiting ─────────────────────────────────────────────────────────────
// 10 peticiones por IP cada 15 minutos.
// En producción, el IP real viene de X-Forwarded-For (seteado por Apache).

const contactLimiter = rateLimit({
  windowMs:        15 * 60 * 1000, // 15 minutos
  max:             10,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Demasiadas solicitudes. Inténtelo de nuevo en 15 minutos.' },
  keyGenerator: (req) => req.ip ?? 'unknown',
});

// ─── Zod validation schema ────────────────────────────────────────────────────

const contactSchema = z.object({
  nombre:      z.string().min(2, 'El nombre es obligatorio').max(120),
  empresa:     z.string().max(120).optional().default(''),
  cargo:       z.string().max(120).optional().default(''),
  telefono:    z.string().max(40).optional().default(''),
  correo:      z.string().email('Correo electrónico inválido').max(200),
  ciudad:      z.string().max(100).optional().default(''),
  servicios:   z.array(z.string().max(60)).max(10).optional().default([]),
  marcaRobot:  z.string().max(100).optional().default(''),
  numeroParte: z.string().max(100).optional().default(''),
  modelo:      z.string().max(100).optional().default(''),
  descripcion: z.string().max(2000).optional().default(''),
});

// ─── Microsoft Graph: token ───────────────────────────────────────────────────

/**
 * Obtiene un access_token mediante OAuth 2.0 Client Credentials Flow.
 * Requiere permiso de aplicación Mail.Send con Admin Consent otorgado.
 * @returns {Promise<string>}
 */
async function getGraphToken() {
  const params = new URLSearchParams({
    grant_type:    'client_credentials',
    client_id:     MICROSOFT_CLIENT_ID,
    client_secret: MICROSOFT_CLIENT_SECRET,
    scope:         'https://graph.microsoft.com/.default',
  });

  const response = await fetch(
    `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/token`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    params.toString(),
    }
  );

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(
      `Token request failed (${response.status}): ` +
      (payload.error_description ?? payload.error ?? 'unknown')
    );
  }

  const { access_token } = await response.json();
  return access_token;
}

// ─── Email HTML builder ───────────────────────────────────────────────────────

/**
 * Escapa caracteres HTML para prevenir XSS en el cuerpo del correo.
 * @param {string} s
 * @returns {string}
 */
function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Genera el HTML del correo de notificación interna.
 * @param {z.infer<typeof contactSchema>} data
 * @returns {string}
 */
function buildEmailHtml(data) {
  const row = (label, value) =>
    value
      ? `<tr>
           <td style="padding:8px 14px;font-weight:600;color:#475569;white-space:nowrap;vertical-align:top;border-bottom:1px solid #f1f5f9;">${label}</td>
           <td style="padding:8px 14px;color:#0f172a;border-bottom:1px solid #f1f5f9;">${value}</td>
         </tr>`
      : '';

  const servicios = data.servicios.length
    ? data.servicios.map(esc).join(', ')
    : '—';

  const infoTecnica = [
    data.marcaRobot  && `<b>Marca:</b> ${esc(data.marcaRobot)}`,
    data.modelo      && `<b>Modelo:</b> ${esc(data.modelo)}`,
    data.numeroParte && `<b>Número de parte:</b> ${esc(data.numeroParte)}`,
    data.descripcion && `<b>Descripción:</b><br>${esc(data.descripcion).replace(/\n/g, '<br>')}`,
  ].filter(Boolean).join('<br><br>');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0"
             style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;
                    overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a0a3e 0%,#3d1478 40%,#9b3010 75%,#d4560a 100%);
                     padding:32px 40px;text-align:center;">
            <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:.5px;">
              STELLARIS AUTOMATION
            </p>
            <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,.75);">
              Nueva solicitud de atención técnica
            </p>
          </td>
        </tr>

        <!-- Datos de contacto -->
        <tr>
          <td style="padding:32px 40px 0;">
            <p style="margin:0 0 16px;font-size:16px;font-weight:700;color:#1e293b;
                      border-bottom:2px solid #e2e8f0;padding-bottom:8px;">
              Datos de contacto
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              ${row('Nombre',                esc(data.nombre))}
              ${row('Empresa',               esc(data.empresa))}
              ${row('Cargo',                 esc(data.cargo))}
              ${row('Teléfono',              esc(data.telefono))}
              ${row('Correo', `<a href="mailto:${esc(data.correo)}" style="color:#3b82f6;">${esc(data.correo)}</a>`)}
              ${row('Ciudad',                esc(data.ciudad))}
              ${row('Servicios solicitados', servicios)}
            </table>
          </td>
        </tr>

        <!-- Información técnica (sólo si hay datos) -->
        ${infoTecnica ? `
        <tr>
          <td style="padding:24px 40px 0;">
            <p style="margin:0 0 16px;font-size:16px;font-weight:700;color:#1e293b;
                      border-bottom:2px solid #e2e8f0;padding-bottom:8px;">
              Información técnica
            </p>
            <p style="margin:0;color:#334155;line-height:1.8;">${infoTecnica}</p>
          </td>
        </tr>` : ''}

        <!-- Footer -->
        <tr>
          <td style="padding:32px 40px;">
            <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;text-align:center;
                      border-top:1px solid #e2e8f0;padding-top:16px;">
              Mensaje generado automáticamente desde stellarisautomation.com
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Microsoft Graph: sendMail ────────────────────────────────────────────────

/**
 * Envía el correo de notificación a través de Microsoft Graph sendMail.
 * Usa saveToSentItems para que quede registro en el buzón corporativo.
 * @param {string} accessToken
 * @param {z.infer<typeof contactSchema>} data
 */
async function sendMailViaGraph(accessToken, data) {
  const subject =
    `[Stellaris] Solicitud técnica — ${data.nombre}` +
    (data.empresa ? ` · ${data.empresa}` : '');

  const payload = {
    message: {
      subject,
      body: {
        contentType: 'HTML',
        content:     buildEmailHtml(data),
      },
      toRecipients: [
        { emailAddress: { address: MICROSOFT_RECIPIENT_EMAIL } },
      ],
      // Reply-To apunta al correo del solicitante para respuestas directas.
      replyTo: data.correo
        ? [{ emailAddress: { name: data.nombre, address: data.correo } }]
        : [],
    },
    saveToSentItems: true,
  };

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(MICROSOFT_SENDER_EMAIL)}/sendMail`,
    {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  // Graph devuelve 202 Accepted en éxito.
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      `Graph sendMail failed (${response.status}): ` +
      (errorBody.error?.message ?? 'unknown')
    );
  }
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// Health-check — útil para monitoreo con Uptime Robot, etc.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Contact form endpoint
app.post('/api/contact', contactLimiter, async (req, res) => {
  // 1. Validación Zod
  const parsed = contactSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error:   'Validation failed',
      details: parsed.error.flatten().fieldErrors,
    });
  }

  // 2. Token + envío
  try {
    const token = await getGraphToken();
    await sendMailViaGraph(token, parsed.data);
    return res.status(200).json({ success: true });
  } catch (err) {
    // El mensaje real va solo al log del servidor — nunca al cliente.
    console.error('[api/contact]', err instanceof Error ? err.message : String(err));
    return res.status(500).json({ error: 'No se pudo enviar el mensaje. Inténtelo de nuevo.' });
  }
});

// 404 catch-all para rutas no definidas
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ─── HTTP server ──────────────────────────────────────────────────────────────

// Enlazar a 127.0.0.1 (loopback), nunca a 0.0.0.0.
// El puerto 4000 NO debe estar expuesto al exterior — solo Apache accede a él.
const server = app.listen(parseInt(PORT, 10), '127.0.0.1', () => {
  console.log(`[server] Stellaris API escuchando en http://127.0.0.1:${PORT} (${NODE_ENV})`);
});

// ─── Graceful shutdown ────────────────────────────────────────────────────────

function shutdown(signal) {
  console.log(`[server] Recibido ${signal} — cerrando servidor HTTP...`);
  server.close(() => {
    console.log('[server] Servidor detenido correctamente.');
    process.exit(0);
  });

  // Fuerza la salida si tarda más de 10 segundos.
  setTimeout(() => {
    console.error('[server] Timeout en shutdown — forzando salida.');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
