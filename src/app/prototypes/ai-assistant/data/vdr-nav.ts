import { SidebarNavItem } from '../../../shared/ds';

/**
 * Canonical VDR left-nav set, shared by every shell so the product chrome is
 * identical on the AI page and the Documents page.
 *
 * Item list, labels, order and sub-items follow the FVDR shell reference
 * (`ca-settings-integrations`) and the fullest `variant="vdr"` prototypes
 * (`project-archive-creation-flow-testing`, `quick-access-panel`).
 *
 * Returns a fresh array each call — `fvdr-sidebar-nav` mutates `open`/`active`.
 */
export function vdrNavItems(activeId: string): SidebarNavItem[] {
  const items: SidebarNavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'nav-overview', iconActive: 'nav-overview-active' },
    { id: 'documents', label: 'Documents', icon: 'nav-projects', iconActive: 'nav-projects-active' },
    { id: 'ai', label: 'AI Assistant', icon: 'ideon-default', iconActive: 'ideon' },
    { id: 'participants', label: 'Participants', icon: 'nav-participants', iconActive: 'nav-participants-active' },
    { id: 'permissions', label: 'Permissions', icon: 'nav-permissions', iconActive: 'nav-permissions-active' },
    { id: 'qa', label: 'Q&A', icon: 'nav-qa', iconActive: 'nav-qa-active' },
    {
      id: 'reports', label: 'Reports', icon: 'nav-reports', iconActive: 'nav-reports-active',
      children: [
        { id: 'activity-log', label: 'Activity log' },
        { id: 'docs-overview', label: 'Documents overview' },
      ],
    },
    {
      id: 'settings', label: 'Settings', icon: 'nav-settings', iconActive: 'nav-settings-active',
      children: [
        { id: 'general', label: 'General' },
        { id: 'integrations', label: 'Integrations' },
      ],
    },
    { id: 'archiving', label: 'Project archiving', icon: 'nav-archiving', iconActive: 'nav-archiving-active' },
    { id: 'recycle', label: 'Recycle bin', icon: 'recycle-bin', iconActive: 'recycle-bin-active' },
  ];

  return items.map(item => (item.id === activeId ? { ...item, active: true } : item));
}
