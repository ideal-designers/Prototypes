import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DS_COMPONENTS, ToastService } from '../../shared/ds';

interface Step {
  num: number;
  title: string;
  desc: string;
  code: string;
}

interface FileRef {
  path: string;
  desc: string;
  auto?: boolean;
}

@Component({
  selector: 'fvdr-docs',
  standalone: true,
  imports: [CommonModule, ...DS_COMPONENTS],
  template: `
    <div class="docs">
      <div class="docs__inner">

        <header class="head">
          <h1 class="head__title">Session guide</h1>
          <p class="head__meta">Як починати нову сесію з повним контекстом проекту</p>
        </header>

        <fvdr-inline-message variant="info"
          message="Claude Code читає CLAUDE.md автоматично при кожному старті. Для надійності дублюй запит у першій репліці." />

        <!-- Steps -->
        <section class="section">
          <h2 class="section__title">Кроки запуску</h2>
          <ol class="steps">
            <li class="step" *ngFor="let s of steps">
              <span class="step__num">{{ s.num }}</span>
              <div class="step__content">
                <div class="step__title">{{ s.title }}</div>
                <p class="step__desc">{{ s.desc }}</p>
                <div class="code">
                  <pre class="code__text">{{ s.code }}</pre>
                  <fvdr-btn variant="ghost" size="s" [iconOnly]="true"
                            [iconName]="copiedStep === s.num ? 'check' : 'copy'"
                            ariaLabel="Copy" (clicked)="copy(s)" />
                </div>
              </div>
            </li>
          </ol>
        </section>

        <!-- What Claude knows -->
        <section class="section">
          <h2 class="section__title">Що Claude знає після SKILL.md</h2>
          <div class="table" role="table">
            <div class="table__head" role="row">
              <span role="columnheader">Тема</span>
              <span role="columnheader">Деталі</span>
              <span role="columnheader">Джерело</span>
            </div>
            <div class="table__row" role="row" *ngFor="let row of knowledgeRows">
              <span class="table__name" role="cell">{{ row.topic }}</span>
              <span class="table__desc" role="cell">{{ row.detail }}</span>
              <span role="cell"><code class="tag">{{ row.source }}</code></span>
            </div>
          </div>
        </section>

        <!-- Key files -->
        <section class="section">
          <h2 class="section__title">Ключові файли проекту</h2>
          <div class="files">
            <div class="file" *ngFor="let f of files">
              <code class="file__path">{{ f.path }}</code>
              <span class="file__desc">{{ f.desc }}</span>
            </div>
          </div>
        </section>

        <!-- Quick rules -->
        <section class="section">
          <h2 class="section__title">Швидкі правила</h2>
          <div class="rules">
            <div class="rules__col">
              <div class="rules__header rules__header--good"><fvdr-icon name="check" /> Правильно</div>
              <code class="rule" *ngFor="let r of goodRules">{{ r }}</code>
            </div>
            <div class="rules__col">
              <div class="rules__header rules__header--bad"><fvdr-icon name="close" /> Неправильно</div>
              <code class="rule" *ngFor="let r of badRules">{{ r }}</code>
            </div>
          </div>
        </section>

      </div>
      <fvdr-toast-host />
    </div>
  `,
  styles: [`
    :host { display: block; }
    .docs {
      min-height: calc(100vh - var(--portal-header-h, 0px));
      background: var(--color-stone-0);
      color: var(--color-text-primary);
      font-family: var(--font-family);
    }
    /* Same container as the dashboard so page titles line up across tabs */
    .docs__inner {
      max-width: 1200px;
      margin: 0 auto;
      padding: var(--space-10) var(--space-6) var(--space-16);
      display: flex; flex-direction: column; gap: var(--space-6);
    }
    .docs__inner > * { max-width: 880px; }

    /* ── Header (same as dashboard) ── */
    .head__title {
      margin: 0;
      font-size: var(--text-h1-size);
      font-weight: var(--font-weight-bold);
      line-height: var(--line-height-lg);
    }
    .head__meta {
      margin: var(--space-1) 0 0;
      font-size: var(--text-body2-size);
      color: var(--color-text-secondary);
    }

    /* ── Sections: borderless, divided ── */
    .section {
      padding-top: var(--space-6);
      border-top: 1px solid var(--color-divider);
    }
    .section__title {
      margin: 0 0 var(--space-4);
      font-size: var(--text-sub1-size);
      font-weight: var(--font-weight-semi);
    }

    /* ── Steps ── */
    .steps { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--space-6); }
    .step { display: flex; gap: var(--space-4); }
    .step__num {
      flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      width: 28px; height: 28px;
      border-radius: var(--radius-full);
      background: var(--color-primary-50);
      color: var(--color-primary-600);
      font-size: var(--text-body2-size);
      font-weight: var(--font-weight-semi);
    }
    .step__content { flex: 1; min-width: 0; padding-top: var(--space-1); }
    .step__title { font-size: var(--text-body1-size); font-weight: var(--font-weight-semi); }
    .step__desc {
      margin: var(--space-1) 0 var(--space-3);
      font-size: var(--text-body2-size);
      color: var(--color-text-secondary);
    }
    .code {
      display: flex; align-items: flex-start; gap: var(--space-2);
      padding: var(--space-3) var(--space-2) var(--space-3) var(--space-4);
      background: var(--color-stone-200);
      border-radius: var(--radius-sm);
    }
    .code__text {
      flex: 1; min-width: 0; margin: 0;
      padding-top: var(--space-1);
      font-family: var(--font-family-mono);
      font-size: var(--text-caption1-size);
      color: var(--color-text-primary);
      white-space: pre-wrap; word-break: break-word;
    }

    /* ── Table ── */
    .table__head, .table__row {
      display: grid;
      grid-template-columns: 180px minmax(0, 1fr) 112px;
      gap: var(--space-4);
      align-items: center;
      padding: 0 var(--space-3);
      border-bottom: 1px solid var(--color-divider);
    }
    .table__head {
      height: 40px;
      font-size: var(--text-caption1-size);
      font-weight: var(--font-weight-semi);
      color: var(--color-text-secondary);
    }
    .table__row { min-height: 48px; padding-top: var(--space-2); padding-bottom: var(--space-2); }
    .table__name { font-size: var(--text-body2-size); font-weight: var(--font-weight-semi); }
    .table__desc { font-size: var(--text-body2-size); color: var(--color-text-secondary); }
    .tag {
      display: inline-block;
      padding: 0 var(--space-2);
      border-radius: var(--radius-sm);
      background: var(--color-stone-200);
      font-family: var(--font-family-mono);
      font-size: var(--text-caption1-size);
      color: var(--color-text-secondary);
    }

    /* ── Files ── */
    .file {
      display: flex; gap: var(--space-4); align-items: baseline;
      padding: var(--space-3);
      border-bottom: 1px solid var(--color-divider);
    }
    .file__path {
      flex: 0 0 240px;
      font-family: var(--font-family-mono);
      font-size: var(--text-caption1-size);
      color: var(--color-primary-600);
    }
    .file__desc { font-size: var(--text-body2-size); color: var(--color-text-secondary); }

    /* ── Rules ── */
    .rules { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6); }
    .rules__col { display: flex; flex-direction: column; }
    .rules__header {
      display: flex; align-items: center; gap: var(--space-2);
      padding: 0 var(--space-3) var(--space-2);
      border-bottom: 1px solid var(--color-divider);
      font-size: var(--text-body2-size);
      font-weight: var(--font-weight-semi);
    }
    .rules__header--good fvdr-icon { color: var(--color-primary-500); }
    .rules__header--bad fvdr-icon { color: var(--color-error-600); }
    .rule {
      padding: var(--space-2) var(--space-3);
      border-bottom: 1px solid var(--color-divider);
      font-family: var(--font-family-mono);
      font-size: var(--text-caption1-size);
      color: var(--color-text-primary);
    }

    @media (max-width: 767px) {
      .docs__inner { padding: var(--space-6) var(--space-4) var(--space-10); }
      .table__head { display: none; }
      .table__row { grid-template-columns: 1fr; gap: var(--space-1); }
      .file { flex-direction: column; gap: var(--space-1); }
      .file__path { flex-basis: auto; }
      .rules { grid-template-columns: 1fr; }
    }
  `],
})
export class DocsComponent {
  private readonly toast = inject(ToastService);
  copiedStep: number | null = null;

  async copy(step: Step): Promise<void> {
    try {
      await navigator.clipboard.writeText(step.code);
      this.copiedStep = step.num;
      setTimeout(() => { if (this.copiedStep === step.num) this.copiedStep = null; }, 2000);
    } catch {
      this.toast.show({ variant: 'error', message: 'Could not access the clipboard' });
    }
  }

  steps: Step[] = [
    {
      num: 1,
      title: 'Перша репліка — завантаження бази знань',
      desc: 'Відправ цю команду одразу після старту сесії. Claude прочитає SKILL.md і буде знати всі токени, компоненти, шаблони.',
      code: 'Прочитай SKILL.md',
    },
    {
      num: 2,
      title: 'Задача з Figma — реалізація прототипу',
      desc: 'Передай Figma URL і slug прототипу. Claude одразу готовий до роботи.',
      code: 'Figma: https://www.figma.com/design/...\nПрототип: my-prototype-slug\n\nЗавдання: реалізувати [опис UI]',
    },
    {
      num: 3,
      title: 'Створення нового прототипу (scaffold)',
      desc: 'Для генерації нового прототипу використовуй скрипт. Claude сам запустить і закомітить.',
      code: 'node scripts/new-proto.js \\\n  --slug "my-slug" \\\n  --title "My Prototype Title" \\\n  --description "Short description" \\\n  --figma "https://figma.com/design/..."',
    },
    {
      num: 4,
      title: 'Дебаг через Chrome DevTools MCP',
      desc: 'MCP підключений — можна дивитися консоль, помилки мережі, робити скріни прямо з сесії.',
      code: 'Відкрий https://prototypes-psi-ochre.vercel.app/my-slug\nі покажи console errors',
    },
  ];

  knowledgeRows = [
    { topic: 'DS Токени',         detail: 'Кольори, spacing, тіні, radius, типографіка',        source: 'SKILL.md' },
    { topic: '30+ DS компонентів', detail: 'fvdr-btn, fvdr-modal, fvdr-table, fvdr-tabs…',       source: 'SKILL.md' },
    { topic: 'Organism Templates', detail: 'Модалки, сайдпанелі, дропдауни, тости',             source: 'SKILL.md' },
    { topic: 'Іконки',            detail: '65 іконок FvdrIconName, правила використання',        source: 'CLAUDE.md' },
    { topic: 'Angular патерн',    detail: 'DS_COMPONENTS, TrackerService, FormsModule',          source: 'SKILL.md' },
    { topic: 'Analytics',         detail: 'PostHog EU + Supabase — автоматично через Tracker',   source: 'SKILL.md' },
    { topic: 'Git правила',       detail: 'GitHub origin: гілки claude/*, у main — через PR або ff-merge',    source: 'CLAUDE.md' },
  ];

  files: FileRef[] = [
    { path: 'CLAUDE.md',                    desc: 'Автозавантаження при старті. Правила іконок, git.' },
    { path: 'SKILL.md',                     desc: 'База знань DS: токени, компоненти, шаблони, патерни.' },
    { path: 'src/app/shared/ds/',           desc: 'DS компоненти, іконки, tokens.css.' },
    { path: 'src/app/prototypes/',          desc: 'Всі прототипи — окремі Angular компоненти.' },
    { path: 'src/app/proto-registry.ts',   desc: 'Реєстр прототипів (slug, title, figma, status).' },
    { path: 'scripts/new-proto.js',         desc: 'Scaffold нового прототипу з правильним шаблоном.' },
    { path: '.mcp.json',                    desc: 'Chrome DevTools MCP — дебаг браузера з сесії.' },
  ];

  goodRules = [
    '<fvdr-icon name="trash">',
    'color: var(--color-primary-500)',
    'padding: var(--space-4)',
    'imports: [...DS_COMPONENTS]',
    'git push origin claude/*',
  ];

  badRules = [
    'Inline SVG вручну',
    'color: #2C9C74 hardcoded',
    'padding: 16px',
    'Власні базові компоненти',
    'git push origin main напряму',
  ];
}
