// server/lib/graph.js
// Shared Microsoft Graph email utilities.

const {
  MICROSOFT_TENANT_ID,
  MICROSOFT_CLIENT_ID,
  MICROSOFT_CLIENT_SECRET,
  MICROSOFT_SENDER_EMAIL,
} = process.env;

export const graphConfigured = Boolean(
  MICROSOFT_TENANT_ID && MICROSOFT_CLIENT_ID &&
  MICROSOFT_CLIENT_SECRET && MICROSOFT_SENDER_EMAIL
);

export function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function getGraphToken() {
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

/**
 * @param {string} accessToken
 * @param {{ to: string|string[], cc?: string|string[], replyTo?: { name?: string, address: string } | null, subject: string, html: string }} opts
 */
export async function sendMailViaGraph(accessToken, { to, cc, replyTo, subject, html }) {
  const toArr = Array.isArray(to) ? to : [to];
  const ccArr = cc ? (Array.isArray(cc) ? cc : [cc]) : [];
  const payload = {
    message: {
      subject,
      body: { contentType: 'HTML', content: html },
      toRecipients: toArr.map((addr) => ({ emailAddress: { address: addr } })),
      ...(ccArr.length > 0 ? { ccRecipients: ccArr.map((addr) => ({ emailAddress: { address: addr } })) } : {}),
      ...(replyTo ? { replyTo: [{ emailAddress: replyTo }] } : {}),
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

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      `Graph sendMail failed (${response.status}): ` +
      (errorBody.error?.message ?? 'unknown')
    );
  }
}
