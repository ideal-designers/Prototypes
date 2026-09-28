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
  assignee?: string;
}

type ResizableColId = 'num' | 'subject' | 'status' | 'team' | 'author' | 'priority' | 'updated' | 'category';

interface ColDef { id: ResizableColId; label: string; }

@Component({
  selector: 'fvdr-qna-column-resize',
  standalone: true,
  imports: [CommonModule, FormsModule, ...DS_COMPONENTS],
  template: `
    <div class="page-layout">

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
              <fvdr-btn label="New question" variant="primary" size="m" iconName="plus"></fvdr-btn>
              <fvdr-btn label="New FAQ" variant="secondary" size="m" iconName="comment"></fvdr-btn>
              <fvdr-btn label="Export" variant="secondary" size="m" iconName="download"></fvdr-btn>
              <fvdr-btn label="Import" variant="secondary" size="m" iconName="upload"></fvdr-btn>
            </div>
            <div class="toolbar-right">
              <fvdr-btn label="View as" variant="secondary" size="m" iconName="view-as"></fvdr-btn>
              <fvdr-search placeholder="Search" [filter]="true"></fvdr-search>
            </div>
          </div>

          <div class="content-row" #contentRow>

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
                   (mouseenter)="panelHandleHovered = true"
                   (mouseleave)="panelHandleHovered = false"
                   (mousedown)="startPanelResize($event)"
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
                  <span class="th-label" [attr.data-col-measure]="col.id">{{ col.label }}</span>
                  <span class="col-resize-handle"
                        [class.col-resize-handle--active]="resizingCol === col.id"
                        role="separator" aria-orientation="vertical" [attr.aria-label]="'Resize column ' + col.label"
                        tabindex="0"
                        (mousedown)="startColResize($event, col.id)"
                        (keydown)="onColResizeKeydown($event, col.id)"
                        (dblclick)="autoFitColumn(col.id)"></span>
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
                    <span *ngSwitchCase="'num'" class="td-text" data-col-measure="num">{{ t.id }}</span>
                    <span *ngSwitchCase="'subject'" class="td-text td-ellipsis" data-col-measure="subject">{{ t.subject }}</span>
                    <span *ngSwitchCase="'status'" class="status-chip" [ngClass]="'status-chip--' + t.status" data-col-measure="status">{{ statusLabel(t.status) }}</span>
                    <span *ngSwitchCase="'team'" class="td-inline" data-col-measure="team">
                      <fvdr-icon name="group" class="team-icon"></fvdr-icon>{{ t.team }}
                    </span>
                    <span *ngSwitchCase="'author'" class="td-inline" data-col-measure="author">
                      <span class="mini-avatar">{{ t.initials }}</span><span class="td-ellipsis">{{ t.author }}</span>
                    </span>
                    <span *ngSwitchCase="'priority'" class="prio" [ngClass]="'prio--' + t.priority" [title]="t.priority">
                      <fvdr-icon [name]="t.priority === 'low' ? 'chevron-up' : 'angle-double-right'"></fvdr-icon>
                    </span>
                    <span *ngSwitchCase="'updated'" class="td-text" data-col-measure="updated">{{ t.updated }}</span>
                    <span *ngSwitchCase="'category'" class="td-inline" data-col-measure="category">
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

            <!-- ── Thread panel (resizable from its left edge) ── -->
            <aside class="thread"
                   *ngIf="openThread as th"
                   [style.width.px]="threadWidthPx"
                   [class.thread--handle-hover]="threadHandleHovered && !isResizingThread"
                   [class.thread--handle-active]="isResizingThread">

              <div class="v-handle v-handle--left"
                   role="separator" aria-orientation="vertical" aria-label="Resize thread panel"
                   tabindex="0"
                   title="Drag to resize · double-click to reset"
                   (mouseenter)="threadHandleHovered = true"
                   (mouseleave)="threadHandleHovered = false"
                   (mousedown)="startThreadResize($event)"
                   (dblclick)="resetThreadWidth()"
                   (keydown)="onThreadResizeKeydown($event)"></div>

              <!-- Hovering the header reveals the drag line on the left edge — same cue as the table column headers -->
              <div class="thread__head"
                   (mouseenter)="threadHandleHovered = true"
                   (mouseleave)="threadHandleHovered = false">
                <button class="icon-btn" title="Previous" (click)="stepThread(-1)"><fvdr-icon name="chevron-up"></fvdr-icon></button>
                <button class="icon-btn" title="Next" (click)="stepThread(1)"><fvdr-icon name="chevron-down"></fvdr-icon></button>
                <span class="thread__id">#{{ th.id }}</span>
                <span class="thread__spacer"></span>
                <span class="td-inline" *ngIf="th.category">
                  <fvdr-icon name="label" class="cat-icon" [ngClass]="'cat-icon--' + (th.category === 'Finance' ? 'teal' : 'green')"></fvdr-icon>
                  {{ th.category }} <fvdr-icon name="chevron-down" class="muted"></fvdr-icon>
                </span>
                <span class="status-chip" [ngClass]="'status-chip--' + th.status">{{ statusLabel(th.status) }}</span>
                <button class="icon-btn" title="Close" (click)="closeThread()"><fvdr-icon name="close"></fvdr-icon></button>
              </div>

              <div class="thread__body">
                <h3 class="thread__title">{{ th.subject }}</h3>
                <div class="thread__assign" *ngIf="th.assignee">
                  Assigned to: <span class="assignee-chip">{{ th.assignee }}</span>
                  <fvdr-icon name="edit" class="assign-edit"></fvdr-icon>
                </div>

                <div class="msg">
                  <div class="msg__head">
                    <span class="mini-avatar">{{ th.initials }}</span>
                    <span class="msg__author">{{ th.author }}</span>
                    <span class="msg__date">{{ th.asked }}</span>
                  </div>
                  <p class="msg__text">{{ th.question }}</p>
                </div>

                <div class="activity">
                  <fvdr-btn label="Activity" variant="secondary" size="s" iconName="expand"></fvdr-btn>
                </div>
                <p class="activity__note" *ngIf="th.assignee">
                  Question was auto-assigned based on the category to {{ th.assignee }} on {{ th.asked }}
                </p>

                <div class="composer">
                  <div class="composer__tabs">
                    <button class="composer__tab" [class.composer__tab--active]="composerTab === 'answer'" (click)="composerTab = 'answer'">Answer</button>
                    <button class="composer__tab" [class.composer__tab--active]="composerTab === 'note'" (click)="composerTab = 'note'">Internal note</button>
                  </div>
                  <div class="composer__box">
                    <textarea [(ngModel)]="draft" maxlength="5000"
                              [placeholder]="composerTab === 'answer' ? 'Type your answer' : 'Type an internal note'"></textarea>
                    <div class="composer__tools">
                      <fvdr-icon name="text-mark"></fvdr-icon>
                      <fvdr-icon name="link"></fvdr-icon>
                      <fvdr-icon name="upload"></fvdr-icon>
                      <span class="thread__spacer"></span>
                      <button class="send-btn" [disabled]="!draft.trim()"><fvdr-icon name="send"></fvdr-icon></button>
                    </div>
                  </div>
                  <div class="composer__meta">
                    <span>Answer will be sent for approval</span>
                    <span>{{ draft.length }}/5000</span>
                  </div>
                </div>
              </div>
            </aside>

          </div>
        </div>
      </div>
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

    .toolbar { display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; height: 40px; }
    .toolbar-left, .toolbar-right { display: flex; gap: var(--space-3); align-items: center; }

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
    .thread::before {
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
    .thread::before { left: 0; z-index: 1; }
    .qa-panel--handle-hover .qa-block::after,
    .thread--handle-hover::before { background: var(--color-divider); }
    .qa-panel--handle-active .qa-block::after,
    .thread--handle-active::before { background: var(--chip-bg-green); }

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
      font-size: 10px; font-weight: 600;
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

    /* ── Thread panel ── */
    .thread {
      position: relative;
      flex-shrink: 0;
      display: flex; flex-direction: column;
      min-height: 0;
      padding-left: var(--space-2);
    }
    .thread__head {
      display: flex; align-items: center; gap: var(--space-2);
      height: 44px; padding: 0 var(--space-3);
      background: var(--color-stone-200);
      border-radius: var(--radius-sm);
      flex-shrink: 0;
    }
    .thread__id { font-weight: 600; white-space: nowrap; }
    .thread__spacer { flex: 1; }
    .thread__body {
      flex: 1; overflow-y: auto;
      padding: var(--space-5) var(--space-4) var(--space-4);
      display: flex; flex-direction: column; gap: var(--space-4);
    }
    .thread__title { margin: 0; font-size: 16px; font-weight: 600; }
    .thread__assign { display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; }
    .assignee-chip {
      display: inline-flex; align-items: center; height: 24px;
      padding: 0 var(--space-2);
      background: var(--color-stone-300);
      border-radius: 12px;
    }
    .assign-edit { color: var(--color-primary-500); cursor: pointer; }

    .msg {
      background: var(--chip-bg-indigo);
      border-radius: var(--radius-lg);
      padding: var(--space-4) var(--space-5);
    }
    .msg__head { display: flex; align-items: center; gap: var(--space-2); }
    .msg__author { font-weight: 500; }
    .msg__date { margin-left: auto; color: var(--color-text-secondary); white-space: nowrap; }
    .msg__text { margin: var(--space-4) 0 0; line-height: 20px; }

    .activity { display: flex; justify-content: center; }
    .activity__note { margin: 0; text-align: center; color: var(--color-text-secondary); }

    .composer__tabs { display: flex; }
    .composer__tab {
      height: 28px; padding: 0 var(--space-3);
      border: 1px solid var(--color-divider); border-bottom: none;
      background: var(--color-stone-200);
      font: inherit; cursor: pointer;
      border-radius: var(--radius-sm) var(--radius-sm) 0 0;
    }
    .composer__tab--active { background: var(--color-stone-0); }
    .composer__box {
      border: 1px solid var(--color-primary-500);
      border-radius: 0 var(--radius-sm) var(--radius-sm) var(--radius-sm);
      padding: var(--space-3);
    }
    .composer__box textarea {
      width: 100%; min-height: 56px; box-sizing: border-box;
      border: none; outline: none; resize: vertical;
      font: inherit; color: inherit; background: transparent;
    }
    .composer__tools {
      display: flex; align-items: center; gap: var(--space-3);
      color: var(--color-text-secondary);
      font-size: var(--font-size-lg, 16px);
    }
    .send-btn {
      display: flex; align-items: center; justify-content: center;
      width: 28px; height: 28px; border: none;
      border-radius: var(--radius-sm);
      background: var(--color-primary-500); color: var(--color-stone-0);
      cursor: pointer;
    }
    .send-btn:disabled { background: var(--color-stone-400); cursor: default; }
    .composer__meta {
      display: flex; justify-content: space-between;
      margin-top: var(--space-1);
      font-size: var(--text-caption1-size);
      color: var(--color-text-secondary);
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
export class QnaColumnResizeComponent implements OnInit, OnDestroy {
  private tracker = inject(TrackerService);
  @ViewChild('contentRow') contentRow?: ElementRef<HTMLElement>;

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
    { id: '8630', subject: 'Clarification on the revenue recognition policy for multi-year contracts', status: 'to-approve', team: 'Buyer 1', author: 'John Doe', initials: 'JD', priority: 'medium', updated: 'Aug 12, 2026', category: 'Finance', question: 'Could you clarify how multi-year contracts are recognised in the FY25 statements?', asked: 'Aug 12, 10:02' },
    { id: '2452', subject: 'Test', status: 'to-approve', team: 'Buyer 1', author: 'Maksym Kunytsia', initials: 'MK', priority: 'medium', updated: 'May 4, 2026', category: 'Finance', question: 'Please share the latest audited financials.', asked: 'May 4, 09:15' },
    { id: 'E7EE', subject: 'Lease agreements', status: 'to-approve', team: 'Buyer 1', author: 'Dmytro Horin', initials: 'DH', priority: 'medium', updated: 'May 4, 2026', category: 'Legal', question: 'Are there any lease agreements expiring within the next 12 months?', asked: 'May 4, 08:40' },
    { id: 'D701', subject: 'Testing question', status: 'assigned', team: 'Buyer 1', author: 'Mikhail Metelev', initials: 'MM', priority: 'low', updated: 'Jan 19, 2026', category: 'Finance', question: 'Hi! Can we add Q4 data to the report for the meeting?', asked: 'Jan 19, 14:36', assignee: 'Dmytro Siniehin' },
    { id: 'B6DF', subject: 'IP ownership', status: 'answered', team: 'Buyer 1', author: 'Ulyana Moiseeva', initials: 'UM', priority: 'medium', updated: 'Oct 24, 2025', category: 'Legal', question: 'Who owns the IP developed by contractors?', asked: 'Oct 24, 11:20' },
    { id: '458C', subject: 'New question', status: 'answered', team: 'Buyer 1', author: 'Maksym Kunytsia', initials: 'MK', priority: 'medium', updated: 'Jul 2, 2025', category: 'Legal', question: 'Is there any pending litigation?', asked: 'Jul 2, 16:05' },
    { id: '14BD', subject: 'Test', status: 'submitted', team: 'Buyer 1', author: 'Maksym Kunytsia', initials: 'MK', priority: 'medium', updated: 'May 20, 2024', category: null, question: 'Test question body.', asked: 'May 20, 12:00' },
    { id: '6539', subject: 'Revenue', status: 'closed', team: 'Buyer 1', author: 'Maksym Kunytsia', initials: 'MK', priority: 'medium', updated: 'Apr 17, 2024', category: null, question: 'What was the revenue split by region?', asked: 'Apr 17, 13:30' },
    { id: '7563', subject: 'Customer churn', status: 'answered', team: 'Buyer 1', author: 'Maksym Kunytsia', initials: 'MK', priority: 'high', updated: 'Mar 25, 2024', category: null, question: 'What was the customer churn rate last year?', asked: 'Mar 25, 10:10' },
  ];

  statusLabel(s: ThreadStatus): string {
    return { 'to-approve': 'To approve', assigned: 'Assigned', answered: 'Answered', submitted: 'Submitted', closed: 'Closed' }[s];
  }

  // ── Thread panel ──────────────────────────────────────────────────────────
  openThread: QnaThread | null = null;
  composerTab: 'answer' | 'note' = 'answer';
  draft = '';

  openThreadRow(t: QnaThread): void {
    this.openThread = t;
    this.draft = '';
    this.hoveredColRect = null;
    // Make sure the stored width still fits the current viewport.
    requestAnimationFrame(() => this.threadWidthPx = this.clampThreadWidth(this.threadWidthPx));
  }
  closeThread(): void { this.openThread = null; this.hoveredColRect = null; }
  stepThread(dir: 1 | -1): void {
    if (!this.openThread) return;
    const i = this.threads.indexOf(this.openThread);
    const next = this.threads[i + dir];
    if (next) this.openThreadRow(next);
  }

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
  private readonly COLS_STORAGE_KEY = 'fvdr-qna-column-resize:col-widths';
  private readonly COL_DEFAULTS: Record<ResizableColId, number> = { num: 62, subject: 276, status: 130, team: 145, author: 174, priority: 98, updated: 131, category: 130 };
  private readonly COL_MIN: Record<ResizableColId, number>      = { num: 56, subject: 120, status: 96,  team: 96,  author: 110, priority: 80, updated: 100, category: 96 };
  private readonly COL_MAX: Record<ResizableColId, number>      = { num: 160, subject: 720, status: 240, team: 320, author: 360, priority: 200, updated: 240, category: 320 };
  /** Fixed content (icon/avatar + gap) that precedes the measured text in a cell, added on auto-fit. */
  private readonly COL_MEASURE_OFFSET: Partial<Record<ResizableColId, number>> = {};

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
  autoFitColumn(colId: ResizableColId): void {
    if (this.isMobileViewport) return;
    const els = Array.from(document.querySelectorAll<HTMLElement>(`[data-col-measure="${colId}"]`));
    const widest = els.length ? Math.max(...els.map(el => el.scrollWidth)) : this.COL_MIN[colId];
    const cellPadding = 24; // --space-3 on both sides
    this.colWidths = { ...this.colWidths, [colId]: this.clampColWidth(colId, widest + (this.COL_MEASURE_OFFSET[colId] ?? 0) + cellPadding) };
    this.saveState();
  }

  // ── Quick access panel width ──────────────────────────────────────────────
  panelWidthPx = 204;
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
    if (this.openThread) this.threadWidthPx = this.clampThreadWidth(this.threadWidthPx);
  };
  private onPanelMouseUp = () => { this.stopPanelResize(); this.saveState(); };
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

  // ── Thread panel width (handle on the LEFT edge: drag left = wider) ───────
  private readonly THREAD_DEFAULT = 668;
  private readonly THREAD_MIN = 400;
  private readonly THREAD_MAX = 1000;
  /** Table never shrinks below this while a thread is open. */
  private readonly TABLE_MIN = 320;
  threadWidthPx = this.THREAD_DEFAULT;
  isResizingThread = false;
  threadHandleHovered = false;
  private threadStartX = 0;
  private threadStartWidth = 0;

  private get threadMaxForViewport(): number {
    const row = this.contentRow?.nativeElement;
    if (!row) return this.THREAD_MAX;
    const gap = 24; // --space-6 between each flex child
    const left = this.panelCollapsed ? 56 : this.panelWidthPx;
    const available = row.clientWidth - left - this.TABLE_MIN - gap * 2;
    return Math.max(this.THREAD_MIN, Math.min(this.THREAD_MAX, available));
  }
  private clampThreadWidth(v: number): number {
    return Math.min(this.threadMaxForViewport, Math.max(this.THREAD_MIN, Math.round(v)));
  }
  startThreadResize(event: MouseEvent): void {
    if (this.isMobileViewport) return;
    event.preventDefault();
    this.isResizingThread = true;
    this.threadStartX = event.clientX;
    this.threadStartWidth = this.threadWidthPx;
    this.lockBody();
    document.addEventListener('mousemove', this.onThreadMouseMove);
    document.addEventListener('mouseup', this.onThreadMouseUp);
  }
  private onThreadMouseMove = (e: MouseEvent) => {
    if (!this.isResizingThread) return;
    this.threadWidthPx = this.clampThreadWidth(this.threadStartWidth - (e.clientX - this.threadStartX));
  };
  private onThreadMouseUp = () => { this.stopThreadResize(); this.saveState(); };
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
    this.threadWidthPx = this.clampThreadWidth(this.threadWidthPx - delta);
    this.saveState();
  }
  resetThreadWidth(): void {
    this.threadWidthPx = this.clampThreadWidth(this.THREAD_DEFAULT);
    this.saveState();
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
    if (this.openThread) this.threadWidthPx = this.clampThreadWidth(this.threadWidthPx);
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
      if (typeof saved.thread === 'number') this.threadWidthPx = Math.max(this.THREAD_MIN, Math.min(this.THREAD_MAX, saved.thread));
    } catch {
      // corrupted entry — fall back to defaults
    }
  }
  private saveState(): void {
    try {
      sessionStorage.setItem(this.COLS_STORAGE_KEY, JSON.stringify({ cols: this.colWidths, panel: this.panelWidthPx, thread: this.threadWidthPx }));
    } catch {
      // storage unavailable — resize still works in-memory
    }
  }

  ngOnInit(): void {
    this.tracker.trackPageView('qna-column-resize');
    this.loadState();
    this.isMobileViewport = window.innerWidth < 768;
    window.addEventListener('resize', this.onWindowResize);
  }
  ngOnDestroy(): void {
    this.tracker.destroyListeners();
    this.stopColResize();
    this.stopPanelResize();
    this.stopThreadResize();
    window.removeEventListener('resize', this.onWindowResize);
  }
}
