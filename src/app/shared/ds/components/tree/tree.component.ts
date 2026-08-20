import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FvdrIconComponent } from '../../icons/icon.component';
import { FileIconComponent, FvdrFileType } from '../file-icon/file-icon.component';
import { CheckboxComponent } from '../checkbox/checkbox.component';

export interface TreeNode {
  id: string;
  label: string;
  /** Звичайна іконка з DS-набору. Якщо задано fileType — він має пріоритет. */
  icon?: string;
  /** Колор-кодована file-icon (folder-colored, doc, pdf...). Default fileType для папок з дітьми. */
  fileType?: FvdrFileType;
  /** Branded square mark with initials instead of an icon — project/root rows. */
  mark?: string;
  /** Expanded on first render (the parent no longer has to click it open). */
  expanded?: boolean;
  /** Checkbox state, rendered only when [checkboxes] is on. */
  checked?: boolean;
  children?: TreeNode[];
  disabled?: boolean;
  data?: any;
}

/**
 * DS Tree view — Figma: liyNDiFf1piO8SQmHNKoeU, node 19202-13644
 *
 * DS specs:
 *   Row height: 36px
 *   Indent: 20px per level
 *   Expand/collapse chevron icon
 *   Hover bg: #ECEEF9
 *   Selected: bg #EBF8EF, text #2C9C74
 *   Checkbox selection optional — [checkboxes]="true" (no auto-propagation;
 *   the parent owns each node's `checked`)
 *
 * Usage:
 *   <fvdr-tree [nodes]="tree" (nodeSelect)="onSelect($event)" />
 *
 *   Nodes marked { expanded: true } start open; { mark: 'T2' } renders a
 *   branded square instead of an icon (project/root rows).
 */
@Component({
  selector: 'fvdr-tree',
  standalone: true,
  imports: [CommonModule, FvdrIconComponent, FileIconComponent, CheckboxComponent],
  template: `
    <div class="tree">
      <ng-container *ngFor="let node of nodes">
        <ng-container *ngTemplateOutlet="nodeTemplate; context: { $implicit: node, level: 0 }"></ng-container>
      </ng-container>

      <ng-template #nodeTemplate let-node let-level="level">
        <div
          class="tree-node"
          [class.tree-node--selected]="selectedId === node.id"
          [class.tree-node--disabled]="node.disabled"
          [style.padding-left.px]="16 + level * 20"
          (click)="!node.disabled && onNodeClick(node)"
        >
          <button
            *ngIf="node.children?.length"
            class="tree-node__toggle"
            (click)="$event.stopPropagation(); toggle(node.id)"
          >
            <fvdr-icon [name]="isExpanded(node.id) ? 'chevron-down' : 'chevron-right'" />
          </button>
          <span *ngIf="!node.children?.length" class="tree-node__spacer"></span>
          <fvdr-checkbox
            *ngIf="checkboxes"
            class="tree-node__check"
            [checked]="!!node.checked"
            [disabled]="!!node.disabled"
            (checkedChange)="onCheck(node, $event)"
            (click)="$event.stopPropagation()"
          />
          <span *ngIf="node.mark" class="tree-node__mark">{{ node.mark }}</span>
          <fvdr-file-icon *ngIf="!node.mark && node.fileType" [type]="node.fileType" class="tree-node__icon" />
          <fvdr-icon *ngIf="!node.mark && !node.fileType && node.icon" [name]="node.icon" class="tree-node__icon" />
          <span class="tree-node__label">{{ node.label }}</span>
        </div>
        <ng-container *ngIf="isExpanded(node.id) && node.children">
          <ng-container *ngFor="let child of node.children">
            <ng-container *ngTemplateOutlet="nodeTemplate; context: { $implicit: child, level: level + 1 }"></ng-container>
          </ng-container>
        </ng-container>
      </ng-template>
    </div>
  `,
  styles: [`
    .tree { display: flex; flex-direction: column; }

    .tree-node {
      display: flex;
      align-items: center;
      height: 36px;
      gap: var(--space-1);
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: background 0.1s;
      padding-right: var(--space-3);
    }
    .tree-node:hover:not(.tree-node--disabled) { background: var(--color-hover-bg); }
    .tree-node--selected { background: var(--color-primary-50); }
    .tree-node--selected .tree-node__label { color: var(--color-primary-500); font-weight: var(--text-base-s-sb-weight); }
    .tree-node--disabled { opacity: 0.45; cursor: not-allowed; }

    .tree-node__toggle {
      display: flex; align-items: center; justify-content: center;
      width: 20px; height: 20px; border: none; background: transparent;
      cursor: pointer; color: var(--color-text-secondary); font-size: var(--font-size-xs, 12px); flex-shrink: 0;
    }
    .tree-node__spacer { width: 20px; flex-shrink: 0; }
    .tree-node__check { flex-shrink: 0; }
    /* Branded root mark — same footprint as the icon slot. */
    .tree-node__mark {
      width: 20px; height: 20px; flex-shrink: 0;
      display: inline-flex; align-items: center; justify-content: center;
      border-radius: var(--radius-xs);
      background: var(--color-primary-500);
      color: var(--color-text-inverse, #ffffff);
      font-size: var(--font-size-3xs, 10px);
      font-weight: 700;
    }
    .tree-node__icon { font-size: var(--font-size-lg, 16px); color: var(--color-text-secondary); flex-shrink: 0; }
    .tree-node__label {
      flex: 1;
      font-family: var(--font-family);
      font-size: var(--text-base-s-size);
      color: var(--color-text-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `],
})
export class TreeComponent {
  /** Nodes flagged `expanded` are opened once, when the array is set. */
  @Input() set nodes(value: TreeNode[]) {
    this._nodes = value ?? [];
    this.seedExpanded(this._nodes);
  }
  get nodes(): TreeNode[] { return this._nodes; }

  @Input() selectedId = '';
  /** Render a checkbox on every row (permission/group trees). */
  @Input() checkboxes = false;

  @Output() nodeSelect = new EventEmitter<TreeNode>();
  @Output() nodeCheck = new EventEmitter<{ node: TreeNode; checked: boolean }>();

  private _nodes: TreeNode[] = [];
  private expanded = new Set<string>();

  private seedExpanded(nodes: TreeNode[]): void {
    for (const node of nodes) {
      if (node.expanded) this.expanded.add(node.id);
      if (node.children?.length) this.seedExpanded(node.children);
    }
  }

  onCheck(node: TreeNode, checked: boolean): void {
    node.checked = checked;
    this.nodeCheck.emit({ node, checked });
  }

  isExpanded(id: string): boolean { return this.expanded.has(id); }

  toggle(id: string): void {
    if (this.expanded.has(id)) this.expanded.delete(id);
    else this.expanded.add(id);
  }

  onNodeClick(node: TreeNode): void {
    this.selectedId = node.id;
    this.nodeSelect.emit(node);
    if (node.children?.length) this.toggle(node.id);
  }
}
