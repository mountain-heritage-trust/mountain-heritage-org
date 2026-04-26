// Contact form handler — runs in the Cloudflare Worker (via @astrojs/cloudflare).
// See docs/forms.md.

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function redirectBack(request: Request, query: string): Response {
  const url = new URL('/contact', request.url);
  url.search = query;
  return Response.redirect(url.toString(), 303);
}

export const POST: APIRoute = async ({ request }) => {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  // Honeypot — bots fill this; real users don't see it.
  if ((form.get('website') as string)?.trim()) {
    return redirectBack(request, '?sent=1');
  }

  const name = ((form.get('name') as string) ?? '').trim();
  const email = ((form.get('email') as string) ?? '').trim();
  const subject = ((form.get('subject') as string) ?? '').trim() || 'Contact form submission';
  const message = ((form.get('message') as string) ?? '').trim();

  if (!name || !email || !message) return redirectBack(request, '?error=missing');
  if (!EMAIL_RE.test(email)) return redirectBack(request, '?error=email');
  if (message.length > 10_000) return redirectBack(request, '?error=length');

  const { RESEND_API_KEY, CONTACT_EMAIL, FROM_EMAIL } = env;
  if (!RESEND_API_KEY || !CONTACT_EMAIL || !FROM_EMAIL) {
    console.error('contact form: missing env vars');
    return redirectBack(request, '?error=server');
  }

  const text = `From: ${name} <${email}>\n\nSubject: ${subject}\n\n${message}`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: CONTACT_EMAIL,
      reply_to: email,
      subject: `[MHT website] ${subject}`,
      text,
    }),
  });

  if (!res.ok) {
    console.error('contact form: Resend error', res.status, await res.text());
    return redirectBack(request, '?error=server');
  }

  return redirectBack(request, '?sent=1');
};
