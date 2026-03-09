# Claude Code — Workflow Notes

## Git Push

- `origin` (local proxy) дозволяє push лише в гілки `claude/*`
- Для push в `main` використовувати remote `gitlab` напряму:

```bash
git push gitlab merge-to-main:main
```

- Токен зберігається в remote `gitlab` (glpat)
