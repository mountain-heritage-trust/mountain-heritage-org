// Augmentation for the typed `env` import from the Workers runtime.
// Lets API routes do `import { env } from 'cloudflare:workers'` and have the
// expected env vars typed without manual casts.
//
// These are configured in the Cloudflare dashboard for the Worker:
//   Workers → mountain-heritage-org → Settings → Variables and Secrets
// And documented in docs/forms.md and docs/deployment.md.

declare namespace Cloudflare {
  interface Env {
    RESEND_API_KEY: string;
    CONTACT_EMAIL: string;
    FROM_EMAIL: string;
    // GitHub PAT used by the /admin auth shim to commit on behalf of
    // Cloudflare-Access-authenticated trustees. See docs/cms.md.
    GITHUB_BOT_TOKEN: string;
  }
}
