import {
  Component, Directive, Input, Output, EventEmitter,
  ContentChildren, QueryList, TemplateRef, AfterContentInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FvdrIconComponent } from '../../icons/icon.component';
import { CheckboxComponent } from '../checkbox/checkbox.component';

/**
 * Use inside <fvdr-table> to provide a custom cell template for a column.
 *
 * Example:
 *   <fvdr-table [columns]="cols" [data]="rows">
 *     <ng-template fvdrCell="status" let-value let-row="row">
 *       <fvdr-status [label]="value" />
 *     </ng-template>
 *   </fvdr-table>
 *
 * Context: { $implicit: cellValue, row: rowObject, index: rowIndex }
 */
@Directive({ selector: '[fvdrCell]', standalone: true })
export class FvdrTableCellDirective {
  @Input('fvdrCell') columnKey = '';
  constructor(public tpl: TemplateRef<{ $implicit: any; row: any; index: number }>) {}
}

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
 *   Header: bg stone-100, border-bottom 1px divider, height 40px
 *   Row: height 48px, hover bg hover-bg, selected bg primary-50
 *   Cell padding: 0 16px
 *   Font: 14px
 *   Sortable columns: chevron icons
 *   Row selection via fvdr-checkbox
 *   Sticky header via [stickyHeader]="true"
 *
 * Usage:
 *   <fvdr-table [columns]="cols" [data]="rows" />
 *   <fvdr-table [columns]="cols" [data]="rows" [selectable]="true" [stickyHeader]="true">
 *     <ng-template fvdrCell="status" let-value let-row="row">
 *       <fvdr-status [label]="value" />
 *     </ng-template>
 *   </fvdr-table>
 */
@Component({
  selector: 'fvdr-table',
  standalone: true,
  imports: [CommonModule, FvdrIconComponent, CheckboxComponent],
  template: `
    <div class="table-wrap" [class.table-wrap--bordered]="bordered">
      <table class="table">
        <thead class="table__head" [class.table__head--sticky]="stickyHeader">
          <tr>
            <th *ngIf="selectable" class="table__th table__th--check">
              <fvdr-checkbox
                [checked]="allSelected"
                [indeterminate]="someSelected"
                (checkedChange)="toggleAll()"
              />
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
              <fvdr-checkbox
                [checked]="selectedRows.has(i)"
                (checkedChange)="toggleRow(i)"
              />
            </td>
            <td
              *ngFor="let col of columns"
              class="table__td"
              [style.text-align]="col.align || 'left'"
            >
              <ng-container
                *ngIf="getCellTpl(col.key) as tpl; else defaultCell"
                [ngTemplateOutlet]="tpl"
                [ngTemplateOutletContext]="{ $implicit: row[col.key], row: row, index: i }"
              />
              <ng-template #defaultCell>{{ row[col.key] }}</ng-template>
            </td>
          </tr>
          <tr *ngIf="!data?.length">
            <td [attr.colspan]="columns.length + (selectable ? 1 : 0)" class="table__empty">
              {{ emptyText }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    :host { display: block; }

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

    /* Header: stone-200 bg, semibold 14px, primary text — no border */
    .table__head { background: var(--color-stone-200); }
    .table__head--sticky th { position: sticky; top: 0; z-index: 1; background: var(--color-stone-200); }

    .table__th {
      height: 48px;
      padding: 0 var(--space-4);
      font-size: var(--text-base-s-size);
      font-weight: 600;
      color: var(--color-text-primary);
      white-space: nowrap;
      text-align: left;
    }
    .table__th:first-child { border-radius: 4px 0 0 4px; }
    .table__th:last-child  { border-radius: 0 4px 4px 0; }
    .table__th--check { width: 48px; padding: 0 var(--space-3); }
    .table__th--sortable { cursor: pointer; user-select: none; }
    .table__th--sortable:hover { color: var(--color-text-secondary); }

    .table__th-content { display: inline-flex; align-items: center; gap: 4px; }
    .table__sort-icon { font-size: 12px; color: var(--color-stone-500); }
    .table__sort-icon--active { color: var(--color-primary-500); }

    /* Rows: zebra striping, no border lines */
    .table__row { transition: background 0.1s; }
    .table__row:nth-child(odd)  { background: var(--color-stone-0, #fff); }
    .table__row:nth-child(even) { background: var(--color-stone-100); }
    .table__row:hover { background: var(--color-hover-bg); }
    .table__row--selected { background: var(--color-primary-50) !important; }
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
export class TableComponent implements AfterContentInit {
  @Input() columns: TableColumn[] = [];
  @Input() data: Record<string, any>[] = [];
  @Input() selectable = false;
  @Input() bordered = false;
  @Input() stickyHeader = false;
  @Input() emptyText = 'No data';
  @Input() sortState?: SortState;
  @Output() sortChange = new EventEmitter<SortState>();
  @Output() selectionChange = new EventEmitter<number[]>();
  @Output() rowClick = new EventEmitter<Record<string, any>>();

  @ContentChildren(FvdrTableCellDirective) cellDefs!: QueryList<FvdrTableCellDirective>;

  private cellTplMap = new Map<string, TemplateRef<any>>();

  selectedRows = new Set<number>();

  ngAfterContentInit(): void {
    this.rebuildTplMap();
    this.cellDefs.changes.subscribe(() => this.rebuildTplMap());
  }

  private rebuildTplMap(): void {
    this.cellTplMap.clear();
    this.cellDefs?.forEach(d => this.cellTplMap.set(d.columnKey, d.tpl));
  }

  getCellTpl(key: string): TemplateRef<any> | null {
    return this.cellTplMap.get(key) ?? null;
  }

  get allSelected(): boolean {
    return !!this.data.length && this.selectedRows.size === this.data.length;
  }

  get someSelected(): boolean {
    return this.selectedRows.size > 0 && !this.allSelected;
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
