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
import {
  BreadcrumbItem,
  DS_COMPONENTS,
  HeaderAction,
  SidebarNavItem,
  SidebarNavSubItem,
} from '../../../shared/ds';
import { VdrDocumentsComponent } from './pages/vdr-documents.component';
import {
  VDR_NAV_ITEMS,
  VDR_PAGES,
  VdrNavItem,
  VdrPageId,
  isPageId,
} from './data/product-nav';
import { MOCK_DATA_ROOM } from '../data/mock-data';

/**
 * Real-product VDR shell — the FVDR sidebar plus a 64px top bar, with the page
 * content projected in.
 *
 * Built from the DS: the left navigation is `fvdr-sidebar-nav`
 * `variant="vdr"` (expanded with labels by default, sub-navigation as
 * expandable sub-items, 72px icon-only when collapsed) and the top bar is
 * `fvdr-header` in breadcrumbs mode. Rendered in FVDR tokens so it follows the
 * platform light/dark theme instead of the per-project branded palette the
 * capture happened to be in.
 *
 * Everything is inert except navigation: the sidebar emits `pageChange` and the
 * host owns the current page.
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

  <!-- ── Left navigation — the DS sidebar, used as-is ──────────────────── -->
  <fvdr-sidebar-nav
    variant="vdr"
    [accountName]="projectName"
    [accountMark]="projectMark"
    [items]="navItems"
    [collapsed]="sidebarCollapsed || collapseNav"
    (collapsedChange)="sidebarCollapsed = $event"
    (itemClick)="onNavItem($event)"
    (subItemClick)="onNavSubItem($event)"
  ></fvdr-sidebar-nav>

  <div class="shell__main">

    <!-- ── Top bar ───────────────────────────────────────────────────── -->
    <fvdr-header
      [breadcrumbs]="crumbs"
      [actions]="headerActions"
      [userName]="userName"
      (actionClick)="onHeaderAction($event)"
    >
      <!-- Assistant entry point — projected twice (host → shell → header)
           so the shell stays product-only. -->
      <span header-actions class="topbar__slot">
        <ng-content select="[topbar-actions]"></ng-content>
      </span>
    </fvdr-header>

    <main class="shell__content">
      <ng-content></ng-content>
    </main>
  </div>

  <!--
    Intercom launcher. Product chrome, not a DS control — kept because it owns
    the exact corner a floating assistant wants; shift it with [rightInset]
    when a panel docks right.
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

    /* ── Main column ── */
    .shell__main { flex: 1; display: flex; flex-direction: column; min-width: 0; min-height: 0; }
    .shell__main > fvdr-header { flex: none; }

    .topbar__slot { display: inline-flex; align-items: center; }

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
  /** Project name, shown in the sidebar's project switcher. */
  @Input() projectName = MOCK_DATA_ROOM.name;
  /** Signed-in user — the header derives the avatar initials from it. */
  @Input() userName = 'Dmytro Siniehin';
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

  /** Top-right icon actions, in live product order. */
  readonly headerActions: HeaderAction[] = [
    { id: 'theme', icon: 'theme-light', label: 'Theme' },
    { id: 'help', icon: 'help', label: 'Help' },
    { id: 'app', icon: 'app-download', label: 'Download application' },
  ];

  /**
   * Sidebar collapse state. `fvdr-sidebar-nav` owns the responsive rules —
   * expanded on desktop, icon-only with a hover overlay on tablet, burger below
   * — this only mirrors the desktop toggle.
   */
  sidebarCollapsed = false;

  /**
   * Forces the nav to its 72px mode regardless of the user's own toggle. The host
   * sets it while the assistant is docked: 280 nav + 340 Quick access + 400 drawer
   * leaves the Documents table ~492px of the 588px it wants, so cells wrap and the
   * last column clips. Collapsing the nav returns ~700px and it fits again. The
   * user's manual state is preserved and restored when the drawer closes.
   */
  @Input() collapseNav = false;

  /** Two-letter mark for the project switcher badge, like the branded logo. */
  get projectMark(): string {
    const parts = this.projectName.trim().split(/\s+/).filter(Boolean);
    const raw = parts.length > 1 ? parts[0][0] + parts[1][0] : this.projectName.slice(0, 2);
    return raw.toUpperCase();
  }

  /**
   * Sidebar items and the breadcrumb for the active page. Rebuilt only when the
   * page changes: a getter would hand *ngFor a new array on every
   * change-detection pass, which tears the buttons down and back up and loses
   * their click handling. The copy is also mandatory because
   * `fvdr-sidebar-nav` writes `active`/`open` back onto the items it is given.
   */
  navItems: VdrNavItem[] = [];
  crumbs: BreadcrumbItem[] = [];

  /**
   * The pages are projected content, so the shell cannot bind to the Documents
   * page's output in a template — it picks the instance up as a content child
   * and forwards the event. Re-checked because the host swaps pages with
   * *ngSwitch, which destroys and recreates the instance.
   */
  @ContentChild(VdrDocumentsComponent) private documentsPage?: VdrDocumentsComponent;
  private wiredPage?: VdrDocumentsComponent;
  private askSub?: Subscription;

  ngOnInit(): void { this.sync(); }
  ngOnChanges(): void { this.sync(); }

  ngAfterContentChecked(): void {
    if (this.documentsPage === this.wiredPage) return;
    this.askSub?.unsubscribe();
    this.wiredPage = this.documentsPage;
    this.askSub = this.documentsPage?.askAiForFolder.subscribe(f => this.askAiForFolder.emit(f));
  }

  ngOnDestroy(): void { this.askSub?.unsubscribe(); }

  /**
   * Rebuild the sidebar for the current page: highlight the owning item, mark
   * the matching sub-item, and open that group. Groups the user opened by hand
   * stay open — their state is carried over by id.
   */
  private sync(): void {
    const activeNav = VDR_PAGES[this.page].nav;
    const wasOpen = new Map(this.navItems.map(item => [item.id, item.open]));

    this.navItems = VDR_NAV_ITEMS.map(item => {
      const active = item.id === activeNav;
      const children = item.children?.map(child => ({
        ...child,
        active: active && child.id === this.page,
      }));
      return {
        ...item,
        active,
        // Open the group holding the current page; otherwise keep what the user did.
        open: children ? (active ? true : wasOpen.get(item.id) ?? false) : undefined,
        children,
      };
    });

    this.crumbs = VDR_PAGES[this.page].breadcrumb.map((label, i) => ({ id: String(i), label }));
  }

  /**
   * Top-level item. Groups only expand and collapse — the DS component owns that
   * toggle and we add no navigation, matching Figma where the parent carries a
   * chevron and no page of its own. Leaf items navigate.
   */
  onNavItem(item: SidebarNavItem): void {
    const target = VDR_NAV_ITEMS.find(i => i.id === item.id);
    // A group only expands and collapses — it never navigates. Figma draws the
    // parent with a chevron and no page of its own, so a click that jumped to a
    // child would move the user somewhere they did not ask to go.
    if (target?.children?.length) return;
    if (target?.page) this.pageChange.emit(target.page);
    // Anything else is out of scope for the replica: re-sync so the DS
    // sidebar's own "clicked = active" write does not stick.
    else this.sync();
  }

  /** Sub-item ids are page ids; Settings' are not, so those stay inert. */
  onNavSubItem(event: { item: SidebarNavItem; subItem: SidebarNavSubItem }): void {
    if (isPageId(event.subItem.id)) this.pageChange.emit(event.subItem.id);
    else this.sync();
  }

  onHeaderAction(id: string): void {
    if (id === 'theme') this.themeToggle.emit();
  }
}
