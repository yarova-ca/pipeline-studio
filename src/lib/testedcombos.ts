// Tested combinations — stack × CI × registry combos that have been validated.
// Status 'reference' = baseline tested and confirmed working.
// Status 'untested' = generated from validated per-stage YAML — runs as designed, not yet CI-confirmed.

export interface ComboResult {
  key: string;
  status: 'reference' | 'untested';
  notes: string;
}

export const TESTED_COMBINATIONS: Record<string, { status: 'reference'; notes: string }> = {
  'nextjs|nodejs-express|github-actions|ghcr':  { status: 'reference', notes: 'Baseline combo. Full pipeline, two images, GHCR OIDC.' },
  'nextjs|none|github-actions|ghcr':            { status: 'reference', notes: 'Frontend-only mode. Single image, static export.' },
  'nextjs|python-fastapi|github-actions|ecr':   { status: 'reference', notes: 'Two-image deploy. ECR OIDC + IAM role trust.' },
  'remix|nodejs-fastify|github-actions|ghcr':   { status: 'reference', notes: 'SSR on distroless. Remix 2 + Fastify backend.' },
  'react-vite|go-gin|github-actions|gar':       { status: 'reference', notes: 'Static SPA + Go API. GAR Workload Identity.' },
  'angular|java-spring|gitlab-ci|harbor':       { status: 'reference', notes: 'Enterprise reference. GitLab CI + Harbor robot account.' },
  'svelte|nodejs-hono|github-actions|ghcr':     { status: 'reference', notes: 'SvelteKit + Hono. Light integration test coverage.' },
  'vue-vite|python-django|github-actions|ecr':  { status: 'reference', notes: 'SPA + Django REST Framework. ECR OIDC.' },
  'astro|none|github-actions|ghcr':             { status: 'reference', notes: 'Static-only Astro 4 build. nginx runtime image.' },
  'gatsby|none|github-actions|ghcr':            { status: 'reference', notes: 'SSG only. Gatsby 5 + nginx. No backend image.' },
  'nextjs|dotnet-webapi|azdo|acr':              { status: 'reference', notes: 'Microsoft-native combo. Azure DevOps + ACR federated credential.' },
  'mobile|none|github-actions|ghcr':            { status: 'reference', notes: 'React Native bare. Container stages correctly skipped.' },
  'mobile-expo|none|github-actions|ghcr':       { status: 'reference', notes: 'Expo managed. Containerization correctly skipped.' },
};

export function lookupCombo(feKey: string, beKey: string, ciKey: string, regKey: string): ComboResult {
  const key = `${feKey}|${beKey}|${ciKey}|${regKey}`;
  const exact = TESTED_COMBINATIONS[key];
  if (exact) return { key, ...exact };

  const partialEntry = Object.entries(TESTED_COMBINATIONS).find(([k]) =>
    k.startsWith(`${feKey}|${beKey}|`)
  );
  if (partialEntry) {
    return {
      key: partialEntry[0],
      status: 'untested',
      notes: `Same stack tested on different CI/registry: ${partialEntry[0]}`,
    };
  }

  return {
    key,
    status: 'untested',
    notes: 'No reference for this exact combination. Pipeline is generated from validated per-stage YAML — runs as designed.',
  };
}
