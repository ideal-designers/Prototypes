import { FvdrIconName } from '../../../../shared/ds';

/**
 * Real-product IA for the VDR replica pages.
 *
 * Source: `.design/real-product-spec.md` (captured by walking
 * app.idealsvdr.com/project/5/test_2_g5r8d, viewport 1512x770).
 *
 * The live rail is 72px and icon-only; sub-navigation is NOT in the rail, it
 * shows up as breadcrumb + page tabs. So a "page" here is a leaf (Documents ›
 * All, Reports › Activity log), and each page declares which rail item owns it.
 */

/** Every replica page the assistant can be opened on top of. */
export type VdrPageId =
  | 'dashboard'
  | 'documents'
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

/** Rail sections, in live product order. */
export type VdrRailId =
  | 'dashboard'
  | 'documents'
  | 'dd-checklist'
  | 'participants'
  | 'permissions'
  | 'qna'
  | 'reports'
  | 'settings'
  | 'archiving'
  | 'recycle-bin';

export interface VdrRailItem {
  id: VdrRailId;
  /** Tooltip only — the live rail never shows labels. */
  label: string;
  icon: FvdrIconName;
  /** Page opened when the rail item is clicked. Omitted = inert (out of scope). */
  page?: VdrPageId;
}

export interface VdrPageMeta {
  id: VdrPageId;
  /** Rail item highlighted while this page is open. */
  rail: VdrRailId;
  /** Top-bar breadcrumb, parents first, last segment is the current page. */
  breadcrumb: string[];
}

/**
 * Rail, top to bottom. `settings` is present because the live rail has it, but
 * the Settings pages are deliberately out of scope for this replica, so it has
 * no `page` and clicking it does nothing.
 */
export const VDR_RAIL_ITEMS: VdrRailItem[] = [
  { id: 'dashboard',    label: 'Dashboard',               icon: 'nav-overview',    page: 'dashboard' },
  { id: 'documents',    label: 'Documents',               icon: 'documents',       page: 'documents' },
  { id: 'dd-checklist', label: 'Due diligence checklist', icon: 'nav-checklist',   page: 'dd-checklist' },
  { id: 'participants', label: 'Participants',            icon: 'users-groups',    page: 'participants' },
  { id: 'permissions',  label: 'Permissions',             icon: 'nav-permissions', page: 'permissions' },
  { id: 'qna',          label: 'Q&A',                     icon: 'nav-qa',          page: 'qna' },
  { id: 'reports',      label: 'Reports',                 icon: 'nav-reports',     page: 'activity-log' },
  { id: 'settings',     label: 'Settings',                icon: 'nav-settings' },
  { id: 'archiving',    label: 'Project archiving',       icon: 'nav-archiving',   page: 'archiving' },
  { id: 'recycle-bin',  label: 'Recycle bin',             icon: 'recycle-bin',     page: 'recycle-bin' },
];

export const VDR_PAGES: Record<VdrPageId, VdrPageMeta> = {
  'dashboard':          { id: 'dashboard',          rail: 'dashboard',    breadcrumb: ['Dashboard'] },
  'documents':          { id: 'documents',          rail: 'documents',    breadcrumb: ['Documents', 'All'] },
  'notes':              { id: 'notes',              rail: 'documents',    breadcrumb: ['Documents', 'Notes'] },
  // Live label is "External links", even though the route says shared-links.
  'shared-links':       { id: 'shared-links',       rail: 'documents',    breadcrumb: ['Documents', 'External links'] },
  'signatures':         { id: 'signatures',         rail: 'documents',    breadcrumb: ['Documents', 'Signatures'] },
  'recent':             { id: 'recent',             rail: 'documents',    breadcrumb: ['Documents', 'Recently viewed'] },
  'uploads':            { id: 'uploads',            rail: 'documents',    breadcrumb: ['Documents', 'Newly uploaded'] },
  'favorites':          { id: 'favorites',          rail: 'documents',    breadcrumb: ['Documents', 'Favorites'] },
  'dd-checklist':       { id: 'dd-checklist',       rail: 'dd-checklist', breadcrumb: ['Due diligence checklist'] },
  'participants':       { id: 'participants',       rail: 'participants', breadcrumb: ['Participants'] },
  'permissions':        { id: 'permissions',        rail: 'permissions',  breadcrumb: ['Permissions', 'Documents'] },
  'qna':                { id: 'qna',                rail: 'qna',          breadcrumb: ['Q&A', 'Setup'] },
  'activity-log':       { id: 'activity-log',       rail: 'reports',      breadcrumb: ['Reports', 'Activity log'] },
  'documents-overview': { id: 'documents-overview', rail: 'reports',      breadcrumb: ['Reports', 'Documents overview'] },
  'engagement-matrix':  { id: 'engagement-matrix',  rail: 'reports',      breadcrumb: ['Reports', 'Engagement matrix'] },
  'data-storage':       { id: 'data-storage',       rail: 'reports',      breadcrumb: ['Reports', 'Data storage'] },
  // Live label is "Permissions log"; `permissions` is the rail page (Permissions › Documents).
  'permissions-log':    { id: 'permissions-log',    rail: 'reports',      breadcrumb: ['Reports', 'Permissions log'] },
  'subscriptions':      { id: 'subscriptions',      rail: 'reports',      breadcrumb: ['Reports', 'Subscriptions'] },
  'archiving':          { id: 'archiving',          rail: 'archiving',    breadcrumb: ['Project archiving'] },
  'recycle-bin':        { id: 'recycle-bin',        rail: 'recycle-bin',  breadcrumb: ['Recycle bin'] },
};

/**
 * Page tabs shown under the top bar for rail sections that have siblings —
 * the live product's sub-navigation. Sections absent from this map show no tabs.
 */
export const VDR_PAGE_TABS: Partial<Record<VdrRailId, { id: VdrPageId; label: string }[]>> = {
  documents: [
    { id: 'documents', label: 'All' },
    { id: 'notes', label: 'Notes' },
    { id: 'shared-links', label: 'External links' },
    { id: 'signatures', label: 'Signatures' },
    { id: 'recent', label: 'Recently viewed' },
    { id: 'uploads', label: 'Newly uploaded' },
    { id: 'favorites', label: 'Favorites' },
  ],
  reports: [
    { id: 'activity-log', label: 'Activity log' },
    { id: 'documents-overview', label: 'Documents overview' },
    { id: 'engagement-matrix', label: 'Engagement matrix' },
    { id: 'data-storage', label: 'Data storage' },
    { id: 'permissions-log', label: 'Permissions log' },
    { id: 'subscriptions', label: 'Subscriptions' },
  ],
};

/** Rail item that owns a page (used to tint the rail icon). */
export function railIdFor(page: VdrPageId): VdrRailId {
  return VDR_PAGES[page].rail;
}
