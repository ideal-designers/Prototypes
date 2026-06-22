import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  DS_COMPONENTS,
  ToastService,
  SidebarNavItem,
  BreadcrumbItem,
  HeaderAction,
  TabItem,
  DropdownOption,
  FvdrIconName,
  FvdrFileType,
} from '../../shared/ds';
import { TrackerService } from '../../services/tracker.service';

interface PromptDef {
  id: string;
  title: string;
  desc: string;
  body: string;
  task: string;
  docType: string;
  byIdeals: boolean;
  favorite: boolean;
}

interface ReportClaim {
  text: string;
  source?: string;
}

interface ReportSection {
  heading: string;
  claims: ReportClaim[];
}

interface AgentDef {
  id: string;
  title: string;
  desc: string;
  icon: FvdrIconName;
  soon?: boolean;
}

interface Suggestion {
  label: string;
  body: string;
}

interface ScopeFile {
  id: string;
  label: string;
  fileType: FvdrFileType;
}

interface ScopeFolder {
  id: string;
  label: string;
  files: ScopeFile[];
}

@Component({
  selector: 'fvdr-global-ai',
  standalone: true,
  imports: [CommonModule, FormsModule, ...DS_COMPONENTS],
  template: `
<div class="ga-shell" [class.dark-theme]="isDark">

  <!-- ── Room sidebar ───────────────────────────────────────────── -->
  <fvdr-sidebar-nav
    variant="vdr"
    accountName="Project Apollo"
    [items]="navItems"
    [(collapsed)]="sidebarCollapsed"
    (itemClick)="onNavClick($event)"
  ></fvdr-sidebar-nav>

  <!-- ── Main ───────────────────────────────────────────────────── -->
  <div class="ga-main">

    <fvdr-header
      [breadcrumbs]="breadcrumbs"
      [actions]="headerActions"
      [showMenu]="false"
      userName="DT"
      (actionClick)="onHeaderAction($event)"
    ></fvdr-header>

    <div class="ga-content">

      <!-- ════════════ AI HUB ════════════ -->
      <ng-container *ngIf="view === 'hub'">

        <!-- Permissions invariant -->
        <fvdr-info-banner
          variant="info"
          title="Works inside the room, with your access"
          message="The assistant only reads and returns documents you already have permission to see. Nothing leaves the room by default."
        ></fvdr-info-banner>

        <!-- Hero -->
        <div class="ga-hero">
          <span class="ga-hero__mark"><fvdr-icon name="api"></fvdr-icon></span>
          <h1 class="ga-hero__title">What can I help you with?</h1>
          <p class="ga-hero__sub">Ask anything about the documents in <b>Project Apollo</b>, or start from a curated due-diligence prompt.</p>

          <div class="ga-suggest">
            <fvdr-chip
              *ngFor="let s of suggestions"
              [label]="s.label"
              variant="grey"
              size="s"
              [clickable]="true"
              data-track="suggested-prompt"
              (clicked)="useSuggestion(s)"
            ></fvdr-chip>
          </div>
        </div>

        <!-- Composer -->
        <div class="ga-composer">
          <fvdr-textarea
            [(ngModel)]="query"
            placeholder="Ask anything about the documents in this room…"
            [rows]="3"
          ></fvdr-textarea>

          <div class="ga-composer__bar">
            <div class="ga-composer__controls">
              <div class="ga-control" data-track="model-select">
                <fvdr-dropdown
                  [options]="modelOptions"
                  [(ngModel)]="model"
                  size="s"
                  iconLeft="api"
                ></fvdr-dropdown>
              </div>

              <fvdr-btn
                [label]="scopeLabel()"
                variant="secondary"
                size="s"
                iconName="folder"
                dataTrack="sources-scope"
                (clicked)="openScopePicker()"
              ></fvdr-btn>

              <fvdr-btn
                label="Browse prompts"
                variant="ghost"
                size="s"
                iconName="overview"
                dataTrack="prompt-catalog-open"
                (clicked)="openCatalog()"
              ></fvdr-btn>
            </div>

            <fvdr-btn
              label="Ask"
              variant="primary"
              size="m"
              iconName="chevron-right"
              [disabled]="!query.trim()"
              dataTrack="ai-send"
              (clicked)="onAsk()"
            ></fvdr-btn>
          </div>

          <p class="ga-disclaimer">Assistant uses AI and may display inaccurate info — always verify against the source documents.</p>
        </div>

        <!-- Inline answer -->
        <div class="ga-answer" *ngIf="asking || answered">
          <div class="ga-answer__head">
            <span class="ga-agent__icon"><fvdr-icon name="api"></fvdr-icon></span>
            <div class="ga-answer__meta">
              <span class="ga-answer__model">{{ modelLabel() }}</span>
              <span class="ga-answer__scope">· {{ scopeLabel() }} · permission-scoped</span>
            </div>
          </div>

          <div class="ga-answer__loading" *ngIf="asking">
            <fvdr-icon name="spinner" class="ga-spin"></fvdr-icon>
            <span>Reading the documents you have access to…</span>
          </div>

          <ng-container *ngIf="answered && !asking">
            <div class="ga-claim" *ngFor="let c of answerClaims">
              <p class="ga-claim__text">{{ c.text }}</p>
              <button
                *ngIf="c.source"
                class="ga-cite"
                data-track="source-citation"
                [attr.title]="'Open ' + c.source"
                (click)="openSource(c.source)"
              >
                <fvdr-icon name="link"></fvdr-icon>
                <span>{{ c.source }}</span>
              </button>
            </div>

            <div class="ga-answer__foot">
              <span class="ga-answer__note"><fvdr-icon name="lock-close"></fvdr-icon> Only documents within your access were used.</span>
              <fvdr-btn
                label="Open in Deep Research"
                variant="ghost"
                size="s"
                iconName="search"
                dataTrack="answer-deep-research"
                (clicked)="openDeepResearch()"
              ></fvdr-btn>
            </div>
          </ng-container>
        </div>

        <!-- Agents gallery -->
        <div class="ga-section">
          <div class="ga-section__head">
            <h2 class="ga-section__title">Agents</h2>
            <span class="ga-section__hint">Multi-step assistants that work across the whole room</span>
          </div>

          <div class="ga-grid ga-grid--agents">
            <fvdr-card
              *ngFor="let a of agents"
              [hoverable]="!a.soon"
              [attr.data-track]="'agent-' + a.id"
              (click)="onAgentClick(a)"
            >
              <div class="ga-agent" [class.ga-agent--soon]="a.soon">
                <span class="ga-agent__icon"><fvdr-icon [name]="a.icon"></fvdr-icon></span>
                <div class="ga-agent__body">
                  <div class="ga-agent__head">
                    <h3 class="ga-agent__title">{{ a.title }}</h3>
                    <fvdr-badge *ngIf="!a.soon" label="By Ideals" variant="primary"></fvdr-badge>
                    <fvdr-badge *ngIf="a.soon" label="Soon" variant="neutral"></fvdr-badge>
                  </div>
                  <p class="ga-agent__desc">{{ a.desc }}</p>
                </div>
                <fvdr-icon *ngIf="!a.soon" name="chevron-right" class="ga-agent__go"></fvdr-icon>
              </div>
            </fvdr-card>

            <fvdr-card [hoverable]="false">
              <div class="ga-agent ga-agent--create">
                <span class="ga-agent__icon ga-agent__icon--ghost"><fvdr-icon name="plus"></fvdr-icon></span>
                <div class="ga-agent__body">
                  <h3 class="ga-agent__title">Create your own agent</h3>
                  <p class="ga-agent__desc">Chain prompts and sources into a reusable workflow for your deal team.</p>
                </div>
                <fvdr-btn
                  label="Create agent"
                  variant="primary"
                  size="s"
                  iconName="plus"
                  dataTrack="agent-create"
                  (clicked)="onCreateAgent()"
                ></fvdr-btn>
              </div>
            </fvdr-card>
          </div>
        </div>
      </ng-container>

      <!-- ════════════ DEEP RESEARCH ════════════ -->
      <ng-container *ngIf="view === 'deep-research'">
        <button class="ga-back" data-track="deep-research-back" (click)="backToHub()">
          <fvdr-icon name="chevron-left"></fvdr-icon> Back to AI hub
        </button>

        <div class="ga-dr-head">
          <span class="ga-agent__icon"><fvdr-icon name="search"></fvdr-icon></span>
          <div>
            <div class="ga-agent__head">
              <h1 class="ga-dr-title">Deep Research Agent</h1>
              <fvdr-badge label="By Ideals" variant="primary"></fvdr-badge>
            </div>
            <p class="ga-agent__desc">Ask a research question. The agent reads across the room's documents — within your permissions — and assembles a sourced answer.</p>
          </div>
        </div>

        <!-- Composer (same controls) -->
        <div class="ga-composer">
          <fvdr-textarea
            [(ngModel)]="researchQuery"
            placeholder="e.g. Assess the target's liquidity and near-term contractual obligations"
            [rows]="2"
          ></fvdr-textarea>
          <div class="ga-composer__bar">
            <div class="ga-composer__controls">
              <div class="ga-control" data-track="model-select">
                <fvdr-dropdown [options]="modelOptions" [(ngModel)]="model" size="s" iconLeft="api"></fvdr-dropdown>
              </div>
              <fvdr-btn
                [label]="scopeLabel()"
                variant="secondary"
                size="s"
                iconName="folder"
                dataTrack="sources-scope"
                (clicked)="openScopePicker()"
              ></fvdr-btn>
            </div>
            <fvdr-btn
              label="Run Deep Research"
              variant="primary"
              size="m"
              iconName="search"
              dataTrack="agent-deep-research-run"
              [loading]="researching"
              (clicked)="runResearch()"
            ></fvdr-btn>
          </div>
        </div>

        <!-- Empty state -->
        <div class="ga-dr-empty" *ngIf="!reportVisible && !researching">
          <fvdr-icon name="search" class="ga-dr-empty__icon"></fvdr-icon>
          <p>Run the agent to generate a sourced report. Every claim will link back to the document and page it came from.</p>
        </div>

        <!-- Demo report -->
        <div class="ga-report" *ngIf="reportVisible">
          <div class="ga-report__head">
            <h2 class="ga-report__title">Liquidity &amp; near-term contractual obligations</h2>
            <span class="ga-report__meta">Synthesized from 6 documents · permission-scoped</span>
          </div>

          <div class="ga-report__section" *ngFor="let sec of report">
            <h3 class="ga-report__heading">{{ sec.heading }}</h3>
            <div class="ga-claim" *ngFor="let c of sec.claims">
              <p class="ga-claim__text">{{ c.text }}</p>
              <button
                class="ga-cite"
                data-track="source-citation"
                [attr.title]="'Open ' + c.source"
                (click)="openSource(c.source)"
              >
                <fvdr-icon name="link"></fvdr-icon>
                <span>{{ c.source }}</span>
              </button>
            </div>
          </div>

          <p class="ga-disclaimer">Assistant uses AI and may display inaccurate info — always verify against the source documents.</p>
        </div>
      </ng-container>

    </div>
  </div>

  <!-- ── Source scope picker modal ─────────────────────────────── -->
  <fvdr-modal
    [visible]="scopePickerOpen"
    title="Choose documents"
    size="m"
    confirmLabel="Use selection"
    cancelLabel="Cancel"
    (confirmed)="applyScope()"
    (cancelled)="scopePickerOpen = false"
    (closed)="scopePickerOpen = false"
  >
    <div class="ga-scope">
      <p class="ga-scope__hint">Limit the assistant to specific files or folders. It still only reads what you have permission to see.</p>

      <div class="ga-scope__row ga-scope__row--all">
        <fvdr-checkbox [checked]="draftAll" (checkedChange)="toggleAll($event)"></fvdr-checkbox>
        <fvdr-icon name="folder" class="ga-scope__icon"></fvdr-icon>
        <span class="ga-scope__label">All documents in this room</span>
      </div>

      <div class="ga-scope__tree">
        <ng-container *ngFor="let f of roomDocs">
          <div class="ga-scope__row">
            <fvdr-checkbox [checked]="isChecked(f.id)" (checkedChange)="toggleNode(f.id)"></fvdr-checkbox>
            <fvdr-file-icon type="folder" class="ga-scope__icon"></fvdr-file-icon>
            <span class="ga-scope__label">{{ f.label }}</span>
          </div>
          <div class="ga-scope__row ga-scope__row--file" *ngFor="let file of f.files">
            <fvdr-checkbox [checked]="isChecked(file.id)" (checkedChange)="toggleNode(file.id)"></fvdr-checkbox>
            <fvdr-file-icon [type]="file.fileType" class="ga-scope__icon"></fvdr-file-icon>
            <span class="ga-scope__label">{{ file.label }}</span>
          </div>
        </ng-container>
      </div>
    </div>
  </fvdr-modal>

  <!-- ── Prompt catalog modal ──────────────────────────────────── -->
  <fvdr-modal
    [visible]="catalogOpen"
    title="Prompt catalog"
    size="xl"
    (closed)="catalogOpen = false"
  >
    <div class="ga-cat">
      <div class="ga-cat__toolbar">
        <fvdr-tabs [tabs]="catalogTabs" [(activeId)]="catalogTab"></fvdr-tabs>
        <fvdr-btn label="Create new prompt" variant="secondary" size="s" iconName="plus" dataTrack="prompt-create" (clicked)="onCreatePrompt()"></fvdr-btn>
      </div>

      <div class="ga-cat__filters">
        <fvdr-search [(ngModel)]="catalogSearch" placeholder="Search prompts…" size="s"></fvdr-search>
        <div class="ga-cat__facet">
          <fvdr-dropdown [options]="taskOptions" [(ngModel)]="taskFilter" size="s" placeholder="Task"></fvdr-dropdown>
        </div>
        <div class="ga-cat__facet">
          <fvdr-dropdown [options]="docTypeOptions" [(ngModel)]="docTypeFilter" size="s" placeholder="Document type"></fvdr-dropdown>
        </div>
      </div>

      <div class="ga-grid ga-grid--prompts" *ngIf="visiblePrompts().length">
        <fvdr-card
          *ngFor="let p of visiblePrompts()"
          [hoverable]="true"
          data-track="prompt-insert"
          (click)="insertPrompt(p)"
        >
          <div class="ga-prompt">
            <div class="ga-prompt__head">
              <h3 class="ga-prompt__title">{{ p.title }}</h3>
              <fvdr-badge *ngIf="p.byIdeals" label="By Ideals" variant="primary"></fvdr-badge>
            </div>
            <p class="ga-prompt__desc">{{ p.desc }}</p>
            <div class="ga-prompt__tags">
              <fvdr-chip [label]="p.task" variant="grey" size="xs"></fvdr-chip>
              <fvdr-chip [label]="p.docType" variant="grey" size="xs"></fvdr-chip>
            </div>
          </div>
        </fvdr-card>
      </div>

      <div class="ga-cat__empty" *ngIf="!visiblePrompts().length">
        <fvdr-icon name="search" class="ga-dr-empty__icon"></fvdr-icon>
        <p *ngIf="catalogTab === 'custom'">You haven't created any custom prompts yet.</p>
        <p *ngIf="catalogTab !== 'custom'">No prompts match your search.</p>
      </div>
    </div>
  </fvdr-modal>

  <fvdr-toast-host></fvdr-toast-host>
</div>
  `,
  styles: [`
    :host { display: block; font-family: var(--font-family); color: var(--color-text-primary); }

    .ga-shell { display: flex; min-height: 100vh; background: var(--color-stone-0); }
    .ga-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .ga-content {
      flex: 1; overflow-y: auto;
      padding: var(--space-8) var(--space-10);
      max-width: 920px; width: 100%; margin: 0 auto;
      display: flex; flex-direction: column; gap: var(--space-6);
    }

    /* ── Hero ── */
    .ga-hero { text-align: center; padding: var(--space-4) 0 var(--space-2); }
    .ga-hero__mark {
      display: inline-flex; align-items: center; justify-content: center;
      width: 48px; height: 48px; border-radius: var(--radius-full);
      background: var(--color-primary-50); color: var(--color-primary-500);
      font-size: 22px; margin-bottom: var(--space-3);
    }
    .ga-hero__title {
      font-size: var(--font-size-3xl, 28px); font-weight: var(--font-weight-bold, 700);
      color: var(--color-text-primary); margin: 0 0 var(--space-2);
    }
    .ga-hero__sub {
      font-size: var(--font-size-md, 15px); color: var(--color-text-secondary);
      margin: 0; max-width: 540px; margin-inline: auto; line-height: 1.5;
    }

    /* ── Composer ── */
    .ga-composer {
      border: 1px solid var(--color-divider); border-radius: var(--radius-lg);
      background: var(--color-stone-0); padding: var(--space-4);
      display: flex; flex-direction: column; gap: var(--space-3);
    }
    .ga-composer__bar { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); flex-wrap: wrap; }
    .ga-composer__controls { display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; }
    .ga-control { display: inline-flex; }
    .ga-web-warn { margin-top: calc(-1 * var(--space-1)); }
    .ga-disclaimer {
      font-size: var(--font-size-xs, 12px); color: var(--color-text-secondary);
      margin: 0; line-height: 1.4;
    }

    /* ── Starter suggestions ── */
    .ga-suggest { display: flex; flex-wrap: wrap; gap: var(--space-2); justify-content: center; margin-top: var(--space-4); }

    /* ── Inline answer ── */
    .ga-answer {
      border: 1px solid var(--color-divider); border-radius: var(--radius-lg);
      background: var(--color-stone-100); padding: var(--space-4);
      display: flex; flex-direction: column; gap: var(--space-3);
    }
    .ga-answer__head { display: flex; align-items: center; gap: var(--space-2); }
    .ga-answer__meta { display: flex; align-items: baseline; gap: var(--space-1); flex-wrap: wrap; }
    .ga-answer__model { font-size: var(--font-size-sm, 13px); font-weight: var(--font-weight-semi, 600); color: var(--color-text-primary); }
    .ga-answer__scope { font-size: var(--font-size-xs, 12px); color: var(--color-text-secondary); }
    .ga-answer__loading { display: flex; align-items: center; gap: var(--space-2); color: var(--color-text-secondary); font-size: var(--font-size-sm, 13px); }
    .ga-spin { animation: ga-spin 0.9s linear infinite; color: var(--color-primary-500); }
    @keyframes ga-spin { to { transform: rotate(360deg); } }
    .ga-answer__foot {
      display: flex; align-items: center; justify-content: space-between; gap: var(--space-3);
      flex-wrap: wrap; border-top: 1px solid var(--color-divider); padding-top: var(--space-3);
    }
    .ga-answer__note { display: inline-flex; align-items: center; gap: var(--space-1); font-size: var(--font-size-xs, 12px); color: var(--color-text-secondary); }

    /* ── Sections ── */
    .ga-section { display: flex; flex-direction: column; gap: var(--space-4); padding-top: var(--space-2); }
    .ga-section__head { display: flex; align-items: baseline; gap: var(--space-3); border-bottom: 1px solid var(--color-divider); padding-bottom: var(--space-2); }
    .ga-section__title { font-size: var(--font-size-lg, 18px); font-weight: var(--font-weight-bold, 700); margin: 0; color: var(--color-text-primary); }
    .ga-section__hint { font-size: var(--font-size-xs, 12px); color: var(--color-text-secondary); }

    .ga-grid { display: grid; gap: var(--space-4); }
    .ga-grid--agents { grid-template-columns: 1fr 1fr; }
    .ga-grid--prompts { grid-template-columns: repeat(3, 1fr); }

    /* ── Agent cards ── */
    .ga-agent { display: flex; align-items: flex-start; gap: var(--space-3); }
    .ga-agent--create { align-items: center; }
    .ga-agent__icon {
      flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center;
      width: 36px; height: 36px; border-radius: var(--radius-md);
      background: var(--color-primary-50); color: var(--color-primary-500); font-size: 18px;
    }
    .ga-agent__icon--ghost { background: var(--color-stone-200); color: var(--color-text-secondary); }
    .ga-agent--soon { opacity: 0.7; }
    .ga-agent--soon .ga-agent__icon { background: var(--color-stone-200); color: var(--color-text-secondary); }
    .ga-agent__body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: var(--space-1); }
    .ga-agent__head { display: flex; align-items: center; gap: var(--space-2); }
    .ga-agent__title { font-size: var(--font-size-md, 15px); font-weight: var(--font-weight-semi, 600); margin: 0; color: var(--color-text-primary); }
    .ga-agent__desc { font-size: var(--font-size-sm, 13px); color: var(--color-text-secondary); margin: 0; line-height: 1.45; }
    .ga-agent__go { color: var(--color-stone-600); font-size: 16px; flex-shrink: 0; }

    /* ── Deep Research ── */
    .ga-back {
      align-self: flex-start; display: inline-flex; align-items: center; gap: var(--space-1);
      background: none; border: none; cursor: pointer; padding: var(--space-1) 0;
      color: var(--color-text-secondary); font-family: var(--font-family);
      font-size: var(--font-size-sm, 13px); font-weight: var(--font-weight-semi, 600);
    }
    .ga-back:hover { color: var(--color-primary-600); }
    .ga-dr-head { display: flex; gap: var(--space-3); align-items: flex-start; }
    .ga-dr-title { font-size: var(--font-size-xl, 22px); font-weight: var(--font-weight-bold, 700); margin: 0; color: var(--color-text-primary); }

    .ga-dr-empty {
      display: flex; flex-direction: column; align-items: center; gap: var(--space-3);
      text-align: center; color: var(--color-text-secondary);
      padding: var(--space-10) var(--space-6);
      border: 1px dashed var(--color-divider); border-radius: var(--radius-lg);
      font-size: var(--font-size-sm, 13px); max-width: 460px; margin: 0 auto;
    }
    .ga-dr-empty__icon { font-size: 28px; color: var(--color-stone-500); }

    /* ── Report ── */
    .ga-report { display: flex; flex-direction: column; gap: var(--space-5); }
    .ga-report__head { border-bottom: 1px solid var(--color-divider); padding-bottom: var(--space-3); }
    .ga-report__title { font-size: var(--font-size-lg, 18px); font-weight: var(--font-weight-bold, 700); margin: 0 0 var(--space-1); color: var(--color-text-primary); }
    .ga-report__meta { font-size: var(--font-size-xs, 12px); color: var(--color-text-secondary); }
    .ga-report__section { display: flex; flex-direction: column; gap: var(--space-3); }
    .ga-report__heading { font-size: var(--font-size-md, 15px); font-weight: var(--font-weight-semi, 600); margin: 0; color: var(--color-text-primary); }
    .ga-claim { display: flex; flex-direction: column; gap: var(--space-1); padding-left: var(--space-3); border-left: 2px solid var(--color-primary-50); }
    .ga-claim__text { font-size: var(--font-size-sm, 14px); color: var(--color-text-primary); margin: 0; line-height: 1.5; }
    .ga-cite {
      align-self: flex-start; display: inline-flex; align-items: center; gap: var(--space-1);
      background: var(--color-primary-50); color: var(--color-primary-700);
      border: none; border-radius: var(--radius-sm); cursor: pointer;
      padding: var(--space-1) var(--space-2); font-family: var(--font-family);
      font-size: var(--font-size-xs, 12px); font-weight: var(--font-weight-semi, 600);
    }
    .ga-cite:hover { background: var(--color-primary-500); color: var(--color-stone-0); }

    /* ── Catalog modal ── */
    .ga-cat { display: flex; flex-direction: column; gap: var(--space-4); min-height: 420px; }
    .ga-cat__toolbar { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); flex-wrap: wrap; }
    .ga-cat__filters { display: flex; align-items: center; gap: var(--space-3); flex-wrap: wrap; }
    .ga-cat__filters > fvdr-search { flex: 1; min-width: 200px; }
    .ga-cat__facet { width: 160px; }
    .ga-prompt { display: flex; flex-direction: column; gap: var(--space-2); height: 100%; }
    .ga-prompt__head { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-2); }
    .ga-prompt__title { font-size: var(--font-size-md, 15px); font-weight: var(--font-weight-semi, 600); margin: 0; color: var(--color-text-primary); }
    .ga-prompt__desc { font-size: var(--font-size-sm, 13px); color: var(--color-text-secondary); margin: 0; line-height: 1.45; flex: 1; }
    .ga-prompt__tags { display: flex; gap: var(--space-1); flex-wrap: wrap; }
    .ga-cat__empty {
      flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: var(--space-3); color: var(--color-text-secondary); text-align: center;
      font-size: var(--font-size-sm, 13px);
    }

    /* ── Scope picker ── */
    .ga-scope { display: flex; flex-direction: column; gap: var(--space-2); }
    .ga-scope__hint { font-size: var(--font-size-sm, 13px); color: var(--color-text-secondary); margin: 0 0 var(--space-2); line-height: 1.45; }
    .ga-scope__row {
      display: flex; align-items: center; gap: var(--space-2);
      height: 36px; padding: 0 var(--space-2); border-radius: var(--radius-sm);
    }
    .ga-scope__row:hover { background: var(--color-hover-bg); }
    .ga-scope__row--all { border-bottom: 1px solid var(--color-divider); border-radius: 0; margin-bottom: var(--space-1); }
    .ga-scope__row--file { padding-left: var(--space-8); }
    .ga-scope__icon { color: var(--color-stone-600); font-size: 16px; }
    .ga-scope__label { font-size: var(--font-size-sm, 14px); color: var(--color-text-primary); }
    .ga-scope__tree { display: flex; flex-direction: column; max-height: 320px; overflow-y: auto; }

    /* ── Responsive ── */
    @media (max-width: 900px) {
      .ga-content { padding: var(--space-5) var(--space-4); }
      .ga-grid--agents, .ga-grid--prompts { grid-template-columns: 1fr; }
    }
  `],
})
export class GlobalAiComponent implements OnInit, OnDestroy {
  private tracker = inject(TrackerService);
  private toast = inject(ToastService);

  // ── Shell state ──
  sidebarCollapsed = false;
  isDark = false;
  view: 'hub' | 'deep-research' = 'hub';

  // ── Composer state ──
  query = '';
  researchQuery = '';
  model = 'sonnet';

  // ── Source scope state ──
  scopePickerOpen = false;
  selectedAll = true;                 // applied scope
  selectedIds = new Set<string>();    // applied scope (folder/file ids)
  draftAll = true;                    // while picker open
  draftIds = new Set<string>();

  // ── Catalog state ──
  catalogOpen = false;
  catalogTab = 'all';
  catalogSearch = '';
  taskFilter = '';
  docTypeFilter = '';

  // ── Inline answer state ──
  asking = false;
  answered = false;
  answerClaims: ReportClaim[] = [];

  // ── Deep research state ──
  researching = false;
  reportVisible = false;

  // ── Data ──
  suggestions: Suggestion[] = [
    { label: 'Summarize the financials', body: 'Summarize the target\'s financial position from the latest statements in this room.' },
    { label: 'Upcoming contract payments', body: 'List all contracts with payments due within the next 90 days, with amounts and dates.' },
    { label: 'Key risks to flag', body: 'What are the key risks I should flag from the contracts and financials in this room?' },
  ];

  agents: AgentDef[] = [
    { id: 'deep-research', title: 'Deep Research Agent', desc: 'Runs a multi-step investigation across the room and returns a structured report with a citation on every claim.', icon: 'search' },
    { id: 'summarize', title: 'Document Summarizer', desc: 'Produces a one-page summary of any document, with page references back to the source.', icon: 'finished', soon: true },
    { id: 'risk', title: 'Risk Flagger', desc: 'Scans agreements for unusual clauses, missing signatures, and high-risk terms.', icon: 'attention', soon: true },
  ];

  breadcrumbs: BreadcrumbItem[] = [
    { id: 'room', label: 'Project Apollo' },
    { id: 'ai', label: 'AI Assistant' },
  ];

  headerActions: HeaderAction[] = [
    { id: 'ai', icon: 'api', label: 'AI' },
    { id: 'theme', icon: 'theme-dark' },
    { id: 'bell', icon: 'bell', badge: 2 },
  ];

  navItems: SidebarNavItem[] = [
    { id: 'overview', label: 'Overview', icon: 'nav-overview', iconActive: 'nav-overview-active' },
    { id: 'documents', label: 'Documents', icon: 'nav-projects', iconActive: 'nav-projects-active' },
    { id: 'ai', label: 'AI Assistant', icon: 'api', iconActive: 'api', active: true },
    { id: 'qa', label: 'Q&A', icon: 'nav-qa', iconActive: 'nav-qa' },
    { id: 'participants', label: 'Participants', icon: 'nav-participants', iconActive: 'nav-participants-active' },
    { id: 'reports', label: 'Reports', icon: 'nav-reports', iconActive: 'nav-reports-active' },
  ];

  modelOptions: DropdownOption[] = [
    { value: 'sonnet', label: 'Sonnet 4.6', sublabel: 'Default', icon: 'api' },
    { value: 'gemini', label: 'Gemini 2.5 Flash', icon: 'api' },
    { value: 'gpt', label: 'GPT-5.2', icon: 'api' },
  ];

  roomDocs: ScopeFolder[] = [
    { id: 'financials', label: 'Financials', files: [
      { id: 'bs', label: 'Balance Sheet 2025.xlsx', fileType: 'xls' },
      { id: 'cf', label: 'Cash Flow Statement.pdf', fileType: 'pdf' },
      { id: 'pl', label: 'P&L 2025.xlsx', fileType: 'xls' },
    ]},
    { id: 'contracts', label: 'Contracts', files: [
      { id: 'sma', label: 'Supplier Master Agreement.pdf', fileType: 'pdf' },
      { id: 'sow', label: 'Vendor SOW — Helix.pdf', fileType: 'pdf' },
    ]},
    { id: 'legal', label: 'Legal', files: [
      { id: 'inc', label: 'Certificate of Incorporation.pdf', fileType: 'pdf' },
    ]},
  ];

  catalogTabs: TabItem[] = [
    { id: 'all', label: 'All' },
    { id: 'ideals', label: 'By Ideals' },
    { id: 'custom', label: 'Custom' },
    { id: 'favorites', label: 'Favorites' },
  ];

  taskOptions: DropdownOption[] = [
    { value: '', label: 'Any task' },
    { value: 'Analysis', label: 'Analysis' },
    { value: 'Extraction', label: 'Extraction' },
    { value: 'Drafting', label: 'Drafting' },
  ];

  docTypeOptions: DropdownOption[] = [
    { value: '', label: 'Any document' },
    { value: 'Financials', label: 'Financials' },
    { value: 'Contracts', label: 'Contracts' },
    { value: 'All', label: 'All documents' },
  ];

  prompts: PromptDef[] = [
    { id: 'fin-snapshot', title: 'Financial Snapshot', desc: "Summarize the target's financial position from the latest statements.", body: 'Give me a financial snapshot of the target based on the latest statements in this room.', task: 'Analysis', docType: 'Financials', byIdeals: true, favorite: true },
    { id: 'total-assets', title: 'Total Assets', desc: 'Extract total assets across all balance sheets in the room.', body: 'Extract the total assets from every balance sheet in this room and list them by document.', task: 'Extraction', docType: 'Financials', byIdeals: true, favorite: false },
    { id: 'total-liabilities', title: 'Total Liabilities', desc: 'Extract total liabilities and categorize by maturity.', body: 'Extract total liabilities from the financials and categorize them by maturity.', task: 'Extraction', docType: 'Financials', byIdeals: true, favorite: false },
    { id: 'upcoming-payments', title: 'Contracts with Upcoming Payments', desc: 'List contracts with payments due in the next 90 days.', body: 'List all contracts that have payments due within the next 90 days, with amounts and dates.', task: 'Analysis', docType: 'Contracts', byIdeals: true, favorite: true },
    { id: 'payment-terms', title: 'Extract payment terms', desc: 'Pull payment terms from all supplier agreements.', body: 'Extract the payment terms from every supplier agreement in this room.', task: 'Extraction', docType: 'Contracts', byIdeals: true, favorite: false },
    { id: 'significant-suppliers', title: 'Significant Suppliers', desc: 'Identify suppliers representing more than 5% of spend.', body: 'Identify the significant suppliers — those representing more than 5% of spend — from the contracts.', task: 'Analysis', docType: 'Contracts', byIdeals: true, favorite: false },
    { id: 'create-memo', title: 'Create a Memo', desc: "Draft an investment memo from the room's key documents.", body: "Draft an investment memo summarizing the key findings from this room's documents.", task: 'Drafting', docType: 'All', byIdeals: true, favorite: true },
  ];

  report: ReportSection[] = [
    {
      heading: 'Balance sheet position',
      claims: [
        { text: 'The target holds €42.3M in total assets as of Q4 2025, up 9% year over year.', source: 'Balance Sheet 2025.xlsx · p.2' },
        { text: 'Total liabilities stand at €18.7M, of which €6.1M mature within the next 12 months.', source: 'Balance Sheet 2025.xlsx · p.3' },
      ],
    },
    {
      heading: 'Near-term contractual obligations',
      claims: [
        { text: 'Three supplier contracts carry payments due within 90 days, totaling €1.2M.', source: 'Supplier Master Agreement.pdf · p.8' },
        { text: 'The largest single obligation is a €0.7M milestone payment due in March 2026.', source: 'Vendor SOW — Helix.pdf · p.4' },
      ],
    },
    {
      heading: 'Liquidity',
      claims: [
        { text: 'Net cash position improved 14% year over year, driven by faster receivables collection.', source: 'Cash Flow Statement.pdf · p.1' },
      ],
    },
  ];

  ngOnInit(): void {
    this.tracker.trackPageView('global-ai');
  }

  ngOnDestroy(): void {
    this.tracker.destroyListeners();
  }

  // ── Shell ──
  onNavClick(item: SidebarNavItem): void {
    if (item.id === 'ai') { this.view = 'hub'; return; }
    this.toast.show({ variant: 'info', message: `“${item.label}” is outside this prototype.`, duration: 2200 });
  }

  onHeaderAction(id: string): void {
    if (id === 'ai') { this.view = 'hub'; return; }
    if (id === 'theme') {
      this.isDark = !this.isDark;
      this.headerActions = this.headerActions.map(a =>
        a.id === 'theme' ? { ...a, icon: this.isDark ? 'theme-light' : 'theme-dark' } : a,
      );
      return;
    }
    this.toast.show({ variant: 'info', message: 'Outside this prototype.', duration: 1800 });
  }

  // ── Composer ──
  modelLabel(): string {
    return this.modelOptions.find(m => m.value === this.model)?.label ?? 'Assistant';
  }

  // ── Source scope ──
  private scopeLabelFor(id: string): string {
    const folder = this.roomDocs.find(f => f.id === id);
    if (folder) return folder.label;
    for (const f of this.roomDocs) {
      const file = f.files.find(x => x.id === id);
      if (file) return file.label;
    }
    return id;
  }

  scopeLabel(): string {
    if (this.selectedAll || this.selectedIds.size === 0) return 'All documents';
    if (this.selectedIds.size === 1) return this.scopeLabelFor([...this.selectedIds][0]);
    return `${this.selectedIds.size} selected`;
  }

  openScopePicker(): void {
    this.draftAll = this.selectedAll;
    this.draftIds = new Set(this.selectedIds);
    this.scopePickerOpen = true;
  }

  isChecked(id: string): boolean {
    return !this.draftAll && this.draftIds.has(id);
  }

  toggleNode(id: string): void {
    this.draftAll = false;
    if (this.draftIds.has(id)) this.draftIds.delete(id);
    else this.draftIds.add(id);
  }

  toggleAll(on: boolean): void {
    this.draftAll = on;
    if (on) this.draftIds.clear();
  }

  applyScope(): void {
    if (this.draftAll || this.draftIds.size === 0) {
      this.selectedAll = true;
      this.selectedIds.clear();
    } else {
      this.selectedAll = false;
      this.selectedIds = new Set(this.draftIds);
    }
    this.scopePickerOpen = false;
    this.tracker.trackTask('global-ai', 'task_complete', 'scope-set');
    this.toast.show({ variant: 'success', message: `Scope: ${this.scopeLabel()}`, duration: 2000 });
  }

  useSuggestion(s: Suggestion): void {
    this.query = s.body;
    this.onAsk();
  }

  onAsk(): void {
    if (!this.query.trim() || this.asking) return;
    this.asking = true;
    this.answered = false;
    this.tracker.trackTask('global-ai', 'task_complete', 'ask');
    setTimeout(() => {
      this.asking = false;
      this.answered = true;
      // Hard-coded, permission-scoped demo answer — every claim is sourced.
      this.answerClaims = [
        { text: 'Based on the latest statements, the target reported €42.3M in total assets and €18.7M in total liabilities as of Q4 2025.', source: 'Balance Sheet 2025.xlsx · p.2' },
        { text: 'Three supplier contracts carry payments totaling €1.2M due within the next 90 days.', source: 'Supplier Master Agreement.pdf · p.8' },
        { text: 'Net cash position improved 14% year over year.', source: 'Cash Flow Statement.pdf · p.1' },
      ];
    }, 1000);
  }

  // ── Catalog ──
  openCatalog(): void { this.catalogOpen = true; }

  visiblePrompts(): PromptDef[] {
    const q = this.catalogSearch.trim().toLowerCase();
    return this.prompts.filter(p => {
      if (this.catalogTab === 'ideals' && !p.byIdeals) return false;
      if (this.catalogTab === 'custom') return false; // none in this concept
      if (this.catalogTab === 'favorites' && !p.favorite) return false;
      if (this.taskFilter && p.task !== this.taskFilter) return false;
      if (this.docTypeFilter && p.docType !== this.docTypeFilter) return false;
      if (q && !(`${p.title} ${p.desc}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }

  insertPrompt(p: PromptDef): void {
    if (this.view === 'deep-research') {
      this.researchQuery = p.body;
    } else {
      this.query = p.body;
    }
    this.catalogOpen = false;
    this.tracker.trackTask('global-ai', 'task_complete', 'prompt-insert');
    this.toast.show({ variant: 'success', message: `Prompt inserted: “${p.title}”`, duration: 2200 });
  }

  onCreatePrompt(): void {
    this.toast.show({ variant: 'info', message: 'Prompt builder is outside this prototype.', duration: 2000 });
  }

  // ── Agents ──
  onAgentClick(a: AgentDef): void {
    if (a.soon) {
      this.toast.show({ variant: 'info', title: a.title, message: 'This agent is coming soon.', duration: 2000 });
      return;
    }
    if (a.id === 'deep-research') this.openDeepResearch();
  }

  openDeepResearch(): void {
    this.view = 'deep-research';
    this.reportVisible = false;
    this.researching = false;
  }

  backToHub(): void { this.view = 'hub'; }

  onCreateAgent(): void {
    this.toast.show({ variant: 'info', message: 'Agent builder is outside this prototype.', duration: 2000 });
  }

  runResearch(): void {
    if (this.researching) return;
    this.researching = true;
    this.reportVisible = false;
    setTimeout(() => {
      this.researching = false;
      this.reportVisible = true;
      this.tracker.trackTask('global-ai', 'task_complete', 'deep-research');
      this.toast.show({ variant: 'success', message: 'Report ready — every claim is sourced.', duration: 2400 });
    }, 1100);
  }

  openSource(source?: string): void {
    if (!source) return;
    this.toast.show({ variant: 'info', title: 'Opening source', message: source, duration: 2200 });
  }
}
