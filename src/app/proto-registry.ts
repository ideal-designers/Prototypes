export interface ProtoMeta {
  slug: string;
  title: string;
  figma?: string;
  status: 'wip' | 'live' | 'archived';
  description?: string;
}

// This array is managed by scripts/new-proto.js
// DO NOT edit manually — run the script to add entries
export const PROTO_REGISTRY: ProtoMeta[] = [
  {
    slug: 'deal-room',
    title: 'Deal Room',
    status: 'wip',
    description: 'Deal room workspace prototype',
  },
  {
    slug: 'project-archive-creation-flow-testing',
    title: 'Project Archive Creation Flow',
    status: 'wip',
    description: 'Project archive creation and flow testing',
  },
    {
    slug: 'ca-settings-integrations',
    title: 'CA Settings — Integrations',
    figma: 'https://www.figma.com/design/PITzEfwRA26GWSG2MvzmDy/CA?node-id=42295-69802',
    status: 'wip',
    description: 'Corporate account settings integrations management',
  },
  {
    slug: 'my-prototype-delete-account',
    title: 'Delete Account',
    figma: 'https://www.figma.com/design/AqRFFFTOA4hCIvyhr4Ri54/User-account?node-id=28336-4315',
    status: 'wip',
    description: 'Self-service account deletion flow to reduce support load',
  },
  {
    slug: 'insights-activity-log',
    title: 'Activity Log',
    figma: 'https://www.figma.com/design/fChBFcd7WAfqxq73sduKrn/%E2%9C%A8-Insights?node-id=33310-85229',
    status: 'wip',
    description: 'Activity report prototype — browsing user events with filters, file tree, and detail panel',
  },
  {
    slug: 'ca-create-api-key',
    title: 'CA — Create API Key',
    figma: 'https://www.figma.com/design/PITzEfwRA26GWSG2MvzmDy/CA?node-id=33212-45471',
    status: 'wip',
    description: 'Multi-step flow for creating a new API key in Corporate Account',
  },
    {
    slug: 'quick-access-panel',
    title: 'Quick access panel',
    figma: 'https://www.figma.com/design/h9MR3O7N3kLV2xl2MGQDxs/Documents?node-id=22560-22984',
    status: 'live',
    description: 'Resizable quick access panel with folder tree and document table',
  },
  {
    slug: 'permission-search',
    title: 'Permission Search',
    figma: 'https://www.figma.com/design/E2LJ0seWC3c1bJrgenukSS/Permissions-%F0%9F%94%90?node-id=1479-27778',
    status: 'wip',
    description: 'Search filters the folder/document tree in real time with match highlighting',
  },
  {
    slug: 'terms-of-use-create',
    title: 'Terms of Use — Create/Edit',
    figma: 'https://www.figma.com/design/h9MR3O7N3kLV2xl2MGQDxs/Documents?node-id=22587-34046',
    status: 'wip',
    description: 'Create and edit Terms of Use with file-level targeting, group warnings, and content upload/paste modes',
  },
  {
    slug: 'view-as-mode',
    title: 'View as mode',
    figma: 'https://www.figma.com/design/h9MR3O7N3kLV2xl2MGQDxs/Documents',
    status: 'wip',
    description: 'Preview the Documents page as a specific bidder — green banner, highlighted rows, and an auto-dismissing Download popover with a pie timer',
  },
  {
    slug: 'timezone-picker',
    title: 'Timezone Picker',
    status: 'live',
    description: 'Timezone selector built on fvdr-dropdown — auto-detect, live clock, alias search, UTC offsets',
  },
  // REGISTRY_PLACEHOLDER
];
