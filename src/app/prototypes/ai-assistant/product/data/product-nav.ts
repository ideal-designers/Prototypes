import { SidebarNavItem } from '../../../../shared/ds';

/**
 * Real-product IA for the VDR replica pages.
 *
 * Source: the FVDR design system's left menu (Figma `liyNDiFf1piO8SQmHNKoeU`,
 * node 36673-1986, "Left menu in FVDR"), which `fvdr-sidebar-nav`
 * `variant="vdr"` implements.
 *
 * The sidebar is expanded with labels by default (280px) and carries the
 * sub-navigation as expandable sub-items; 72px icon-only is the same
 * component's collapsed mode, not a second design. So a "page" here is a leaf
 * (Documents › All, Reports › Activity log) reached either from a top-level nav
 * item or from one of its sub-items.
 */

/** Every replica page the assistant can be opened on top of. */
export type VdrPageId =
  | 'dashboard'
  | 'documents'
  | 'ai'
  | 'notes'
  | 'shared-links'
  | 'signatures'
  | 'recent'
  | 'uploads'
  | 'favorites'
  | 'dd-checklist'
  | 'participants'
  | 'permissions'
  | 'qna'
  | 'activity-log'
  | 'documents-overview'
  | 'engagement-matrix'
  | 'data-storage'
  | 'permissions-log'
  | 'subscriptions'
  | 'archiving'
  | 'recycle-bin';

/** Top-level sidebar items, in live product order. */
export type VdrNavId =
  | 'dashboard'
  | 'documents'
  | 'ai'
  | 'dd-checklist'
  | 'participants'
  | 'permissions'
  | 'qna'
  | 'reports'
  | 'settings'
  | 'archiving'
  | 'recycle-bin';

/**
 * `SidebarNavItem` plus the page the item opens. Sub-item ids *are* page ids, so
 * `(subItemClick)` hands the shell the page directly; a sub-item whose id is not
 * a page (Settings) is inert.
 */
export interface VdrNavItem extends SidebarNavItem {
  id: VdrNavId;
  /** Page opened when a childless item is clicked. Parents with children only toggle. */
  page?: VdrPageId;
}

export interface VdrPageMeta {
  id: VdrPageId;
  /** Top-level sidebar item highlighted while this page is open. */
  nav: VdrNavId;
  /** Top-bar breadcrumb, parents first, last segment is the current page. */
  breadcrumb: string[];
}

/**
 * The sidebar, top to bottom. Passed straight to `fvdr-sidebar-nav` — the shell
 * copies it per render because the component writes `active`/`open` back.
 *
 * Settings keeps its two sub-items so the group reads complete, but the Settings
 * pages are deliberately out of scope for this replica, so neither the parent
 * nor its sub-items resolve to a page: clicking them only opens the group.
 * Documents › Recently viewed / Newly uploaded / Favorites are not here either —
 * in the live product those are reached from the Quick access pane, which is
 * where the replica navigates them from too.
 */
export const VDR_NAV_ITEMS: VdrNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'nav-overview', iconActive: 'nav-overview-active', page: 'dashboard' },
  {
    id: 'documents', label: 'Documents', icon: 'documents', iconActive: 'documents-active',
    children: [
      { id: 'documents', label: 'All' },
      { id: 'notes', label: 'Notes' },
      { id: 'shared-links', label: 'External links' },
      { id: 'signatures', label: 'Signatures' },
    ],
  },
  // The Ideon mark carries its own gradient, so it declares an explicit active
  // glyph instead of taking the active tint the other icons get.
  { id: 'ai', label: 'AI Assistant', icon: 'ideon-default', iconActive: 'ideon', page: 'ai' },
  // The DS icon set has no active variant for the checklist glyph.
  { id: 'dd-checklist', label: 'Due diligence checklist', icon: 'nav-checklist', iconActive: 'nav-checklist', page: 'dd-checklist' },
  { id: 'participants', label: 'Participants', icon: 'users-groups', iconActive: 'users-groups-active', page: 'participants' },
  { id: 'permissions', label: 'Permissions', icon: 'nav-permissions', iconActive: 'nav-permissions-active', page: 'permissions' },
  { id: 'qna', label: 'Q&A', icon: 'nav-qa', iconActive: 'nav-qa-active', page: 'qna' },
  {
    id: 'reports', label: 'Reports', icon: 'nav-reports', iconActive: 'nav-reports-active',
    children: [
      { id: 'activity-log', label: 'Activity log' },
      { id: 'documents-overview', label: 'Documents overview' },
      { id: 'engagement-matrix', label: 'Engagement matrix' },
      { id: 'data-storage', label: 'Data storage' },
      { id: 'permissions-log', label: 'Permissions log' },
      { id: 'subscriptions', label: 'Subscriptions' },
    ],
  },
  {
    id: 'settings', label: 'Settings', icon: 'nav-settings', iconActive: 'nav-settings-active',
    children: [
      { id: 'settings-personal', label: 'Personal' },
      { id: 'settings-project', label: 'Project' },
    ],
  },
  { id: 'archiving', label: 'Project archiving', icon: 'nav-archiving', iconActive: 'nav-archiving-active', page: 'archiving' },
  { id: 'recycle-bin', label: 'Recycle bin', icon: 'recycle-bin', iconActive: 'recycle-bin-active', page: 'recycle-bin' },
];

export const VDR_PAGES: Record<VdrPageId, VdrPageMeta> = {
  'dashboard':          { id: 'dashboard',          nav: 'dashboard',    breadcrumb: ['Dashboard'] },
  'documents':          { id: 'documents',          nav: 'documents',    breadcrumb: ['Documents', 'All'] },
  // Full-page assistant — a product page like any other.
  'ai':                 { id: 'ai',                 nav: 'ai',           breadcrumb: ['AI Assistant'] },
  'notes':              { id: 'notes',              nav: 'documents',    breadcrumb: ['Documents', 'Notes'] },
  // Live label is "External links", even though the route says shared-links.
  'shared-links':       { id: 'shared-links',       nav: 'documents',    breadcrumb: ['Documents', 'External links'] },
  'signatures':         { id: 'signatures',         nav: 'documents',    breadcrumb: ['Documents', 'Signatures'] },
  // Quick-access pages: no sidebar sub-item, reached from the Quick access pane.
  'recent':             { id: 'recent',             nav: 'documents',    breadcrumb: ['Documents', 'Recently viewed'] },
  'uploads':            { id: 'uploads',            nav: 'documents',    breadcrumb: ['Documents', 'Newly uploaded'] },
  'favorites':          { id: 'favorites',          nav: 'documents',    breadcrumb: ['Documents', 'Favorites'] },
  'dd-checklist':       { id: 'dd-checklist',       nav: 'dd-checklist', breadcrumb: ['Due diligence checklist'] },
  'participants':       { id: 'participants',       nav: 'participants', breadcrumb: ['Participants'] },
  'permissions':        { id: 'permissions',        nav: 'permissions',  breadcrumb: ['Permissions', 'Documents'] },
  'qna':                { id: 'qna',                nav: 'qna',          breadcrumb: ['Q&A', 'Setup'] },
  'activity-log':       { id: 'activity-log',       nav: 'reports',      breadcrumb: ['Reports', 'Activity log'] },
  'documents-overview': { id: 'documents-overview', nav: 'reports',      breadcrumb: ['Reports', 'Documents overview'] },
  'engagement-matrix':  { id: 'engagement-matrix',  nav: 'reports',      breadcrumb: ['Reports', 'Engagement matrix'] },
  'data-storage':       { id: 'data-storage',       nav: 'reports',      breadcrumb: ['Reports', 'Data storage'] },
  // Live label is "Permissions log"; `permissions` is the top-level page.
  'permissions-log':    { id: 'permissions-log',    nav: 'reports',      breadcrumb: ['Reports', 'Permissions log'] },
  'subscriptions':      { id: 'subscriptions',      nav: 'reports',      breadcrumb: ['Reports', 'Subscriptions'] },
  'archiving':          { id: 'archiving',          nav: 'archiving',    breadcrumb: ['Project archiving'] },
  'recycle-bin':        { id: 'recycle-bin',        nav: 'recycle-bin',  breadcrumb: ['Recycle bin'] },
};

/** Top-level sidebar item that owns a page (used to highlight it). */
export function navIdFor(page: VdrPageId): VdrNavId {
  return VDR_PAGES[page].nav;
}

/** True when a sidebar sub-item id is one of the replica's pages. */
export function isPageId(id: string): id is VdrPageId {
  return id in VDR_PAGES;
}
