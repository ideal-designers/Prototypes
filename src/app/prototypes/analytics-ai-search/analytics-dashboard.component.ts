import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DS_COMPONENTS } from '../../shared/ds';
import type { SegmentItem } from '../../shared/ds';
import { FILES_BY_BIDDER, GROUP_ROWS, KPI, PARTICIPANT_STATES } from './analytics-ai-search.data';

/**
 * Dashboard body below the toolbar — "Since project creation" down to the groups table.
 * Figma: AI-Assistant (Vhy3jLaJ9nasbzTtqbu3qB) › ↳ Dashboards › 324:24202. Static replica.
 */
@Component({
  selector: 'fvdr-vdr-analytics-dashboard',
  standalone: true,
  imports: [CommonModule, ...DS_COMPONENTS],
  template: `
    <div class="dash">
      <div class="since">
        <h2 class="since__title">Since project creation</h2>
        <span class="since__meta">Created on Mar 18, 2026 · 84 days ago</span>
      </div>

      <div class="kpis">
        <div class="kpi" *ngFor="let k of kpi">
          <span class="kpi__label">{{ k.label }}</span>
          <span class="kpi__value">{{ k.value }}<small *ngIf="k.note">{{ k.note }}</small></span>
        </div>
      </div>

      <!-- Participants -->
      <section class="panel">
        <header class="panel__head">
          <span>42 participants</span>
          <button type="button" class="panel__link" title="Open participants" aria-label="Open participants"><fvdr-icon name="link"></fvdr-icon></button>
        </header>
        <div class="panel__body">
          <div class="legend">
            <span class="legend__item" *ngFor="let s of states">
              <span class="dot" [ngClass]="'bg--' + s.tone"></span><strong>{{ s.value }}</strong>{{ s.label }}
            </span>
            <span class="legend__help">How is this calculated? <fvdr-icon name="help"></fvdr-icon></span>
          </div>
          <div class="stack">
            <span *ngFor="let s of states" [ngClass]="'bg--' + s.tone" [style.flex-grow]="s.share"></span>
          </div>
        </div>
      </section>

      <!-- Unique files accessed -->
      <section class="panel">
        <header class="panel__head">
          <span>Unique files accessed</span>
          <button type="button" class="panel__link" title="Open report" aria-label="Open report"><fvdr-icon name="link"></fvdr-icon></button>
        </header>
        <div class="panel__body">
          <div class="legend">
            <span class="legend__item"><span class="dot bg--accessed"></span>Accessed</span>
            <span class="legend__item"><span class="dot bg--not-accessed"></span>Not accessed</span>
            <span class="legend__item"><span class="dash-line"></span>All files (300), including recycle bin (10) and Q&amp;A (5)</span>
            <span class="legend__help">How is this calculated? <fvdr-icon name="help"></fvdr-icon></span>
          </div>
          <div class="chart">
            <div class="chart__axis"><span>200</span><span>100</span><span>0</span></div>
            <div class="chart__plot">
              <span class="chart__limit"></span>
              <div class="col" *ngFor="let b of files">
                <span class="col__pct">{{ b.pct }}%</span>
                <span class="col__bar"><span class="col__fill" [style.height.%]="b.pct"></span></span>
                <span class="col__name">{{ b.name }}</span>
                <span class="col__sub">{{ b.accessed }} / 168</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Group engagement -->
      <section class="panel">
        <header class="panel__head panel__head--tools">
          <span>Group engagement by</span>
          <fvdr-segment variant="table" [items]="engagementTabs" [activeId]="engagementBy" (activeIdChange)="engagementBy = $event"></fvdr-segment>
          <fvdr-btn label="Daily trend" variant="secondary" size="s"></fvdr-btn>
          <fvdr-btn label="Last 7 days" variant="secondary" size="s" iconName="filter"></fvdr-btn>
          <span class="panel__spacer"></span>
          <button type="button" class="panel__link" title="Open report" aria-label="Open report"><fvdr-icon name="link"></fvdr-icon></button>
        </header>
        <div class="panel__body">
          <div class="legend">
            <span class="legend__item"><span class="dot bg--views"></span>Views</span>
            <span class="legend__item"><span class="dot bg--downloads"></span>Downloads</span>
            <span class="legend__item"><span class="dot bg--prints"></span>Prints</span>
            <span class="legend__help">How is this calculated? <fvdr-icon name="help"></fvdr-icon></span>
          </div>
          <div class="groups">
            <div class="grp" *ngFor="let g of groups; let i = index">
              <div class="grp__bars">
                <span class="grp__bar bg--views" [style.height.%]="60 + (i % 3) * 12"></span>
                <span class="grp__bar bg--downloads" [style.height.%]="22 + (i % 4) * 6"></span>
                <span class="grp__bar bg--prints" [style.height.%]="8 + (i % 2) * 6"></span>
              </div>
              <span class="col__name">{{ g.name }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Groups table -->
      <div class="gt" role="table" aria-label="Top users and groups">
        <div class="gt__tr gt__tr--head" role="row">
          <span role="columnheader">Group</span><span role="columnheader">Signed-in</span><span role="columnheader">Sign-ins</span>
          <span role="columnheader">Last sign-in</span><span role="columnheader">Viewing time</span>
          <span role="columnheader">Accessed / permitted files</span><span role="columnheader">Open Q&amp;A</span>
        </div>
        <div class="gt__tr" role="row" *ngFor="let g of groups">
          <span role="cell" class="gt__grp"><fvdr-icon name="chevron-right"></fvdr-icon><fvdr-icon name="group" class="gt__ico"></fvdr-icon>{{ g.name }}</span>
          <span role="cell"><span class="pill">{{ g.signedIn }}</span></span>
          <span role="cell">{{ g.signIns }} <small class="gt__delta" *ngIf="g.delta">{{ g.delta }}</small></span>
          <span role="cell">{{ g.last }}</span>
          <span role="cell">{{ g.time }}</span>
          <span role="cell" class="gt__files">
            <span>{{ g.files }}%</span>
            <span class="gt__track"><span class="gt__fill" [style.width.%]="g.files"></span></span>
          </span>
          <span role="cell">{{ g.qa }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; font-family: var(--font-family); color: var(--color-text-primary); font-size: var(--font-size-base, 14px); }
    .dash { display: flex; flex-direction: column; gap: var(--space-6); }

    .since { display: flex; align-items: baseline; justify-content: space-between; gap: var(--space-4); }
    .since__title { margin: 0; font-size: var(--font-size-xl, 18px); line-height: 24px; font-weight: var(--font-weight-semi, 600); }
    .since__meta { color: var(--color-text-secondary); }

    .kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-4); margin-top: calc(var(--space-2) * -1); }
    .kpi { display: flex; flex-direction: column; gap: var(--space-1); padding: var(--space-4);
      border: 1px solid var(--color-divider); border-radius: var(--radius-sm); }
    .kpi__label { font-weight: var(--font-weight-semi, 600); }
    .kpi__value { font-size: var(--font-size-2xl, 24px); line-height: 32px; }
    .kpi__value small { margin-left: var(--space-1); font-size: var(--text-caption1-size, 12px); color: var(--color-text-secondary); }

    .panel { display: flex; flex-direction: column; gap: var(--space-4); }
    .panel__head { display: flex; align-items: center; gap: var(--space-2); min-height: 48px; padding-left: var(--space-4);
      background: var(--color-stone-200); border-radius: var(--radius-sm); font-weight: var(--font-weight-semi, 600); }
    .panel__head > span:first-child { flex: 1; }
    .panel__head--tools > span:first-child { flex: 0 0 auto; }
    .panel__spacer { flex: 1; }
    .panel__link { display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; padding: 0;
      border: none; background: transparent; cursor: pointer; color: var(--color-text-secondary); font-size: var(--font-size-lg, 16px); }
    .panel__link:hover { color: var(--color-text-primary); }
    .panel__body { display: flex; flex-direction: column; gap: var(--space-4); padding: 0 var(--space-4); }

    .legend { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-6); }
    .legend__item { display: inline-flex; align-items: center; gap: var(--space-1); }
    .legend__item strong { font-weight: var(--font-weight-semi, 600); margin-right: 2px; }
    .legend__help { margin-left: auto; display: inline-flex; align-items: center; gap: var(--space-2); color: var(--color-text-secondary); }
    .dot { width: 8px; height: 8px; border-radius: 2px; flex: 0 0 auto; }
    .dash-line { width: 16px; border-top: 2px dashed var(--chart-threshold); }

    .bg--invited { background: var(--chart-invited); } .bg--signed { background: var(--chart-signed-in); }
    .bg--engaged { background: var(--chart-engaged); } .bg--deactivated { background: var(--chart-deactivated); }
    .bg--deleted { background: var(--chart-deleted); } .bg--accessed { background: var(--chart-accessed); }
    .bg--not-accessed { background: var(--chart-not-accessed); } .bg--views { background: var(--chart-views); }
    .bg--downloads { background: var(--chart-downloads); } .bg--prints { background: var(--chart-prints); }

    .stack { display: flex; gap: 2px; height: 16px; }
    .stack span { flex: 1 1 0; border-radius: var(--radius-sm); }

    .chart { display: flex; gap: var(--space-4); height: 168px; }
    .chart__axis { display: flex; flex-direction: column; justify-content: space-between; padding: var(--space-3) 0 36px;
      font-size: var(--text-caption1-size, 12px); color: var(--color-text-secondary); }
    .chart__plot { position: relative; flex: 1; display: flex; gap: var(--space-3); padding-top: var(--space-3); }
    .chart__limit { position: absolute; left: 0; right: 0; top: var(--space-3); border-top: 1px dashed var(--chart-threshold); }
    .col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px; min-width: 0; }
    .col__pct { font-size: var(--text-caption1-size, 12px); color: var(--chart-accessed); }
    .col__bar { flex: 1; width: 40px; display: flex; align-items: flex-end; background: var(--chart-not-accessed);
      border-radius: var(--radius-sm) var(--radius-sm) 0 0; overflow: hidden; }
    .col__fill { width: 100%; background: var(--chart-accessed); }
    .col__name { font-size: var(--text-caption1-size, 12px); line-height: 16px; white-space: nowrap; }
    .col__sub { font-size: var(--text-caption1-size, 12px); line-height: 16px; color: var(--color-text-secondary); }

    .groups { display: flex; gap: var(--space-3); height: 160px; }
    .grp { flex: 1; display: flex; flex-direction: column; align-items: center; gap: var(--space-1); }
    .grp__bars { flex: 1; display: flex; align-items: flex-end; gap: 2px; }
    .grp__bar { width: 12px; border-radius: 2px 2px 0 0; }

    .gt { display: flex; flex-direction: column; }
    .gt__tr { display: grid; grid-template-columns: 1.1fr 1fr 0.8fr 0.8fr 0.8fr 1.6fr 0.8fr; align-items: center;
      min-height: 48px; padding: 0 var(--space-4); column-gap: var(--space-4); }
    .gt__tr--head { background: var(--color-stone-200); border-radius: var(--radius-sm); font-weight: var(--font-weight-semi, 600); }
    .gt__tr:not(.gt__tr--head):hover { background: var(--color-hover-bg); }
    .gt__grp { display: inline-flex; align-items: center; gap: var(--space-2); }
    .gt__grp fvdr-icon { color: var(--color-text-secondary); }
    .gt__ico { font-size: var(--font-size-lg, 16px); }
    .pill { display: inline-flex; padding: 2px var(--space-2); border-radius: var(--radius-full); background: var(--color-stone-300); }
    .gt__delta { color: var(--color-primary-500); font-size: var(--text-caption1-size, 12px); }
    .gt__files { display: flex; flex-direction: column; gap: var(--space-1); }
    .gt__track { height: 6px; border-radius: var(--radius-sm); background: var(--chart-not-accessed); overflow: hidden; }
    .gt__fill { display: block; height: 100%; background: var(--chart-accessed); }
  `],
})
export class VdrAnalyticsDashboardComponent {
  readonly kpi = KPI;
  readonly states = PARTICIPANT_STATES;
  readonly files = FILES_BY_BIDDER;
  readonly groups = GROUP_ROWS;
  engagementBy = 'files';
  readonly engagementTabs: SegmentItem[] = [
    { id: 'files', label: 'File actions' }, { id: 'signins', label: 'Sign-ins' },
    { id: 'time', label: 'Viewing time' }, { id: 'qa', label: 'Q&A' },
  ];
}
