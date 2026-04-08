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
    title: 'Deal Room Dashboard',
    figma: 'https://www.figma.com/design/liyNDiFf1piO8SQmHNKoeU?node-id=1042:12890',
    status: 'wip',
    description: 'Active deals overview with quick actions',
  },
    {
    slug: 'ca-settings-integrations',
    title: 'CA Settings — Integrations',
    figma: 'https://www.figma.com/design/PITzEfwRA26GWSG2MvzmDy/CA?node-id=42295-69802',
    status: 'wip',
    description: 'Corporate account settings integrations management',
  },
    {
    slug: 'project-archive-creation-flow-testing',
    title: 'Project Archive Creation flow - testing',
    figma: 'https://www.figma.com/design/t98iZowGc1YrR0oXTHxqxD/%F0%9F%97%84%EF%B8%8F-Project-archiving?node-id=1829-45793&t=ymjV1qud5eDd1EDh-4',
    status: 'wip',
    description: 'Project archiving flow - side by side UI',
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
    status: 'wip',
    description: '',
  },
  // REGISTRY_PLACEHOLDER
];
