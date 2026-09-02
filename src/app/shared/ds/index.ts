/**
 * FVDR Design System — Shared Components
 *
 * Source: Figma "FVDR - Design System" (liyNDiFf1piO8SQmHNKoeU)
 * Tokens: src/app/shared/ds/tokens.css  (import in angular.json styles[])
 *
 * Available components:
 *   <fvdr-btn>              → Button (Primary/Secondary/Ghost/Danger, S/M/L)
 *   <fvdr-tabs>             → Tabs bar (with counter badge support)
 *   <fvdr-card>             → Card container (default/active/hoverable)
 *   <fvdr-checkbox>         → Checkbox (supports ngModel, indeterminate)
 *   <fvdr-badge>            → Badge/Tag (success/error/warning/info/neutral/primary)
 *   <fvdr-avatar>           → Avatar (initials or image, sm/md/lg/xl)
 *   <fvdr-info-banner>      → Info/Warning/Error/Success message banner
 *   <fvdr-icon>             → Icon from Figma DS (name: FvdrIconName). Color via CSS `color`.
 *   <fvdr-input>            → Text input (S/M/L, states, icons)
 *   <fvdr-textarea>         → Textarea (resizable, counter)
 *   <fvdr-search>           → Search with filters
 *   <fvdr-datepicker>       → Date picker input
 *   <fvdr-timepicker>       → Time picker HH:MM
 *   <fvdr-phone-input>      → Phone number + country code
 *   <fvdr-text-editor>      → Rich text editor (contenteditable toolbar)
 *   <fvdr-calendar>         → Full calendar widget (single/range)
 *   <fvdr-radio>            → Radio button group
 *   <fvdr-toggle>           → Toggle/Switch
 *   <fvdr-segment>          → Segment controls
 *   <fvdr-chip>             → Chip/Tag (removable, selectable)
 *   <fvdr-dropdown>         → Select dropdown (single/multi, searchable)
 *   <fvdr-droplist>         → Context menu / droplist panel
 *   <fvdr-status>           → Status indicator with dot
 *   <fvdr-counter>          → Counter badge (S/M, variants)
 *   <fvdr-inline-message>   → Inline validation/info message
 *   <fvdr-toast>            → Toast notification
 *   <fvdr-toast-host>       → Toast container (place in app root)
 *   <fvdr-modal>            → Modal dialog
 *   <fvdr-bottom-sheet>     → Mobile bottom sheet
 *   <fvdr-table>            → Data table (sortable, selectable)
 *   <fvdr-tree>             → Tree view (expandable nodes)
 *   <fvdr-drop-area>        → Drag & Drop file area
 *   <fvdr-header>           → Desktop app header
 *   <fvdr-mobile-header>    → Mobile app header
 *   <fvdr-number-stepper>   → Number input with +/- buttons
 *   <fvdr-progress>         → Progress bar
 *   <fvdr-range>            → Range slider
 *   <fvdr-sidebar-nav>         → App sidebar (VDR/CA/Internal, collapsible, with sub-nav)
 *   <fvdr-file-icon>           → File/folder icon (folder, pdf, doc, xls, image, video, zip…)
 *   <fvdr-plan-icon>           → Colored subscription-plan badge (vault, enterprise, trial…)
 *   <fvdr-quick-access-menu>   → Quick access shortcuts panel (collapsible, active state)
 *   <fvdr-ghost-btn>           → Ghost button (circle-plus icon, optional label + shortcut, S/M)
 *   <fvdr-floating-panel>      → Floating toolbar of ghost buttons (vertical/horizontal × big/small)
 *   <fvdr-filter-btn>          → Filter button (12 colors, M/S, status dot, counter, arrow)
 *
 * AI Assistant section — components/ai/* (see also DS category "AI Assistant" on /ds):
 *   <fvdr-ask-ideon>           → Branded 'Ask Ideon' AI pill (glass + animated mesh gradient)
 *   <fvdr-thinking-orbs>       → Thinking/waiting indicator (3D dot sphere on canvas + label pill)
 *   <fvdr-ai-composer>         → Prompt input (auto-grow, add-context / voice / send)
 *   <fvdr-ai-steps>            → Streaming reasoning trace ("Thought for Ns", audit trail)
 *   <fvdr-ai-bubble>           → Conversation turn container (user bubble / assistant column)
 *   <fvdr-ai-citation>         → Source reference to a document (+ page), inline or pill
 *   <fvdr-ai-actions>          → Answer action row (regenerate · copy · thumbs up/down)
 *   <fvdr-ai-suggestions>      → Starter / follow-up prompt chips
 *   <fvdr-ai-markdown>         → Safe markdown answer renderer (streaming-tolerant)
 *   <fvdr-ai-empty-state>      → Greeting + composer + scope-aware starters
 *   <fvdr-ai-attachment>       → Context chip in the composer (doc/folder pin)
 *   <fvdr-ai-error>            → Failed turn (timeout · rate limit · permission)
 *   <fvdr-ai-tool-call>        → Auditable operation card (confirm-before-write)
 *   <fvdr-ai-permission-note>  → "Results filtered by your access"
 *   <fvdr-ai-source-list>      → Collected sources of one answer
 *   <fvdr-ai-conversation>     → Transcript + docked composer + scroll behaviour
 *   <fvdr-ai-answer-doc-list>  → Numbered document results (narrow shells)
 *   <fvdr-ai-answer-table>     → Tabular document results (default / signatures)
 *   <fvdr-ai-answer-summary>   → Grouped key points, each citing its source
 *   <fvdr-ai-answer-report>    → Generated deliverable (DD draft) + export
 *   <fvdr-ai-scope-bar>        → What the assistant may look at, and Change
 *   <fvdr-ai-inline-prompt>    → One-shot assistant embedded in a product surface
 *   <fvdr-ai-panel>            → Shell: fullscreen · sidebar (resizable) · floating
 *   <fvdr-ai-thread-list>      → Recent conversations (pin · rename · delete)
 *   <fvdr-ai-feedback-modal>   → Structured "why was this bad" after a thumbs-down
 *   <fvdr-ai-consent-banner>   → First-run data notice / AI disabled for the room
 *   <fvdr-ai-usage-meter>      → AI allowance against the plan
 *
 * Usage in prototype:
 *   import { DS_COMPONENTS } from '../../shared/ds';
 *
 *   @Component({
 *     imports: [CommonModule, ...DS_COMPONENTS],
 *     ...
 *   })
 */

import { ButtonComponent } from './components/button/button.component';
import { TabsComponent } from './components/tabs/tabs.component';
import { CardComponent } from './components/card/card.component';
import { CheckboxComponent } from './components/checkbox/checkbox.component';
import { BadgeComponent } from './components/badge/badge.component';
import { AvatarComponent } from './components/avatar/avatar.component';
import { InfoBannerComponent } from './components/info-banner/info-banner.component';
import { SafeHtmlPipe } from './pipes/safe-html.pipe';
import { FvdrIconComponent } from './icons/icon.component';
import { InputComponent } from './components/input/input.component';
import { TextareaComponent } from './components/textarea/textarea.component';
import { SearchComponent } from './components/search/search.component';
import { DatepickerComponent } from './components/datepicker/datepicker.component';
import { TimepickerComponent } from './components/timepicker/timepicker.component';
import { PhoneInputComponent } from './components/phone-input/phone-input.component';
import { TextEditorComponent } from './components/text-editor/text-editor.component';
import { CalendarComponent } from './components/calendar/calendar.component';
import { RadioComponent } from './components/radio/radio.component';
import { ToggleComponent } from './components/toggle/toggle.component';
import { SegmentComponent } from './components/segment/segment.component';
import { ChipComponent } from './components/chip/chip.component';
import { DropdownComponent } from './components/dropdown/dropdown.component';
import { DroplistComponent } from './components/droplist/droplist.component';
import { StatusComponent, StatusButtonComponent } from './components/status/status.component';
import { MultiselectComponent } from './components/multiselect/multiselect.component';
import { CounterComponent } from './components/counter/counter.component';
import { InlineMessageComponent } from './components/inline-message/inline-message.component';
import { ToastComponent, ToastHostComponent, ToastService } from './components/toast/toast.component';
import { ModalComponent, BottomSheetComponent } from './components/modal/modal.component';
import { TableComponent, FvdrTableCellDirective } from './components/table/table.component';
import { TreeComponent } from './components/tree/tree.component';
import { DropAreaComponent } from './components/drop-area/drop-area.component';
import { HeaderComponent, MobileHeaderComponent } from './components/header/header.component';
import { NumberStepperComponent, ProgressComponent, RangeComponent } from './components/special-controls/special-controls.component';
import { SidebarNavComponent } from './components/sidebar-nav/sidebar-nav.component';
import { FileIconComponent } from './components/file-icon/file-icon.component';
import { PlanIconComponent } from './components/plan-icon/plan-icon.component';
import { QuickAccessMenuComponent } from './components/quick-access-menu/quick-access-menu.component';
import { BreadcrumbsComponent } from './components/breadcrumbs/breadcrumbs.component';
import { PageHeaderComponent } from './components/page-header/page-header.component';
import { RedactionMarkCardComponent } from './components/redaction-mark-card/redaction-mark-card.component';
import { GhostBtnComponent } from './components/ghost-btn/ghost-btn.component';
import { FloatingPanelComponent } from './components/floating-panel/floating-panel.component';
import { FilterBtnComponent } from './components/filter-btn/filter-btn.component';
import { AskIdeonComponent } from './components/ai/ask-ideon/ask-ideon.component';
import { ThinkingOrbsComponent } from './components/ai/thinking-orbs/thinking-orbs.component';
import { AiComposerComponent } from './components/ai/ai-composer/ai-composer.component';
import { AiStepsComponent } from './components/ai/ai-steps/ai-steps.component';
import { AiBubbleComponent } from './components/ai/ai-bubble/ai-bubble.component';
import { AiCitationComponent } from './components/ai/ai-citation/ai-citation.component';
import { AiActionsComponent } from './components/ai/ai-actions/ai-actions.component';
import { AiSuggestionsComponent } from './components/ai/ai-suggestions/ai-suggestions.component';
import { AiMarkdownComponent } from './components/ai/ai-markdown/ai-markdown.component';
import { AiEmptyStateComponent } from './components/ai/ai-empty-state/ai-empty-state.component';
import { AiAttachmentComponent } from './components/ai/ai-attachment/ai-attachment.component';
import { AiErrorComponent } from './components/ai/ai-error/ai-error.component';
import { AiToolCallComponent } from './components/ai/ai-tool-call/ai-tool-call.component';
import { AiPermissionNoteComponent } from './components/ai/ai-permission-note/ai-permission-note.component';
import { AiSourceListComponent } from './components/ai/ai-source-list/ai-source-list.component';
import { AiConversationComponent } from './components/ai/ai-conversation/ai-conversation.component';
import { AiAnswerDocListComponent } from './components/ai/ai-answer-doc-list/ai-answer-doc-list.component';
import { AiAnswerTableComponent } from './components/ai/ai-answer-table/ai-answer-table.component';
import { AiAnswerSummaryComponent } from './components/ai/ai-answer-summary/ai-answer-summary.component';
import { AiAnswerReportComponent } from './components/ai/ai-answer-report/ai-answer-report.component';
import { AiScopeBarComponent } from './components/ai/ai-scope-bar/ai-scope-bar.component';
import { AiInlinePromptComponent } from './components/ai/ai-inline-prompt/ai-inline-prompt.component';
import { AiPanelComponent } from './components/ai/ai-panel/ai-panel.component';
import { AiThreadListComponent } from './components/ai/ai-thread-list/ai-thread-list.component';
import { AiFeedbackModalComponent } from './components/ai/ai-feedback-modal/ai-feedback-modal.component';
import { AiConsentBannerComponent } from './components/ai/ai-consent-banner/ai-consent-banner.component';
import { AiUsageMeterComponent } from './components/ai/ai-usage-meter/ai-usage-meter.component';

// ─── Re-exports ───────────────────────────────────────────────────────────────

export { ButtonComponent } from './components/button/button.component';
export type { ButtonType, ButtonSize } from './components/button/button.component';

export { TabsComponent } from './components/tabs/tabs.component';
export type { TabItem } from './components/tabs/tabs.component';

export { CardComponent } from './components/card/card.component';
export type { CardState, CardSelector } from './components/card/card.component';

export { CheckboxComponent } from './components/checkbox/checkbox.component';

export { BadgeComponent } from './components/badge/badge.component';
export type { BadgeVariant } from './components/badge/badge.component';

export { AvatarComponent } from './components/avatar/avatar.component';
export type { AvatarSize } from './components/avatar/avatar.component';

export { InfoBannerComponent } from './components/info-banner/info-banner.component';
export type { BannerVariant } from './components/info-banner/info-banner.component';

export { SafeHtmlPipe } from './pipes/safe-html.pipe';
export { FvdrIconComponent } from './icons/icon.component';
export type { FvdrIconName } from './icons/icons';

export { BREAKPOINTS, MEDIA_UP } from './breakpoints';
export type { BreakpointName } from './breakpoints';

export { InputComponent } from './components/input/input.component';
export type { InputSize, InputState } from './components/input/input.component';

export { TextareaComponent } from './components/textarea/textarea.component';
export type { TextareaState } from './components/textarea/textarea.component';

export { SearchComponent } from './components/search/search.component';

export { DatepickerComponent } from './components/datepicker/datepicker.component';
export { TimepickerComponent } from './components/timepicker/timepicker.component';
export type { TimeValue } from './components/timepicker/timepicker.component';

export { PhoneInputComponent } from './components/phone-input/phone-input.component';
export type { PhoneCountry } from './components/phone-input/phone-input.component';

export { TextEditorComponent } from './components/text-editor/text-editor.component';
export { CalendarComponent } from './components/calendar/calendar.component';

export { RadioComponent } from './components/radio/radio.component';
export type { RadioOption } from './components/radio/radio.component';

export { ToggleComponent } from './components/toggle/toggle.component';

export { SegmentComponent } from './components/segment/segment.component';
export type { SegmentItem } from './components/segment/segment.component';

export { ChipComponent } from './components/chip/chip.component';
export type { ChipVariant } from './components/chip/chip.component';

export { DropdownComponent } from './components/dropdown/dropdown.component';
export type { DropdownOption, DropdownSize } from './components/dropdown/dropdown.component';

export { DroplistComponent } from './components/droplist/droplist.component';
export type { DroplistItem } from './components/droplist/droplist.component';

export { StatusComponent, StatusButtonComponent } from './components/status/status.component';
export type { StatusVariant, StatusBtnVariant } from './components/status/status.component';

export { MultiselectComponent } from './components/multiselect/multiselect.component';
export type { MultiselectOption } from './components/multiselect/multiselect.component';

export { CounterComponent } from './components/counter/counter.component';
export type { CounterVariant, CounterSize } from './components/counter/counter.component';

export { InlineMessageComponent } from './components/inline-message/inline-message.component';
export type { InlineMessageVariant, InlineMessageSize } from './components/inline-message/inline-message.component';

export { ToastComponent, ToastHostComponent, ToastService } from './components/toast/toast.component';
export type { ToastVariant, ToastData, ToastAction } from './components/toast/toast.component';

export { ModalComponent, BottomSheetComponent } from './components/modal/modal.component';
export type { ModalSize, ModalConfig } from './components/modal/modal.component';

export { TableComponent, FvdrTableCellDirective } from './components/table/table.component';
export type { TableColumn, SortState, SortDirection } from './components/table/table.component';

export { TreeComponent } from './components/tree/tree.component';
export type { TreeNode } from './components/tree/tree.component';

export { DropAreaComponent } from './components/drop-area/drop-area.component';

export { HeaderComponent, MobileHeaderComponent } from './components/header/header.component';
export type { HeaderNavItem, HeaderAction, BreadcrumbItem } from './components/header/header.component';

export { NumberStepperComponent, ProgressComponent, RangeComponent } from './components/special-controls/special-controls.component';

export { SidebarNavComponent } from './components/sidebar-nav/sidebar-nav.component';
export type { SidebarNavItem, SidebarNavSubItem, SidebarNavVariant } from './components/sidebar-nav/sidebar-nav.component';

export { FileIconComponent } from './components/file-icon/file-icon.component';
export type { FvdrFileType } from './components/file-icon/file-icon.component';
export { PlanIconComponent, FVDR_PLAN_NAMES } from './components/plan-icon/plan-icon.component';
export type { FvdrPlanName, FvdrPlanIconSize } from './components/plan-icon/plan-icon.component';

export { QuickAccessMenuComponent } from './components/quick-access-menu/quick-access-menu.component';
export type { QuickAccessItem } from './components/quick-access-menu/quick-access-menu.component';

export { BreadcrumbsComponent } from './components/breadcrumbs/breadcrumbs.component';

export { PageHeaderComponent } from './components/page-header/page-header.component';

export { RedactionMarkCardComponent } from './components/redaction-mark-card/redaction-mark-card.component';
export type { RedactionMarkType, RedactionMarkStatus, RedactionMarkGroupBy, RedactionMarkPage } from './components/redaction-mark-card/redaction-mark-card.component';

export { GhostBtnComponent } from './components/ghost-btn/ghost-btn.component';
export type { GhostBtnSize } from './components/ghost-btn/ghost-btn.component';

export { FloatingPanelComponent } from './components/floating-panel/floating-panel.component';
export type { FloatingPanelItem, FloatingPanelOrientation, FloatingPanelSize } from './components/floating-panel/floating-panel.component';

export { FilterBtnComponent } from './components/filter-btn/filter-btn.component';
export type { FilterBtnSize, FilterBtnColor } from './components/filter-btn/filter-btn.component';

export { AskIdeonComponent } from './components/ai/ask-ideon/ask-ideon.component';

export { ThinkingOrbsComponent } from './components/ai/thinking-orbs/thinking-orbs.component';

export { AiComposerComponent } from './components/ai/ai-composer/ai-composer.component';

export { AiStepsComponent } from './components/ai/ai-steps/ai-steps.component';
export type { AiStep, AiStepKind } from './components/ai/ai-steps/ai-step.model';

export { AiBubbleComponent } from './components/ai/ai-bubble/ai-bubble.component';
export type { AiBubbleRole } from './components/ai/ai-bubble/ai-bubble.component';

export { AiCitationComponent } from './components/ai/ai-citation/ai-citation.component';
export type { AiCitationVariant } from './components/ai/ai-citation/ai-citation.component';

export { AiActionsComponent } from './components/ai/ai-actions/ai-actions.component';
export type { AiRating } from './components/ai/ai-actions/ai-actions.component';

export { AiSuggestionsComponent } from './components/ai/ai-suggestions/ai-suggestions.component';
export type { AiSuggestionsLayout, AiSuggestionsBehaviour } from './components/ai/ai-suggestions/ai-suggestions.component';

export { AiMarkdownComponent } from './components/ai/ai-markdown/ai-markdown.component';
export { parseMarkdown, parseInline } from './components/ai/ai-markdown/markdown';
export type { MdBlock, InlineSpan } from './components/ai/ai-markdown/markdown';

export { AiEmptyStateComponent } from './components/ai/ai-empty-state/ai-empty-state.component';

export { AiAttachmentComponent } from './components/ai/ai-attachment/ai-attachment.component';
export type { AiAttachmentState } from './components/ai/ai-attachment/ai-attachment.component';

export { AiErrorComponent } from './components/ai/ai-error/ai-error.component';
export type { AiErrorVariant } from './components/ai/ai-error/ai-error.component';

export { AiToolCallComponent } from './components/ai/ai-tool-call/ai-tool-call.component';
export type { AiToolCallStatus } from './components/ai/ai-tool-call/ai-tool-call.component';

export { AiPermissionNoteComponent } from './components/ai/ai-permission-note/ai-permission-note.component';

export { AiSourceListComponent } from './components/ai/ai-source-list/ai-source-list.component';

export { AiConversationComponent } from './components/ai/ai-conversation/ai-conversation.component';

export { AiAnswerDocListComponent } from './components/ai/ai-answer-doc-list/ai-answer-doc-list.component';

export { AiAnswerTableComponent } from './components/ai/ai-answer-table/ai-answer-table.component';
export type { AiAnswerTableVariant } from './components/ai/ai-answer-table/ai-answer-table.component';

export { AiAnswerSummaryComponent } from './components/ai/ai-answer-summary/ai-answer-summary.component';

export { AiAnswerReportComponent } from './components/ai/ai-answer-report/ai-answer-report.component';

export { AiScopeBarComponent } from './components/ai/ai-scope-bar/ai-scope-bar.component';

export { AiInlinePromptComponent } from './components/ai/ai-inline-prompt/ai-inline-prompt.component';

export { AiPanelComponent } from './components/ai/ai-panel/ai-panel.component';
export type { AiPanelMode } from './components/ai/ai-panel/ai-panel.component';

export { AiThreadListComponent } from './components/ai/ai-thread-list/ai-thread-list.component';

export { AiFeedbackModalComponent } from './components/ai/ai-feedback-modal/ai-feedback-modal.component';
export type { AiFeedback } from './components/ai/ai-feedback-modal/ai-feedback-modal.component';

export { AiConsentBannerComponent } from './components/ai/ai-consent-banner/ai-consent-banner.component';
export type { AiConsentVariant, AiConsentTerms } from './components/ai/ai-consent-banner/ai-consent-banner.component';

export { AiUsageMeterComponent } from './components/ai/ai-usage-meter/ai-usage-meter.component';

export { AI_SCOPE_ICON } from './components/ai/ai.models';
export type {
  AiDocRef,
  AiSummaryPoint,
  AiSummaryGroup,
  AiSeverity,
  AiFinding,
  AiReportSection,
  AiChatRole,
  AiChatMessage,
  AiThread,
  AiScopeKind,
} from './components/ai/ai.models';

/** Convenience array — spread into component imports[] */
export const DS_COMPONENTS = [
  // Original
  ButtonComponent,
  TabsComponent,
  CardComponent,
  CheckboxComponent,
  BadgeComponent,
  AvatarComponent,
  InfoBannerComponent,
  SafeHtmlPipe,
  FvdrIconComponent,
  // New
  InputComponent,
  TextareaComponent,
  SearchComponent,
  DatepickerComponent,
  TimepickerComponent,
  PhoneInputComponent,
  TextEditorComponent,
  CalendarComponent,
  RadioComponent,
  ToggleComponent,
  SegmentComponent,
  ChipComponent,
  DropdownComponent,
  DroplistComponent,
  StatusComponent,
  StatusButtonComponent,
  MultiselectComponent,
  CounterComponent,
  InlineMessageComponent,
  ToastComponent,
  ToastHostComponent,
  ModalComponent,
  BottomSheetComponent,
  TableComponent,
  FvdrTableCellDirective,
  TreeComponent,
  DropAreaComponent,
  HeaderComponent,
  MobileHeaderComponent,
  NumberStepperComponent,
  ProgressComponent,
  RangeComponent,
  SidebarNavComponent,
  FileIconComponent,
  PlanIconComponent,
  QuickAccessMenuComponent,
  BreadcrumbsComponent,
  PageHeaderComponent,
  RedactionMarkCardComponent,
  GhostBtnComponent,
  FloatingPanelComponent,
  FilterBtnComponent,
  // AI Assistant
  AskIdeonComponent,
  ThinkingOrbsComponent,
  AiComposerComponent,
  AiStepsComponent,
  AiBubbleComponent,
  AiCitationComponent,
  AiActionsComponent,
  AiSuggestionsComponent,
  AiMarkdownComponent,
  AiEmptyStateComponent,
  AiAttachmentComponent,
  AiErrorComponent,
  AiToolCallComponent,
  AiPermissionNoteComponent,
  AiSourceListComponent,
  AiConversationComponent,
  AiAnswerDocListComponent,
  AiAnswerTableComponent,
  AiAnswerSummaryComponent,
  AiAnswerReportComponent,
  AiScopeBarComponent,
  AiInlinePromptComponent,
  AiPanelComponent,
  AiThreadListComponent,
  AiFeedbackModalComponent,
  AiConsentBannerComponent,
  AiUsageMeterComponent,
];
