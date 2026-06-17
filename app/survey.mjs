// Survey current state of all three surfaces, desktop + mobile.
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
const BASE = 'http://localhost:4173';
const OUT = '/tmp/pstudio-survey';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();

async function shot(name, w, h, urlSuffix, prep) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + '/' + (urlSuffix || ''), { waitUntil: 'networkidle' });
  await p.waitForTimeout(1000);
  if (prep) await prep(p);
  await p.waitForTimeout(800);
  await p.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  console.log(name, '· errors:', errs.length ? errs.slice(0,3) : 'none');
  await ctx.close();
}

const STACK = 'industry=financial-services&fw=01-nextjs&pkg=pnpm&auth=auth-all&orm=orm-prisma&obs=observability-otel&runtime=fips&cluster=openshift&registry=ghcr&signer=cosign&sbom=syft';

// Custom guided path — land on an early step and a mid step
await shot('cust-step1', 1280, 900, '#mode=guided&step=0&'+STACK);
await shot('cust-step2', 1280, 900, '#mode=guided&step=1&'+STACK);
await shot('cust-step4', 1280, 900, '#mode=guided&step=3&'+STACK);
// Build map (18 scenes)
await shot('build-map', 1280, 900, '#mode=build&'+STACK);
await shot('build-map-mobile', 390, 844, '#mode=build&'+STACK);
// Catalog (9 columns)
await shot('catalog', 1280, 900, '#mode=catalog&'+STACK);
await shot('catalog-mobile', 390, 844, '#mode=catalog&'+STACK);

await browser.close();
console.log('SHOTS:', OUT);
