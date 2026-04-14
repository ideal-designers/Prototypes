import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

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
  imports: [CommonModule, RouterLink],
  template: `
    <div class="docs">

      <!-- Header -->
      <header class="docs__header">
        <a routerLink="/" class="docs__back">
          <span class="docs__back-arrow">←</span> Dashboard
        </a>
        <div class="docs__header-center">
          <h1>Session Guide</h1>
          <p class="docs__subtitle">Як починати нову сесію з повним контекстом проекту</p>
        </div>
        <a href="/session-guide.pdf" target="_blank" class="docs__pdf-btn" download>
          ↓ PDF
        </a>
      </header>

      <div class="docs__body">

        <!-- Banner -->
        <div class="banner">
          <span class="banner__icon">⚡</span>
          <div>
            <strong>Автоматично:</strong> Claude Code читає <code>CLAUDE.md</code> при кожному старті.
            Але для надійності дублюй запит у першій репліці.
          </div>
        </div>

        <!-- Steps -->
        <section class="section">
          <h2 class="section__title">Кроки запуску</h2>
          <div class="steps">
            <div class="step" *ngFor="let s of steps">
              <div class="step__num">{{ s.num }}</div>
              <div class="step__content">
                <div class="step__title">{{ s.title }}</div>
                <div class="step__desc">{{ s.desc }}</div>
                <pre class="code-block">{{ s.code }}</pre>
              </div>
            </div>
          </div>
        </section>

        <div class="divider"></div>

        <!-- What Claude knows -->
        <section class="section">
          <h2 class="section__title">Що Claude знає після SKILL.md</h2>
          <table class="table">
            <thead>
              <tr>
                <th>Тема</th>
                <th>Деталі</th>
                <th>Джерело</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of knowledgeRows">
                <td class="td--name">{{ row.topic }}</td>
                <td class="td--desc">{{ row.detail }}</td>
                <td><span class="tag">{{ row.source }}</span></td>
              </tr>
            </tbody>
          </table>
        </section>

        <div class="divider"></div>

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

        <div class="divider"></div>

        <!-- Quick rules -->
        <section class="section">
          <h2 class="section__title">Швидкі правила</h2>
          <div class="rules">
            <div class="rules__col rules__col--good">
              <div class="rules__header">✅ Правильно</div>
              <div class="rule" *ngFor="let r of goodRules"><code>{{ r }}</code></div>
            </div>
            <div class="rules__col rules__col--bad">
              <div class="rules__header">❌ Неправильно</div>
              <div class="rule" *ngFor="let r of badRules"><code>{{ r }}</code></div>
            </div>
          </div>
        </section>

      </div>
    </div>
  `,
  styles: [`
    .docs {
      min-height: 100vh;
      background: #0B1410;
      color: #e8f5f0;
      font-family: 'Open Sans', sans-serif;
    }

    /* ── Header ── */
    .docs__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 40px;
      border-bottom: 1px solid #1e2e28;
      position: sticky;
      top: 0;
      background: rgba(11, 20, 16, 0.92);
      backdrop-filter: blur(8px);
      z-index: 10;
      gap: 16px;
    }
    .docs__back {
      display: flex; align-items: center; gap: 6px;
      color: #9bbfb0; text-decoration: none;
      font-size: 0.875rem;
      transition: color 0.15s;
      white-space: nowrap;
    }
    .docs__back:hover { color: var(--color-interactive-primary); }
    .docs__back-arrow { font-size: 1rem; }
    .docs__header-center { text-align: center; }
    h1 { font-size: 1.5rem; font-weight: 700; color: var(--color-interactive-primary); margin: 0 0 2px; }
    .docs__subtitle { font-size: 0.8rem; color: #9bbfb0; margin: 0; }
    .docs__pdf-btn {
      display: inline-flex; align-items: center; gap: 6px;
      height: 34px; padding: 0 14px;
      background: transparent; border: 1px solid #1e2e28;
      border-radius: 6px; color: #9bbfb0;
      font-size: 0.8rem; text-decoration: none;
      transition: border-color 0.15s, color 0.15s;
      white-space: nowrap;
    }
    .docs__pdf-btn:hover { border-color: var(--color-interactive-primary); color: var(--color-interactive-primary); }

    /* ── Body ── */
    .docs__body {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 24px 80px;
    }

    /* ── Banner ── */
    .banner {
      display: flex; align-items: flex-start; gap: 12px;
      background: rgba(44, 156, 116, 0.08);
      border: 1px solid rgba(44, 156, 116, 0.25);
      border-radius: 10px;
      padding: 14px 18px;
      margin-bottom: 36px;
      font-size: 0.875rem;
      color: #9bbfb0;
      line-height: 1.6;
    }
    .banner__icon { font-size: 1.1rem; flex-shrink: 0; margin-top: 1px; }
    .banner strong { color: #e8f5f0; }
    .banner code {
      font-family: monospace; font-size: 0.82rem;
      background: rgba(44, 156, 116, 0.12);
      color: var(--color-interactive-primary); padding: 1px 6px; border-radius: 4px;
    }

    /* ── Sections ── */
    .section { margin-bottom: 8px; }
    .section__title {
      font-size: 1rem; font-weight: 700;
      color: #e8f5f0;
      margin: 0 0 20px;
      display: flex; align-items: center; gap: 10px;
    }
    .section__title::before {
      content: '';
      display: inline-block;
      width: 3px; height: 18px;
      background: var(--color-interactive-primary);
      border-radius: 2px;
    }
    .divider { border: none; border-top: 1px solid #1e2e28; margin: 32px 0; }

    /* ── Steps ── */
    .steps { display: flex; flex-direction: column; gap: 16px; }
    .step {
      display: flex; gap: 16px; align-items: flex-start;
      background: #101A16;
      border: 1px solid #1e2e28;
      border-radius: 10px;
      padding: 18px 20px;
    }
    .step__num {
      flex-shrink: 0;
      width: 28px; height: 28px;
      background: var(--color-interactive-primary); color: #fff;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.85rem; font-weight: 700;
    }
    .step__title { font-size: 0.95rem; font-weight: 600; color: #e8f5f0; margin-bottom: 4px; }
    .step__desc { font-size: 0.82rem; color: #9bbfb0; margin-bottom: 10px; }
    .code-block {
      background: #0B1410;
      border: 1px solid #1e2e28;
      border-radius: 6px;
      padding: 10px 14px;
      font-family: monospace;
      font-size: 0.82rem;
      color: #3FB67D;
      white-space: pre-wrap;
      word-break: break-all;
      margin: 0;
    }

    /* ── Table ── */
    .table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
    }
    th {
      text-align: left; padding: 10px 14px;
      background: #101A16;
      color: #9bbfb0; font-weight: 600;
      border-bottom: 1px solid #1e2e28;
    }
    td { padding: 10px 14px; border-bottom: 1px solid #0f1f19; vertical-align: top; }
    tr:last-child td { border-bottom: none; }
    .td--name { color: #e8f5f0; font-weight: 500; white-space: nowrap; }
    .td--desc { color: #9bbfb0; }
    .tag {
      display: inline-block;
      font-size: 0.72rem; font-weight: 600;
      background: rgba(44, 156, 116, 0.12);
      color: var(--color-interactive-primary);
      border: 1px solid rgba(44, 156, 116, 0.2);
      padding: 2px 8px; border-radius: 20px;
      white-space: nowrap;
    }

    /* ── Key files ── */
    .files { display: flex; flex-direction: column; gap: 8px; }
    .file {
      display: flex; align-items: baseline; gap: 12px;
      background: #101A16; border: 1px solid #1e2e28;
      border-radius: 8px; padding: 12px 16px;
    }
    .file__path {
      font-family: monospace; font-size: 0.8rem;
      color: var(--color-interactive-primary); flex-shrink: 0;
      min-width: 220px;
    }
    .file__desc { font-size: 0.82rem; color: #9bbfb0; }

    /* ── Quick rules ── */
    .rules {
      display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
    }
    .rules__col {
      background: #101A16; border: 1px solid #1e2e28;
      border-radius: 10px; overflow: hidden;
    }
    .rules__header {
      padding: 10px 16px;
      font-size: 0.8rem; font-weight: 600;
      border-bottom: 1px solid #1e2e28;
    }
    .rules__col--good .rules__header { color: var(--color-interactive-primary); }
    .rules__col--bad  .rules__header { color: var(--color-danger); }
    .rule {
      padding: 8px 16px;
      border-bottom: 1px solid #0f1f19;
      font-size: 0.78rem;
    }
    .rule:last-child { border-bottom: none; }
    .rule code {
      font-family: monospace;
      color: #9bbfb0;
    }
    .rules__col--good .rule code { color: #3FB67D; }
    .rules__col--bad  .rule code { color: var(--color-danger); opacity: 0.75; }

    @media (max-width: 600px) {
      .docs__header { padding: 16px; }
      .docs__body { padding: 24px 16px 60px; }
      .rules { grid-template-columns: 1fr; }
      .file { flex-direction: column; gap: 4px; }
      .file__path { min-width: unset; }
    }
  `],
})
export class DocsComponent {
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
      code: 'Відкрий https://prototype-dashboard-sigma.vercel.app/my-slug\nі покажи console errors',
    },
  ];

  knowledgeRows = [
    { topic: 'DS Токени',         detail: 'Кольори, spacing, тіні, radius, типографіка',        source: 'SKILL.md' },
    { topic: '30+ DS компонентів', detail: 'fvdr-btn, fvdr-modal, fvdr-table, fvdr-tabs…',       source: 'SKILL.md' },
    { topic: 'Organism Templates', detail: 'Модалки, сайдпанелі, дропдауни, тости',             source: 'SKILL.md' },
    { topic: 'Іконки',            detail: '65 іконок FvdrIconName, правила використання',        source: 'CLAUDE.md' },
    { topic: 'Angular патерн',    detail: 'DS_COMPONENTS, TrackerService, FormsModule',          source: 'SKILL.md' },
    { topic: 'Analytics',         detail: 'PostHog EU + Supabase — автоматично через Tracker',   source: 'SKILL.md' },
    { topic: 'Git правила',       detail: 'Push тільки в claude/*, для main — remote gitlab',    source: 'CLAUDE.md' },
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
