import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FvdrIconComponent } from '../../icons/icon.component';

export interface TableColumn {
  key: string;
  label: string;
  width?: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
}

export type SortDirection = 'asc' | 'desc' | null;

export interface SortState {
  key: string;
  direction: SortDirection;
}

/**
 * DS Tables — Figma: liyNDiFf1piO8SQmHNKoeU, node 15032-15291
 *
 * DS specs:
 *   Header: bg #FAFAFA, border-bottom 1px #DEE0EB, height 40px
 *   Row: height 48px, hover bg #ECEEF9
 *   Cell padding: 0 16px
 *   Font: 14px
 *   Sortable columns: chevron icons
 *   Row selection via checkbox
 *   Sticky header option
 *
 * Usage:
 *   <fvdr-table [columns]="cols" [data]="rows" />
 *   <fvdr-table [columns]="cols" [data]="rows" [selectable]="true" (selectionChange)="onSelect($event)" />
 */
@Component({
  selector: 'fvdr-table',
  standalone: true,
  imports: [CommonModule, FvdrIconComponent],
  template: `
    <div class="table-wrap" [class.table-wrap--bordered]="bordered">
      <table class="table">
        <thead class="table__head">
          <tr>
            <th *ngIf="selectable" class="table__th table__th--check">
              <input type="checkbox" [checked]="allSelected" (change)="toggleAll()" />
            </th>
            <th
              *ngFor="let col of columns"
              class="table__th"
              [class.table__th--sortable]="col.sortable"
              [style.width]="col.width"
              [style.text-align]="col.align || 'left'"
              (click)="col.sortable && onSort(col.key)"
            >
              <span class="table__th-content">
                {{ col.label }}
                <span *ngIf="col.sortable" class="table__sort-icons">
                  <fvdr-icon
                    [name]="sortState?.key === col.key && sortState?.direction === 'asc' ? 'chevron-up' : 'chevron-down'"
                    class="table__sort-icon"
                    [class.table__sort-icon--active]="sortState?.key === col.key"
                  />
                </span>
              </span>
            </th>
          </tr>
        </thead>
        <tbody class="table__body">
          <tr
            *ngFor="let row of data; let i = index"
            class="table__row"
            [class.table__row--selected]="selectedRows.has(i)"
            [class.table__row--clickable]="rowClick.observers.length > 0"
            (click)="rowClick.emit(row)"
          >
            <td *ngIf="selectable" class="table__td table__td--check" (click)="$event.stopPropagation()">
              <input type="checkbox" [checked]="selectedRows.has(i)" (change)="toggleRow(i)" />
            </td>
            <td
              *ngFor="let col of columns"
              class="table__td"
              [style.text-align]="col.align || 'left'"
            >{{ row[col.key] }}</td>
          </tr>
          <tr *ngIf="!data?.length">
            <td [attr.colspan]="columns.length + (selectable ? 1 : 0)" class="table__empty">{{ emptyText }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .table-wrap { overflow-x: auto; }
    .table-wrap--bordered {
      border: 1px solid var(--color-divider);
      border-radius: var(--radius-md);
      overflow: hidden;
    }

    .table {
      width: 100%;
      border-collapse: collapse;
      font-family: var(--font-family);
    }

    .table__head { background: var(--color-stone-100); }

    .table__th {
      height: 40px;
      padding: 0 var(--space-4);
      border-bottom: 1px solid var(--color-divider);
      font-size: var(--text-caption2-size);
      font-weight: var(--text-caption2-weight);
      color: var(--color-text-secondary);
      white-space: nowrap;
      position: relative;
    }
    .table__th--check { width: 48px; padding: 0 var(--space-3); }
    .table__th--sortable { cursor: pointer; user-select: none; }
    .table__th--sortable:hover { color: var(--color-text-primary); }

    .table__th-content { display: inline-flex; align-items: center; gap: 4px; }
    .table__sort-icons { display: inline-flex; flex-direction: column; }
    .table__sort-icon { font-size: 12px; color: var(--color-stone-500); }
    .table__sort-icon--active { color: var(--color-primary-500); }

    .table__row { border-bottom: 1px solid var(--color-divider); transition: background 0.1s; }
    .table__row:last-child { border-bottom: none; }
    .table__row:hover { background: var(--color-hover-bg); }
    .table__row--selected { background: var(--color-primary-50); }
    .table__row--clickable { cursor: pointer; }

    .table__td {
      height: 48px;
      padding: 0 var(--space-4);
      font-size: var(--text-base-s-size);
      color: var(--color-text-primary);
      vertical-align: middle;
    }
    .table__td--check { width: 48px; padding: 0 var(--space-3); }

    .table__empty {
      height: 80px;
      text-align: center;
      color: var(--color-text-secondary);
      font-size: var(--text-base-s-size);
    }
  `],
})
export class TableComponent {
  @Input() columns: TableColumn[] = [];
  @Input() data: Record<string, any>[] = [];
  @Input() selectable = false;
  @Input() bordered = true;
  @Input() emptyText = 'No data';
  @Input() sortState?: SortState;
  @Output() sortChange = new EventEmitter<SortState>();
  @Output() selectionChange = new EventEmitter<number[]>();
  @Output() rowClick = new EventEmitter<Record<string, any>>();

  selectedRows = new Set<number>();

  get allSelected(): boolean {
    return !!this.data.length && this.selectedRows.size === this.data.length;
  }

  toggleAll(): void {
    if (this.allSelected) {
      this.selectedRows.clear();
    } else {
      this.data.forEach((_, i) => this.selectedRows.add(i));
    }
    this.selectionChange.emit([...this.selectedRows]);
  }

  toggleRow(i: number): void {
    if (this.selectedRows.has(i)) this.selectedRows.delete(i);
    else this.selectedRows.add(i);
    this.selectionChange.emit([...this.selectedRows]);
  }

  onSort(key: string): void {
    const dir: SortDirection =
      this.sortState?.key === key
        ? this.sortState.direction === 'asc' ? 'desc' : 'asc'
        : 'asc';
    this.sortChange.emit({ key, direction: dir });
  }
}
