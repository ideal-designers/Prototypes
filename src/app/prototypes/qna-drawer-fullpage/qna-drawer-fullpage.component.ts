import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DS_COMPONENTS } from '../../shared/ds';
import type { SidebarNavItem, HeaderAction, QuickAccessItem } from '../../shared/ds';
import { TrackerService } from '../../services/tracker.service';

type ThreadStatus = 'to-approve' | 'assigned' | 'answered' | 'submitted' | 'closed';
type Priority = 'low' | 'medium' | 'high';

interface QnaThread {
  id: string;
  subject: string;
  status: ThreadStatus;
  team: string;
  author: string;
  initials: string;
  priority: Priority;
  updated: string;
  category: 'Finance' | 'Legal' | null;
  question: string;
  asked: string;
  assignees?: string[];
  note?: { author: string; initials: string; date: string; text: string; mentions: string[] };
}

type ResizableColId = 'num' | 'subject' | 'status' | 'team' | 'author' | 'priority' | 'updated' | 'category';

interface ColDef { id: ResizableColId; label: string; }

@Component({
  selector: 'fvdr-qna-drawer-fullpage',
  standalone: true,
  imports: [CommonModule, FormsModule, ...DS_COMPONENTS],
  template: `
    <div class="page-layout" #pageLayout>

      <fvdr-sidebar-nav
        variant="vdr"
        accountName="Project Nova"
        [items]="navItems"
        [(collapsed)]="sidebarCollapsed"
        (itemClick)="onNavClick($event)"
      />

      <div class="main-area">
        <fvdr-header
          [breadcrumbs]="breadcrumbItems"
          [actions]="headerActions"
          userName="YP"
        />

        <div class="content-wrap">

          <!-- Toolbar -->
          <div class="toolbar">
            <div class="toolbar-left">
              <fvdr-btn [label]="compactToolbar ? '' : 'New question'" [iconOnly]="compactToolbar" ariaLabel="New question"
                        variant="primary" size="m" iconName="plus"></fvdr-btn>
              <fvdr-btn [label]="compactToolbar ? '' : 'New FAQ'" [iconOnly]="compactToolbar" ariaLabel="New FAQ"
                        variant="secondary" size="m" iconName="comment"></fvdr-btn>
              <fvdr-btn [label]="compactToolbar ? '' : 'Export'" [iconOnly]="compactToolbar" ariaLabel="Export"
                        variant="secondary" size="m" iconName="download"></fvdr-btn>
              <fvdr-btn [label]="compactToolbar ? '' : 'Import'" [iconOnly]="compactToolbar" ariaLabel="Import"
                        variant="secondary" size="m" iconName="upload"></fvdr-btn>
            </div>
            <div class="toolbar-right">
              <fvdr-btn [label]="compactToolbar ? '' : 'Width spec'" [iconOnly]="compactToolbar" ariaLabel="Width spec"
                        variant="secondary" size="m" iconName="settings"
                        [attr.aria-pressed]="showWidthSpec" (clicked)="showWidthSpec = !showWidthSpec"></fvdr-btn>
              <fvdr-btn [label]="compactToolbar ? '' : 'View as'" [iconOnly]="compactToolbar" ariaLabel="View as"
                        variant="secondary" size="m" iconName="view-as"></fvdr-btn>
              <div class="toolbar-search">
                <fvdr-search placeholder="Search" [filter]="true"></fvdr-search>
              </div>
            </div>
          </div>

          <div class="content-row">

            <!-- ── Quick access panel (resizable, same behavior as Documents) ── -->
            <div class="qa-panel"
                 [style.width.px]="panelCollapsed ? null : panelWidthPx"
                 [class.qa-panel--handle-hover]="panelHandleHovered && !isResizingPanel"
                 [class.qa-panel--handle-active]="isResizingPanel">

              <div class="qa-rail" *ngIf="panelCollapsed">
                <div class="qa-rail-header">
                  <button class="icon-btn" title="Expand" (click)="panelCollapsed = false">
                    <fvdr-icon name="chevron-right"></fvdr-icon>
                  </button>
                </div>
                <button class="icon-btn rail-count"
                        *ngFor="let s of shortcuts"
                        [class.icon-btn--active]="s.active"
                        [title]="s.label"
                        (click)="onShortcutClick(s)">{{ s.count }}</button>
              </div>

              <ng-container *ngIf="!panelCollapsed">
                <div class="qa-block"
                     (mouseenter)="panelHandleHovered = true"
                     (mouseleave)="panelHandleHovered = false">
                  <fvdr-quick-access-menu
                    [items]="shortcuts"
                    [(collapsed)]="shortcutsCollapsed"
                    [showCollapseAll]="true"
                    [width]="panelWidthPx - PANEL_LINE_WIDTH"
                    (itemClick)="onShortcutClick($event)"
                    (collapseAllClick)="panelCollapsed = true"
                  ></fvdr-quick-access-menu>
                </div>

                <div class="qa-block qa-block--grow"
                     (mouseenter)="panelHandleHovered = true"
                     (mouseleave)="panelHandleHovered = false">
                  <div class="cat-header" [style.width.px]="panelWidthPx - PANEL_LINE_WIDTH">
                    <span>Category</span>
                    <button class="icon-btn" title="Manage categories"><fvdr-icon name="settings"></fvdr-icon></button>
                  </div>
                  <label class="cat-row" *ngFor="let c of categories">
                    <fvdr-checkbox [(ngModel)]="c.checked"></fvdr-checkbox>
                    <fvdr-icon name="label" class="cat-icon" [ngClass]="'cat-icon--' + c.color"></fvdr-icon>
                    <span class="cat-lbl">{{ c.label }}</span>
                  </label>
                </div>
              </ng-container>

              <div class="v-handle v-handle--right"
                   *ngIf="!panelCollapsed"
                   role="separator" aria-orientation="vertical" aria-label="Resize Quick access panel"
                   tabindex="0"
                   (mouseenter)="panelHandleHovered = true; onHandleEnter($event, 'panel')"
                   (mouseleave)="panelHandleHovered = false; onHandleLeave()"
                   (mousedown)="startPanelResize($event)"
                   (dblclick)="resetPanelWidth()"
                   (keydown)="onPanelResizeKeydown($event)"></div>
            </div>

            <!-- ── Threads table ── -->
            <div class="tbl-wrap" [class.is-col-resizing]="!!resizingCol">

              <div class="tbl-row tbl-row--header" [style.grid-template-columns]="gridTemplateColumns">
                <div class="col-sel"><fvdr-checkbox [ngModel]="false"></fvdr-checkbox></div>
                <div *ngFor="let col of visibleCols"
                     [class.th-hover]="hoveredColRect?.colId === col.id"
                     [class.th-active]="resizingCol === col.id"
                     (mouseenter)="onColHeaderEnter($event, col.id)" (mouseleave)="onColHeaderLeave()">
                  <span class="th-label">{{ col.label }}</span>
                  <span class="col-resize-handle"
                        [class.col-resize-handle--active]="resizingCol === col.id"
                        role="separator" aria-orientation="vertical" [attr.aria-label]="'Resize column ' + col.label"
                        tabindex="0"
                        (mouseenter)="onHandleEnter($event, col.id)"
                        (mouseleave)="onHandleLeave()"
                        (mousedown)="startColResize($event, col.id)"
                        (keydown)="onColResizeKeydown($event, col.id)"
                        (dblclick)="resetColumnWidth(col.id)"></span>
                </div>
                <div class="col-act">
                  <button *ngIf="!openThread" class="icon-btn" title="Columns"><fvdr-icon name="table-view"></fvdr-icon></button>
                </div>
              </div>

              <div *ngFor="let t of threads"
                   class="tbl-row"
                   [class.tbl-row--open]="openThread?.id === t.id"
                   [style.grid-template-columns]="gridTemplateColumns"
                   (click)="openThreadRow(t)">
                <div class="col-sel" (click)="$event.stopPropagation()">
                  <fvdr-checkbox [ngModel]="openThread?.id === t.id"></fvdr-checkbox>
                </div>
                <ng-container *ngFor="let col of visibleCols">
                  <div [ngSwitch]="col.id">
                    <span *ngSwitchCase="'num'" class="td-text">{{ t.id }}</span>
                    <span *ngSwitchCase="'subject'" class="td-text td-ellipsis">{{ t.subject }}</span>
                    <span *ngSwitchCase="'status'" class="status-chip" [ngClass]="'status-chip--' + t.status">{{ statusLabel(t.status) }}</span>
                    <span *ngSwitchCase="'team'" class="td-inline">
                      <fvdr-icon name="group" class="team-icon"></fvdr-icon>{{ t.team }}
                    </span>
                    <span *ngSwitchCase="'author'" class="td-inline">
                      <span class="mini-avatar">{{ t.initials }}</span><span class="td-ellipsis">{{ t.author }}</span>
                    </span>
                    <span *ngSwitchCase="'priority'" class="prio" [ngClass]="'prio--' + t.priority" [title]="t.priority">
                      <fvdr-icon [name]="t.priority === 'low' ? 'chevron-up' : 'angle-double-right'"></fvdr-icon>
                    </span>
                    <span *ngSwitchCase="'updated'" class="td-text">{{ t.updated }}</span>
                    <span *ngSwitchCase="'category'" class="td-inline">
                      <ng-container *ngIf="t.category">
                        <fvdr-icon name="label" class="cat-icon" [ngClass]="'cat-icon--' + (t.category === 'Finance' ? 'teal' : 'green')"></fvdr-icon>{{ t.category }}
                      </ng-container>
                    </span>
                  </div>
                </ng-container>
                <div class="col-act"></div>
              </div>

              <ng-container *ngIf="hoveredColRect">
                <div class="col-hover-line"
                     [class.col-hover-line--active]="resizingCol === hoveredColRect.colId"
                     [style.left.px]="hoveredColRect.left"
                     [style.height.px]="hoveredColRect.height"></div>
                <div class="col-hover-line"
                     [class.col-hover-line--active]="resizingCol === hoveredColRect.colId"
                     [style.left.px]="hoveredColRect.left + colWidths[hoveredColRect.colId]"
                     [style.height.px]="hoveredColRect.height"></div>
              </ng-container>
            </div>


          </div>
        </div>
      </div>

    <!-- ── Thread drawer: full page height, right column (replaces the in-table panel) ── -->
    <aside class="drawer"
           *ngIf="openThread as th"
           aria-label="Question thread"
           [style.width.px]="effectiveThreadWidth"
           [class.drawer--handle-hover]="threadHandleHovered && !isResizingThread"
           [class.drawer--handle-active]="isResizingThread">

      <div class="v-handle v-handle--left"
           role="separator" aria-orientation="vertical" aria-label="Resize thread drawer"
           tabindex="0"
           (mouseenter)="threadHandleHovered = true; onHandleEnter($event, 'thread')"
           (mouseleave)="threadHandleHovered = false; onHandleLeave()"
           (mousedown)="startThreadResize($event)"
           (dblclick)="resetThreadWidth()"
           (keydown)="onThreadResizeKeydown($event)"></div>

      <!-- Header: close · question number · subject · status -->
      <header class="drawer__head"
              (mouseenter)="threadHandleHovered = true"
              (mouseleave)="threadHandleHovered = false">
        <button class="icon-btn" title="Close" (click)="closeThread()"><fvdr-icon name="close"></fvdr-icon></button>
        <span class="drawer__id">#{{ th.id }}</span>
        <h2 class="drawer__title" [title]="th.subject">{{ th.subject }}</h2>
        <span class="status-chip" [ngClass]="'status-chip--' + th.status">{{ statusLabel(th.status) }}</span>
      </header>

      <!-- Metadata: priority · category · team -->
      <div class="drawer__meta">
        <span class="meta-field prio" [ngClass]="'prio--' + th.priority" [title]="'Priority: ' + priorityLabel(th.priority)">
          <fvdr-icon [name]="th.priority === 'low' ? 'chevron-up' : 'angle-double-right'"></fvdr-icon>
          {{ priorityLabel(th.priority) }}
          <fvdr-icon name="chevron-down" class="muted"></fvdr-icon>
        </span>
        <span class="meta-field">
          <fvdr-icon name="label" class="cat-icon" [ngClass]="'cat-icon--' + categoryColor(th)"></fvdr-icon>
          {{ th.category ?? 'No category' }}
          <fvdr-icon name="chevron-down" class="muted"></fvdr-icon>
        </span>
        <span class="meta-field">
          <fvdr-icon name="group" class="team-icon"></fvdr-icon>{{ th.team }}
        </span>
      </div>

      <!-- Tabs -->
      <nav class="drawer__tabs" role="tablist" aria-label="Thread views">
        <button role="tab" class="drawer__tab" [class.drawer__tab--active]="drawerTab === 'thread'"
                [attr.aria-selected]="drawerTab === 'thread'" (click)="drawerTab = 'thread'">Thread</button>
        <button role="tab" class="drawer__tab" [class.drawer__tab--active]="drawerTab === 'history'"
                [attr.aria-selected]="drawerTab === 'history'" (click)="drawerTab = 'history'">History</button>
      </nav>

      <!-- Thread view -->
      <ng-container *ngIf="drawerTab === 'thread'; else historyView">
        <div class="drawer__assign" *ngIf="th.assignees?.length">
          <span class="muted">Assigned to:</span>
          <span class="assignee-chip" *ngFor="let a of th.assignees">
            <span class="mini-avatar">{{ initialsOf(a) }}</span>{{ a }}
          </span>
          <button class="icon-btn" title="Edit assignees"><fvdr-icon name="edit"></fvdr-icon></button>
        </div>

        <div class="drawer__scroll">
          <article class="msg">
            <div class="msg__head">
              <span class="mini-avatar">{{ th.initials }}</span>
              <span class="msg__author">{{ th.author }}</span>
              <span class="msg__date">{{ th.asked }}</span>
            </div>
            <p class="msg__text">{{ th.question }}</p>
          </article>

          <div class="activity">
            <fvdr-btn label="Activity" variant="secondary" size="s" iconName="expand"></fvdr-btn>
          </div>
          <p class="activity__note" *ngIf="th.assignees?.length">
            Question was auto-assigned based on the category to {{ th.assignees![0] }} on {{ th.asked }}
          </p>

          <article class="note" *ngIf="th.note as n">
            <div class="msg__head">
              <span class="mini-avatar">{{ n.initials }}</span>
              <span class="msg__author">{{ n.author }}</span>
              <span class="msg__date">{{ n.date }}</span>
            </div>
            <p class="note__text">
              <span class="mention" *ngFor="let m of n.mentions">&#64;{{ m }}</span>
              {{ n.text }}
            </p>
            <span class="note__hidden"><fvdr-icon name="lock-close"></fvdr-icon>Not visible to the question team</span>
          </article>
        </div>

        <!-- Composer, pinned to the bottom of the drawer -->
        <div class="composer">
          <div class="composer__tabs" role="tablist">
            <button role="tab" class="composer__tab" [class.composer__tab--active]="composerTab === 'answer'" (click)="composerTab = 'answer'">Answer</button>
            <button role="tab" class="composer__tab" [class.composer__tab--active]="composerTab === 'note'" (click)="composerTab = 'note'">Internal note</button>
          </div>
          <div class="composer__box">
            <textarea [(ngModel)]="draft" maxlength="5000"
                      [placeholder]="composerTab === 'answer' ? 'Type your answer' : 'Type an internal note'"></textarea>
            <div class="composer__tools">
              <fvdr-icon name="text-mark"></fvdr-icon>
              <fvdr-icon name="link"></fvdr-icon>
              <fvdr-icon name="upload"></fvdr-icon>
              <span class="spacer"></span>
              <button class="send-btn" [disabled]="!draft.trim()" [attr.aria-label]="composerTab === 'answer' ? 'Send answer' : 'Save note'"><fvdr-icon name="send"></fvdr-icon></button>
            </div>
          </div>
          <div class="composer__meta">
            <span>{{ composerTab === 'answer' ? 'Answer will be sent for approval' : 'Visible to the question team only' }}</span>
            <span>{{ draft.length }}/5000</span>
          </div>
        </div>
      </ng-container>

      <!-- History view -->
      <ng-template #historyView>
        <div class="drawer__scroll">
          <ol class="history">
            <li class="history__item" *ngFor="let h of historyOf(th)">
              <span class="history__date">{{ h.date }}</span>
              <span class="history__text">{{ h.text }}</span>
            </li>
          </ol>
        </div>
      </ng-template>
    </aside>

    <!-- Prototype overlay: min / default / max drawer width as % of the window -->
    <div class="wspec" *ngIf="openThread && showWidthSpec" role="status" aria-live="polite" aria-label="Drawer width specification">
      <div class="wspec__head">
        <span class="wspec__title">Drawer width</span>
        <span class="wspec__state" [ngClass]="'wspec__state--' + widthSpec.state">{{ widthSpec.stateLabel }}</span>
      </div>
      <div class="wspec__readout">
        <strong>{{ widthSpec.pct }}%</strong> · {{ widthSpec.px }} px
        <span class="wspec__window">of {{ widthSpec.vw }} px window</span>
      </div>
      <div class="wspec__track">
        <div class="wspec__band" [style.left.%]="widthSpec.minPct" [style.width.%]="widthSpec.maxPct - widthSpec.minPct"></div>
        <div class="wspec__tick" [style.left.%]="widthSpec.defPct" title="Default"></div>
        <div class="wspec__marker" [style.left.%]="widthSpec.pct"></div>
      </div>
      <dl class="wspec__limits">
        <div><dt>Min</dt><dd>{{ widthSpec.minPct }}% · {{ widthSpec.minPx }} px</dd></div>
        <div><dt>Default</dt><dd>{{ widthSpec.defPct }}% · {{ widthSpec.defPx }} px</dd></div>
        <div><dt>Max</dt><dd>{{ widthSpec.maxPct }}% · {{ widthSpec.maxPx }} px</dd></div>
      </dl>
      <p class="wspec__hint" *ngIf="!isMobileViewport">Drag the edge or use ← → · double-click the edge to reset to default</p>
      <p class="wspec__hint" *ngIf="isMobileViewport">Below 768 px the drawer fills the window; resizing is off</p>
    </div>
    </div>

    <!-- Onboarding: reset-width hint. Sits right on the resize line, only while that line's width
         differs from its default, and retires after the user double-clicks a line once. -->
    <div class="reset-hint" *ngIf="resetHint as hint"
         [style.left.px]="hint.x" [style.top.px]="hint.y" aria-hidden="true">
      <!-- Double-click animation: the cursor tip sits on the line and presses twice;
           each press sends out a ripple and three click marks. -->
      <span class="reset-hint__ripple"></span>
      <span class="reset-hint__ripple reset-hint__ripple--second"></span>
      <span class="reset-hint__marks"><i></i><i></i><i></i></span>
      <span class="reset-hint__cursor"><span class="reset-hint__cursor-shape"></span></span>
      <span class="reset-hint__label">Double-click to reset width</span>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      font-family: var(--font-family);
      font-size: var(--font-size-base);
      color: var(--color-text-primary);
      height: 100vh;
      overflow: hidden;
    }
    .page-layout { display: flex; height: 100%; background: var(--color-stone-100); }
    .main-area { flex: 1; display: flex; flex-direction: column; min-width: 0; overflow: hidden; }
    .content-wrap {
      flex: 1; display: flex; flex-direction: column;
      padding: var(--space-6); gap: var(--space-5);
      overflow: hidden; min-height: 0;
      background: var(--color-stone-0);
    }

    .toolbar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; flex-shrink: 0; min-height: 40px; }
    .toolbar { min-width: 0; gap: var(--space-3) var(--space-2); }
    .toolbar-left, .toolbar-right { display: flex; gap: var(--space-2); align-items: center; min-width: 0; }
    .toolbar-left { flex-shrink: 0; }
    /* Search shrinks first; the right group drops to its own row only when even its minimum no longer fits. */
    .toolbar-right { flex: 1 1 min-content; justify-content: flex-end; }
    .toolbar-search { flex: 0 1 240px; min-width: 96px; }
    .toolbar-search fvdr-search { display: block; width: 100%; }

    .content-row {
      flex: 1; display: flex; gap: var(--space-6);
      min-height: 0; overflow: hidden;
      background: var(--color-stone-0);
    }

    /* ── Quick access panel ── */
    .qa-panel { position: relative; display: flex; flex-direction: column; flex-shrink: 0; }
    .qa-block { position: relative; flex-shrink: 0; }
    .qa-block--grow { flex: 1; overflow-y: auto; padding-top: var(--space-4); }

    /* Resize feedback — a padded stroke per block, gray on hover / green while dragging.
       Identical visual language to the Documents Quick access panel. */
    .qa-block::after,
    .drawer::before {
      content: '';
      position: absolute;
      top: var(--space-2);
      bottom: var(--space-2);
      width: var(--space-1);
      background: transparent;
      transition: background-color 0.1s ease;
      pointer-events: none;
    }
    .qa-block::after { right: 0; }
    .drawer::before { left: 0; z-index: 1; }
    .qa-panel--handle-hover .qa-block::after,
    .drawer--handle-hover::before { background: var(--color-divider); }
    .qa-panel--handle-active .qa-block::after,
    .drawer--handle-active::before { background: var(--chip-bg-green); }

    /* Invisible hit-zones for the two panel edges */
    .v-handle {
      position: absolute;
      top: 0; bottom: 0;
      width: 6px;
      cursor: col-resize;
      z-index: 5;
      outline: none;
    }
    .v-handle--right { right: -3px; }
    .v-handle--left  { left: -3px; }
    .v-handle:focus-visible { outline: 2px solid var(--color-primary-500); outline-offset: -2px; }
    @media (max-width: 767px) { .v-handle { display: none; } }

    .qa-rail {
      display: flex; flex-direction: column; align-items: center;
      gap: var(--space-1); width: 56px; flex-shrink: 0;
    }
    .qa-rail-header {
      display: flex; align-items: center; justify-content: center;
      width: 48px; height: 48px;
      background: var(--color-stone-200);
      border-radius: var(--radius-sm);
      margin-bottom: var(--space-4);
    }
    .rail-count { font-size: var(--text-caption1-size); font-weight: 600; }

    .cat-header {
      display: flex; align-items: center; justify-content: space-between;
      box-sizing: border-box;
      height: 44px;
      padding: 0 var(--space-2) 0 var(--space-4);
      background: var(--color-stone-200);
      border-radius: var(--radius-sm);
      font-weight: 600;
    }
    .cat-row {
      display: flex; align-items: center; gap: var(--space-3);
      height: 36px; padding: 0 var(--space-4);
      cursor: pointer;
    }
    .cat-row:hover { background: var(--color-hover-bg); }
    .cat-lbl { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
    .cat-icon { font-size: var(--font-size-lg, 16px); flex-shrink: 0; }
    .cat-icon--teal  { color: var(--chip-icon-teal, #5fc4c4); }
    .cat-icon--green { color: var(--chip-icon-green, #7dcf9b); }
    .cat-icon--grey  { color: var(--color-stone-600); }

    /* ── Table ── */
    .tbl-wrap {
      position: relative;
      flex: 1;
      display: flex; flex-direction: column;
      overflow: auto;
      min-width: 0;
    }
    .tbl-row { display: grid; align-items: center; min-width: max-content; cursor: pointer; }
    .tbl-row:not(.tbl-row--header):hover { background: var(--color-hover-bg); }
    .tbl-row--open, .tbl-row--open:hover { background: var(--color-primary-50) !important; }
    .tbl-row--header {
      background: var(--color-stone-200);
      min-height: 44px;
      align-items: stretch;
      position: sticky; top: 0; z-index: 3;
      cursor: default;
      border-radius: var(--radius-sm);
    }
    .tbl-row:not(.tbl-row--header) { min-height: 44px; }

    .tbl-row > div {
      position: relative;
      display: flex; align-items: center;
      gap: var(--space-2);
      padding: 0 var(--space-3);
      min-width: 0;
      overflow: hidden;
    }
    .tbl-row--header > div { overflow: visible; }
    .col-sel { justify-content: center; padding: 0 !important; }
    .col-act { justify-content: flex-end; }

    .th-hover  { background: var(--color-hover-bg); }
    .th-active { background: var(--chip-bg-green); }
    .th-label { font-weight: 600; white-space: nowrap; flex-shrink: 0; }

    .col-resize-handle {
      position: absolute; top: 0; bottom: 0; right: -3px;
      width: 6px; cursor: col-resize; z-index: 2; outline: none;
    }
    .col-resize-handle::after {
      content: ''; position: absolute; top: 0; bottom: 0; left: 50%;
      width: 2px; transform: translateX(-50%);
      background: transparent;
      transition: background 0.12s ease, width 0.12s ease;
    }
    .col-resize-handle:hover::after,
    .col-resize-handle:focus-visible::after { background: var(--color-primary-500); }
    .col-resize-handle--active::after { width: 3px; background: var(--color-primary-500); }
    .tbl-wrap.is-col-resizing { cursor: col-resize; user-select: none; }
    @media (max-width: 767px) { .col-resize-handle { display: none; } }

    .col-hover-line {
      position: absolute; top: 0; width: 1px;
      background: var(--color-divider);
      pointer-events: none; z-index: 4;
      transition: background 0.1s ease;
    }
    .col-hover-line--active { background: var(--color-primary-500); }

    .td-text { white-space: nowrap; }
    .td-ellipsis { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
    .td-inline { display: inline-flex; align-items: center; gap: var(--space-2); white-space: nowrap; min-width: 0; }
    .team-icon { color: var(--color-primary-500); font-size: var(--font-size-lg, 16px); flex-shrink: 0; }
    .mini-avatar {
      display: inline-flex; align-items: center; justify-content: center;
      width: 24px; height: 24px; flex-shrink: 0;
      border-radius: 50%;
      background: var(--color-stone-300);
      font-size: var(--font-size-3xs); font-weight: 600;
      color: var(--color-text-secondary);
    }
    .muted { color: var(--color-text-secondary); }

    .status-chip {
      display: inline-flex; align-items: center;
      height: 24px; padding: 0 var(--space-2);
      border-radius: var(--radius-sm);
      white-space: nowrap;
      font-size: var(--font-size-base);
    }
    .status-chip--to-approve { background: var(--chip-bg-magenta); }
    .status-chip--assigned   { background: var(--chip-bg-orange); }
    .status-chip--answered   { background: var(--chip-bg-green); }
    .status-chip--submitted  { background: var(--chip-bg-blue); }
    .status-chip--closed     { background: var(--chip-bg-grey); border: 1px solid var(--color-divider); }

    .prio { display: inline-flex; font-size: var(--font-size-base); }
    .prio fvdr-icon { transform: rotate(-90deg); }
    .prio--low fvdr-icon { transform: none; }
    .prio--low    { color: var(--color-stone-700); }
    .prio--medium { color: var(--chip-icon-orange, #f59b57); }
    .prio--high   { color: var(--color-error-600); }

    /* ── Thread drawer: full page height, right column ── */
    .drawer {
      position: relative;
      flex-shrink: 0;
      display: flex; flex-direction: column;
      height: 100%;
      min-height: 0;
      background: var(--color-stone-0);
      border-left: 1px solid var(--color-divider);
    }
    .drawer__head {
      display: flex; align-items: center; gap: var(--space-3);
      height: 64px; padding: 0 var(--space-4);
      flex-shrink: 0;
    }
    .drawer__id { font-weight: 600; white-space: nowrap; }
    .drawer__title {
      flex: 1; min-width: 0; margin: 0;
      font-size: var(--font-size-lg); font-weight: 600; line-height: 24px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .drawer__meta {
      display: flex; align-items: center; gap: var(--space-4);
      height: 49px; padding: 0 var(--space-4);
      border-top: 1px solid var(--color-divider);
      border-bottom: 1px solid var(--color-divider);
      flex-shrink: 0; white-space: nowrap; overflow: hidden;
    }
    .meta-field { display: inline-flex; align-items: center; gap: var(--space-2); cursor: pointer; }
    .meta-field:hover { color: var(--color-primary-600); }

    .drawer__tabs {
      display: flex; gap: var(--space-6);
      padding: 0 var(--space-4);
      border-bottom: 1px solid var(--color-divider);
      flex-shrink: 0;
    }
    .drawer__tab {
      position: relative; height: 44px; padding: 0;
      border: 0; background: none; cursor: pointer;
      font: inherit; font-weight: 600; color: var(--color-text-secondary);
    }
    .drawer__tab:hover { color: var(--color-text-primary); }
    .drawer__tab--active { color: var(--color-text-primary); }
    .drawer__tab--active::after {
      content: ''; position: absolute; left: 0; right: 0; bottom: -1px;
      height: 2px; background: var(--color-primary-500);
    }
    .drawer__tab:focus-visible { outline: 2px solid var(--color-primary-500); outline-offset: -2px; }

    .drawer__assign {
      display: flex; align-items: center; flex-wrap: wrap; gap: var(--space-2);
      padding: var(--space-3) var(--space-4) 0;
      flex-shrink: 0;
    }
    .assignee-chip {
      display: inline-flex; align-items: center; gap: var(--space-2);
      height: 28px; padding: 0 var(--space-3) 0 var(--space-1);
      border-radius: 14px; background: var(--color-stone-200);
      white-space: nowrap;
    }
    .drawer__scroll {
      flex: 1; min-height: 0; overflow-y: auto;
      padding: var(--space-4);
      display: flex; flex-direction: column; gap: var(--space-4);
    }

    .msg {
      background: var(--chip-bg-green);
      border-radius: var(--radius-lg);
      padding: var(--space-4) var(--space-5);
    }
    .msg__head { display: flex; align-items: center; gap: var(--space-2); }
    .msg__author { font-weight: 500; }
    .msg__date { margin-left: auto; color: var(--color-text-secondary); white-space: nowrap; }
    .msg__text { margin: var(--space-3) 0 0; line-height: 20px; }

    .activity { display: flex; justify-content: center; }
    .activity__note { margin: 0; text-align: center; color: var(--color-text-secondary); }

    .note {
      background: var(--chip-bg-yellow);
      border-radius: var(--radius-lg);
      padding: var(--space-4) var(--space-5);
      display: flex; flex-direction: column; gap: var(--space-2);
    }
    .note__text { margin: 0; line-height: 20px; }
    .mention {
      display: inline-flex; align-items: center; margin-right: var(--space-2);
      height: 20px; padding: 0 var(--space-2);
      border-radius: var(--radius-sm); background: var(--chip-bg-orange);
      color: var(--color-stone-900); font-weight: 500;
    }
    .note__hidden {
      display: inline-flex; align-items: center; gap: var(--space-2);
      color: var(--color-text-secondary); font-size: var(--text-caption1-size);
    }

    .history { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
    .history__item {
      display: flex; gap: var(--space-4); align-items: baseline;
      padding: var(--space-3) 0; border-bottom: 1px solid var(--color-divider);
    }
    .history__date { flex-shrink: 0; width: 120px; color: var(--color-text-secondary); white-space: nowrap; }
    .history__text { min-width: 0; }

    /* Composer, pinned to the bottom of the drawer */
    .composer {
      flex-shrink: 0;
      padding: var(--space-3) var(--space-4) var(--space-4);
      border-top: 1px solid var(--color-divider);
      background: var(--color-stone-0);
    }
    .composer__tabs { display: flex; gap: var(--space-1); }
    .composer__tab {
      height: 32px; padding: 0 var(--space-3);
      border: 1px solid transparent; border-bottom: 0;
      border-radius: var(--radius-sm) var(--radius-sm) 0 0;
      background: none; cursor: pointer; font: inherit; color: var(--color-text-secondary);
    }
    .composer__tab--active {
      background: var(--color-stone-0); color: var(--color-text-primary);
      border-color: var(--color-divider);
    }
    .composer__box {
      display: flex; flex-direction: column;
      border: 1px solid var(--color-divider); border-radius: var(--radius-md);
      background: var(--color-stone-0);
    }
    .composer__box textarea {
      min-height: 72px; resize: vertical; border: 0; outline: none;
      padding: var(--space-3); font: inherit; background: transparent; color: inherit;
    }
    .composer__tools {
      display: flex; align-items: center; gap: var(--space-3);
      padding: var(--space-2) var(--space-3);
      color: var(--color-stone-700);
    }
    .composer__tools fvdr-icon { cursor: pointer; }
    .send-btn {
      display: inline-flex; align-items: center; justify-content: center;
      width: 32px; height: 32px; border: 0; border-radius: var(--radius-md);
      background: var(--color-primary-500); color: var(--color-stone-0); cursor: pointer;
    }
    .send-btn:hover { background: var(--color-primary-600); }
    .send-btn:disabled { background: var(--color-stone-400); cursor: default; }
    .composer__meta {
      display: flex; justify-content: space-between;
      margin-top: var(--space-2);
      color: var(--color-text-secondary); font-size: var(--text-caption1-size);
    }
    .spacer { flex: 1; }

    /* ── Width spec overlay (prototype only) ── */
    .wspec {
      position: fixed; left: 88px; bottom: var(--space-4); z-index: 300;
      width: 296px; padding: var(--space-4);
      display: flex; flex-direction: column; gap: var(--space-3);
      background: var(--color-stone-0); border: 1px solid var(--color-divider);
      border-radius: var(--radius-lg); box-shadow: var(--shadow-toast);
      font-size: var(--text-caption1-size);
    }
    .wspec__head { display: flex; align-items: center; justify-content: space-between; gap: var(--space-2); }
    .wspec__title { font-weight: 600; font-size: var(--font-size-base); }
    .wspec__state {
      padding: 2px var(--space-2); border-radius: var(--radius-sm);
      background: var(--chip-bg-default); color: var(--color-text-secondary); white-space: nowrap;
    }
    .wspec__state--default { background: var(--chip-bg-green); color: var(--color-primary-700); }
    .wspec__state--min, .wspec__state--max { background: var(--chip-bg-yellow); color: var(--color-text-primary); }
    .wspec__state--mobile { background: var(--chip-bg-blue); color: var(--color-text-primary); }
    .wspec__readout { font-size: var(--font-size-base); color: var(--color-text-primary); }
    .wspec__window { color: var(--color-text-secondary); margin-left: var(--space-1); }
    .wspec__track {
      position: relative; height: 8px; margin: var(--space-2) 0;
      border-radius: var(--radius-sm); background: var(--color-stone-300);
    }
    .wspec__band {
      position: absolute; top: 0; bottom: 0;
      border-radius: var(--radius-sm); background: var(--chip-bg-green);
      box-shadow: inset 0 0 0 1px var(--color-primary-500);
    }
    .wspec__tick {
      position: absolute; top: -4px; bottom: -4px; width: 2px; margin-left: -1px;
      background: var(--color-stone-700);
    }
    .wspec__marker {
      position: absolute; top: -4px; width: 16px; height: 16px; margin-left: -8px;
      border-radius: 50%; background: var(--color-primary-500);
      border: 2px solid var(--color-stone-0); box-shadow: var(--shadow-card);
    }
    .wspec__limits { margin: 0; display: grid; gap: var(--space-1); }
    .wspec__limits > div { display: flex; justify-content: space-between; }
    .wspec__limits dt { color: var(--color-text-secondary); }
    .wspec__limits dd { margin: 0; font-variant-numeric: tabular-nums; }
    .wspec__hint { margin: 0; color: var(--color-text-secondary); }

    .reset-hint {
      position: fixed;
      z-index: 1000;
      pointer-events: none; /* the dblclick must land on the handle underneath */
      animation: reset-hint-in 0.16s ease-out;
    }
    /* Timeline (1.6s loop): press at 8%, release 16%, press 24%, release 32%, then rest. */
    .reset-hint__cursor {
      position: absolute;
      left: 0; top: 0;
      width: 14px; height: 20px;
      transform-origin: 0 0; /* press toward the tip */
      /* White outline around the clipped arrow — keeps it legible on the gray header */
      filter:
        drop-shadow(1px 0 0 var(--color-stone-0)) drop-shadow(-1px 0 0 var(--color-stone-0))
        drop-shadow(0 1px 0 var(--color-stone-0)) drop-shadow(0 -1px 0 var(--color-stone-0))
        drop-shadow(0 2px 3px rgba(31, 33, 41, 0.25));
      animation: reset-hint-press 1.6s ease-in-out infinite;
    }
    .reset-hint__cursor-shape {
      display: block;
      width: 100%; height: 100%;
      background: var(--color-text-primary);
      clip-path: polygon(0 0, 0 86%, 28% 66%, 48% 100%, 66% 92%, 47% 60%, 90% 60%);
    }
    .reset-hint__ripple {
      position: absolute;
      left: -13px; top: -13px;
      width: 26px; height: 26px;
      border-radius: 50%;
      border: 2px solid var(--color-primary-500);
      box-sizing: border-box;
      opacity: 0;
      animation: reset-hint-ripple 1.6s ease-out infinite;
    }
    /* Second press is 16% of the loop later */
    .reset-hint__ripple--second { animation-delay: 0.256s; }
    .reset-hint__marks {
      position: absolute;
      left: 0; top: 0;
      animation: reset-hint-marks 1.6s ease-out infinite;
      opacity: 0;
    }
    .reset-hint__marks i {
      position: absolute;
      left: -1px; top: -13px;
      width: 2px; height: 5px;
      border-radius: 1px;
      background: var(--color-primary-500);
      transform-origin: 1px 13px; /* rotate around the cursor tip */
    }
    .reset-hint__marks i:nth-child(1) { transform: rotate(-60deg); }
    .reset-hint__marks i:nth-child(2) { transform: rotate(-15deg); }
    .reset-hint__marks i:nth-child(3) { transform: rotate(30deg); }
    .reset-hint__label {
      position: absolute;
      left: 0; top: 28px; /* below the 20px cursor */
      transform: translateX(-50%);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
      background: var(--color-text-primary);
      color: var(--color-stone-0);
      font-size: var(--text-caption1-size);
      line-height: 16px;
      white-space: nowrap;
    }
    @keyframes reset-hint-in {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes reset-hint-press {
      0%, 6%   { transform: scale(1); }
      9%       { transform: scale(0.82); }
      15%      { transform: scale(1); }
      22%      { transform: scale(1); }
      25%      { transform: scale(0.82); }
      31%, 100% { transform: scale(1); }
    }
    @keyframes reset-hint-ripple {
      0%, 8%   { transform: scale(0.25); opacity: 0; }
      9%       { transform: scale(0.25); opacity: 0.9; }
      38%      { transform: scale(1.2);  opacity: 0; }
      100%     { transform: scale(1.2);  opacity: 0; }
    }
    @keyframes reset-hint-marks {
      0%, 8%   { opacity: 0; transform: scale(0.5); }
      11%      { opacity: 1; transform: scale(1); }
      18%      { opacity: 0; transform: scale(1.15); }
      24%      { opacity: 0; transform: scale(0.5); }
      27%      { opacity: 1; transform: scale(1); }
      34%      { opacity: 0; transform: scale(1.15); }
      100%     { opacity: 0; }
    }
    @media (prefers-reduced-motion: reduce) {
      .reset-hint, .reset-hint__cursor { animation: none; }
      .reset-hint__ripple, .reset-hint__marks { display: none; }
    }

    .icon-btn {
      display: flex; align-items: center; justify-content: center;
      width: 28px; height: 28px; flex-shrink: 0;
      border: none; background: transparent; padding: 0;
      cursor: pointer;
      color: var(--color-text-secondary);
      border-radius: var(--radius-sm);
      font-size: var(--font-size-lg, 16px);
    }
    .icon-btn:hover { background: var(--color-hover-bg); color: var(--color-text-primary); }
    .icon-btn--active, .icon-btn--active:hover { background: var(--color-stone-400); color: var(--color-text-primary); }
  `],
})
export class QnaDrawerFullpageComponent implements OnInit, OnDestroy {
  private tracker = inject(TrackerService);
  @ViewChild('pageLayout') pageLayout?: ElementRef<HTMLElement>;

  sidebarCollapsed = true;
  breadcrumbItems = [{ id: 'qna', label: 'Q&A' }, { id: 'all', label: 'All' }];
  headerActions: HeaderAction[] = [
    { id: 'theme', icon: 'theme-dark' },
    { id: 'help', icon: 'help' },
    { id: 'overview', icon: 'overview' },
  ];
  navItems: SidebarNavItem[] = [
    { id: 'overview',     icon: 'nav-overview',     iconActive: 'nav-overview-active',     label: 'Dashboard',    active: false },
    { id: 'projects',     icon: 'nav-projects',     iconActive: 'nav-projects-active',     label: 'Documents',    active: false },
    { id: 'participants', icon: 'nav-participants', iconActive: 'nav-participants-active', label: 'Participants', active: false },
    { id: 'qna',          icon: 'nav-qa',           iconActive: 'nav-qa-active',           label: 'Q&A',          active: true  },
    { id: 'reports',      icon: 'nav-reports',      iconActive: 'nav-reports-active',      label: 'Reports',      active: false },
    { id: 'settings',     icon: 'nav-settings',     iconActive: 'nav-settings-active',     label: 'Settings',     active: false },
    { id: 'trash',        icon: 'trash',            iconActive: 'trash',                   label: 'Recycle bin',  active: false },
  ];
  onNavClick(item: SidebarNavItem): void {
    this.navItems.forEach(n => n.active = false);
    item.active = true;
  }

  panelCollapsed = false;
  shortcutsCollapsed = false;
  shortcuts: QuickAccessItem[] = [
    { id: 'all',        label: 'All',             count: 9, active: true },
    { id: 'action',     label: 'Action required', count: 1 },
    { id: 'assigned',   label: 'Assigned',        count: 1 },
    { id: 'unanswered', label: 'Unanswered',      count: 5 },
    { id: 'answered',   label: 'Answered',        count: 4 },
    { id: 'faq',        label: 'FAQ',             count: 0 },
  ];
  onShortcutClick(item: QuickAccessItem): void {
    this.shortcuts.forEach(s => s.active = false);
    item.active = true;
  }
  categories = [
    { label: 'Finance',     color: 'teal',  checked: false },
    { label: 'Legal',       color: 'green', checked: false },
    { label: 'No category', color: 'grey',  checked: false },
  ];

  threads: QnaThread[] = [
    { id: 'FDF6', subject: 'M&A questions', status: 'answered', team: 'Buyer 1', author: 'Tasha Song', initials: 'TS', priority: 'high', updated: 'Jun 22, 2026', category: 'Finance', question: 'Hi team, We have 15 active patents, 8 pending patents, and 12 registered trademarks. A detailed list of these assets, along with expiration dates and renewal statuses, has been provided in the IP due diligence folder.', asked: 'Jun 22, 12:40 PM', assignees: ['Anna Camp', 'John Doe', 'Sini Le'], note: { author: 'Anna Camp', initials: 'AC', date: 'Mar 25, 1:10 PM', text: 'please take a look', mentions: ['John Doe', 'AnnaCamp'] } },
    { id: '2452', subject: 'Test', status: 'to-approve', team: 'Buyer 1', author: 'Maksym Kunytsia', initials: 'MK', priority: 'medium', updated: 'May 4, 2026', category: 'Finance', question: 'Please share the latest audited financials.', asked: 'May 4, 09:15' },
    { id: 'E7EE', subject: 'Lease agreements', status: 'to-approve', team: 'Buyer 1', author: 'Dmytro Horin', initials: 'DH', priority: 'medium', updated: 'May 4, 2026', category: 'Legal', question: 'Are there any lease agreements expiring within the next 12 months?', asked: 'May 4, 08:40' },
    { id: 'D701', subject: 'Testing question', status: 'assigned', team: 'Buyer 1', author: 'Mikhail Metelev', initials: 'MM', priority: 'low', updated: 'Jan 19, 2026', category: 'Finance', question: 'Hi! Can we add Q4 data to the report for the meeting?', asked: 'Jan 19, 14:36', assignees: ['Dmytro Siniehin'] },
    { id: 'B6DF', subject: 'IP ownership', status: 'answered', team: 'Buyer 1', author: 'Ulyana Moiseeva', initials: 'UM', priority: 'medium', updated: 'Oct 24, 2025', category: 'Legal', question: 'Who owns the IP developed by contractors?', asked: 'Oct 24, 11:20' },
    { id: '458C', subject: 'New question', status: 'answered', team: 'Buyer 1', author: 'Maksym Kunytsia', initials: 'MK', priority: 'medium', updated: 'Jul 2, 2025', category: 'Legal', question: 'Is there any pending litigation?', asked: 'Jul 2, 16:05' },
    { id: '14BD', subject: 'Test', status: 'submitted', team: 'Buyer 1', author: 'Maksym Kunytsia', initials: 'MK', priority: 'medium', updated: 'May 20, 2024', category: null, question: 'Test question body.', asked: 'May 20, 12:00' },
    { id: '6539', subject: 'Revenue', status: 'closed', team: 'Buyer 1', author: 'Maksym Kunytsia', initials: 'MK', priority: 'medium', updated: 'Apr 17, 2024', category: null, question: 'What was the revenue split by region?', asked: 'Apr 17, 13:30' },
    { id: '7563', subject: 'Customer churn', status: 'answered', team: 'Buyer 1', author: 'Maksym Kunytsia', initials: 'MK', priority: 'high', updated: 'Mar 25, 2024', category: null, question: 'What was the customer churn rate last year?', asked: 'Mar 25, 10:10' },
  ];

  statusLabel(s: ThreadStatus): string {
    return { 'to-approve': 'To approve', assigned: 'Assigned', answered: 'Answered', submitted: 'Submitted', closed: 'Closed' }[s];
  }

  priorityLabel(p: Priority): string {
    return { low: 'Low', medium: 'Medium', high: 'High' }[p];
  }
  categoryColor(t: QnaThread): 'teal' | 'green' | 'grey' {
    return t.category === 'Finance' ? 'teal' : t.category === 'Legal' ? 'green' : 'grey';
  }
  initialsOf(name: string): string {
    return name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('');
  }
  historyOf(t: QnaThread): { date: string; text: string }[] {
    const items = [{ date: t.asked, text: `Question submitted by ${t.author}` }];
    if (t.assignees?.length) items.push({ date: t.asked, text: `Auto-assigned to ${t.assignees.join(', ')} based on category` });
    items.push({ date: t.updated, text: `Status set to ${this.statusLabel(t.status)}` });
    return items;
  }

  // ── Thread panel ──────────────────────────────────────────────────────────
  openThread: QnaThread | null = null;
  composerTab: 'answer' | 'note' = 'answer';
  drawerTab: 'thread' | 'history' = 'thread';
  draft = '';

  openThreadRow(t: QnaThread): void {
    this.openThread = t;
    this.draft = '';
    this.drawerTab = 'thread';
    this.composerTab = 'answer';
    this.hoveredColRect = null;
  }
  closeThread(): void { this.openThread = null; this.hoveredColRect = null; }

  // ── Columns ───────────────────────────────────────────────────────────────
  readonly ALL_COLS: ColDef[] = [
    { id: 'num', label: '#' },
    { id: 'subject', label: 'Subject' },
    { id: 'status', label: 'Status' },
    { id: 'team', label: 'Team' },
    { id: 'author', label: 'Author' },
    { id: 'priority', label: 'Priority' },
    { id: 'updated', label: 'Updated on' },
    { id: 'category', label: 'Category' },
  ];
  /** With a thread open the product shows a compact table: # · Subject · Status. */
  private readonly COMPACT_COLS: ResizableColId[] = ['num', 'subject', 'status'];

  get visibleCols(): ColDef[] {
    return this.openThread ? this.ALL_COLS.filter(c => this.COMPACT_COLS.includes(c.id)) : this.ALL_COLS;
  }

  private readonly SEL_COL = 44;
  private readonly ACT_COL = 48;
  private readonly COLS_STORAGE_KEY = 'fvdr-qna-drawer-fullpage:widths-v2';
  private readonly COL_DEFAULTS: Record<ResizableColId, number> = { num: 62, subject: 276, status: 130, team: 145, author: 174, priority: 98, updated: 131, category: 130 };
  private readonly COL_MIN: Record<ResizableColId, number>      = { num: 56, subject: 120, status: 96,  team: 96,  author: 110, priority: 80, updated: 100, category: 96 };
  private readonly COL_MAX: Record<ResizableColId, number>      = { num: 160, subject: 720, status: 240, team: 320, author: 360, priority: 200, updated: 240, category: 320 };

  colWidths: Record<ResizableColId, number> = { ...this.COL_DEFAULTS };
  resizingCol: ResizableColId | null = null;
  hoveredColRect: { colId: ResizableColId; left: number; height: number } | null = null;
  isMobileViewport = false;
  private colStartX = 0;
  private colStartWidth = 0;
  private pendingColWidth: number | null = null;
  private colRafScheduled = false;

  get gridTemplateColumns(): string {
    const cols = this.visibleCols.map(c => `${this.colWidths[c.id]}px`).join(' ');
    return `${this.SEL_COL}px ${cols} ${this.ACT_COL}px`;
  }

  private clampColWidth(id: ResizableColId, value: number): number {
    return Math.min(this.COL_MAX[id], Math.max(this.COL_MIN[id], Math.round(value)));
  }

  onColHeaderEnter(event: MouseEvent, colId: ResizableColId): void {
    if (this.isMobileViewport || this.resizingCol || this.isResizingThread || this.isResizingPanel) return;
    const cell = event.currentTarget as HTMLElement;
    const wrap = cell.closest('.tbl-wrap') as HTMLElement | null;
    if (!wrap) return;
    this.hoveredColRect = { colId, left: cell.offsetLeft, height: wrap.scrollHeight };
  }
  onColHeaderLeave(): void {
    if (this.resizingCol) return;
    this.hoveredColRect = null;
  }

  startColResize(event: MouseEvent, colId: ResizableColId): void {
    if (this.isMobileViewport) return;
    event.preventDefault();
    event.stopPropagation();
    this.resizingCol = colId;
    this.beginHandleDrag(event);
    this.colStartX = event.clientX;
    this.colStartWidth = this.colWidths[colId];
    this.lockBody();
    document.addEventListener('mousemove', this.onColMouseMove);
    document.addEventListener('mouseup', this.onColMouseUp);
  }
  private onColMouseMove = (e: MouseEvent) => {
    if (!this.resizingCol) return;
    this.pendingColWidth = this.clampColWidth(this.resizingCol, this.colStartWidth + e.clientX - this.colStartX);
    if (!this.colRafScheduled) {
      this.colRafScheduled = true;
      requestAnimationFrame(() => {
        this.colRafScheduled = false;
        if (this.resizingCol && this.pendingColWidth !== null) {
          this.colWidths = { ...this.colWidths, [this.resizingCol]: this.pendingColWidth };
        }
      });
    }
  };
  private onColMouseUp = () => {
    if (this.resizingCol) {
      if (this.pendingColWidth !== null) {
        this.colWidths = { ...this.colWidths, [this.resizingCol]: this.pendingColWidth };
      }
      this.saveState();
      this.afterHandleDrag(this.resizingCol);
    }
    this.pendingColWidth = null;
    this.stopColResize();
  };
  private stopColResize(): void {
    this.resizingCol = null;
    this.hoveredColRect = null;
    this.unlockBody();
    document.removeEventListener('mousemove', this.onColMouseMove);
    document.removeEventListener('mouseup', this.onColMouseUp);
  }
  onColResizeKeydown(event: KeyboardEvent, colId: ResizableColId): void {
    const delta = this.arrowDelta(event);
    if (delta === 0) return;
    this.colWidths = { ...this.colWidths, [colId]: this.clampColWidth(colId, this.colWidths[colId] + delta) };
    this.saveState();
  }
  resetColumnWidth(colId: ResizableColId): void {
    if (this.isMobileViewport) return;
    this.colWidths = { ...this.colWidths, [colId]: this.COL_DEFAULTS[colId] };
    this.onResetDone();
  }

  // ── Quick access panel width ──────────────────────────────────────────────
  private readonly PANEL_DEFAULT = 204;
  panelWidthPx = this.PANEL_DEFAULT;
  isResizingPanel = false;
  panelHandleHovered = false;
  readonly PANEL_LINE_WIDTH = 4;
  private readonly PANEL_MIN = 200;
  private readonly PANEL_MAX = 480;
  private panelStartX = 0;
  private panelStartWidth = 0;

  private clampPanelWidth(v: number): number {
    return Math.min(this.PANEL_MAX, Math.max(this.PANEL_MIN, Math.round(v)));
  }
  startPanelResize(event: MouseEvent): void {
    if (this.isMobileViewport) return;
    event.preventDefault();
    this.isResizingPanel = true;
    this.beginHandleDrag(event);
    this.panelStartX = event.clientX;
    this.panelStartWidth = this.panelWidthPx;
    this.lockBody();
    document.addEventListener('mousemove', this.onPanelMouseMove);
    document.addEventListener('mouseup', this.onPanelMouseUp);
  }
  private onPanelMouseMove = (e: MouseEvent) => {
    if (!this.isResizingPanel) return;
    this.panelWidthPx = this.clampPanelWidth(this.panelStartWidth + e.clientX - this.panelStartX);
    // A wider left panel eats into the thread panel if the table is already at its minimum.
  };
  private onPanelMouseUp = () => { this.stopPanelResize(); this.saveState(); this.afterHandleDrag('panel'); };
  private stopPanelResize(): void {
    this.isResizingPanel = false;
    this.unlockBody();
    document.removeEventListener('mousemove', this.onPanelMouseMove);
    document.removeEventListener('mouseup', this.onPanelMouseUp);
  }
  onPanelResizeKeydown(event: KeyboardEvent): void {
    const delta = this.arrowDelta(event);
    if (delta === 0) return;
    this.panelWidthPx = this.clampPanelWidth(this.panelWidthPx + delta);
    this.saveState();
  }

  resetPanelWidth(): void {
    if (this.isMobileViewport) return;
    this.panelWidthPx = this.PANEL_DEFAULT;
    this.onResetDone();
  }

  // ── Thread drawer width (handle on the LEFT edge: drag left = wider) ─────
  // Stored as a share of the window width, so the drawer scales when the browser window is resized.
  // Min / default / max are the spec values (see the "Width spec" overlay).
  readonly THREAD_MIN_PCT = 35;
  readonly THREAD_DEFAULT_PCT = 47;
  readonly THREAD_MAX_PCT = 65;
  threadWidthPct = this.THREAD_DEFAULT_PCT;
  isResizingThread = false;
  threadHandleHovered = false;
  showWidthSpec = true;
  private threadStartX = 0;
  private threadStartPct = 0;

  /** Main column = window − sidebar − open drawer. The toolbar collapses to icons when this gets narrow. */
  get mainColumnWidth(): number {
    const sidebar = this.sidebarCollapsed ? 72 : 280;
    return this.viewportWidth - sidebar - (this.openThread ? this.effectiveThreadWidth : 0);
  }
  /** Below this main-column width the toolbar buttons show icons only, so the search shrinks instead of overflowing. */
  readonly TOOLBAR_COMPACT_BELOW = 1050;
  get compactToolbar(): boolean {
    return this.mainColumnWidth < this.TOOLBAR_COMPACT_BELOW;
  }
  /** Current window width in px — the page itself is full-window. */
  get viewportWidth(): number {
    return this.pageLayout?.nativeElement.clientWidth || window.innerWidth;
  }
  /** Preference clamped to the min / max spec. */
  get effectiveThreadPct(): number {
    return this.clampThreadPct(this.threadWidthPct);
  }
  /** Drawer width in px. Below 768 px the drawer fills the window. */
  get effectiveThreadWidth(): number {
    if (this.isMobileViewport) return this.viewportWidth;
    return Math.round(this.viewportWidth * this.effectiveThreadPct / 100);
  }
  private clampThreadPct(p: number): number {
    return Math.min(this.THREAD_MAX_PCT, Math.max(this.THREAD_MIN_PCT, p));
  }
  get widthSpec() {
    const vw = this.viewportWidth;
    const px = (p: number) => Math.round(vw * p / 100);
    const pct = this.effectiveThreadPct;
    const state: 'mobile' | 'min' | 'max' | 'default' | 'custom' =
      this.isMobileViewport ? 'mobile'
      : pct === this.THREAD_MIN_PCT ? 'min'
      : pct === this.THREAD_MAX_PCT ? 'max'
      : pct === this.THREAD_DEFAULT_PCT ? 'default'
      : 'custom';
    const stateLabel = { mobile: 'Full width · mobile', min: 'At minimum', max: 'At maximum', default: 'Default', custom: 'Custom' }[state];
    return {
      vw, state, stateLabel,
      pct: this.isMobileViewport ? 100 : Math.round(pct), px: this.effectiveThreadWidth,
      minPct: this.THREAD_MIN_PCT, minPx: px(this.THREAD_MIN_PCT),
      defPct: this.THREAD_DEFAULT_PCT, defPx: px(this.THREAD_DEFAULT_PCT),
      maxPct: this.THREAD_MAX_PCT, maxPx: px(this.THREAD_MAX_PCT),
    };
  }
  startThreadResize(event: MouseEvent): void {
    if (this.isMobileViewport) return;
    event.preventDefault();
    this.isResizingThread = true;
    this.beginHandleDrag(event);
    this.threadStartX = event.clientX;
    this.threadStartPct = this.effectiveThreadPct;
    this.lockBody();
    document.addEventListener('mousemove', this.onThreadMouseMove);
    document.addEventListener('mouseup', this.onThreadMouseUp);
  }
  private onThreadMouseMove = (e: MouseEvent) => {
    if (!this.isResizingThread) return;
    // Dragging left widens the drawer; the delta is measured against the window width.
    const deltaPct = (this.threadStartX - e.clientX) / this.viewportWidth * 100;
    this.threadWidthPct = this.clampThreadPct(this.threadStartPct + deltaPct);
  };
  private onThreadMouseUp = () => { this.stopThreadResize(); this.saveState(); this.afterHandleDrag('thread'); };
  private stopThreadResize(): void {
    this.isResizingThread = false;
    this.unlockBody();
    document.removeEventListener('mousemove', this.onThreadMouseMove);
    document.removeEventListener('mouseup', this.onThreadMouseUp);
  }
  onThreadResizeKeydown(event: KeyboardEvent): void {
    // Arrow left widens the panel (its edge moves left), arrow right narrows it.
    const delta = this.arrowDelta(event);
    if (delta === 0) return;
    this.threadWidthPct = this.clampThreadPct(this.threadWidthPct - delta / this.viewportWidth * 100);
    this.saveState();
  }
  resetThreadWidth(): void {
    if (this.isMobileViewport) return;
    this.threadWidthPct = this.THREAD_DEFAULT_PCT;
    this.onResetDone();
  }

  // ── Reset-width onboarding hint ───────────────────────────────────────────
  // Shown on a resize line only when its width differs from the default (that's the only time a
  // reset does anything): on hover, and for a few seconds right after a drag ends. Once the user
  // double-clicks any line, they've learned it — the hint retires for the session.
  private readonly HINT_SEEN_KEY = 'fvdr-qna-drawer-fullpage:reset-hint-seen';
  private readonly HINT_HOVER_DELAY = 300;
  private readonly HINT_AFTER_DRAG_MS = 4000;
  /** Header rows are 44px tall; the cursor tip sits on the line at the header's vertical middle. */
  private readonly HINT_Y_OFFSET = 22;
  resetHint: { x: number; y: number } | null = null;
  private resetHintSeen = false;
  private hintTimer: ReturnType<typeof setTimeout> | null = null;
  private dragHandleEl: HTMLElement | null = null;

  private isChanged(target: ResizableColId | 'panel' | 'thread'): boolean {
    if (target === 'panel') return this.panelWidthPx !== this.PANEL_DEFAULT;
    if (target === 'thread') return this.threadWidthPct !== this.THREAD_DEFAULT_PCT;
    return this.colWidths[target] !== this.COL_DEFAULTS[target];
  }
  private get isAnyResizing(): boolean {
    return !!this.resizingCol || this.isResizingPanel || this.isResizingThread;
  }
  private showHintAt(el: HTMLElement): void {
    const r = el.getBoundingClientRect();
    this.resetHint = { x: r.left + r.width / 2, y: r.top + this.HINT_Y_OFFSET };
  }
  private clearHintTimer(): void {
    if (this.hintTimer) { clearTimeout(this.hintTimer); this.hintTimer = null; }
  }
  onHandleEnter(event: MouseEvent, target: ResizableColId | 'panel' | 'thread'): void {
    if (this.resetHintSeen || this.isMobileViewport || this.isAnyResizing || !this.isChanged(target)) return;
    const el = event.currentTarget as HTMLElement;
    this.clearHintTimer();
    this.hintTimer = setTimeout(() => this.showHintAt(el), this.HINT_HOVER_DELAY);
  }
  onHandleLeave(): void {
    if (this.isAnyResizing) return;
    this.clearHintTimer();
    this.resetHint = null;
  }
  private beginHandleDrag(event: MouseEvent): void {
    this.dragHandleEl = event.currentTarget as HTMLElement;
    this.clearHintTimer();
    this.resetHint = null;
  }
  private afterHandleDrag(target: ResizableColId | 'panel' | 'thread'): void {
    const el = this.dragHandleEl;
    this.dragHandleEl = null;
    if (!el || this.resetHintSeen || !this.isChanged(target)) return;
    // Wait for change detection so the handle has moved to the new edge before measuring it.
    setTimeout(() => {
      // A double-click is two mousedown/mouseup pairs — if it already reset the width, stay quiet.
      if (!el.isConnected || this.resetHintSeen || !this.isChanged(target)) return;
      this.showHintAt(el);
      this.clearHintTimer();
      this.hintTimer = setTimeout(() => this.resetHint = null, this.HINT_AFTER_DRAG_MS);
    }, 0);
  }
  private onResetDone(): void {
    this.saveState();
    this.clearHintTimer();
    this.resetHint = null;
    this.resetHintSeen = true;
    try { sessionStorage.setItem(this.HINT_SEEN_KEY, '1'); } catch { /* in-memory only */ }
  }

  // ── Shared ────────────────────────────────────────────────────────────────
  private arrowDelta(event: KeyboardEvent): number {
    if (this.isMobileViewport) return 0;
    const step = event.shiftKey ? 32 : 8;
    if (event.key === 'ArrowLeft')  { event.preventDefault(); return -step; }
    if (event.key === 'ArrowRight') { event.preventDefault(); return step; }
    return 0;
  }
  private lockBody(): void {
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }
  private unlockBody(): void {
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }

  private onWindowResize = () => {
    this.isMobileViewport = window.innerWidth < 768;
  };

  private loadState(): void {
    try {
      const raw = sessionStorage.getItem(this.COLS_STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as { cols?: Partial<Record<ResizableColId, number>>; panel?: number; thread?: number };
      const merged = { ...this.COL_DEFAULTS };
      (Object.keys(merged) as ResizableColId[]).forEach(id => {
        const v = saved.cols?.[id];
        if (typeof v === 'number') merged[id] = this.clampColWidth(id, v);
      });
      this.colWidths = merged;
      if (typeof saved.panel === 'number') this.panelWidthPx = this.clampPanelWidth(saved.panel);
      if (typeof saved.thread === 'number') this.threadWidthPct = this.clampThreadPct(saved.thread);
    } catch {
      // corrupted entry — fall back to defaults
    }
  }
  private saveState(): void {
    try {
      sessionStorage.setItem(this.COLS_STORAGE_KEY, JSON.stringify({ cols: this.colWidths, panel: this.panelWidthPx, thread: this.threadWidthPct }));
    } catch {
      // storage unavailable — resize still works in-memory
    }
  }

  ngOnInit(): void {
    this.tracker.trackPageView('qna-drawer-fullpage');
    this.loadState();
    try { this.resetHintSeen = sessionStorage.getItem(this.HINT_SEEN_KEY) === '1'; } catch { /* default: not seen */ }
    this.isMobileViewport = window.innerWidth < 768;
    window.addEventListener('resize', this.onWindowResize);
  }
  ngOnDestroy(): void {
    this.tracker.destroyListeners();
    this.stopColResize();
    this.stopPanelResize();
    this.stopThreadResize();
    this.clearHintTimer();
    window.removeEventListener('resize', this.onWindowResize);
  }
}
