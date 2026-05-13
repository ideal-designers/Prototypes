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
 *   <fvdr-quick-access-menu>   → Quick access shortcuts panel (collapsible, active state)
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
import { QuickAccessMenuComponent } from './components/quick-access-menu/quick-access-menu.component';
import { BreadcrumbsComponent } from './components/breadcrumbs/breadcrumbs.component';

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
export type { InlineMessageVariant } from './components/inline-message/inline-message.component';

export { ToastComponent, ToastHostComponent, ToastService } from './components/toast/toast.component';
export type { ToastVariant, ToastData } from './components/toast/toast.component';

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

export { QuickAccessMenuComponent } from './components/quick-access-menu/quick-access-menu.component';
export type { QuickAccessItem } from './components/quick-access-menu/quick-access-menu.component';

export { BreadcrumbsComponent } from './components/breadcrumbs/breadcrumbs.component';

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
  QuickAccessMenuComponent,
  BreadcrumbsComponent,
];
