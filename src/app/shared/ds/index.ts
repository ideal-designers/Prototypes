/**
 * FVDR Design System — Shared Components
 *
 * Source: Figma "FVDR - Design System" (liyNDiFf1piO8SQmHNKoeU)
 * Tokens: src/app/shared/ds/tokens.css  (import in angular.json styles[])
 *
 * Available components:
 *   <fvdr-btn>          → Button (Primary/Secondary/Ghost/Danger, S/M/L)
 *   <fvdr-tabs>         → Tabs bar (with counter badge support)
 *   <fvdr-card>         → Card container (default/active/hoverable)
 *   <fvdr-checkbox>     → Checkbox (supports ngModel, indeterminate)
 *   <fvdr-badge>        → Badge/Tag (success/error/warning/info/neutral/primary)
 *   <fvdr-avatar>       → Avatar (initials or image, sm/md/lg/xl)
 *   <fvdr-info-banner>  → Info/Warning/Error/Success message banner
 *   <fvdr-icon>         → Icon from Figma DS (name: FvdrIconName). Color via CSS `color`.
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

/** Convenience array — spread into component imports[] */
export const DS_COMPONENTS = [
  ButtonComponent,
  TabsComponent,
  CardComponent,
  CheckboxComponent,
  BadgeComponent,
  AvatarComponent,
  InfoBannerComponent,
  SafeHtmlPipe,
  FvdrIconComponent,
];
