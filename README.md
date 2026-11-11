# Man Singh: systems + vision

Personal portfolio: Next.js (App Router, static export) + TypeScript + Tailwind v4, GSAP/ScrollTrigger, Lenis, Framer Motion (`motion`), React Three Fiber + drei.

## Develop

```bash
npm install
npm run dev            # http://localhost:3000
npm run build          # static export → ./out
npm start              # serve ./out locally
npm run refresh-data   # pull fresh GitHub / LeetCode / Codeforces stats
```

`refresh-data` uses `GITHUB_TOKEN`/`GH_TOKEN` if set, otherwise `gh auth token`.
It writes raw responses to `data/*.json` and a compact, privacy-filtered `src/data/site.json`
(the only data file the site imports). Private repositories and PRs to private repositories
are never written to `site.json`. If one source fails, the previous values are kept.

## Where things live

| Path | What |
| --- | --- |
| `src/lib/content.ts` | Hand-written copy (from the resume / READMEs) |
| `src/lib/data.ts` | View-models derived from `site.json` |
| `src/components/sections/*` | One file per page section |
| `src/components/three/*` | WebGL scenes (lazy-loaded, desktop only) |
| `src/components/shell/*` | Preloader, nav, cursor, ⌘K palette, `~` terminal |
| `public/Man_Singh_Resume.pdf` | Public resume (phone & roll number redacted) |
| `scripts/redact_resume.py` | Re-create the redacted resume from a new PDF |

## Behaviour notes

- 3D scenes only load on capable desktops (≥768px, fine pointer, WebGL, no reduced motion, no data saver). Others get 2D/static fallbacks.
- `prefers-reduced-motion`: no smooth scroll, no preloader, no WebGL, no reveal animations; all content visible.
- Boot preloader runs once per tab session on tablet and desktop; phones skip it for speed.
- Easter eggs: `⌘K` / `Ctrl K` command palette, `~` terminal (`help`, `whoami`, `projects`, `prs`, `stats`, `sudo hire-me`, …).

## Deploy

See the deploy section in the handoff notes, or in short:
- **Vercel**: import the repo, framework "Next.js", no settings needed. Optionally set `NEXT_PUBLIC_SITE_URL` to your final domain.
- **GitHub Pages**: Settings → Pages → Source "GitHub Actions", add repo variable `DEPLOY_PAGES=true`.
- **Daily stats**: `.github/workflows/refresh-data.yml` runs at 03:17 UTC and commits changes, which redeploys.
