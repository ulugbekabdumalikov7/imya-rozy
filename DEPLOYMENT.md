# Deployment: GitHub + Cloudflare Pages

The site is a static Vite build plus one small endpoint, `/api/feedback`, for the «Написать автору» form. It needs no database or container, and it costs nothing on Cloudflare's free plan, which includes unlimited bandwidth and 500 builds a month.

```
feature branch ──push──► GitHub ──► GitHub Actions: lint · typecheck · test · build · verify   (status "check")
      │                     │
      └── pull request ─────┼──► Cloudflare Pages: preview build  → https://<branch>.<project>.pages.dev
                            │
   merge into main ─────────┴──► Cloudflare Pages: production build → https://<project>.pages.dev
```

| Setting | Value |
|---|---|
| Production branch | `main` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | *(empty)* |
| Node version | taken from `.nvmrc` (22). No variable is needed; `NODE_VERSION=22` is optional. |
| Environment variables | none required (see `.env.example`) |

## What is already done in the repository

- A Git repository on branch `main` with an initial commit. `.gitignore` excludes `node_modules`, `dist`, `.env*` and the Wrangler cache.
- `.github/workflows/ci.yml` is the required check **`check`**. It runs on every PR into `main` and every push to `main`.
- `.github/dependabot.yml` opens grouped minor/patch updates once a month. Each update goes through CI and gets its own preview.
- `public/_headers` sets:
  - a strict CSP (same origin only);
  - `X-Frame-Options`, `nosniff`, a referrer policy, a permissions policy and HSTS;
  - an immutable cache on `/assets/*`;
  - `noindex` on preview URLs.
- Self-hosted fonts and WebP plans, so the site makes no third-party requests.
- `scripts/verify-dist.mjs` checks the built output for broken asset paths, external requests, missing headers and oversized images.
- Hash routing (`/#/heroes/william`), so refreshes and deep links need no `_redirects`.

## One-time setup (manual: needs your accounts)

I can't create accounts, repositories or Cloudflare projects for you. Steps 1–4 need you to sign in.

### 1. Create the GitHub repository and push

1. Go to <https://github.com/new>.
   - Name: `imya-rozy`.
   - Choose **Public**. Free branch protection works on public repos only; see step 4.
   - Do **not** add a README, `.gitignore` or license (the repo already has them).
   - Click **Create repository**.
2. Unpack the project archive and run, inside the folder:

   ```bash
   npm ci && npm run check          # optional: confirm everything passes locally (Node 20.19+)
   git remote add origin https://github.com/<your-username>/imya-rozy.git
   git push -u origin main
   ```

   With the GitHub CLI you can do both in one step: `gh repo create imya-rozy --public --source=. --push`.
3. Open the **Actions** tab. The **CI** run should turn green in about a minute. The `check` status must have run once before you can select it in step 4.

### 2. Create the Cloudflare Pages project

1. Sign up or log in at <https://dash.cloudflare.com/sign-up>. The free plan is enough, and no payment method is needed.
2. In the sidebar, open **Workers & Pages**, then **Create application** → **Pages** → **Import an existing Git repository**. In some dashboard versions this is labelled **Connect to Git**.
   - Pick a project created as **Pages**, not a Worker. Only Pages reads `_headers` from `dist` with no extra configuration.
3. Click **Connect GitHub**. GitHub asks you to install the *Cloudflare Workers and Pages* app. Choose **Only select repositories** → `imya-rozy` → **Install & Authorize**.
4. Select `imya-rozy` → **Begin setup** and fill in:
   - **Project name:** `imya-rozy`. This becomes `imya-rozy.pages.dev`; if the name is taken, Cloudflare adds a suffix.
   - **Production branch:** `main`.
   - **Framework preset:** `React (Vite)`, or `None`.
   - **Build command:** `npm run build`.
   - **Build output directory:** `dist`.
   - **Environment variables:** none. (Optional: `NODE_VERSION` = `22`.)
5. Click **Save and Deploy**. The first build takes about 1–2 minutes.

### 2b. If you created a **Worker** instead of a Pages project

The build log then shows `npx wrangler deploy` / "Proceed with setup?". That flow works too — the repository includes `wrangler.jsonc` for it.
In **Workers & Pages → your Worker → Settings → Build**:

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Non-production branch deploy command | `npx wrangler preview` or `npx wrangler versions upload` (both work; gives each branch a preview URL) |
| Root directory | *(empty)* |

The `name` in `wrangler.jsonc` must equal the Worker's name in the dashboard (default `imya-rozy`); if yours differs, change the file. Then **Deployments → Retry build** (or push any commit). The site is at `https://imya-rozy.<your-subdomain>.workers.dev`. `_headers` (CSP, caching) works the same way; the `*.pages.dev` noindex rule simply doesn't apply.

### 3. Get the public URL

When the build finishes, Cloudflare shows **Success** and the URL `https://<project>.pages.dev`. You can always find it again under **Workers & Pages → imya-rozy** (the "Domains" or "Visit site" link).

Check it:
- Open `https://<project>.pages.dev/#/heroes/william` and press refresh. The hero page should load again.
- In DevTools → Network, the response headers should include `content-security-policy` and `cache-control: … immutable` on `/assets/…`.
- View the page source: `<meta name="build" content="abc1234">` shows the deployed commit.

### 4. Protect `main` (failed checks block merging)

On GitHub's free plan, branch rules are enforced only on **public** repositories. A private repo needs GitHub Pro or Team for this.

**Settings → Rules → Rulesets → New ruleset → New branch ruleset**:
- **Name:** `main`. **Enforcement status:** Active.
- **Target branches:** Add target → *Include default branch*.
- Tick:
  - **Restrict deletions**;
  - **Block force pushes**;
  - **Require a pull request before merging** (0 required approvals is fine when you work alone);
  - **Require status checks to pass** → Add checks → type `check` and select it (source: GitHub Actions). Also enable *Require branches to be up to date before merging*.
- Click **Create**.

If you prefer the GitHub CLI (after `gh auth login`), this does the same:

```bash
gh api repos/<your-username>/imya-rozy/rulesets -X POST --input - <<'JSON'
{ "name": "main", "target": "branch", "enforcement": "active",
  "conditions": { "ref_name": { "include": ["~DEFAULT_BRANCH"], "exclude": [] } },
  "rules": [
    { "type": "deletion" }, { "type": "non_fast_forward" },
    { "type": "pull_request", "parameters": { "required_approving_review_count": 0, "dismiss_stale_reviews_on_push": false,
      "require_code_owner_review": false, "require_last_push_approval": false, "required_review_thread_resolution": false } },
    { "type": "required_status_checks", "parameters": { "strict_required_status_checks_policy": true,
      "required_status_checks": [ { "context": "check" } ] } } ] }
JSON
```

You can also go to **Settings → General → Pull Requests**: allow only **squash merging** and turn on **Automatically delete head branches**.

### 5. Preview deployments

Previews are on by default. To confirm, open **Cloudflare → imya-rozy → Settings → Build → Branch control**:
- **Production branch:** `main`;
- **Preview branch:** *All non-production branches*.

Every pushed branch gets:
- `https://<branch-name>.<project>.pages.dev`, which always shows the latest build of that branch;
- a unique `https://<hash>.<project>.pages.dev` for each build.

On a PR, Cloudflare posts the link as a comment and as a check. Previews send `X-Robots-Tag: noindex`, so search engines index only the production URL.

The preview URLs are public but hard to guess. To restrict them, use Cloudflare → project → Settings → **Enable access policy** (Cloudflare Access, free for up to 50 users). This is optional.

## Publishing changes (every time)

```bash
git switch main && git pull
git switch -c feature/short-name      # or fix/…, content/…, chore/…
# edit…
npm run check                          # same checks as CI
git commit -am "Карта: …"
git push -u origin feature/short-name
```

1. On GitHub, open the pull request (there is a **Compare & pull request** button). CI runs **check**, and Cloudflare builds a preview.
2. Review the preview link. Once **check** is green, use **Squash and merge**.
3. Cloudflare rebuilds `main`. The production URL updates in about 1–2 minutes, and nothing else needs to be done.

**Rollback:** Cloudflare → imya-rozy → **Deployments** → choose an earlier deployment → ⋯ → **Rollback to this deployment**. The rollback is instant. Afterwards, fix the code with `git revert` in a PR.

## Optional, later

- **Custom domain:** project → **Custom domains** → *Set up a domain*. It's free on Cloudflare, but the domain name itself costs money. When you add one, the `*.pages.dev` address keeps working.
- **Analytics:** Cloudflare Web Analytics is free and cookie-free. Enabling it injects a script from `static.cloudflareinsights.com`, so add that host to `script-src` and `connect-src` (`cloudflareinsights.com`) in `public/_headers`.
- **If a backend is ever needed** (a feedback form, shared notes): use **Cloudflare Pages Functions**. Put a `functions/` folder in this repo; it deploys with the site. Pair it with **KV** or **D1** for storage. All of these have free tiers, and no separate server is involved. The current site needs none of this.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Cloudflare build fails at `npm ci`, or with an engine error | Node is too old. Set `NODE_VERSION=22` under Settings → Variables and Secrets, then retry the deployment. |
| `check` can't be found when you add the required check | CI hasn't run yet. Push to `main` or open a PR, then add it. |
| Styles or fonts missing after a deploy | Clear the browser cache; HTML is never cached (`max-age=0`). Run `npm run preview:cf` locally to reproduce. |
| CSP error in the console after you add an external script | Add its host to the matching directive in `public/_headers`. `tests/deploy.test.ts` guards against accidentally loosening the policy. |

## Feedback form («Написать автору»)

The feather button in the header opens a form. The form posts to `/api/feedback` on the same site (so the CSP stays `connect-src 'self'`), and the server sends the letter through [Resend](https://resend.com). The free plan allows 100 emails a day.

- **Worker project:** handled by `worker/index.ts` (`main` in `wrangler.jsonc`; `/api/*` runs before static files).
- **Pages project:** handled by `functions/api/feedback.ts`. Pages picks it up automatically.
- **Shared logic:** both use `server/feedback.ts`, which validates the letter, checks the origin, sets up a honeypot against bots and sends the email.

The recipient address is **not stored in the code**. Until the two settings below exist, the endpoint answers `503`, and the form says it couldn't send and keeps the text.

### One-time setup

1. Sign up at <https://resend.com> **with the address that should receive the letters**. Without your own domain, Resend can only send from `onboarding@resend.dev` to the account owner's address.
2. In Resend, open **API Keys → Create API key**. Permission: *Sending access*. Copy the key.
3. In Cloudflare, open **Workers & Pages → imya-rozy → Settings → Variables and Secrets** and add:

   | Name | Type | Value |
   |---|---|---|
   | `RESEND_API_KEY` | Secret | the key from step 2 |
   | `FEEDBACK_TO` | Text | the address from step 1 |

   For a Worker, the same can be done from a terminal: `npx wrangler secret put RESEND_API_KEY`, then `npx wrangler secret put FEEDBACK_TO`.
4. Redeploy, or push any commit. Then send a test letter from the site.

Optional settings:

- **Fallback for readers:** set the build variable `VITE_FEEDBACK_EMAIL` (**Settings → Build → Variables**). If sending from the site fails, the form then also offers «Через почту», which opens the reader's mail app with the letter already filled in. This address ends up in the page code, so it becomes visible to everyone.
- **Your own sender:** after verifying a domain in Resend, set `FEEDBACK_FROM`, for example `Атлас «Имени розы» <atlas@your-domain>`.
