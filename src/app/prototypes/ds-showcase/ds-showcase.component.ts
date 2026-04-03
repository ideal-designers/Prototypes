import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DS_COMPONENTS, ToastService } from '../../shared/ds';
import { TrackerService } from '../../services/tracker.service';
import { DsDocBlockComponent, DsCategoryComponent } from './doc-block.component';
import type {
  TabItem, DroplistItem, DropdownOption, RadioOption,
  SearchFilter, SegmentItem, TableColumn, TreeNode,
  HeaderNavItem, HeaderAction,
} from '../../shared/ds';

/**
 * DS Showcase — all FVDR Design System components on one page
 * Route: /ds
 */
@Component({
  selector: 'app-ds-showcase',
  standalone: true,
  imports: [CommonModule, FormsModule, DsDocBlockComponent, DsCategoryComponent, ...DS_COMPONENTS],
  template: `
    <fvdr-toast-host />

    <div class="showcase">

      <!-- ── Sidebar ── -->
      <nav class="showcase__nav">
        <div class="showcase__nav-logo">
          <span class="nav-logo-text">FVDR DS</span>
        </div>
        <ng-container *ngFor="let cat of navCategories">
          <div class="nav-group__label">{{ cat.label }}</div>
          <a *ngFor="let link of cat.links" class="showcase__nav-link" href="javascript:void(0)" (click)="scrollTo(link.id)">{{ link.label }}</a>
        </ng-container>
      </nav>

      <!-- ── Main ── -->
      <main class="showcase__main">

        <!-- Hero -->
        <div class="showcase__hero">
          <h1 class="showcase__h1">FVDR Design System</h1>
          <p class="showcase__subtitle">A practical guide to FVDR components — what they are, when to use them, and AI prompts to generate them. · <a href="https://www.figma.com/design/liyNDiFf1piO8SQmHNKoeU" target="_blank">Open in Figma ↗</a></p>
          <div class="showcase__stats">
            <span class="showcase__stat"><b>36</b> components</span>
            <span class="showcase__stat"><b>51</b> icons</span>
            <span class="showcase__stat"><b>3</b> token layers</span>
          </div>
        </div>

        <!-- ════════════════════════════════════════
             ACTION
        ════════════════════════════════════════ -->
        <ds-category id="cat-action" label="Action" description="Interactive elements that let users trigger operations, toggle states, or initiate workflows.">

          <ds-doc-block
            id="buttons"
            name="Button"
            description="The primary mechanism for user-initiated actions. Communicates intent through label, variant, and optional icons."
            figmaNode="15023-113844"
            [whenToUse]="['Submitting forms', 'Triggering dialogs or modals', 'Primary call-to-action on a page', 'Confirming or canceling operations', 'Any user-initiated action causing a state change']"
            [whenNotToUse]="['Navigation to another page — use a Link instead', 'More than one primary button per section — dilutes hierarchy', 'Vague labels like &quot;Click here&quot; — describe the outcome']"
            aiPrompt="Generate an Angular fvdr-btn component with variants (primary, secondary, ghost, danger), sizes (s, m, l), loading spinner state, disabled state, and optional leading icon. Use design tokens for colors, spacing, and border-radius. Emit (clicked) event.">
            <div class="preview-col">
              <div class="row wrap">
                <fvdr-btn label="Primary" variant="primary" />
                <fvdr-btn label="Secondary" variant="secondary" />
                <fvdr-btn label="Ghost" variant="ghost" />
                <fvdr-btn label="Danger" variant="danger" />
              </div>
              <div class="row wrap">
                <fvdr-btn label="Small" variant="primary" size="s" />
                <fvdr-btn label="Medium" variant="primary" size="m" />
                <fvdr-btn label="Large" variant="primary" size="l" />
              </div>
              <div class="row wrap">
                <fvdr-btn label="Loading..." variant="primary" [loading]="true" />
                <fvdr-btn label="Disabled" variant="primary" [disabled]="true" />
              </div>
            </div>
          </ds-doc-block>

          <ds-doc-block
            id="segment"
            name="Segment Controls"
            description="A set of connected button tabs for switching between views or filter modes within a panel."
            figmaNode="18667-538"
            [whenToUse]="['View switching (list/grid)', 'Filter modes within a panel', 'Small tab-like selections (2–5 items)']"
            [whenNotToUse]="['More than 5 options — use Tabs or Dropdown', 'Items with separate routes — use Tabs', 'Full-page navigation']"
            aiPrompt="Generate an Angular fvdr-segment component with items array {id, label, disabled?} and activeId two-way binding. Render as a connected button group with active highlight. Emit activeIdChange on selection. Use design tokens for border and active background.">
            <div class="col" style="gap: 12px;">
              <fvdr-segment [items]="segItems" [(activeId)]="segActive" />
              <fvdr-segment [items]="segItems4" [(activeId)]="segActive4" />
            </div>
          </ds-doc-block>

        </ds-category>

        <!-- ════════════════════════════════════════
             FORM
        ════════════════════════════════════════ -->
        <ds-category id="cat-form" label="Form" description="Input components for collecting, validating, and submitting user data.">

          <ds-doc-block
            id="inputs"
            name="Text Field"
            description="A single-line input for collecting typed user data with label, validation states, and optional leading icon."
            figmaNode="15032-12127"
            [whenToUse]="['Collecting short text input', 'Email, password, or name fields', 'Search queries within forms', 'Any single-line text data entry']"
            [whenNotToUse]="['Multi-line content — use Textarea', 'Date or time selection — use Date/Time Picker', 'Choosing from a fixed set — use Dropdown or Radio']"
            aiPrompt="Generate an Angular fvdr-input ControlValueAccessor with label, placeholder, helperText, errorText, state (default/success/error/disabled), sizes (s/m/l), and optional leading icon (FvdrIconName). Integrate with Angular reactive forms. Use design tokens for all visual properties.">
            <div class="col" style="max-width: 380px; gap: 12px; width: 100%;">
              <fvdr-input label="Default" placeholder="Enter value..." />
              <fvdr-input label="With icon" placeholder="Search..." iconLeft="search" />
              <fvdr-input label="Error state" placeholder="Email" state="error" errorText="Invalid email address" />
              <fvdr-input label="Success state" placeholder="Username" state="success" helperText="Username is available" />
              <fvdr-input label="Disabled" placeholder="Can't edit" state="disabled" />
            </div>
          </ds-doc-block>

          <ds-doc-block
            id="textarea"
            name="Textarea"
            description="A multi-line text input for longer content like descriptions, comments, or notes."
            figmaNode="15032-12204"
            [whenToUse]="['Collecting multi-line text', 'Comments, feedback, or free-form descriptions', 'Notes with significant length']"
            [whenNotToUse]="['Short single-line inputs — use Text Field', 'Structured or formatted data entry', 'Rich text with formatting — use Text Editor']"
            aiPrompt="Generate an Angular fvdr-textarea ControlValueAccessor with label, placeholder, errorText, state (default/error/disabled), and optional maxlength with character counter. Vertical resize only. Integrate with reactive forms.">
            <div class="col" style="max-width: 380px; gap: 12px; width: 100%;">
              <fvdr-textarea label="Description" placeholder="Enter description..." />
              <fvdr-textarea label="With counter" placeholder="Max 200 chars" [maxlength]="200" />
              <fvdr-textarea label="Error" state="error" errorText="Required field" />
            </div>
          </ds-doc-block>

          <ds-doc-block
            id="search"
            name="Search"
            description="A specialized text input optimized for search queries with optional filter chips and filter button."
            figmaNode="15032-12166"
            [whenToUse]="['Filtering large data sets or lists', 'Global search across the application', 'Quick lookup within a section']"
            [whenNotToUse]="['Form fields collecting structured user data', 'Complex queries with many parameters — use a filter panel']"
            aiPrompt="Generate an Angular fvdr-search component with placeholder, optional filters array {id, label, active}, showFilterBtn toggle, and debounced valueChange event. Show a clear button when input has value. Emit filterToggle when a chip is clicked.">
            <div class="col" style="max-width: 380px; gap: 12px; width: 100%;">
              <fvdr-search placeholder="Search users..." />
              <fvdr-search placeholder="Search with filters..." [filters]="searchFilters" (filterToggle)="toggleFilter($event)" />
              <fvdr-search placeholder="Search + filter btn" [showFilterBtn]="true" />
            </div>
          </ds-doc-block>

          <ds-doc-block
            id="datepicker"
            name="Date Picker"
            description="A calendar-based input for selecting a single date or a date range via a dropdown panel."
            figmaNode="15032-12231"
            [whenToUse]="['Scheduling events or deadlines', 'Date-of-birth or expiry date inputs', 'Date range selection for reports or filters']"
            [whenNotToUse]="['Time selection — use Time Picker', 'Year-only or month-only selection — use a simple select', 'Always-visible calendars — use Calendar (inline)']"
            aiPrompt="Generate an Angular fvdr-datepicker ControlValueAccessor with label, placeholder, single date mode, and rangeMode with rangeStart/rangeEnd bindings. Open a calendar panel on focus. Format display value as DD.MM.YYYY. Integrate with reactive forms.">
            <div class="row wrap" style="gap: 24px; align-items: flex-start; width: 100%;">
              <div style="width: 220px;"><fvdr-datepicker label="Single date" [(ngModel)]="selectedDate" /></div>
              <div style="width: 260px;"><fvdr-datepicker label="Date range" [rangeMode]="true" [(rangeStart)]="rangeStart" [(rangeEnd)]="rangeEnd" /></div>
            </div>
          </ds-doc-block>

          <ds-doc-block
            id="calendar"
            name="Calendar (inline)"
            description="An always-visible month grid for date or range selection, embedded directly in a page or panel."
            figmaNode="15032-12446"
            [whenToUse]="['Scheduling interfaces where the calendar is the primary focus', 'Date range pickers in filter sidebars', 'When the date context should always be visible']"
            [whenNotToUse]="['Form fields where space is limited — use Date Picker dropdown', 'Date-only annotation on existing content']"
            aiPrompt="Generate an Angular fvdr-calendar component with selected date binding, rangeMode with rangeStart/rangeEnd, month navigation, and today highlight. Render a 7-column grid of days. Emit selectedChange, rangeStartChange, rangeEndChange.">
            <div class="row wrap" style="gap: 24px; align-items: flex-start;">
              <fvdr-calendar [(selected)]="calDate" />
              <fvdr-calendar [rangeMode]="true" [(rangeStart)]="rangeStart" [(rangeEnd)]="rangeEnd" />
            </div>
          </ds-doc-block>

          <ds-doc-block
            id="timepicker"
            name="Time Picker"
            description="A dropdown for selecting time in 15-minute increments. Supports 12h/24h formats and UTC suffix display."
            figmaNode="5590-26501"
            [whenToUse]="['Scheduling events or setting start/end times', 'Meeting time selection', 'Time-based configuration inputs']"
            [whenNotToUse]="['Duration input — use Number Stepper', 'Date selection — use Date Picker', 'Free-form time entry (use a plain text field with mask)']"
            aiPrompt="Generate an Angular fvdr-timepicker ControlValueAccessor with label, hint, errorMessage, size (s/m/l), format (12h/24h), utc boolean, step (minutes), and disabled state. Value is an HH:MM string. Renders a dropdown of time slots. Close on outside click.">
            <div class="row wrap" style="gap: 20px; align-items: flex-start;">
              <fvdr-timepicker label="Size S — 24h" size="s" style="width: 180px;" />
              <fvdr-timepicker label="Size M (default)" size="m" style="width: 200px;" />
              <fvdr-timepicker label="12h + UTC" size="l" format="12h" [utc]="true" hint="UTC timezone" style="width: 220px;" />
              <fvdr-timepicker label="Error" state="error" errorMessage="Select an upcoming time" style="width: 200px;" />
              <fvdr-timepicker label="Disabled" [disabled]="true" style="width: 180px;" />
            </div>
          </ds-doc-block>

          <ds-doc-block
            id="phone"
            name="Phone Number Input"
            description="A text field with country code selector, formatted for international phone number entry."
            figmaNode="19635-3445"
            [whenToUse]="['User registration forms requiring a phone number', 'Contact detail collection', 'Two-factor auth enrollment']"
            [whenNotToUse]="['Generic numeric input — use Number Stepper', 'When country is fixed and known']"
            aiPrompt="Generate an Angular fvdr-phone-input ControlValueAccessor with a country dial-code selector (dropdown), phone number text field, label, and validation. Format value as {dialCode, number}. Show flag emoji or country code prefix.">
            <div style="max-width: 300px; width: 100%;">
              <fvdr-phone-input label="Phone number" />
            </div>
          </ds-doc-block>

          <ds-doc-block
            id="editor"
            name="Text Editor"
            description="A rich text input supporting bold, italic, lists, and links — for notes or descriptions requiring formatting."
            figmaNode="15339-6092"
            [whenToUse]="['Notes or descriptions requiring basic formatting', 'Comment threads with text emphasis', 'Content creation where markdown-like formatting adds value']"
            [whenNotToUse]="['Simple text — use Textarea', 'Code input — use a code editor', 'Form fields where plain text is sufficient']"
            aiPrompt="Generate an Angular fvdr-text-editor component with label, placeholder, helperText, and an HTML output value. Support toolbar actions: bold, italic, unordered list, ordered list, link insert. Use contenteditable or a lightweight editor library.">
            <div style="max-width: 560px; width: 100%;">
              <fvdr-text-editor label="Notes" placeholder="Start typing..." helperText="Supports bold, italic, lists and links" />
            </div>
          </ds-doc-block>

          <ds-doc-block
            id="radio"
            name="Radio Button"
            description="A set of mutually exclusive options where selecting one deselects all others. Renders in vertical or horizontal layout."
            figmaNode="15851-7241"
            [whenToUse]="['Selecting exactly one from a small set (2–5 items)', 'When all options should always be visible', 'Preference or settings selection']"
            [whenNotToUse]="['More than 6 options — use Dropdown', 'Independent boolean choices — use Checkbox', 'Instant toggle — use Segment Controls']"
            aiPrompt="Generate an Angular fvdr-radio ControlValueAccessor with options array {value, label, disabled?}, layout (vertical/horizontal), and value two-way binding. Style with custom radio mark using CSS. Support keyboard navigation.">
            <div class="row wrap" style="gap: 40px;">
              <fvdr-radio [options]="radioOptions" [(value)]="radioValue" layout="vertical" />
              <fvdr-radio [options]="radioOptions" [(value)]="radioValue" layout="horizontal" />
            </div>
          </ds-doc-block>

          <ds-doc-block
            id="toggles"
            name="Toggle"
            description="A binary switch for instantly enabling or disabling a setting without requiring form submission."
            figmaNode="15851-7316"
            [whenToUse]="['On/off system settings taking effect immediately', 'Feature flags or preference switches', 'Dark mode, notification settings, auto-save']"
            [whenNotToUse]="['Multi-step or destructive actions — use Button', 'When the user must confirm — use Checkbox + Submit', 'Selecting from multiple options — use Radio']"
            aiPrompt="Generate an Angular fvdr-toggle ControlValueAccessor with label, disabled state, and checked two-way binding. Animate the thumb slide with CSS transitions. Use role=switch and aria-checked for accessibility.">
            <div class="col" style="gap: 12px;">
              <fvdr-toggle label="Enable notifications" [(checked)]="toggle1" />
              <fvdr-toggle label="Dark mode" [(checked)]="toggle2" />
              <fvdr-toggle label="Disabled (on)" [checked]="true" [disabled]="true" />
            </div>
          </ds-doc-block>

          <ds-doc-block
            id="checkboxes"
            name="Checkbox"
            description="A binary control for independently toggling options on or off. Supports indeterminate state for partial group selection."
            figmaNode="15851-7222"
            [whenToUse]="['Selecting multiple items from a list', 'Accepting terms and conditions', 'Toggling independent non-exclusive options']"
            [whenNotToUse]="['Mutually exclusive choices — use Radio', 'Instant-effect settings — use Toggle', 'Single yes/no that takes effect immediately']"
            aiPrompt="Generate an Angular fvdr-checkbox ControlValueAccessor with label, indeterminate state, disabled state, and checked binding. Replace native checkbox with custom CSS. Support keyboard interaction, focus ring, and aria-checked.">
            <div class="col" style="gap: 12px;">
              <fvdr-checkbox label="Unchecked" />
              <fvdr-checkbox label="Checked" [checked]="true" />
              <fvdr-checkbox label="Indeterminate" [indeterminate]="true" />
              <fvdr-checkbox label="Disabled" [disabled]="true" />
            </div>
          </ds-doc-block>

          <ds-doc-block
            id="dropdown"
            name="Dropdown"
            description="A select control for choosing one or multiple options from a searchable, scrollable list panel."
            figmaNode="15032-13756"
            [whenToUse]="['Choosing from 6 or more options', 'Multi-select with search filter', 'When space is constrained and a full list would overflow']"
            [whenNotToUse]="['5 or fewer options — use Radio', 'Instant navigation — use Tabs or Segment', 'Boolean toggle — use Toggle or Checkbox']"
            aiPrompt="Generate an Angular fvdr-dropdown ControlValueAccessor with options array {value, label}, single/multi select, searchable mode, placeholder, disabled state, and label. Panel opens below trigger. Emit value or value[] on selection.">
            <div class="col" style="max-width: 300px; gap: 12px; width: 100%;">
              <fvdr-dropdown label="Single select" [options]="dropOpts" placeholder="Select option..." />
              <fvdr-dropdown label="Searchable" [options]="dropOpts" [searchable]="true" placeholder="Search & select..." />
              <fvdr-dropdown label="Multi select" [options]="dropOpts" [multi]="true" placeholder="Select multiple..." />
            </div>
          </ds-doc-block>

          <ds-doc-block
            id="multiselect"
            name="Multiselect"
            description="A dropdown panel with checkboxes for selecting multiple values simultaneously. Includes search filtering and a select-all toggle."
            figmaNode="15032-13916"
            [whenToUse]="['Selecting multiple items from a long list', 'Filtering content by multiple categories or tags', 'When users need to pick several options before applying the selection', 'Assigning multiple roles, labels, or attributes to an entity']"
            [whenNotToUse]="['Only one value can be selected — use Dropdown or Radio', 'Few options (≤ 4) — use Checkboxes directly', 'Instant filtering without an apply step — use Chip filters', 'On mobile with many options — consider a bottom sheet instead']"
            aiPrompt="Generate an Angular fvdr-multiselect ControlValueAccessor with options array {value, label, disabled?}, label, placeholder, searchPlaceholder, maxHeight, showChips, maxChips, required, disabled, state, errorText, and helperText inputs. Panel header has a select-all checkbox with indeterminate state and a search field. Each item is 40px with a custom CSS checkbox. Active items highlighted in primary-50. Close on outside click via @HostListener. Emit valuesChange and selectionChange with string[].">
            <div class="col" style="max-width: 320px; gap: 16px; width: 100%;">
              <fvdr-multiselect
                label="Countries"
                [options]="multiselectOpts"
                placeholder="Select countries…"
                [(values)]="multiselectSelected"
              />
              <fvdr-multiselect
                label="Pre-selected"
                [options]="multiselectOpts"
                placeholder="Select countries…"
                [values]="['ua', 'de']"
              />
              <fvdr-multiselect
                label="Disabled"
                [options]="multiselectOpts"
                placeholder="Not available"
                [disabled]="true"
              />
            </div>
          </ds-doc-block>

        </ds-category>

        <!-- ════════════════════════════════════════
             NAVIGATION
        ════════════════════════════════════════ -->
        <ds-category id="cat-nav" label="Navigation" description="Components that help users move through the application or understand their location.">

          <ds-doc-block
            id="droplist"
            name="Droplist"
            description="A contextual action menu that shows a list of labeled items with icons, dividers, and danger variants."
            figmaNode="15032-13916"
            [whenToUse]="['&quot;More actions&quot; overflow menus', 'Contextual action lists anchored to a trigger', 'Section navigation in sidebars']"
            [whenNotToUse]="['Primary navigation — use Nav component', 'Single actions — use Button', 'Long scrollable lists — use Dropdown']"
            aiPrompt="Generate an Angular fvdr-droplist component with items array {id, label, icon?, rightText?, dividerAfter?, variant?, disabled?} and activeId input. Render as a vertical action list with hover states and active indicator. Emit itemClicked with the item id.">
            <fvdr-droplist [items]="droplistItems" activeId="edit" />
          </ds-doc-block>

          <ds-doc-block
            id="tabs"
            name="Tabs"
            description="A set of labeled triggers switching between parallel content panels. Only one panel is visible at a time."
            [whenToUse]="['Switching between related content views in a page', 'Settings sections or detail page sub-views', 'Reducing vertical height by hiding inactive content']"
            [whenNotToUse]="['Sequential steps — use Stepper', '2–4 small options in a toolbar — use Segment', 'Separate page routes — use navigation links']"
            aiPrompt="Generate an Angular fvdr-tabs component with tabs array {id, label, counter?, disabled?}, activeId input and two-way output, and tabChange event. Support keyboard navigation (arrow keys) between tabs. Render an underline indicator on the active tab.">
            <fvdr-tabs [tabs]="tabItems" [activeId]="activeTab" (tabChange)="activeTab = $event" />
          </ds-doc-block>

          <ds-doc-block
            id="header"
            name="Header"
            description="The top-level navigation bar providing app identity, primary navigation links, and user action controls."
            figmaNode="16471-25871"
            [whenToUse]="['Desktop app shell navigation', 'Project-level context switching', 'User account and notification controls']"
            [whenNotToUse]="['Within page sections — use Tabs or Segment', 'Mobile layouts — use Mobile Header', 'Standalone page without navigation']"
            aiPrompt="Generate an Angular fvdr-header component with appName, navItems {id, label, icon, route?}, activeNavId, actions {id, icon, badge?}, and userName. Highlight active nav item. Emit navChange and actionClick events.">
            <div style="width: 100%; border: 1px solid var(--color-divider); border-radius: var(--radius-md); overflow: hidden;">
              <fvdr-header appName="FVDR" [navItems]="headerNav" activeNavId="overview" [actions]="headerActions" userName="John Doe" />
            </div>
          </ds-doc-block>

          <ds-doc-block
            id="tree"
            name="Tree View"
            description="A hierarchical display of nested data using expandable and collapsible parent-child nodes."
            figmaNode="19202-13644"
            [whenToUse]="['File systems and folder hierarchies', 'Nested categories or permission trees', 'Org charts or expandable menu structures']"
            [whenNotToUse]="['Flat lists — use Table or List', 'Shallow 1-level structures — use Tabs', 'Data that changes frequently (performance)']"
            aiPrompt="Generate an Angular fvdr-tree component with recursive TreeNode[] {id, label, icon?, children?, expanded?}. Support keyboard expand/collapse with arrow keys. Emit nodeSelected with node id. Indent child nodes visually with connector lines.">
            <div style="max-width: 280px; border: 1px solid var(--color-divider); border-radius: var(--radius-md); padding: 8px; width: 100%;">
              <fvdr-tree [nodes]="treeNodes" />
            </div>
          </ds-doc-block>

        </ds-category>

        <!-- ════════════════════════════════════════
             DATA DISPLAY
        ════════════════════════════════════════ -->
        <ds-category id="cat-data" label="Data Display" description="Components for showing structured information — from compact labels to complex data tables.">

          <ds-doc-block
            id="statuses"
            name="Status"
            description="Project status indicators in two visual forms: CA Dashboard pill chips (display only) and Project status buttons (interactive dropdown triggers)."
            figmaNode="30267-13707"
            [whenToUse]="['Project status in CA Dashboard tables', 'Status selector in project detail views', 'Inline status labels in lists and cards']"
            [whenNotToUse]="['Severity levels — use Badge or Inline Message', 'Generic text-only labels without color meaning', 'User account status (use a different color system)']"
            aiPrompt="Generate Angular fvdr-status (CA Dashboard pill: icon + label, light bg, dark text) and fvdr-status-btn (interactive: solid bg, icon + label + chevron-down). Variants: pending, preparation, live, locked, closed, archived, on-hold, frozen. Each has a specific background and DS icon. Status button emits (clicked) for dropdown trigger.">
            <div class="preview-col">
              <p class="preview-label">CA Dashboard chips</p>
              <div class="row wrap" style="gap: 8px;">
                <fvdr-status variant="pending" />
                <fvdr-status variant="preparation" />
                <fvdr-status variant="live" />
                <fvdr-status variant="locked" />
                <fvdr-status variant="closed" />
                <fvdr-status variant="archived" />
                <fvdr-status variant="on-hold" />
                <fvdr-status variant="frozen" />
              </div>
              <p class="preview-label" style="margin-top: 16px;">Project / External status buttons</p>
              <div class="row wrap" style="gap: 8px;">
                <fvdr-status-btn variant="preparation" />
                <fvdr-status-btn variant="live" />
                <fvdr-status-btn variant="locked" />
                <fvdr-status-btn variant="archived" />
              </div>
            </div>
          </ds-doc-block>

          <ds-doc-block
            id="chips"
            name="Chips"
            description="Compact labels representing an attribute, tag, or filter. Supports removable, selectable, and clickable states."
            figmaNode="15032-13859"
            [whenToUse]="['Filter tags in search interfaces', 'Input token displays (selected items)', 'Category or skill labels', 'Selectable option groups']"
            [whenNotToUse]="['Primary actions — use Button', 'Long text labels that wrap', 'Project status — use Status chip']"
            aiPrompt="Generate an Angular fvdr-chip component with label, variant (default/primary/success/warning/error), optional icon, removable mode with × button, selected/active state, and clickable mode. Emit (removed) and (clicked) events. Use pill shape with 1.5px border.">
            <div class="preview-col">
              <div class="row wrap" style="gap: 8px;">
                <fvdr-chip label="Default" />
                <fvdr-chip label="Primary" variant="primary" />
                <fvdr-chip label="Success" variant="success" />
                <fvdr-chip label="Warning" variant="warning" />
                <fvdr-chip label="Error" variant="error" />
              </div>
              <div class="row wrap" style="gap: 8px; margin-top: 8px;">
                <fvdr-chip label="Removable" [removable]="true" />
                <fvdr-chip label="Selected" [selected]="true" />
                <fvdr-chip label="Clickable" [clickable]="true" icon="edit" />
              </div>
            </div>
          </ds-doc-block>

          <ds-doc-block
            id="counters"
            name="Counter"
            description="A compact numeric badge for counts — unread messages, notification totals, or items in a list."
            figmaNode="35020-79605"
            [whenToUse]="['Sidebar navigation unread counts', 'Tab counter badges', 'Notification dot with number', 'Cart item count']"
            [whenNotToUse]="['Progress or percentage — use Progress bar', 'Arbitrary text labels — use Badge', 'Large data numbers needing context — use a stat block']"
            aiPrompt="Generate an Angular fvdr-counter component with value (number), variant (default/primary/error/warning), and size (s/m). Cap display at 99+. Use pill shape with matching background and text tokens.">
            <div class="row wrap">
              <fvdr-counter [value]="3" variant="default" size="s" />
              <fvdr-counter [value]="12" variant="primary" size="s" />
              <fvdr-counter [value]="99" variant="error" size="s" />
              <fvdr-counter [value]="150" variant="warning" size="s" />
              <fvdr-counter [value]="7" variant="default" size="m" />
              <fvdr-counter [value]="42" variant="primary" size="m" />
            </div>
          </ds-doc-block>

          <ds-doc-block
            id="badge"
            name="Badge"
            description="A semantic color-coded label indicating status or category, typically placed near a title or action."
            [whenToUse]="['Semantic status labels (Success, Error, Warning)', 'New or Updated content indicators', 'Content categorization tags']"
            [whenNotToUse]="['Numeric counts — use Counter', 'Project-specific statuses — use Status chip', 'Removable filter tags — use Chip']"
            aiPrompt="Generate an Angular fvdr-badge component with variant (success/error/warning/info/neutral/primary) and label input. Render as a small rounded pill with colored background and matching text. Use design tokens for all color values.">
            <div class="row wrap" style="gap: 8px;">
              <fvdr-badge variant="success" label="Success" />
              <fvdr-badge variant="error" label="Error" />
              <fvdr-badge variant="warning" label="Warning" />
              <fvdr-badge variant="info" label="Info" />
              <fvdr-badge variant="neutral" label="Neutral" />
              <fvdr-badge variant="primary" label="Primary" />
            </div>
          </ds-doc-block>

          <ds-doc-block
            id="table"
            name="Table"
            description="A structured grid for displaying tabular data with sortable columns, row selection, and configurable column layout."
            figmaNode="15032-15291"
            [whenToUse]="['Structured data with comparable attributes', 'Admin lists, user management, reports', 'Bulk selection and batch action scenarios']"
            [whenNotToUse]="['Simple key-value pairs — use a List', 'Media-rich content — use Cards', 'Hierarchical data — use Tree View']"
            aiPrompt="Generate an Angular fvdr-table component with columns array {key, label, sortable?, align?}, data array of objects, selectable rows, sort state {key, direction} binding, and (sortChange) event. Show sort arrow icon on active column header.">
            <fvdr-table [columns]="tableCols" [data]="tableData" [selectable]="true" [sortState]="tableSort" (sortChange)="tableSort = $event" />
          </ds-doc-block>

          <ds-doc-block
            id="avatar"
            name="Avatar"
            description="A circular visual representation of a user, displayed as initials or photo with configurable size and color."
            [whenToUse]="['User identity in tables, lists, or comment threads', 'Profile headers and assignment indicators', 'Showing who is online or assigned to a task']"
            [whenNotToUse]="['Decorative icons without user context — use Icon', 'Large illustrations or profile photos — use Image', 'Company or entity logos']"
            aiPrompt="Generate an Angular fvdr-avatar component with initials (string), size (sm/md/lg/xl), optional color override, and optional src image URL. Auto-generate a background hue from the initials string hash. Show initials fallback if image fails to load.">
            <div class="row wrap" style="gap: 12px;">
              <fvdr-avatar initials="JD" size="sm" />
              <fvdr-avatar initials="AB" size="md" />
              <fvdr-avatar initials="BS" size="lg" />
              <fvdr-avatar initials="CX" size="xl" />
              <fvdr-avatar initials="AK" size="md" color="#358CEB" />
            </div>
          </ds-doc-block>

          <ds-doc-block
            id="cards"
            name="Card"
            description="A self-contained surface that groups related content and actions about a single subject."
            [whenToUse]="['Entity summary views (projects, deals)', 'Feature highlights or onboarding tiles', 'Clickable list items with rich content']"
            [whenNotToUse]="['Dense tabular data — use Table', 'Simple text lists without visual grouping', 'Full-page layouts — use Page sections']"
            aiPrompt="Generate an Angular fvdr-card component with title, optional subtitle, state (default/active), hoverable mode, and ng-content projection for body content. Apply shadow on hover when hoverable=true. Use design tokens for border-radius, spacing, and shadow.">
            <div class="row wrap" style="gap: 12px;">
              <fvdr-card title="Default card" style="width: 200px;">
                <p style="font-size: 13px; color: var(--color-text-secondary); margin: 0;">Card content goes here.</p>
              </fvdr-card>
              <fvdr-card title="Active card" state="active" style="width: 200px;">
                <p style="font-size: 13px; color: var(--color-text-secondary); margin: 0;">Active state with border.</p>
              </fvdr-card>
              <fvdr-card title="Hoverable" [hoverable]="true" style="width: 200px;">
                <p style="font-size: 13px; color: var(--color-text-secondary); margin: 0;">Hover to see shadow.</p>
              </fvdr-card>
            </div>
          </ds-doc-block>

        </ds-category>

        <!-- ════════════════════════════════════════
             FEEDBACK
        ════════════════════════════════════════ -->
        <ds-category id="cat-feedback" label="Feedback" description="Visual indicators that communicate status, progress, loading states, or system messages.">

          <ds-doc-block
            id="inline-messages"
            name="Inline Message"
            description="A contextual message shown inline within content to communicate status, validation, or provide guidance."
            figmaNode="16160-9495"
            [whenToUse]="['Form validation feedback below a field group', 'Contextual tips within a settings section', 'Step-level guidance in a wizard']"
            [whenNotToUse]="['Page-level alerts — use Info Banner', 'Transient confirmations — use Toast', 'Critical blocking errors — use Modal']"
            aiPrompt="Generate an Angular fvdr-inline-message component with variant (info/success/warning/error) and text input. Show a colored left border and matching icon. No dismiss button. Use design tokens for semantic colors.">
            <div class="col" style="gap: 8px; width: 100%; max-width: 480px;">
              <fvdr-inline-message variant="info" text="Changes will apply on next login" />
              <fvdr-inline-message variant="success" text="Your settings have been saved" />
              <fvdr-inline-message variant="warning" text="This action cannot be undone" />
              <fvdr-inline-message variant="error" text="This field is required" />
            </div>
          </ds-doc-block>

          <ds-doc-block
            id="info-banner"
            name="Info Banner"
            description="A prominent full-width message for page-level status, warnings, or important announcements."
            [whenToUse]="['Page-level confirmation after a save', 'System-wide warnings or maintenance notices', 'Account-level alerts requiring attention']"
            [whenNotToUse]="['Inline form feedback — use Inline Message', 'Transient confirmations — use Toast', 'Short error labels — use field-level error text']"
            aiPrompt="Generate an Angular fvdr-info-banner component with variant (info/success/warning/error), title, message, and optional dismissible mode. Show semantic icon and colored left accent. Emit (dismissed) on close.">
            <div class="col" style="max-width: 480px; gap: 10px; width: 100%;">
              <fvdr-info-banner variant="info" title="Information" message="Your account will be reviewed within 24 hours." />
              <fvdr-info-banner variant="success" title="Success!" message="Your changes have been saved successfully." />
              <fvdr-info-banner variant="warning" title="Warning" message="You have unsaved changes. Please save before leaving." />
              <fvdr-info-banner variant="error" title="Error" message="Something went wrong. Please try again later." />
            </div>
          </ds-doc-block>

          <ds-doc-block
            id="toasts"
            name="Toast"
            description="A brief, auto-dismissing notification that confirms an action or communicates a system event."
            figmaNode="15032-16725"
            [whenToUse]="['Confirming a save, delete, or copy action', 'Background task completion notification', 'Non-critical system events the user should notice']"
            [whenNotToUse]="['Errors requiring user action — use Modal or Banner', 'Content that must be read before continuing', 'Actions the user explicitly triggered (they know it happened)']"
            aiPrompt="Generate an Angular ToastService with show({variant, title, message, duration}) and a fvdr-toast-host component. Variants: success/error/warning/info. Auto-dismiss after duration ms. Animate in with slide+fade. Stack multiple toasts vertically.">
            <div class="preview-col" style="width: 100%;">
              <div class="row wrap" style="gap: 8px;">
                <fvdr-btn label="Success" variant="primary" size="s" (clicked)="showToast('success')" />
                <fvdr-btn label="Error" variant="danger" size="s" (clicked)="showToast('error')" />
                <fvdr-btn label="Warning" variant="ghost" size="s" (clicked)="showToast('warning')" />
                <fvdr-btn label="Info" variant="secondary" size="s" (clicked)="showToast('info')" />
              </div>
              <div style="max-width: 400px; margin-top: 12px;">
                <fvdr-toast variant="success" title="Saved!" message="Your changes have been saved successfully." [duration]="0" />
              </div>
            </div>
          </ds-doc-block>

          <ds-doc-block
            id="modals"
            name="Modal & Bottom Sheet"
            description="Overlay windows that interrupt the user for critical confirmations or focused input. Bottom Sheet slides up from the edge on mobile."
            figmaNode="15032-15799"
            [whenToUse]="['Destructive action confirmation (delete, archive)', 'Focused multi-field forms', 'Previewing detail content without navigation']"
            [whenNotToUse]="['Non-critical info — use Toast or Banner', 'Deep multi-step content flows — use a full Page', 'Nested modals — avoid stacking overlays']"
            aiPrompt="Generate Angular fvdr-modal with visible, title, content, confirmLabel, cancelLabel inputs and (closed) output. Block background scroll, trap focus, close on backdrop click and Escape. Also generate fvdr-bottom-sheet that slides from the bottom with ng-content projection for custom body.">
            <div class="preview-col">
              <div class="row wrap" style="gap: 8px;">
                <fvdr-btn label="Open Modal" variant="primary" size="s" (clicked)="modalVisible = true" />
                <fvdr-btn label="Open Bottom Sheet" variant="secondary" size="s" (clicked)="sheetVisible = true" />
              </div>
              <fvdr-modal [visible]="modalVisible" title="Confirm action" content="Are you sure you want to proceed? This action cannot be undone." confirmLabel="Confirm" cancelLabel="Cancel" (closed)="modalVisible = false" />
              <fvdr-bottom-sheet [visible]="sheetVisible" title="Options" confirmLabel="Apply" cancelLabel="Cancel" (closed)="sheetVisible = false">
                <p style="color: var(--color-text-secondary); font-size: 14px; margin: 0;">Select an option to apply changes to your account settings.</p>
              </fvdr-bottom-sheet>
            </div>
          </ds-doc-block>

          <ds-doc-block
            id="special-controls"
            name="Special Controls"
            description="Specialized inputs for numeric quantities, slider ranges, and determinate progress indicators."
            figmaNode="15032-7631"
            [whenToUse]="['Quantity selectors (stepper)', 'Volume or threshold controls (range slider)', 'Upload or task completion progress']"
            [whenNotToUse]="['Text or date input — use Text Field or Date Picker', 'Indeterminate loading — use Spinner', 'Binary on/off — use Toggle']"
            aiPrompt="Generate Angular components: fvdr-number-stepper (ControlValueAccessor with min/max/step, +/- buttons), fvdr-range (slider ControlValueAccessor with min/max, showValue), fvdr-progress (determinate bar with value 0–100, variant default/warning/error, optional label and percentage).">
            <div class="col" style="max-width: 320px; gap: 20px; width: 100%;">
              <fvdr-number-stepper label="Quantity" [min]="0" [max]="100" [(ngModel)]="stepperValue" />
              <fvdr-range label="Volume" [showValue]="true" [(ngModel)]="rangeValue" />
              <fvdr-progress label="Upload progress" [value]="65" [showValue]="true" />
              <fvdr-progress label="Warning threshold" [value]="85" variant="warning" [showValue]="true" />
              <fvdr-progress label="Critical" [value]="100" variant="error" [showValue]="true" />
            </div>
          </ds-doc-block>

          <ds-doc-block
            id="drop-area"
            name="Drag & Drop Area"
            description="A file drop zone that accepts files via drag-and-drop or click-to-browse. Shows drag-over visual state."
            figmaNode="35319-17829"
            [whenToUse]="['File upload flows and document attachment', 'Bulk import of multiple files', 'When drag-and-drop improves discoverability']"
            [whenNotToUse]="['Single file inline upload within a dense form — use a simple file input', 'Non-file data entry', 'Mobile-only interfaces where drag is unavailable']"
            aiPrompt="Generate an Angular fvdr-drop-area component with title, subtitle, accept (file types string), multiple mode, and (filesDropped) event. Show a dashed border drop zone. Highlight border on dragover. Validate file types on drop. Also allow click to open native file picker.">
            <div style="max-width: 400px; width: 100%;">
              <fvdr-drop-area title="Drag & drop files here" subtitle="or click to browse" accept=".pdf, .doc, .docx" [multiple]="true" (filesDropped)="onFilesDropped($event)" />
            </div>
          </ds-doc-block>

        </ds-category>

        <!-- ════════════════════════════════════════
             FOUNDATION
        ════════════════════════════════════════ -->
        <ds-category id="cat-foundation" label="Foundation" description="Core visual primitives — icons, tokens, and layout that all components are built on.">

          <ds-doc-block
            id="icons"
            name="Icons"
            description="A scalable SVG icon set covering navigation, actions, status, and content. Use fvdr-icon with the name input from FvdrIconName."
            figmaNode="15846-7469"
            [whenToUse]="['Paired with labels to reinforce meaning', 'Icon-only buttons with aria-label or tooltip', 'Status and category indicators in tables']"
            [whenNotToUse]="['Standalone decoration without accessible labels', 'Replacing meaningful text entirely', 'Illustrative or complex imagery — use Image']"
            aiPrompt="Use the fvdr-icon component: <fvdr-icon name=&quot;bell&quot; />. Size via CSS font-size on the element or parent. All icon names are typed as FvdrIconName (import from the DS). Always pair icon-only usage with aria-label or fvdr-tooltip for accessibility.">
            <div class="icons-grid">
              <div *ngFor="let icon of iconNames" class="icon-item">
                <fvdr-icon [name]="icon" style="font-size: 20px;" />
                <span>{{ icon }}</span>
              </div>
            </div>
          </ds-doc-block>

        </ds-category>

      </main>
    </div>
  `,
  styles: [`
    :host { display: block; font-family: var(--font-family); }

    .showcase {
      display: flex;
      min-height: 100vh;
      background: var(--color-stone-100);
    }

    /* ── Sidebar ── */
    .showcase__nav {
      position: sticky;
      top: 0;
      width: 210px;
      min-width: 210px;
      height: 100vh;
      overflow-y: auto;
      background: var(--color-stone-0);
      border-right: 1px solid var(--color-divider);
      padding: var(--space-4) 0 var(--space-8);
      display: flex;
      flex-direction: column;
    }
    .showcase__nav-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 16px var(--space-4) 14px;
      border-bottom: 1px solid var(--color-divider);
      margin-bottom: var(--space-2);
    }
    .nav-logo-text {
      font-size: 14px;
      font-weight: 700;
      color: var(--color-text-primary);
    }
    .nav-group__label {
      padding: 12px var(--space-4) 4px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: var(--color-text-secondary);
      opacity: 0.6;
    }
    .showcase__nav-link {
      display: block;
      padding: 5px var(--space-4) 5px calc(var(--space-4) + 4px);
      font-size: 13px;
      color: var(--color-text-secondary);
      text-decoration: none;
      transition: background 0.1s, color 0.1s;
      border-left: 2px solid transparent;
    }
    .showcase__nav-link:hover {
      background: var(--color-hover-bg);
      color: var(--color-text-primary);
      border-left-color: var(--color-primary-500);
    }

    /* ── Main ── */
    .showcase__main {
      flex: 1;
      padding: var(--space-6) var(--space-8);
      max-width: 900px;
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    /* ── Hero ── */
    .showcase__hero {
      padding: var(--space-8);
      background: var(--color-stone-0);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-divider);
      margin-bottom: var(--space-8);
    }
    .showcase__h1 {
      font-size: 28px;
      font-weight: 700;
      color: var(--color-text-primary);
      margin: 0 0 var(--space-2);
    }
    .showcase__subtitle {
      font-size: var(--text-body3-size);
      color: var(--color-text-secondary);
      margin: 0 0 var(--space-4);
      line-height: 1.5;
    }
    .showcase__subtitle a { color: var(--color-primary-500); }
    .showcase__stats { display: flex; gap: var(--space-6); }
    .showcase__stat { font-size: var(--text-base-s-size); color: var(--color-text-secondary); }
    .showcase__stat b { color: var(--color-text-primary); }

    /* ── Preview helpers ── */
    .preview-col { display: flex; flex-direction: column; gap: 12px; width: 100%; }
    .preview-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--color-text-secondary);
      opacity: 0.7;
      margin: 0;
    }
    .row { display: flex; align-items: center; gap: var(--space-3); }
    .wrap { flex-wrap: wrap; }
    .col { display: flex; flex-direction: column; }

    /* ── Icons grid ── */
    .icons-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: var(--space-2);
      width: 100%;
    }
    .icon-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: var(--space-2);
      border-radius: var(--radius-sm);
      font-size: var(--text-caption1-size);
      color: var(--color-text-secondary);
      text-align: center;
      border: 1px solid var(--color-divider);
      background: var(--color-stone-0);
    }
    .icon-item:hover { background: var(--color-hover-bg); }
  `],
})
export class DsShowcaseComponent implements OnInit, OnDestroy {
  private toastSvc = inject(ToastService);
  private tracker = inject(TrackerService);

  ngOnInit(): void { this.tracker.trackPageView('ds-showcase'); }
  ngOnDestroy(): void { this.tracker.destroyListeners(); }

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  navCategories = [
    {
      label: 'Action',
      links: [
        { id: 'buttons',  label: 'Button' },
        { id: 'segment',  label: 'Segment Controls' },
      ],
    },
    {
      label: 'Form',
      links: [
        { id: 'inputs',     label: 'Text Field' },
        { id: 'textarea',   label: 'Textarea' },
        { id: 'search',     label: 'Search' },
        { id: 'datepicker', label: 'Date Picker' },
        { id: 'calendar',   label: 'Calendar (inline)' },
        { id: 'timepicker', label: 'Time Picker' },
        { id: 'phone',      label: 'Phone Number' },
        { id: 'editor',     label: 'Text Editor' },
        { id: 'radio',      label: 'Radio Button' },
        { id: 'toggles',    label: 'Toggle' },
        { id: 'checkboxes', label: 'Checkbox' },
        { id: 'dropdown',     label: 'Dropdown' },
        { id: 'multiselect',  label: 'Multiselect' },
      ],
    },
    {
      label: 'Navigation',
      links: [
        { id: 'droplist', label: 'Droplist' },
        { id: 'tabs',     label: 'Tabs' },
        { id: 'header',   label: 'Header' },
        { id: 'tree',     label: 'Tree View' },
      ],
    },
    {
      label: 'Data Display',
      links: [
        { id: 'statuses',  label: 'Status' },
        { id: 'chips',     label: 'Chips' },
        { id: 'counters',  label: 'Counter' },
        { id: 'badge',     label: 'Badge' },
        { id: 'table',     label: 'Table' },
        { id: 'avatar',    label: 'Avatar' },
        { id: 'cards',     label: 'Card' },
      ],
    },
    {
      label: 'Feedback',
      links: [
        { id: 'inline-messages',  label: 'Inline Message' },
        { id: 'info-banner',      label: 'Info Banner' },
        { id: 'toasts',           label: 'Toast' },
        { id: 'modals',           label: 'Modal' },
        { id: 'special-controls', label: 'Special Controls' },
        { id: 'drop-area',        label: 'Drag & Drop' },
      ],
    },
    {
      label: 'Foundation',
      links: [
        { id: 'icons', label: 'Icons' },
      ],
    },
  ];

  // Inputs
  selectedDate?: Date;
  calDate?: Date;
  rangeStart?: Date;
  rangeEnd?: Date;

  // Radio
  radioOptions: RadioOption[] = [
    { value: 'a', label: 'Option A' },
    { value: 'b', label: 'Option B' },
    { value: 'c', label: 'Option C', disabled: true },
  ];
  radioValue = 'a';

  // Toggle
  toggle1 = true;
  toggle2 = false;

  // Search filters
  searchFilters: SearchFilter[] = [
    { id: 'active', label: 'Active', active: true },
    { id: 'pending', label: 'Pending' },
    { id: 'draft', label: 'Draft' },
  ];
  toggleFilter(f: SearchFilter): void { f.active = !f.active; }

  // Segment
  segItems: SegmentItem[] = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'archived', label: 'Archived' },
  ];
  segActive = 'all';
  segItems4: SegmentItem[] = [
    { id: 'day', label: 'Day' },
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
    { id: 'year', label: 'Year' },
  ];
  segActive4 = 'week';

  // Dropdown
  dropOpts: DropdownOption[] = [
    { value: 'ua', label: 'Ukraine' },
    { value: 'us', label: 'United States' },
    { value: 'gb', label: 'United Kingdom' },
    { value: 'de', label: 'Germany' },
    { value: 'fr', label: 'France' },
  ];

  // Multiselect
  multiselectOpts = [
    { value: 'ua', label: 'Ukraine' },
    { value: 'us', label: 'United States' },
    { value: 'gb', label: 'United Kingdom' },
    { value: 'de', label: 'Germany' },
    { value: 'fr', label: 'France' },
    { value: 'pl', label: 'Poland' },
    { value: 'nl', label: 'Netherlands' },
  ];
  multiselectSelected: string[] = [];

  // Droplist
  droplistItems: DroplistItem[] = [
    { id: 'edit',   label: 'Edit',   icon: 'edit' },
    { id: 'copy',   label: 'Copy',   icon: 'link', rightText: '⌘C' },
    { id: 'share',  label: 'Share',  icon: 'share', dividerAfter: true },
    { id: 'delete', label: 'Delete', icon: 'trash', variant: 'danger' },
  ];

  // Tabs
  tabItems: TabItem[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'members',  label: 'Members', counter: 12 },
    { id: 'settings', label: 'Settings' },
    { id: 'disabled', label: 'Archived', disabled: true },
  ];
  activeTab = 'overview';

  // Table
  tableCols: TableColumn[] = [
    { key: 'name',   label: 'Name',   sortable: true },
    { key: 'role',   label: 'Role',   sortable: true },
    { key: 'status', label: 'Status' },
    { key: 'date',   label: 'Date',   sortable: true, align: 'right' },
  ];
  tableData = [
    { name: 'Alice Johnson', role: 'Admin',   status: 'Active',   date: '2026-01-15' },
    { name: 'Bob Smith',     role: 'Editor',  status: 'Pending',  date: '2026-02-01' },
    { name: 'Carol White',   role: 'Viewer',  status: 'Inactive', date: '2026-03-10' },
    { name: 'Dan Brown',     role: 'Editor',  status: 'Active',   date: '2026-03-12' },
    { name: 'Eva Green',     role: 'Admin',   status: 'Active',   date: '2026-03-14' },
  ];
  tableSort: import('../../shared/ds').SortState = { key: 'name', direction: 'asc' };

  // Tree
  treeNodes: TreeNode[] = [
    {
      id: 'docs', label: 'Documents', icon: 'folder',
      children: [
        { id: 'contracts', label: 'Contracts', icon: 'folder',
          children: [
            { id: 'c1', label: 'Contract_2026.pdf' },
            { id: 'c2', label: 'NDA_signed.pdf' },
          ]
        },
        { id: 'reports', label: 'Reports', icon: 'folder',
          children: [
            { id: 'r1', label: 'Q1_report.xlsx' },
          ]
        },
      ]
    },
    { id: 'settings', label: 'Settings', icon: 'settings' },
    { id: 'billing',  label: 'Billing',  icon: 'billing' },
  ];

  // Header
  headerNav: HeaderNavItem[] = [
    { id: 'overview', label: 'Overview', icon: 'overview' },
    { id: 'projects', label: 'Projects', icon: 'folder' },
    { id: 'reports',  label: 'Reports',  icon: 'reports' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];
  headerActions: HeaderAction[] = [
    { id: 'bell',   icon: 'bell',   badge: 3 },
    { id: 'search', icon: 'search' },
  ];
  mobileActions: HeaderAction[] = [
    { id: 'bell', icon: 'bell', badge: 5 },
    { id: 'more', icon: 'more' },
  ];

  // Special controls
  stepperValue = 5;
  rangeValue = 40;

  // Modal
  modalVisible = false;
  sheetVisible = false;

  // Toasts
  showToast(variant: 'success' | 'error' | 'warning' | 'info'): void {
    const messages = {
      success: { title: 'Saved!', message: 'Your changes have been saved successfully.' },
      error:   { title: 'Error', message: 'Something went wrong. Please try again.' },
      warning: { title: 'Warning', message: 'This action may have unintended consequences.' },
      info:    { title: 'Info', message: 'Your session will expire in 5 minutes.' },
    };
    this.toastSvc.show({ variant, ...messages[variant] });
  }

  onFilesDropped(files: File[]): void {
    this.toastSvc.show({ variant: 'success', title: 'Files received', message: `${files.length} file(s) ready to upload.` });
  }

  iconNames: import('../../shared/ds').FvdrIconName[] = [
    'angle-double-left','angle-double-right','api','attention','bell','billing',
    'cancel','check','chevron-down','chevron-left','chevron-right','chevron-up',
    'close','download','drag','edit','error','filter','finished','folder',
    'info','link','lock-close','lock-open','minus','more','move',
    'nav-api','nav-api-active','nav-billing','nav-billing-active',
    'nav-overview','nav-overview-active','nav-participants','nav-participants-active',
    'nav-projects','nav-projects-active','nav-reports','nav-reports-active',
    'nav-settings','nav-settings-active',
    'overview','participants','plus','reports','search','settings',
    'share','sort','spinner','storage','theme-dark','theme-light','trash','upload',
  ];
}
