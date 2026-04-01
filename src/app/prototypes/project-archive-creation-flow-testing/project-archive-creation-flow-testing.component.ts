import { Component, OnInit, OnDestroy, inject, Pipe, PipeTransform } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TrackerService } from '../../services/tracker.service';
import { DS_COMPONENTS, ToastService } from '../../shared/ds';
import type { RadioOption, DropdownOption, FvdrIconName } from '../../shared/ds';

@Pipe({ name: 'initials', standalone: true })
export class InitialsPipe implements PipeTransform {
  transform(name: string): string {
    return name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }
}

const SLUG = 'project-archive-creation-flow-testing';

type AppView = 'main' | 'order';

interface NavItem {
  id: string;
  label: string;
  icon: FvdrIconName;
  iconActive: FvdrIconName;
  active?: boolean;
  children?: { label: string; active?: boolean }[];
  open?: boolean;
}

interface Archive {
  id: number;
  name: string;
  documents: string;
  selectedGroup: string;
  selectedFolders: string[];
  includeRecycleBin: boolean;
  reports: string;
  includeQA: boolean;
}

interface Recipient {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  company: string;
  country: string;
  city: string;
  postalCode: string;
  address: string;
  usbCounts: { [archiveId: number]: number };
}

function freshArchiveForm() {
  return { name: '', documents: 'all', selectedGroup: '', selectedFolders: [] as string[], includeRecycleBin: false, reports: 'all', includeQA: false };
}

function freshRecipientForm() {
  return { email: '', fullName: '', phone: '', company: '', country: 'Luxembourg', city: '', postalCode: '', address: '' };
}

@Component({
  selector: 'fvdr-project-archive-creation-flow-testing',
  standalone: true,
  imports: [CommonModule, FormsModule, InitialsPipe, ...DS_COMPONENTS],
  template: `
    <div class="shell">

      <!-- ── Sidebar ── -->
      <nav class="sidebar" [class.sidebar--collapsed]="sidebarCollapsed">

        <!-- Project switcher -->
        <div class="account-switcher">
          <div class="account-switcher-left">
            <div class="account-logo">PA</div>
            <span class="account-name" *ngIf="!sidebarCollapsed">Project Alpha</span>
          </div>
          <fvdr-icon *ngIf="!sidebarCollapsed" name="chevron-down" class="account-chevron"></fvdr-icon>
        </div>

        <!-- Nav list -->
        <div class="nav-list">
          <div class="nav-group" *ngFor="let item of navItems">
            <button class="nav-item"
                    [class.nav-item--active]="item.active"
                    [class.nav-item--open]="item.open"
                    [class.nav-item--has-chevron]="item.children && !sidebarCollapsed"
                    [title]="sidebarCollapsed ? item.label : ''"
                    (click)="toggleNavItem(item)">
              <span class="nav-icon-zone">
                <span class="nav-icon">
                  <fvdr-icon class="icon-default" [name]="item.icon"></fvdr-icon>
                  <fvdr-icon class="icon-active" [name]="item.iconActive"></fvdr-icon>
                </span>
              </span>
              <span class="nav-label" *ngIf="!sidebarCollapsed">{{ item.label }}</span>
              <fvdr-icon *ngIf="!sidebarCollapsed && item.children" name="chevron-down"
                         class="nav-chevron" [class.nav-chevron--up]="item.open"></fvdr-icon>
            </button>
            <div *ngIf="!sidebarCollapsed && item.open && item.children" class="nav-subitems">
              <button *ngFor="let child of item.children" class="nav-subitem"
                      [class.nav-subitem--active]="child.active">{{ child.label }}</button>
            </div>
          </div>
        </div>

        <!-- Footer: ideals. + collapse -->
        <div class="sidebar-bottom">
          <div class="sidebar-logo" *ngIf="!sidebarCollapsed">
            <svg width="87" height="18" viewBox="0 0 117 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0.381 3.023C0.381 1.676 1.471 0.65 2.85 0.65C4.196 0.65 5.254 1.676 5.254 3.023C5.254 4.402 4.196 5.396 2.85 5.396C1.439 5.396 0.381 4.402 0.381 3.023ZM0.862 22.967V7.255H4.677V22.967H0.862Z" fill="#1F2129"/>
              <path d="M23.243 1.003V22.999H19.523V20.947C18.369 22.326 16.734 23.384 14.457 23.384C9.936 23.384 6.569 19.825 6.569 15.143C6.569 10.526 9.968 6.935 14.425 6.935C16.669 6.935 18.273 7.961 19.427 9.308V1.003H23.243ZM19.651 15.111C19.651 12.514 17.824 10.334 15.002 10.334C12.213 10.334 10.385 12.514 10.385 15.111C10.385 17.773 12.213 19.921 15.002 19.921C17.792 19.921 19.651 17.773 19.651 15.111Z" fill="#1F2129"/>
              <path d="M40.974 16.458H28.886C29.367 18.478 30.842 20.081 33.728 20.081C35.523 20.081 37.576 19.408 38.954 18.446L40.461 21.139C38.986 22.23 36.453 23.32 33.567 23.32C27.603 23.32 24.974 19.28 24.974 15.111C24.974 10.43 28.277 6.903 33.215 6.903C37.672 6.903 41.071 9.821 41.071 14.791C41.103 15.432 41.039 15.945 40.974 16.458ZM28.886 13.604H37.351C37.030 11.392 35.395 10.045 33.215 10.045C31.034 10.045 29.399 11.424 28.886 13.604Z" fill="#1F2129"/>
              <path d="M59.187 7.287V22.967H55.564V21.043C54.377 22.39 52.678 23.352 50.401 23.352C45.816 23.352 42.546 19.696 42.546 15.047C42.546 10.334 45.880 6.903 50.401 6.903C52.678 6.903 54.345 7.929 55.564 9.275V7.287H59.187ZM55.660 15.111C55.660 12.514 53.768 10.334 50.979 10.334C48.189 10.334 46.329 12.514 46.329 15.111C46.329 17.741 48.189 19.921 50.979 19.921C53.736 19.921 55.660 17.741 55.660 15.111Z" fill="#1F2129"/>
              <path d="M61.592 22.967V1.003H65.376V22.999H61.592V22.967Z" fill="#1F2129"/>
              <path d="M66.947 20.274L69.095 17.965C70.185 19.376 71.821 20.177 73.360 20.177C74.739 20.177 75.700 19.44 75.700 18.542C75.700 17.869 75.252 17.420 74.514 17.035C73.616 16.586 71.564 15.913 70.570 15.400C68.775 14.534 67.909 13.123 67.909 11.392C67.909 8.698 70.153 6.742 73.680 6.742C75.700 6.742 77.688 7.448 79.131 9.051L77.143 11.456C76.021 10.302 74.674 9.821 73.584 9.821C72.366 9.821 71.660 10.494 71.660 11.296C71.660 11.841 72.013 12.450 73.039 12.835C74.065 13.251 75.604 13.764 76.855 14.406C78.618 15.336 79.548 16.554 79.548 18.414C79.548 21.203 77.143 23.384 73.392 23.384C70.859 23.384 68.454 22.358 66.947 20.274Z" fill="#1F2129"/>
              <path d="M80.510 21.171C80.510 19.921 81.536 18.959 82.819 18.959C84.037 18.959 85.031 19.921 85.031 21.171C85.031 22.486 84.037 23.416 82.819 23.416C81.536 23.448 80.510 22.486 80.510 21.171Z" fill="#1F2129"/>
            </svg>
          </div>
          <button class="collapse-btn" (click)="sidebarCollapsed = !sidebarCollapsed">
            <fvdr-icon [name]="sidebarCollapsed ? 'angle-double-right' : 'angle-double-left'"></fvdr-icon>
          </button>
        </div>
      </nav>

      <!-- ── Main ── -->
      <div class="main">

        <!-- Header -->
        <header class="top-bar">
          <nav class="breadcrumb" aria-label="breadcrumb">
            <button class="bc-item"
                    [class.bc-item--link]="view === 'order'"
                    [class.bc-item--current]="view === 'main'"
                    [disabled]="view === 'main'"
                    (click)="view === 'order' && cancelOrder()">
              Project archiving
              <fvdr-icon *ngIf="view === 'order'" name="chevron-right" class="bc-chevron bc-chevron--dim"></fvdr-icon>
            </button>
            <button *ngIf="view === 'order'" class="bc-item bc-item--current">
              Place order
            </button>
          </nav>
          <div class="hdr-actions">
            <button class="ic-btn"><fvdr-icon name="theme-dark"></fvdr-icon></button>
            <button class="ic-btn"><fvdr-icon name="help"></fvdr-icon></button>
            <fvdr-avatar initials="IR" size="lg" color="var(--color-selection-bg)" textColor="var(--color-text-primary)"></fvdr-avatar>
          </div>
        </header>

        <!-- ══ VIEW: MAIN ══ -->
        <div class="content" *ngIf="view === 'main'">
          <section class="section" data-track="usb-drive-section">
            <div class="sec-hdr">
              <h2 class="sec-title">USB drive</h2>
              <button class="action-btn action-btn--green" data-track="place-order" (click)="goToOrder()">
                <fvdr-icon name="flash-drive"></fvdr-icon> Place order
              </button>
            </div>
            <ul class="bullet-list">
              <li>Each USB drive is encrypted, password- and write-protected.</li>
              <li>Comfort letter is provided for each recipient.</li>
              <li>Estimated delivery date to Luxembourg: Sep 20, 2023</li>
            </ul>
          </section>
          <hr class="divider"/>
          <section class="section" data-track="project-closure-section">
            <div class="sec-hdr">
              <h2 class="sec-title">Project closure</h2>
              <button class="action-btn action-btn--red" data-track="close-project" (click)="onCloseProject()">
                <fvdr-icon name="cancel"></fvdr-icon> Close project
              </button>
            </div>
            <p class="sec-desc">Access will be terminated on the selected time for all participants, including administrators</p>
          </section>
        </div>

        <!-- ══ VIEW: ORDER ══ -->
        <div class="order-wrap" *ngIf="view === 'order'">
          <div class="order-cols">

            <!-- Archives column -->
            <div class="col">
              <div class="col-hdr">Archives</div>
              <div class="col-body">

                <!-- Subtitle -->
                <p class="col-hint" *ngIf="archives.length === 0 && !archiveFormOpen">Create the archive that will be adding to a USB drive</p>

                <!-- Archive cards -->
                <div class="arch-card" *ngFor="let arch of archives">
                  <div class="arch-card__icon-wrap">
                    <fvdr-icon name="nav-archiving" class="arch-card__icon"></fvdr-icon>
                  </div>
                  <div class="arch-card__body">
                    <div class="arch-card__title">{{ arch.name }}</div>
                    <div class="arch-card__rows">
                      <div class="arch-card__row"><b>Documents:</b> {{ docLabel(arch) }}</div>
                      <div class="arch-card__row"><b>Recycle bin:</b> {{ arch.includeRecycleBin ? 'Include' : 'Exclude' }}</div>
                      <div class="arch-card__row"><b>Reports:</b> {{ reportsLabel(arch.reports) }}</div>
                      <div class="arch-card__row"><b>Q&amp;A contents:</b> {{ arch.includeQA ? 'Include' : 'Exclude' }}</div>
                    </div>
                  </div>
                  <div class="arch-card__actions">
                    <button class="card-ic-btn" (click)="deleteArchive(arch.id)" title="Delete"><fvdr-icon name="trash"></fvdr-icon></button>
                    <button class="card-ic-btn" (click)="duplicateArchive(arch)" title="Duplicate"><fvdr-icon name="copy"></fvdr-icon></button>
                    <button class="card-ic-btn" (click)="editArchive(arch)" title="Edit"><fvdr-icon name="edit"></fvdr-icon></button>
                  </div>
                </div>

                <!-- Archive form -->
                <div class="arch-form" *ngIf="archiveFormOpen">
                  <div class="arch-form__title">{{ editingArchiveId !== null ? archiveForm.name : ('Archive ' + (archives.length + 1)) }}</div>

                  <div class="field">
                    <label class="field-lbl">Name</label>
                    <fvdr-input [(ngModel)]="archiveForm.name" [placeholder]="'Archive ' + (archives.length + 1)"></fvdr-input>
                  </div>

                  <div class="field">
                    <label class="field-lbl">Documents</label>
                    <fvdr-radio [options]="docOptions" [value]="archiveForm.documents" layout="horizontal"
                                (valueChange)="onDocumentsChange($event)"></fvdr-radio>

                    <!-- Group dropdown (viewpoint) -->
                    <div *ngIf="archiveForm.documents === 'viewpoint'" class="doc-extra">
                      <fvdr-dropdown
                        [options]="groupOptions"
                        [value]="archiveForm.selectedGroup"
                        placeholder="Select group"
                        (valueChange)="archiveForm.selectedGroup = asString($event)">
                      </fvdr-dropdown>
                    </div>

                    <!-- Folders popover trigger (selected folders) -->
                    <div *ngIf="archiveForm.documents === 'selected'" class="doc-extra" style="position:relative">
                      <button class="folders-trigger" (click)="foldersPopoverOpen = !foldersPopoverOpen">
                        <fvdr-icon name="folder" style="font-size:16px"></fvdr-icon>
                        <span>{{ archiveForm.selectedFolders.length ? archiveForm.selectedFolders.length + ' folder(s) selected' : 'Select folders' }}</span>
                        <fvdr-icon name="chevron-down" style="font-size:14px;margin-left:auto"></fvdr-icon>
                      </button>
                      <div class="folders-popover" *ngIf="foldersPopoverOpen">
                        <div class="folders-popover__header">
                          <span class="folders-popover__title">Select folders</span>
                          <button class="folders-popover__close" (click)="foldersPopoverOpen = false">
                            <fvdr-icon name="close" style="font-size:16px"></fvdr-icon>
                          </button>
                        </div>
                        <div class="folders-popover__list">
                          <label class="folder-row" *ngFor="let f of SAMPLE_FOLDERS">
                            <input type="checkbox" [value]="f.value"
                                   [checked]="archiveForm.selectedFolders.includes(f.value)"
                                   (change)="toggleFolder(f.value, $event)">
                            <fvdr-icon name="folder" style="font-size:16px;color:var(--color-text-secondary)"></fvdr-icon>
                            <span>{{ f.label }}</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="field field--row">
                    <label class="field-lbl" style="margin-right: 16px; font-size: var(--font-size-md); font-weight: 600; color: var(--color-text-primary);">Include recycle bin</label>
                    <fvdr-toggle [checked]="archiveForm.includeRecycleBin"
                                 (checkedChange)="archiveForm.includeRecycleBin = $event"></fvdr-toggle>
                  </div>

                  <div class="field">
                    <label class="field-lbl">Reports</label>
                    <fvdr-dropdown [options]="reportsOptions" [value]="archiveForm.reports"
                                   (valueChange)="archiveForm.reports = asString($event)"></fvdr-dropdown>
                    <span class="field-hint">Reports will include only the data and activity related to the selected user group.</span>
                  </div>

                  <div class="field field--row">
                    <label class="field-lbl" style="margin-right: 16px; font-size: var(--font-size-md); font-weight: 600; color: var(--color-text-primary);">Include Q&amp;A contents</label>
                    <fvdr-toggle [checked]="archiveForm.includeQA"
                                 (checkedChange)="archiveForm.includeQA = $event"></fvdr-toggle>
                  </div>

                  <div class="arch-form__footer">
                    <button class="link-btn link-btn--red" (click)="cancelArchiveForm()">
                      <fvdr-icon name="trash"></fvdr-icon> Delete
                    </button>
                    <div class="arch-form__footer-right">
                      <fvdr-btn variant="secondary" label="Add and duplicate" [icon]="COPY_ICON"
                                (clicked)="addAndDuplicateArchive()"></fvdr-btn>
                      <fvdr-btn label="Add" size="m" (clicked)="addArchive()"></fvdr-btn>
                    </div>
                  </div>
                </div>

                <!-- Add archive button -->
                <fvdr-btn *ngIf="!archiveFormOpen" variant="secondary" size="s"
                          label="Archive" [icon]="PLUS_ICON"
                          (clicked)="openArchiveForm()"></fvdr-btn>

              </div>
            </div>

            <!-- Recipients column -->
            <div class="col col--recipients">
              <div class="col-hdr">Recipients</div>
              <div class="col-body">

                <!-- Hint (empty state only) -->
                <p class="col-hint" *ngIf="recipients.length === 0 && !recipientFormOpen">Add recipient or order USB drive with archive for yourself</p>

                <!-- Recipient cards -->
                <div class="recip-card" *ngFor="let r of recipients">
                  <div class="recip-card__icon-wrap">
                    <div class="recip-card__icon-btn">
                      <fvdr-icon name="participants" style="font-size:20px;color:var(--color-icon)"></fvdr-icon>
                    </div>
                  </div>
                  <div class="recip-card__body">
                    <div class="recip-card__info">
                      <strong>{{ r.fullName }}</strong>
                      <span class="recip-card__sub"><b>Estimated delivery:</b> Sep 20, 2023 to {{ r.country }}</span>
                    </div>
                    <div class="recip-card__details">
                      <div class="recip-arch-row" *ngFor="let arch of archives">
                        <span class="recip-arch-name">{{ arch.name }}</span>
                        <div class="usb-group">
                          <fvdr-icon name="storage" class="usb-ic"></fvdr-icon>
                          <span class="usb-label">USB drives</span>
                          <div class="usb-stepper">
                            <button class="usb-btn" (click)="decUsb(r, arch.id)"><fvdr-icon name="chevron-left"></fvdr-icon></button>
                            <div class="usb-input">{{ r.usbCounts[arch.id] || 1 }}</div>
                            <button class="usb-btn" (click)="incUsb(r, arch.id)"><fvdr-icon name="chevron-right"></fvdr-icon></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Recipient form -->
                <div class="recip-form" *ngIf="recipientFormOpen">
                  <div class="field">
                    <label class="field-lbl">Email</label>
                    <fvdr-input [(ngModel)]="recipientForm.email" placeholder="Enter email" type="email"></fvdr-input>
                  </div>
                  <div class="field">
                    <label class="field-lbl">Full name</label>
                    <fvdr-input [(ngModel)]="recipientForm.fullName" placeholder="Enter full name" iconLeft="participants"></fvdr-input>
                  </div>
                  <div class="field">
                    <label class="field-lbl">Phone number</label>
                    <fvdr-phone-input [(ngModel)]="recipientForm.phone"></fvdr-phone-input>
                  </div>
                  <div class="field">
                    <label class="field-lbl">Company</label>
                    <fvdr-input [(ngModel)]="recipientForm.company" placeholder="Enter company name"></fvdr-input>
                  </div>
                  <div class="field-row">
                    <div class="field field--grow">
                      <label class="field-lbl">Country</label>
                      <fvdr-dropdown [options]="countryOptions" [value]="recipientForm.country"
                                     (valueChange)="recipientForm.country = asString($event)"></fvdr-dropdown>
                      <span class="field-hint">The archive will include only the information available to the selected user group.</span>
                    </div>
                    <div class="field">
                      <label class="field-lbl">Estimated delivery</label>
                      <span class="est-date">Sep 20, 2023</span>
                    </div>
                  </div>
                  <div class="field-row">
                    <div class="field field--grow">
                      <label class="field-lbl">City</label>
                      <fvdr-input [(ngModel)]="recipientForm.city" placeholder="London"></fvdr-input>
                    </div>
                    <div class="field">
                      <label class="field-lbl">Postal/ZIP code</label>
                      <fvdr-input [(ngModel)]="recipientForm.postalCode" placeholder="000000"></fvdr-input>
                    </div>
                  </div>
                  <div class="field">
                    <label class="field-lbl">Address</label>
                    <fvdr-input [(ngModel)]="recipientForm.address" placeholder="Street, building, unit, suite, apartment, floor, etc."></fvdr-input>
                    <span class="field-hint">Indicate a physical address, not a PO box, as the recipient must sign for the package</span>
                  </div>

                  <div class="recip-form__footer">
                    <button class="link-btn link-btn--red" (click)="cancelRecipientForm()">
                      <fvdr-icon name="trash"></fvdr-icon> Delete
                    </button>
                    <fvdr-btn label="Add" size="m" (clicked)="addRecipient()"></fvdr-btn>
                  </div>
                </div>

                <!-- Add recipient button (below cards) -->
                <div class="recip-add-row" *ngIf="!recipientFormOpen">
                  <fvdr-btn variant="secondary" size="s"
                            label="Recipient" [icon]="PLUS_ICON"
                            (clicked)="openRecipientForm()"></fvdr-btn>
                  <fvdr-btn *ngIf="recipients.length === 0" variant="link" size="s"
                            label="I am the recipient"
                            (clicked)="iAmRecipient()"></fvdr-btn>
                </div>

              </div>
            </div>

          </div>

          <!-- Order footer -->
          <div class="order-footer">
            <fvdr-btn label="Cancel" variant="ghost" (clicked)="cancelOrder()"></fvdr-btn>
            <fvdr-btn label="Confirm" (clicked)="openConfirmModal()" [disabled]="archives.length === 0 || recipients.length === 0"></fvdr-btn>
          </div>
        </div>

      </div><!-- /main -->

      <!-- ── Confirm order modal ── -->
      <div class="overlay" *ngIf="confirmModalOpen" (click)="confirmModalOpen = false">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal__hdr">
            <span class="modal__title">Confirm order</span>
            <button class="modal__close" (click)="confirmModalOpen = false">
              <fvdr-icon name="close"></fvdr-icon>
            </button>
          </div>
          <div class="modal__body">
            <label class="field-lbl">Specific requirements (optional)</label>
            <textarea class="modal__textarea" [(ngModel)]="specificRequirements"
                      placeholder="Enter your specific requirements"
                      maxlength="1000"></textarea>
            <span class="char-count">{{ specificRequirements.length }}/1000</span>
          </div>
          <div class="modal__footer">
            <fvdr-btn label="Cancel" variant="ghost" (clicked)="confirmModalOpen = false"></fvdr-btn>
            <fvdr-btn label="Order" (clicked)="placeOrder()"></fvdr-btn>
          </div>
        </div>
      </div>

      <!-- Chat bubble -->
      <div class="chat-bubble">
        <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" fill="white"/>
        </svg>
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; overflow: hidden; }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    .shell {
      display: flex; height: 100vh;
      font-family: var(--font-family, 'Open Sans', sans-serif);
      background: var(--color-bg-page); overflow: hidden; position: relative;
    }

    /* ── Sidebar ── */
    .sidebar {
      width: 280px; min-width: 280px; height: 100%;
      background: var(--color-bg-surface); border-right: 1px solid var(--color-border-subtle);
      display: flex; flex-direction: column; overflow: hidden;
      transition: width 0.22s ease, min-width 0.22s ease; flex-shrink: 0;
    }
    .sidebar--collapsed { width: 72px; min-width: 72px; }

    .account-switcher {
      min-height: 64px; background: var(--color-bg-surface);
      display: flex; align-items: center; padding: 12px 16px; gap: 16px;
      cursor: pointer; overflow: hidden; flex-shrink: 0; justify-content: space-between;
    }
    .account-switcher:hover { background: var(--color-hover-light); }
    .account-switcher-left { display: flex; align-items: center; gap: 16px; }
    .account-logo {
      width: 40px; height: 40px; min-width: 40px; border-radius: 4px; flex-shrink: 0;
      background: var(--color-brand-orange); display: flex; align-items: center; justify-content: center;
      font-size: var(--font-size-lg); font-weight: 400; color: white;
    }
    .account-name { font-size: var(--font-size-lg); font-weight: 600; color: var(--color-text-primary); white-space: nowrap; overflow: hidden; }
    .account-chevron { flex-shrink: 0; font-size: var(--font-size-lg); color: var(--color-icon); }

    .nav-list { display: flex; flex-direction: column; flex: 1; overflow-y: auto; padding: 24px 0 8px; gap: 24px; }
    .nav-group { display: flex; flex-direction: column; }

    .nav-item {
      width: 100%; height: 32px; min-height: 32px;
      border: none; background: transparent; color: var(--color-interactive-secondary);
      cursor: pointer; display: flex; align-items: center;
      font-size: var(--font-size-lg); font-weight: 400; font-family: var(--font-family, 'Open Sans', sans-serif);
      text-align: left; white-space: nowrap; overflow: hidden;
      padding-right: 24px;
    }
    .nav-item--has-chevron { padding-right: 0; }
    .icon-active { display: none; }
    .nav-item:hover { font-weight: 600; }
    .nav-item:hover .icon-default { display: none; }
    .nav-item:hover .icon-active  { display: inline-flex; }
    .nav-item--active { color: var(--color-text-primary); font-weight: 600; }
    .nav-item--open   { color: var(--color-text-primary); font-weight: 600; }
    .nav-item--active .icon-default,
    .nav-item--open   .icon-default { display: none; }
    .nav-item--active .icon-active,
    .nav-item--open   .icon-active  { display: inline-flex; }

    .nav-icon-zone {
      width: 72px; min-width: 72px; height: 32px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .nav-icon { display: flex; align-items: center; justify-content: center; color: var(--color-icon); font-size: 24px; }
    .nav-label { flex: 1; }
    .nav-chevron { flex-shrink: 0; margin-right: 16px; transition: transform 0.2s; font-size: var(--font-size-lg); color: var(--color-icon); }
    .nav-chevron--up { transform: rotate(180deg); }

    .nav-subitems { display: flex; flex-direction: column; }
    .nav-subitem {
      height: 32px; padding: 0 16px 0 72px;
      border: none; background: transparent; cursor: pointer;
      font-size: var(--font-size-base); font-weight: 400; color: var(--color-text-primary);
      font-family: var(--font-family, 'Open Sans', sans-serif);
      text-align: left; white-space: nowrap;
    }
    .nav-subitem:hover { font-weight: 600; }
    .nav-subitem--active { font-weight: 600; color: var(--color-interactive-primary); }

    .sidebar-bottom {
      height: 72px; min-height: 72px; background: var(--color-bg-surface);
      display: flex; align-items: center; padding: 0 16px 0 24px;
      justify-content: space-between; overflow: hidden; flex-shrink: 0;
    }
    .sidebar-logo { display: flex; align-items: center; overflow: hidden; }
    .collapse-btn {
      width: 32px; height: 32px; min-width: 32px;
      border: none; background: transparent; cursor: pointer; border-radius: 4px;
      display: flex; align-items: center; justify-content: center;
      font-size: var(--font-size-lg); color: var(--color-icon); margin-left: auto;
    }
    .collapse-btn:hover { background: #e8e8e8; }

    /* ── Main ── */
    .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

    .top-bar {
      height: 64px; min-height: 64px; background: white; border-bottom: 1px solid var(--color-border-subtle);
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 24px; flex-shrink: 0;
    }
    .breadcrumb { display: flex; align-items: center; gap: 0; }
    .bc-item {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 8px 8px; background: none; border: none; cursor: pointer;
      font-family: var(--font-family, 'Open Sans', sans-serif);
      font-size: var(--font-size-md); font-weight: 600; line-height: 20px;
    }
    .bc-item--link { color: var(--color-icon); }
    .bc-item--link:hover { color: var(--color-interactive-primary); }
    .bc-item--current { color: var(--color-text-primary); cursor: default; }
    .bc-chevron { font-size: var(--font-size-lg); }
    .bc-chevron--dim { color: var(--color-border-input); }
    .hdr-actions { display: flex; align-items: center; gap: 24px; }
    .ic-btn { background: none; border: none; cursor: pointer; padding: 0; display: flex; align-items: center; font-size: var(--font-size-2xl); color: var(--color-icon); transition: color 0.12s; }
    .ic-btn:hover { color: var(--color-text-primary); }

    /* ── Main view ── */
    .content { flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; }
    .section { display: flex; flex-direction: column; gap: 16px; padding-bottom: 24px; max-width: 632px; }
    .sec-hdr { display: flex; align-items: center; justify-content: space-between; }
    .sec-title { font-size: var(--font-size-lg); font-weight: 600; color: var(--color-text-primary); line-height: 24px; }
    .action-btn {
      display: flex; align-items: center; gap: 8px; background: none; border: none; cursor: pointer;
      font-size: var(--font-size-md); font-weight: 400; font-family: inherit; padding: 0; line-height: 1; transition: opacity 0.12s;
    }
    .action-btn:hover { opacity: 0.75; }
    .action-btn fvdr-icon { font-size: var(--font-size-lg); flex-shrink: 0; }
    .action-btn--green { color: var(--color-interactive-primary); }
    .action-btn--red { color: var(--color-danger); }
    .bullet-list { padding-left: 22px; }
    .bullet-list li { font-size: var(--font-size-md); color: var(--color-text-primary); line-height: 24px; list-style: disc; }
    .divider { height: 1px; border: none; background: var(--color-border-subtle); max-width: 632px; margin-bottom: 24px; }
    .sec-desc { font-size: var(--font-size-md); color: var(--color-text-primary); line-height: 24px; }

    /* ── Order view ── */
    .order-wrap { flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden; }
    .order-cols { flex: 1; min-height: 0; display: flex; gap: 32px; padding: 24px; border-bottom: 1px solid var(--color-border-subtle); overflow: hidden; }
    .col { display: flex; flex-direction: column; flex: 1; min-width: 0; min-height: 0; overflow: hidden; }
    .col--recipients { flex: 0 0 544px; width: 544px; min-height: 0; overflow: hidden; }
    .col-hdr {
      background: var(--color-bg-surface); height: 48px; min-height: 48px;
      display: flex; align-items: center; padding: 0 16px;
      font-size: var(--font-size-base); font-weight: 600; color: var(--color-text-primary);
      border-radius: 4px 4px 0 0; flex-shrink: 0;
    }
    .col-body { display: flex; flex-direction: column; align-items: flex-start; gap: 16px; padding: 16px 0; flex: 1; overflow-y: auto; min-height: 0; }

    .arch-card, .arch-form, .recip-card, .recip-form, .col-hint, .recip-add-row { align-self: stretch; }

    /* Archive card */
    .arch-card {
      height: 168px; flex-shrink: 0;
      display: flex; align-items: stretch;
      border: 1px solid var(--color-border-subtle); border-radius: 4px; overflow: hidden;
      position: relative; transition: background 0.12s; background: white;
    }
    .arch-card:hover .arch-card__actions { opacity: 1; }
    .arch-card__icon-wrap {
      background: var(--color-bg-surface); display: flex; align-items: flex-start; justify-content: center;
      padding: 16px 8px 8px; flex-shrink: 0; width: 56px;
    }
    .arch-card__icon { font-size: 24px; color: var(--color-icon); }
    .arch-card__body {
      flex: 1; display: flex; flex-direction: column; gap: 8px;
      padding: 16px 16px 16px 16px;
    }
    .arch-card__title { font-size: var(--font-size-xl); font-weight: 600; color: var(--color-text-primary); line-height: 24px; }
    .arch-card__rows { display: flex; flex-direction: column; gap: 8px; }
    .arch-card__row { display: flex; gap: 8px; font-size: var(--font-size-base); color: var(--color-text-primary); line-height: 20px; }
    .arch-card__row b { font-weight: 600; white-space: nowrap; }
    .arch-card__actions {
      display: flex; gap: 4px; opacity: 0; transition: opacity 0.12s;
      position: absolute; top: 8px; right: 8px;
    }
    .card-ic-btn { background: none; border: none; cursor: pointer; padding: 4px; font-size: var(--font-size-lg); color: var(--color-icon); border-radius: 4px; transition: color 0.12s, background 0.12s; display: flex; }
    .card-ic-btn:hover { color: var(--color-text-primary); background: var(--color-hover-bg); }

    /* Archive form */
    .arch-form {
      border: 1px solid var(--color-border-subtle); border-radius: 4px; padding: 16px;
      display: flex; flex-direction: column; gap: 16px; background: white;
    }
    .arch-form__title { font-size: var(--font-size-lg); font-weight: 600; color: var(--color-text-primary); line-height: 24px; }
    .arch-form__footer { display: flex; align-items: center; justify-content: space-between; padding-top: 4px; }
    .arch-form__footer-right { display: flex; align-items: center; gap: 16px; }

    /* Documents extra controls */
    .doc-extra { margin-top: 8px; }
    .folders-trigger {
      display: flex; align-items: center; gap: 8px;
      width: 100%; padding: 0 12px; height: 40px;
      border: 1px solid var(--color-border-subtle); border-radius: 4px;
      background: white; cursor: pointer; font-size: var(--font-size-base);
      color: var(--color-text-primary); text-align: left;
    }
    .folders-trigger:hover { border-color: var(--color-border-input); }
    .folders-popover {
      position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 100;
      background: white; border: 1px solid var(--color-border-subtle); border-radius: 6px;
      box-shadow: 0 4px 16px rgba(0,0,0,.12);
    }
    .folders-popover__header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 16px; border-bottom: 1px solid var(--color-border-subtle);
    }
    .folders-popover__title { font-size: var(--font-size-base); font-weight: 600; color: var(--color-text-primary); }
    .folders-popover__close { background: none; border: none; cursor: pointer; padding: 2px; color: var(--color-text-secondary); display: flex; }
    .folders-popover__list { display: flex; flex-direction: column; max-height: 220px; overflow-y: auto; padding: 8px 0; }
    .folder-row {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 16px; cursor: pointer; font-size: var(--font-size-base); color: var(--color-text-primary);
    }
    .folder-row:hover { background: var(--color-bg-surface); }
    .folder-row input[type="checkbox"] { width: 16px; height: 16px; cursor: pointer; accent-color: var(--color-interactive-primary); }

    /* Recipient card */
    .recip-card {
      flex-shrink: 0;
      border: 1px solid var(--color-border-subtle); border-radius: 4px; overflow: hidden;
      display: flex; align-items: stretch; background: white;
    }
    .recip-card__icon-wrap {
      background: var(--color-bg-surface); display: flex; align-items: center; justify-content: center;
      padding: 8px; flex-shrink: 0;
    }
    .recip-card__icon-btn {
      width: 40px; height: 40px; border-radius: 4px;
      display: flex; align-items: center; justify-content: center;
    }
    .recip-card__body {
      flex: 1; display: flex; flex-direction: column; gap: 12px;
      padding: 16px 16px 16px 16px; min-width: 0;
    }
    .recip-card__info { display: flex; flex-direction: column; gap: 0; }
    .recip-card__info strong { font-size: var(--font-size-xl); font-weight: 600; color: var(--color-text-primary); line-height: 24px; }
    .recip-card__sub { font-size: var(--font-size-base); color: var(--color-text-primary); line-height: 20px; }
    .recip-card__sub b { font-weight: 600; }
    .recip-card__details { display: flex; flex-direction: column; gap: 0; }
    .recip-arch-row {
      display: flex; align-items: center; gap: 16px;
      font-size: var(--font-size-base); color: var(--color-text-primary); line-height: 20px;
      background: var(--color-bg-subtle); border-radius: 4px; padding: 8px 12px;
    }
    .recip-arch-name { flex: 1; font-size: var(--font-size-base); font-weight: 600; color: var(--color-text-primary); }
    .usb-group { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
    .usb-ic { font-size: var(--font-size-lg); color: var(--color-icon); flex-shrink: 0; }
    .usb-label { font-size: var(--font-size-base); color: var(--color-text-primary); white-space: nowrap; }
    .usb-stepper { display: flex; align-items: center; gap: 0; }
    .usb-btn { background: none; border: none; cursor: pointer; padding: 0; width: 20px; height: 20px; font-size: var(--font-size-base); color: var(--color-icon); display: flex; align-items: center; justify-content: center; }
    .usb-btn:hover { color: var(--color-text-primary); }
    .usb-input {
      width: 40px; height: 32px; border: 1px solid var(--color-border-input); border-radius: 4px;
      font-size: var(--font-size-base); color: var(--color-text-primary); text-align: center;
      display: flex; align-items: center; justify-content: center;
      background: white; font-family: inherit;
    }

    /* Recipient form */
    .recip-form { border: 1px solid var(--color-border-subtle); border-radius: 8px; padding: 16px; display: flex; flex-direction: column; gap: 14px; }
    .recip-form__footer { display: flex; align-items: center; justify-content: space-between; padding-top: 4px; }

    .col-hint { font-size: var(--font-size-base); color: var(--color-text-primary); line-height: 20px; flex-shrink: 0; }
    .recip-add-row { display: flex; align-items: center; gap: 16px; flex-shrink: 0; }

    /* Delete link buttons (red text, no bg — DS "link danger" style) */
    .link-btn {
      background: none; border: none; cursor: pointer; padding: 0;
      font-family: inherit; display: flex; align-items: center; gap: 8px;
      font-size: var(--font-size-base); transition: opacity 0.12s;
    }
    .link-btn:hover { opacity: 0.75; }
    .link-btn--red { color: var(--color-danger); }
    .link-btn fvdr-icon { font-size: var(--font-size-lg); }

    /* Fields */
    .field { display: flex; flex-direction: column; gap: 4px; }
    .field--grow { flex: 1; }
    .field--row { flex-direction: row; align-items: center; gap: 16px; }
    .field-row { display: flex; gap: 12px; }
    .field-lbl { font-size: var(--font-size-md); font-weight: 600; color: var(--color-text-primary); line-height: 20px; }
    .field-hint { font-size: var(--font-size-xs); color: var(--color-text-muted); line-height: 14px; }
    .est-date { font-size: var(--font-size-base); color: var(--color-text-primary); padding-top: 6px; white-space: nowrap; }

    /* Order footer */
    .order-footer {
      display: flex; align-items: center; justify-content: flex-start; gap: 16px;
      padding: 16px 24px; background: white; flex-shrink: 0;
      border-top: 1px solid var(--color-border-subtle);
    }

    /* Modal */
    .overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.45);
      display: flex; align-items: center; justify-content: center; z-index: 100;
    }
    .modal {
      width: 480px; max-width: calc(100vw - 32px);
      background: white; border-radius: 12px; overflow: hidden;
      box-shadow: 0 8px 32px rgba(0,0,0,.18);
    }
    .modal__hdr {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 24px 0;
    }
    .modal__title { font-size: var(--font-size-lg); font-weight: 600; color: var(--color-text-primary); }
    .modal__close { background: none; border: none; cursor: pointer; font-size: var(--font-size-xl); color: var(--color-icon); display: flex; }
    .modal__close:hover { color: var(--color-text-primary); }
    .modal__body { padding: 16px 24px; display: flex; flex-direction: column; gap: 8px; }
    .modal__textarea {
      width: 100%; height: 120px; resize: none;
      border: 1px solid var(--color-border-subtle); border-radius: 6px;
      padding: 10px 12px; font-size: var(--font-size-base); font-family: inherit; color: var(--color-text-primary);
      outline: none; transition: border-color 0.15s;
    }
    .modal__textarea:focus { border-color: var(--color-interactive-primary); }
    .modal__textarea::placeholder { color: var(--color-text-placeholder); }
    .char-count { font-size: 11px; color: var(--color-text-disabled); text-align: right; }
    .modal__footer { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 24px 20px; }

    /* Chat bubble */
    .chat-bubble {
      position: fixed; bottom: 24px; right: 24px;
      width: 62px; height: 62px; background: var(--color-interactive-primary); border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; box-shadow: 0 4px 16px rgba(0,0,0,.18);
    }
  `],
})
export class ProjectArchiveCreationFlowTestingComponent implements OnInit, OnDestroy {
  private tracker = inject(TrackerService);
  private toast = inject(ToastService);

  // DS icon names for fvdr-btn [icon] input
  readonly PLUS_ICON  = 'plus'  as const;
  readonly COPY_ICON  = 'copy'  as const;
  readonly TRASH_ICON = 'trash' as const;

  view: AppView = 'main';

  // Sidebar
  sidebarCollapsed = false;
  navItems: NavItem[] = [
    { id: 'dashboard',    label: 'Dashboard',         icon: 'nav-overview',      iconActive: 'nav-overview-active' },
    { id: 'documents',    label: 'Documents',          icon: 'nav-documents',     iconActive: 'nav-documents-active' },
    { id: 'participants', label: 'Participants',        icon: 'nav-participants',  iconActive: 'nav-participants-active' },
    { id: 'permissions',  label: 'Permissions',         icon: 'nav-permissions',   iconActive: 'nav-permissions-active' },
    { id: 'qa',           label: 'Q&A',                icon: 'nav-qa',            iconActive: 'nav-qa-active' },
    { id: 'reports',      label: 'Reports',             icon: 'nav-reports',       iconActive: 'nav-reports-active',
      children: [{ label: 'Activity log' }, { label: 'Documents overview' }] },
    { id: 'settings',     label: 'Settings',            icon: 'nav-settings',      iconActive: 'nav-settings-active',
      children: [{ label: 'General' }, { label: 'Integrations' }] },
    { id: 'archiving',    label: 'Project archiving',   icon: 'nav-archiving',     iconActive: 'nav-archiving-active', active: true },
    { id: 'recycle',      label: 'Recycle bin',         icon: 'nav-recycle',       iconActive: 'nav-recycle-active' },
  ];

  toggleNavItem(item: NavItem): void {
    if (item.children) { item.open = !item.open; return; }
    this.navItems.forEach(n => n.active = false);
    item.active = true;
  }

  // Archives
  archives: Archive[] = [];
  archiveFormOpen = false;
  editingArchiveId: number | null = null;
  archiveForm = freshArchiveForm();
  private nextArchiveId = 1;

  // Recipients
  recipients: Recipient[] = [];
  recipientFormOpen = false;
  recipientForm = freshRecipientForm();

  // Confirm modal
  confirmModalOpen = false;
  specificRequirements = '';

  readonly docOptions: RadioOption[] = [
    { value: 'all', label: 'All' },
    { value: 'viewpoint', label: 'From the viewpoint of group' },
    { value: 'selected', label: 'Selected folders' },
  ];

  readonly groupOptions: DropdownOption[] = [
    { value: 'admins', label: 'Admins' },
    { value: 'investors', label: 'Investors' },
    { value: 'legal', label: 'Legal team' },
    { value: 'finance', label: 'Finance team' },
    { value: 'all-users', label: 'All users' },
  ];

  readonly SAMPLE_FOLDERS = [
    { value: 'due-diligence', label: 'Due Diligence' },
    { value: 'financials', label: 'Financials' },
    { value: 'legal-docs', label: 'Legal Documents' },
    { value: 'contracts', label: 'Contracts' },
    { value: 'reports', label: 'Reports' },
    { value: 'presentations', label: 'Presentations' },
    { value: 'hr', label: 'HR Documents' },
  ];

  foldersPopoverOpen = false;

  onDocumentsChange(val: string): void {
    this.archiveForm.documents = val;
    this.archiveForm.selectedGroup = '';
    this.archiveForm.selectedFolders = [];
    this.foldersPopoverOpen = false;
  }

  toggleFolder(value: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.archiveForm.selectedFolders = [...this.archiveForm.selectedFolders, value];
    } else {
      this.archiveForm.selectedFolders = this.archiveForm.selectedFolders.filter(f => f !== value);
    }
  }

  readonly reportsOptions: DropdownOption[] = [
    { value: 'all', label: 'Selected all' },
    { value: 'history', label: 'History of all actions, Folder access' },
    { value: 'custom', label: 'Custom' },
  ];

  readonly countryOptions: DropdownOption[] = [
    { value: 'Luxembourg', label: 'Luxembourg' },
    { value: 'Germany', label: 'Germany' },
    { value: 'France', label: 'France' },
    { value: 'United Kingdom', label: 'United Kingdom' },
  ];

  // ── Lifecycle ────────────────────────────────────────────────────────────────

  ngOnInit(): void { this.tracker.trackPageView(SLUG); }
  ngOnDestroy(): void { this.tracker.destroyListeners(); }

  // ── Navigation ───────────────────────────────────────────────────────────────

  goToOrder(): void {
    this.tracker.trackTask(SLUG, 'task_complete', 'place_order');
    this.archives = [];
    this.recipients = [];
    this.archiveFormOpen = false;
    this.recipientFormOpen = false;
    this.archiveForm = freshArchiveForm();
    this.recipientForm = freshRecipientForm();
    this.nextArchiveId = 1;
    this.view = 'order';
  }

  cancelOrder(): void {
    this.view = 'main';
  }

  onCloseProject(): void {
    this.tracker.trackTask(SLUG, 'task_fail', 'close_project');
  }

  // ── Archives ─────────────────────────────────────────────────────────────────

  openArchiveForm(): void {
    this.editingArchiveId = null;
    this.archiveForm = freshArchiveForm();
    this.archiveForm.name = `Archive ${this.archives.length + 1}`;
    this.archiveFormOpen = true;
  }

  editArchive(arch: Archive): void {
    this.editingArchiveId = arch.id;
    this.archiveForm = { ...arch };
    this.archiveFormOpen = true;
  }

  addArchive(): void {
    if (this.editingArchiveId !== null) {
      const idx = this.archives.findIndex(a => a.id === this.editingArchiveId);
      if (idx !== -1) this.archives[idx] = { id: this.editingArchiveId, ...this.archiveForm };
    } else {
      const arch: Archive = { id: this.nextArchiveId++, ...this.archiveForm };
      this.archives = [...this.archives, arch];
      // Give each existing recipient a USB count for new archive
      this.recipients.forEach(r => r.usbCounts[arch.id] = 1);
    }
    this.archiveFormOpen = false;
    this.editingArchiveId = null;
  }

  addAndDuplicateArchive(): void {
    this.addArchive();
    this.archiveForm = { ...this.archiveForm, name: `Archive ${this.archives.length + 1}` };
    this.archiveFormOpen = true;
  }

  cancelArchiveForm(): void {
    this.archiveFormOpen = false;
    this.editingArchiveId = null;
  }

  deleteArchive(id: number): void {
    this.archives = this.archives.filter(a => a.id !== id);
    this.recipients.forEach(r => delete r.usbCounts[id]);
  }

  duplicateArchive(arch: Archive): void {
    const dup: Archive = { ...arch, id: this.nextArchiveId++, name: `${arch.name} (copy)` };
    this.archives = [...this.archives, dup];
    this.recipients.forEach(r => r.usbCounts[dup.id] = 1);
  }

  // ── Recipients ───────────────────────────────────────────────────────────────

  openRecipientForm(): void {
    this.recipientForm = freshRecipientForm();
    this.recipientFormOpen = true;
  }

  iAmRecipient(): void {
    this.recipientForm = {
      email: 'ivan.r@ideals.com',
      fullName: 'Ivan R.',
      phone: '+352 27 17 62 1',
      company: 'iDeals',
      country: 'Luxembourg',
      city: 'Luxembourg',
      postalCode: '9053',
      address: '37A Av. John F. Kennedy 3rd floor, Kirchberg',
    };
    this.recipientFormOpen = true;
  }

  addRecipient(): void {
    const usbCounts: { [id: number]: number } = {};
    this.archives.forEach(a => usbCounts[a.id] = 1);
    const r: Recipient = {
      id: Date.now(),
      ...this.recipientForm,
      usbCounts,
    };
    this.recipients = [...this.recipients, r];
    this.recipientFormOpen = false;
    this.recipientForm = freshRecipientForm();
  }

  cancelRecipientForm(): void {
    this.recipientFormOpen = false;
  }

  incUsb(r: Recipient, archId: number): void {
    r.usbCounts[archId] = (r.usbCounts[archId] || 1) + 1;
  }

  decUsb(r: Recipient, archId: number): void {
    if ((r.usbCounts[archId] || 1) > 1) r.usbCounts[archId]--;
  }

  removeArchiveFromRecipient(r: Recipient, archId: number): void {
    delete r.usbCounts[archId];
  }

  // ── Confirm & Order ──────────────────────────────────────────────────────────

  openConfirmModal(): void {
    this.specificRequirements = '';
    this.confirmModalOpen = true;
  }

  placeOrder(): void {
    this.confirmModalOpen = false;
    this.tracker.trackTask(SLUG, 'task_complete', 'confirm_order');
    this.view = 'main';
    this.toast.show({ variant: 'success', message: 'Order successfully placed' });
  }

  // ── Labels ───────────────────────────────────────────────────────────────────

  docLabel(arch: Archive): string {
    if (arch.documents === 'viewpoint') {
      const g = this.groupOptions.find(o => o.value === arch.selectedGroup);
      return g ? `Viewpoint: ${g.label}` : 'From the viewpoint of group';
    }
    if (arch.documents === 'selected') {
      return arch.selectedFolders.length ? `${arch.selectedFolders.length} folder(s)` : 'Selected folders';
    }
    return 'All files and folders';
  }

  asString(v: string | string[]): string { return Array.isArray(v) ? v[0] : v; }

  reportsLabel(val: string): string {
    return this.reportsOptions.find(o => o.value === val)?.label ?? val;
  }
}

