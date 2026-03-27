import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PrototypeService, PrototypeDef } from '../../services/prototype.service';

@Component({
  selector: 'fvdr-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="home">

      <header class="home__header">
        <div class="home__header-row">
          <div>
            <h1>FVDR Prototypes</h1>
            <p class="home__subtitle">Click a prototype to test it. Use the 🔥 button to view the heatmap.</p>
          </div>
          <button class="btn-new" (click)="openCreate()" *ngIf="svc.hasSupabase">
            <span class="btn-new__icon">+</span> New prototype
          </button>
        </div>
      </header>

      <!-- ── Grid ── -->
      <div class="home__grid">

        <!-- DS Card — pinned -->
        <a routerLink="/ds" class="proto-card proto-card--ds">
          <div class="proto-card__top">
            <span class="proto-card__status proto-card__status--ds">Design System</span>
            <span class="ds-card__icon">◈</span>
          </div>
          <h2 class="proto-card__title">Component Library</h2>
          <p class="proto-card__desc">All 35 DS components with live examples, tokens and usage.</p>
          <div class="ds-card__meta">
            <span class="ds-card__pill">35 components</span>
            <span class="ds-card__pill">51 icons</span>
          </div>
          <div class="proto-card__slug">/ds</div>
        </a>

        <!-- Docs Card — pinned -->
        <a routerLink="/docs" class="proto-card proto-card--docs">
          <div class="proto-card__top">
            <span class="proto-card__status proto-card__status--docs">Docs</span>
            <span class="ds-card__icon">📋</span>
          </div>
          <h2 class="proto-card__title">Session Guide</h2>
          <p class="proto-card__desc">Як починати сесію, DS токени, патерни, ключові файли.</p>
          <div class="ds-card__meta">
            <span class="docs-card__pill">SKILL.md</span>
            <span class="docs-card__pill">CLAUDE.md</span>
          </div>
          <div class="proto-card__slug">/docs</div>
        </a>

        <ng-container *ngFor="let proto of protos">
          <!-- Clickable card (component exists) -->
          <a
            *ngIf="proto.hasComponent"
            [routerLink]="['/', proto.slug]"
            class="proto-card"
            [class.proto-card--wip]="proto.status === 'wip'"
            [class.proto-card--live]="proto.status === 'live'"
            [class.proto-card--archived]="proto.status === 'archived'"
          >
            <div class="proto-card__top">
              <span class="proto-card__status">{{ proto.status }}</span>
              <button class="proto-card__archive" (click)="confirmArchive($event, proto)" title="Archive">✕</button>
            </div>
            <h2 class="proto-card__title">{{ proto.title }}</h2>
            <p *ngIf="proto.description" class="proto-card__desc">{{ proto.description }}</p>
            <div class="proto-card__slug">/{{ proto.slug }}</div>
          </a>

          <!-- Pending card (no component yet) -->
          <div
            *ngIf="!proto.hasComponent"
            class="proto-card proto-card--pending"
          >
            <div class="proto-card__top">
              <span class="proto-card__status">pending</span>
              <button class="proto-card__archive" (click)="confirmArchive($event, proto)" title="Archive">✕</button>
            </div>
            <h2 class="proto-card__title">{{ proto.title }}</h2>
            <p *ngIf="proto.description" class="proto-card__desc">{{ proto.description }}</p>
            <div class="proto-card__slug">/{{ proto.slug }}</div>
            <button class="btn-scaffold" (click)="showScaffold(proto)">
              Show scaffold command
            </button>
          </div>
        </ng-container>

        <div *ngIf="protos.length === 0 && !loading" class="home__empty">
          <p>No prototypes yet.</p>
          <code>node scripts/new-proto.js --slug my-flow --title "My Flow"</code>
        </div>

        <div *ngIf="loading" class="home__loading">Loading…</div>
      </div>

      <!-- ── Archive confirm ── -->
      <div class="overlay" *ngIf="archiveTarget" (click)="archiveTarget = null">
        <div class="modal modal--sm" (click)="$event.stopPropagation()">
          <p class="modal__body">Archive <strong>{{ archiveTarget!.title }}</strong>?<br>
            <span class="modal__hint">The component file stays in the codebase.</span>
          </p>
          <div class="modal__footer">
            <button class="btn-cancel" (click)="archiveTarget = null">Cancel</button>
            <button class="btn-danger" [disabled]="saving" (click)="doArchive()">
              {{ saving ? 'Archiving…' : 'Archive' }}
            </button>
          </div>
        </div>
      </div>

      <!-- ── Create modal ── -->
      <div class="overlay" *ngIf="createOpen" (click)="closeCreate()">
        <div class="modal" (click)="$event.stopPropagation()">

          <ng-container *ngIf="!scaffoldCmd">
            <h2 class="modal__title">New prototype</h2>
            <div class="modal__body">

              <div class="field">
                <label class="field__label">Title <span class="field__req">*</span></label>
                <input class="field__input" [(ngModel)]="form.title"
                       (ngModelChange)="autoSlug($event)"
                       placeholder="e.g. Deal Room Dashboard" />
              </div>

              <div class="field">
                <label class="field__label">Slug <span class="field__req">*</span></label>
                <div class="field__slug-wrap">
                  <span class="field__slug-prefix">/</span>
                  <input class="field__input field__input--slug" [(ngModel)]="form.slug"
                         placeholder="deal-room-dashboard"
                         (input)="sanitizeSlug()" />
                </div>
                <span class="field__hint">lowercase, numbers, hyphens only</span>
              </div>

              <div class="field">
                <label class="field__label">Description</label>
                <input class="field__input" [(ngModel)]="form.description"
                       placeholder="Short description of the prototype" />
              </div>

              <div class="field">
                <label class="field__label">Figma link</label>
                <input class="field__input" [(ngModel)]="form.figma"
                       placeholder="https://www.figma.com/design/…" />
              </div>

              <p *ngIf="createError" class="modal__error">{{ createError }}</p>
            </div>

            <div class="modal__footer">
              <button class="btn-cancel" (click)="closeCreate()">Cancel</button>
              <button class="btn-primary" [disabled]="saving || !form.title || !form.slug" (click)="doCreate()">
                {{ saving ? 'Creating…' : 'Create' }}
              </button>
            </div>
          </ng-container>

          <!-- Success: show scaffold command -->
          <ng-container *ngIf="scaffoldCmd">
            <h2 class="modal__title">Prototype created ✓</h2>
            <div class="modal__body">
              <p class="modal__info">Run this command to scaffold the Angular component:</p>
              <div class="code-block">
                <code>{{ scaffoldCmd }}</code>
                <button class="btn-copy" (click)="copyCmd()" title="Copy">
                  {{ copied ? '✓' : '⎘' }}
                </button>
              </div>
              <p class="modal__hint">After running the command, commit the files and open a PR.</p>
            </div>
            <div class="modal__footer">
              <button class="btn-primary" (click)="closeCreate()">Done</button>
            </div>
          </ng-container>

        </div>
      </div>

      <!-- ── Scaffold command overlay (for existing pending cards) ── -->
      <div class="overlay" *ngIf="scaffoldTarget" (click)="scaffoldTarget = null">
        <div class="modal" (click)="$event.stopPropagation()">
          <h2 class="modal__title">Scaffold command</h2>
          <div class="modal__body">
            <p class="modal__info">Run this in the project root:</p>
            <div class="code-block">
              <code>{{ buildCmd(scaffoldTarget!) }}</code>
              <button class="btn-copy" (click)="copyCmd(buildCmd(scaffoldTarget!))" title="Copy">
                {{ copied ? '✓' : '⎘' }}
              </button>
            </div>
          </div>
          <div class="modal__footer">
            <button class="btn-primary" (click)="scaffoldTarget = null">Close</button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .home {
      min-height: 100vh;
      background: #0B1410;
      color: #e8f5f0;
      font-family: 'Open Sans', sans-serif;
      padding: 48px 24px;
    }
    .home__header { max-width: 960px; margin: 0 auto 40px; }
    .home__header-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
    h1 { font-size: 2rem; font-weight: 700; color: #2C9C74; margin: 0 0 8px; }
    .home__subtitle { color: #9bbfb0; margin: 0; }
    .home__grid {
      max-width: 960px; margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }
    .home__empty { grid-column: 1 / -1; text-align: center; color: #9bbfb0; padding: 48px; }
    .home__empty code {
      display: block; margin-top: 12px;
      background: #101A16; padding: 12px 16px; border-radius: 8px;
      font-size: 0.85rem; color: #3FB67D;
    }
    .home__loading { grid-column: 1 / -1; text-align: center; color: #9bbfb0; padding: 48px; }

    /* ── New button ── */
    .btn-new {
      display: inline-flex; align-items: center; gap: 6px;
      height: 40px; padding: 0 16px;
      background: #2C9C74; color: #fff;
      border: none; border-radius: 8px;
      font-size: 0.9rem; font-weight: 600; font-family: inherit;
      cursor: pointer; white-space: nowrap;
      transition: background 0.15s;
    }
    .btn-new:hover { background: #3FB67D; }
    .btn-new__icon { font-size: 1.2rem; line-height: 1; }

    /* ── Cards ── */
    .proto-card {
      background: #101A16; border: 1px solid #1e2e28;
      border-radius: 12px; padding: 20px;
      text-decoration: none; color: inherit;
      transition: border-color 0.15s, transform 0.15s;
      position: relative; display: block;
    }
    a.proto-card:hover { border-color: #2C9C74; transform: translateY(-2px); }
    .proto-card--pending { border-style: dashed; border-color: #2a3d36; cursor: default; }

    .proto-card__top {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 12px;
    }
    .proto-card__status {
      font-size: 0.7rem; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.08em;
      padding: 2px 8px; border-radius: 20px;
    }
    .proto-card--wip     .proto-card__status { background: rgba(244,100,12,.15); color: #F4640C; }
    .proto-card--live    .proto-card__status { background: rgba(44,156,116,.15); color: #2C9C74; }
    .proto-card--archived .proto-card__status { background: rgba(155,191,176,.1); color: #9bbfb0; }
    .proto-card--pending  .proto-card__status { background: rgba(53,140,235,.12); color: #358CEB; }

    .proto-card__archive {
      width: 22px; height: 22px;
      background: transparent; border: none;
      color: #3a5a50; font-size: 0.75rem;
      cursor: pointer; border-radius: 4px;
      display: flex; align-items: center; justify-content: center;
      transition: color 0.12s, background 0.12s;
    }
    .proto-card__archive:hover { color: #e54430; background: rgba(229,68,48,.1); }

    .proto-card__title { font-size: 1.1rem; font-weight: 600; margin: 0 0 6px; }
    .proto-card__desc { font-size: 0.875rem; color: #9bbfb0; margin: 0 0 12px; }
    .proto-card__slug { font-size: 0.75rem; color: #358CEB; font-family: monospace; }

    /* ── DS card ── */
    .proto-card--ds {
      border-color: rgba(44, 156, 116, 0.35);
      background: linear-gradient(135deg, #0f201a 0%, #101A16 60%);
      position: relative;
      overflow: hidden;
    }
    .proto-card--ds::before {
      content: '';
      position: absolute;
      top: -40px; right: -40px;
      width: 120px; height: 120px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(44,156,116,0.12) 0%, transparent 70%);
      pointer-events: none;
    }
    .proto-card--ds:hover { border-color: #2C9C74; }

    /* ── Docs card ── */
    .proto-card--docs {
      border-color: rgba(53, 140, 235, 0.25);
      background: linear-gradient(135deg, #0d1820 0%, #101A16 60%);
    }
    .proto-card--docs:hover { border-color: #358CEB; }
    .proto-card__status--docs {
      background: rgba(53, 140, 235, 0.12);
      color: #358CEB;
      font-size: 0.7rem; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.08em;
      padding: 2px 8px; border-radius: 20px;
    }
    .docs-card__pill {
      font-size: 0.72rem;
      background: rgba(53, 140, 235, 0.1);
      color: #358CEB;
      padding: 2px 8px;
      border-radius: 20px;
      border: 1px solid rgba(53, 140, 235, 0.2);
    }
    .proto-card__status--ds {
      background: rgba(44,156,116,.18);
      color: #2C9C74;
      font-size: 0.7rem; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.08em;
      padding: 2px 8px; border-radius: 20px;
    }
    .ds-card__icon {
      font-size: 1.1rem;
      color: #2C9C74;
      opacity: 0.7;
    }
    .ds-card__meta {
      display: flex;
      gap: 6px;
      margin: 8px 0 10px;
      flex-wrap: wrap;
    }
    .ds-card__pill {
      font-size: 0.72rem;
      background: rgba(44,156,116,.12);
      color: #2C9C74;
      padding: 2px 8px;
      border-radius: 20px;
      border: 1px solid rgba(44,156,116,.2);
    }

    .btn-scaffold {
      margin-top: 12px;
      background: transparent; border: 1px solid #2a3d36;
      color: #9bbfb0; border-radius: 6px;
      padding: 4px 10px; font-size: 0.8rem; font-family: inherit;
      cursor: pointer; transition: border-color 0.12s, color 0.12s;
    }
    .btn-scaffold:hover { border-color: #2C9C74; color: #2C9C74; }

    /* ── Overlays ── */
    .overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.7);
      display: flex; align-items: center; justify-content: center;
      z-index: 100;
      animation: fadeIn 0.15s ease;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .modal {
      width: 480px; max-width: calc(100vw - 32px);
      background: #101A16; border: 1px solid #1e2e28;
      border-radius: 12px; overflow: hidden;
      animation: slideUp 0.18s ease;
    }
    .modal--sm { width: 360px; }
    @keyframes slideUp { from { transform: translateY(8px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

    .modal__title {
      font-size: 1.1rem; font-weight: 600; color: #e8f5f0;
      margin: 0; padding: 20px 24px 0;
    }
    .modal__body { padding: 16px 24px; }
    .modal__info { margin: 0 0 12px; color: #9bbfb0; font-size: 0.9rem; }
    .modal__hint { margin: 8px 0 0; color: #9bbfb0; font-size: 0.8rem; }
    .modal__error { color: #e54430; font-size: 0.85rem; margin: 8px 0 0; }
    .modal__footer {
      padding: 12px 24px 20px;
      display: flex; justify-content: flex-end; gap: 10px;
    }

    /* ── Form fields ── */
    .field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 14px; }
    .field__label { font-size: 0.85rem; font-weight: 600; color: #9bbfb0; }
    .field__req { color: #e54430; }
    .field__hint { font-size: 0.75rem; color: #3a5a50; }
    .field__input {
      height: 38px; padding: 0 12px;
      background: #0B1410; border: 1px solid #1e2e28;
      border-radius: 6px; color: #e8f5f0;
      font-size: 0.9rem; font-family: inherit;
      transition: border-color 0.15s;
      outline: none;
    }
    .field__input:focus { border-color: #2C9C74; }
    .field__input::placeholder { color: #3a5a50; }
    .field__slug-wrap { display: flex; align-items: center; gap: 0; }
    .field__slug-prefix {
      height: 38px; padding: 0 8px 0 12px;
      background: #0B1410; border: 1px solid #1e2e28; border-right: none;
      border-radius: 6px 0 0 6px; color: #3a5a50;
      display: flex; align-items: center; font-family: monospace;
    }
    .field__input--slug { border-radius: 0 6px 6px 0; flex: 1; font-family: monospace; }

    /* ── Code block ── */
    .code-block {
      position: relative;
      background: #0B1410; border: 1px solid #1e2e28;
      border-radius: 8px; padding: 12px 48px 12px 16px;
    }
    .code-block code {
      font-size: 0.8rem; color: #3FB67D;
      font-family: monospace; white-space: pre-wrap; word-break: break-all;
    }
    .btn-copy {
      position: absolute; top: 8px; right: 8px;
      width: 28px; height: 28px;
      background: transparent; border: 1px solid #1e2e28;
      border-radius: 4px; color: #9bbfb0;
      cursor: pointer; font-size: 0.9rem;
      display: flex; align-items: center; justify-content: center;
      transition: border-color 0.12s, color 0.12s;
    }
    .btn-copy:hover { border-color: #2C9C74; color: #2C9C74; }

    /* ── Buttons ── */
    .btn-primary {
      height: 36px; padding: 0 18px;
      background: #2C9C74; color: #fff;
      border: none; border-radius: 6px;
      font-size: 0.9rem; font-weight: 600; font-family: inherit;
      cursor: pointer; transition: background 0.15s;
    }
    .btn-primary:hover:not(:disabled) { background: #3FB67D; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-cancel {
      height: 36px; padding: 0 18px;
      background: transparent; color: #9bbfb0;
      border: 1px solid #1e2e28; border-radius: 6px;
      font-size: 0.9rem; font-family: inherit;
      cursor: pointer; transition: border-color 0.15s;
    }
    .btn-cancel:hover { border-color: #9bbfb0; }
    .btn-danger {
      height: 36px; padding: 0 18px;
      background: #e54430; color: #fff;
      border: none; border-radius: 6px;
      font-size: 0.9rem; font-weight: 600; font-family: inherit;
      cursor: pointer; transition: background 0.15s;
    }
    .btn-danger:hover:not(:disabled) { background: #c62c19; }
    .btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }
  `],
})
export class HomeComponent implements OnInit {
  protos: PrototypeDef[] = [];
  loading = false;

  // Create modal
  createOpen = false;
  form = { title: '', slug: '', description: '', figma: '' };
  scaffoldCmd: string | null = null;
  createError = '';
  saving = false;
  copied = false;

  // Archive confirm
  archiveTarget: PrototypeDef | null = null;

  // Scaffold command for pending cards
  scaffoldTarget: PrototypeDef | null = null;

  constructor(readonly svc: PrototypeService) {}

  async ngOnInit(): Promise<void> {
    this.loading = true;
    this.protos = await this.svc.list();
    this.loading = false;
  }

  // ── Create ──────────────────────────────────────────────────────────────────

  openCreate(): void {
    this.form = { title: '', slug: '', description: '', figma: '' };
    this.scaffoldCmd = null;
    this.createError = '';
    this.createOpen = true;
  }

  closeCreate(): void {
    this.createOpen = false;
    this.scaffoldCmd = null;
  }

  autoSlug(title: string): void {
    this.form.slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  sanitizeSlug(): void {
    this.form.slug = this.form.slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '');
  }

  async doCreate(): Promise<void> {
    if (!this.form.title || !this.form.slug) return;
    this.createError = '';
    this.saving = true;
    try {
      const created = await this.svc.create(this.form);
      this.protos = [created, ...this.protos];
      this.scaffoldCmd = this.buildCmd(created);
    } catch (err: any) {
      this.createError = err?.message ?? 'Failed to create prototype.';
    } finally {
      this.saving = false;
    }
  }

  buildCmd(proto: PrototypeDef): string {
    let cmd = `node scripts/new-proto.js --slug "${proto.slug}" --title "${proto.title}"`;
    if (proto.description) cmd += ` --description "${proto.description}"`;
    if (proto.figma)       cmd += ` --figma "${proto.figma}"`;
    return cmd;
  }

  // ── Archive ──────────────────────────────────────────────────────────────────

  confirmArchive(event: Event, proto: PrototypeDef): void {
    event.preventDefault();
    event.stopPropagation();
    this.archiveTarget = proto;
  }

  async doArchive(): Promise<void> {
    if (!this.archiveTarget) return;
    this.saving = true;
    try {
      await this.svc.archive(this.archiveTarget);
      this.protos = this.protos.filter(p => p.slug !== this.archiveTarget!.slug);
      this.archiveTarget = null;
    } catch (err: any) {
      console.error('[Archive]', err);
    } finally {
      this.saving = false;
    }
  }

  // ── Scaffold command overlay ─────────────────────────────────────────────────

  showScaffold(proto: PrototypeDef): void {
    this.scaffoldTarget = proto;
    this.copied = false;
  }

  async copyCmd(cmd?: string): Promise<void> {
    const text = cmd ?? this.scaffoldCmd ?? '';
    await navigator.clipboard.writeText(text);
    this.copied = true;
    setTimeout(() => (this.copied = false), 2000);
  }
}
