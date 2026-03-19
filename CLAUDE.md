# Claude Code — Workflow Notes

> **База знань DS, токени, шаблони організмів, патерни:** → [`SKILL.md`](./SKILL.md)

## Icons

- Завжди використовуй `<fvdr-icon name="...">` з DS замість inline SVG.
- Доступні іконки: `src/app/shared/ds/icons/icons.ts` (тип `FvdrIconName`).
- Джерело: Figma "FVDR - Design System" → Icons (node 15846-7469, file liyNDiFf1piO8SQmHNKoeU).
- **НЕ створюй нову inline SVG іконку, якщо вона вже є в наборі.**
- Якщо потрібна іконка якої немає — витягни її з Figma через API і додай до `icons.ts`.
- Колір іконки — через CSS `color` на батьківському елементі або через клас.
- Розмір — через CSS `font-size` (іконка = `1em`).

## Git Push

- `origin` (local proxy) дозволяє push лише в гілки `claude/*`
- Для push в `main` використовувати remote `gitlab` напряму:

```bash
git push gitlab merge-to-main:main
```

- Токен зберігається в remote `gitlab` (glpat)
