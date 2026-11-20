## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

### Supabase

Backend is Supabase project `jyvmnfcnfqjfmsdbtlne`, reached through the `supabase` MCP server in `.mcp.json`. Use the project skills `supabase` and `supabase-postgres-best-practices` (in `.claude/skills/`, pinned in `skills-lock.json`; restore with `npx skills experimental_install`) for any database, auth, RLS or migration work.
