// Auto-auth shim for the Sveltia CMS at /admin.
//
// Sveltia normally opens a popup that does GitHub OAuth, then posts the
// resulting access token back to the parent window. We short-circuit the
// OAuth dance: this route lives behind Cloudflare Access (path /admin/*),
// so anyone reaching it has already been authenticated as a
// @mountain-heritage.org user. We respond with the bot's GitHub PAT
// immediately, no GitHub round-trip.
//
// Trade-off: every commit Sveltia makes is attributed to the GitHub user
// that owns GITHUB_BOT_TOKEN — no per-trustee attribution in `git log`.
// Cloudflare Access logs still show which trustee hit /admin at any time.
//
// See docs/cms.md.

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

const FAIL_HTML = (msg: string) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Sign-in failed</title></head>
<body style="font-family:system-ui;padding:2rem">
<h1>Sign-in failed</h1>
<p>${msg}</p>
<p>Close this window and try again. If the problem persists, contact the website administrator.</p>
</body></html>`;

export const GET: APIRoute = async ({ request }) => {
  // Cloudflare Access injects this header on requests it has authenticated.
  // If it's missing, the request didn't come through Access — refuse.
  const jwt = request.headers.get('cf-access-jwt-assertion');
  if (!jwt) {
    return new Response(
      FAIL_HTML('This page must be accessed through the trust&apos;s admin sign-in.'),
      { status: 401, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  }

  const token = env.GITHUB_BOT_TOKEN;
  if (!token) {
    console.error('admin auth shim: GITHUB_BOT_TOKEN env var not set');
    return new Response(
      FAIL_HTML('The site is missing its GitHub bot token. Ask the website administrator to set GITHUB_BOT_TOKEN in Cloudflare.'),
      { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  }

  // Mimic the message Sveltia / Decap CMS expect from a GitHub OAuth popup.
  const successPayload = JSON.stringify({ token, provider: 'github' });
  const successMessage = `authorization:github:success:${successPayload}`;

  // Two-step handshake: parent posts "authorizing:github" to confirm it's
  // listening, popup replies with the token. Some CMS versions just post
  // the token immediately; we cover both by also sending the announce
  // message proactively.
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Signing you in…</title></head>
<body style="font-family:system-ui;padding:2rem">
<p>Signing you in…</p>
<script>
(function() {
  var sent = false;
  var msg = ${JSON.stringify(successMessage)};
  function send() {
    if (sent || !window.opener) return;
    sent = true;
    window.opener.postMessage(msg, '*');
    setTimeout(function() { window.close(); }, 250);
  }
  window.addEventListener('message', function(e) {
    if (typeof e.data === 'string' && e.data === 'authorizing:github') {
      send();
    }
  });
  // Announce we're ready. If the parent already missed our message and
  // never sends 'authorizing:github' back, fall through to send anyway.
  if (window.opener) {
    window.opener.postMessage('authorizing:github', '*');
  }
  setTimeout(send, 1500);
})();
</script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
};
