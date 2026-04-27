// Build/deploy status endpoint.
//
// Returns the commit currently running on this Worker (baked in at build
// time) and the latest commit on the `main` branch on GitHub. The browser
// compares these (and its own page-commit meta tag) to know whether
// pending edits are still deploying.
//
// See src/components/BuildStatus.astro for the consumer.

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { commitHash } from '../../build-info';

export const prerender = false;

const REPO = 'mountain-heritage-trust/mountain-heritage-org';
const GITHUB_API = `https://api.github.com/repos/${REPO}/commits/main`;

export const GET: APIRoute = async () => {
  let latest = commitHash;
  let error: string | null = null;

  try {
    const res = await fetch(GITHUB_API, {
      headers: {
        Authorization: `token ${env.GITHUB_BOT_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'mht-website-build-status',
      },
      // Cloudflare cache. GitHub's commit API is fine to cache for 30s;
      // it just means up to a 30s lag in noticing a new push.
      cf: { cacheTtl: 30, cacheEverything: true } as RequestInitCfProperties,
    });
    if (res.ok) {
      const data = (await res.json()) as { sha?: string };
      if (typeof data.sha === 'string') {
        latest = data.sha.slice(0, 7);
      }
    } else {
      error = `github ${res.status}`;
    }
  } catch (err) {
    error = (err as Error).message ?? 'fetch failed';
  }

  const body = {
    running: commitHash,
    latest,
    ...(error ? { error } : {}),
  };

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=30',
    },
  });
};
