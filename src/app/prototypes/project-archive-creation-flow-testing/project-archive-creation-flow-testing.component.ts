import { Component, OnInit, OnDestroy, inject, Pipe, PipeTransform } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TrackerService } from '../../services/tracker.service';
import { DS_COMPONENTS, ToastService, SidebarNavItem } from '../../shared/ds';
import type { RadioOption, DropdownOption, FvdrIconName } from '../../shared/ds';

@Pipe({ name: 'initials', standalone: true })
export class InitialsPipe implements PipeTransform {
  transform(name: string): string {
    return name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }
}

const SLUG = 'project-archive-creation-flow-testing';

type AppView = 'main' | 'order';


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
      <fvdr-sidebar-nav
        variant="vdr"
        accountName="Project Alpha"
        [items]="navItems"
        [(collapsed)]="sidebarCollapsed"
        (itemClick)="toggleNavItem($event)"
      ></fvdr-sidebar-nav>

      <!-- ── Main ── -->
      <div class="main">

        <!-- Header -->
        <fvdr-page-header
          [title]="view === 'order' ? 'Place order' : 'Project archiving'"
          [parentItems]="view === 'order' ? ['Project archiving'] : []"
        ></fvdr-page-header>

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

      <fvdr-toast-host />

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


    /* ── Main ── */
    .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

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
  navItems: SidebarNavItem[] = [
    { id: 'dashboard',    label: 'Dashboard',        icon: 'nav-overview',     iconActive: 'nav-overview-active' },
    { id: 'documents',    label: 'Documents',         icon: 'nav-projects',     iconActive: 'nav-projects-active' },
    { id: 'participants', label: 'Participants',       icon: 'nav-participants', iconActive: 'nav-participants-active' },
    { id: 'permissions',  label: 'Permissions',        icon: 'lock-close',       iconActive: 'lock-open' },
    { id: 'qa',           label: 'Q&A',               icon: 'nav-api',          iconActive: 'nav-api-active' },
    { id: 'reports',      label: 'Reports',            icon: 'nav-reports',      iconActive: 'nav-reports-active',
      children: [{ id: 'activity-log', label: 'Activity log' }, { id: 'docs-overview', label: 'Documents overview' }] },
    { id: 'settings',     label: 'Settings',           icon: 'nav-settings',     iconActive: 'nav-settings-active',
      children: [{ id: 'general', label: 'General' }, { id: 'integrations', label: 'Integrations' }] },
    { id: 'archiving',    label: 'Project archiving',  icon: 'storage',          iconActive: 'storage',            active: true },
    { id: 'recycle',      label: 'Recycle bin',        icon: 'trash',            iconActive: 'trash' },
  ];

  toggleNavItem(item: SidebarNavItem): void {
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

