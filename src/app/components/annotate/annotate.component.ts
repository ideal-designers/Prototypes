import { AfterViewChecked, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface RectSnap {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface AnnotationTarget {
  selector: string;
  tag: string;
  classes: string[];
  rect: RectSnap;
  text?: string;
  styles: Record<string, string>;
}

type AnnotationKind = 'element' | 'multi' | 'area' | 'text';

interface Annotation {
  id: number;
  kind: AnnotationKind;
  note: string;
  rect: RectSnap;
  capturedScroll: { x: number; y: number };
  targets: AnnotationTarget[];
  text?: string;
}

interface Pending {
  id: number | null;
  kind: AnnotationKind;
  noteText: string;
  rect: RectSnap;
  targets: AnnotationTarget[];
  text?: string;
  anchorX: number;
  anchorY: number;
}

const STYLE_KEYS = ['color', 'background-color', 'font-size', 'font-weight', 'padding', 'border-radius', 'display'];

function rectFromPoints(a: { x: number; y: number }, b: { x: number; y: number }): RectSnap {
  return {
    left: Math.min(a.x, b.x),
    top: Math.min(a.y, b.y),
    width: Math.abs(a.x - b.x),
    height: Math.abs(a.y - b.y),
  };
}

function rectFromEl(el: Element): RectSnap {
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
}

function shortLabel(el: Element): string {
  const cls = Array.from(el.classList).slice(0, 2).join('.');
  return el.tagName.toLowerCase() + (cls ? '.' + cls : '');
}

function getSelector(el: Element): string {
  if (el.id) return '#' + el.id;
  const parts: string[] = [];
  let node: Element | null = el;
  let depth = 0;
  while (node && depth < 4) {
    let part = node.tagName.toLowerCase();
    const classes = Array.from(node.classList).slice(0, 2);
    if (classes.length) part += '.' + classes.join('.');
    const parent = node.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter((c) => c.tagName === node!.tagName);
      if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(node) + 1})`;
    }
    parts.unshift(part);
    node = node.parentElement;
    depth++;
  }
  return parts.join(' > ');
}

function styleSubset(el: Element): Record<string, string> {
  const cs = getComputedStyle(el);
  const out: Record<string, string> = {};
  for (const key of STYLE_KEYS) out[key] = cs.getPropertyValue(key);
  return out;
}

function truncateText(s: string, n: number): string {
  const clean = s.replace(/\s+/g, ' ').trim();
  return clean.length > n ? clean.slice(0, n) + '…' : clean;
}

function toTarget(el: Element): AnnotationTarget {
  const innerText = (el as HTMLElement).innerText;
  return {
    selector: getSelector(el),
    tag: el.tagName.toLowerCase(),
    classes: Array.from(el.classList),
    rect: rectFromEl(el),
    text: innerText ? truncateText(innerText, 80) : undefined,
    styles: styleSubset(el),
  };
}

function unionRect(rects: RectSnap[]): RectSnap {
  const left = Math.min(...rects.map((r) => r.left));
  const top = Math.min(...rects.map((r) => r.top));
  const right = Math.max(...rects.map((r) => r.left + r.width));
  const bottom = Math.max(...rects.map((r) => r.top + r.height));
  return { left, top, width: right - left, height: bottom - top };
}

function collectElementsInRect(rect: RectSnap): Element[] {
  const found = new Set<Element>();
  const cols = 14;
  const rows = 14;
  const stepX = Math.max(4, rect.width / cols);
  const stepY = Math.max(4, rect.height / rows);
  for (let y = rect.top; y <= rect.top + rect.height; y += stepY) {
    for (let x = rect.left; x <= rect.left + rect.width; x += stepX) {
      const el = document.elementFromPoint(x, y);
      if (el && el !== document.documentElement && el !== document.body && !el.closest('.fvdr-annotate-ui')) {
        found.add(el);
      }
    }
  }
  const arr = Array.from(found);
  return arr.filter((el) => !arr.some((other) => other !== el && el.contains(other)));
}

function kindIconFor(kind: AnnotationKind): string {
  switch (kind) {
    case 'element': return '🖱️';
    case 'multi': return '⛶';
    case 'area': return '▭';
    case 'text': return '🔤';
  }
}

function kindTitle(kind: AnnotationKind): string {
  switch (kind) {
    case 'element': return 'Element';
    case 'multi': return 'Multi-select';
    case 'area': return 'Area';
    case 'text': return 'Text selection';
  }
}

@Component({
  selector: 'fvdr-annotate',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <button
      class="annotate-fab fvdr-annotate-ui"
      [class.annotate-fab--active]="panelOpen"
      (click)="togglePanel()"
      title="Design annotations"
    >
      ✏️
      <span class="annotate-fab__badge" *ngIf="annotations.length">{{ annotations.length }}</span>
    </button>

    <div class="annotate-panel fvdr-annotate-ui" *ngIf="panelOpen">
      <div class="annotate-panel__header">
        <span>Design Annotations</span>
        <button class="annotate-panel__close" (click)="togglePanel()">✕</button>
      </div>

      <button class="annotate-toggle" [class.annotate-toggle--on]="active" (click)="toggleActive()">
        {{ active ? '● Click to annotate: ON' : '○ Click to annotate: OFF' }}
      </button>
      <button class="annotate-toggle" [class.annotate-toggle--on]="freeze" (click)="toggleFreeze()">
        {{ freeze ? '❄ Animations frozen' : '❄ Freeze animations' }}
      </button>

      <div class="annotate-panel__actions">
        <button (click)="copyMarkdown()" [disabled]="!annotations.length">{{ copied ? 'Copied ✓' : 'Copy Markdown' }}</button>
        <button (click)="clearAll()" [disabled]="!annotations.length">Clear all</button>
      </div>

      <div class="annotate-panel__hint" *ngIf="active">
        Click an element · Shift-drag to multi-select · Alt-drag for an area · select text to annotate a quote
      </div>

      <div class="annotate-list" *ngIf="annotations.length">
        <div class="annotate-list__item" *ngFor="let a of annotations; let i = index" (click)="focusAnnotation(a)">
          <span class="annotate-list__kind">{{ kindIcon(a.kind) }}</span>
          <span class="annotate-list__index">{{ i + 1 }}</span>
          <span class="annotate-list__note">{{ a.note || '(no note)' }}</span>
          <button class="annotate-list__delete" (click)="$event.stopPropagation(); deleteAnnotation(a.id)">✕</button>
        </div>
      </div>
      <div class="annotate-panel__empty" *ngIf="!annotations.length">No annotations yet.</div>
    </div>

    <div
      class="annotate-hover fvdr-annotate-ui"
      *ngIf="hoverBox"
      [style.left.px]="hoverBox.left"
      [style.top.px]="hoverBox.top"
      [style.width.px]="hoverBox.width"
      [style.height.px]="hoverBox.height"
    >
      <span class="annotate-hover__label">{{ hoverLabel }}</span>
    </div>

    <div
      class="annotate-drag fvdr-annotate-ui"
      *ngIf="dragBox"
      [class.annotate-drag--area]="dragModifier === 'area'"
      [style.left.px]="dragBox.left"
      [style.top.px]="dragBox.top"
      [style.width.px]="dragBox.width"
      [style.height.px]="dragBox.height"
    ></div>

    <div
      class="annotate-marker fvdr-annotate-ui"
      *ngFor="let a of annotations; let i = index"
      [class.annotate-marker--element]="a.kind === 'element'"
      [class.annotate-marker--multi]="a.kind === 'multi'"
      [class.annotate-marker--area]="a.kind === 'area'"
      [class.annotate-marker--text]="a.kind === 'text'"
      [style.left.px]="markerLeft(a)"
      [style.top.px]="markerTop(a)"
      (click)="openEdit(a, $event)"
    >
      {{ i + 1 }}
    </div>

    <div class="annotate-popover fvdr-annotate-ui" *ngIf="pending" [style.left.px]="popoverX" [style.top.px]="popoverY">
      <div class="annotate-popover__meta">{{ pendingMetaLabel }}</div>
      <textarea
        #noteInput
        class="annotate-popover__textarea"
        [(ngModel)]="pending.noteText"
        placeholder="Add a note…"
        (keydown)="onPopoverKeydown($event)"
      ></textarea>
      <div class="annotate-popover__actions">
        <button class="annotate-popover__delete" *ngIf="pending.id !== null" (click)="deleteAnnotation(pending.id); pending = null">
          Delete
        </button>
        <span class="annotate-popover__spacer"></span>
        <button (click)="cancelPending()">Cancel</button>
        <button class="annotate-popover__save" (click)="savePending()">Save</button>
      </div>
    </div>
  `,
  styles: [`
    .annotate-fab {
      position: fixed;
      bottom: 80px;
      right: 20px;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: none;
      background: #101A16;
      box-shadow: 0 2px 12px rgba(0,0,0,0.5);
      font-size: 1.3rem;
      cursor: pointer;
      z-index: 9100;
      transition: transform 0.15s;
    }
    .annotate-fab:hover { transform: scale(1.1); }
    .annotate-fab--active { background: var(--color-interactive-primary, #2C9C74); }
    .annotate-fab__badge {
      position: absolute;
      top: -4px;
      right: -4px;
      min-width: 18px;
      height: 18px;
      padding: 0 4px;
      border-radius: 9px;
      background: #E54430;
      color: #fff;
      font-size: 0.7rem;
      line-height: 18px;
      font-weight: 600;
    }

    .annotate-panel {
      position: fixed;
      bottom: 136px;
      right: 20px;
      width: 300px;
      max-height: 60vh;
      display: flex;
      flex-direction: column;
      background: #101A16;
      border: 1px solid #1e2e28;
      border-radius: 10px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.5);
      z-index: 9100;
      font-family: var(--font-family, 'Inter', sans-serif);
      color: #e8f5f0;
      overflow: hidden;
    }
    .annotate-panel__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      border-bottom: 1px solid #1e2e28;
      font-weight: 600;
      font-size: 0.85rem;
    }
    .annotate-panel__close {
      background: none;
      border: none;
      color: #9bbfb0;
      cursor: pointer;
      font-size: 1rem;
    }
    .annotate-toggle {
      margin: 8px 14px 0;
      padding: 8px 10px;
      border-radius: 6px;
      border: 1px solid #1e2e28;
      background: #0b1a15;
      color: #9bbfb0;
      font-size: 0.8rem;
      text-align: left;
      cursor: pointer;
    }
    .annotate-toggle--on {
      border-color: var(--color-interactive-primary, #2C9C74);
      color: #e8f5f0;
      background: rgba(44,156,116,0.15);
    }
    .annotate-panel__actions {
      display: flex;
      gap: 8px;
      margin: 10px 14px 0;
    }
    .annotate-panel__actions button {
      flex: 1;
      padding: 7px 8px;
      border-radius: 6px;
      border: 1px solid #1e2e28;
      background: #0b1a15;
      color: #e8f5f0;
      font-size: 0.78rem;
      cursor: pointer;
    }
    .annotate-panel__actions button:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .annotate-panel__hint {
      margin: 10px 14px 0;
      font-size: 0.72rem;
      color: #9bbfb0;
      line-height: 1.4;
    }
    .annotate-panel__empty {
      margin: 12px 14px 14px;
      font-size: 0.78rem;
      color: #9bbfb0;
    }

    .annotate-list {
      margin-top: 10px;
      padding: 0 6px 10px;
      overflow-y: auto;
    }
    .annotate-list__item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 8px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.78rem;
    }
    .annotate-list__item:hover { background: #16241e; }
    .annotate-list__kind { flex: 0 0 auto; }
    .annotate-list__index {
      flex: 0 0 auto;
      color: #9bbfb0;
      font-variant-numeric: tabular-nums;
    }
    .annotate-list__note {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: #e8f5f0;
    }
    .annotate-list__delete {
      flex: 0 0 auto;
      background: none;
      border: none;
      color: #9bbfb0;
      cursor: pointer;
      font-size: 0.75rem;
      opacity: 0;
    }
    .annotate-list__item:hover .annotate-list__delete { opacity: 1; }

    .annotate-hover {
      position: fixed;
      z-index: 9090;
      pointer-events: none;
      border: 2px dashed var(--color-interactive-primary, #2C9C74);
      background: rgba(44,156,116,0.08);
    }
    .annotate-hover__label {
      position: absolute;
      top: -22px;
      left: -2px;
      background: var(--color-interactive-primary, #2C9C74);
      color: #fff;
      font-size: 0.68rem;
      padding: 2px 6px;
      border-radius: 4px;
      white-space: nowrap;
      font-family: monospace;
    }

    .annotate-drag {
      position: fixed;
      z-index: 9095;
      pointer-events: none;
      border: 2px dashed #358CEB;
      background: rgba(53,140,235,0.1);
    }
    .annotate-drag--area {
      border-color: #FFB020;
      background: rgba(255,176,32,0.1);
    }

    .annotate-marker {
      position: fixed;
      z-index: 9096;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.68rem;
      font-weight: 700;
      color: #fff;
      cursor: pointer;
      box-shadow: 0 1px 4px rgba(0,0,0,0.4);
    }
    .annotate-marker--element { background: var(--color-interactive-primary, #2C9C74); }
    .annotate-marker--multi { background: #358CEB; }
    .annotate-marker--area { background: #FFB020; }
    .annotate-marker--text { background: #9B59B6; }

    .annotate-popover {
      position: fixed;
      z-index: 9200;
      width: 280px;
      background: #101A16;
      border: 1px solid #1e2e28;
      border-radius: 10px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.5);
      padding: 10px;
      font-family: var(--font-family, 'Inter', sans-serif);
    }
    .annotate-popover__meta {
      font-size: 0.7rem;
      color: #9bbfb0;
      margin-bottom: 6px;
      font-family: monospace;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .annotate-popover__textarea {
      width: 100%;
      min-height: 64px;
      resize: vertical;
      background: #0b1a15;
      border: 1px solid #1e2e28;
      border-radius: 6px;
      color: #e8f5f0;
      font-size: 0.8rem;
      padding: 6px 8px;
      box-sizing: border-box;
      font-family: inherit;
    }
    .annotate-popover__actions {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 8px;
    }
    .annotate-popover__spacer { flex: 1; }
    .annotate-popover__actions button {
      padding: 6px 10px;
      border-radius: 6px;
      border: 1px solid #1e2e28;
      background: #0b1a15;
      color: #e8f5f0;
      font-size: 0.75rem;
      cursor: pointer;
    }
    .annotate-popover__save {
      border-color: var(--color-interactive-primary, #2C9C74);
      background: var(--color-interactive-primary, #2C9C74);
      color: #fff;
    }
    .annotate-popover__delete {
      color: #E54430;
      border-color: #E54430;
    }
  `],
})
export class AnnotateComponent implements OnInit, OnDestroy, AfterViewChecked {
  panelOpen = false;
  active = false;
  freeze = false;
  copied = false;

  annotations: Annotation[] = [];
  pending: Pending | null = null;

  hoverBox: RectSnap | null = null;
  hoverLabel = '';
  dragBox: RectSnap | null = null;
  dragModifier: 'plain' | 'multi' | 'area' = 'plain';

  @ViewChild('noteInput') noteInputRef?: ElementRef<HTMLTextAreaElement>;
  private focusedOnce = false;

  private nextId = 1;
  private dragStart: { x: number; y: number } | null = null;
  private scrollOffset = { x: 0, y: 0 };
  private router = inject(Router);

  ngOnInit(): void {
    this.scrollOffset = { x: window.scrollX, y: window.scrollY };
    document.addEventListener('mousedown', this.onMouseDownCapture, true);
    document.addEventListener('mouseup', this.onMouseUpCapture, true);
    document.addEventListener('click', this.onClickCapture, true);
    document.addEventListener('mousemove', this.onMouseMove, { passive: true });
    window.addEventListener('scroll', this.onScroll, { passive: true });
    window.addEventListener('resize', this.onScroll, { passive: true });
  }

  ngOnDestroy(): void {
    document.removeEventListener('mousedown', this.onMouseDownCapture, true);
    document.removeEventListener('mouseup', this.onMouseUpCapture, true);
    document.removeEventListener('click', this.onClickCapture, true);
    document.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('resize', this.onScroll);
    document.getElementById('fvdr-annotate-freeze-style')?.remove();
    document.body.style.cursor = '';
  }

  ngAfterViewChecked(): void {
    if (this.pending && this.noteInputRef && !this.focusedOnce) {
      this.noteInputRef.nativeElement.focus();
      this.focusedOnce = true;
    }
    if (!this.pending) this.focusedOnce = false;
  }

  togglePanel(): void {
    this.panelOpen = !this.panelOpen;
    if (!this.panelOpen) {
      this.active = false;
      document.body.style.cursor = '';
      this.hoverBox = null;
    }
  }

  toggleActive(): void {
    this.active = !this.active;
    document.body.style.cursor = this.active ? 'crosshair' : '';
    if (!this.active) {
      this.hoverBox = null;
      this.dragStart = null;
      this.dragBox = null;
    }
  }

  toggleFreeze(): void {
    this.freeze = !this.freeze;
    if (this.freeze) {
      const style = document.createElement('style');
      style.id = 'fvdr-annotate-freeze-style';
      style.textContent = `*, *::before, *::after { animation-play-state: paused !important; transition: none !important; }`;
      document.head.appendChild(style);
    } else {
      document.getElementById('fvdr-annotate-freeze-style')?.remove();
    }
  }

  kindIcon(kind: AnnotationKind): string {
    return kindIconFor(kind);
  }

  markerLeft(a: Annotation): number {
    return a.rect.left - (this.scrollOffset.x - a.capturedScroll.x) - 10;
  }

  markerTop(a: Annotation): number {
    return a.rect.top - (this.scrollOffset.y - a.capturedScroll.y) - 10;
  }

  get popoverX(): number {
    if (!this.pending) return 0;
    return Math.max(8, Math.min(this.pending.anchorX, window.innerWidth - 296));
  }

  get popoverY(): number {
    if (!this.pending) return 0;
    return Math.max(8, Math.min(this.pending.anchorY + 12, window.innerHeight - 200));
  }

  get pendingMetaLabel(): string {
    if (!this.pending) return '';
    switch (this.pending.kind) {
      case 'element': return `Element: <${this.pending.targets[0]?.tag ?? '?'}>`;
      case 'multi': return `${this.pending.targets.length} elements selected`;
      case 'area': return `Area ${Math.round(this.pending.rect.width)}×${Math.round(this.pending.rect.height)}`;
      case 'text': return `Text: "${truncateText(this.pending.text ?? '', 60)}"`;
    }
  }

  onPopoverKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.stopPropagation();
      this.cancelPending();
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      this.savePending();
    }
  }

  savePending(): void {
    if (!this.pending) return;
    if (this.pending.id !== null) {
      const existing = this.annotations.find((a) => a.id === this.pending!.id);
      if (existing) existing.note = this.pending.noteText;
    } else {
      this.annotations.push({
        id: this.nextId++,
        kind: this.pending.kind,
        note: this.pending.noteText,
        rect: this.pending.rect,
        capturedScroll: { x: window.scrollX, y: window.scrollY },
        targets: this.pending.targets,
        text: this.pending.text,
      });
    }
    this.pending = null;
  }

  cancelPending(): void {
    this.pending = null;
  }

  openEdit(a: Annotation, e: MouseEvent): void {
    e.stopPropagation();
    this.pending = {
      id: a.id,
      kind: a.kind,
      noteText: a.note,
      rect: a.rect,
      targets: a.targets,
      text: a.text,
      anchorX: e.clientX,
      anchorY: e.clientY,
    };
  }

  deleteAnnotation(id: number): void {
    this.annotations = this.annotations.filter((a) => a.id !== id);
  }

  clearAll(): void {
    this.annotations = [];
  }

  focusAnnotation(a: Annotation): void {
    const sel = a.targets[0]?.selector;
    if (sel) {
      try {
        const el = document.querySelector(sel);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
      } catch {
        // invalid/stale selector — fall back to raw position
      }
    }
    window.scrollTo({ top: a.rect.top + window.scrollY - 200, behavior: 'smooth' });
  }

  async copyMarkdown(): Promise<void> {
    const md = this.buildMarkdown();
    try {
      await navigator.clipboard.writeText(md);
      this.copied = true;
      setTimeout(() => (this.copied = false), 1500);
    } catch (err) {
      console.warn('[Annotate] clipboard write failed', err);
    }
  }

  private buildMarkdown(): string {
    const lines: string[] = [];
    lines.push(`# Design Annotations — ${this.router.url} (${this.annotations.length})`);
    lines.push('');
    this.annotations.forEach((a, i) => {
      lines.push(`## ${i + 1}. ${kindTitle(a.kind)} — ${a.note || '(no note)'}`);
      if (a.kind === 'element' || a.kind === 'multi') {
        a.targets.forEach((t, ti) => {
          if (a.kind === 'multi') lines.push(`- Target ${ti + 1}:`);
          const prefix = a.kind === 'multi' ? '  ' : '-';
          lines.push(`${prefix} Selector: \`${t.selector}\``);
          lines.push(`${prefix} Tag: \`<${t.tag}${t.classes.length ? ' class="' + t.classes.join(' ') + '"' : ''}>\``);
          lines.push(`${prefix} Position: x=${Math.round(t.rect.left)}, y=${Math.round(t.rect.top)}, w=${Math.round(t.rect.width)}, h=${Math.round(t.rect.height)}`);
          if (t.text) lines.push(`${prefix} Text: "${t.text}"`);
          lines.push(`${prefix} Styles: ${Object.entries(t.styles).map(([k, v]) => `${k}: ${v}`).join('; ')}`);
        });
      } else if (a.kind === 'area') {
        lines.push(`- Position: x=${Math.round(a.rect.left)}, y=${Math.round(a.rect.top)}, w=${Math.round(a.rect.width)}, h=${Math.round(a.rect.height)}`);
      } else if (a.kind === 'text') {
        lines.push(`- Selected text: "${a.text ?? ''}"`);
        if (a.targets[0]) lines.push(`- Container: \`${a.targets[0].selector}\``);
        lines.push(`- Position: x=${Math.round(a.rect.left)}, y=${Math.round(a.rect.top)}, w=${Math.round(a.rect.width)}, h=${Math.round(a.rect.height)}`);
      }
      lines.push('');
    });
    return lines.join('\n');
  }

  private onScroll = (): void => {
    this.scrollOffset = { x: window.scrollX, y: window.scrollY };
  };

  private onMouseMove = (e: MouseEvent): void => {
    if (!this.active) return;
    if (this.dragStart) {
      if (this.dragModifier !== 'plain') {
        this.dragBox = rectFromPoints(this.dragStart, { x: e.clientX, y: e.clientY });
      }
      return;
    }
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || el.closest('.fvdr-annotate-ui') || el === document.documentElement || el === document.body) {
      this.hoverBox = null;
      return;
    }
    this.hoverBox = rectFromEl(el);
    this.hoverLabel = shortLabel(el);
  };

  private onMouseDownCapture = (e: MouseEvent): void => {
    if (!this.active) return;
    const target = e.target as Element;
    if (target.closest('.fvdr-annotate-ui')) return;
    this.hoverBox = null;
    this.dragStart = { x: e.clientX, y: e.clientY };
    this.dragModifier = e.shiftKey ? 'multi' : e.altKey ? 'area' : 'plain';
    if (this.dragModifier !== 'plain') {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  private onMouseUpCapture = (e: MouseEvent): void => {
    if (!this.active) return;
    const target = e.target as Element;
    if (target.closest('.fvdr-annotate-ui')) return;

    const start = this.dragStart;
    this.dragStart = null;
    this.dragBox = null;
    if (!start) return;

    const dist = Math.hypot(e.clientX - start.x, e.clientY - start.y);
    const selection = window.getSelection();
    const selectedText = selection ? selection.toString() : '';

    if (this.dragModifier === 'multi' && dist > 5) {
      const rect = rectFromPoints(start, { x: e.clientX, y: e.clientY });
      const els = collectElementsInRect(rect);
      if (els.length) {
        const targets = els.map(toTarget);
        this.openNewPending('multi', e.clientX, e.clientY, { targets, rect: unionRect(targets.map((t) => t.rect)) });
      }
    } else if (this.dragModifier === 'area' && dist > 5) {
      const rect = rectFromPoints(start, { x: e.clientX, y: e.clientY });
      this.openNewPending('area', e.clientX, e.clientY, { rect });
    } else if (dist <= 5 && selectedText.trim().length === 0) {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (el && !el.closest('.fvdr-annotate-ui')) {
        const t = toTarget(el);
        this.openNewPending('element', e.clientX, e.clientY, { targets: [t], rect: t.rect });
      }
    } else if (selectedText.trim().length > 0 && selection) {
      const range = selection.getRangeAt(0);
      const r = range.getBoundingClientRect();
      const rect: RectSnap = { left: r.left, top: r.top, width: r.width, height: r.height };
      const container = range.commonAncestorContainer instanceof Element
        ? range.commonAncestorContainer
        : range.commonAncestorContainer.parentElement;
      this.openNewPending('text', e.clientX, e.clientY, {
        rect,
        text: selectedText,
        targets: container ? [toTarget(container)] : [],
      });
      selection.removeAllRanges();
    }
    this.dragModifier = 'plain';
  };

  private onClickCapture = (e: MouseEvent): void => {
    if (!this.active) return;
    const target = e.target as Element;
    if (target.closest('.fvdr-annotate-ui')) return;
    e.preventDefault();
    e.stopPropagation();
  };

  private openNewPending(
    kind: AnnotationKind,
    x: number,
    y: number,
    data: { rect: RectSnap; targets?: AnnotationTarget[]; text?: string },
  ): void {
    this.pending = {
      id: null,
      kind,
      noteText: '',
      rect: data.rect,
      targets: data.targets ?? [],
      text: data.text,
      anchorX: x,
      anchorY: y,
    };
  }
}
