#!/usr/bin/env node
/**
 * FVDR Prototype Scaffolding Script
 *
 * Usage:
 *   node scripts/new-proto.js \
 *     --slug "deal-room" \
 *     --title "Deal Room Dashboard" \
 *     --figma "https://www.figma.com/design/xxx?node-id=1042:12890" \
 *     --status wip \
 *     --description "Active deals overview with quick actions"
 */

const fs   = require('fs');
const path = require('path');

// ── Parse args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const get  = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 && i + 1 < args.length ? args[i + 1] : null;
};

const slug   = get('--slug');
const title  = get('--title');
const figma  = get('--figma')  ?? '';
const status = get('--status') ?? 'wip';
const desc   = get('--description') ?? '';

if (!slug || !title) {
  console.error('Usage: node scripts/new-proto.js --slug <slug> --title "<title>" [--figma <url>] [--status wip|live|archived] [--description "<text>"]');
  process.exit(1);
}

if (!/^[a-z0-9-]+$/.test(slug)) {
  console.error('Slug must be lowercase letters, numbers, and hyphens only.');
  process.exit(1);
}

const ROOT     = path.resolve(__dirname, '..');
const PROTO_DIR = path.join(ROOT, 'src', 'app', 'prototypes', slug);
const ROUTES_FILE   = path.join(ROOT, 'src', 'app', 'app.routes.ts');
const REGISTRY_FILE = path.join(ROOT, 'src', 'app', 'proto-registry.ts');

// ── Pascal-case helpers ───────────────────────────────────────────────────────
const toPascal = (s) =>
  s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');

const className    = `${toPascal(slug)}Component`;
const selectorName = `fvdr-${slug}`;

// ── Guard: already exists ─────────────────────────────────────────────────────
if (fs.existsSync(PROTO_DIR)) {
  console.error(`Prototype '${slug}' already exists at ${PROTO_DIR}`);
  process.exit(1);
}

// ── 1. Create component file ──────────────────────────────────────────────────
fs.mkdirSync(PROTO_DIR, { recursive: true });

const componentTs = `import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DS_COMPONENTS } from '../../shared/ds';
import { TrackerService } from '../../services/tracker.service';

@Component({
  selector: '${selectorName}',
  standalone: true,
  imports: [CommonModule, FormsModule, ...DS_COMPONENTS],
  template: \`
    <div class="proto">
      <h1>${title}</h1>
      <!-- TODO: implement prototype UI -->
      <button data-track="primary-cta" (click)="onSuccess()">Complete task</button>
      <button data-track="cancel" (click)="onFail()">Cancel</button>
    </div>
  \`,
  styles: [\`
    .proto {
      min-height: 100vh;
      background: #0B1410;
      color: #e8f5f0;
      font-family: 'Open Sans', sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 24px;
    }
    h1 { color: #2C9C74; margin: 0 0 24px; }
    button {
      padding: 12px 24px;
      border-radius: 8px;
      border: none;
      font-size: 1rem;
      cursor: pointer;
      font-family: inherit;
    }
    [data-track="primary-cta"] { background: #2C9C74; color: #fff; }
    [data-track="primary-cta"]:hover { background: #3FB67D; }
    [data-track="cancel"] { background: #101A16; color: #9bbfb0; border: 1px solid #1e2e28; }
  \`],
})
export class ${className} implements OnInit, OnDestroy {
  private tracker = inject(TrackerService);

  ngOnInit(): void {
    this.tracker.trackPageView('${slug}');
  }

  ngOnDestroy(): void {
    this.tracker.destroyListeners();
  }

  onSuccess(): void {
    this.tracker.trackTask('${slug}', 'task_complete');
  }

  onFail(): void {
    this.tracker.trackTask('${slug}', 'task_fail');
  }
}
`;

fs.writeFileSync(path.join(PROTO_DIR, `${slug}.component.ts`), componentTs);
console.log(`✔ Created component: src/app/prototypes/${slug}/${slug}.component.ts`);

// ── 2. Register route ─────────────────────────────────────────────────────────
const routesContent = fs.readFileSync(ROUTES_FILE, 'utf8');
const routeEntry = `  {
    path: '${slug}',
    loadComponent: () =>
      import('./prototypes/${slug}/${slug}.component').then(m => m.${className}),
  },
  // PROTO_ROUTES_PLACEHOLDER`;

if (routesContent.includes(`path: '${slug}'`)) {
  console.log(`  Route '${slug}' already registered — skipping.`);
} else {
  const updated = routesContent.replace('// PROTO_ROUTES_PLACEHOLDER', routeEntry);
  fs.writeFileSync(ROUTES_FILE, updated);
  console.log(`✔ Registered route: /${slug}`);
}

// ── 3. Register in proto-registry ────────────────────────────────────────────
const registryContent = fs.readFileSync(REGISTRY_FILE, 'utf8');
const entry = `  {
    slug: '${slug}',
    title: '${title.replace(/'/g, "\\'")}',
    figma: '${figma}',
    status: '${status}',
    description: '${desc.replace(/'/g, "\\'")}',
  },
  // REGISTRY_PLACEHOLDER`;

if (registryContent.includes(`slug: '${slug}'`)) {
  console.log(`  Registry entry '${slug}' already exists — skipping.`);
} else {
  const updatedRegistry = registryContent.replace('// REGISTRY_PLACEHOLDER', entry);
  fs.writeFileSync(REGISTRY_FILE, updatedRegistry);
  console.log(`✔ Added to proto registry`);
}

console.log(`\n🎉 Prototype '${slug}' scaffolded successfully!`);
console.log(`   Component : src/app/prototypes/${slug}/${slug}.component.ts`);
console.log(`   Route     : /${slug}`);
if (figma) console.log(`   Figma     : ${figma}`);
console.log(`\nNext steps:`);
console.log(`  1. Edit the component template`);
console.log(`  2. git add . && git commit -m "feat: add ${slug} prototype"`);
console.log(`  3. git push origin proto/${slug}`);
