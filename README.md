# FVDR Prototype Platform
Angular 17 · Vercel · Supabase · Click Tracking / Heatmaps

---

## Workflow
```
1. Create mockup in Figma
2. Paste Figma link + brief to Claude
3. Claude generates Angular component + registers slug
4. git push origin proto/<slug>  →  Vercel auto-deploys
5. Share URL  →  real users or synthetic personas test it
6. View click heatmap at bottom-right 🔥 button
```

---

## Setup (one-time)

### 1. Supabase
1. Create project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL editor
3. Copy **Project URL** and **anon public key**

### 2. Vercel
1. Import this repo into Vercel
2. Build command: `npm run build:proto`
3. Output dir: `dist/fvdr-prototypes/browser`
4. Add environment variables:
   ```
   SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_ANON_KEY=eyJ...
   ```
5. Enable **Preview Deployments** → each branch gets its own URL

### 3. Figma MCP (for Claude Code)
1. Get a Figma Personal Access Token: **Figma → Settings → Security → Personal access tokens**
2. Add it to your environment:
   ```bash
   export FIGMA_API_KEY=figd_...
   ```
3. The MCP server config is already in `.claude/mcp.json` — Claude Code will auto-start `@figma/mcp` when you open this project.
4. Verify it works: in a Claude Code session type `/mcp` — you should see `figma` listed as connected.

> **No FIGMA_API_KEY?** Claude will skip design context fetching and generate the component from your written brief only.

### 4. Local dev
```bash
npm install
cp src/environments/environment.ts src/environments/environment.local.ts
# edit environment.local.ts — fill in SUPABASE_URL and SUPABASE_ANON_KEY
npm start
```

---

## Generating a new prototype

**You give Claude:**
- The Figma node URL (`?node-id=xxxx:yyyy`)
- A written brief: what the flow does, key interactions, edge cases

**Claude will:**
1. Fetch design context from Figma MCP
2. Generate the Angular component
3. Run `node scripts/new-proto.js --slug <slug> --title "..." --figma "..." --status wip`
4. Push to `proto/<slug>` branch
5. Return the Vercel preview URL

**Manual scaffold:**
```bash
node scripts/new-proto.js \
  --slug "deal-room" \
  --title "Deal Room Dashboard" \
  --figma "https://www.figma.com/design/liyNDiFf1piO8SQmHNKoeU?node-id=1042:12890" \
  --status wip \
  --description "Active deals overview with quick actions"
```

---

## Analytics / Heatmap

Events are written to Supabase `proto_events` table automatically:

| event_type      | when                                  |
|-----------------|---------------------------------------|
| `page_view`     | User lands on prototype route         |
| `click`         | Any click (includes x/y coordinates)  |
| `scroll`        | Scroll depth checkpoint               |
| `task_complete` | Prototype calls `tracker.trackTask()` |
| `task_fail`     | User cancels or error path            |

**Heatmap:** click the 🔥 button (bottom-right of any prototype) to see a live overlay of all click positions aggregated across sessions.

**Query example (Supabase dashboard):**
```sql
select * from proto_summary order by sessions desc;
```

---

## Prototype component template

Every generated prototype is a standalone Angular component:

```typescript
@Component({
  selector: 'fvdr-my-flow',
  standalone: true,
  imports: [CommonModule],
  template: `...`,
  styles: [`...`]
})
export class MyFlowComponent implements OnInit, OnDestroy {
  private tracker = inject(TrackerService);

  ngOnInit() { this.tracker.trackPageView('my-flow'); }
  ngOnDestroy() { this.tracker.destroyListeners(); }

  onSuccess() { this.tracker.trackTask('my-flow', 'task_complete'); }
}
// Add data-track attribute to key elements for labelled click events:
// <button data-track="submit-form">Submit</button>
```

---

## Design tokens

| Token        | Value     | Use               |
|--------------|-----------|-------------------|
| Primary 500  | `#2C9C74` | Accent, CTA       |
| Primary 400  | `#3FB67D` | Hover, success    |
| Orange 500   | `#F4640C` | Warning           |
| Red 500      | `#EF5350` | Error, danger     |
| Blue 500     | `#4862D3` | Secondary, info   |
| Dodger 500   | `#358CEB` | Links, info       |
| Background   | `#0B1410` | App bg            |
| Surface      | `#101A16` | Cards, panels     |

Font: **Open Sans** (matches Figma design system)
