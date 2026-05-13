import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DS_COMPONENTS, ToastService } from '../../shared/ds';
import { DS_REGISTRY, DS_CATEGORIES, ComponentDocEntry, ComponentStatus, ComponentCategory } from './ds-registry';

@Component({
  selector: 'app-ds-component-page',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ...DS_COMPONENTS],
  template: `
<div class="doc-page">

  <!-- ── Sidebar ──────────────────────── -->
  <aside class="doc-sidebar">
    <a class="sidebar-back" routerLink="/ds">← DS Overview</a>
    <div class="sidebar-search">
      <input type="text" [(ngModel)]="searchQuery" placeholder="Search components…" class="sidebar-input" />
    </div>
    <nav class="sidebar-nav">
      <div class="sidebar-group" *ngFor="let group of groupedRegistry">
        <div class="sidebar-group__label">{{ group.category.label }}</div>
        <button
          *ngFor="let item of group.items"
          class="sidebar-item"
          [class.sidebar-item--active]="item.id === componentId"
          (click)="navigate(item.id)"
        >{{ item.name }}</button>
      </div>
    </nav>
  </aside>

  <!-- ── Main Content ─────────────────── -->
  <main class="doc-main" *ngIf="entry">

    <!-- 1. HERO -->
    <section class="doc-hero">
      <div class="doc-hero__top">
        <h1 class="doc-hero__title">{{ entry.name }}</h1>
        <div class="doc-hero__meta">
          <span class="doc-hero__selector">{{ entry.selector }}</span>
          <span class="doc-hero__status" [ngClass]="statusClass(entry.status)">{{ entry.status }}</span>
          <span class="doc-hero__category">{{ categoryLabel(entry.category) }}</span>
          <a *ngIf="entry.figmaNode" class="doc-hero__figma" [href]="'https://www.figma.com/design/liyNDiFf1piO8SQmHNKoeU/FVDR---Design-System?node-id=' + entry.figmaNode" target="_blank">Figma ↗</a>
        </div>
      </div>
      <p class="doc-hero__desc">{{ entry.description }}</p>
    </section>

    <!-- 2. OVERVIEW -->
    <section class="doc-section" *ngIf="entry.whenToUse.length || entry.whenNotToUse.length">
      <h2 class="doc-section__title">Overview</h2>
      <div class="overview-grid">
        <div class="overview-col" *ngIf="entry.whenToUse.length">
          <p class="overview-label overview-label--do">When to use</p>
          <ul class="overview-list">
            <li *ngFor="let item of entry.whenToUse">{{ item }}</li>
          </ul>
        </div>
        <div class="overview-col" *ngIf="entry.whenNotToUse.length">
          <p class="overview-label overview-label--dont">When not to use</p>
          <ul class="overview-list">
            <li *ngFor="let item of entry.whenNotToUse">{{ item }}</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- 3. ANATOMY -->
    <section class="doc-section" *ngIf="entry.anatomy.length">
      <h2 class="doc-section__title">Anatomy</h2>
      <div class="anatomy-preview">
        <ng-container [ngSwitch]="componentId">

          <ng-container *ngSwitchCase="'button'">
            <div class="anatomy-wrap anatomy-wrap--button">
              <fvdr-btn label="Button" iconName="check" size="m" variant="primary"></fvdr-btn>
              <!-- Part labels -->
              <div class="anatomy-label anatomy-label--top" style="top:-42px;left:6px">icon</div>
              <div class="anatomy-label anatomy-label--top" style="top:-42px;right:6px">label</div>
              <div class="anatomy-label anatomy-label--left" style="left:-72px;top:50%;transform:translateY(-50%)">root</div>
              <!-- Dimensions -->
              <div class="dim-v" style="right:-48px;top:0;height:36px">36px</div>
              <div class="dim-v" style="left:-22px;top:0;height:8px">8</div>
              <div class="dim-v" style="left:-22px;bottom:0;height:8px">8</div>
              <div class="dim-h" style="bottom:-28px;left:0;width:16px">16</div>
              <div class="dim-h" style="bottom:-28px;right:0;width:16px">16</div>
              <div class="dim-label" style="top:50%;transform:translateY(-50%);left:12px">16px</div>
              <div class="dim-label" style="top:50%;transform:translateY(-50%);right:12px">14px</div>
            </div>
          </ng-container>

          <ng-container *ngSwitchCase="'badge'">
            <div class="anatomy-wrap">
              <fvdr-badge label="Active" variant="primary"></fvdr-badge>
              <!-- Part labels -->
              <div class="anatomy-label anatomy-label--top" style="top:-42px;left:50%;transform:translateX(-50%)">root</div>
              <div class="anatomy-label anatomy-label--left" style="left:-52px;top:50%;transform:translateY(-50%)">dot</div>
              <!-- Dimensions -->
              <div class="dim-v" style="right:-44px;top:0;height:20px">20px</div>
              <div class="dim-h" style="bottom:-28px;left:0;width:8px">8</div>
              <div class="dim-h" style="bottom:-28px;right:0;width:8px">8</div>
              <div class="dim-label" style="top:50%;transform:translateY(-50%);right:6px">12px</div>
            </div>
          </ng-container>

          <ng-container *ngSwitchCase="'avatar'">
            <div class="anatomy-wrap">
              <fvdr-avatar initials="JS" size="lg"></fvdr-avatar>
              <!-- Part labels -->
              <div class="anatomy-label anatomy-label--top" style="top:-42px;left:50%;transform:translateX(-50%)">root</div>
              <div class="anatomy-label anatomy-label--bottom" style="bottom:-42px;left:50%;transform:translateX(-50%)">initials</div>
              <!-- Dimensions: avatar lg = 48×48 -->
              <div class="dim-v" style="right:-44px;top:0;height:48px">48px</div>
              <div class="dim-h" style="bottom:-28px;left:0;width:48px">48px</div>
              <div class="dim-label" style="top:50%;transform:translateY(-50%);left:50%;transform:translate(-50%,-50%)">18px</div>
            </div>
          </ng-container>

          <ng-container *ngSwitchCase="'input'">
            <div class="anatomy-wrap anatomy-wrap--input">
              <fvdr-input label="Email" placeholder="Enter email" iconLeft="search" helperText="We'll send a confirmation"></fvdr-input>
              <!-- Part labels -->
              <div class="anatomy-label anatomy-label--left" style="left:-68px;top:4px">label</div>
              <div class="anatomy-label anatomy-label--left" style="left:-68px;top:42px">root</div>
              <div class="anatomy-label anatomy-label--top" style="top:-42px;left:18px">icon</div>
              <div class="anatomy-label anatomy-label--right" style="right:-68px;top:38px">input</div>
              <div class="anatomy-label anatomy-label--left" style="left:-68px;bottom:2px">helper</div>
              <!-- Dimensions: field = 40px, label 20px, helper 18px, pad 8/12 -->
              <div class="dim-v" style="right:-48px;top:20px;height:40px">40px</div>
              <div class="dim-v" style="right:-48px;top:0;height:20px">20</div>
              <div class="dim-h" style="bottom:-28px;left:0;width:12px">12</div>
              <div class="dim-h" style="bottom:-28px;right:0;width:12px">12</div>
              <div class="dim-v" style="left:-22px;top:20px;height:8px">8</div>
              <div class="dim-v" style="left:-22px;bottom:18px;height:8px">8</div>
              <div class="dim-label" style="top:46px;left:38px">14px</div>
            </div>
          </ng-container>

          <ng-container *ngSwitchCase="'modal'">
            <div class="anatomy-wrap anatomy-wrap--modal-preview">
              <div class="mock-modal">
                <div class="mock-modal__header">Confirm action</div>
                <div class="mock-modal__body">Are you sure you want to proceed?</div>
                <div class="mock-modal__footer">
                  <fvdr-btn label="Cancel" variant="secondary" size="s"></fvdr-btn>
                  <fvdr-btn label="Confirm" variant="primary" size="s"></fvdr-btn>
                </div>
              </div>
              <!-- Part labels -->
              <div class="anatomy-label anatomy-label--top" style="top:-42px;left:50%;transform:translateX(-50%)">overlay</div>
              <div class="anatomy-label anatomy-label--right" style="right:-76px;top:16px">header</div>
              <div class="anatomy-label anatomy-label--right" style="right:-76px;top:50%;transform:translateY(-50%)">body</div>
              <div class="anatomy-label anatomy-label--right" style="right:-76px;bottom:16px">actions</div>
              <!-- Dimensions: pad 24px, header ~48px, footer ~52px, radius 8px -->
              <div class="dim-v" style="left:-44px;top:0;height:48px">48px</div>
              <div class="dim-v" style="left:-44px;bottom:0;height:52px">52px</div>
              <div class="dim-h" style="bottom:-28px;left:0;width:24px">24</div>
              <div class="dim-h" style="bottom:-28px;right:0;width:24px">24</div>
            </div>
          </ng-container>

          <!-- SIDEBAR NAV -->
          <ng-container *ngSwitchCase="'sidebar-nav'">
            <div class="anatomy-wrap anatomy-wrap--sidebar-nav">
              <div class="mock-sidebar">
                <div class="mock-sidebar__account">
                  <span class="mock-sidebar__badge">PA</span>
                  <span class="mock-sidebar__name">Project Alpha</span>
                </div>
                <div class="mock-sidebar__item mock-sidebar__item--active">
                  <span class="mock-sidebar__icon">◫</span>
                  <span class="mock-sidebar__label">Dashboard</span>
                </div>
                <div class="mock-sidebar__item">
                  <span class="mock-sidebar__icon">◳</span>
                  <span class="mock-sidebar__label">Documents</span>
                </div>
                <div class="mock-sidebar__item">
                  <span class="mock-sidebar__icon">◑</span>
                  <span class="mock-sidebar__label">Participants</span>
                </div>
                <div class="mock-sidebar__footer">
                  <span class="mock-sidebar__logo">ideals.</span>
                </div>
              </div>
              <!-- Part labels -->
              <div class="anatomy-label anatomy-label--right" style="right:-100px;top:20px">account switcher</div>
              <div class="anatomy-label anatomy-label--right" style="right:-88px;top:68px">nav item (active)</div>
              <div class="anatomy-label anatomy-label--right" style="right:-76px;top:108px">nav item</div>
              <div class="anatomy-label anatomy-label--right" style="right:-76px;bottom:16px">bottom bar</div>
              <!-- Dimensions -->
              <div class="dim-v" style="left:-40px;top:0;height:64px">64px</div>
              <div class="dim-v" style="left:-40px;top:64px;height:40px">40px</div>
              <div class="dim-h" style="bottom:-28px;left:0;width:280px">280px</div>
            </div>
          </ng-container>

          <!-- QUICK ACCESS MENU -->
          <ng-container *ngSwitchCase="'quick-access-menu'">
            <div class="anatomy-wrap anatomy-wrap--qa-menu">
              <div class="mock-qa-menu">
                <div class="mock-qa-menu__header">
                  <span class="mock-qa-menu__title">Quick access</span>
                  <span class="mock-qa-menu__actions">⟨⟨ ‹</span>
                </div>
                <div class="mock-qa-menu__item mock-qa-menu__item--active">
                  <span class="mock-qa-menu__icon">⏱</span>
                  <span class="mock-qa-menu__label">Recent</span>
                </div>
                <div class="mock-qa-menu__item">
                  <span class="mock-qa-menu__icon">★</span>
                  <span class="mock-qa-menu__label">Favorites</span>
                </div>
                <div class="mock-qa-menu__item">
                  <span class="mock-qa-menu__icon">↑</span>
                  <span class="mock-qa-menu__label">New</span>
                </div>
                <div class="mock-qa-menu__item">
                  <span class="mock-qa-menu__icon">≡</span>
                  <span class="mock-qa-menu__label">Notes</span>
                </div>
              </div>
              <!-- Part labels -->
              <div class="anatomy-label anatomy-label--right" style="right:-72px;top:14px">header</div>
              <div class="anatomy-label anatomy-label--right" style="right:-64px;top:60px">item (active)</div>
              <div class="anatomy-label anatomy-label--right" style="right:-56px;top:100px">item</div>
              <!-- Dimensions -->
              <div class="dim-v" style="left:-40px;top:0;height:48px">48px</div>
              <div class="dim-v" style="left:-40px;top:48px;height:40px">40px</div>
              <div class="dim-h" style="bottom:-28px;left:0;width:340px">340px</div>
            </div>
          </ng-container>

          <ng-container *ngSwitchDefault>
            <div class="anatomy-preview-empty">Live anatomy preview coming soon for this component.</div>
          </ng-container>

        </ng-container>
      </div>
    </section>

    <!-- 4–6. LIVE EXAMPLES (Sizes, States, Variants) -->
    <section class="doc-section">
      <h2 class="doc-section__title">Examples</h2>
      <ng-container [ngSwitch]="componentId">

        <!-- BUTTON -->
        <ng-container *ngSwitchCase="'button'">
          <div class="examples-group">
            <h3 class="examples-group__title">Sizes</h3>
            <div class="examples-row">
              <fvdr-btn label="Large"  size="l" variant="primary"></fvdr-btn>
              <fvdr-btn label="Medium" size="m" variant="primary"></fvdr-btn>
              <fvdr-btn label="Small"  size="s" variant="primary"></fvdr-btn>
            </div>
          </div>
          <div class="examples-group">
            <h3 class="examples-group__title">Variants</h3>
            <div class="examples-row">
              <fvdr-btn label="Primary"   variant="primary"   size="m"></fvdr-btn>
              <fvdr-btn label="Secondary" variant="secondary" size="m"></fvdr-btn>
              <fvdr-btn label="Ghost"     variant="ghost"     size="m"></fvdr-btn>
              <fvdr-btn label="Danger"    variant="danger"    size="m"></fvdr-btn>
              <fvdr-btn label="Link"      variant="link"      size="m"></fvdr-btn>
              <fvdr-btn label="Text"      variant="text"      size="m"></fvdr-btn>
            </div>
          </div>
          <div class="examples-group">
            <h3 class="examples-group__title">With Icon</h3>
            <div class="examples-row">
              <fvdr-btn label="Add item"  variant="primary"   size="m" iconName="plus"></fvdr-btn>
              <fvdr-btn label="Download"  variant="secondary" size="m" iconName="download"></fvdr-btn>
              <fvdr-btn label="Delete"    variant="danger"    size="m" iconName="trash"></fvdr-btn>
            </div>
          </div>
          <div class="examples-group">
            <h3 class="examples-group__title">States</h3>
            <div class="examples-row">
              <fvdr-btn label="Default"   variant="primary" size="m"></fvdr-btn>
              <fvdr-btn label="Loading…"  variant="primary" size="m" [loading]="true"></fvdr-btn>
              <fvdr-btn label="Disabled"  variant="primary" size="m" [disabled]="true"></fvdr-btn>
              <fvdr-btn label="Secondary disabled" variant="secondary" size="m" [disabled]="true"></fvdr-btn>
            </div>
          </div>
        </ng-container>

        <!-- BADGE -->
        <ng-container *ngSwitchCase="'badge'">
          <div class="examples-group">
            <h3 class="examples-group__title">Variants</h3>
            <div class="examples-row examples-row--wrap">
              <fvdr-badge label="Primary"   variant="primary"></fvdr-badge>
              <fvdr-badge label="Success"   variant="success"></fvdr-badge>
              <fvdr-badge label="Error"     variant="error"></fvdr-badge>
              <fvdr-badge label="Warning"   variant="warning"></fvdr-badge>
              <fvdr-badge label="Info"      variant="info"></fvdr-badge>
              <fvdr-badge label="Neutral"   variant="neutral"></fvdr-badge>
            </div>
          </div>
          <div class="examples-group">
            <h3 class="examples-group__title">Typical labels</h3>
            <div class="examples-row examples-row--wrap">
              <fvdr-badge label="Active"      variant="success"></fvdr-badge>
              <fvdr-badge label="Inactive"    variant="neutral"></fvdr-badge>
              <fvdr-badge label="Pending"     variant="warning"></fvdr-badge>
              <fvdr-badge label="Failed"      variant="error"></fvdr-badge>
              <fvdr-badge label="New"         variant="info"></fvdr-badge>
              <fvdr-badge label="Admin"       variant="primary"></fvdr-badge>
            </div>
          </div>
        </ng-container>

        <!-- AVATAR -->
        <ng-container *ngSwitchCase="'avatar'">
          <div class="examples-group">
            <h3 class="examples-group__title">Sizes</h3>
            <div class="examples-row examples-row--align-end">
              <div class="example-labeled"><fvdr-avatar initials="AB" size="xl"></fvdr-avatar><span>xl · 48px</span></div>
              <div class="example-labeled"><fvdr-avatar initials="AB" size="lg"></fvdr-avatar><span>lg · 40px</span></div>
              <div class="example-labeled"><fvdr-avatar initials="AB" size="md"></fvdr-avatar><span>md · 32px</span></div>
              <div class="example-labeled"><fvdr-avatar initials="AB" size="sm"></fvdr-avatar><span>sm · 24px</span></div>
            </div>
          </div>
          <div class="examples-group">
            <h3 class="examples-group__title">Custom colors</h3>
            <div class="examples-row">
              <fvdr-avatar initials="JD" size="md" color="#4862D3" textColor="#ffffff"></fvdr-avatar>
              <fvdr-avatar initials="MK" size="md" color="#e54430" textColor="#ffffff"></fvdr-avatar>
              <fvdr-avatar initials="NP" size="md" color="#2c9c74" textColor="#ffffff"></fvdr-avatar>
              <fvdr-avatar initials="AR" size="md" color="#F4640C" textColor="#ffffff"></fvdr-avatar>
            </div>
          </div>
        </ng-container>

        <!-- INPUT -->
        <ng-container *ngSwitchCase="'input'">
          <div class="examples-group">
            <h3 class="examples-group__title">Sizes</h3>
            <div class="examples-col">
              <fvdr-input label="Large"  size="l" placeholder="Enter value…"></fvdr-input>
              <fvdr-input label="Medium" size="m" placeholder="Enter value…"></fvdr-input>
              <fvdr-input label="Small"  size="s" placeholder="Enter value…"></fvdr-input>
            </div>
          </div>
          <div class="examples-group">
            <h3 class="examples-group__title">States</h3>
            <div class="examples-col">
              <fvdr-input label="Default"  state="default"  placeholder="Enter email…"></fvdr-input>
              <fvdr-input label="Error"    state="error"    placeholder="Enter email…" errorText="Invalid email address"></fvdr-input>
              <fvdr-input label="Success"  state="success"  placeholder="Enter email…"></fvdr-input>
              <fvdr-input label="Disabled" state="disabled" placeholder="Enter email…"></fvdr-input>
            </div>
          </div>
          <div class="examples-group">
            <h3 class="examples-group__title">With icons</h3>
            <div class="examples-col">
              <fvdr-input label="Search"   iconLeft="search"   placeholder="Search…"></fvdr-input>
              <fvdr-input label="Password" iconRight="lock-close" placeholder="Enter password…" type="password"></fvdr-input>
            </div>
          </div>
        </ng-container>

        <!-- DROPDOWN -->
        <ng-container *ngSwitchCase="'dropdown'">
          <div class="examples-group">
            <h3 class="examples-group__title">Sizes</h3>
            <div class="examples-col">
              <fvdr-dropdown label="Large"  size="l" [options]="demoOptions" placeholder="Select…"></fvdr-dropdown>
              <fvdr-dropdown label="Medium" size="m" [options]="demoOptions" placeholder="Select…"></fvdr-dropdown>
              <fvdr-dropdown label="Small"  size="s" [options]="demoOptions" placeholder="Select…"></fvdr-dropdown>
            </div>
          </div>
          <div class="examples-group">
            <h3 class="examples-group__title">States</h3>
            <div class="examples-col">
              <fvdr-dropdown label="Default" [options]="demoOptions" placeholder="Select…"></fvdr-dropdown>
              <fvdr-dropdown label="Pre-selected" [options]="demoOptions" value="opt2"></fvdr-dropdown>
              <fvdr-dropdown label="Error" [options]="demoOptions" placeholder="Select…" [error]="true" helperText="This field is required"></fvdr-dropdown>
              <fvdr-dropdown label="Disabled" [options]="demoOptions" placeholder="Not available" [disabled]="true"></fvdr-dropdown>
            </div>
          </div>
          <div class="examples-group">
            <h3 class="examples-group__title">With hint text</h3>
            <div class="examples-col">
              <fvdr-dropdown label="Department" [options]="demoOptionsGrouped" placeholder="Choose a role…" helperText="Select the user's access level"></fvdr-dropdown>
            </div>
          </div>
          <div class="examples-group">
            <h3 class="examples-group__title">Icon left</h3>
            <div class="examples-col">
              <fvdr-dropdown label="Filter by status" [options]="demoOptions" placeholder="All statuses" iconLeft="filter"></fvdr-dropdown>
              <fvdr-dropdown label="Sort by" [options]="demoOptions" placeholder="Choose order" iconLeft="sort" size="s"></fvdr-dropdown>
            </div>
          </div>
          <div class="examples-group">
            <h3 class="examples-group__title">Searchable</h3>
            <fvdr-dropdown label="Country" [options]="demoOptionsLong" placeholder="Type to filter…" [searchable]="true"></fvdr-dropdown>
          </div>
          <div class="examples-group">
            <h3 class="examples-group__title">Grouped options</h3>
            <fvdr-dropdown label="Role" [options]="demoOptionsGrouped" placeholder="Choose a role…"></fvdr-dropdown>
          </div>
          <div class="examples-group">
            <h3 class="examples-group__title">Multi-select with chips</h3>
            <fvdr-dropdown label="Tags" [options]="demoOptions" [multi]="true" placeholder="Select multiple…" helperText="You can select several options"></fvdr-dropdown>
          </div>
        </ng-container>

        <!-- TOGGLE -->
        <ng-container *ngSwitchCase="'toggle'">
          <div class="examples-group">
            <h3 class="examples-group__title">States</h3>
            <div class="examples-row">
              <div class="example-labeled"><fvdr-toggle></fvdr-toggle><span>Off</span></div>
              <div class="example-labeled"><fvdr-toggle [checked]="true"></fvdr-toggle><span>On</span></div>
              <div class="example-labeled"><fvdr-toggle [disabled]="true"></fvdr-toggle><span>Disabled off</span></div>
              <div class="example-labeled"><fvdr-toggle [checked]="true" [disabled]="true"></fvdr-toggle><span>Disabled on</span></div>
            </div>
          </div>
        </ng-container>

        <!-- CHECKBOX -->
        <ng-container *ngSwitchCase="'checkbox'">
          <div class="examples-group">
            <h3 class="examples-group__title">States</h3>
            <div class="examples-row">
              <div class="example-labeled"><fvdr-checkbox [ngModel]="false"></fvdr-checkbox><span>Unchecked</span></div>
              <div class="example-labeled"><fvdr-checkbox [ngModel]="true"></fvdr-checkbox><span>Checked</span></div>
              <div class="example-labeled"><fvdr-checkbox [ngModel]="false" [indeterminate]="true"></fvdr-checkbox><span>Indeterminate</span></div>
              <div class="example-labeled"><fvdr-checkbox [ngModel]="false" [disabled]="true"></fvdr-checkbox><span>Disabled</span></div>
            </div>
          </div>
        </ng-container>

        <!-- TABS -->
        <ng-container *ngSwitchCase="'tabs'">
          <div class="examples-group">
            <h3 class="examples-group__title">Basic tabs</h3>
            <fvdr-tabs [tabs]="demoTabs" [(activeId)]="activeTab"></fvdr-tabs>
          </div>
          <div class="examples-group">
            <h3 class="examples-group__title">With counters</h3>
            <fvdr-tabs [tabs]="demoTabsWithCounters" [(activeId)]="activeTabCounter"></fvdr-tabs>
          </div>
        </ng-container>

        <!-- STATUS -->
        <ng-container *ngSwitchCase="'status'">
          <div class="examples-group">
            <h3 class="examples-group__title">Variants</h3>
            <div class="examples-row examples-row--wrap">
              <fvdr-status label="Active"   variant="active"></fvdr-status>
              <fvdr-status label="Pending"  variant="pending"></fvdr-status>
              <fvdr-status label="Error"    variant="error"></fvdr-status>
              <fvdr-status label="Inactive" variant="inactive"></fvdr-status>
              <fvdr-status label="Info"     variant="info"></fvdr-status>
            </div>
          </div>
        </ng-container>

        <!-- MODAL -->
        <ng-container *ngSwitchCase="'modal'">
          <div class="examples-group">
            <h3 class="examples-group__title">Basic modal</h3>
            <div class="examples-row">
              <fvdr-btn label="Open modal" variant="primary" size="m" (clicked)="modalOpen = true"></fvdr-btn>
            </div>
            <fvdr-modal
              [visible]="modalOpen"
              title="Confirm action"
              content="Are you sure you want to perform this action? This cannot be undone."
              confirmLabel="Confirm"
              cancelLabel="Cancel"
              (confirmed)="modalOpen = false"
              (cancelled)="modalOpen = false"
              (closed)="modalOpen = false"
            ></fvdr-modal>
          </div>
        </ng-container>

        <!-- SIDEBAR NAV -->
        <ng-container *ngSwitchCase="'sidebar-nav'">
          <div class="examples-group">
            <h3 class="examples-group__title">Expanded — VDR variant</h3>
            <div class="nav-example-frame" style="height:880px;">
              <fvdr-sidebar-nav
                variant="vdr"
                accountName="Project Alpha"
                [items]="demoNavItems"
                [collapsed]="false"
                style="height:880px;"
              ></fvdr-sidebar-nav>
            </div>
          </div>
          <div class="examples-group">
            <h3 class="examples-group__title">Expanded — CA variant</h3>
            <div class="nav-example-frame" style="height:880px;">
              <fvdr-sidebar-nav
                variant="ca"
                accountName="ACME Corp"
                [items]="demoNavItems"
                [collapsed]="false"
                style="height:880px;"
              ></fvdr-sidebar-nav>
            </div>
          </div>
          <div class="examples-group">
            <h3 class="examples-group__title">Collapsed (icon-only) — all variants</h3>
            <div class="nav-example-frame" style="height:880px;">
              <fvdr-sidebar-nav variant="vdr"      accountName="VDR Project"   [items]="demoNavItems" [collapsed]="true"  style="height:880px;"></fvdr-sidebar-nav>
              <fvdr-sidebar-nav variant="ca"       accountName="Corp Account"  [items]="demoNavItems" [collapsed]="true"  style="height:880px;"></fvdr-sidebar-nav>
              <fvdr-sidebar-nav variant="internal" accountName="Internal Tool" [items]="demoNavItems" [collapsed]="true"  style="height:880px;"></fvdr-sidebar-nav>
            </div>
          </div>
        </ng-container>

        <!-- QUICK ACCESS MENU -->
        <ng-container *ngSwitchCase="'quick-access-menu'">
          <div class="examples-group">
            <h3 class="examples-group__title">Expanded (default)</h3>
            <div class="examples-row">
              <fvdr-quick-access-menu
                [items]="demoQaItems"
                [collapsed]="false"
              ></fvdr-quick-access-menu>
            </div>
          </div>
          <div class="examples-group">
            <h3 class="examples-group__title">With active item</h3>
            <div class="examples-row">
              <fvdr-quick-access-menu [items]="demoQaItemsActive" [collapsed]="false"></fvdr-quick-access-menu>
            </div>
          </div>
          <div class="examples-group">
            <h3 class="examples-group__title">Collapsed (icon-only header)</h3>
            <div class="examples-row">
              <fvdr-quick-access-menu [items]="demoQaItems" [collapsed]="true"></fvdr-quick-access-menu>
            </div>
          </div>
        </ng-container>

        <!-- TEXTAREA -->
        <ng-container *ngSwitchCase="'textarea'">
          <div class="examples-group">
            <h3 class="examples-group__title">States</h3>
            <div class="examples-col">
              <fvdr-textarea label="Default" placeholder="Enter description…"></fvdr-textarea>
              <fvdr-textarea label="Error" state="error" errorText="This field is required" placeholder="Enter description…"></fvdr-textarea>
              <fvdr-textarea label="Disabled" state="disabled" placeholder="Not available"></fvdr-textarea>
            </div>
          </div>
          <div class="examples-group">
            <h3 class="examples-group__title">With character limit</h3>
            <fvdr-textarea label="Notes" [maxlength]="200" placeholder="Max 200 characters…" helperText="Enter up to 200 characters"></fvdr-textarea>
          </div>
        </ng-container>

        <!-- SEARCH -->
        <ng-container *ngSwitchCase="'search'">
          <div class="examples-group">
            <h3 class="examples-group__title">Sizes</h3>
            <div class="examples-col">
              <fvdr-search label="Large" size="l" placeholder="Search…"></fvdr-search>
              <fvdr-search label="Medium" size="m" placeholder="Search…"></fvdr-search>
              <fvdr-search label="Small" size="s" placeholder="Search…"></fvdr-search>
            </div>
          </div>
          <div class="examples-group">
            <h3 class="examples-group__title">States</h3>
            <div class="examples-col">
              <fvdr-search label="Default" placeholder="Search…"></fvdr-search>
              <fvdr-search label="Error" placeholder="Search…" [error]="true" helperText="No results found"></fvdr-search>
              <fvdr-search label="Disabled" placeholder="Search unavailable" [disabled]="true"></fvdr-search>
            </div>
          </div>
          <div class="examples-group">
            <h3 class="examples-group__title">With filter button</h3>
            <div class="examples-col">
              <fvdr-search label="No active filters" placeholder="Search…" [filter]="true" helperText="Click the filter icon to narrow results"></fvdr-search>
              <fvdr-search label="Active filters" placeholder="Search…" [filter]="true" [indicator]="true" helperText="3 filters applied"></fvdr-search>
            </div>
          </div>
        </ng-container>

        <!-- CALENDAR -->
        <ng-container *ngSwitchCase="'calendar'">
          <div class="examples-group">
            <h3 class="examples-group__title">Single date</h3>
            <fvdr-calendar></fvdr-calendar>
          </div>
          <div class="examples-group">
            <h3 class="examples-group__title">Range mode</h3>
            <fvdr-calendar [rangeMode]="true"></fvdr-calendar>
          </div>
        </ng-container>

        <!-- DATEPICKER -->
        <ng-container *ngSwitchCase="'datepicker'">
          <div class="examples-group">
            <h3 class="examples-group__title">Single date</h3>
            <div class="examples-col">
              <fvdr-datepicker label="Due date" placeholder="Select date…"></fvdr-datepicker>
              <fvdr-datepicker label="Disabled" placeholder="Select date…" [disabled]="true"></fvdr-datepicker>
            </div>
          </div>
          <div class="examples-group">
            <h3 class="examples-group__title">Range mode</h3>
            <fvdr-datepicker label="Date range" placeholder="Select range…" [rangeMode]="true"></fvdr-datepicker>
          </div>
        </ng-container>

        <!-- TIMEPICKER -->
        <ng-container *ngSwitchCase="'timepicker'">
          <div class="examples-group">
            <h3 class="examples-group__title">24h mode</h3>
            <div class="examples-col">
              <fvdr-timepicker label="Start time" mode="24h"></fvdr-timepicker>
              <fvdr-timepicker label="Disabled" mode="24h" [disabled]="true"></fvdr-timepicker>
            </div>
          </div>
          <div class="examples-group">
            <h3 class="examples-group__title">12h mode with UTC</h3>
            <fvdr-timepicker label="Meeting time" mode="12h" [showUtc]="true"></fvdr-timepicker>
          </div>
        </ng-container>

        <!-- PHONE INPUT -->
        <ng-container *ngSwitchCase="'phone-input'">
          <div class="examples-group">
            <h3 class="examples-group__title">Default</h3>
            <div class="examples-col">
              <fvdr-phone-input label="Phone number"></fvdr-phone-input>
              <fvdr-phone-input label="Disabled" [disabled]="true"></fvdr-phone-input>
              <fvdr-phone-input label="With error" errorText="Invalid phone number"></fvdr-phone-input>
            </div>
          </div>
        </ng-container>

        <!-- TEXT EDITOR -->
        <ng-container *ngSwitchCase="'text-editor'">
          <div class="examples-group">
            <h3 class="examples-group__title">Basic toolbar</h3>
            <fvdr-text-editor label="Description" toolbar="basic" [height]="240"></fvdr-text-editor>
          </div>
          <div class="examples-group">
            <h3 class="examples-group__title">Full toolbar</h3>
            <fvdr-text-editor label="Notes" toolbar="full" [height]="300"></fvdr-text-editor>
          </div>
          <div class="examples-group">
            <h3 class="examples-group__title">Disabled</h3>
            <fvdr-text-editor label="Readonly" [disabled]="true"></fvdr-text-editor>
          </div>
        </ng-container>

        <!-- RADIO -->
        <ng-container *ngSwitchCase="'radio'">
          <div class="examples-group">
            <h3 class="examples-group__title">Vertical (default)</h3>
            <fvdr-radio [options]="demoRadioOptions" [(value)]="demoRadioValue" layout="vertical"></fvdr-radio>
          </div>
          <div class="examples-group">
            <h3 class="examples-group__title">Horizontal</h3>
            <fvdr-radio [options]="demoRadioOptions" [(value)]="demoRadioValue" layout="horizontal"></fvdr-radio>
          </div>
        </ng-container>

        <!-- SEGMENT -->
        <ng-container *ngSwitchCase="'segment'">

          <!-- ── Segment control (Primary) ── -->
          <div class="examples-group">
            <h3 class="examples-group__title">Segment control — 2 options</h3>
            <fvdr-segment [items]="demoSeg2" [(activeId)]="demoSeg2Value"></fvdr-segment>
          </div>
          <div class="examples-group">
            <h3 class="examples-group__title">Segment control — 3 options</h3>
            <fvdr-segment [items]="demoSegmentItems" [(activeId)]="demoSegmentValue"></fvdr-segment>
          </div>
          <div class="examples-group">
            <h3 class="examples-group__title">Segment control — 4 options</h3>
            <fvdr-segment [items]="demoSegmentItems4" [(activeId)]="demoSegmentValue4"></fvdr-segment>
          </div>

          <!-- ── Table segment control ── -->
          <div class="examples-group">
            <h3 class="examples-group__title">Table segment — S size 28px · Icon + Label</h3>
            <fvdr-segment variant="table" size="sm" [items]="demoTableSegIconLabel" [(activeId)]="demoTableSegValue"></fvdr-segment>
          </div>
          <div class="examples-group">
            <h3 class="examples-group__title">Table segment — S size 28px · Label only</h3>
            <fvdr-segment variant="table" size="sm" [items]="demoTableSegLabel" [(activeId)]="demoTableSegValue2"></fvdr-segment>
          </div>
          <div class="examples-group">
            <h3 class="examples-group__title">Table segment — S size 28px · Label + Counter</h3>
            <fvdr-segment variant="table" size="sm" [items]="demoTableSegCounter" [(activeId)]="demoTableSegValue3"></fvdr-segment>
          </div>
          <div class="examples-group">
            <h3 class="examples-group__title">Table segment — S size 28px · Icon only</h3>
            <fvdr-segment variant="table" size="sm" [items]="demoTableSegIconOnly" [(activeId)]="demoTableSegValue4"></fvdr-segment>
          </div>
          <div class="examples-group">
            <h3 class="examples-group__title">Table segment — M size 40px · Icon + Label</h3>
            <fvdr-segment variant="table" size="md" [items]="demoTableSegIconLabel" [(activeId)]="demoTableSegValue5"></fvdr-segment>
          </div>
          <div class="examples-group">
            <h3 class="examples-group__title">Table segment — M size 40px · Label + Counter</h3>
            <fvdr-segment variant="table" size="md" [items]="demoTableSegCounter" [(activeId)]="demoTableSegValue6"></fvdr-segment>
          </div>
          <div class="examples-group">
            <h3 class="examples-group__title">Table segment — Mobile 32px · Icon + Label</h3>
            <fvdr-segment variant="table" size="mobile" [items]="demoTableSegIconLabel" [(activeId)]="demoTableSegValue7"></fvdr-segment>
          </div>
          <div class="examples-group">
            <h3 class="examples-group__title">Table segment — Active middle item</h3>
            <fvdr-segment variant="table" size="sm" [items]="demoTableSegLabel" [(activeId)]="demoTableSegMiddle"></fvdr-segment>
          </div>

        </ng-container>

        <!-- CHIP -->
        <ng-container *ngSwitchCase="'chip'">
          <div class="examples-group">
            <h3 class="examples-group__title">Variants</h3>
            <div class="examples-row examples-row--wrap">
              <fvdr-chip label="Default"></fvdr-chip>
              <fvdr-chip label="Primary"  variant="primary"></fvdr-chip>
              <fvdr-chip label="Success"  variant="success"></fvdr-chip>
              <fvdr-chip label="Warning"  variant="warning"></fvdr-chip>
              <fvdr-chip label="Error"    variant="error"></fvdr-chip>
            </div>
          </div>
          <div class="examples-group">
            <h3 class="examples-group__title">States</h3>
            <div class="examples-row examples-row--wrap">
              <fvdr-chip label="Removable" [removable]="true"></fvdr-chip>
              <fvdr-chip label="Selected"  [selected]="true"></fvdr-chip>
              <fvdr-chip label="Clickable" [clickable]="true" icon="edit"></fvdr-chip>
            </div>
          </div>
        </ng-container>

        <!-- MULTISELECT -->
        <ng-container *ngSwitchCase="'multiselect'">
          <div class="examples-group">
            <h3 class="examples-group__title">Default</h3>
            <div class="examples-col">
              <fvdr-multiselect label="Countries" [options]="demoMultiselectOptions" placeholder="Select countries…" [(values)]="demoMultiselectValues"></fvdr-multiselect>
              <fvdr-multiselect label="Pre-selected" [options]="demoMultiselectOptions" [values]="demoMultiselectPreselected" placeholder="Select countries…"></fvdr-multiselect>
              <fvdr-multiselect label="Disabled" [options]="demoMultiselectOptions" placeholder="Not available" [disabled]="true"></fvdr-multiselect>
            </div>
          </div>
        </ng-container>

        <!-- DROPLIST -->
        <ng-container *ngSwitchCase="'droplist'">
          <div class="examples-group">
            <h3 class="examples-group__title">Context menu (icons + shortcuts)</h3>
            <div class="examples-row">
              <fvdr-droplist [items]="demoDroplistItems" activeId="edit"></fvdr-droplist>
            </div>
          </div>
          <div class="examples-group">
            <h3 class="examples-group__title">Text only</h3>
            <div class="examples-row">
              <fvdr-droplist [items]="demoDroplistTextOnly"></fvdr-droplist>
            </div>
          </div>
          <div class="examples-group">
            <h3 class="examples-group__title">With badges</h3>
            <div class="examples-row">
              <fvdr-droplist [items]="demoDroplistBadges"></fvdr-droplist>
            </div>
          </div>
          <div class="examples-group">
            <h3 class="examples-group__title">Active / disabled / danger states</h3>
            <div class="examples-row">
              <fvdr-droplist [items]="demoDroplistStates" activeId="active-item"></fvdr-droplist>
            </div>
          </div>
          <div class="examples-group">
            <h3 class="examples-group__title">Button / action menu</h3>
            <div class="examples-row">
              <fvdr-droplist [items]="demoDroplistActions"></fvdr-droplist>
            </div>
          </div>
          <div class="examples-group">
            <h3 class="examples-group__title">With description</h3>
            <div class="examples-row">
              <fvdr-droplist [items]="demoDroplistDescriptions"></fvdr-droplist>
            </div>
          </div>
          <div class="examples-group">
            <h3 class="examples-group__title">Checkbox multi-select</h3>
            <div class="examples-row">
              <fvdr-droplist
                [items]="demoDroplistCheckboxItems"
                [checkboxes]="true"
                [selectedIds]="demoDroplistChecked"
                (selectionChange)="demoDroplistChecked=$event"
              ></fvdr-droplist>
            </div>
          </div>
          <div class="examples-group">
            <h3 class="examples-group__title">Cascade (hover to expand)</h3>
            <div class="examples-row">
              <fvdr-droplist [items]="demoDroplistCascade"></fvdr-droplist>
            </div>
          </div>
        </ng-container>

        <!-- COUNTER -->
        <ng-container *ngSwitchCase="'counter'">
          <div class="examples-group">
            <h3 class="examples-group__title">Small (s)</h3>
            <div class="examples-row examples-row--wrap">
              <div class="example-labeled"><fvdr-counter [value]="3"   variant="default" size="s"></fvdr-counter><span>default</span></div>
              <div class="example-labeled"><fvdr-counter [value]="12"  variant="primary" size="s"></fvdr-counter><span>primary</span></div>
              <div class="example-labeled"><fvdr-counter [value]="99"  variant="error"   size="s"></fvdr-counter><span>error</span></div>
              <div class="example-labeled"><fvdr-counter [value]="150" variant="warning" size="s"></fvdr-counter><span>warning (capped)</span></div>
            </div>
          </div>
          <div class="examples-group">
            <h3 class="examples-group__title">Medium (m)</h3>
            <div class="examples-row examples-row--wrap">
              <div class="example-labeled"><fvdr-counter [value]="7"  variant="default" size="m"></fvdr-counter><span>default</span></div>
              <div class="example-labeled"><fvdr-counter [value]="42" variant="primary" size="m"></fvdr-counter><span>primary</span></div>
            </div>
          </div>
        </ng-container>

        <!-- INLINE MESSAGE -->
        <ng-container *ngSwitchCase="'inline-message'">
          <div class="examples-group">
            <h3 class="examples-group__title">Variants</h3>
            <div class="examples-col">
              <fvdr-inline-message variant="info"    text="Your changes will be auto-saved."></fvdr-inline-message>
              <fvdr-inline-message variant="success" text="Settings saved successfully."></fvdr-inline-message>
              <fvdr-inline-message variant="warning" text="You have unsaved changes."></fvdr-inline-message>
              <fvdr-inline-message variant="error"   text="Failed to connect. Please retry."></fvdr-inline-message>
            </div>
          </div>
        </ng-container>

        <!-- INFO BANNER -->
        <ng-container *ngSwitchCase="'info-banner'">
          <div class="examples-group">
            <h3 class="examples-group__title">Variants</h3>
            <div class="examples-col">
              <fvdr-info-banner variant="info"    title="Update available" message="A new version of this feature is ready."></fvdr-info-banner>
              <fvdr-info-banner variant="success" title="Import complete"  message="120 records were successfully imported."></fvdr-info-banner>
              <fvdr-info-banner variant="warning" title="Action required"  message="Please verify your email address."></fvdr-info-banner>
              <fvdr-info-banner variant="error"   title="Error"            message="Failed to load data. Please refresh."></fvdr-info-banner>
            </div>
          </div>
        </ng-container>

        <!-- TOAST -->
        <ng-container *ngSwitchCase="'toast'">
          <div class="examples-group">
            <h3 class="examples-group__title">Trigger toasts</h3>
            <div class="examples-row examples-row--wrap">
              <fvdr-btn label="Success toast" variant="primary"   size="m" (clicked)="toastSvc.show({ variant: 'success', title: 'Saved!',   message: 'Your changes were saved.' })"></fvdr-btn>
              <fvdr-btn label="Error toast"   variant="danger"    size="m" (clicked)="toastSvc.show({ variant: 'error',   title: 'Error',     message: 'Something went wrong.' })"></fvdr-btn>
              <fvdr-btn label="Warning toast" variant="secondary" size="m" (clicked)="toastSvc.show({ variant: 'warning', title: 'Warning',   message: 'Unsaved changes detected.' })"></fvdr-btn>
              <fvdr-btn label="Info toast"    variant="ghost"     size="m" (clicked)="toastSvc.show({ variant: 'info',    title: 'Info',      message: 'New update available.' })"></fvdr-btn>
            </div>
          </div>
        </ng-container>

        <!-- TABLE -->
        <ng-container *ngSwitchCase="'table'">
          <div class="examples-group">
            <h3 class="examples-group__title">Basic table</h3>
            <fvdr-table [columns]="demoTableCols" [data]="demoTableData"></fvdr-table>
          </div>
          <div class="examples-group">
            <h3 class="examples-group__title">Selectable + bordered</h3>
            <fvdr-table [columns]="demoTableCols" [data]="demoTableData" [selectable]="true" [bordered]="true"></fvdr-table>
          </div>
        </ng-container>

        <!-- TREE -->
        <ng-container *ngSwitchCase="'tree'">
          <div class="examples-group">
            <h3 class="examples-group__title">File tree</h3>
            <fvdr-tree [nodes]="demoTreeNodes"></fvdr-tree>
          </div>
        </ng-container>

        <!-- DROP AREA -->
        <ng-container *ngSwitchCase="'drop-area'">
          <div class="examples-group">
            <h3 class="examples-group__title">Default</h3>
            <fvdr-drop-area title="Drag &amp; drop files here" subtitle="or click to browse"></fvdr-drop-area>
          </div>
          <div class="examples-group">
            <h3 class="examples-group__title">Disabled</h3>
            <fvdr-drop-area title="Upload not available" subtitle="Contact admin" [disabled]="true"></fvdr-drop-area>
          </div>
        </ng-container>

        <!-- FILE ICON -->
        <ng-container *ngSwitchCase="'file-icon'">
          <div class="examples-group">
            <h3 class="examples-group__title">Folders</h3>
            <div class="examples-row examples-row--wrap">
              <div class="example-labeled"><fvdr-file-icon type="folder"></fvdr-file-icon><span>folder</span></div>
              <div class="example-labeled"><fvdr-file-icon type="folder-colored"></fvdr-file-icon><span>colored</span></div>
              <div class="example-labeled"><fvdr-file-icon type="folder-locked"></fvdr-file-icon><span>locked</span></div>
              <div class="example-labeled"><fvdr-file-icon type="folder-files"></fvdr-file-icon><span>files</span></div>
              <div class="example-labeled"><fvdr-file-icon type="folder-requests"></fvdr-file-icon><span>requests</span></div>
              <div class="example-labeled"><fvdr-file-icon type="folder-recycle"></fvdr-file-icon><span>recycle</span></div>
              <div class="example-labeled"><fvdr-file-icon type="folder-qa"></fvdr-file-icon><span>qa</span></div>
            </div>
          </div>
          <div class="examples-group">
            <h3 class="examples-group__title">Documents</h3>
            <div class="examples-row examples-row--wrap">
              <div class="example-labeled"><fvdr-file-icon type="doc"></fvdr-file-icon><span>doc</span></div>
              <div class="example-labeled"><fvdr-file-icon type="pdf"></fvdr-file-icon><span>pdf</span></div>
              <div class="example-labeled"><fvdr-file-icon type="ppt"></fvdr-file-icon><span>ppt</span></div>
              <div class="example-labeled"><fvdr-file-icon type="xls"></fvdr-file-icon><span>xls</span></div>
              <div class="example-labeled"><fvdr-file-icon type="image"></fvdr-file-icon><span>image</span></div>
              <div class="example-labeled"><fvdr-file-icon type="video"></fvdr-file-icon><span>video</span></div>
              <div class="example-labeled"><fvdr-file-icon type="zip"></fvdr-file-icon><span>zip</span></div>
              <div class="example-labeled"><fvdr-file-icon type="txt"></fvdr-file-icon><span>txt</span></div>
              <div class="example-labeled"><fvdr-file-icon type="code"></fvdr-file-icon><span>code</span></div>
              <div class="example-labeled"><fvdr-file-icon type="eml"></fvdr-file-icon><span>eml</span></div>
            </div>
          </div>
        </ng-container>

        <!-- HEADER -->
        <ng-container *ngSwitchCase="'header'">
          <div class="examples-group">
            <h3 class="examples-group__title">Desktop header with nav</h3>
            <fvdr-header
              appName="FVDR"
              [hasLogo]="true"
              [navItems]="demoHeaderNav"
              activeNavId="overview"
              [actions]="demoHeaderActions"
              userName="Alice Johnson"
            ></fvdr-header>
          </div>
          <div class="examples-group">
            <h3 class="examples-group__title">With breadcrumbs</h3>
            <fvdr-header
              appName="FVDR"
              [hasLogo]="true"
              [breadcrumbs]="demoHeaderBreadcrumbs"
              [actions]="demoHeaderActions"
              userName="Alice Johnson"
            ></fvdr-header>
          </div>
        </ng-container>

        <!-- NUMBER STEPPER -->
        <ng-container *ngSwitchCase="'number-stepper'">
          <div class="examples-group">
            <h3 class="examples-group__title">Default</h3>
            <div class="examples-col">
              <fvdr-number-stepper label="Quantity" [min]="0" [max]="10" [(ngModel)]="demoStepperVal"></fvdr-number-stepper>
              <fvdr-number-stepper label="Disabled" [min]="0" [max]="10" [disabled]="true" [(ngModel)]="demoStepperVal"></fvdr-number-stepper>
            </div>
          </div>
        </ng-container>

        <!-- RANGE -->
        <ng-container *ngSwitchCase="'range'">
          <div class="examples-group">
            <h3 class="examples-group__title">Default</h3>
            <div class="examples-col">
              <fvdr-range label="Opacity" [showValue]="true" [(ngModel)]="demoRangeVal"></fvdr-range>
              <fvdr-range label="No value label" [(ngModel)]="demoRangeVal"></fvdr-range>
              <fvdr-range label="Disabled" [disabled]="true" [(ngModel)]="demoRangeVal"></fvdr-range>
            </div>
          </div>
        </ng-container>

        <!-- PROGRESS -->
        <ng-container *ngSwitchCase="'progress'">
          <div class="examples-group">
            <h3 class="examples-group__title">Variants</h3>
            <div class="examples-col">
              <fvdr-progress label="Default"  [value]="65"  variant="default"  [showValue]="true"></fvdr-progress>
              <fvdr-progress label="Success"  [value]="100" variant="success"  [showValue]="true"></fvdr-progress>
              <fvdr-progress label="Warning"  [value]="45"  variant="warning"  [showValue]="true"></fvdr-progress>
              <fvdr-progress label="Error"    [value]="20"  variant="error"    [showValue]="true"></fvdr-progress>
            </div>
          </div>
          <div class="examples-group">
            <h3 class="examples-group__title">Without label</h3>
            <fvdr-progress [value]="72" variant="default"></fvdr-progress>
          </div>
        </ng-container>

        <!-- DEFAULT STUB -->
        <ng-container *ngSwitchDefault>
          <div class="stub-example">
            <p class="stub-example__label">Basic usage</p>
            <div class="stub-example__preview">
              <div class="stub-coming-soon">
                <span>Full interactive demo coming soon</span>
                <span class="stub-selector">{{ entry?.selector }}</span>
              </div>
            </div>
          </div>
        </ng-container>

      </ng-container>
    </section>

    <!-- 7. DESIGN TOKENS -->
    <section class="doc-section" *ngIf="entry.tokens.length">
      <h2 class="doc-section__title">Design Tokens</h2>
      <table class="token-table">
        <thead>
          <tr><th>Token</th><th>Value</th><th>Usage</th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let t of entry.tokens">
            <td><code class="token-name">{{ t.token }}</code></td>
            <td class="token-value-cell">
              <span *ngIf="isColorToken(t.value)" class="color-swatch" [style.background]="t.value"></span>
              <span class="token-value">{{ t.value }}</span>
            </td>
            <td class="token-usage">{{ t.usage }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- 8. USAGE -->
    <section class="doc-section" *ngIf="entry.usedIn.length">
      <h2 class="doc-section__title">Used in</h2>
      <div class="used-in-list">
        <span class="used-in-chip" *ngFor="let screen of entry.usedIn">{{ screen }}</span>
      </div>
    </section>

    <!-- 9. CODE -->
    <section class="doc-section">
      <h2 class="doc-section__title">Code</h2>
      <div class="code-panels">
        <div class="code-panel">
          <div class="code-panel__header">
            <span>Angular HTML</span>
            <button class="code-panel__copy" (click)="copy(entry.codeSnippet)">Copy</button>
          </div>
          <pre class="code-panel__body">{{ entry.codeSnippet }}</pre>
        </div>
        <div class="code-panel">
          <div class="code-panel__header">
            <span>Claude Code Prompt</span>
            <button class="code-panel__copy" (click)="copy(entry.claudePrompt)">Copy</button>
          </div>
          <pre class="code-panel__body">{{ entry.claudePrompt }}</pre>
        </div>
      </div>
    </section>

  </main>

</div>
  `,
  styles: [`
    .doc-page {
      display: flex;
      height: 100vh;
      overflow: hidden;
      font-family: var(--font-family, 'Open Sans', sans-serif);
      background: var(--color-bg-page, #fff);
    }

    /* ── Sidebar ── */
    .doc-sidebar {
      width: 220px;
      min-width: 220px;
      border-right: 1px solid var(--color-border, #dee0eb);
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      background: var(--color-bg-subtle, #fbfbfb);
    }

    .sidebar-back {
      display: block;
      padding: 16px 16px 12px;
      font-size: 13px;
      font-weight: 500;
      color: var(--color-interactive-primary, #2c9c74);
      text-decoration: none;
      border-bottom: 1px solid var(--color-border, #dee0eb);
    }
    .sidebar-back:hover { text-decoration: underline; }

    .sidebar-search {
      padding: 12px 16px;
    }
    .sidebar-input {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid var(--color-border, #dee0eb);
      border-radius: 4px;
      padding: 6px 8px;
      font-size: 13px;
      font-family: inherit;
      background: var(--color-bg-page, #fff);
      color: var(--color-text-primary, #1f2129);
      outline: none;
    }
    .sidebar-input:focus {
      border-color: var(--color-interactive-primary, #2c9c74);
    }

    .sidebar-nav {
      flex: 1;
      padding: 8px 0 16px;
      overflow-y: auto;
    }

    .sidebar-group {
      margin-bottom: 4px;
    }

    .sidebar-group__label {
      padding: 8px 16px 4px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: var(--color-text-secondary, #73757f);
    }

    .sidebar-item {
      display: block;
      width: 100%;
      text-align: left;
      background: none;
      border: none;
      border-left: 2px solid transparent;
      padding: 0 16px;
      height: 36px;
      line-height: 36px;
      font-size: 13px;
      font-family: inherit;
      color: var(--color-text-primary, #1f2129);
      cursor: pointer;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      transition: background 0.12s, color 0.12s;
    }
    .sidebar-item:hover {
      background: var(--color-hover-bg, #f0f2f5);
    }
    .sidebar-item--active {
      border-left-color: var(--color-interactive-primary, #2c9c74);
      color: var(--color-interactive-primary, #2c9c74);
      font-weight: 600;
      background: var(--color-selected-row, #edf7f3);
    }

    /* ── Main ── */
    .doc-main {
      flex: 1;
      overflow-y: auto;
      padding: 40px 48px;
      max-width: 900px;
    }

    /* ── Hero ── */
    .doc-hero {
      margin-bottom: 16px;
      padding-bottom: 16px;
    }

    .doc-hero__top {
      display: flex;
      align-items: baseline;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 12px;
    }

    .doc-hero__title {
      font-size: 28px;
      font-weight: 700;
      color: var(--color-text-primary, #1f2129);
      margin: 0;
      line-height: 1.2;
    }

    .doc-hero__meta {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }

    .doc-hero__selector {
      font-family: 'Menlo', 'Courier New', monospace;
      font-size: 13px;
      background: var(--color-bg-surface, #f7f7f7);
      border-radius: 4px;
      padding: 2px 8px;
      color: var(--color-text-secondary, #73757f);
      border: 1px solid var(--color-border, #dee0eb);
    }

    .doc-hero__status {
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 600;
    }

    .status--stable {
      background: var(--color-selected-row, #edf7f3);
      color: var(--color-interactive-primary, #2c9c74);
    }
    .status--beta {
      background: var(--color-feature-bg, #ebf4fd);
      color: #4862d3;
    }
    .status--deprecated {
      background: #fff5f4;
      color: var(--color-danger, #e54430);
    }

    .doc-hero__category {
      font-size: 11px;
      font-weight: 500;
      text-transform: uppercase;
      background: var(--color-hover-bg, #f0f2f5);
      border-radius: 4px;
      padding: 2px 8px;
      color: var(--color-text-secondary, #73757f);
    }

    .doc-hero__figma {
      font-size: 12px;
      color: var(--color-interactive-primary, #2c9c74);
      text-decoration: none;
      font-weight: 500;
    }
    .doc-hero__figma:hover { text-decoration: underline; }

    .doc-hero__desc {
      font-size: 15px;
      color: var(--color-text-secondary, #73757f);
      line-height: 1.6;
      margin: 0;
    }

    /* ── Sections ── */
    .doc-section {
      margin-bottom: 24px;
      padding-top: 16px;
    }

    .doc-section__title {
      font-size: 18px;
      font-weight: 600;
      color: var(--color-text-primary, #1f2129);
      margin: 0 0 20px;
    }

    /* ── Overview ── */
    .overview-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }

    .overview-col {
      display: flex;
      flex-direction: column;
    }

    .overview-label {
      font-size: 13px;
      font-weight: 700;
      margin: 0 0 8px;
    }
    .overview-label--do  { color: var(--color-interactive-primary, #2c9c74); }
    .overview-label--dont { color: var(--color-danger, #e54430); }

    .overview-list {
      margin: 0;
      padding-left: 18px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .overview-list li {
      font-size: 14px;
      color: var(--color-text-primary, #1f2129);
      line-height: 1.5;
    }

    /* ── Anatomy ── */
    .anatomy-preview {
      background: #1e2125;
      border-radius: 8px;
      padding: 56px 96px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 180px;
    }

    .anatomy-preview-empty {
      font-size: 13px;
      color: rgba(255,255,255,0.35);
      font-style: italic;
      text-align: center;
    }

    .anatomy-wrap {
      position: relative;
      display: inline-block;
    }

    .anatomy-wrap--input { width: 240px; }

    .anatomy-wrap--modal-preview { display: block; }

    .anatomy-label {
      position: absolute;
      font-size: 11px;
      font-family: monospace;
      color: #8a9baa;
      white-space: nowrap;
      letter-spacing: 0.3px;
    }

    .anatomy-label--top { text-align: center; }
    .anatomy-label--top::after {
      content: '';
      display: block;
      width: 1px;
      height: 18px;
      background: rgba(255,255,255,0.18);
      margin: 4px auto 0;
    }

    .anatomy-label--bottom { text-align: center; }
    .anatomy-label--bottom::before {
      content: '';
      display: block;
      width: 1px;
      height: 18px;
      background: rgba(255,255,255,0.18);
      margin: 0 auto 4px;
    }

    .anatomy-label--left { display: flex; align-items: center; }
    .anatomy-label--left::after {
      content: '';
      width: 18px;
      height: 1px;
      background: rgba(255,255,255,0.18);
      margin-left: 6px;
      flex-shrink: 0;
    }

    .anatomy-label--right { display: flex; align-items: center; }
    .anatomy-label--right::before {
      content: '';
      width: 18px;
      height: 1px;
      background: rgba(255,255,255,0.18);
      margin-right: 6px;
      flex-shrink: 0;
    }

    /* ── Dimension brackets (orange) ── */
    .dim-v {
      position: absolute;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-family: monospace;
      color: #e8933a;
      border-left: 1px solid rgba(232,147,58,0.5);
      padding-left: 5px;
      min-width: 32px;
      box-sizing: border-box;
    }
    .dim-v::before, .dim-v::after {
      content: '';
      position: absolute;
      left: -3px;
      width: 5px;
      height: 1px;
      background: rgba(232,147,58,0.5);
    }
    .dim-v::before { top: 0; }
    .dim-v::after  { bottom: 0; }

    .dim-h {
      position: absolute;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      font-size: 10px;
      font-family: monospace;
      color: #e8933a;
      border-top: 1px solid rgba(232,147,58,0.5);
      padding-top: 4px;
      min-height: 20px;
      box-sizing: border-box;
    }
    .dim-h::before, .dim-h::after {
      content: '';
      position: absolute;
      top: -3px;
      width: 1px;
      height: 5px;
      background: rgba(232,147,58,0.5);
    }
    .dim-h::before { left: 0; }
    .dim-h::after  { right: 0; }

    .dim-label {
      position: absolute;
      font-size: 10px;
      font-family: monospace;
      color: #e8933a;
      white-space: nowrap;
    }

    /* ── Mock modal (anatomy preview) ── */
    .mock-modal {
      background: var(--color-bg-page, #fff);
      border-radius: 8px;
      padding: 20px;
      width: 280px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.14);
      border: 1px solid var(--color-border, #dee0eb);
    }
    .mock-modal__header {
      font-size: 15px;
      font-weight: 600;
      color: var(--color-text-primary, #1f2129);
      padding-bottom: 12px;
      border-bottom: 1px solid var(--color-border, #dee0eb);
      margin-bottom: 12px;
    }
    .mock-modal__body {
      font-size: 13px;
      color: var(--color-text-secondary, #73757f);
      margin-bottom: 16px;
    }
    .mock-modal__footer {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }

    /* ── Mock sidebar-nav (anatomy) ── */
    .mock-sidebar {
      width: 220px;
      height: 100%;
      background: #f7f7f7;
      border-radius: 6px;
      border: 1px solid #dee0eb;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .mock-sidebar__account {
      height: 56px;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 0 14px;
      border-bottom: 1px solid #dee0eb;
      flex-shrink: 0;
    }
    .mock-sidebar__badge {
      width: 32px;
      height: 32px;
      border-radius: 4px;
      background: #f4640c;
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .mock-sidebar__name {
      font-size: 13px;
      font-weight: 600;
      color: #1f2129;
    }
    .mock-sidebar__item {
      display: flex;
      align-items: center;
      height: 36px;
      padding: 0 10px;
      gap: 10px;
      font-size: 13px;
      color: #40424b;
      cursor: default;
    }
    .mock-sidebar__item--active {
      background: #ebf8ef;
      font-weight: 600;
      color: #1f2129;
    }
    .mock-sidebar__icon {
      font-size: 14px;
      opacity: 0.6;
      width: 18px;
      text-align: center;
      flex-shrink: 0;
    }
    .mock-sidebar__label { font-size: 13px; }
    .mock-sidebar__footer {
      margin-top: auto;
      height: 48px;
      display: flex;
      align-items: center;
      padding: 0 14px;
      border-top: 1px solid #dee0eb;
    }
    .mock-sidebar__logo {
      font-size: 13px;
      font-weight: 700;
      color: #5f616a;
      letter-spacing: -0.3px;
    }
    .anatomy-wrap--sidebar-nav { min-height: 260px; }

    /* ── Mock quick-access-menu (anatomy) ── */
    .mock-qa-menu {
      width: 260px;
      background: #fff;
      border-radius: 4px;
      border: 1px solid #dee0eb;
      overflow: hidden;
    }
    .mock-qa-menu__header {
      height: 40px;
      background: #f7f7f7;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 12px;
      flex-shrink: 0;
    }
    .mock-qa-menu__title {
      font-size: 13px;
      font-weight: 600;
      color: #1f2129;
    }
    .mock-qa-menu__actions {
      font-size: 11px;
      color: #5f616a;
      letter-spacing: 2px;
    }
    .mock-qa-menu__item {
      display: flex;
      align-items: center;
      height: 36px;
      padding: 0 12px;
      gap: 12px;
      font-size: 13px;
      color: #1f2129;
      cursor: default;
    }
    .mock-qa-menu__item--active { background: #ebf8ef; }
    .mock-qa-menu__icon { font-size: 13px; color: #5f616a; flex-shrink: 0; }
    .mock-qa-menu__item--active .mock-qa-menu__icon { color: #2c9c74; }
    .anatomy-wrap--qa-menu { min-height: 200px; }

    /* ── Navigation example frame — sidebar at natural height ── */
    .nav-example-frame {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 0;
      background: #e9ebf0;
      border-radius: 8px;
      overflow: visible;
    }

    /* ── Examples row flush (for sidebars that need full height) ── */
    .examples-row--flush {
      padding: 0;
      overflow: visible;
    }

    /* ── Examples ── */
    .examples-group {
      margin-bottom: 28px;
    }

    .examples-group__title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--color-text-secondary, #73757f);
      margin: 0 0 12px;
    }

    .examples-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;
      padding: 20px;
      background: var(--color-bg-surface, #f7f7f7);
      border-radius: 8px;
    }

    .examples-row--wrap {
      flex-wrap: wrap;
    }

    .examples-row--align-end {
      align-items: flex-end;
    }

    .examples-col {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 20px;
      background: var(--color-bg-surface, #f7f7f7);
      border-radius: 8px;
    }

    .example-labeled {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    .example-labeled span {
      font-size: 11px;
      color: var(--color-text-secondary, #73757f);
    }

    /* ── Stub default ── */
    .stub-example {
      border: 1px solid var(--color-border, #dee0eb);
      border-radius: 8px;
      overflow: hidden;
    }
    .stub-example__label {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--color-text-secondary, #73757f);
      padding: 8px 16px;
      background: var(--color-bg-surface, #f7f7f7);
      border-bottom: 1px solid var(--color-border, #dee0eb);
      margin: 0;
    }
    .stub-example__preview {
      padding: 40px 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 80px;
    }
    .stub-coming-soon {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: var(--color-text-secondary, #73757f);
      font-style: italic;
    }
    .stub-selector {
      font-family: 'Menlo', 'Courier New', monospace;
      font-size: 12px;
      color: var(--color-interactive-primary, #2c9c74);
      background: var(--color-selected-row, #edf7f3);
      padding: 2px 8px;
      border-radius: 4px;
      font-style: normal;
    }

    /* ── Token table ── */
    .token-table {
      width: 100%;
      border-collapse: collapse;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid var(--color-border, #dee0eb);
    }

    .token-table th {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--color-text-secondary, #73757f);
      border-bottom: 1px solid var(--color-border, #dee0eb);
      padding: 8px 12px;
      text-align: left;
      background: var(--color-bg-surface, #f7f7f7);
    }

    .token-table td {
      padding: 10px 12px;
      border-bottom: 1px solid var(--color-border, #dee0eb);
      font-size: 14px;
      color: var(--color-text-primary, #1f2129);
      vertical-align: middle;
    }

    .token-table tr:last-child td {
      border-bottom: none;
    }

    .token-name {
      font-family: 'Menlo', 'Courier New', monospace;
      font-size: 13px;
      color: var(--color-interactive-primary, #2c9c74);
      background: var(--color-selected-row, #edf7f3);
      padding: 2px 6px;
      border-radius: 3px;
    }

    .token-value-cell {
      white-space: nowrap;
    }

    .color-swatch {
      display: inline-block;
      width: 14px;
      height: 14px;
      border-radius: 3px;
      border: 1px solid var(--color-border, #dee0eb);
      margin-right: 6px;
      vertical-align: middle;
      flex-shrink: 0;
    }

    .token-value {
      font-family: 'Menlo', 'Courier New', monospace;
      font-size: 13px;
      color: var(--color-text-secondary, #73757f);
    }

    .token-usage {
      font-size: 13px;
      color: var(--color-text-secondary, #73757f);
    }

    /* ── Used in ── */
    .used-in-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .used-in-chip {
      border: 1px solid var(--color-border, #dee0eb);
      border-radius: 9999px;
      padding: 4px 12px;
      font-size: 13px;
      color: var(--color-text-secondary, #73757f);
    }

    /* ── Code panels ── */
    .code-panels {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .code-panel {
      border: 1px solid var(--color-border, #dee0eb);
      border-radius: 8px;
      overflow: hidden;
    }

    .code-panel__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px;
      background: var(--color-bg-surface, #f7f7f7);
      border-bottom: 1px solid var(--color-border, #dee0eb);
      font-size: 13px;
      font-weight: 500;
      color: var(--color-text-primary, #1f2129);
    }

    .code-panel__copy {
      background: transparent;
      border: 1px solid var(--color-interactive-primary, #2c9c74);
      border-radius: 4px;
      color: var(--color-interactive-primary, #2c9c74);
      font-size: 12px;
      padding: 2px 10px;
      cursor: pointer;
      font-family: inherit;
      transition: background 0.12s;
    }
    .code-panel__copy:hover {
      background: var(--color-selected-row, #edf7f3);
    }

    .code-panel__body {
      background: #1a1d21;
      color: #e5e7eb;
      font-family: 'Menlo', 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.6;
      padding: 16px;
      overflow-x: auto;
      white-space: pre;
      margin: 0;
    }

    @media (max-width: 768px) {
      .code-panels {
        grid-template-columns: 1fr;
      }
      .overview-grid {
        grid-template-columns: 1fr;
      }
      .anatomy-container {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class DsComponentPageComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  toastSvc = inject(ToastService);
  private sub!: Subscription;

  entry: ComponentDocEntry | undefined;
  searchQuery = '';
  modalOpen = false;

  demoOptions = [
    { value: 'opt1', label: 'Option one' },
    { value: 'opt2', label: 'Option two' },
    { value: 'opt3', label: 'Option three' },
    { value: 'opt4', label: 'Option four' },
  ];

  demoTabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'details',  label: 'Details' },
    { id: 'history',  label: 'History' },
  ];
  activeTab = 'overview';

  demoTabsWithCounters = [
    { id: 'all',      label: 'All',      counter: 24 },
    { id: 'active',   label: 'Active',   counter: 12 },
    { id: 'archived', label: 'Archived', counter: 6  },
  ];
  activeTabCounter = 'all';

  // ── Sidebar Nav demo data ──
  demoNavItems = [
    { id: 'dashboard',   label: 'Dashboard',    icon: 'nav-overview'      as any, iconActive: 'nav-overview-active'      as any, active: true  },
    { id: 'documents',   label: 'Documents',    icon: 'documents'         as any, iconActive: 'documents-active'         as any, active: false, open: false, children: [
      { id: 'sub1', label: 'Client Docs', active: false },
      { id: 'sub2', label: 'Archived',    active: false },
    ]},
    { id: 'participants',label: 'Participants',  icon: 'nav-participants'  as any, iconActive: 'nav-participants-active'  as any, active: false },
    { id: 'permissions', label: 'Permissions',  icon: 'nav-permissions'   as any, iconActive: 'nav-permissions-active'  as any, active: false },
    { id: 'qa',          label: 'Q&A',          icon: 'nav-qa'            as any, iconActive: 'nav-qa-active'            as any, active: false },
    { id: 'settings',    label: 'Settings',     icon: 'nav-settings'      as any, iconActive: 'nav-settings-active'      as any, active: false },
  ];

  // ── Quick Access Menu demo data ──
  demoQaItems = [
    { id: 'recent',    label: 'Recent',    icon: 'clock'  as any, active: false },
    { id: 'favorites', label: 'Favorites', icon: 'sort'   as any, active: false },
    { id: 'new',       label: 'New',       icon: 'upload' as any, active: false },
    { id: 'notes',     label: 'Notes',     icon: 'note'   as any, active: false },
  ];
  demoQaItemsActive = [
    { id: 'recent',    label: 'Recent',    icon: 'clock'  as any, active: true  },
    { id: 'favorites', label: 'Favorites', icon: 'sort'   as any, active: false },
    { id: 'new',       label: 'New',       icon: 'upload' as any, active: false },
    { id: 'notes',     label: 'Notes',     icon: 'note'   as any, active: false },
  ];

  // ── Radio demo data ──
  demoRadioOptions = [
    { value: 'a', label: 'Option A' },
    { value: 'b', label: 'Option B' },
    { value: 'c', label: 'Option C', disabled: true },
  ];
  demoRadioValue = 'a';

  // ── Segment demo data ──
  demoSeg2 = [
    { id: 'on', label: '1st option ON' },
    { id: 'off', label: '2nd option ON' },
  ];
  demoSeg2Value = 'on';

  demoSegmentItems = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'archived', label: 'Archived' },
  ];
  demoSegmentValue = 'all';

  demoSegmentItems4 = [
    { id: 'day', label: 'Day' },
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
    { id: 'year', label: 'Year' },
  ];
  demoSegmentValue4 = 'week';

  // ── Table segment demo data ──
  demoTableSegIconLabel = [
    { id: 'docs',    icon: 'documents' as any, label: 'Documents' },
    { id: 'users',   icon: 'participants' as any, label: 'Users' },
    { id: 'reports', icon: 'reports' as any, label: 'Reports' },
  ];
  demoTableSegValue  = 'docs';
  demoTableSegValue5 = 'docs';
  demoTableSegValue7 = 'docs';

  demoTableSegLabel = [
    { id: 'all',      label: 'All' },
    { id: 'active',   label: 'Active' },
    { id: 'archived', label: 'Archived' },
  ];
  demoTableSegValue2  = 'all';
  demoTableSegMiddle  = 'active';

  demoTableSegCounter = [
    { id: 'all',      label: 'All',      count: 24 },
    { id: 'active',   label: 'Active',   count: 4  },
    { id: 'archived', label: 'Archived', count: 20 },
  ];
  demoTableSegValue3 = 'all';
  demoTableSegValue6 = 'all';

  demoTableSegIconOnly = [
    { id: 'list',  icon: 'menu' as any },
    { id: 'grid',  icon: 'folder' as any },
    { id: 'chart', icon: 'reports' as any },
  ];
  demoTableSegValue4 = 'list';

  // ── Multiselect demo data ──
  demoMultiselectOptions = [
    { value: 'ua', label: 'Ukraine' },
    { value: 'us', label: 'United States' },
    { value: 'gb', label: 'United Kingdom' },
    { value: 'de', label: 'Germany' },
    { value: 'fr', label: 'France' },
    { value: 'pl', label: 'Poland' },
  ];
  demoMultiselectValues: string[] = [];
  demoMultiselectPreselected = ['ua', 'de'];

  // ── Droplist demo data ──
  demoDroplistItems = [
    { id: 'edit',   label: 'Edit',   icon: 'edit'  as any, rightText: '⌘E' },
    { id: 'copy',   label: 'Copy',   icon: 'link'  as any, rightText: '⌘C' },
    { id: 'share',  label: 'Share',  icon: 'share' as any, dividerAfter: true },
    { id: 'delete', label: 'Delete', icon: 'trash' as any, variant: 'danger' as any },
  ];

  demoDroplistTextOnly = [
    { id: 'newest',   label: 'Newest first' },
    { id: 'oldest',   label: 'Oldest first' },
    { id: 'alpha',    label: 'Alphabetical', dividerAfter: true },
    { id: 'manual',   label: 'Manual order' },
  ];

  demoDroplistBadges = [
    { id: 'inbox',     label: 'Inbox',     icon: 'home'      as any, badge: 12 },
    { id: 'pending',   label: 'Pending',   icon: 'clock'     as any, badge: 4  },
    { id: 'drafts',    label: 'Drafts',    icon: 'documents' as any, badge: 2  },
    { id: 'archived',  label: 'Archived',  icon: 'folder'    as any },
  ];

  demoDroplistStates = [
    { id: 'active-item', label: 'Active (selected)', icon: 'check-circle' as any },
    { id: 'normal',      label: 'Normal item',       icon: 'edit'         as any },
    { id: 'disabled',    label: 'Disabled item',     icon: 'lock-close'   as any, disabled: true },
    { id: 'sep',         label: 'Separator below',   icon: 'link'         as any, dividerAfter: true },
    { id: 'danger',      label: 'Danger / Delete',   icon: 'trash'        as any, variant: 'danger' as any },
  ];

  demoDroplistActions = [
    { id: 'upload',   label: 'Upload file',       icon: 'upload'    as any },
    { id: 'create',   label: 'Create folder',     icon: 'add-circle' as any },
    { id: 'import',   label: 'Import from URL',   icon: 'link'      as any, dividerAfter: true },
    { id: 'settings', label: 'Folder settings',   icon: 'settings'  as any },
    { id: 'remove',   label: 'Remove folder',     icon: 'trash'     as any, variant: 'danger' as any },
  ];

  demoDroplistCascade = [
    { id: 'move',   label: 'Move to',  icon: 'folder'  as any, children: [
      { id: 'inbox',    label: 'Inbox',    icon: 'home'      as any },
      { id: 'archive',  label: 'Archive',  icon: 'folder'    as any },
      { id: 'trash',    label: 'Trash',    icon: 'trash'     as any, variant: 'danger' as any },
    ]},
    { id: 'assign', label: 'Assign to', icon: 'sort'   as any, children: [
      { id: 'alice',  label: 'Alice Johnson' },
      { id: 'bob',    label: 'Bob Smith' },
      { id: 'carol',  label: 'Carol White' },
    ]},
    { id: 'label',  label: 'Add label', icon: 'edit'   as any, children: [
      { id: 'urgent',   label: 'Urgent',   },
      { id: 'review',   label: 'Needs review' },
      { id: 'approved', label: 'Approved' },
    ]},
    { id: 'copy',   label: 'Copy link', icon: 'link'   as any, rightText: '⌘C', dividerAfter: true },
    { id: 'delete', label: 'Delete',    icon: 'trash'  as any, variant: 'danger' as any },
  ];

  demoDroplistCheckboxItems = [
    { id: 'design',   label: 'Design',      icon: 'edit'      as any },
    { id: 'dev',      label: 'Development', icon: 'settings'  as any },
    { id: 'qa',       label: 'QA',          icon: 'check-circle' as any },
    { id: 'pm',       label: 'Management',  icon: 'sort'      as any },
    { id: 'support',  label: 'Support',     icon: 'chat'      as any, dividerAfter: true },
    { id: 'archived', label: 'Archived',    icon: 'folder'    as any, disabled: true },
  ];
  demoDroplistChecked: string[] = ['design', 'qa'];

  demoDroplistDescriptions = [
    { id: 'single', label: 'Single select item label', description: 'Lorem ipsum dolor sit amet consectetur.' },
    { id: 'multi',  label: 'Multi select item label',  description: 'Short helper text for this option.' },
    { id: 'active', label: 'Selected item label',      description: 'This one is currently active.',      dividerAfter: true },
    { id: 'plain',  label: 'Plain item without description' },
  ];

  demoOptionsLong = [
    { value: 'au', label: 'Australia' },
    { value: 'ca', label: 'Canada' },
    { value: 'de', label: 'Germany' },
    { value: 'fr', label: 'France' },
    { value: 'gb', label: 'United Kingdom' },
    { value: 'jp', label: 'Japan' },
    { value: 'nl', label: 'Netherlands' },
    { value: 'pl', label: 'Poland' },
    { value: 'us', label: 'United States' },
    { value: 'ua', label: 'Ukraine' },
  ];

  demoOptionsGrouped = [
    { value: 'admin',  label: 'Admin',     group: 'Management' },
    { value: 'owner',  label: 'Owner',     group: 'Management' },
    { value: 'editor', label: 'Editor',    group: 'Collaborators' },
    { value: 'viewer', label: 'Viewer',    group: 'Collaborators' },
    { value: 'guest',  label: 'Guest',     group: 'Collaborators' },
    { value: 'none',   label: 'No access', group: 'Other' },
  ];

  // ── Table demo data ──
  demoTableCols = [
    { key: 'name',   label: 'Name',   sortable: true },
    { key: 'role',   label: 'Role',   sortable: true },
    { key: 'status', label: 'Status' },
    { key: 'date',   label: 'Date',   sortable: true, align: 'right' as any },
  ];
  demoTableData = [
    { name: 'Alice Johnson', role: 'Admin',  status: 'Active',   date: '2026-01-15' },
    { name: 'Bob Smith',     role: 'Editor', status: 'Pending',  date: '2026-02-01' },
    { name: 'Carol White',   role: 'Viewer', status: 'Inactive', date: '2026-03-10' },
    { name: 'Dan Brown',     role: 'Editor', status: 'Active',   date: '2026-03-12' },
  ];

  // ── Tree demo data ──
  demoTreeNodes = [
    {
      id: 'docs', label: 'Documents', icon: 'folder' as any,
      children: [
        { id: 'contracts', label: 'Contracts', icon: 'folder' as any,
          children: [
            { id: 'c1', label: 'Contract_2026.pdf' },
            { id: 'c2', label: 'NDA_signed.pdf' },
          ]
        },
        { id: 'reports', label: 'Reports', icon: 'folder' as any,
          children: [{ id: 'r1', label: 'Q1_report.xlsx' }]
        },
      ]
    },
    { id: 'settings', label: 'Settings', icon: 'settings' as any },
  ];

  // ── Stepper / Range bindings ──
  demoStepperVal = 3;
  demoRangeVal = 40;

  // ── Header demo data ──
  demoHeaderNav = [
    { id: 'overview', label: 'Overview', icon: 'nav-overview' as any },
    { id: 'documents', label: 'Documents', icon: 'documents' as any },
    { id: 'settings',  label: 'Settings',  icon: 'nav-settings' as any },
  ];
  demoHeaderActions = [
    { id: 'bell',   icon: 'bell' as any,   badge: 3 },
    { id: 'search', icon: 'search' as any },
  ];
  demoHeaderBreadcrumbs = [
    { id: 'settings', label: 'Settings' },
    { id: 'api-keys', label: 'API Keys' },
  ];

  // ── Search binding ──
  demoSearchValue = '';

  // ── Datepicker binding ──
  demoDate: Date | undefined;

  get componentId(): string { return this.entry?.id ?? ''; }

  get filteredRegistry(): ComponentDocEntry[] {
    if (!this.searchQuery.trim()) return DS_REGISTRY;
    const q = this.searchQuery.toLowerCase();
    return DS_REGISTRY.filter(e =>
      e.name.toLowerCase().includes(q) ||
      e.selector.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q)
    );
  }

  get groupedRegistry(): { category: (typeof DS_CATEGORIES)[number]; items: ComponentDocEntry[] }[] {
    return DS_CATEGORIES.map(cat => ({
      category: cat,
      items: this.filteredRegistry.filter(e => e.category === cat.id)
    })).filter(g => g.items.length > 0);
  }

  ngOnInit(): void {
    this.sub = this.route.paramMap.subscribe(params => {
      const id = params.get('id') ?? '';
      this.entry = DS_REGISTRY.find(e => e.id === id);
      if (!this.entry) this.router.navigate(['/ds']);
    });
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  navigate(id: string): void { this.router.navigate(['/ds', id]); }

  copy(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.toastSvc.show({ variant: 'success', title: 'Copied!', message: 'Content copied to clipboard.' });
    });
  }

  statusClass(status: ComponentStatus): string {
    return { stable: 'status--stable', beta: 'status--beta', deprecated: 'status--deprecated' }[status];
  }

  categoryLabel(cat: ComponentCategory): string {
    return DS_CATEGORIES.find(c => c.id === cat)?.label ?? cat;
  }

  isColorToken(value: string): boolean {
    return value.startsWith('#') || value.startsWith('rgb');
  }
}
