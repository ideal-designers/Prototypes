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
 *
 * Usage in prototype:
 *   import { DS_COMPONENTS } from '../../shared/ds';
 *
 *   @Component({
 *     imports: [CommonModule, ...DS_COMPONENTS],
 *     ...
 *   })
 */

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

/** Convenience array — spread into component imports[] */
export const DS_COMPONENTS = [
  ButtonComponent,
  TabsComponent,
  CardComponent,
  CheckboxComponent,
  BadgeComponent,
  AvatarComponent,
  InfoBannerComponent,
] as const;
