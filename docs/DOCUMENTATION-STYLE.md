# Documentation Style Guide

> **Purpose:** Keep Beaverr docs clear, consistent, and useful for humans and AI agents.  
> **Aligned with:** [Atlassian best practices](https://www.atlassian.com/blog/loom/software-documentation-best-practices), [Meegle documentation standards](https://www.meegle.com/en_us/topics/software-lifecycle/software-documentation-standards), [Mastering software documentation](https://medium.com/@nomannayeem/mastering-the-art-of-software-documentation-a06aa5d7e697)

---

## 1. Know your audience

Every page must declare **who it is for** in the first paragraph or a callout.

| Audience | Tag | Write for… |
|----------|-----|------------|
| End users | `user` | Household budgeters; plain language, no jargon |
| Developers | `developer` | Engineers and Cursor/AI agents; precise file paths and behavior |
| Operations | `ops` | Deploy, Supabase, GCP, admin CMS |
| Design | `design` | Tokens, typography, layout rules |
| Product | `product` | Strategy, personas, success criteria |

Do not mix audiences on one page without clear sections.

---

## 2. Page structure (required)

Use this template for how-to and reference pages:

1. **Title** — task or topic name  
2. **Purpose** — one sentence: what the reader will achieve  
3. **Audience** — tag(s) from the table above  
4. **Prerequisites** — what they need first (or “None”)  
5. **Steps / content** — numbered steps for procedures; headings for reference  
6. **Troubleshooting** — common failures (when applicable)  
7. **Related links** — documentation pages and app-repo files  
8. **Last reviewed** — `YYYY-MM-DD` and app phase if relevant  

---

## 3. Voice and tone

Match **Beaverr brand** (`PRODUCT.md`):

- **Clear, trustworthy, practical** — household terms, not fintech hype  
- **Formal “vy”** in Czech user-facing copy (app strings); docs EN primary, CS pages added when needed  
- **Direct** — short sentences; one idea per paragraph  
- **No filler** — if it’s obvious from the UI, don’t document it  

---

## 4. Naming and paths

- Doc filenames: **kebab-case** or **SCREAMING-KEBAB** matching existing `docs/` conventions  
- Titles: **Title Case** for nav, sentence case in H1 if preferred  
- Code identifiers: exact names from the repo (`lib/storage.js`, `beaverr_onboarding`)  
- Link to app repo files with path: `` `docs/ARCHITECTURE.md` `` (relative to monorepo root)

---

## 5. Version control and lifecycle

| Status | Meaning |
|--------|---------|
| Ready | Linked from `docs/README.md` |
| Draft | Work in progress — prefix filename or note at top |
| Needs review | Content may be stale — tag or note at top |

**Rules:**

- Prefer editing in `docs/` (canonical source in the repo)  
- Update **Last reviewed** when verifying against the app  
- User-visible changes: keep `CHANGELOG.md` in the app repo as the technical log  

### Release notes from CHANGELOG

When `CHANGELOG.md` changes and you want monthly release notes under `docs/release-notes/`:

```bash
node scripts/generate-release-notes.mjs
```

---

## 6. Visuals and examples

- Use **screenshots** for onboarding and admin UI when steps are non-obvious  
- Use **diagrams** (Mermaid) for flows: boot routing, AI pipeline, sync  
- Use **code blocks** with language tags for commands and config  
- Prefer **real examples** from Beaverr (CZK amounts, EN/CS keys) over lorem ipsum  

---

## 7. What not to duplicate

Keep a **single source of truth**:

| Topic | Canonical location |
|-------|-------------------|
| Full architecture | `docs/ARCHITECTURE.md` |
| Onboarding screen specs | `docs/onboarding-flow-documentation.md` |
| Storage keys & shapes | `lib/schema.js` |
| UI copy | `lib/locales/en.json`, `cs.json` |
| Changelog (technical) | `CHANGELOG.md` — user-facing release notes in `docs/release-notes/` |

---

## 8. Templates

### How-to

```markdown
## Purpose
…

## Audience
developer

## Prerequisites
- Node 20+, repo cloned

## Steps
1. …

## Troubleshooting
| Symptom | Fix |
|---------|-----|

## Related
- …
```

### FAQ entry

```markdown
### Question?
Short answer. Link to how-to if longer.
```

---

## 9. Collaborative review

- Non-trivial ops or architecture pages: second pair of eyes before publishing  
- After major features (AI insights, admin CMS, onboarding changes): grep docs for stale mentions  

---

## 10. Czech locale (future)

When adding CS documentation pages:

- Mirror EN structure; use a clear locale prefix or separate book in `docs/`  
- Formal **vy** tone; match `lib/locales/cs.json` style  
- Same structure as EN page; do not translate code paths or storage keys
