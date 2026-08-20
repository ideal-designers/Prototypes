/**
 * Real-product VDR replica — the host surface the AI assistant opens on top of.
 *
 * Static visual replicas of the live product pages
 * (`.design/real-product-spec.md`), rendered in FVDR tokens so they follow the
 * platform light/dark theme. Everything is inert except navigation.
 *
 * Wiring it into a host:
 *
 *   import { VDR_PRODUCT_COMPONENTS, VdrPageId } from './product';
 *
 *   \@Component({ imports: [CommonModule, ...VDR_PRODUCT_COMPONENTS], template: `
 *     <fvdr-vdr-shell
 *       [page]="page()"
 *       [rightInset]="assistantWidth()"
 *       (pageChange)="page.set($event)"
 *       (themeToggle)="conv.toggleDark()"
 *     >
 *       <ng-container [ngSwitch]="page()">
 *         <fvdr-vdr-documents *ngSwitchCase="'documents'"></fvdr-vdr-documents>
 *         ...one case per page id...
 *       </ng-container>
 *     </fvdr-vdr-shell>
 *   ` })
 *   page = signal<VdrPageId>('documents');
 *
 * Adding a page later = one entry in `product-nav.ts` + one component + one case.
 */

export { VdrShellComponent } from './vdr-shell.component';
export { VdrActionBarComponent } from './vdr-action-bar.component';
export type { VdrActionBarButton } from './vdr-action-bar.component';
export { VdrEmptyStateComponent } from './vdr-empty-state.component';

export {
  VDR_RAIL_ITEMS,
  VDR_PAGES,
  VDR_PAGE_TABS,
  railIdFor,
} from './data/product-nav';
export type { VdrPageId, VdrRailId, VdrRailItem, VdrPageMeta } from './data/product-nav';

import { VdrShellComponent } from './vdr-shell.component';
import { VdrDashboardComponent } from './pages/vdr-dashboard.component';
import { VdrDocumentsComponent } from './pages/vdr-documents.component';
import { VdrSignaturesComponent } from './pages/vdr-signatures.component';
import { VdrDdChecklistComponent } from './pages/vdr-dd-checklist.component';
import { VdrParticipantsComponent } from './pages/vdr-participants.component';
import { VdrPermissionsComponent } from './pages/vdr-permissions.component';
import { VdrQnaComponent } from './pages/vdr-qna.component';
import { VdrActivityLogComponent } from './pages/vdr-activity-log.component';
import { VdrDocumentsOverviewComponent } from './pages/vdr-documents-overview.component';
import { VdrArchivingComponent } from './pages/vdr-archiving.component';
import { VdrRecycleBinComponent } from './pages/vdr-recycle-bin.component';

export {
  VdrDashboardComponent,
  VdrDocumentsComponent,
  VdrSignaturesComponent,
  VdrDdChecklistComponent,
  VdrParticipantsComponent,
  VdrPermissionsComponent,
  VdrQnaComponent,
  VdrActivityLogComponent,
  VdrDocumentsOverviewComponent,
  VdrArchivingComponent,
  VdrRecycleBinComponent,
};

/** Spread into a host component's imports[] to get the shell and every page. */
export const VDR_PRODUCT_COMPONENTS = [
  VdrShellComponent,
  VdrDashboardComponent,
  VdrDocumentsComponent,
  VdrSignaturesComponent,
  VdrDdChecklistComponent,
  VdrParticipantsComponent,
  VdrPermissionsComponent,
  VdrQnaComponent,
  VdrActivityLogComponent,
  VdrDocumentsOverviewComponent,
  VdrArchivingComponent,
  VdrRecycleBinComponent,
];
