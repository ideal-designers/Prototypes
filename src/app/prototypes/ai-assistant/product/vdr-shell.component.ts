import {
  AfterContentChecked,
  Component,
  ContentChild,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { DS_COMPONENTS, TabItem } from '../../../shared/ds';
import { VdrDocumentsComponent } from './pages/vdr-documents.component';
import {
  VDR_PAGES,
  VDR_PAGE_TABS,
  VDR_RAIL_ITEMS,
  VdrPageId,
  VdrRailItem,
} from './data/product-nav';
import { MOCK_DATA_ROOM } from '../data/mock-data';

/**
 * Real-product VDR shell — 72px icon-only rail + 64px top bar, with the page
 * content projected in.
 *
 * Replica of the live product chrome (`.design/real-product-spec.md` section 1),
 * rendered in FVDR tokens so it follows the platform light/dark theme instead of
 * the per-project branded palette the capture happened to be in.
 *
 * Everything is inert except navigation: the rail and the page tabs emit
 * `pageChange`, and the host owns the current page.
 *
 *   <fvdr-vdr-shell [page]="page()" (pageChange)="page.set($event)"
 *                   [rightInset]="assistantWidth" (themeToggle)="conv.toggleDark()">
 *     <fvdr-vdr-documents *ngIf="page() === 'documents'"></fvdr-vdr-documents>
 *   </fvdr-vdr-shell>
 */
@Component({
  selector: 'fvdr-vdr-shell',
  standalone: true,
  imports: [CommonModule, ...DS_COMPONENTS],
  template: `
<div class="shell">

  <!-- ── Left rail — icon only, never expands to labels ─────────────── -->
  <nav class="rail" aria-label="Project navigation">
    <div class="rail__logo" [attr.title]="projectName">{{ projectMark }}</div>

    <div class="rail__items">
      <button
        *ngFor="let item of railItems"
        type="button"
        class="rail__item"
        [class.rail__item--active]="item.id === activeRail"
        [attr.title]="item.label"
        [attr.aria-label]="item.label"
        (click)="onRailClick(item)"
      >
        <fvdr-icon [name]="item.icon"></fvdr-icon>
      </button>
    </div>

    <!-- Marketing brand mark at the bottom of the live rail -->
    <span class="rail__brand" aria-hidden="true"></span>
  </nav>

  <div class="shell__main">

    <!-- ── Top bar ───────────────────────────────────────────────────── -->
    <header class="topbar">
      <nav class="crumbs" aria-label="Breadcrumb">
        <ng-container *ngFor="let seg of breadcrumb; let i = index; let last = last">
          <fvdr-icon *ngIf="i > 0" name="chevron-right" class="crumbs__sep"></fvdr-icon>
          <span class="crumbs__seg" [class.crumbs__seg--current]="last">{{ seg }}</span>
        </ng-container>
      </nav>

      <div class="topbar__actions">
        <!-- Assistant entry point — projected so the shell stays product-only. -->
        <ng-content select="[topbar-actions]"></ng-content>
        <button type="button" class="icon-btn" title="Theme" (click)="themeToggle.emit()">
          <fvdr-icon name="theme-light"></fvdr-icon>
        </button>
        <button type="button" class="icon-btn" title="Help">
          <fvdr-icon name="help"></fvdr-icon>
        </button>
        <button type="button" class="icon-btn" title="Download application">
          <fvdr-icon name="app-download"></fvdr-icon>
        </button>
        <fvdr-avatar [initials]="userInitials" size="sm" [title]="userInitials"></fvdr-avatar>
      </div>
    </header>

    <!-- ── Sub-navigation — the live product shows it as page tabs ────── -->
    <div class="shell__tabs" *ngIf="tabs.length">
      <fvdr-tabs [tabs]="tabs" [activeId]="page" (tabChange)="onTabChange($event)"></fvdr-tabs>
    </div>

    <main class="shell__content">
      <ng-content></ng-content>
    </main>
  </div>

  <!--
    Intercom launcher. Kept because it owns the exact corner a floating
    assistant wants; shift it with [rightInset] when a panel docks right.
  -->
  <button
    type="button"
    class="intercom"
    [style.right.px]="rightInset + 20"
    title="Support"
    aria-label="Support"
  >
    <fvdr-icon name="comment"></fvdr-icon>
  </button>
</div>
  `,
  styles: [`
    :host { display: block; height: 100%; font-family: var(--font-family); color: var(--color-text-primary); }

    .shell {
      position: relative;
      display: flex;
      height: 100vh;
      overflow: hidden;
      background: var(--color-stone-0);
    }

    /* ── Rail: 72px, icon-only, grey against the white content area ── */
    .rail {
      flex: 0 0 72px;
      width: 72px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3) 0 var(--space-4);
      background: var(--color-stone-200);
      border-right: 1px solid var(--color-divider);
      box-sizing: border-box;
    }

    .rail__logo {
      width: 40px; height: 40px;
      display: flex; align-items: center; justify-content: center;
      border-radius: var(--radius-sm);
      background: var(--color-primary-500);
      color: var(--color-text-inverse, #ffffff);
      font-size: var(--font-size-sm, 13px);
      font-weight: 700;
      letter-spacing: 0.02em;
      margin-bottom: var(--space-2);
      flex: none;
    }

    .rail__items { display: flex; flex-direction: column; align-items: center; gap: var(--space-1); flex: 1; }

    .rail__item {
      width: 44px; height: 40px;
      display: flex; align-items: center; justify-content: center;
      border: none; background: transparent; cursor: pointer;
      border-radius: var(--radius-sm);
      color: var(--color-stone-700);
      font-size: var(--font-size-2xl, 20px);
    }
    .rail__item:hover { color: var(--color-text-primary); }
    /* Live product tints the active icon and shows no background, no label. */
    .rail__item--active { color: var(--color-primary-500); }

    /* The live rail is darker than the content area. FVDR's dark stone scale is
       inverted, so stone-200 reads *lighter* than the page there — step down to
       stone-50, the only stone below the page background. */
    :host-context(.dark-theme) .rail { background: var(--color-stone-50); }

    .rail__brand {
      width: 24px; height: 24px; border-radius: var(--radius-full); flex: none;
      background: radial-gradient(circle at 30% 30%, var(--color-primary-500), var(--color-primary-700));
    }

    /* ── Main column ── */
    .shell__main { flex: 1; display: flex; flex-direction: column; min-width: 0; min-height: 0; }

    .topbar {
      flex: none;
      height: 64px;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 var(--space-6);
      border-bottom: 1px solid var(--color-divider);
    }

    .crumbs { display: flex; align-items: center; gap: var(--space-2); min-width: 0; }
    .crumbs__seg {
      font-size: var(--font-size-lg, 16px);
      color: var(--color-text-secondary);
      white-space: nowrap;
    }
    .crumbs__seg--current { color: var(--color-text-primary); font-weight: 600; }
    .crumbs__sep { color: var(--color-stone-600); font-size: var(--font-size-xs, 12px); }

    .topbar__actions { display: flex; align-items: center; gap: var(--space-2); }

    .icon-btn {
      width: 32px; height: 32px;
      display: flex; align-items: center; justify-content: center;
      border: none; background: transparent; cursor: pointer;
      border-radius: var(--radius-sm);
      color: var(--color-stone-700);
      font-size: var(--font-size-lg, 16px);
    }
    .icon-btn:hover { background: var(--color-hover-bg); color: var(--color-text-primary); }

    /* Documents has seven tabs and Reports six — scroll the strip rather than
       wrap it when the window (or a docked assistant panel) squeezes it. */
    .shell__tabs {
      flex: none;
      padding: 0 var(--space-6);
      border-bottom: 1px solid var(--color-divider);
      overflow-x: auto;
      overflow-y: hidden;
      scrollbar-width: none;
    }
    .shell__tabs::-webkit-scrollbar { height: 0; }

    .shell__content { flex: 1; min-height: 0; overflow: auto; }

    /* ── Intercom launcher ── */
    .intercom {
      position: absolute;
      bottom: 20px;
      width: 48px; height: 48px;
      display: flex; align-items: center; justify-content: center;
      border: none; cursor: pointer;
      border-radius: var(--radius-full);
      background: var(--color-primary-500);
      color: var(--color-text-inverse, #ffffff);
      font-size: var(--font-size-2xl, 20px);
      box-shadow: var(--shadow-popover);
      transition: right 0.2s ease;
      z-index: 40;
    }
    .intercom:hover { background: var(--color-primary-600); }
  `],
})
export class VdrShellComponent implements OnInit, OnChanges, AfterContentChecked, OnDestroy {
  /** Current page — the host owns it. */
  @Input() page: VdrPageId = 'documents';
  /** Project name, shown as the rail logo tooltip. */
  @Input() projectName = MOCK_DATA_ROOM.name;
  /** Signed-in user's initials, top-right avatar. */
  @Input() userInitials = 'DS';
  /**
   * Horizontal space (px) taken by anything docked to the right edge — the
   * assistant panel. The Intercom launcher slides left by this much so it stays
   * visible instead of hiding behind the panel.
   */
  @Input() rightInset = 0;

  @Output() pageChange = new EventEmitter<VdrPageId>();
  /** Top-bar theme toggle — the host owns the actual light/dark state. */
  @Output() themeToggle = new EventEmitter<void>();
  /**
   * Folder name from the Documents page's row-hover "Ask AI" action, re-emitted
   * here so the host can open its assistant scoped to that folder without the
   * replica knowing anything about the assistant.
   */
  @Output() askAiForFolder = new EventEmitter<string>();

  readonly railItems = VDR_RAIL_ITEMS;

  get activeRail() { return VDR_PAGES[this.page].rail; }
  get breadcrumb(): string[] { return VDR_PAGES[this.page].breadcrumb; }

  /** Two-letter mark derived from the project name, like the branded logo. */
  get projectMark(): string {
    const parts = this.projectName.trim().split(/\s+/).filter(Boolean);
    const raw = parts.length > 1 ? parts[0][0] + parts[1][0] : this.projectName.slice(0, 2);
    return raw.toUpperCase();
  }

  /**
   * Page tabs for the active rail section. Rebuilt only when the page changes —
   * a getter would hand *ngFor a new array on every change-detection pass, which
   * tears the tab buttons down and back up and loses their click handling.
   */
  tabs: TabItem[] = [];

  /**
   * The pages are projected content, so the shell cannot bind to the Documents
   * page's output in a template — it picks the instance up as a content child
   * and forwards the event. Re-checked because the host swaps pages with
   * *ngSwitch, which destroys and recreates the instance.
   */
  @ContentChild(VdrDocumentsComponent) private documentsPage?: VdrDocumentsComponent;
  private wiredPage?: VdrDocumentsComponent;
  private askSub?: Subscription;

  ngOnInit(): void { this.syncTabs(); }
  ngOnChanges(): void { this.syncTabs(); }

  ngAfterContentChecked(): void {
    if (this.documentsPage === this.wiredPage) return;
    this.askSub?.unsubscribe();
    this.wiredPage = this.documentsPage;
    this.askSub = this.documentsPage?.askAiForFolder.subscribe(f => this.askAiForFolder.emit(f));
  }

  ngOnDestroy(): void { this.askSub?.unsubscribe(); }

  private syncTabs(): void {
    this.tabs = (VDR_PAGE_TABS[this.activeRail] ?? []).map(t => ({ id: t.id, label: t.label }));
  }

  onRailClick(item: VdrRailItem): void {
    if (item.page) this.pageChange.emit(item.page);
  }

  onTabChange(id: string): void {
    this.pageChange.emit(id as VdrPageId);
  }
}
