# FVDR Prototype Platform — Knowledge Base

## Методологія: Atomic Design

Дотримуємося [Atomic Design](https://atomicdesign.bradfrost.com/chapter-2/):

| Рівень | Що це | Приклади в DS |
|--------|-------|---------------|
| **Atom** | Базовий елемент без залежностей | `fvdr-btn`, `fvdr-icon`, `fvdr-badge`, `fvdr-avatar`, `fvdr-toggle`, `fvdr-checkbox` |
| **Molecule** | Комбінація атомів | `fvdr-input`, `fvdr-search`, `fvdr-dropdown`, `fvdr-tabs`, `fvdr-card` |
| **Organism** | Складна секція UI | `fvdr-modal`, `fvdr-header`, `fvdr-table`, `fvdr-droplist`, `fvdr-toast-host` |
| **Template** | Каркас сторінки | Компонент прототипу без даних |
| **Page** | Шаблон з реальними даними | Фінальний прототип |

---

## Design System — Джерела

- **Figma DS файл:** `liyNDiFf1piO8SQmHNKoeU` ("FVDR - Design System")
- **Токени CSS:** `src/app/shared/ds/tokens.css`
- **Компоненти:** `src/app/shared/ds/index.ts` → `DS_COMPONENTS`
- **Іконки:** `src/app/shared/ds/icons/icons.ts` → тип `FvdrIconName`

---

## Токени (CSS Custom Properties)

### Кольори

```css
/* Primary (Emerald/Teal) */
--color-primary-50:  #EBF8EF  /* selected bg, tabs */
--color-primary-500: #2C9C74  /* CTA, акцент — основний */
--color-primary-600: #1C8269  /* hover */
--color-primary-700: #12695C  /* active/pressed */

/* Neutral (Stone Grey) */
--color-stone-0:    #FFFFFF  /* white */
--color-stone-100:  #FAFAFA  /* subtle bg */
--color-stone-200:  #F7F7F7  /* surface, input bg */
--color-stone-300:  #ECEEF9  /* hover bg */
--color-stone-400:  #DEE0EB  /* borders, dividers */
--color-stone-500:  #BBBDC8  /* disabled, placeholders */
--color-stone-600:  #9C9EA8  /* secondary icons */
--color-stone-700:  #73757F  /* secondary text */
--color-stone-900:  #40424B  /* dark text */

/* Semantic */
--color-text-primary:     #1F2129
--color-text-secondary:   #5F616A
--color-text-placeholder: #9C9EA8
--color-text-disabled:    #BBBDC8
--color-divider:          #DEE0EB
--color-hover-bg:         #ECEEF9

/* Status */
--color-error-600:   #E54430  /* error default */
--color-warning-600: #FFDA07
--color-info-500:    #358CEB
```

### Тіні (Elevation)

```css
--shadow-card:    0 1px 4px rgba(0, 0, 0, 0.08)
--shadow-popover: 0 4px 16px rgba(0, 0, 0, 0.12)  /* модалі, дропдауни */
--shadow-toast:   0 8px 24px rgba(0, 0, 0, 0.16)
```

### Spacing (4px grid)

```css
--space-1: 4px  | --space-2: 8px  | --space-3: 12px | --space-4: 16px
--space-5: 20px | --space-6: 24px | --space-8: 32px | --space-10: 40px | --space-12: 48px
```

### Border Radius

```css
--radius-xs: 2px | --radius-sm: 4px | --radius-md: 8px
--radius-lg: 12px | --radius-xl: 16px | --radius-full: 9999px
```

### Типографіка (Open Sans)

```css
/* Заголовки */
H1: 32px/700 | H2: 28px/700 | H3: 24px/700
Sub1: 20px/600 | Sub2: 18px/600

/* Тіло */
Body1: 16px/400/24px | Body2: 15px/400/24px | Body3: 14px/400/20px

/* UI */
Label-L: 16px/600 | Label-M: 15px/600 | Label-S: 14px/600
Caption: 12px/400 | Caption-SB: 12px/600

/* Кнопки */
Btn-L: 16px | Btn-M: 15px | Btn-S: 14px
```

### Розміри компонентів

```css
--btn-height-s: 32px | --btn-height-m: 40px | --btn-height-l: 48px
--avatar-sm: 24px | --avatar-md: 32px | --avatar-lg: 40px | --avatar-xl: 48px
--tab-height: 48px
```

---

## Іконки

**Правило:** ЗАВЖДИ `<fvdr-icon name="...">`. НЕ inline SVG якщо іконка є в наборі.

```html
<fvdr-icon name="trash" />                        <!-- колір через CSS color -->
<span style="color: red; font-size: 20px">        <!-- розмір через font-size (1em) -->
  <fvdr-icon name="error" />
</span>
```

**Доступні іконки (`FvdrIconName`):**
```
angle-double-left/right  api  attention  bell  billing  cancel  check
chevron-down/left/right/up  close  download  drag  edit  error  filter
finished  folder  help  info  link  lock-close/open  minus  more  move
overview  participants  plus  reports  search  settings  share  sort
spinner  storage  trash  upload  warning  calendar  clock
nav-api(-active)  nav-billing(-active)  nav-overview(-active)
nav-participants(-active)  nav-projects(-active)  nav-reports(-active)
nav-settings(-active)  theme-dark  theme-light  drop
```

Якщо іконки немає — витягни з Figma API (node 15846-7469, file liyNDiFf1piO8SQmHNKoeU) і додай в `icons.ts`.

---

## DS Компоненти — Довідник

### Атоми

```html
<!-- Button: variant = primary|secondary|ghost|danger; size = s|m|l -->
<fvdr-btn label="Save" variant="primary" size="m" (clicked)="onSave()" />
<fvdr-btn label="Delete" variant="danger" size="s" />
<fvdr-btn label="Cancel" variant="ghost" />
<fvdr-btn label="Loading" [loading]="true" />
<fvdr-btn label="Off" [disabled]="true" />

<!-- Badge: variant = success|error|warning|info|neutral|primary -->
<fvdr-badge label="Active" variant="success" />

<!-- Avatar: size = sm|md|lg|xl -->
<fvdr-avatar initials="AB" size="md" />
<fvdr-avatar [imageUrl]="url" size="lg" />

<!-- Toggle -->
<fvdr-toggle [(ngModel)]="isEnabled" label="Enable feature" />

<!-- Checkbox -->
<fvdr-checkbox [(ngModel)]="checked" label="Accept terms" />

<!-- Status: variant = success|error|warning|info|neutral -->
<fvdr-status label="Active" variant="success" />

<!-- Counter: size = s|m; variant = primary|neutral|error -->
<fvdr-counter [value]="5" size="s" variant="primary" />
```

### Molecules

```html
<!-- Input: size = s|m|l; state = default|error|success -->
<fvdr-input placeholder="Enter name" size="m" [(ngModel)]="value" />
<fvdr-input placeholder="Error" state="error" errorMessage="Required" />

<!-- Textarea -->
<fvdr-textarea placeholder="Description" [maxLength]="500" [(ngModel)]="text" />

<!-- Search -->
<fvdr-search placeholder="Search..." [filters]="filterList" (search)="onSearch($event)" />

<!-- Dropdown: DropdownOption = { value, label, disabled? } -->
<fvdr-dropdown [options]="opts" placeholder="Select..." [(ngModel)]="val" />
<fvdr-dropdown [options]="opts" [multiple]="true" [(ngModel)]="vals" />

<!-- Tabs: TabItem = { id, label, counter? } -->
<fvdr-tabs [tabs]="tabList" [activeTab]="activeId" (tabChange)="onTab($event)" />

<!-- Card: state = default|active|hoverable -->
<fvdr-card [state]="'hoverable'" (click)="onSelect()">
  <!-- content -->
</fvdr-card>

<!-- Chips -->
<fvdr-chip label="Design" [removable]="true" (removed)="onRemove()" />

<!-- Info Banner: variant = info|warning|error|success -->
<fvdr-info-banner variant="warning" message="Unsaved changes" />

<!-- Inline Message: variant = error|success|info|warning -->
<fvdr-inline-message variant="error" message="Field is required" />
```

### Organisms

Дивись детальні шаблони нижче.

---

## Organism Templates

### 1. Модальне вікно (`fvdr-modal`)

**Специфікація DS (Figma node 15032-15799):**
- Розміри: S=400px, M=520px, L=640px, XL=800px
- Overlay: `rgba(0,0,0,0.48)`, `z-index: 1000`
- Анімація: fade + scale (0.15s ease)
- Заголовок: Sub2 (18px/600), close кнопка top-right
- Footer: кнопки справа, gap 8px

```html
<!-- Простий варіант -->
<fvdr-modal
  [visible]="showModal"
  title="Confirm Delete"
  size="m"
  confirmLabel="Delete"
  confirmVariant="danger"
  cancelLabel="Cancel"
  (closed)="showModal = false"
  (confirmed)="onConfirm()"
  (cancelled)="showModal = false"
>
  <p>Are you sure you want to delete this item?</p>
</fvdr-modal>

<!-- З кастомним контентом -->
<fvdr-modal [visible]="showEdit" title="Edit Project" size="l" (closed)="showEdit = false">
  <fvdr-input label="Name" [(ngModel)]="project.name" />
  <fvdr-textarea label="Description" [(ngModel)]="project.description" />
  <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:16px">
    <fvdr-btn label="Cancel" variant="ghost" (clicked)="showEdit = false" />
    <fvdr-btn label="Save" variant="primary" (clicked)="onSave()" />
  </div>
</fvdr-modal>
```

```typescript
// В компоненті:
showModal = false;

openModal() { this.showModal = true; }

onConfirm() {
  // logic
  this.showModal = false;
}
```

**Розміри:**

| size | width |
|------|-------|
| `s`  | 400px |
| `m`  | 520px |
| `l`  | 640px |
| `xl` | 800px |

---

### 2. Bottom Sheet (мобільна панель)

**Специфікація DS (Figma node 15874-8424):**
- Slides up знизу, `border-radius: 12px 12px 0 0`
- Max height: 90vh
- Handle зверху (40x4px pill)

```html
<fvdr-bottom-sheet
  [visible]="showSheet"
  title="Options"
  confirmLabel="Apply"
  cancelLabel="Cancel"
  (closed)="showSheet = false"
  (confirmed)="onApply()"
>
  <!-- контент -->
</fvdr-bottom-sheet>
```

---

### 3. Бокова Панель (Side Panel / Drawer)

DS не має готового `fvdr-side-panel`, але є усталений патерн для прототипів:

```html
<!-- Template -->
<div class="side-panel-layout">
  <div class="main-content">
    <!-- основний контент -->
  </div>

  <div class="side-panel" [class.side-panel--open]="panelOpen">
    <div class="side-panel__header">
      <span class="side-panel__title">Details</span>
      <button class="icon-btn" (click)="panelOpen = false">
        <fvdr-icon name="close" />
      </button>
    </div>
    <div class="side-panel__body">
      <!-- контент панелі -->
    </div>
    <div class="side-panel__footer">
      <fvdr-btn label="Cancel" variant="ghost" (clicked)="panelOpen = false" />
      <fvdr-btn label="Save" variant="primary" (clicked)="onSave()" />
    </div>
  </div>
</div>
```

```css
/* Styles */
.side-panel-layout {
  display: flex;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  transition: margin-right 0.25s ease;
}

.side-panel {
  width: 360px;
  background: var(--color-stone-0);
  border-left: 1px solid var(--color-divider);
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform 0.25s ease;
  position: absolute;
  right: 0; top: 0; bottom: 0;
}
.side-panel--open { transform: translateX(0); }

.side-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--color-divider);
  font-size: var(--text-sub2-size);
  font-weight: var(--text-sub2-weight);
  flex-shrink: 0;
}

.side-panel__body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-6);
}

.side-panel__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--color-divider);
  flex-shrink: 0;
}

.icon-btn {
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px;
  border: none; background: transparent; cursor: pointer;
  color: var(--color-text-secondary);
  border-radius: var(--radius-sm);
  font-size: 16px;
}
.icon-btn:hover { background: var(--color-hover-bg); color: var(--color-text-primary); }
```

---

### 4. Context Menu (Droplist)

**Специфікація DS (Figma node 15032-13916):**
- bg white, radius 8px, shadow-popover, border 1px stone-400
- Item height: 36px, padding 0 12px
- Hover: stone-300 bg

```typescript
// Інтерфейс:
// DroplistItem = { id, label, icon?: FvdrIconName, rightText?, badge?, disabled?, dividerAfter?, variant?: 'default'|'danger' }
```

```html
<div style="position: relative">
  <fvdr-btn label="Actions" variant="ghost" (clicked)="menuOpen = !menuOpen" />

  <fvdr-droplist
    *ngIf="menuOpen"
    [items]="menuItems"
    style="position: absolute; top: 44px; right: 0; z-index: 100"
    (itemClicked)="onMenuAction($event)"
    (closed)="menuOpen = false"
  />
</div>
```

```typescript
menuItems: DroplistItem[] = [
  { id: 'edit',   label: 'Edit',   icon: 'edit' },
  { id: 'share',  label: 'Share',  icon: 'share', dividerAfter: true },
  { id: 'delete', label: 'Delete', icon: 'trash', variant: 'danger' },
];
```

---

### 5. Toast Notifications

```html
<!-- В root компоненті (один раз) -->
<fvdr-toast-host />
```

```typescript
// В будь-якому компоненті:
private toast = inject(ToastService);

showSuccess() {
  this.toast.show({ message: 'Saved successfully', variant: 'success' });
}
showError() {
  this.toast.show({ message: 'Something went wrong', variant: 'error' });
}
// variants: 'success' | 'error' | 'warning' | 'info'
```

---

### 6. Header (App Header)

```html
<fvdr-header
  [navItems]="navItems"
  [activeNavId]="activeNav"
  [actions]="headerActions"
  userInitials="AB"
  (navClicked)="onNav($event)"
  (actionClicked)="onAction($event)"
  (avatarClicked)="onProfile()"
/>
```

```typescript
// HeaderNavItem = { id, label, icon?: FvdrIconName, activeIcon?: FvdrIconName, badge? }
// HeaderAction  = { id, icon: FvdrIconName, label?, badge? }

navItems: HeaderNavItem[] = [
  { id: 'overview',  label: 'Overview',  icon: 'nav-overview',  activeIcon: 'nav-overview-active' },
  { id: 'projects',  label: 'Projects',  icon: 'nav-projects',  activeIcon: 'nav-projects-active' },
  { id: 'settings',  label: 'Settings',  icon: 'nav-settings',  activeIcon: 'nav-settings-active' },
];

headerActions: HeaderAction[] = [
  { id: 'notifications', icon: 'bell', badge: 3 },
  { id: 'help',          icon: 'help' },
];
```

---

### 7. Data Table

```html
<fvdr-table
  [columns]="columns"
  [data]="rows"
  [selectable]="true"
  [(selectedIds)]="selectedIds"
  (sortChanged)="onSort($event)"
/>
```

```typescript
// TableColumn = { key, label, sortable?, width? }
columns: TableColumn[] = [
  { key: 'name',   label: 'Name',   sortable: true },
  { key: 'status', label: 'Status', width: '120px' },
  { key: 'date',   label: 'Date',   sortable: true, width: '140px' },
];
rows = [
  { id: '1', name: 'Project Alpha', status: 'Active', date: '2026-01-01' },
];
```

---

## Патерн Angular Прототипу

```typescript
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DS_COMPONENTS } from '../../shared/ds';
import { TrackerService } from '../../shared/tracker.service';

@Component({
  selector: 'fvdr-my-prototype',
  standalone: true,
  imports: [CommonModule, FormsModule, ...DS_COMPONENTS],
  template: `
    <!-- UI тут -->
  `,
  styles: [`
    :host {
      display: block;
      font-family: var(--font-family);
      color: var(--color-text-primary);
    }
    /* Завжди використовуй CSS змінні з tokens.css */
  `],
})
export class MyPrototypeComponent implements OnInit, OnDestroy {
  private tracker = inject(TrackerService);

  ngOnInit()    { this.tracker.trackPageView('my-prototype-slug'); }
  ngOnDestroy() { this.tracker.destroyListeners(); }

  onTaskComplete() {
    this.tracker.trackTask('my-prototype-slug', 'task_complete');
  }
}
```

---

## Workflow: Figma → Прототип

```
1. node scripts/new-proto.js --slug "..." --title "..." --description "..." --figma "URL"
2. Відредагувати компонент: src/app/prototypes/<slug>/<slug>.component.ts
3. git add . && git commit -m "feat: add <slug> prototype"
4. git push -u origin claude/<branch>
```

**Де зареєстровані прототипи:** `src/app/proto-registry.ts`
**Маршрути:** `src/app/app.routes.ts`

---

## Темна тема

Додай клас `.dark-theme` до `<html>` або кореневого елементу. Токени переопределяться автоматично.

```typescript
// Перемикання теми:
document.documentElement.classList.toggle('dark-theme');
```

---

## Швидкі правила

| ✅ Робити | ❌ Не робити |
|-----------|-------------|
| `<fvdr-icon name="trash">` | `<svg>...</svg>` inline |
| `color: var(--color-primary-500)` | `color: #2C9C74` hardcoded |
| `padding: var(--space-4)` | `padding: 16px` |
| `border-radius: var(--radius-sm)` | `border-radius: 4px` |
| `font-size: var(--text-body3-size)` | `font-size: 14px` |
| Імпортувати `DS_COMPONENTS` | Писати свої базові компоненти |
