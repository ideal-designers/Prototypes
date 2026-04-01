import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FvdrIconComponent } from '../../icons/icon.component';

export interface TreeNode {
  id: string;
  label: string;
  icon?: string;
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
 *   Checkbox selection optional
 *
 * Usage:
 *   <fvdr-tree [nodes]="tree" (nodeSelect)="onSelect($event)" />
 */
@Component({
  selector: 'fvdr-tree',
  standalone: true,
  imports: [CommonModule, FvdrIconComponent],
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
          <fvdr-icon *ngIf="node.icon" [name]="node.icon" class="tree-node__icon" />
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
      cursor: pointer; color: var(--color-text-secondary); font-size: 12px; flex-shrink: 0;
    }
    .tree-node__spacer { width: 20px; flex-shrink: 0; }
    .tree-node__icon { font-size: 16px; color: var(--color-text-secondary); flex-shrink: 0; }
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
  @Input() nodes: TreeNode[] = [];
  @Input() selectedId = '';
  @Output() nodeSelect = new EventEmitter<TreeNode>();

  private expanded = new Set<string>();

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
