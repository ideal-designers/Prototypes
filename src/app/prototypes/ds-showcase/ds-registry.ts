export interface TokenDoc {
  token: string;
  value: string;
  usage: string;
}

export interface AnatomyPart {
  index: number;
  part: string;
  spec: string;
}

export type ComponentCategory = 'controls' | 'display' | 'layout' | 'navigation' | 'feedback' | 'data';
export type ComponentStatus   = 'stable' | 'beta' | 'deprecated';

export interface ComponentDocEntry {
  id: string;
  name: string;
  selector: string;
  category: ComponentCategory;
  status: ComponentStatus;
  description: string;
  figmaNode?: string;
  whenToUse: string[];
  whenNotToUse: string[];
  anatomy: AnatomyPart[];
  tokens: TokenDoc[];
  usedIn: string[];
  codeSnippet: string;
  claudePrompt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// FULLY DOCUMENTED COMPONENTS (10)
// ─────────────────────────────────────────────────────────────────────────────

const button: ComponentDocEntry = {
  id: 'button',
  name: 'Button',
  selector: 'fvdr-btn',
  category: 'controls',
  status: 'stable',
  figmaNode: '15023-113844',
  description:
    'A clickable element that triggers an action. Supports 6 visual variants, 3 sizes, loading and disabled states.',
  whenToUse: [
    'Primary action on a form or dialog',
    'Destructive actions (use danger variant)',
    'Secondary/tertiary actions alongside a primary button',
    'Navigation-style actions (use link variant)',
  ],
  whenNotToUse: [
    'Navigation between pages (use a link/router-link instead)',
    'Toggling a state (use Toggle)',
    'Selecting from options (use Dropdown or Checkbox)',
  ],
  anatomy: [
    { index: 1, part: 'Container',        spec: 'height: 32/40/48px · border-radius: 4px · padding: 0 12/16px' },
    { index: 2, part: 'Icon (optional)',  spec: '16×16px · margin-right: 6px · fvdr-icon' },
    { index: 3, part: 'Label',            spec: 'font-size: 14/15/16px · font-weight: 400 · white-space: nowrap' },
    { index: 4, part: 'Spinner (loading)', spec: '16×16px circular animation · replaces icon' },
  ],
  tokens: [
    { token: '--color-interactive-primary', value: '#2c9c74', usage: 'Primary variant background' },
    { token: '--color-interactive-hover',   value: '#268a65', usage: 'Primary variant hover background' },
    { token: '--color-interactive-secondary', value: '#40424b', usage: 'Secondary variant background' },
    { token: '--color-danger',              value: '#e54430', usage: 'Danger variant background' },
    { token: '--color-danger-hover',        value: '#cc3926', usage: 'Danger variant hover background' },
    { token: '--color-text-inverse',        value: '#ffffff', usage: 'Label color on filled variants' },
    { token: '--color-border',              value: '#dee0eb', usage: 'Outline/ghost variant border' },
    { token: '--color-text-primary',        value: '#1f2129', usage: 'Label color on outline/ghost variants' },
    { token: '--color-text-disabled',       value: '#9b9da6', usage: 'Label color when disabled' },
    { token: '--btn-height-s',              value: '32px',    usage: 'Small size height' },
    { token: '--btn-height-m',              value: '40px',    usage: 'Medium size height (default)' },
    { token: '--btn-height-l',              value: '48px',    usage: 'Large size height' },
    { token: '--radius-sm',                 value: '4px',     usage: 'Button border-radius' },
    { token: '--font-size-base',            value: '14px',    usage: 'Label font-size (medium)' },
    { token: '--font-size-md',              value: '15px',    usage: 'Label font-size (large)' },
  ],
  usedIn: ['API Keys', 'Delete Account', 'Settings Integrations', 'Activity Log', 'Modals'],
  codeSnippet: `<!-- Primary button (medium, default) -->
<fvdr-btn variant="primary" size="m">Save changes</fvdr-btn>

<!-- Primary with leading icon -->
<fvdr-btn variant="primary" size="m" icon="plus">Add item</fvdr-btn>

<!-- Secondary button -->
<fvdr-btn variant="secondary" size="m">Cancel</fvdr-btn>

<!-- Danger / destructive -->
<fvdr-btn variant="danger" size="m">Delete account</fvdr-btn>

<!-- Outline -->
<fvdr-btn variant="outline" size="s">Export</fvdr-btn>

<!-- Ghost -->
<fvdr-btn variant="ghost" size="s">Learn more</fvdr-btn>

<!-- Link style -->
<fvdr-btn variant="link" size="m">View details</fvdr-btn>

<!-- Loading state -->
<fvdr-btn variant="primary" size="m" [loading]="isSaving">Save</fvdr-btn>

<!-- Disabled state -->
<fvdr-btn variant="primary" size="m" [disabled]="!form.valid">Submit</fvdr-btn>

<!-- Large size -->
<fvdr-btn variant="primary" size="l">Get started</fvdr-btn>`,
  claudePrompt:
    'Implement the fvdr-btn Angular component. Import path: @fvdr/ui/button. ' +
    '@Input() variant: "primary" | "secondary" | "danger" | "outline" | "ghost" | "link" = "primary". ' +
    '@Input() size: "s" | "m" | "l" = "m". ' +
    '@Input() icon?: string — name of an fvdr-icon to render on the left. ' +
    '@Input() loading: boolean = false — when true, replaces the leading icon with a 16px spinner and disables pointer events. ' +
    '@Input() disabled: boolean = false. ' +
    '@Output() clicked = new EventEmitter<void>(). ' +
    'Heights are controlled by CSS custom properties --btn-height-s (32px), --btn-height-m (40px), --btn-height-l (48px). ' +
    'Primary background uses --color-interactive-primary (#2c9c74) with hover state --color-interactive-hover (#268a65). ' +
    'Danger background uses --color-danger (#e54430) with hover --color-danger-hover (#cc3926). ' +
    'Label color on filled variants is --color-text-inverse (#ffffff); on outline/ghost it is --color-text-primary (#1f2129). ' +
    'Border-radius is --radius-sm (4px). Disabled state sets opacity 0.4 and cursor: not-allowed.',
};

// ─────────────────────────────────────────────────────────────────────────────

const badge: ComponentDocEntry = {
  id: 'badge',
  name: 'Badge',
  selector: 'fvdr-badge',
  category: 'display',
  status: 'stable',
  figmaNode: '15023-badge',
  description:
    'A small label used to highlight status, category, or count. Single size, 6 color variants.',
  whenToUse: [
    'Indicate status of a record (active, inactive, pending)',
    'Highlight a category or tag on a list item',
    'Display a numeric count (notifications, results)',
  ],
  whenNotToUse: [
    'Long text — badges are limited to 1–3 words or a short number',
    'Interactive selections — use Chip instead',
    'Progress indication — use Progress component',
  ],
  anatomy: [
    { index: 1, part: 'Container',   spec: 'padding: 2px 8px · border-radius: 9999px (full)' },
    { index: 2, part: 'Label text',  spec: 'font-size: 12px · font-weight: 600 · line-height: 16px' },
  ],
  tokens: [
    { token: '--color-interactive-primary', value: '#2c9c74', usage: 'Primary/success variant background tint' },
    { token: '--color-danger',              value: '#e54430', usage: 'Error variant background tint' },
    { token: '--color-text-primary',        value: '#1f2129', usage: 'Neutral variant label color' },
    { token: '--color-text-secondary',      value: '#5f616a', usage: 'Muted variant label color' },
    { token: '--color-feature-bg',          value: '#ebf4fd', usage: 'Info variant background' },
    { token: '--color-selected-row',        value: '#ebf8ef', usage: 'Success variant background tint' },
    { token: '--radius-full',               value: '9999px',  usage: 'Pill shape border-radius' },
    { token: '--font-size-xs',              value: '12px',    usage: 'Badge label font-size' },
  ],
  usedIn: ['Activity Log (user role)', 'Settings (status labels)', 'DS Showcase'],
  codeSnippet: `<!-- Default (primary/green) -->
<fvdr-badge variant="primary">Active</fvdr-badge>

<!-- Success -->
<fvdr-badge variant="success">Completed</fvdr-badge>

<!-- Error -->
<fvdr-badge variant="error">Failed</fvdr-badge>

<!-- Warning -->
<fvdr-badge variant="warning">Pending</fvdr-badge>

<!-- Info -->
<fvdr-badge variant="info">Draft</fvdr-badge>

<!-- Neutral -->
<fvdr-badge variant="neutral">Archived</fvdr-badge>

<!-- Numeric count -->
<fvdr-badge variant="primary">12</fvdr-badge>`,
  claudePrompt:
    'Implement the fvdr-badge Angular component. Import path: @fvdr/ui/badge. ' +
    '@Input() variant: "primary" | "success" | "error" | "warning" | "info" | "neutral" = "neutral". ' +
    'Content is projected via ng-content (text or number). ' +
    'Shape is always pill: border-radius uses --radius-full (9999px). ' +
    'Font-size is --font-size-xs (12px), font-weight 600. ' +
    'Each variant maps to a background tint and a matching text color defined as component-scoped CSS classes. ' +
    'No @Output() events — badge is display-only.',
};

// ─────────────────────────────────────────────────────────────────────────────

const avatar: ComponentDocEntry = {
  id: 'avatar',
  name: 'Avatar',
  selector: 'fvdr-avatar',
  category: 'display',
  status: 'stable',
  description:
    'Displays a user representation using an image or generated initials. Supports 4 sizes and an optional online-status indicator.',
  whenToUse: [
    'Identify a user in a list, comment, or activity feed',
    'Show the current user in a navigation header',
    'Represent participants in a conversation or meeting',
  ],
  whenNotToUse: [
    'Illustrating non-person entities (use an icon or logo instead)',
    'Large hero images (use a standard img element)',
  ],
  anatomy: [
    { index: 1, part: 'Circle container', spec: 'width/height: 24/32/40/48px · border-radius: 9999px' },
    { index: 2, part: 'Initials text',    spec: 'font-size scales with size · font-weight: 700 · centered' },
    { index: 3, part: 'Image (optional)', spec: 'object-fit: cover · fills container · replaces initials' },
  ],
  tokens: [
    { token: '--avatar-sm',               value: '24px',    usage: 'Small avatar diameter' },
    { token: '--avatar-md',               value: '32px',    usage: 'Medium avatar diameter (default)' },
    { token: '--avatar-lg',               value: '40px',    usage: 'Large avatar diameter' },
    { token: '--avatar-xl',               value: '48px',    usage: 'Extra-large avatar diameter' },
    { token: '--color-interactive-primary', value: '#2c9c74', usage: 'Default initials background color' },
    { token: '--color-text-inverse',      value: '#ffffff', usage: 'Initials text color on colored background' },
    { token: '--radius-full',             value: '9999px',  usage: 'Circle border-radius' },
  ],
  usedIn: ['Activity Log', 'Settings (team members)', 'Deal Room'],
  codeSnippet: `<!-- Initials only (medium, default) -->
<fvdr-avatar name="John Doe" size="md"></fvdr-avatar>

<!-- With image src -->
<fvdr-avatar name="Jane Smith" src="/assets/jane.jpg" size="lg"></fvdr-avatar>

<!-- Small, used in lists -->
<fvdr-avatar name="Alex B." size="sm"></fvdr-avatar>

<!-- Extra large, profile header -->
<fvdr-avatar name="Maria Garcia" src="/assets/maria.jpg" size="xl"></fvdr-avatar>

<!-- With online status indicator -->
<fvdr-avatar name="Bob K." size="md" [online]="true"></fvdr-avatar>`,
  claudePrompt:
    'Implement the fvdr-avatar Angular component. Import path: @fvdr/ui/avatar. ' +
    '@Input() name: string — required; used to derive up to 2-character initials (first letter of first and last word). ' +
    '@Input() src?: string — image URL; when provided the image is rendered with object-fit: cover and initials are hidden. ' +
    '@Input() size: "sm" | "md" | "lg" | "xl" = "md". ' +
    'Size maps to CSS custom properties: --avatar-sm (24px), --avatar-md (32px), --avatar-lg (40px), --avatar-xl (48px). ' +
    '@Input() online?: boolean — when true, renders a small green dot indicator at bottom-right of the circle. ' +
    'Background color for initials fallback uses --color-interactive-primary (#2c9c74). ' +
    'Initials text color is --color-text-inverse (#ffffff). Border-radius is --radius-full (9999px). ' +
    'If the image fails to load (error event), fall back to initials.',
};

// ─────────────────────────────────────────────────────────────────────────────

const input: ComponentDocEntry = {
  id: 'input',
  name: 'Input',
  selector: 'fvdr-input',
  category: 'controls',
  status: 'stable',
  description:
    'A single-line text field with label, helper text, optional icons, and validation states. Integrates with Angular Reactive Forms.',
  whenToUse: [
    'Collecting short, free-form text (name, email, title)',
    'Any form field that requires inline validation feedback',
    'Search or filter fields that need a leading icon',
  ],
  whenNotToUse: [
    'Multi-line text — use Textarea instead',
    'Structured data like phone numbers — use Phone Input',
    'Date/time selection — use Datepicker or Timepicker',
  ],
  anatomy: [
    { index: 1, part: 'Label',                  spec: 'font-size: 12px · font-weight: 600 · margin-bottom: 4px' },
    { index: 2, part: 'Container',              spec: 'height: 32/40/48px · border: 1px solid border-input · border-radius: 4px' },
    { index: 3, part: 'Left icon (optional)',   spec: '16×16px · margin: 0 8px' },
    { index: 4, part: 'Text value',             spec: 'font-size: 13/14/15px · flex: 1' },
    { index: 5, part: 'Right icon / state icon', spec: '16px · error=alert, success=check' },
    { index: 6, part: 'Helper / error text',    spec: 'font-size: 12px · margin-top: 4px' },
  ],
  tokens: [
    { token: '--color-border-input',    value: '#bbbdc8', usage: 'Default border color' },
    { token: '--color-interactive-primary', value: '#2c9c74', usage: 'Focused border color' },
    { token: '--color-danger',          value: '#e54430', usage: 'Error state border and icon color' },
    { token: '--color-text-primary',    value: '#1f2129', usage: 'Input value text color' },
    { token: '--color-text-placeholder', value: '#b0b3c0', usage: 'Placeholder text color' },
    { token: '--color-text-disabled',   value: '#9b9da6', usage: 'Disabled input text color' },
    { token: '--color-bg-surface',      value: '#f7f7f7', usage: 'Disabled input background' },
    { token: '--color-text-muted',      value: '#73757f', usage: 'Helper text color' },
    { token: '--font-size-xs',          value: '12px',    usage: 'Label and helper text size' },
    { token: '--font-size-sm',          value: '13px',    usage: 'Value text size (small input)' },
    { token: '--font-size-base',        value: '14px',    usage: 'Value text size (medium input)' },
    { token: '--radius-sm',             value: '4px',     usage: 'Input border-radius' },
  ],
  usedIn: ['API Keys (key name)', 'Settings (profile fields)', 'Deal Room (form fields)'],
  codeSnippet: `<!-- Basic labeled input -->
<fvdr-input
  label="API Key Name"
  placeholder="e.g. Production key"
  formControlName="keyName">
</fvdr-input>

<!-- With leading icon -->
<fvdr-input
  label="Email"
  placeholder="you@example.com"
  leftIcon="mail"
  formControlName="email">
</fvdr-input>

<!-- With helper text -->
<fvdr-input
  label="Webhook URL"
  placeholder="https://"
  helperText="We will POST events to this endpoint."
  formControlName="webhookUrl">
</fvdr-input>

<!-- Error state (driven by FormControl validity) -->
<fvdr-input
  label="Username"
  errorText="Username is already taken"
  [showError]="form.get('username')?.invalid && form.get('username')?.touched"
  formControlName="username">
</fvdr-input>

<!-- Disabled -->
<fvdr-input label="Account ID" [disabled]="true" [value]="accountId"></fvdr-input>`,
  claudePrompt:
    'Implement the fvdr-input Angular component. Import path: @fvdr/ui/input. ' +
    'Implements ControlValueAccessor for use with formControlName and ngModel. ' +
    '@Input() label?: string — rendered above the field at font-size 12px, font-weight 600. ' +
    '@Input() placeholder?: string. ' +
    '@Input() helperText?: string — displayed below in --color-text-muted at 12px when no error is shown. ' +
    '@Input() errorText?: string — displayed below in --color-danger at 12px when showError is true. ' +
    '@Input() showError: boolean = false — when true, switches border to --color-danger and shows errorText. ' +
    '@Input() leftIcon?: string — fvdr-icon name placed inside the left edge of the container. ' +
    '@Input() rightIcon?: string — fvdr-icon name placed inside the right edge. ' +
    '@Input() size: "s" | "m" | "l" = "m" — maps to heights 32/40/48px. ' +
    '@Input() disabled: boolean = false. ' +
    '@Output() valueChange = new EventEmitter<string>(). ' +
    'Focus state switches border to --color-interactive-primary (#2c9c74). ' +
    'Default border is --color-border-input (#bbbdc8). Border-radius is --radius-sm (4px).',
};

// ─────────────────────────────────────────────────────────────────────────────

const dropdown: ComponentDocEntry = {
  id: 'dropdown',
  name: 'Dropdown',
  selector: 'fvdr-dropdown',
  category: 'controls',
  status: 'stable',
  description:
    'A select-style control that opens a floating panel of options. Supports single selection, search filtering, and option groups.',
  whenToUse: [
    'Selecting one option from a list of 5 or more items',
    'When space is limited and an inline list would be too tall',
    'Filtering or scoping a view by a single dimension',
  ],
  whenNotToUse: [
    'Fewer than 4 options — use Radio buttons instead',
    'Multiple selections — use Multiselect',
    'Binary on/off — use Toggle',
  ],
  anatomy: [
    { index: 1, part: 'Trigger / selected display', spec: 'height: 40px · border: 1px · border-radius: 4px · padding: 0 12px' },
    { index: 2, part: 'Chevron icon',               spec: '16×16px · right: 12px · rotates 180° when open' },
    { index: 3, part: 'Floating panel',             spec: 'min-width: 100% · border-radius: 8px · shadow-popup · z-index: 200' },
    { index: 4, part: 'Search field (optional)',    spec: 'fvdr-input inside panel · margin: 8px · border-bottom' },
    { index: 5, part: 'Option item',                spec: 'height: 36px · padding: 0 12px · hover: color-hover-bg' },
    { index: 6, part: 'Selected check icon',        spec: '16px · right side · color-interactive-primary' },
  ],
  tokens: [
    { token: '--color-border-input',        value: '#bbbdc8', usage: 'Trigger border color' },
    { token: '--color-interactive-primary', value: '#2c9c74', usage: 'Focus ring and selected-check color' },
    { token: '--color-hover-bg',            value: '#eef0f8', usage: 'Option hover background' },
    { token: '--color-bg-page',             value: '#ffffff', usage: 'Floating panel background' },
    { token: '--color-text-primary',        value: '#1f2129', usage: 'Option label color' },
    { token: '--color-text-placeholder',    value: '#b0b3c0', usage: 'Trigger placeholder color' },
    { token: '--shadow-popup',              value: 'var(--shadow-popup)', usage: 'Floating panel elevation' },
    { token: '--radius-md',                 value: '8px',     usage: 'Floating panel border-radius' },
    { token: '--radius-sm',                 value: '4px',     usage: 'Trigger border-radius' },
  ],
  usedIn: ['Settings Integrations (provider select)', 'Activity Log (filter bar)', 'API Keys (scope select)'],
  codeSnippet: `<!-- Basic dropdown -->
<fvdr-dropdown
  label="Status"
  placeholder="Select status"
  [options]="statusOptions"
  formControlName="status">
</fvdr-dropdown>

<!-- With search -->
<fvdr-dropdown
  label="Country"
  placeholder="Select country"
  [options]="countryOptions"
  [searchable]="true"
  formControlName="country">
</fvdr-dropdown>

<!-- Disabled -->
<fvdr-dropdown
  label="Region"
  [options]="regionOptions"
  [disabled]="true"
  formControlName="region">
</fvdr-dropdown>

<!-- Options definition example -->
<!-- statusOptions = [
  { value: 'active',   label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'pending',  label: 'Pending' }
] -->`,
  claudePrompt:
    'Implement the fvdr-dropdown Angular component. Import path: @fvdr/ui/dropdown. ' +
    'Implements ControlValueAccessor. ' +
    '@Input() options: { value: string; label: string; disabled?: boolean }[] = []. ' +
    '@Input() label?: string. ' +
    '@Input() placeholder?: string = "Select…". ' +
    '@Input() searchable: boolean = false — when true renders an fvdr-input at the top of the panel for filtering. ' +
    '@Input() disabled: boolean = false. ' +
    '@Input() size: "s" | "m" = "m" — trigger height 32px / 40px. ' +
    '@Output() selectionChange = new EventEmitter<string>(). ' +
    'Panel opens below (or above when near viewport bottom) using absolute positioning with z-index 200. ' +
    'Panel background is --color-bg-page, border-radius --radius-md (8px), shadow --shadow-popup. ' +
    'Trigger border is --color-border-input (#bbbdc8), focus border --color-interactive-primary (#2c9c74). ' +
    'Option hover state uses --color-hover-bg (#eef0f8). ' +
    'Close panel on outside click using HostListener on document:click.',
};

// ─────────────────────────────────────────────────────────────────────────────

const toggle: ComponentDocEntry = {
  id: 'toggle',
  name: 'Toggle',
  selector: 'fvdr-toggle',
  category: 'controls',
  status: 'stable',
  description:
    'A binary on/off switch for boolean settings. Animates the thumb between states and supports a label on either side.',
  whenToUse: [
    'Enabling or disabling a feature or setting immediately on change',
    'Binary preferences where the effect is instant (no save required)',
    'Compact settings lists where a checkbox would feel too form-like',
  ],
  whenNotToUse: [
    'Choices that require a form submit to take effect — use Checkbox instead',
    'Selecting from multiple options — use Radio or Dropdown',
    'When the action is destructive — surface a confirmation dialog first',
  ],
  anatomy: [
    { index: 1, part: 'Track',       spec: 'width: 36px · height: 20px · border-radius: 9999px · background: interactive-primary when on' },
    { index: 2, part: 'Thumb',       spec: 'width: 16px · height: 16px · border-radius: 9999px · background: white · transition: 0.2s' },
    { index: 3, part: 'Label (optional)', spec: 'font-size: 14px · color: text-primary · margin-left: 8px' },
  ],
  tokens: [
    { token: '--color-interactive-primary', value: '#2c9c74', usage: 'Track color when checked' },
    { token: '--color-border',              value: '#dee0eb', usage: 'Track color when unchecked' },
    { token: '--color-text-primary',        value: '#1f2129', usage: 'Label text color' },
    { token: '--color-text-disabled',       value: '#9b9da6', usage: 'Label color when disabled' },
    { token: '--radius-full',               value: '9999px',  usage: 'Track and thumb border-radius' },
  ],
  usedIn: ['Settings Integrations (enable toggle)', 'Settings (notification toggles)'],
  codeSnippet: `<!-- Basic toggle -->
<fvdr-toggle label="Enable notifications" formControlName="notifications"></fvdr-toggle>

<!-- Checked by default -->
<fvdr-toggle label="Auto-sync" [checked]="true" (toggled)="onSync($event)"></fvdr-toggle>

<!-- Disabled -->
<fvdr-toggle label="Legacy mode" [disabled]="true" [checked]="false"></fvdr-toggle>

<!-- Label on the left -->
<fvdr-toggle label="Dark theme" labelPosition="left" formControlName="darkMode"></fvdr-toggle>`,
  claudePrompt:
    'Implement the fvdr-toggle Angular component. Import path: @fvdr/ui/toggle. ' +
    'Implements ControlValueAccessor for boolean values. ' +
    '@Input() label?: string — rendered next to the track. ' +
    '@Input() labelPosition: "left" | "right" = "right". ' +
    '@Input() checked: boolean = false. ' +
    '@Input() disabled: boolean = false. ' +
    '@Output() toggled = new EventEmitter<boolean>() — emits new state on each change. ' +
    'Track dimensions: 36×20px, border-radius --radius-full. ' +
    'Checked track color: --color-interactive-primary (#2c9c74); unchecked: --color-border (#dee0eb). ' +
    'Thumb is white, 16×16px, positioned left: 2px (off) or left: 18px (on), transition: transform 0.2s ease. ' +
    'Disabled: pointer-events none, opacity 0.4.',
};

// ─────────────────────────────────────────────────────────────────────────────

const checkbox: ComponentDocEntry = {
  id: 'checkbox',
  name: 'Checkbox',
  selector: 'fvdr-checkbox',
  category: 'controls',
  status: 'stable',
  description:
    'A binary input for selecting one or more independent options. Supports indeterminate state for parent checkboxes in tree structures.',
  whenToUse: [
    'Selecting multiple independent options from a list',
    'Agreeing to terms or confirming an action before submitting a form',
    'Representing a tree-select parent with partial child selection (indeterminate)',
  ],
  whenNotToUse: [
    'Mutually exclusive choices — use Radio instead',
    'Instant on/off settings that apply without a submit — use Toggle',
    'Single binary preference in a settings panel — use Toggle',
  ],
  anatomy: [
    { index: 1, part: 'Box',               spec: '16×16px · border: 1.5px solid border-input · border-radius: 4px' },
    { index: 2, part: 'Check icon',        spec: '10×10px centered · white · visible when checked' },
    { index: 3, part: 'Indeterminate bar', spec: '8×2px centered · white · visible in indeterminate state' },
    { index: 4, part: 'Label',             spec: 'font-size: 14px · color: text-primary · margin-left: 8px' },
  ],
  tokens: [
    { token: '--color-interactive-primary', value: '#2c9c74', usage: 'Box fill color when checked or indeterminate' },
    { token: '--color-border-input',        value: '#bbbdc8', usage: 'Box border when unchecked' },
    { token: '--color-text-inverse',        value: '#ffffff', usage: 'Check and indeterminate icon color' },
    { token: '--color-text-primary',        value: '#1f2129', usage: 'Label text color' },
    { token: '--color-text-disabled',       value: '#9b9da6', usage: 'Label and box color when disabled' },
    { token: '--radius-sm',                 value: '4px',     usage: 'Box border-radius' },
  ],
  usedIn: ['Activity Log (bulk select)', 'Settings (permission checkboxes)', 'Deal Room (item selection)'],
  codeSnippet: `<!-- Basic checkbox -->
<fvdr-checkbox label="I agree to the Terms of Service" formControlName="agree"></fvdr-checkbox>

<!-- Checked by default -->
<fvdr-checkbox label="Subscribe to updates" [checked]="true" (changed)="onSubscribe($event)"></fvdr-checkbox>

<!-- Indeterminate (partial selection) -->
<fvdr-checkbox label="Select all" [indeterminate]="someSelected" [checked]="allSelected" (changed)="toggleAll($event)"></fvdr-checkbox>

<!-- Disabled -->
<fvdr-checkbox label="Admin access" [disabled]="true" [checked]="false"></fvdr-checkbox>`,
  claudePrompt:
    'Implement the fvdr-checkbox Angular component. Import path: @fvdr/ui/checkbox. ' +
    'Implements ControlValueAccessor for boolean values. ' +
    '@Input() label?: string. ' +
    '@Input() checked: boolean = false. ' +
    '@Input() indeterminate: boolean = false — overrides checked display with a horizontal bar. ' +
    '@Input() disabled: boolean = false. ' +
    '@Output() changed = new EventEmitter<boolean>(). ' +
    'Box: 16×16px, border-radius --radius-sm (4px), border 1.5px solid --color-border-input (#bbbdc8). ' +
    'When checked or indeterminate, box fill is --color-interactive-primary (#2c9c74). ' +
    'Check icon and indeterminate bar are white (--color-text-inverse). ' +
    'Label at --font-size-base (14px), --color-text-primary. ' +
    'Disabled: pointer-events none, opacity 0.4.',
};

// ─────────────────────────────────────────────────────────────────────────────

const tabs: ComponentDocEntry = {
  id: 'tabs',
  name: 'Tabs',
  selector: 'fvdr-tabs',
  category: 'navigation',
  status: 'stable',
  description:
    'A horizontal navigation bar that switches the visible content panel. Supports icon labels, badges, and underline or pill style variants.',
  whenToUse: [
    'Switching between 2–7 related views within the same page context',
    'Organising settings sections (General, Security, Billing)',
    'Toggling between different presentations of the same data',
  ],
  whenNotToUse: [
    'More than 7 tabs — consider a sidebar navigation or dropdown',
    'Navigating between distinct page routes — use router links',
    'Wizard-style sequential steps — use a stepper component',
  ],
  anatomy: [
    { index: 1, part: 'Tab bar',          spec: 'display: flex · border-bottom: 1px solid border · gap: 0' },
    { index: 2, part: 'Tab item',         spec: 'height: 40px · padding: 0 16px · font-size: 14px · cursor: pointer' },
    { index: 3, part: 'Active indicator', spec: 'height: 2px · bottom: -1px · background: interactive-primary · border-radius: 2px 2px 0 0' },
    { index: 4, part: 'Badge (optional)', spec: 'fvdr-badge · margin-left: 6px · variant: neutral or primary' },
    { index: 5, part: 'Content panel',    spec: 'padding-top: 16px · ng-content projection per tab' },
  ],
  tokens: [
    { token: '--color-interactive-primary', value: '#2c9c74', usage: 'Active tab indicator and text color' },
    { token: '--color-border',              value: '#dee0eb', usage: 'Tab bar bottom border' },
    { token: '--color-text-primary',        value: '#1f2129', usage: 'Active tab label color' },
    { token: '--color-text-secondary',      value: '#5f616a', usage: 'Inactive tab label color' },
    { token: '--color-hover-bg',            value: '#eef0f8', usage: 'Tab item hover background' },
    { token: '--font-size-base',            value: '14px',    usage: 'Tab label font-size' },
  ],
  usedIn: ['Settings (General / Security / Billing tabs)', 'API Keys', 'DS Showcase'],
  codeSnippet: `<!-- Declarative tabs with projected content -->
<fvdr-tabs [activeTab]="activeTab" (tabChange)="activeTab = $event">
  <fvdr-tab id="general"  label="General">
    <app-general-settings></app-general-settings>
  </fvdr-tab>
  <fvdr-tab id="security" label="Security">
    <app-security-settings></app-security-settings>
  </fvdr-tab>
  <fvdr-tab id="billing"  label="Billing" [badge]="3">
    <app-billing></app-billing>
  </fvdr-tab>
</fvdr-tabs>

<!-- Data-driven tabs -->
<fvdr-tabs [tabs]="tabConfig" [(activeTab)]="currentTab"></fvdr-tabs>`,
  claudePrompt:
    'Implement the fvdr-tabs Angular component pair: fvdr-tabs (container) and fvdr-tab (panel). ' +
    'Import path: @fvdr/ui/tabs. ' +
    'fvdr-tabs @Input() activeTab: string — ID of the currently visible tab. ' +
    'fvdr-tabs @Output() tabChange = new EventEmitter<string>(). ' +
    'fvdr-tab @Input() id: string (required), @Input() label: string (required), @Input() badge?: number. ' +
    'The tab bar renders a flex row of tab items; the active item has a 2px bottom indicator using --color-interactive-primary (#2c9c74). ' +
    'Tab bar has a 1px bottom border using --color-border (#dee0eb). ' +
    'Inactive tab label: --color-text-secondary (#5f616a); active: --color-text-primary (#1f2129). ' +
    'Hover background: --color-hover-bg (#eef0f8). ' +
    'Only the active fvdr-tab panel is rendered (ngIf or hidden via CSS). ' +
    'If badge is provided on a tab, render fvdr-badge variant="neutral" next to the label.',
};

// ─────────────────────────────────────────────────────────────────────────────

const status: ComponentDocEntry = {
  id: 'status',
  name: 'Status',
  selector: 'fvdr-status',
  category: 'display',
  status: 'stable',
  description:
    'An inline dot-and-label indicator for operational states such as active, inactive, error, or pending. Lighter than a Badge for compact contexts.',
  whenToUse: [
    'Showing the live state of an integration or API key in a table row',
    'Indicating system health in a settings panel',
    'Compact status display in list items where a badge would be too prominent',
  ],
  whenNotToUse: [
    'When a count or category label is needed — use Badge instead',
    'Inside a button or navigation element',
  ],
  anatomy: [
    { index: 1, part: 'Dot',   spec: '8×8px · border-radius: 9999px · background: status color' },
    { index: 2, part: 'Label', spec: 'font-size: 13px · font-weight: 500 · color: text-primary · margin-left: 6px' },
  ],
  tokens: [
    { token: '--color-interactive-primary', value: '#2c9c74', usage: 'Active/success dot color' },
    { token: '--color-danger',              value: '#e54430', usage: 'Error dot color' },
    { token: '--color-text-muted',          value: '#73757f', usage: 'Inactive/unknown dot color' },
    { token: '--color-text-primary',        value: '#1f2129', usage: 'Label text color' },
    { token: '--font-size-sm',              value: '13px',    usage: 'Label font-size' },
    { token: '--radius-full',               value: '9999px',  usage: 'Dot border-radius' },
  ],
  usedIn: ['Settings Integrations (connection status)', 'API Keys (key status)', 'Activity Log'],
  codeSnippet: `<!-- Active -->
<fvdr-status state="active"   label="Active"></fvdr-status>

<!-- Inactive -->
<fvdr-status state="inactive" label="Inactive"></fvdr-status>

<!-- Error -->
<fvdr-status state="error"    label="Connection failed"></fvdr-status>

<!-- Pending -->
<fvdr-status state="pending"  label="Syncing..."></fvdr-status>

<!-- Warning -->
<fvdr-status state="warning"  label="Degraded"></fvdr-status>`,
  claudePrompt:
    'Implement the fvdr-status Angular component. Import path: @fvdr/ui/status. ' +
    '@Input() state: "active" | "inactive" | "error" | "warning" | "pending" — controls dot color. ' +
    '@Input() label?: string — text shown to the right of the dot. ' +
    'Dot: 8×8px circle (--radius-full), colors: active=#2c9c74, inactive=#bbbdc8, error=#e54430, warning=#f5a623, pending=#f5a623 (pulsing animation). ' +
    'Label: font-size --font-size-sm (13px), font-weight 500, color --color-text-primary. ' +
    'Component is display-only, no outputs.',
};

// ─────────────────────────────────────────────────────────────────────────────

const modal: ComponentDocEntry = {
  id: 'modal',
  name: 'Modal',
  selector: 'fvdr-modal',
  category: 'feedback',
  status: 'stable',
  description:
    'A blocking dialog overlay for confirmations, destructive actions, and focused data entry. Traps focus and dismisses on Escape or overlay click.',
  whenToUse: [
    'Confirming a destructive or irreversible action (delete, revoke)',
    'A focused form that requires user attention before continuing',
    'Displaying detail that requires user acknowledgement',
  ],
  whenNotToUse: [
    'Non-blocking notifications — use Toast instead',
    'Persistent side-panel content — use a slide-over or sidebar',
    'Simple one-line confirmations on mobile — use a native sheet',
  ],
  anatomy: [
    { index: 1, part: 'Overlay',          spec: 'position: fixed · inset: 0 · background: rgba(0,0,0,0.6)' },
    { index: 2, part: 'Dialog container', spec: 'max-width: 480px · border-radius: 8px · padding: 24px · shadow-modal' },
    { index: 3, part: 'Header',           spec: 'font-size: 18px · font-weight: 600 · margin-bottom: 8px' },
    { index: 4, part: 'Body',             spec: 'font-size: 14px · color: text-secondary · flex: 1' },
    { index: 5, part: 'Footer / actions', spec: 'display: flex · gap: 8px · justify-content: flex-end · margin-top: 24px' },
  ],
  tokens: [
    { token: '--shadow-modal',          value: 'var(--shadow-modal)', usage: 'Dialog container elevation' },
    { token: '--color-bg-page',         value: '#ffffff',             usage: 'Dialog container background' },
    { token: '--color-text-primary',    value: '#1f2129',             usage: 'Header text color' },
    { token: '--color-text-secondary',  value: '#5f616a',             usage: 'Body text color' },
    { token: '--color-danger',          value: '#e54430',             usage: 'Danger confirm button color' },
    { token: '--radius-md',             value: '8px',                 usage: 'Dialog container border-radius' },
    { token: '--space-6',               value: '24px',                usage: 'Dialog padding and footer margin-top' },
    { token: '--space-2',               value: '8px',                 usage: 'Footer gap between action buttons' },
  ],
  usedIn: ['Delete Account', 'API Keys (revoke confirmation)', 'Settings Integrations (disconnect dialog)'],
  codeSnippet: `<!-- Confirmation modal (template-driven) -->
<fvdr-modal
  [open]="showDeleteModal"
  title="Delete account"
  (closed)="showDeleteModal = false">

  <p>This will permanently delete your account and all associated data. This action cannot be undone.</p>

  <ng-container slot="footer">
    <fvdr-btn variant="ghost"  (clicked)="showDeleteModal = false">Cancel</fvdr-btn>
    <fvdr-btn variant="danger" (clicked)="onConfirmDelete()">Delete account</fvdr-btn>
  </ng-container>
</fvdr-modal>

<!-- Info modal -->
<fvdr-modal
  [open]="showInfoModal"
  title="About this feature"
  (closed)="showInfoModal = false">
  <p>Some helpful explanation text here.</p>
</fvdr-modal>`,
  claudePrompt:
    'Implement the fvdr-modal Angular component. Import path: @fvdr/ui/modal. ' +
    '@Input() open: boolean = false — controls visibility; use *ngIf or [class.open] with CSS transitions. ' +
    '@Input() title: string — rendered in the header at font-size 18px, font-weight 600. ' +
    '@Input() size: "sm" | "md" | "lg" = "md" — maps to max-width 360/480/640px. ' +
    '@Input() closeOnOverlayClick: boolean = true. ' +
    '@Output() closed = new EventEmitter<void>() — emits when Escape key or overlay is clicked. ' +
    'Overlay: position fixed, inset 0, background rgba(0,0,0,0.6), z-index 300. ' +
    'Dialog: background --color-bg-page (#ffffff), border-radius --radius-md (8px), padding 24px, shadow --shadow-modal. ' +
    'Body text: --color-text-secondary (#5f616a), font-size --font-size-base (14px). ' +
    'Footer (slot="footer"): flex row, gap 8px, justify-content flex-end, margin-top 24px. ' +
    'Implement focus trap using a FocusTrap service or cdkTrapFocus (Angular CDK). ' +
    'Restore focus to the trigger element on close.',
};

// ─────────────────────────────────────────────────────────────────────────────
// STUB ENTRIES (24)
// ─────────────────────────────────────────────────────────────────────────────

const textarea: ComponentDocEntry = {
  id: 'textarea',
  name: 'Textarea',
  selector: 'fvdr-textarea',
  category: 'controls',
  status: 'stable',
  description:
    'A multi-line text input with auto-grow support, character count, and validation states. Shares visual language with fvdr-input.',
  whenToUse: ['Collecting multi-line free-form text such as descriptions, notes, or messages.'],
  whenNotToUse: [],
  anatomy: [],
  tokens: [
    { token: '--color-border-input',        value: '#bbbdc8', usage: 'Default border color' },
    { token: '--color-interactive-primary', value: '#2c9c74', usage: 'Focus border color' },
    { token: '--color-danger',              value: '#e54430', usage: 'Error state border and helper text color' },
  ],
  usedIn: ['Deal Room', 'Settings (profile bio)'],
  codeSnippet: `<fvdr-textarea label="Description" placeholder="Enter description…" formControlName="description"></fvdr-textarea>`,
  claudePrompt: 'Use fvdr-textarea for multi-line text. Import: @fvdr/ui/textarea. Implements ControlValueAccessor. Shares token set with fvdr-input.',
};

const search: ComponentDocEntry = {
  id: 'search',
  name: 'Search',
  selector: 'fvdr-search',
  category: 'controls',
  status: 'stable',
  description:
    'A specialised input pre-configured with a search icon, clear button, and debounced output for filtering lists or data tables.',
  whenToUse: ['Filtering a list or table by a text query.'],
  whenNotToUse: [],
  anatomy: [],
  tokens: [
    { token: '--color-border-input',     value: '#bbbdc8', usage: 'Default border' },
    { token: '--color-text-placeholder', value: '#b0b3c0', usage: 'Placeholder color' },
    { token: '--color-text-muted',       value: '#73757f', usage: 'Search icon color' },
  ],
  usedIn: ['Activity Log', 'API Keys', 'Settings Integrations'],
  codeSnippet: `<fvdr-search placeholder="Search…" (queryChange)="onSearch($event)"></fvdr-search>`,
  claudePrompt: 'Use fvdr-search for list filtering. Import: @fvdr/ui/search. @Output() queryChange emits debounced string.',
};

const calendar: ComponentDocEntry = {
  id: 'calendar',
  name: 'Calendar',
  selector: 'fvdr-calendar',
  category: 'controls',
  status: 'stable',
  description:
    'A standalone month-grid calendar for selecting a single date or date range. Used internally by Datepicker.',
  whenToUse: ['Inline date selection when a popup datepicker would be too compact.'],
  whenNotToUse: [],
  anatomy: [],
  tokens: [
    { token: '--color-interactive-primary', value: '#2c9c74', usage: 'Selected day background' },
    { token: '--color-hover-bg',            value: '#eef0f8', usage: 'Day hover background' },
    { token: '--color-selected-row',        value: '#ebf8ef', usage: 'Range highlight background' },
  ],
  usedIn: ['Datepicker', 'Deal Room (date fields)'],
  codeSnippet: `<fvdr-calendar [(selectedDate)]="date"></fvdr-calendar>`,
  claudePrompt: 'Use fvdr-calendar for inline date selection. Import: @fvdr/ui/calendar. Two-way binding via [(selectedDate)].',
};

const datepicker: ComponentDocEntry = {
  id: 'datepicker',
  name: 'Datepicker',
  selector: 'fvdr-datepicker',
  category: 'controls',
  status: 'stable',
  description:
    'An input that opens a floating fvdr-calendar panel for date selection. Formats output using Angular DatePipe.',
  whenToUse: ['Collecting a date via a compact field that expands on demand.'],
  whenNotToUse: [],
  anatomy: [],
  tokens: [
    { token: '--color-border-input',        value: '#bbbdc8', usage: 'Trigger border' },
    { token: '--color-interactive-primary', value: '#2c9c74', usage: 'Selected date highlight' },
    { token: '--shadow-popup',              value: 'var(--shadow-popup)', usage: 'Calendar panel elevation' },
  ],
  usedIn: ['Deal Room', 'Activity Log (date filter)'],
  codeSnippet: `<fvdr-datepicker label="Due date" formControlName="dueDate"></fvdr-datepicker>`,
  claudePrompt: 'Use fvdr-datepicker for date fields. Import: @fvdr/ui/datepicker. Implements ControlValueAccessor. Opens fvdr-calendar in a popup.',
};

const timepicker: ComponentDocEntry = {
  id: 'timepicker',
  name: 'Timepicker',
  selector: 'fvdr-timepicker',
  category: 'controls',
  status: 'stable',
  description:
    'A time input that offers either a scroll-wheel panel or typed HH:MM entry with AM/PM toggle.',
  whenToUse: ['Collecting a time-of-day value in a scheduling or reminder form.'],
  whenNotToUse: [],
  anatomy: [],
  tokens: [
    { token: '--color-border-input',        value: '#bbbdc8', usage: 'Trigger border' },
    { token: '--color-interactive-primary', value: '#2c9c74', usage: 'Selected time highlight' },
    { token: '--shadow-popup',              value: 'var(--shadow-popup)', usage: 'Panel elevation' },
  ],
  usedIn: ['Deal Room', 'Settings (scheduled tasks)'],
  codeSnippet: `<fvdr-timepicker label="Reminder time" formControlName="reminderTime"></fvdr-timepicker>`,
  claudePrompt: 'Use fvdr-timepicker for time fields. Import: @fvdr/ui/timepicker. Implements ControlValueAccessor. Value is an HH:MM string.',
};

const phoneInput: ComponentDocEntry = {
  id: 'phone-input',
  name: 'Phone Input',
  selector: 'fvdr-phone-input',
  category: 'controls',
  status: 'stable',
  description:
    'A phone number field with a country-code prefix dropdown and automatic formatting as the user types.',
  whenToUse: ['Collecting an international phone number in a registration or contact form.'],
  whenNotToUse: [],
  anatomy: [],
  tokens: [
    { token: '--color-border-input',     value: '#bbbdc8', usage: 'Field border' },
    { token: '--color-text-placeholder', value: '#b0b3c0', usage: 'Placeholder color' },
    { token: '--color-hover-bg',         value: '#eef0f8', usage: 'Country-code option hover' },
  ],
  usedIn: ['Settings (profile)', 'Deal Room (contact fields)'],
  codeSnippet: `<fvdr-phone-input label="Phone" formControlName="phone"></fvdr-phone-input>`,
  claudePrompt: 'Use fvdr-phone-input for phone fields. Import: @fvdr/ui/phone-input. Implements ControlValueAccessor. Value is an E.164 formatted string.',
};

const textEditor: ComponentDocEntry = {
  id: 'text-editor',
  name: 'Text Editor',
  selector: 'fvdr-text-editor',
  category: 'controls',
  status: 'beta',
  description:
    'A rich-text editor with a minimal toolbar (bold, italic, lists, links). Outputs HTML or markdown depending on configuration.',
  whenToUse: ['Editing formatted content such as email templates, notes, or documentation.'],
  whenNotToUse: [],
  anatomy: [],
  tokens: [
    { token: '--color-border',              value: '#dee0eb', usage: 'Editor container border' },
    { token: '--color-interactive-primary', value: '#2c9c74', usage: 'Active toolbar button indicator' },
    { token: '--color-bg-surface',          value: '#f7f7f7', usage: 'Toolbar background' },
  ],
  usedIn: ['Deal Room (notes)', 'Settings (email templates)'],
  codeSnippet: `<fvdr-text-editor label="Notes" formControlName="notes" outputFormat="html"></fvdr-text-editor>`,
  claudePrompt: 'Use fvdr-text-editor for rich text. Import: @fvdr/ui/text-editor. Implements ControlValueAccessor. @Input() outputFormat: "html" | "markdown" = "html".',
};

const radio: ComponentDocEntry = {
  id: 'radio',
  name: 'Radio',
  selector: 'fvdr-radio',
  category: 'controls',
  status: 'stable',
  description:
    'A group of mutually exclusive options where exactly one can be selected at a time. Use fvdr-radio-group as the container.',
  whenToUse: ['Selecting exactly one option from 2–5 visible choices.'],
  whenNotToUse: [],
  anatomy: [],
  tokens: [
    { token: '--color-interactive-primary', value: '#2c9c74', usage: 'Selected radio button fill' },
    { token: '--color-border-input',        value: '#bbbdc8', usage: 'Unselected radio border' },
    { token: '--color-text-primary',        value: '#1f2129', usage: 'Option label color' },
  ],
  usedIn: ['Settings (role selection)', 'Deal Room (option pickers)'],
  codeSnippet: `<fvdr-radio-group label="Role" formControlName="role">
  <fvdr-radio value="admin"  label="Admin"></fvdr-radio>
  <fvdr-radio value="editor" label="Editor"></fvdr-radio>
  <fvdr-radio value="viewer" label="Viewer"></fvdr-radio>
</fvdr-radio-group>`,
  claudePrompt: 'Use fvdr-radio-group + fvdr-radio for mutually exclusive choices. Import: @fvdr/ui/radio. Group implements ControlValueAccessor.',
};

const segment: ComponentDocEntry = {
  id: 'segment',
  name: 'Segment',
  selector: 'fvdr-segment',
  category: 'controls',
  status: 'stable',
  description:
    'A compact button-group control for switching between 2–4 mutually exclusive options, rendered as a pill or boxed strip.',
  whenToUse: ['Switching between a small number of view modes or filter states inline.'],
  whenNotToUse: [],
  anatomy: [],
  tokens: [
    { token: '--color-interactive-primary', value: '#2c9c74', usage: 'Active segment background' },
    { token: '--color-border',              value: '#dee0eb', usage: 'Segment group border' },
    { token: '--color-text-primary',        value: '#1f2129', usage: 'Active segment label color' },
  ],
  usedIn: ['Activity Log (view toggle)', 'DS Showcase'],
  codeSnippet: `<fvdr-segment [options]="viewOptions" [(value)]="activeView"></fvdr-segment>`,
  claudePrompt: 'Use fvdr-segment for compact inline option switching. Import: @fvdr/ui/segment. @Input() options: {value:string; label:string}[]. Two-way [(value)].',
};

const chip: ComponentDocEntry = {
  id: 'chip',
  name: 'Chip',
  selector: 'fvdr-chip',
  category: 'controls',
  status: 'stable',
  description:
    'A removable or selectable tag-like element used in multiselect inputs and filter bars. Can display an avatar or icon prefix.',
  whenToUse: ['Representing selected items in a multiselect or tag-input field.'],
  whenNotToUse: [],
  anatomy: [],
  tokens: [
    { token: '--color-bg-surface',          value: '#f7f7f7', usage: 'Chip background' },
    { token: '--color-border',              value: '#dee0eb', usage: 'Chip border' },
    { token: '--color-interactive-primary', value: '#2c9c74', usage: 'Selected chip background tint' },
  ],
  usedIn: ['Multiselect', 'Activity Log (filter chips)'],
  codeSnippet: `<fvdr-chip label="Engineering" (removed)="removeTag('engineering')"></fvdr-chip>`,
  claudePrompt: 'Use fvdr-chip for tag/filter items. Import: @fvdr/ui/chip. @Input() label:string. @Output() removed emits void.',
};

const multiselect: ComponentDocEntry = {
  id: 'multiselect',
  name: 'Multiselect',
  selector: 'fvdr-multiselect',
  category: 'controls',
  status: 'stable',
  description:
    'A dropdown that allows selecting multiple options, displaying selections as fvdr-chip tokens inside the trigger.',
  whenToUse: ['Selecting multiple values from a predefined list.'],
  whenNotToUse: [],
  anatomy: [],
  tokens: [
    { token: '--color-border-input',        value: '#bbbdc8', usage: 'Trigger border' },
    { token: '--color-interactive-primary', value: '#2c9c74', usage: 'Selected item check and chip tint' },
    { token: '--color-hover-bg',            value: '#eef0f8', usage: 'Option item hover' },
  ],
  usedIn: ['Settings (permission groups)', 'Deal Room (tag assignment)'],
  codeSnippet: `<fvdr-multiselect label="Permissions" [options]="permissionOptions" formControlName="permissions"></fvdr-multiselect>`,
  claudePrompt: 'Use fvdr-multiselect for multi-value selects. Import: @fvdr/ui/multiselect. Implements ControlValueAccessor returning string[]. Renders fvdr-chip for each selection.',
};

const droplist: ComponentDocEntry = {
  id: 'droplist',
  name: 'Droplist',
  selector: 'fvdr-droplist',
  category: 'layout',
  status: 'stable',
  description:
    'A drag-and-drop sortable list container. Wraps Angular CDK DragDropModule with design-system styled handles and drop zones.',
  whenToUse: ['Reordering a list of items by drag and drop.'],
  whenNotToUse: [],
  anatomy: [],
  tokens: [
    { token: '--color-border',       value: '#dee0eb', usage: 'Drop zone placeholder border' },
    { token: '--color-selected-row', value: '#ebf8ef', usage: 'Dragged item placeholder highlight' },
    { token: '--color-hover-bg',     value: '#eef0f8', usage: 'Drag-over row background' },
  ],
  usedIn: ['Settings (column ordering)', 'Deal Room (pipeline stages)'],
  codeSnippet: `<fvdr-droplist [items]="stages" (orderChanged)="onReorder($event)"></fvdr-droplist>`,
  claudePrompt: 'Use fvdr-droplist for drag-and-drop lists. Import: @fvdr/ui/droplist. @Input() items:any[]. @Output() orderChanged emits reordered array.',
};

const counter: ComponentDocEntry = {
  id: 'counter',
  name: 'Counter',
  selector: 'fvdr-counter',
  category: 'display',
  status: 'stable',
  description:
    'An animated numeric display that counts up or down to a target value. Used for KPI cards and summary stats.',
  whenToUse: ['Highlighting a key metric on a dashboard or summary card.'],
  whenNotToUse: [],
  anatomy: [],
  tokens: [
    { token: '--color-text-primary',   value: '#1f2129', usage: 'Counter number color' },
    { token: '--font-size-lg',         value: '16px',    usage: 'Counter base font-size (scales up)' },
    { token: '--color-text-secondary', value: '#5f616a', usage: 'Counter label/unit color' },
  ],
  usedIn: ['Activity Log (summary row)', 'DS Showcase'],
  codeSnippet: `<fvdr-counter [value]="totalEvents" label="Events" unit="this month"></fvdr-counter>`,
  claudePrompt: 'Use fvdr-counter for animated KPI numbers. Import: @fvdr/ui/counter. @Input() value:number. @Input() label?:string. @Input() unit?:string.',
};

const inlineMessage: ComponentDocEntry = {
  id: 'inline-message',
  name: 'Inline Message',
  selector: 'fvdr-inline-message',
  category: 'feedback',
  status: 'stable',
  description:
    'A contextual feedback strip with an icon and text, rendered inline within a form or content area. Supports info, success, warning, and error variants.',
  whenToUse: ['Displaying contextual validation or guidance directly adjacent to the relevant UI.'],
  whenNotToUse: [],
  anatomy: [],
  tokens: [
    { token: '--color-danger',              value: '#e54430', usage: 'Error variant background tint and icon' },
    { token: '--color-interactive-primary', value: '#2c9c74', usage: 'Success variant icon' },
    { token: '--color-feature-bg',          value: '#ebf4fd', usage: 'Info variant background' },
  ],
  usedIn: ['API Keys (quota warning)', 'Settings (save confirmation)', 'Delete Account'],
  codeSnippet: `<fvdr-inline-message variant="error" message="This field is required."></fvdr-inline-message>`,
  claudePrompt: 'Use fvdr-inline-message for inline feedback. Import: @fvdr/ui/inline-message. @Input() variant: "info"|"success"|"warning"|"error". @Input() message:string.',
};

const infoBanner: ComponentDocEntry = {
  id: 'info-banner',
  name: 'Info Banner',
  selector: 'fvdr-info-banner',
  category: 'feedback',
  status: 'stable',
  description:
    'A full-width informational strip pinned to the top of a page or section. Used for trial notices, maintenance warnings, and system announcements.',
  whenToUse: ['Surfacing a persistent site-wide notice that all users must see.'],
  whenNotToUse: [],
  anatomy: [],
  tokens: [
    { token: '--color-feature-bg',          value: '#ebf4fd', usage: 'Info banner background' },
    { token: '--color-interactive-primary', value: '#2c9c74', usage: 'CTA link color' },
    { token: '--color-text-primary',        value: '#1f2129', usage: 'Banner text color' },
  ],
  usedIn: ['Activity Log (trial notice)', 'Settings (plan upgrade nudge)'],
  codeSnippet: `<fvdr-info-banner message="Your trial expires in 3 days." ctaLabel="Upgrade" (ctaClicked)="openUpgrade()"></fvdr-info-banner>`,
  claudePrompt: 'Use fvdr-info-banner for top-of-page notices. Import: @fvdr/ui/info-banner. @Input() message:string. @Input() ctaLabel?:string. @Output() ctaClicked.',
};

const toast: ComponentDocEntry = {
  id: 'toast',
  name: 'Toast',
  selector: 'fvdr-toast',
  category: 'feedback',
  status: 'stable',
  description:
    'A non-blocking notification that appears at a corner of the screen and auto-dismisses. Injected programmatically via ToastService.',
  whenToUse: ['Confirming a completed action (saved, copied, deleted) without blocking the UI.'],
  whenNotToUse: [],
  anatomy: [],
  tokens: [
    { token: '--color-interactive-secondary', value: '#40424b', usage: 'Default toast background' },
    { token: '--color-text-inverse',          value: '#ffffff', usage: 'Toast text color' },
    { token: '--shadow-card',                 value: 'var(--shadow-card)', usage: 'Toast elevation' },
  ],
  usedIn: ['API Keys (copy key)', 'Settings (save)', 'Delete Account'],
  codeSnippet: `// In a component
this.toast.show({ message: 'Changes saved.', variant: 'success', duration: 3000 });`,
  claudePrompt: 'Use ToastService to show toasts. Import: @fvdr/ui/toast. toastService.show({ message, variant:"success"|"error"|"info"|"warning", duration:number }).',
};

const table: ComponentDocEntry = {
  id: 'table',
  name: 'Table',
  selector: 'fvdr-table',
  category: 'data',
  status: 'stable',
  description:
    'A data table with sortable columns, row selection checkboxes, pagination, and optional row actions menu. Consumes a column definition array.',
  whenToUse: ['Displaying structured tabular data with sort and pagination controls.'],
  whenNotToUse: [],
  anatomy: [],
  tokens: [
    { token: '--color-border',        value: '#dee0eb', usage: 'Row divider and header border' },
    { token: '--color-selected-row',  value: '#ebf8ef', usage: 'Selected row background' },
    { token: '--color-hover-bg',      value: '#eef0f8', usage: 'Row hover background' },
  ],
  usedIn: ['Activity Log', 'API Keys', 'Settings Integrations'],
  codeSnippet: `<fvdr-table [columns]="columns" [rows]="data" [selectable]="true" (rowSelected)="onSelect($event)"></fvdr-table>`,
  claudePrompt: 'Use fvdr-table for data grids. Import: @fvdr/ui/table. @Input() columns: ColumnDef[]. @Input() rows: any[]. @Output() rowSelected. @Output() sortChanged.',
};

const tree: ComponentDocEntry = {
  id: 'tree',
  name: 'Tree',
  selector: 'fvdr-tree',
  category: 'data',
  status: 'stable',
  description:
    'A hierarchical tree view with expand/collapse nodes, checkboxes for multi-selection, and lazy-loading support.',
  whenToUse: ['Navigating or selecting from a nested hierarchical data structure.'],
  whenNotToUse: [],
  anatomy: [],
  tokens: [
    { token: '--color-hover-bg',            value: '#eef0f8', usage: 'Node hover background' },
    { token: '--color-interactive-primary', value: '#2c9c74', usage: 'Selected node indicator' },
    { token: '--color-border',              value: '#dee0eb', usage: 'Tree connector lines' },
  ],
  usedIn: ['Settings (permission tree)', 'Deal Room (folder structure)'],
  codeSnippet: `<fvdr-tree [nodes]="treeData" [selectable]="true" (nodeSelected)="onNodeSelect($event)"></fvdr-tree>`,
  claudePrompt: 'Use fvdr-tree for hierarchical data. Import: @fvdr/ui/tree. @Input() nodes: TreeNode[]. @Output() nodeSelected emits TreeNode.',
};

const dropArea: ComponentDocEntry = {
  id: 'drop-area',
  name: 'Drop Area',
  selector: 'fvdr-drop-area',
  category: 'controls',
  status: 'stable',
  description:
    'A file upload zone that accepts drag-and-drop and click-to-browse interactions. Displays file previews and upload progress.',
  whenToUse: ['Collecting file uploads in a form with visual drag-and-drop affordance.'],
  whenNotToUse: [],
  anatomy: [],
  tokens: [
    { token: '--color-border',              value: '#dee0eb', usage: 'Drop zone dashed border' },
    { token: '--color-interactive-primary', value: '#2c9c74', usage: 'Drag-over active border and icon' },
    { token: '--color-bg-surface',          value: '#f7f7f7', usage: 'Drop zone background' },
  ],
  usedIn: ['Settings (logo upload)', 'Deal Room (attachment upload)'],
  codeSnippet: `<fvdr-drop-area accept="image/*" [multiple]="false" (filesSelected)="onFiles($event)"></fvdr-drop-area>`,
  claudePrompt: 'Use fvdr-drop-area for file uploads. Import: @fvdr/ui/drop-area. @Input() accept:string. @Input() multiple:boolean. @Output() filesSelected emits FileList.',
};

const numberStepper: ComponentDocEntry = {
  id: 'number-stepper',
  name: 'Number Stepper',
  selector: 'fvdr-number-stepper',
  category: 'controls',
  status: 'stable',
  description:
    'A numeric input with increment and decrement buttons. Supports min, max, and step constraints.',
  whenToUse: ['Adjusting a bounded numeric value such as quantity, duration, or seat count.'],
  whenNotToUse: [],
  anatomy: [],
  tokens: [
    { token: '--color-border-input',        value: '#bbbdc8', usage: 'Input border' },
    { token: '--color-interactive-primary', value: '#2c9c74', usage: 'Stepper button icon color' },
    { token: '--color-hover-bg',            value: '#eef0f8', usage: 'Stepper button hover background' },
  ],
  usedIn: ['Settings (seat count)', 'Deal Room (quantity fields)'],
  codeSnippet: `<fvdr-number-stepper label="Seats" [min]="1" [max]="100" [step]="1" formControlName="seats"></fvdr-number-stepper>`,
  claudePrompt: 'Use fvdr-number-stepper for bounded numeric input. Import: @fvdr/ui/number-stepper. Implements ControlValueAccessor. @Input() min, max, step:number.',
};

const range: ComponentDocEntry = {
  id: 'range',
  name: 'Range',
  selector: 'fvdr-range',
  category: 'controls',
  status: 'stable',
  description:
    'A slider for selecting a value or range within defined bounds. Supports single-thumb and dual-thumb (range) modes.',
  whenToUse: ['Selecting a value from a continuous numeric range like price, volume, or zoom level.'],
  whenNotToUse: [],
  anatomy: [],
  tokens: [
    { token: '--color-interactive-primary', value: '#2c9c74', usage: 'Track fill and thumb color' },
    { token: '--color-border',              value: '#dee0eb', usage: 'Track background (unfilled)' },
    { token: '--color-bg-page',             value: '#ffffff', usage: 'Thumb inner color' },
  ],
  usedIn: ['Settings (volume/threshold sliders)', 'DS Showcase'],
  codeSnippet: `<fvdr-range label="Budget" [min]="0" [max]="10000" [step]="100" formControlName="budget"></fvdr-range>`,
  claudePrompt: 'Use fvdr-range for sliders. Import: @fvdr/ui/range. Implements ControlValueAccessor. @Input() min, max, step. @Input() mode: "single"|"range" = "single".',
};

const progress: ComponentDocEntry = {
  id: 'progress',
  name: 'Progress',
  selector: 'fvdr-progress',
  category: 'feedback',
  status: 'stable',
  description:
    'A horizontal progress bar for deterministic operations. Supports labelled percentage, striped animation for indeterminate state, and success/error colour variants.',
  whenToUse: ['Visualising the completion percentage of a multi-step operation or file upload.'],
  whenNotToUse: [],
  anatomy: [],
  tokens: [
    { token: '--color-interactive-primary', value: '#2c9c74', usage: 'Progress fill color (default)' },
    { token: '--color-danger',              value: '#e54430', usage: 'Error state fill color' },
    { token: '--color-bg-surface',          value: '#f7f7f7', usage: 'Track background color' },
  ],
  usedIn: ['Deal Room (upload progress)', 'Settings (onboarding checklist)'],
  codeSnippet: `<fvdr-progress [value]="uploadProgress" [showLabel]="true"></fvdr-progress>`,
  claudePrompt: 'Use fvdr-progress for progress bars. Import: @fvdr/ui/progress. @Input() value: number 0-100. @Input() variant: "default"|"success"|"error". @Input() showLabel:boolean.',
};

const sidebarNav: ComponentDocEntry = {
  id: 'sidebar-nav',
  name: 'Sidebar Nav',
  selector: 'fvdr-sidebar-nav',
  category: 'navigation',
  status: 'stable',
  figmaNode: '22845-6992',
  description:
    'App-level left sidebar navigation. Supports three product variants (VDR / CA / Internal), an account-switcher header with project name, collapsible sub-items, and an icon-only collapsed mode (280 → 72 px). The bottom bar holds the ideals. logo and a toggle button.',
  whenToUse: [
    'Main navigation in any VDR, CA, or Internal application screen',
    'When you need collapsible sub-sections (Documents → sub-folders)',
    'When the app needs a persistent left rail that can be collapsed to save space',
  ],
  whenNotToUse: [
    'Secondary in-page navigation — use Tabs instead',
    'Short option lists — use Dropdown or Segment',
    'Mobile layouts — use a bottom navigation bar or drawer',
  ],
  anatomy: [
    { index: 1, part: 'Account switcher',  spec: 'height: 64px · project badge (40px) + name + chevron-down' },
    { index: 2, part: 'Nav item',          spec: 'height: 40px · icon zone 56px + label · optional chevron-down for groups' },
    { index: 3, part: 'Sub-items',         spec: 'height: 40px · indent: 56px · font-size: 13px' },
    { index: 4, part: 'Bottom bar',        spec: 'height: 64px · ideals. logo + collapse button' },
  ],
  tokens: [
    { token: '--color-stone-100',            value: '#f7f7f7', usage: 'Sidebar background (all zones)' },
    { token: '--color-divider',              value: '#dee0eb', usage: 'Right border + section separators' },
    { token: '--color-interactive-primary',  value: '#2c9c74', usage: 'Active nav item icon color' },
    { token: '--color-primary-50',           value: '#ebf8ef', usage: 'Active nav item row background' },
    { token: '--color-hover-bg',             value: '#eceef9', usage: 'Hover row background' },
    { token: '--color-text-primary',         value: '#1f2129', usage: 'Active label color' },
    { token: '--color-text-secondary',       value: '#5f616a', usage: 'Inactive label and icon color' },
  ],
  usedIn: ['VDR Deal Room', 'Corporate Account', 'Internal Admin'],
  codeSnippet: `<fvdr-sidebar-nav
  variant="vdr"
  accountName="Project Alpha"
  [items]="navItems"
  [(collapsed)]="sidebarCollapsed"
  (itemClick)="onNavItem($event)"
  (subItemClick)="onSubNav($event)"
  (accountClick)="openProjectSwitcher()"
/>`,
  claudePrompt:
    'Use fvdr-sidebar-nav for the app left navigation rail. Import: @fvdr/ui/sidebar-nav. ' +
    '@Input() variant: "vdr"|"ca"|"internal" — controls the account-badge accent color. ' +
    '@Input() accountName: string — displayed project/account name. ' +
    '@Input() items: SidebarNavItem[] — each item: { id, label, icon, iconActive, active?, open?, children?: SidebarNavSubItem[] }. ' +
    '@Input() collapsed: boolean — two-way binding via [(collapsed)]. Width: 280px expanded, 72px collapsed. ' +
    '@Output() itemClick emits SidebarNavItem. @Output() subItemClick emits { item, subItem }. @Output() accountClick emits void.',
};

const quickAccessMenu: ComponentDocEntry = {
  id: 'quick-access-menu',
  name: 'Quick Access Menu',
  selector: 'fvdr-quick-access-menu',
  category: 'navigation',
  status: 'stable',
  figmaNode: '36673-1987',
  description:
    'A collapsible shortcut panel placed alongside the sidebar. Displays a labeled header with expand/close controls and a vertical list of shortcut items (Recent, Favorites, New, Notes). Active item is highlighted with a green tint; hover uses a blue-gray tint.',
  whenToUse: [
    'Provide quick access to frequently used sections (Recent, Favorites) inside the document workspace',
    'When the user needs a persistent, dismissible filter panel on the left of the content area',
  ],
  whenNotToUse: [
    'Primary app navigation — use Sidebar Nav instead',
    'More than 6–8 shortcut items — consider grouping with Tabs',
  ],
  anatomy: [
    { index: 1, part: 'Header',     spec: 'height: 48px · bg stone-200 · title 14px/600 + action icons' },
    { index: 2, part: 'Item row',   spec: 'height: 40px · px-16 py-10 · 16px icon + 14px label' },
    { index: 3, part: 'Active row', spec: 'bg: #ebf8ef (primary-50) · icon color: primary-500' },
    { index: 4, part: 'Hover row',  spec: 'bg: #eceef9 (hover-bg)' },
  ],
  tokens: [
    { token: '--color-stone-200',           value: '#f7f7f7', usage: 'Header background' },
    { token: '--color-primary-50',          value: '#ebf8ef', usage: 'Active item row background' },
    { token: '--color-hover-bg',            value: '#eceef9', usage: 'Hover item row background' },
    { token: '--color-text-primary',        value: '#1f2129', usage: 'Item label color' },
    { token: '--color-text-secondary',      value: '#5f616a', usage: 'Item icon color (inactive)' },
    { token: '--color-primary-500',         value: '#2c9c74', usage: 'Active item icon color' },
  ],
  usedIn: ['Deal Room (Documents panel)', 'Quick Access Panel prototype'],
  codeSnippet: `<fvdr-quick-access-menu
  [items]="shortcuts"
  [(collapsed)]="menuCollapsed"
  (itemClick)="onShortcut($event)"
  (closed)="menuVisible = false"
/>`,
  claudePrompt:
    'Use fvdr-quick-access-menu for a collapsible shortcut panel. Import: @fvdr/ui/quick-access-menu. ' +
    '@Input() items: QuickAccessItem[] — each: { id, label, icon: FvdrIconName, active? }. ' +
    'Default items: Recent (clock), Favorites (sort), New (upload), Notes (file-text). ' +
    '@Input() collapsed: boolean — two-way via [(collapsed)]. ' +
    '@Output() itemClick emits QuickAccessItem. @Output() closed emits void. ' +
    'Panel width: 340px expanded, auto when collapsed (icon-only header). ' +
    'Active item: bg #ebf8ef, icon color primary-500. Hover: bg #eceef9.',
};

const fileIcon: ComponentDocEntry = {
  id: 'file-icon',
  name: 'File Icon',
  selector: 'fvdr-file-icon',
  category: 'display',
  status: 'stable',
  description:
    'A color-coded file-type icon derived from a file extension or MIME type. Covers 20+ common types including PDF, XLSX, DOCX, PNG, and MP4.',
  whenToUse: ['Representing a file attachment or asset in a list or card.'],
  whenNotToUse: [],
  anatomy: [],
  tokens: [
    { token: '--color-text-primary',   value: '#1f2129', usage: 'Generic file icon fallback color' },
    { token: '--color-feature-bg',     value: '#ebf4fd', usage: 'Icon container background (info tint)' },
    { token: '--color-danger',         value: '#e54430', usage: 'PDF icon accent color' },
  ],
  usedIn: ['Deal Room (attachments)', 'Activity Log (file events)', 'Settings (export files)'],
  codeSnippet: `<fvdr-file-icon extension="pdf" size="md"></fvdr-file-icon>
<fvdr-file-icon extension="xlsx" size="lg"></fvdr-file-icon>
<fvdr-file-icon mimeType="image/png" size="sm"></fvdr-file-icon>`,
  claudePrompt: 'Use fvdr-file-icon to represent file types. Import: @fvdr/ui/file-icon. @Input() extension?:string. @Input() mimeType?:string. @Input() size:"sm"|"md"|"lg"="md".',
};

// ─────────────────────────────────────────────────────────────────────────────
// REGISTRY EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export const DS_REGISTRY: ComponentDocEntry[] = [
  // Fully documented
  button,
  badge,
  avatar,
  input,
  dropdown,
  toggle,
  checkbox,
  tabs,
  status,
  modal,
  // Stubs
  textarea,
  search,
  calendar,
  datepicker,
  timepicker,
  phoneInput,
  textEditor,
  radio,
  segment,
  chip,
  multiselect,
  droplist,
  counter,
  inlineMessage,
  infoBanner,
  toast,
  table,
  tree,
  dropArea,
  numberStepper,
  range,
  progress,
  sidebarNav,
  quickAccessMenu,
  fileIcon,
];

export const DS_CATEGORIES: { id: ComponentCategory; label: string }[] = [
  { id: 'controls',   label: 'Controls'   },
  { id: 'display',    label: 'Display'    },
  { id: 'feedback',   label: 'Feedback'   },
  { id: 'navigation', label: 'Navigation' },
  { id: 'layout',     label: 'Layout'     },
  { id: 'data',       label: 'Data'       },
];
