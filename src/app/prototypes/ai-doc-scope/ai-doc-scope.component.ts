import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DS_COMPONENTS } from '../../shared/ds';
import type { BreadcrumbItem, HeaderAction, SidebarNavItem, TreeNode as DsTreeNode } from '../../shared/ds';
import { TrackerService } from '../../services/tracker.service';
import { VdrMarkComponent } from './vdr-mark.component';
import { AiMarkComponent } from '../ai-motion/ai-mark.component';
import { VdrProtoSwitcherComponent, ProtoGroup } from '../_shared/proto-switcher.component';
import {
  CHAT_THREADS, PROJECT_MARK, REVENUE_QUESTION, TOTAL_DOCS, buildProjectTree,
} from './ai-doc-scope.data';

/** Picker node: the DS tree node plus the partially-ticked state the picker needs. */
type TreeNode = Omit<DsTreeNode, 'children'> & { indeterminate?: boolean; children?: TreeNode[] };
type Picker = 'popover' | 'modal';
interface Turn { id: string; role: 'user' | 'assistant'; text: string; steps?: string; busy?: boolean; verbs?: string[]; vi?: number; sec?: number; scope?: { docs: number; entire: boolean; picker: Picker } }
interface Row { n: TreeNode; level: number; folder: boolean; open: boolean; index: string; title: string }

/**
 * AI Assistant — choose which folders and files the chat answers from.
 * Layout, sizes and colours follow Figma AI-Assistant (Vhy3jLaJ9nasbzTtqbu3qB),
 * section "AI assistant - Chat V1.1" (1620:151965): empty state, chat with the Chats flyout,
 * scope picker as a popover over the composer or as a modal, and the three answer outcomes
 * (everything found / partly found / not found) with the scope stated in the answer.
 */
@Component({
  selector: 'fvdr-ai-doc-scope',
  standalone: true,
  imports: [CommonModule, FormsModule, ...DS_COMPONENTS, VdrProtoSwitcherComponent, VdrMarkComponent, AiMarkComponent],
  template: `
    <div class="app">
      <fvdr-sidebar-nav variant="vdr" accountName="Nike" accountMark="N" [items]="navItems"
        [collapsed]="flyoutOpen" (collapsedChange)="flyoutOpen = $event"></fvdr-sidebar-nav>

      <div class="col">
        <fvdr-header [breadcrumbs]="crumbs" [actions]="headerActions" userName="A I"></fvdr-header>

        <div class="body">
          <!-- Chats flyout (280) -->
          <aside class="fly" [class.fly--closed]="!flyoutOpen" [attr.aria-hidden]="!flyoutOpen" [attr.inert]="flyoutOpen ? null : ''" aria-label="Chats">
            <div class="fly__in">
            <div class="fly__top"><span class="fly__title">Chats</span>
              <button type="button" class="ibtn" aria-label="Hide chats" fvdrTooltip="Hide chats" (click)="flyoutOpen = false"><fvdr-icon name="sidebar-mode"></fvdr-icon></button></div>
            <button type="button" class="fly__new" (click)="newChat()">
              <span class="fly__new-ico"><fvdr-icon name="chat-add"></fvdr-icon></span><span class="fly__new-txt">New</span><span class="fly__kbd">⌘N</span></button>
            <div class="fly__list">
              <div class="fly__sec">Pinned <fvdr-icon name="chevron-down"></fvdr-icon></div>
              <button type="button" class="fly__chat" *ngFor="let t of pinnedThreads"><span>{{ t.title }}</span></button>
              <div class="fly__sec">Recents <fvdr-icon name="chevron-down"></fvdr-icon></div>
              <button type="button" class="fly__chat" *ngFor="let t of recentThreads" [class.fly__chat--on]="t.id === 'current' && turns.length"><span>{{ t.id === 'current' && turns.length ? chatTitle : t.title }}</span></button>
            </div>
            </div>
          </aside>

          <main class="main" [class.main--chat]="turns.length">
            <!-- Top bar: chat title + sources -->
            <div class="top" *ngIf="turns.length">
              <button type="button" class="ibtn" *ngIf="!flyoutOpen" aria-label="Show chats" fvdrTooltip="Show chats" (click)="flyoutOpen = true"><fvdr-icon name="sidebar-mode"></fvdr-icon></button>
              <button type="button" class="top__title">{{ chatTitle }}<fvdr-icon name="chevron-down"></fvdr-icon></button>
              <span class="top__spacer"></span>
              <button type="button" class="ibtn" aria-label="Sources" fvdrTooltip="Sources"><fvdr-icon name="note"></fvdr-icon></button>
            </div>
            <div class="top top--bare" *ngIf="!turns.length && !flyoutOpen">
              <button type="button" class="ibtn" aria-label="Show chats" fvdrTooltip="Show chats" (click)="flyoutOpen = true"><fvdr-icon name="sidebar-mode"></fvdr-icon></button>
            </div>

            <!-- Messages -->
            <div class="scroll" *ngIf="turns.length" #scroll>
              <div class="col760">
                <ng-container *ngFor="let t of turns">
                  <div class="q" *ngIf="t.role === 'user'"><div class="q__bubble">{{ t.text }}</div></div>
                  <div class="a" *ngIf="t.role === 'assistant'">
                    <div class="a__steps" [attr.aria-live]="t.busy ? 'polite' : null">
                      <ng-container *ngIf="t.busy; else plainSteps">
                        <ai-motion-mark mode="flow" skin="outline" [size]="16" [active]="true"></ai-motion-mark>
                        <span class="verb shimmer">{{ t.verbs![t.vi!] }}…</span><span class="timer">{{ t.sec }}s</span>
                      </ng-container>
                      <ng-template #plainSteps>Completed 4 steps · 34 s<fvdr-icon name="chevron-right"></fvdr-icon></ng-template>
                    </div>
                    <ng-container *ngIf="!t.busy && t.scope as s">
                      <div class="a__body">
                        <ng-container>{{ s.picker === 'popover' ? 'According to the documents in scope, I found FY2025 revenue was' : 'FY2025 revenue was' }} <strong>$448M</strong>, up 12% from $400M in FY2024<span class="a__cites"><span class="cite">1</span><span class="cite">2</span></span>.
                          Growth came mainly from direct-to-consumer sales (+21%) and price increases in Europe (+4%). Wholesale was flat.</ng-container>
                      </div>

                      

                      <div class="a__actions">
                        <button type="button" class="srcpill"><fvdr-icon name="copy-link"></fvdr-icon>2 sources</button>
                        <span class="acts">
                          <button type="button" class="ibtn ibtn--s" aria-label="Copy" fvdrTooltip="Copy"><fvdr-icon name="copy-outline"></fvdr-icon></button>
                          <button type="button" class="ibtn ibtn--s" aria-label="Good answer" fvdrTooltip="Good answer"><fvdr-icon name="thumbs-up-outline"></fvdr-icon></button>
                          <button type="button" class="ibtn ibtn--s" aria-label="Bad answer" fvdrTooltip="Bad answer"><fvdr-icon name="thumbs-down-outline"></fvdr-icon></button>
                          <button type="button" class="ibtn ibtn--s" aria-label="Regenerate" fvdrTooltip="Regenerate" (click)="ask(lastPrompt)"><fvdr-icon name="refresh"></fvdr-icon></button>
                        </span>
                        <span class="based" *ngIf="s.picker === 'modal'">Based on {{ s.entire || s.docs > 1 ? 2 : s.docs }} of {{ s.entire ? total : s.docs }} {{ !s.entire && s.docs === 1 ? 'document' : 'documents' }} in <button type="button" class="link" (click)="openPicker()">scope</button></span>
                      </div>
                    </ng-container>
                  </div>
                </ng-container>
              </div>
            </div>

            <!-- Hero (empty state) -->
            <div class="hero" *ngIf="!turns.length"><fvdr-ai-doc-mark></fvdr-ai-doc-mark><span>Good morning, Parker</span></div>

            <!-- Prompt section: scope chip, field, popover picker -->
            <div class="prompt" #prompt [class.prompt--hero]="!turns.length">
              <div class="pop" *ngIf="picker === 'popover' && pickerOpen" [style.max-height.px]="popMax" role="dialog" aria-label="Access to documents for this chat">
                <div class="pop__row pop__row--head"><span class="pop__title">Access to documents for this chat</span>
                  <button type="button" class="pop__x" aria-label="Close" fvdrTooltip="Close" (click)="cancel()"><fvdr-icon name="close"></fvdr-icon></button></div>
                <div class="pop__row"><ng-container *ngTemplateOutlet="searchField"></ng-container></div>
                <div class="pop__tree"><ng-container *ngTemplateOutlet="treeRows"></ng-container></div>
                <div class="pop__row pop__row--foot">
                  <span class="pop__sum">{{ summary }}</span>
                  <button *ngIf="selectedDocs" type="button" class="pbtn pbtn--reset" (click)="clearDraft()">Reset</button>
                  <button type="button" class="pbtn" (click)="cancel()">Cancel</button>
                  <button type="button" class="pbtn pbtn--primary" (click)="apply()">Apply</button>
                </div>
              </div>

              <div class="filters">
                <button type="button" class="chip" [class.chip--on]="pickerOpen" (click)="togglePicker()" aria-haspopup="dialog" [attr.aria-expanded]="pickerOpen">
                  <fvdr-icon name="folders"></fvdr-icon><span>{{ scopeLabel }}</span><fvdr-icon name="chevron-down" class="chip__arrow"></fvdr-icon></button>
                <button *ngIf="limited" type="button" class="reset" (click)="resetScope()">Reset</button>
              </div>
              <div class="field" [class.field--focus]="focused" [class.field--live]="streaming">
                <textarea #input class="field__in" rows="1" placeholder="Ask AI assistant" [(ngModel)]="draft"
                  (focus)="focused = true" (blur)="focused = false" (keydown.enter)="onEnter($event)" aria-label="Ask AI assistant"></textarea>
                <button type="button" class="enter" aria-label="Send" fvdrTooltip="Send" [class.enter--on]="draft.trim()" (click)="send()">
                  <fvdr-icon name="arrow-right" class="enter__ico"></fvdr-icon></button>
              </div>
            </div>
            <p class="foot">AI-generated – check for accuracy</p>
          </main>
        </div>
      </div>
    </div>

    <!-- Shared pieces -->
    <ng-template #searchField>
      <fvdr-search placeholder="Search" size="m" [(ngModel)]="query" (ngModelChange)="onSearch()"></fvdr-search>
    </ng-template>

    <ng-template #treeRows>
      <div class="tree" role="tree">
        <div class="trow" *ngFor="let r of rows(); trackBy: byId" role="treeitem" [class.trow--on]="r.n.checked" [style.padding-left.px]="pad(r)"
             [style.animation-delay.ms]="picker === 'popover' ? delay(r) : null">
          <ng-container *ngIf="r.level === 0; else notRoot"><span class="mark">{{ mark }}</span></ng-container>
          <ng-template #notRoot>
            <button *ngIf="r.folder" type="button" class="chev" [attr.aria-label]="r.open ? 'Collapse' : 'Expand'" (click)="toggle(r.n.id)">
              <fvdr-icon [name]="r.open ? 'chevron-down' : 'chevron-right'"></fvdr-icon></button>
            <span *ngIf="!r.folder" class="chev"></span>
          </ng-template>
          <fvdr-checkbox [checked]="!!r.n.checked" [indeterminate]="!!r.n.indeterminate && !r.n.checked" (checkedChange)="onCheck(r.n, $event)"></fvdr-checkbox>
          <span class="tname" *ngIf="r.level > 0"><fvdr-file-icon [type]="r.n.fileType || 'folder-colored'" class="ficon"></fvdr-file-icon>
            <span class="tidx" *ngIf="r.index">{{ r.index }}</span><span class="ttl">{{ r.title }}</span></span>
          <span class="ttl" *ngIf="r.level === 0">{{ r.n.label }}</span>
        </div>
        <p class="tree__empty" *ngIf="query && !hasMatches">Nothing matches “{{ query }}”.</p>
      </div>
    </ng-template>

    <!-- Modal picker -->
    <ng-container *ngIf="picker === 'modal' && pickerOpen">
      <div class="dim" (click)="cancel()"></div>
      <section class="mod" role="dialog" aria-label="Select folders">
        <header class="mod__head"><h2>Select folders</h2>
          <button type="button" class="pop__x" aria-label="Close" fvdrTooltip="Close" (click)="cancel()"><fvdr-icon name="close"></fvdr-icon></button></header>
        <div class="mod__body">
          <ng-container *ngTemplateOutlet="searchField"></ng-container>
          <div class="mod__tree"><ng-container *ngTemplateOutlet="treeRows"></ng-container></div>
        </div>
        <footer class="mod__foot">
          <button *ngIf="selectedDocs" type="button" class="pbtn pbtn--reset" (click)="clearDraft()">Reset</button>
          <button type="button" class="pbtn" (click)="cancel()">Cancel</button>
          <button type="button" class="pbtn pbtn--primary" (click)="apply()">Apply</button>
        </footer>
      </section>
    </ng-container>

    <fvdr-vdr-proto-switcher [groups]="switcherGroups" (changed)="onOption($event)" (restart)="reset()"></fvdr-vdr-proto-switcher>
  `,
  styles: [`
    :host { display: block; height: 100vh; overflow: hidden; font-family: var(--font-family); color: var(--color-text-primary);
      font-size: var(--font-size-base, 14px); line-height: 20px; }
    /* prototype-only controls: parked in the header's empty centre so they never cover the design */
    fvdr-vdr-proto-switcher { top: var(--space-3); bottom: auto; }
    /* the mockup's header title is plain text — no dropdown chevron after the last breadcrumb */
    fvdr-header ::ng-deep .bc-trail { display: none; }
    .app { display: flex; height: 100%; background: var(--color-stone-0); }
    .col { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .body { flex: 1; min-height: 0; display: flex; }
    button { font-family: var(--font-family); }

    .ibtn { display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto; width: 40px; height: 40px; padding: 0; border: none;
      background: transparent; border-radius: var(--radius-sm); cursor: pointer; color: var(--color-text-secondary); font-size: var(--font-size-lg, 16px); }
    .ibtn:hover { background: var(--color-hover-bg); }
    .ibtn--s { width: 16px; height: 16px; border-radius: 0; }
    .ibtn--s:hover { background: transparent; color: var(--color-text-primary); }

    /* ── Chats flyout ── */
    /* The panel slides open/closed with the same 0.22s ease as the sidebar nav, so both move together */
    .fly { flex: 0 0 auto; width: 280px; overflow: hidden; background: var(--color-stone-0); border-right: 1px solid var(--color-divider); min-height: 0;
      transition: width 0.22s ease, border-color 0.22s ease; }
    .fly--closed { width: 0; border-right-color: transparent; visibility: hidden; transition: width 0.22s ease, border-color 0.22s ease, visibility 0s 0.22s; }
    .fly__in { width: 280px; height: 100%; box-sizing: border-box; display: flex; flex-direction: column; gap: var(--space-1); padding: var(--space-2) 0; min-height: 0; }
    @media (prefers-reduced-motion: reduce) { .fly, .fly--closed { transition: none; } }
    .fly__top { display: flex; align-items: center; height: 40px; padding: 0 var(--space-3) 0 var(--space-6); }
    .fly__title { flex: 1; font-size: var(--font-size-md, 15px); font-weight: var(--font-weight-semi, 600); }
    .fly__new { display: flex; align-items: center; height: 40px; margin-top: var(--space-1); padding: 0 var(--space-6) 0 var(--space-3); border: none; background: transparent; cursor: pointer;
      text-align: left; font-size: var(--font-size-base, 14px); color: var(--color-text-primary); }
    .fly__new:hover { background: var(--color-hover-bg); }
    .fly__new-ico { display: inline-flex; align-items: center; justify-content: center; width: 40px; font-size: var(--font-size-lg, 16px); color: var(--color-text-secondary); }
    .fly__new-txt { flex: 1; }
    .fly__kbd { color: var(--color-text-placeholder); }
    .fly__list { flex: 1; min-height: 0; overflow-y: auto; margin-top: var(--space-2); }
    .fly__sec { display: flex; align-items: center; gap: var(--space-1); height: 32px; padding: 0 var(--space-2) 0 var(--space-6); font-size: var(--text-caption1-size, 12px);
      line-height: 16px; font-weight: var(--font-weight-semi, 600); color: var(--color-text-secondary); }
    .fly__chat + .fly__sec { margin-top: var(--space-4); }
    .fly__sec fvdr-icon { font-size: var(--font-size-base); }
    .fly__chat { display: block; width: 100%; height: 40px; padding: 0 var(--space-6); border: none; background: transparent; cursor: pointer; text-align: left;
      font-size: var(--font-size-base, 14px); color: var(--color-text-primary); }
    .fly__chat span { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .fly__chat:hover { background: var(--color-hover-bg); }
    .fly__chat--on, .fly__chat--on:hover { background: var(--chip-bg-green); }

    /* ── Main ── */
    .main { position: relative; flex: 1; min-width: 0; min-height: 0; display: flex; flex-direction: column; align-items: center; background: var(--color-stone-0); }
    .top { align-self: stretch; display: flex; align-items: center; flex: 0 0 56px; height: 56px; padding: var(--space-2) var(--space-4) var(--space-2) var(--space-2); }
    .top--bare { flex: 0 0 56px; }
    .top__title { display: inline-flex; align-items: center; gap: var(--space-2); height: 40px; padding: var(--space-1) var(--space-4); border: none; background: transparent;
      border-radius: var(--radius-sm); cursor: pointer; font-size: var(--font-size-md, 15px); line-height: 24px; color: var(--color-text-primary); max-width: 560px; }
    .top__title:hover { background: var(--color-hover-bg); }
    .top__title fvdr-icon { color: var(--color-text-secondary); font-size: var(--font-size-lg, 16px); }
    .top__spacer { flex: 1; }

    .scroll { flex: 1; min-height: 0; align-self: stretch; overflow-y: auto; padding: var(--space-6) var(--space-6) 0; }
    .col760 { width: 100%; max-width: 760px; margin: 0 auto; display: flex; flex-direction: column; gap: var(--space-2); padding-bottom: var(--space-4); }
    .q { display: flex; justify-content: flex-end; padding-bottom: var(--space-6); }
    .q__bubble { max-width: 447px; padding: var(--space-4); background: var(--color-stone-200); border-radius: var(--radius-xl, 16px);
      font-size: var(--font-size-md, 15px); line-height: 24px; }
    .a { display: flex; flex-direction: column; gap: var(--space-2); padding-bottom: var(--space-6); }
    .a__steps { display: inline-flex; align-items: center; gap: var(--space-2); align-self: flex-start; height: 20px; color: var(--color-text-secondary); }
    .a__steps fvdr-icon { font-size: var(--font-size-lg, 16px); }
    .a__body { font-size: var(--font-size-md, 15px); line-height: 24px; margin-top: 0; }
    .a__cites { display: inline-flex; gap: var(--space-1); margin-left: var(--space-1); vertical-align: middle; }
    .cite { display: inline-flex; align-items: center; justify-content: center; min-width: 24px; height: 24px; padding: 2px 8px; box-sizing: border-box; border-radius: var(--radius-sm);
      background: var(--chip-bg-default); font-size: var(--text-caption1-size, 12px); line-height: 16px; }
    .a__steps .verb { color: var(--color-text-secondary); }
    .a__steps .shimmer { background: linear-gradient(90deg, var(--color-text-secondary) 0%, var(--color-text-secondary) 40%,
        var(--ai-mark-shimmer) 50%, var(--color-text-secondary) 60%, var(--color-text-secondary) 100%);
      background-size: 250% 100%; -webkit-background-clip: text; background-clip: text; color: transparent; animation: shimmer 2s linear infinite; }
    @keyframes shimmer { from { background-position: 100% 0; } to { background-position: -150% 0; } }
    .a__steps .timer { color: var(--color-text-placeholder); font-variant-numeric: tabular-nums; }
    @media (prefers-reduced-motion: reduce) { .a__steps .shimmer, .field--live { animation: none; } }
    .a__actions { display: flex; align-items: center; gap: var(--space-4); margin-top: var(--space-2); }
    .srcpill { display: inline-flex; align-items: center; gap: var(--space-2); height: 28px; padding: var(--space-1) var(--space-3); border: none; border-radius: 100px;
      background: var(--color-stone-200); cursor: pointer; font-size: var(--font-size-md, 15px); line-height: 24px; color: var(--color-text-primary); }
    .srcpill:hover { background: var(--color-hover-bg); }
    .srcpill fvdr-icon { font-size: var(--font-size-lg, 16px); color: var(--color-text-secondary); }
    .acts { display: inline-flex; align-items: center; gap: var(--space-4); }

    .based { color: var(--color-text-secondary); }
    .based .link { font-weight: 400; }
    .link { padding: 0; border: none; background: transparent; cursor: pointer; font-size: var(--font-size-base, 14px); font-weight: var(--font-weight-semi, 600); color: var(--color-primary-500); }
    .link:hover { text-decoration: underline; }

    /* Empty state: hero + prompt centred in the content area; footnote pinned to the bottom */
    .hero { margin-top: auto; display: flex; align-items: center; gap: var(--space-4); height: 32px; font-size: var(--font-size-2xl); line-height: 28px; font-weight: var(--font-weight-semi, 600); }
    .prompt { position: relative; flex: 0 0 auto; width: calc(100% - var(--space-12)); max-width: 760px; display: flex; flex-direction: column; gap: var(--space-1); margin-top: var(--space-4); box-sizing: border-box; }
    .prompt--hero { margin-top: var(--space-8); margin-bottom: auto; }
    .main--chat .prompt { margin-top: var(--space-4); }
    .foot { margin: var(--space-4) 0 var(--space-6); font-size: var(--text-caption1-size, 12px); line-height: 16px; color: var(--color-text-secondary); }
    .main:not(.main--chat) .foot { position: absolute; left: 0; right: 0; bottom: 0; margin: 0 0 var(--space-6); text-align: center; }

    .filters { display: flex; align-items: center; justify-content: space-between; height: 40px; padding-right: var(--space-3); }
    .chip { display: inline-flex; align-items: center; gap: var(--space-2); height: 40px; padding: var(--space-1) var(--space-3); border: none; border-radius: var(--radius-sm);
      background: transparent; cursor: pointer; font-size: var(--font-size-base, 14px); color: var(--color-text-primary); }
    .chip:hover, .chip--on { background: var(--color-hover-bg); }
    .chip fvdr-icon { font-size: var(--font-size-lg, 16px); color: var(--color-text-secondary); }
    .chip .chip__arrow { font-size: var(--text-caption1-size, 12px); }
    .reset { height: 32px; padding: 0 var(--space-2); border: none; background: transparent; border-radius: var(--radius-sm); cursor: pointer; font-size: var(--font-size-base, 14px); color: var(--color-text-secondary); }
    .reset:hover { background: var(--color-hover-bg); color: var(--color-text-primary); }
    .field { display: flex; align-items: center; gap: var(--space-2); min-height: 48px; padding: var(--space-2) var(--space-4); box-sizing: border-box;
      background: var(--color-stone-0); border: 1px solid var(--color-stone-500); border-radius: var(--radius-sm); }
    .field--focus { border-color: var(--color-primary-500); }
    /* Living field edge: the AI gradient hairline flows while the assistant works */
    .field--live, .field--live.field--focus { border-color: transparent;
      background: linear-gradient(var(--color-stone-0), var(--color-stone-0)) padding-box, var(--ai-edge) border-box;
      background-size: 100% 100%, 300% 100%; animation: edge 3s linear infinite; }
    @keyframes edge { to { background-position: 0 0, -300% 0; } }
    .field__in { flex: 1; min-width: 0; padding: 0; border: none; outline: none; resize: none; background: transparent; font-family: var(--font-family);
      font-size: var(--font-size-md, 15px); line-height: 24px; color: var(--color-text-primary); }
    .field__in::placeholder { color: var(--color-text-placeholder); }
    .enter { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; padding: 0; border: none; border-radius: var(--radius-sm); background: transparent;
      cursor: pointer; color: var(--color-text-placeholder); font-size: var(--font-size-lg, 16px); }
    .enter:hover { background: var(--color-hover-bg); }
    /* active once something is typed: filled green, white arrow */
    .enter--on, .enter--on:hover { background: var(--color-primary-500); color: var(--color-text-inverse, #fff); }
    .enter--on:hover { background: var(--color-primary-600); }
    .enter__ico { transform: rotate(-90deg); }

    /* ── Tree (shared by popover and modal) ── */
    .tree { display: flex; flex-direction: column; padding: var(--space-1) 0; }
    .trow { display: flex; align-items: center; gap: var(--space-4); height: 40px; padding: var(--space-2) var(--space-4); box-sizing: border-box; cursor: default; }
    .trow:hover { background: var(--color-hover-bg); }
    .trow--on, .trow--on:hover { background: var(--chip-bg-green); border-radius: var(--radius-sm); }
    .chev { flex: 0 0 16px; width: 16px; height: 16px; display: inline-flex; align-items: center; justify-content: center; padding: 0; border: none; background: transparent;
      cursor: pointer; color: var(--color-text-secondary); font-size: var(--text-caption1-size, 12px); }
    span.chev { cursor: default; }
    .mark { flex: 0 0 16px; width: 16px; height: 16px; display: inline-flex; align-items: center; justify-content: center; border-radius: var(--radius-xs); background: var(--color-primary-500);
      color: var(--color-text-inverse, #fff); font-size: 8px; font-weight: 700; line-height: 1; }
    .tname { flex: 1; min-width: 0; display: flex; align-items: center; gap: var(--space-2); }
    .ficon { flex: 0 0 20px; width: 20px; height: 20px; font-size: var(--font-size-2xl); }
    .tidx { flex: 0 0 auto; }
    .ttl { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .tree__empty { margin: var(--space-4) 0; text-align: center; color: var(--color-text-secondary); }

    /* ── Popover: covers the chip row, 4px above the field; unfolds upwards ── */
    .pop { position: absolute; left: 0; right: 0; bottom: 52px; z-index: 100; display: flex; flex-direction: column; gap: var(--space-1); padding: var(--space-1) var(--space-2) var(--space-4);
      background: var(--color-stone-0); border: 1px solid var(--color-stone-500); border-radius: var(--radius-sm); box-sizing: border-box;
      transform-origin: left bottom; animation: pop-in 260ms cubic-bezier(.2, .8, .2, 1) both; }
    .pop__row { flex: 0 0 auto; display: flex; align-items: center; gap: var(--space-4); height: 40px; padding: 0 var(--space-2); }
    .pop__row > fvdr-search { flex: 1; }
    .pop__row--head { justify-content: space-between; }
    .pop__title { font-size: var(--font-size-md, 15px); font-weight: var(--font-weight-semi, 600); }
    .pop__x { display: inline-flex; padding: var(--space-1); border: none; background: transparent; cursor: pointer; border-radius: var(--radius-sm); color: var(--color-text-secondary); font-size: var(--font-size-lg, 16px); }
    .pop__x:hover { background: var(--color-hover-bg); }
    .pop__tree { flex: 1 1 auto; min-height: 0; max-height: 368px; overflow-y: auto; }
    .pop__row--foot { justify-content: flex-end; }
    .pop__sum { flex: 1; color: var(--color-text-placeholder); }
    .pbtn { height: 40px; padding: 0 var(--space-4); border: 1px solid var(--color-stone-500); border-radius: var(--radius-sm); background: var(--color-stone-0); cursor: pointer;
      font-size: var(--font-size-md, 15px); line-height: 16px; color: var(--color-stone-900, #40424b); }
    .pbtn:hover { background: var(--color-hover-bg); }
    .pbtn--reset { border-color: transparent; background: transparent; }
    .pbtn--primary { border-color: var(--color-primary-500); background: var(--color-primary-500); color: var(--color-text-inverse, #fff); }
    .pbtn--primary:hover { background: var(--color-primary-600, var(--color-primary-500)); }
    @keyframes pop-in {
      from { opacity: 0; transform: translateY(8px); clip-path: inset(72% 0 0 0 round 4px); }
      to   { opacity: 1; transform: none; clip-path: inset(0 round 4px); }
    }
    .pop .trow { animation: row-in 220ms ease-out both; }
    @keyframes row-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
    @media (prefers-reduced-motion: reduce) { .pop, .pop .trow { animation: none; } }

    /* ── Modal 512 × hug, 40% black overlay ── */
    .dim { position: fixed; inset: 0; z-index: 200; background: rgba(0, 0, 0, 0.4); }
    .mod { position: fixed; z-index: 210; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 512px; max-width: calc(100vw - 32px); max-height: calc(100vh - 32px);
      display: flex; flex-direction: column; background: var(--color-stone-0); border-radius: var(--radius-sm); box-shadow: var(--shadow-popover); animation: mod-in 180ms ease-out both; }
    @keyframes mod-in { from { opacity: 0; transform: translate(-50%, -48%); } to { opacity: 1; transform: translate(-50%, -50%); } }
    .mod__head { display: flex; align-items: center; justify-content: space-between; gap: var(--space-2); padding: var(--space-6); }
    .mod__head h2 { margin: 0; font-size: var(--font-size-xl2, 18px); line-height: 24px; font-weight: var(--font-weight-semi, 600); }
    .mod__body { display: flex; flex-direction: column; gap: var(--space-4); padding: 0 var(--space-6); min-height: 0; }
    .mod__tree { max-height: 360px; overflow-y: auto; margin: 0 calc(var(--space-6) * -1); padding: 0 var(--space-6); }
    .mod__tree .trow { padding-left: var(--space-2); }
    .mod__foot { display: flex; justify-content: flex-end; gap: var(--space-2); padding: var(--space-6); }
  `],
})
export class AiDocScopeComponent implements OnInit, OnDestroy {
  private tracker = inject(TrackerService);
  @ViewChild('scroll') private scrollEl?: ElementRef<HTMLElement>;
  @ViewChild('prompt') private promptEl?: ElementRef<HTMLElement>;
  /** Room above the field for the popover (it never leaves the prototype; the list scrolls instead). */
  popMax: number | null = null;

  readonly question = REVENUE_QUESTION;
  readonly total = TOTAL_DOCS;
  readonly mark = PROJECT_MARK;
  readonly pinnedThreads = CHAT_THREADS.filter(t => t.pinned);
  readonly recentThreads = CHAT_THREADS.filter(t => !t.pinned);

  // ── Shell ──
  flyoutOpen = false;
  crumbs: BreadcrumbItem[] = [{ id: 'ai', label: 'AI assistant' }];
  headerActions: HeaderAction[] = [{ id: 'help', icon: 'help' }];
  navItems: SidebarNavItem[] = [
    { id: 'ai', label: 'AI assistant', icon: 'ai-assistant', iconActive: 'ai-assistant', active: true },
    { id: 'dashboard', label: 'Dashboard', icon: 'nav-overview', iconActive: 'nav-overview-active' },
    { id: 'documents', label: 'Documents', icon: 'documents', iconActive: 'documents-active', children: [{ id: 'all', label: 'All' }] },
    { id: 'participants', label: 'Participants', icon: 'users-groups', iconActive: 'users-groups-active' },
    { id: 'permissions', label: 'Permissions', icon: 'nav-permissions', iconActive: 'nav-permissions-active' },
    { id: 'qna', label: 'Q&A', icon: 'nav-qa', iconActive: 'nav-qa-active', children: [{ id: 'q', label: 'Questions' }] },
    { id: 'reports', label: 'Reports', icon: 'nav-reports', iconActive: 'nav-reports-active', children: [{ id: 'log', label: 'Activity log' }] },
    { id: 'settings', label: 'Settings', icon: 'nav-settings', iconActive: 'nav-settings-active', children: [{ id: 'project', label: 'Project' }] },
    { id: 'archiving', label: 'Project archiving', icon: 'nav-archiving', iconActive: 'nav-archiving-active' },
    { id: 'recycle-bin', label: 'Recycle bin', icon: 'recycle-bin', iconActive: 'recycle-bin-active' },
  ];

  // ── Prototype option ──
  picker: Picker = 'popover';
  switcherGroups: ProtoGroup[] = [];
  private syncSwitcher(): void {
    this.switcherGroups = [{ id: 'picker', label: 'Picker', value: this.picker,
      options: [{ id: 'popover', label: 'Popover' }, { id: 'modal', label: 'Modal' }] }];
  }
  onOption(e: { group: string; value: string }): void {
    if (e.group === 'picker') { this.pickerOpen = false; this.picker = e.value as Picker; }
    this.syncSwitcher();
  }

  // ── Scope state ──
  private modelNodes: TreeNode[] = buildProjectTree();
  viewNodes: TreeNode[] = this.modelNodes;
  private openIds = new Set<string>(['root']);
  query = '';
  hasMatches = true;
  pickerOpen = false;
  /** Ids ticked in the applied scope (empty = the entire project). */
  private applied = new Set<string>();

  get limited(): boolean { return this.applied.size > 0; }
  get selectedDocs(): number { return this.leaves(this.modelNodes).filter(n => n.checked).length; }
  get summary(): string {
    const n = this.selectedDocs;
    return n ? `${n} selected` : 'Entire project by default';
  }
  get scopeLabel(): string {
    if (!this.limited) return 'Work in the entire project';
    const n = this.leaves(this.modelNodesApplied()).filter(x => x.checked).length;
    return `Answers are limited to ${n} ${n === 1 ? 'document' : 'documents'}`;
  }

  // ── Picker ──
  togglePicker(): void { this.pickerOpen ? this.cancel() : this.openPicker(); }
  openPicker(): void {
    this.query = ''; this.viewNodes = this.modelNodes;
    this.restore(this.applied);
    this.pickerOpen = true;
    this.updatePopMax();
  }
  /** Popover bottom sits 52px above the prompt's bottom edge; leave the 64px header and 8px clear above it. */
  @HostListener('window:resize') updatePopMax(): void {
    const r = this.promptEl?.nativeElement.getBoundingClientRect();
    this.popMax = r ? Math.max(240, Math.floor(r.bottom - 52 - 64 - 8)) : null;
  }
  cancel(): void { this.pickerOpen = false; }
  apply(): void {
    this.applied = this.checkedIds();
    this.pickerOpen = false;
    this.tracker.trackTask('ai-doc-scope', 'task_complete');
  }
  clearDraft(): void { this.restore(new Set()); this.syncView(); }
  resetScope(): void { this.applied = new Set(); this.restore(this.applied); }

  onSearch(): void {
    const q = this.query.trim().toLowerCase();
    if (!q) { this.viewNodes = this.modelNodes; this.hasMatches = true; return; }
    const filter = (nodes: TreeNode[]): TreeNode[] => nodes.flatMap(n => {
      const kids = n.children ? filter(n.children) : [];
      const self = n.label.toLowerCase().includes(q);
      return self || kids.length ? [{ ...n, children: n.children ? (self ? n.children : kids) : undefined }] : [];
    });
    this.viewNodes = filter(this.modelNodes);
    this.hasMatches = this.viewNodes.length > 0;
  }

  // ── Tree rendering ──
  byId = (_: number, r: Row) => r.n.id;
  pad(r: Row): number { return r.level <= 1 ? 16 : r.level === 2 ? 24 : 40; }
  delay(r: Row): number { return 60 + Math.min(this.rowIndex(r), 8) * 30; }
  private rowIndex(r: Row): number { return this.rows().findIndex(x => x.n.id === r.n.id); }
  rows(): Row[] {
    const out: Row[] = []; const searching = !!this.query.trim();
    const walk = (nodes: TreeNode[], level: number) => nodes.forEach(n => {
      const folder = !!n.children?.length; const open = searching || this.openIds.has(n.id);
      const m = /^([\d.]+)\s+(.*)$/.exec(n.label);
      out.push({ n, level, folder, open, index: m ? m[1] : '', title: m ? m[2] : n.label });
      if (folder && open) walk(n.children!, level + 1);
    });
    walk(this.viewNodes, 0);
    return out;
  }
  toggle(id: string): void { this.openIds.has(id) ? this.openIds.delete(id) : this.openIds.add(id); }

  onCheck(node: TreeNode, checked: boolean): void {
    const target = this.find(this.modelNodes, node.id);
    if (!target) return;
    this.setDeep(target, checked);
    this.recompute(this.modelNodes);
    this.syncView();
  }

  // ── Chat ──
  turns: Turn[] = [];
  draft = '';
  focused = false;
  chatTitle = 'What was our revenue growth in FY2025?';
  lastPrompt = '';
  private seq = 0;
  private timers: ReturnType<typeof setTimeout>[] = [];
  get streaming(): boolean { return this.turns.some(t => t.busy); }

  onEnter(e: Event): void { if (!(e as KeyboardEvent).shiftKey) { e.preventDefault(); this.send(); } }
  send(): void { const t = this.draft.trim(); if (t) { this.draft = ''; this.ask(t); } }
  ask(prompt: string): void {
    if (this.streaming || !prompt.trim()) return;
    if (!this.turns.length) {
      this.chatTitle = prompt === REVENUE_QUESTION ? 'What was our revenue growth in FY2025?' : (prompt.length > 38 ? prompt.slice(0, 38) + '…' : prompt);
      this.flyoutOpen = true;
    }
    this.lastPrompt = prompt;
    const a = 'a' + ++this.seq;
    this.turns = [...this.turns, { id: 'u' + this.seq, role: 'user', text: prompt },
      { id: a, role: 'assistant', text: '', busy: true, verbs: this.verbs(), vi: 0, sec: 0 }];
    this.scrollDown();
    const patch = (p: Partial<Turn>) => { this.turns = this.turns.map(t => t.id === a ? { ...t, ...p } : t); };
    // rotating verbs every 0.9 s, a seconds counter, answer after ~2.8 s
    [1, 2, 3].forEach(i => this.timers.push(setTimeout(() => patch({ vi: Math.min(i, this.verbs().length - 1) }), i * 900)));
    [1, 2].forEach(i => this.timers.push(setTimeout(() => patch({ sec: i }), i * 1000)));
    this.timers.push(setTimeout(() => {
      patch({ busy: false, scope: this.scopedAnswer() });
      this.scrollDown();
    }, 2800));
  }
  /** Status verbs tied to what the answer is actually reading. */
  private verbs(): string[] {
    const n = this.leaves(this.modelNodesApplied()).filter(x => x.checked).length;
    return this.limited
      ? [`Searching ${n} selected ${n === 1 ? 'document' : 'documents'}`, 'Reading the matching files', 'Cross-checking figures', 'Checking the answer against your scope']
      : ['Searching the entire project', 'Reading the matching files', 'Cross-checking figures', 'Drafting the answer'];
  }
  newChat(): void { this.timers.forEach(clearTimeout); this.turns = []; this.draft = ''; }
  private scrollDown(): void { setTimeout(() => { const el = this.scrollEl?.nativeElement; if (el) el.scrollTop = el.scrollHeight; }); }

  /** The answer is built from whatever is in scope: the entire project, or the documents picked. */
  private scopedAnswer(): { docs: number; entire: boolean; picker: Picker } {
    if (!this.limited) return { docs: TOTAL_DOCS, entire: true, picker: this.picker };
    const docs = this.leaves(this.modelNodesApplied()).filter(n => n.checked).length;
    return { docs, entire: false, picker: this.picker };
  }

  reset(): void { this.newChat(); this.resetScope(); this.pickerOpen = false; this.flyoutOpen = false; }

  @HostListener('document:keydown.escape') onEsc(): void { if (this.pickerOpen) this.cancel(); }
  /** Click outside the popover closes it (the chip and the popover itself are excluded). */
  @HostListener('document:mousedown', ['$event']) onDoc(e: MouseEvent): void {
    if (!this.pickerOpen || this.picker !== 'popover') return;
    const el = e.target as HTMLElement;
    if (!el.closest('.pop') && !el.closest('.chip')) this.cancel();
  }

  ngOnInit(): void { this.syncSwitcher(); this.tracker.trackPageView('ai-doc-scope'); }
  ngOnDestroy(): void { this.timers.forEach(clearTimeout); this.tracker.destroyListeners(); }

  // ── Tree helpers ──
  private find(nodes: TreeNode[], id: string): TreeNode | undefined {
    for (const n of nodes) { if (n.id === id) return n; const f = n.children && this.find(n.children, id); if (f) return f; }
    return undefined;
  }
  private leaves(nodes: TreeNode[]): TreeNode[] { return nodes.flatMap(n => n.children?.length ? this.leaves(n.children) : [n]); }
  private setDeep(n: TreeNode, checked: boolean): void { n.checked = checked; n.indeterminate = false; n.children?.forEach(c => this.setDeep(c, checked)); }
  private recompute(nodes: TreeNode[]): void {
    for (const n of nodes) {
      if (!n.children?.length) continue;
      this.recompute(n.children);
      const all = n.children.every(c => c.checked), none = n.children.every(c => !c.checked && !c.indeterminate);
      n.checked = all; n.indeterminate = !all && !none;
    }
  }
  private checkedIds(): Set<string> {
    const ids = new Set<string>(); const walk = (ns: TreeNode[]) => ns.forEach(n => { if (n.checked) ids.add(n.id); if (n.children) walk(n.children); });
    walk(this.modelNodes); return ids;
  }
  private restore(ids: Set<string>): void {
    const walk = (ns: TreeNode[]) => ns.forEach(n => { n.checked = ids.has(n.id); n.indeterminate = false; if (n.children) walk(n.children); });
    walk(this.modelNodes); this.recompute(this.modelNodes);
  }
  /** Mirror model state into the filtered copy (it holds copies of node flags). */
  private syncView(): void {
    if (this.viewNodes === this.modelNodes) return;
    const walk = (ns: TreeNode[]) => ns.forEach(n => { const m = this.find(this.modelNodes, n.id); if (m) { n.checked = m.checked; n.indeterminate = m.indeterminate; } if (n.children) walk(n.children); });
    walk(this.viewNodes);
  }
  /** Model nodes as they were at the last Apply (the draft in the picker may differ). */
  private modelNodesApplied(): TreeNode[] {
    const clone = (ns: TreeNode[]): TreeNode[] => ns.map(n => ({ ...n, checked: this.applied.has(n.id), children: n.children && clone(n.children) }));
    return clone(this.modelNodes);
  }
}
