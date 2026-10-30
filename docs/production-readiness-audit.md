# Hey Charlotte: Production Readiness Audit

| | |
|---|---|
| **Audit date** | 2026-10-29 |
| **Code audited** | `main` at commit `2e2edf8` (repository `irev1ak1n/heycharlotte`) |
| **Live site audited** | https://heycharlotte.vercel.app (production deployment from the same commit lineage) |
| **Scope** | Whole repository, the deployed site, the GitHub repository settings, the Vercel project |
| **Method** | Static code review, search of the full Git history for secrets, `npm audit`, link and asset inventory scripts, HTTP header checks against the live site, and lab measurements in a browser (375px mobile emulation, no network throttling) |
| **Changes made to the website** | None. This report is the only new content. |

> The website itself was not modified during this audit. Everything below describes what exists today.

## How to read this report

**Severity**

- **Critical**: breaks the site for real visitors, leaks data, or makes launch unwise.
- **High**: should be fixed before or at launch.
- **Medium**: noticeable quality or risk issue, fix soon after launch.
- **Low**: polish or hardening.

**Status**

- **Confirmed**: reproduced or proven from the code or the live site.
- **Potential**: a risk that depends on how the site is used or deployed, or that needs more investigation. These are not claimed as vulnerabilities.

**Legal note.** Section 3.6 lists things worth checking. It does not state legal obligations as fact, and it is not legal advice. Whether any item applies depends on who the audience is, where they live, and the rules of the FBLA competition the README mentions.

---

## 1. Executive summary

Hey Charlotte has a strong visual identity, clean hand-written HTML/CSS/JS with no heavy framework, no secrets in the code or history, a working Vercel deployment with automatic deploys from GitHub, and a responsive layout that was recently tested down to 320px.

It is **not ready for a public launch yet**, mainly because the site promises much more than it currently delivers:

1. **Most of the site does not exist.** 38 of the 45 internal link targets return a 404 and 5 more are empty files. Every item in the navigation menu except one, every homepage card, every food-category card and the footer links lead to a missing or blank page.
2. **The contact form does not work, and it puts what visitors type into the page address.**
3. **The homepage downloads about 46 MB on first load**, mostly four 9–10 MB PNG backgrounds and a 9.5 MB loading-screen image, so the first paint took about 4.3 seconds even on an unthrottled connection.
4. **No security headers** (only HSTS), **no robots.txt, sitemap, canonical URLs, social preview tags, custom 404 page, privacy notice or terms.**
5. **Several internal development files are publicly downloadable** (the unused Express server, scripts, the GitHub workflow). They contain no secrets, but they are not meant for visitors.

None of these require a redesign. Most are quick configuration or content fixes. The only large piece of work is deciding how to handle the missing pages (build them, or hide the links until they exist).

### Scorecard

| Area | Rating | One line |
|---|---|---|
| Security | **Fair** | Clean secrets and no confirmed XSS, but no security headers, an unsafe unused API server in the repo, and a form that leaks input. |
| SEO | **Poor** | Basic titles exist, but no canonical, social tags, robots, sitemap, h1 on the homepage, and wrong brand and domain in metadata. |
| Accessibility | **Fair** | Good foundations (reduced motion CSS, ARIA on the menu, tap targets), with gaps in landmarks, form labels, menu semantics and focus handling. |
| Performance | **Poor** | Image and video weight is the main problem. Code size, layout stability and server speed are good. |
| Functionality | **Poor** | Navigation mostly leads to 404s, the contact form is broken, and the site has no fallback without JavaScript. |
| Legal and privacy | **Needs review** | Google Analytics runs with no privacy notice, and image, video and data provenance is undocumented. |
| Deployment and maintenance | **Fair** | Deploys work. No tests, no CI, no branch protection, a scheduled workflow that fails every day. |
| Content | **Fair** | Good copy on the homepage. Stale brand names, placeholder data, and an out-of-date references page. |

### What is already good

- **No secrets anywhere.** Searched the current tree, every commit in this repository, and the full history of the earlier local repository. No API keys, tokens or private keys were found. GitHub secret scanning and push protection are enabled.
- **No confirmed XSS.** User-facing rendering escapes text, and URL parameters are never written into the page as HTML.
- **Small JavaScript.** About 15 KB of scripts in total, no frameworks, nothing unnecessary.
- **Layout stability is good.** Cumulative Layout Shift measured 0.016 (the "good" threshold is 0.1).
- **Fast server.** Time to first byte was 68 ms from Vercel's edge, with Brotli compression on text files and HSTS enabled.
- **Reduced-motion support exists** in 10 of the stylesheets, and the hero video has a pause button.
- **Touch targets** are at least 44px on touch devices after the recent mobile work.
- **Deployment is simple and reversible**: every deploy is kept and can be promoted back from the Vercel dashboard.

---

## 2. Critical issues (fix before any public launch)

### C-01 · Most pages and links are dead ends

**Severity:** Critical · **Status:** Confirmed

**What exists.** The site has two real pages: the homepage and `pages/resources.html`. A third page, `pages/references.html`, exists but is not linked from anywhere. The five files in `pages/home/` are empty.

**What is broken.** A scan of every internal link in the homepage, navigation, footer and the two pages found **45 unique targets: 2 work, 5 are empty files, 38 return a 404.** That includes:

- every navigation dropdown item except "All Resources";
- all 36 footer links except "All Resources";
- all five quick-link cards under the hero (they point to empty files, so they open a blank page), all five food cards, "See All" and "Explore All";
- the navigation search, which routes typed queries to those same missing pages.

On the live site a missing page shows Vercel's default plain-text "The page could not be found / NOT_FOUND", with no navigation and no way back.

**Recommendation.** Pick one of these and apply it consistently:

- **Option A (fastest, launch safe).** Only link to pages that exist. Remove or hide the dropdown items, footer links and cards that point to missing pages, and keep the structure ready to restore as each page is built.
- **Option B.** Build the pages. The existing `resources` page and its data-driven pattern can be reused for most categories.
- **In both cases,** add a custom `404.html` in the site root (Vercel serves it automatically for unknown URLs) with the site header, a short message and links to real pages.

### C-02 · The "Get in touch" form does nothing and leaks what visitors type

**Severity:** Critical · **Status:** Confirmed (from code; `partials/footer.html` lines 79 to 85, no handler in any script)

**What exists.** A footer form with name, email and message fields and a submit button.

**What is broken.**

- The form has no `action`, no `method` and no JavaScript handler. Pressing "Send message" reloads the page with a browser GET request, so the name, email and message end up in the address bar as `?name=...&email=...&message=...`.
- Nothing receives the message. The visitor sees no confirmation and no error. The site owner never gets anything.
- Because the page address now contains the typed text, it can also be recorded by browser history, server logs, shared links and Google Analytics (see L-02).
- The inputs have no `required`, no validation and no spam protection.

**Recommendation.** Either:

- remove the form and replace it with a plain `mailto:` link or a short "contact" line, or
- make it work: a small Vercel serverless function (or a hosted form service) that validates input, applies a honeypot and rate limit, sends the email, and shows a clear success or error message. Use `method="post"`, label every field, and never put the content in the URL.

### C-03 · The homepage is far too heavy

**Severity:** Critical (for mobile and slow connections) · **Status:** Confirmed (measured)

**What exists.** A cinematic design with full-screen images, a loading screen and three hero videos.

**Measured on the live site** (375px mobile emulation, no network throttling, fresh cache):

| Metric | Result |
|---|---|
| Total transferred on first load | **about 46 MB** across 52 requests |
| First Contentful Paint and Largest Contentful Paint | **4.27 s**, and the LCP element is the loading-screen image `loader.png` |
| Time to first byte | 68 ms (good) |
| Cumulative Layout Shift | 0.016 (good) |
| JavaScript | about 15 KB (good) |

**What is wrong.** Five PNG files account for about 47 MB of source weight, and the four used on the homepage load immediately as CSS backgrounds even though most are far below the fold:

| File | Size | Dimensions |
|---|---|---|
| `assets/img/home/job.png` | 9.8 MB | 1536 × 2752 |
| `assets/img/loader.png` | 9.5 MB | 2752 × 1536 |
| `assets/img/things/50-things-to-do-summer.png` | 9.3 MB | 2752 × 1536 |
| `assets/img/cuisines/date-night.png` | 8.9 MB | 2400 × 1792 |
| `assets/img/footer.png` (unused by the page) | 10.6 MB | 2752 × 1536 |

On a typical phone connection these would take many seconds to tens of seconds. Even the unthrottled lab run needed over 4 seconds to show anything.

**Recommendation.**

- Convert the images to WebP or AVIF at the sizes actually displayed (most cards display under 700px wide). A realistic target is 60 to 200 KB each, which turns about 47 MB into well under 2 MB.
- Serve smaller loader and hero images first, and load below-the-fold card images lazily.
- See P-02 for the videos.

### C-04 · Without JavaScript the site is a permanent loading screen with no navigation

**Severity:** High, rising to Critical if JavaScript fails for any reason · **Status:** Confirmed (from code)

**What exists.** The loading overlay is plain HTML that covers the whole screen. Only JavaScript removes it. The navigation and footer are not in the page source either: they are fetched and injected by script.

**What is broken.** If a script fails to load or is blocked, the visitor sees the loading screen forever. Search engines and tools that do not run JavaScript see a page with no navigation and no footer, and the resource directory content is also loaded by script from a JSON file.

**Recommendation.**

- Add a `<noscript>` rule that hides the loader and reveals content.
- Add a no-JS fallback for the main navigation (or include the nav and footer in the HTML at build time).
- Keep the loading screen's maximum wait inside CSS as well (for example, an animation that hides it after a few seconds) so a script failure cannot trap visitors.

---

## 3. Important launch improvements

### 3.1 Security

#### S-01 · Only one security header is set

**Severity:** High · **Status:** Confirmed (`curl -I` against the live site)

**Exists.** `Strict-Transport-Security` (HSTS), set by Vercel.

**Missing.** `Content-Security-Policy`, `X-Content-Type-Options`, clickjacking protection (`frame-ancestors` or `X-Frame-Options`), `Referrer-Policy`, `Permissions-Policy`. The project's `vercel.json` only contains one rewrite.

**Recommendation.** Add a `headers` block to `vercel.json` for all routes. Start with the safe ones (`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` denying unused features, `frame-ancestors 'none'`). For a Content Security Policy, note that the site uses an inline Google Analytics snippet, 26 inline `style` attributes on the homepage, Google Fonts and Google Tag Manager. Roll the policy out in **report-only mode first**, then enforce it. Do not copy a generic policy that would break the fonts or analytics.

#### S-02 · Internal development files are publicly downloadable

**Severity:** Medium · **Status:** Confirmed (all return HTTP 200 on the live site)

**Exists.** Vercel serves the whole repository root, so these are public: `/server/index.js`, `/server/package.json`, `/scripts/update-places.js`, `/.github/workflows/update-places.yml`, `/composer.json`, `/partials/*`, and the `/data/*.json` files.

**Risk.** No secrets are in them (confirmed), but they reveal internal structure and an unused API design, and they make the site look unfinished to anyone who looks.

**Recommendation.** Add a `.vercelignore` listing `server/`, `scripts/`, `.github/`, `composer.json`, `docs/` and anything else that is not part of the site. The `partials/` and `data/` folders are used by the live pages and must stay public. (This audit adds a `.vercelignore` containing only `docs/`, so this report is not published on the site. See Section 8.)

#### S-03 · The unused Express server is unsafe if it is ever deployed

**Severity:** Potential (becomes Critical if deployed) · **Status:** Confirmed in code, not currently exposed (`/api/resources` returns 404 on the live site)

**Exists.** `server/index.js` is a small Express app with `GET /api/resources` and `POST /api/resources`.

**Problems in the code.**

- `POST` writes any JSON body straight into `resources.json` with **no authentication, no validation, no size or rate limits**, and `app.use(cors())` allows any website to call it.
- The data file it points to (`server/data/resources.json`) does not exist, so the endpoints would crash on first use.
- It reads and parses the file on every request and has no error handling.

**Dependencies.** `npm audit` on `server/package-lock.json` reports **7 vulnerabilities: 1 critical (`proxy-addr`, IP spoofing), 5 high (`body-parser`, `brace-expansion`, `minimatch`, `path-to-regexp`, `picomatch`) and 1 moderate (`qs`)**, all indirect through Express. They do not affect the current static site because the server is not deployed.

**Recommendation.** Delete `server/` if it is not planned. If you keep it for later, update the dependencies, require authentication for `POST`, validate input with a schema, restrict CORS to your own origin, and add rate limits before it is ever deployed.

#### S-04 · Contact form leaks input and has no abuse protection

See **C-02**. Once a working form exists it also needs server-side validation, a honeypot or CAPTCHA, and rate limiting (Vercel's firewall rules can rate-limit one route without extra code).

#### S-05 · GitHub repository and automation settings

**Severity:** Medium · **Status:** Confirmed

- `main` is **not protected**: any push to `main` deploys straight to production, and there are no required checks or reviews.
- Dependabot security updates are **disabled**. Secret scanning and push protection are enabled (good).
- The scheduled workflow `.github/workflows/update-places.yml` has `permissions: contents: write`, uses actions pinned to major tags rather than commit SHAs, and its API key line is commented out (see D-03).
- The repository is public and has **no license**, which means default copyright applies. Decide whether that is intended.

**Recommendation.** Protect `main` (pull request required, status checks required, no force push), enable Dependabot, tighten workflow permissions, and choose a license or state that the code is all rights reserved.

#### S-06 · API key handling for a future Places API integration

**Severity:** Potential · **Status:** Needs verification

The script `scripts/update-places.js` expects a `GOOGLE_PLACES_API_KEY` environment variable. A past commit message mentions adding a Google Maps API key. No key exists in the code or history. If a key exists in the Google Cloud console, confirm that it is **restricted** (to the Places API and to GitHub's or your server's access), has a budget alert, and is rotated if it was ever pasted anywhere public.

#### S-07 · XSS review (no confirmed vulnerability)

**Status:** Potential, low

- `assets/js/resources.js` builds cards with `innerHTML` but passes names, descriptions, categories and URLs through an `esc()` helper that escapes `& < > "`, and attributes use double quotes, so this is safe today.
- Link URLs are escaped but not checked for scheme. A `javascript:` URL in `data/resources.json` would be inserted as a link. This is only possible if someone edits that file, but it should be validated before the data ever comes from users or an API.
- `includes.nav.js` and `includes.footer.js` insert HTML fetched from the site's own `partials/` folder (trusted).
- `newsletter.js` uses `innerHTML` with a fixed country list, but it is unused (no page calls `initNewsletter`).
- The `?q=` parameter only sets an input's value, and `?cat=` is only compared against known categories.

**Recommendation.** Keep escaping every dynamic value, validate that links start with `https://`, and re-run this review if user-submitted content is ever added.

#### S-08 · CORS and rate limiting

**Status:** Not applicable today

The site is static, makes no cross-origin API calls, and sets no CORS headers, which is correct. If an API or form endpoint is added, restrict allowed origins and add rate limiting then. Do not add either feature now.

### 3.2 SEO

#### SEO-01 · Crawl and sharing basics are missing

**Severity:** High · **Status:** Confirmed

| Item | Homepage | Resources page | References page |
|---|---|---|---|
| Unique `<title>` | `Hey Charlotte` (brand only) | Good | Uses the old brand name |
| Meta description | Present, **wrong brand** | Good | **Missing** |
| Canonical URL | Missing | Missing | Missing |
| Open Graph / Twitter tags | Missing | Missing | Missing |
| Favicon link | Yes | **No** | Yes |
| Structured data (JSON-LD) | `WebSite` with **wrong domain** | None | None |

Also missing site-wide: `robots.txt`, `sitemap.xml`, `/favicon.ico` (all return 404), an `apple-touch-icon`, and a `theme-color`. The favicon is a JPG labelled `image/x-icon`.

**Recommendation.**

- Add `robots.txt` and `sitemap.xml`. Only list pages that exist.
- Add a canonical URL on every page. `/pages/resources` and `/pages/resources.html` both return 200 today, so search engines see duplicates. Pick one form and redirect the other, or set the canonical.
- Add `og:title`, `og:description`, `og:image` (a 1200×630 image) and `og:url`, plus a Twitter card.
- Add a real `favicon.ico` (or PNG/SVG icons) and an Apple touch icon on every page.
- Give each page a unique, descriptive title and description.

#### SEO-02 · The brand and domain in the metadata are wrong

**Severity:** High · **Status:** Confirmed

The homepage JSON-LD says the site is `https://www.cltresourcehub.org/` and its description still says "Charlotte Resource Hub" ("student-developed community resource hub"). The live site is `heycharlotte.vercel.app` and the brand is "Hey Charlotte". Search engines may treat the structured data as pointing at a different site. The `cltresourcehub.org` domain is not connected to this project.

**Recommendation.** Decide the final domain first (see D-05), then update the JSON-LD `url`, the description, and the canonical tags to match. Remove the alternate name if it is not intended.

#### SEO-03 · Heading structure

**Severity:** Medium · **Status:** Confirmed

- The homepage has **no `<h1>`**. The quick-link cards under the hero use `<h3>` with no `<h2>` before them, and the first `<h2>` is "The City's Best, All In One Place".
- The homepage has no `<main>` landmark.
- The resources page has an `<h1>` and `<main>` but no `<h2>` (sections are generated by script).

**Recommendation.** Give the hero a visually hidden or visible `<h1>`, add a section heading for the quick links, and wrap the content in `<main>`.

#### SEO-04 · Content is injected by JavaScript

**Severity:** Medium · **Status:** Confirmed

The navigation, footer and the resource directory are created by script. Search engines that run JavaScript can see them, but others, and many link-preview tools, cannot. See C-04 for the no-JavaScript fallback; for SEO, consider generating `nav` and `footer` into the HTML at build time and rendering the resource list into the page.

#### SEO-05 · The references page is orphaned but indexable

**Severity:** Low · **Status:** Confirmed

`pages/references.html` is not linked from the navigation or footer, has no description, uses the old brand and a different competition name, and shows errors for missing files (see F-04). Either finish it and link it, or add `<meta name="robots" content="noindex">` until it is ready.

### 3.3 Accessibility (WCAG 2.2 AA)

Not tested with real screen readers. Findings come from code review, computed measurements and the earlier mobile test pass.

#### A-01 · Missing landmarks and skip link

**Severity:** Medium · **Status:** Confirmed

The homepage has no `<main>`, no `<header>`, and no skip-to-content link. Keyboard users must tab through the whole navigation on every page. **Recommendation:** add a skip link, a `<main id="main">`, and `<header>` / `<nav>` landmarks (the injected navigation is already a `<nav>` once rendered).

#### A-02 · Footer form fields have no real labels

**Severity:** High · **Status:** Confirmed

The three fields rely on placeholder text only. Placeholders disappear when typing and are not a reliable accessible name. The form also has no required-field indication and no error or success messages. **Recommendation:** add visible or visually hidden `<label>` text, `required` where needed, and announce results with `role="status"`.

#### A-03 · The navigation uses the ARIA "menu" pattern

**Severity:** Medium · **Status:** Confirmed

Dropdowns use `role="menu"` and `role="menuitem"`. That pattern promises application-style arrow-key behavior that a website navigation does not provide, and it can confuse screen readers. **Recommendation:** use plain disclosure buttons (`aria-expanded` plus a list of links) and remove the `menu` roles. The `aria-expanded`, Escape-to-close and button semantics are already good.

#### A-04 · Focus handling in the mobile sidebar

**Severity:** Medium · **Status:** Confirmed

When the sidebar opens, focus stays on the menu button, the page behind is not made inert, and focus is not kept inside the panel. Keyboard and screen-reader users can wander into the dimmed page. **Recommendation:** move focus to the first link on open, keep Tab inside the panel (or set the rest of the page `inert`), and return focus to the button on close (Escape already does).

#### A-05 · Contrast

**Severity:** Low to Medium · **Status:** Confirmed by calculation for the values below

Most text passes AA (for example `#9aa1ac` on the dark footer, 7.8:1; footer placeholders, 4.5:1). One confirmed failure: the secondary text colour `#7683a0` on white is **3.8:1** (AA needs 4.5:1 for normal text). It is defined as `--ink-faint` on the resources page. Text over photos and video (card titles, hero text) depends on the image and should be checked against several frames. **Recommendation:** darken `--ink-faint`, and check text over images and video frames.

#### A-06 · Motion

**Severity:** Low · **Status:** Confirmed

Reduced-motion CSS exists in 10 stylesheets, and the hero video has a pause button (meets the pause-or-stop expectation for moving content). JavaScript-driven motion, namely the video crossfade, the loader's timed progress and the search box's typing placeholder, does not check `prefers-reduced-motion`. **Recommendation:** when reduced motion is requested, show the poster frame instead of auto-playing video, skip the loader delay, and turn off the typing animation.

#### A-07 · Images and video

**Status:** Mostly fine

The cards are text over CSS background images, so no `alt` text is needed. The one `<img>` (TSA logo) has alt text. The hero video is decorative and has an audio track behind a sound toggle (see L-04). The loader does not announce progress to assistive technology (Low).

#### A-08 · Other checks

- Page `lang` is set. Zoom is not blocked.
- Touch targets are at least 44px on touch devices; desktop links are about 30px high, which meets the WCAG 2.2 minimum of 24px.
- `outline: none` is used on some inputs (footer, nav search, resources). Each should be re-checked for a visible focus replacement. **Potential.**

### 3.4 Performance (beyond C-03)

#### P-01 · Eager loading of everything

**Severity:** High · **Status:** Confirmed

All card images are CSS backgrounds, so the browser fetches them immediately, including the ones far below the fold. There are 10 stylesheets on the homepage and four separate Google Fonts requests (Bebas Neue, Bree Serif, Archivo Black, plus Fraunces/Manrope on the resources page). **Recommendation:** use `<img loading="lazy" decoding="async">` (or lazy background loading) for below-the-fold cards, combine the font requests into one, preload only the fonts and image that are above the fold, and consider self-hosting the fonts (also see L-03).

#### P-02 · Hero videos

**Severity:** High · **Status:** Confirmed (measured with `ffprobe`)

| File | Size | Details |
|---|---|---|
| `clt.mp4` | 21.7 MB | 1080p, H.264, 13.1 Mbps, 13 s, with an audio track |
| `clt2.mp4` | 21.5 MB | 1080p, H.264, 12.9 Mbps, 13 s, with an audio track |
| `clt3.mp4` | 30.0 MB | 1080p, H.264, 23.8 Mbps, 10 s, with an audio track |

Both `<video>` tags use `preload="auto"`, so the browser starts buffering them on page load. For a decorative background loop the bitrate is very high. **Recommendation:** re-encode to about 2 to 4 Mbps (roughly 3 to 6 MB each), add a WebM or H.265 source, use `preload="metadata"` for the second video, serve a smaller file to small screens, and skip autoplay when the visitor has `Save-Data` or reduced-motion enabled.

#### P-03 · Caching

**Severity:** Medium · **Status:** Confirmed

Every file, including 20 MB videos and PNG images, is served with `Cache-Control: public, max-age=0, must-revalidate`. Repeat visitors re-check every file. **Recommendation:** add long-lived `immutable` caching for images, video, fonts and versioned CSS/JS through `vercel.json` headers (rename files or add a version when they change), and keep HTML on short caching.

#### P-04 · Unused files and repository size

**Severity:** Low · **Status:** Confirmed

17 media files (18.8 MB) in `assets/img/` are not referenced by any page (the largest: `footer.png` at 10.6 MB), including `loader.jpg` left from earlier work. They are still deployed and downloadable. The Git history is about 130 MB. **Recommendation:** delete unused files, and keep large video outside Git history (Vercel Blob, a CDN, or Git LFS) if the repository keeps growing.

#### P-05 · Other

- A fixed minimum display time on the loader (1.4 s on the first visit) delays access on every first visit regardless of how fast the site loads. Measure whether the loader helps or hurts.
- Heavy `backdrop-filter` blur on cards and the header can drop frames on low-end phones. **Potential**, needs device testing.
- Add Lighthouse CI (or Vercel Speed Insights) so regressions are caught (see D-02).

### 3.5 Functionality

#### F-01 · Dead links and missing pages

See **C-01**.

#### F-02 · Contact form

See **C-02**.

#### F-03 · Theme toggle does nothing

**Severity:** Low · **Status:** Confirmed

Theme switching is turned off in `assets/js/theme.js` (`THEME_ENABLED = false`), yet a theme button is visible in the desktop header and a "Dark mode" card appears in the mobile sidebar. They respond to taps but change nothing. The light theme stylesheet only covers some sections. **Recommendation:** hide both controls until the light theme is finished, or finish and enable it.

#### F-04 · References page has broken dependencies

**Severity:** Medium · **Status:** Confirmed

`pages/references.html` links two stylesheets that do not exist (`components/newsletter.css`, `components/tsa-logo.css`) and embeds a PDF that does not exist (`assets/docs/copyright-checklist.pdf`), so the page shows the server's raw "Error response 404" inside its PDF frame. It also describes a newsletter system (MailerLite) that is not part of the live site.

#### F-05 · Error and loading states

**Severity:** Medium · **Status:** Confirmed

- The resources page shows a developer message on failure ("Make sure the page is served over a local server") that a visitor cannot act on, and has no loading state while the data loads.
- The 404 page is Vercel's plain text default (see C-01).
- Dead scripts remain: `newsletter.js`, footer topic-link handling for links that no longer exist, a `#year` footer hook with no element, `hero-lyrics.js` (disabled).

#### F-06 · The footer still links to "News"

**Severity:** Low · **Status:** Confirmed

"News" was removed from the header menu, but the footer's "Work & More" list still has it (and the page does not exist). Decide whether it should go too.

### 3.6 Legal and privacy readiness (things to check, not legal advice)

#### L-01 · No privacy notice, terms or contact details

**Severity:** High · **Status:** Confirmed that none exist

There is no privacy policy, terms of use, accessibility statement, or published contact address. A privacy notice is commonly expected whenever a site uses analytics or collects personal information, and Google's analytics terms ask site owners to disclose its use. Whether a notice is legally required for this site depends on its audience and purpose, so confirm that with the competition rules and, if the site will operate publicly, with a qualified adviser. **Recommendation:** publish a short plain-language privacy page (what analytics are used, what the contact form collects, who to contact), and link it from the footer. Add terms only if you have a reason to.

#### L-02 · Google Analytics runs for everyone, on some pages only

**Severity:** Medium · **Status:** Confirmed

Google Analytics 4 (`G-CY5GRPGCYS`) loads on the homepage and references page but **not** on the resources page, so the data is incomplete. It runs with no consent step. Whether consent is required depends on where visitors are (for example, rules in the EU and UK differ from most US states). Because the contact form currently puts typed text into the page URL (C-02), analytics may also record that text. **Recommendation:** decide whether analytics are needed. If yes, either keep Google Analytics with a privacy notice and, if you expect visitors from regions that require it, a consent mechanism, or switch to a cookieless option (Vercel Web Analytics, Plausible, and similar). If analytics are not needed, remove them. **Do not add a cookie banner unless a consent requirement is confirmed.**

#### L-03 · Other third parties

**Status:** Confirmed

- **Google Fonts** (4 requests) sends visitors' IP addresses to Google. Self-hosting the fonts removes this and also improves performance.
- **Vercel** (hosting) logs requests.
- **MailerLite** is described on the references page but not used.
- **flagcdn.com** is referenced only by unused code.

#### L-04 · Copyright and licensing of images, video and audio

**Severity:** Medium to High · **Status:** Potential (provenance unknown, needs documentation)

- The homepage uses about 24 local images and 3 videos with no record of where they came from or their license.
- The 5 largest PNGs have dimensions typical of AI image generators (for example 2752×1536 and 1536×2752). If they are AI-generated, check the generator's terms for commercial or public use and any disclosure expectation.
- `clt.mp4` and `clt2.mp4` carry Samsung Android metadata (likely shot by you), `clt3.mp4` was encoded with FFmpeg (source unknown). **All three contain audio.** A visitor can unmute them with the sound button, so confirm there is no copyrighted music or voices in the audio, or remove the audio track.
- Several cards use well-known local brands and venues (Carowinds, NASCAR, US National Whitewater Center, SouthPark). Using the name editorially is common, but check that logos or photos you did not create are permitted.
- `pages/references.html` lists **82 external image and article URLs**, many from unrelated sites (for example NYC and Florida tourism, a Tulsa library, an Australian community group). They do not match the images the site actually uses, which suggests the list was copied from another project or has not been updated.
- The repository has no license file and the site has no copyright line.
- The Places data pipeline (see D-03) stores Google Maps Platform content in the repository. Google's terms place limits on storing and displaying that data. Review the current terms before publishing it.

**Recommendation.** Create an asset ledger (file, source, license or permission, date, author). Replace anything unverifiable. Reconcile the references page with what is actually used, and update the footer with a copyright line.

### 3.7 Deployment and maintenance

#### D-01 · No tests, no CI

**Severity:** Medium · **Status:** Confirmed

There are no automated checks of any kind. A broken link or a broken page would deploy straight to production from a push to `main`. **Recommendation:** add a small GitHub Actions workflow that runs on pull requests: an HTML validator, a link checker (this would have caught C-01), an accessibility check (pa11y or axe) and Lighthouse CI with a performance budget. Vercel's preview deployments already exist for each branch.

#### D-02 · No monitoring

**Severity:** Medium · **Status:** Confirmed

No uptime monitoring, error reporting or performance monitoring. **Recommendation:** a free uptime check, Vercel Speed Insights or Web Analytics (a cookieless option), and Vercel's deployment notifications.

#### D-03 · The scheduled "Update Places Data" workflow fails every day

**Severity:** Medium · **Status:** Confirmed (from the workflow and script)

The workflow runs daily at 06:00 UTC but its API key lines are commented out, and `scripts/update-places.js` exits with an error when the key is missing, so each run fails. Even if it worked, the places data (142 entries across four files) is not used by any page, and every entry still has no phone number, no website and no last-updated date, so the pipeline has never produced data. **Recommendation:** disable the schedule until the places feature is built (keep `workflow_dispatch`), or finish it with a restricted API key stored as a repository secret.

#### D-04 · Environment variables and configuration

**Severity:** Low · **Status:** Confirmed

No environment variables are configured in Vercel (none are needed by the static site). Document any future variables in a `.env.example`. The `.gitignore` does not list `.env*`, `.vercel/` or `*.log`, which should be added as a precaution. A stray `composer.json` (`{}`) comes from a PHP project template and can be deleted.

#### D-05 · Domain

**Severity:** Medium · **Status:** Confirmed

Only `*.vercel.app` domains are attached. If a custom domain is planned, add it in Vercel, set a canonical redirect (www vs non-www), and update the canonical tags, sitemap and structured data to match (SEO-02).

#### D-06 · Safe deployment practice

Recommended: protect `main`, require a passing check, deploy changes through pull requests (each gets a protected preview URL), and use Vercel's "promote previous deployment" to roll back. Vercel already keeps earlier deployments and marks the recent ones as rollback candidates.

### 3.8 Content quality

#### CT-01 · Outdated or inconsistent text

**Severity:** Medium · **Status:** Confirmed

- "Charlotte Resource Hub" still appears in the homepage meta description, JSON-LD, the resources page eyebrow label and the references page title and text.
- The README says the site is for the **2026–2027 FBLA** Website Design competition, while the references page says it was created for the **2025–2026 TSA Webmaster** competition.
- Code identifiers still use `nyc-` prefixes (a leftover from a template). Not visible, but confusing for maintainers.
- The footer has no copyright line or contact details.

#### CT-02 · Missing and unverified content

**Severity:** High · **Status:** Confirmed that it is missing, Potential that it is out of date

- Missing: the category pages, a contact method, privacy notice, an about page, and any local business listings (the four restaurant, bar and barbershop data files are placeholders).
- The 32 organizations on the resources page (addresses, websites, descriptions, short quotes) show no "last verified" date. The quotes on the cards should be confirmed as accurate and used with permission. **Recommendation:** do a one-time verification pass of every listing (the address and website still work, the organization still operates) and add a "last verified" date for visitors.
- The homepage "Featured Events" section is commented out in the HTML, so it is invisible today.

---

## 4. Optional future features

These are **not** needed to launch. Do not add them unless the site actually needs them.

- A real content-management approach for the directory (for example a JSON file edited through pull requests) rather than a database. A database or login is **not** needed for the current site.
- Light theme, if the owner wants it (finish or remove the toggle, see F-03).
- A static-site generator (for example Eleventy or Astro) to produce shared navigation, footer, per-page metadata and the sitemap automatically. This would solve several issues at once (C-04, SEO-04, duplicated markup).
- Search with real results (client-side index of the directory and pages), once there are pages to search.
- Places data and maps for restaurants and venues, with a restricted API key, a documented refresh process, and attention to Google's terms.
- Structured data for the directory (`Organization` / `ItemList`) and breadcrumbs, once the pages exist.
- Spanish or other language support if the audience calls for it.
- A newsletter, only if you plan to send one.
- Cookie consent tooling only if analytics stay and a requirement is confirmed.
- A Progressive Web App or offline mode.

---

## 5. Prioritized implementation roadmap

Effort: **S** under half a day, **M** one to two days, **L** several days.

### Phase 0: launch blockers (do first)

| # | Task | Fixes | Effort |
|---|---|---|---|
| 1 | Decide the page strategy. Hide links to missing pages now, or build the pages. Add a custom `404.html`. | C-01, F-01 | S to L |
| 2 | Remove or properly implement the contact form (POST, validation, labels, success and error messages, spam protection). | C-02, S-04, A-02 | S to M |
| 3 | Optimize images (WebP/AVIF at display size, lazy-load below the fold) and the loader image. | C-03, P-01 | M |
| 4 | Re-encode the hero videos and set `preload="metadata"` on the second. Skip autoplay on reduced-motion or data saver. | P-02, A-06 | S to M |
| 5 | Add `<noscript>` and loader failsafe so the site is never trapped behind the loading screen. | C-04 | S |

### Phase 1: launch week

| # | Task | Fixes | Effort |
|---|---|---|---|
| 6 | Add security headers in `vercel.json` (start the CSP in report-only mode). | S-01 | S |
| 7 | Add `.vercelignore` for `server/`, `scripts/`, `.github/`, `composer.json`, `docs/`. Delete `server/` if unused. | S-02, S-03 | S |
| 8 | SEO baseline: canonical URLs, Open Graph and Twitter tags, `robots.txt`, `sitemap.xml`, favicons, unique titles and descriptions, corrected JSON-LD, `h1`, `main`, skip link. | SEO-01 to SEO-05, A-01 | M |
| 9 | Publish a short privacy page, add a copyright line, and decide on analytics (keep with notice, switch, or remove). Add analytics to every page or none. | L-01, L-02 | S to M |
| 10 | Accessibility fixes: form labels, menu semantics (remove `role="menu"`), sidebar focus handling, contrast of `#7683a0`, reduced-motion JS. | A-02 to A-06 | M |
| 11 | GitHub: protect `main`, enable Dependabot, disable or fix the failing daily workflow, tighten workflow permissions, decide on a license. | S-05, D-03 | S |
| 12 | Asset and licensing ledger: confirm sources and permissions for images, videos and audio. Remove unverifiable items or the video audio tracks. | L-04 | M |
| 13 | Content pass: replace "Charlotte Resource Hub", verify the 32 directory listings and add "last verified", reconcile or retire the references page, fix competition names. | CT-01, CT-02, F-04 | M |
| 14 | Immutable caching headers for images, video, fonts and versioned CSS/JS. | P-03 | S |

### Phase 2: shortly after launch

| # | Task | Fixes | Effort |
|---|---|---|---|
| 15 | CI on pull requests: HTML validation, link check, accessibility check, Lighthouse CI budget. | D-01 | M |
| 16 | Monitoring: uptime check, Speed Insights or cookieless analytics. | D-02 | S |
| 17 | Self-host fonts and merge the font requests. | P-01, L-03 | S |
| 18 | Custom domain, www and non-www redirect, update all canonical URLs. | D-05, SEO-02 | S |
| 19 | Replace placeholder error and loading states (resources page), remove dead scripts, hide or finish the theme toggle. | F-03, F-05 | S |
| 20 | Delete unused assets (about 19 MB), tidy `.gitignore`, delete `composer.json`, expand the README (how to run and deploy). | P-04, D-04 | S |
| 21 | Real device testing: low-end Android and iPhone Safari, screen reader pass (VoiceOver and NVDA), and CSP enforcement after report-only data. | A-series, S-01 | M |

### Suggested order of work

1. Phase 0, items 1 to 5. Until these are done the site should be described as a preview.
2. Phase 1 in the listed order. Items 6, 7 and 11 are quick and risk free.
3. Phase 2 as time allows. Items 15 and 16 protect the work already done.

---

## 6. Findings that need further investigation

These were noticed but could not be settled from the code alone:

- Whether the 5 large PNGs are AI-generated and what the generator's terms allow (L-04).
- Whether the video audio tracks contain third-party music or voices (L-04).
- Whether any Google Cloud API key exists, and whether it is restricted (S-06).
- Whether Google Analytics should remain, and whether the expected audience triggers consent rules (L-02).
- Whether the competition (FBLA) imposes specific requirements on copyright documentation, accessibility or citations. Check the current official guidelines.
- Real-device behavior of the blur effects and video on low-end phones (P-05).
- Whether the focus outlines removed on some inputs have a visible replacement (A-08).
- Screen reader behavior of the navigation and sidebar (not tested).

## 7. Out of scope and limits of this audit

- No penetration testing, load testing, or checks of Vercel account security (two-factor authentication on GitHub and Vercel should still be confirmed by the owner).
- No testing with screen readers or on physical devices.
- The correctness of the 32 directory listings and other real-world facts was not verified.
- Legal and privacy items are prompts for review, not conclusions.
- The browser measurements came from an emulated 375px viewport without network throttling, so real mobile times will be worse than shown. They are good for comparing before and after.

## 8. Notes on this report

- It lives in `docs/` and is listed in a new `.vercelignore` so it is **not** published on the website. It is still visible in the public GitHub repository. Remove it from the repository, or make the repository private, if you do not want the findings public before the fixes are in.
- Nothing else in the repository was changed.

## Appendix A: Evidence summary

| Check | Result |
|---|---|
| Secret patterns (Google, GitHub, private keys) in current tree | None found |
| Same patterns across all commits of this repository | None found |
| Same patterns across all commits of the earlier local repository (35 commits) | None found |
| Tracked sensitive files (`.env`, keys, `.idea`, `node_modules`) | None |
| `npm audit` (server) | 7 issues: 1 critical, 5 high, 1 moderate (all transitive) |
| Unique internal link targets | 45: 2 working, 5 empty files, 38 missing |
| Live headers | Only `Strict-Transport-Security`; no CSP, nosniff, frame, referrer, permissions headers |
| Live `/robots.txt`, `/sitemap.xml`, `/favicon.ico` | All 404 |
| Live `/server/index.js`, `/scripts/update-places.js`, `/.github/workflows/update-places.yml`, `/composer.json` | All 200 (public) |
| Live `/api/resources` | 404 (server not deployed) |
| Cache headers on static files | `public, max-age=0, must-revalidate` everywhere |
| Homepage first load (375px emulation, no throttling) | about 46 MB, 52 requests, FCP/LCP 4.27 s, CLS 0.016, TTFB 68 ms |
| Largest LCP resource | `assets/img/loader.png` (9.5 MB) |
| Media in repository | 41 files, 135.5 MB; 24 referenced (116.7 MB), 17 unreferenced (18.8 MB) |
| Hero videos | 3 × 1080p H.264, 12.9 to 23.8 Mbps, 10 to 13 s, all with AAC audio |
| Google Analytics | Present on 2 of 3 pages (not on `resources.html`) |
| Contrast spot checks | `#7683a0` on white 3.8:1 (fails AA); other tested pairs 4.5:1 to 10.8:1 |
| GitHub | Public, no license, `main` unprotected, secret scanning and push protection on, Dependabot off |
| Vercel | Production auto-deploy from `main`, `*.vercel.app` domains only, no environment variables |
