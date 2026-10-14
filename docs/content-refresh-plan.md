# Content refresh plan — October 2026

> **Status (2026-10-14):** implemented in `docs/release-2026-10.md`, except the
> items under "Not in this release" there (resume PDF, two new projects,
> unreleased records, benefit concert, After Dark photos, Anvil).

Align brodymontag.com with the September 2026 resume, the September 2026 LinkedIn
rewrite, and the music developments since the last content pass (Jan 2026 Beatprint
onward). Content-only: no stage/engine work. `lib/content.json` stays the single source;
the only code changes are small type/card additions listed in §6.

Sources compared: `~/Desktop/resume/Brody Montag Resume 2026-09.md`,
`~/Desktop/resume/LinkedIn updates 2026-09.md`, the Glow EPK
(`~/Downloads/glow-epk_1.html`, 2026-09-22), vault `System/Assistant/context.md`
(gig table updated 2026-09-22), and `lib/content.json` on `feat/3d-stage` @ `436d452`.

Public-safety ceiling: anything already on the public resume or LinkedIn is fair to
publish. Nothing beyond that about Fiserv (no repo names, internal product names,
teammates, or numbers not already on LinkedIn).

---

## 1. What is stale (the diff)

| Site today | Truth now | Where |
|---|---|---|
| Fiserv "ml/ai team" (about.meta, experience, LinkedIn card, machine view) | Global Business Solutions; Technical Analyst II (full-stack developer) | resume, LinkedIn |
| Fiserv blurb: "model integration, observability, workflow automation" | Enterprise payments developer portal: collaborative docs CMS (Tiptap/Yjs CRDTs, Fastify, Postgres), governed multi-agent delivery platform, security-finding triage tooling, fail-closed OPA authorization, self-hosted translation | LinkedIn About + Experience |
| Experience has 3 entries (fiserv, umd, sigma) | Missing PIRL undergraduate researcher (Jul 2024 – May 2025) and Galago/BloomOptix senior digitalization intern (Jun 2023 – May 2025) | resume |
| Stack: generic 5 groups (python-first) | Resume skills: TS-strict/React/Next App Router/tRPC/TanStack/Tiptap, Node-Fastify/Java 21-Spring/Python, Postgres/Flyway/Mongo/Dynamo, Azure/AWS/Docker/K8s/GitLab CI, OPA/CRDTs/OT, multi-agent/RAG/NMT/PyTorch/TF/librosa/Essentia | resume |
| Elevator pitch: "specializing in ML and agentic systems… credits up to the #1-ranked club" | Add: governed multi-agent AI + real-time collaboration for a payments company; headline debut (Brooklyn, Aug 2026); open + close at Echostage (Sept 2026) | LinkedIn headline, EPK |
| Shows: 11 entries, nothing between Sept 2025 and Aug 2026; Aug + Sept 2026 still "upcoming" | Both happened. Missing: Beatprint residency debut (Feb 2026), Flash Rooftop w/ Veggi matinée (May 2026), Azure DC support No Static (Jun 2026), Laissez Faire NYC closing (Jul 2026), **Soloween @ Strand DC (Oct 24)**, **Rivo takeover @ Superior Ingredients, Brooklyn (Oct 30)**, Public Art Space NYC closing for Noizu (Dec 2026) | EPK, vault gig table |
| After Dark entry: venue "After Dark" | Venue is **Harriet's Lounge**, Brooklyn (Above Ten's After Dark series) | Brody, 2026-10-14 |
| Supported-artists strip | Add No Static (EPK). Rivo logo is for the **Oct 30, 2026 Superior Ingredients** show (below), which the site lacks | EPK, dice.fm |
| Releases: one single (Oct 2025) | Five records finished (EPK): Sincere, I Can Make It (disco-house), Control, Insane (w/ Peter Jacob), Jump on It (Apache remix) — unreleased, "listen" links are private | EPK |
| Collective: Glow "dj / ambassador · since feb 2024" | Ambassador role ended Jan 2025; Glow still presents the big rooms (Sept 2026). Beatprint role is also artist hospitality + booking | vault |
| Presence stats (SC 34/134/3,292; IG 2,442) | June 2026 baseline; a year behind by the time 3D ships | vault |
| No resume on the site | LinkedIn contact lists brodymontag.com as "Portfolio" | LinkedIn |
| `now` software line: "building anvil" | Anvil has been "Phase 0 next" since June; the honest current build is this site's 3D stage | vault |

---

## 2. Software page (`/software`)

**Experience (content.json `code.experience`)** — reorder newest first, add `href` + `highlights`:

1. `fiserv` — role `technical analyst ii · full-stack developer`, orgDetail `global business solutions`, period `June 2025 — present`. Description (public-safe, from LinkedIn About): "Full-stack developer in Fiserv's Global Business Solutions group, building the enterprise payments developer portal and the AI tooling behind it." Highlights (max 4): collaborative docs CMS (Tiptap, Yjs CRDTs, Fastify, Postgres) proposed and built; governed multi-agent delivery platform with independent AI review and a human on every merge; safety-gated vulnerability-remediation tooling, 100% recall vs manual review; authorization moved to fail-closed policy-as-code (OPA). Tags: `typescript · react/next.js · java · node · postgres · multi-agent ai`.
2. `pirl` (new) — `undergraduate researcher`, org `perceptual interfaces & reality lab (pirl)`, orgDetail `umiacs · university of maryland`, period `July 2024 — May 2025`, href to the lab. Description: differentiable auditory model optimized for open-source release; DL pipelines for phoneme recognition and source separation; multi-modal CRNN for hearing-loss diagnosis (links to the senior paper). Tags `pytorch · audio ml · signal processing · research`. This is the entry that ties the Peak_Finding_Toolbox project to a lab.
3. `galago` (new) — `senior digitalization intern`, org `galago / bloomoptix`, orgDetail `ramboll`, period `June 2023 — May 2025`. Description: team-wide AI adoption initiative; R-CNN algae-bloom detector retrained to 94%; PowerBI financial dashboard + automated ingestion (Azure Functions, Power Automate, HubSpot). Tags `python · computer vision · azure · data`.
4. `umd` — role `bs computer science · machine learning`, unchanged otherwise; add href.
5. `sigma` — keep, last. (Opinion: keep; it's in about.meta and costs nothing. Drop if the list feels long.)

**Stack (content.json `code.stack`)** — rebuild to mirror the resume, six groups so the grid stays balanced:
`languages` (typescript, python, java, sql, c++, rust, ocaml, ruby) · `frontend` (react, next.js app router, trpc, tanstack query, tiptap / prosemirror, tailwind, vite, vitest, playwright) · `backend & data` (node / fastify, java 21 / spring boot, flask / pydantic, rest · websocket · sse, postgresql, flyway, mongodb, dynamodb, opa / rbac, crdts (yjs), ot) · `cloud & devops` (aws s3 · ecs, azure blob, docker, kubernetes, gitlab ci, testcontainers, vercel) · `ai / ml` (multi-agent orchestration, claude api, rag / embeddings, llm observability, nmt (m2m-100), pytorch, tensorflow, yolov8 / opencv) · `audio / dsp` (librosa, essentia, mne, sofa / hrtf, fl studio).

**Projects (`code.projects`)** — opinions:
- Add `pbandjsounds` (live): the collective's site he builds — Next.js, Supabase, Resend, Vercel Blob; events, submissions, team applications with demo upload, release countdown. It's the clearest proof of the "technology in service of music" thesis and it's public.
- Add `brodymontag-site` (live): the ASCII engine itself — baked wave field, seamless loop, GPU GLSL ASCII pass, GSAP-driven journey. It's the most technically interesting thing on the domain and currently invisible as a project.
- Anvil: ask whether it's still active. If not, set status `live` → `wip` stays but the `now` line shouldn't point at it (see §5).
- Keep superset, roblox_bot, Peak_Finding_Toolbox, Subagent Dashboard as-is; refresh the superset description to say "the pipeline he uses to prepare his own sets" (EPK wording, stronger).

---

## 3. Music page (`/music`)

**Shows (`music.shows.events`)** — add, all with `context` written in the same voice as the existing entries:

| id | date | venue · city | format | headliner / promoter |
|---|---|---|---|---|
| `event_pas_noizu` | December 2026 | Public Art Space · NYC | closing | Noizu · Mirari |
| `event_rivo_si` | October 30, 2026 | Superior Ingredients (The Roof + Room) · Brooklyn | supporting | Rivo "Day & Night Full Halloween Venue Takeover" · presented by Project 91 · [dice](https://link.dice.fm/macf3adf1f15) |
| `event_soloween` | October 24, 2026 | Strand · DC | residency · Beatprint Presents: Soloween (7th annual, "Haunted Hollywood") | lineup Monty, Toon, Fatima + special guest · 10pm–3am · [shotgun](https://shotgun.live/events/beatprint-presents-soloween) |
| `event_laissez_faire` | July 2026 | Laissez Faire · NYC | closing | Vesper |
| `event_azure` | June 2026 | Azure · DC | support | No Static |
| `event_flash_veggi_2026` | May 2026 | Flash Rooftop · DC | direct support · matinée | Veggi · Beatprint/Matinee |
| `event_beatprint_debut` | February 2026 | Transmission · DC | residency debut | Beatprint |

Fix `event_afterdark`: venue `Harriet's Lounge`, title `After Dark · Harriet's Lounge (Brooklyn)`; context already reads fine in past tense. Fix `event_echostage_ianasher`: already past-tense safe.

Candidates I'd leave out unless you want a fuller 2026: Zebbie's "Locals Collective" (Jan), ArtSpace Mirari (Mar, May 15), Transmission Dan Molinari (May). The EPK omitted them, which I read as your own editorial call. Superior Ingredients is resolved: it is the Oct 30 Rivo takeover above (the resume's "performed at" is forward-looking).

**Media (done 2026-10-14)**: per Brody, stills come from John Narvell's edit, not the Fuji frames (those were pulled and discarded). Three sharpest-of-burst frames are untracked in `public/BrodyEvents/` at 1280×720: `ianasher_mic.webp` (22 s, on the mic, hat, crowd behind), `ianasher_crowd.webp` (28 s, arm raised over the blue-lit floor), `ianasher_red.webp` (36 s, red LED wall, arms up, wide). The `graded/` Drive subfolder is 35 graded `.mov` clips past Drive's direct-download limit; skipped. After Dark still has no photos.

**Promo video (new, Brody 2026-10-14)**: John Narvell's 38 s Echostage edit (`~/Desktop/echo stage edit.mov`, 1280×720 h264 23.976). Encoded to `public/BrodyEvents/ianasher_promo.mp4` (7.8 MB, CRF 26, faststart) with `ianasher_promo_poster.webp` (laser frame at 14 s). Proposal — a pinned "the room" section on `/music` between gigs and releases:
- Video autoplays muted + looped, `playsInline`, play/pause on an IntersectionObserver so it never runs off-screen; poster for reduced-motion and for the 2D tier.
- **ASCII treatment**: feed the `<video>` into the existing ASCII pass (`lib/ascii-engine/gl/ascii-renderer.ts` already has the glyph atlas and an `asciiAmount` true-color escape; the stage canvas can sample a video texture per cell for luminance). Scroll-scrub `asciiAmount` 1 → 0 over the pin so the clip enters as glyphs in the site's pearl scale and resolves into the real footage mid-section, then dissolves back out. Reads as the site's own language, not an embedded reel. Frames with lasers, silhouettes and the crowd-on-the-rail read well as glyphs; the two dark blurry shots will mush, which the scrub hides by being near-true-color at those points if the timing is tuned.
- Flag it (`flags.ts`: `promo`) like the other 3D work, 2D fallback = plain poster + video. Caption line: "echostage · sept 19, 2026 · open + close for ian asher · film: john narvell".
- Opinion: do it as a 1-day spike after the content refresh lands, on its own branch. The content refresh should not wait on it. Budget: 7.8 MB is acceptable for one clip in `public/` (the June pass only cut the 124 MB of unused raw clips); if the ASCII pass needs a smaller texture, a 640×360 variant (~2 MB) is enough since the glyph grid is 8×22 px cells. Also: several `media` entries still reference `.mp4` files that moved to `media-archive/`; the show page filters to images so nothing breaks, but those refs should be pruned in the same pass.

**Supported artists strip**: add `no static` (needs a logo). `rivo` stays — it now has a show. Consider `toon` only if the Soloween night merits it; I'd leave it.

**Releases (`music.releases.items`)**: keep "when a fire starts to burn". Add a short "in the studio" block (new optional key `music.releases.upcoming`): "five records finished, 128–131, all minor — sincere · i can make it · control · insane (w/ peter jacob) · jump on it (apache remix)". No links unless a track is public on SoundCloud. Opinion: also add 2–3 entries of `type: "mix"` (the Release type already allows it) — the "Zebs MK2" mix and a Beatprint residency set — so the section isn't one card above an embed.

**Collective card**: Glow affiliation → `dj · glow rooms (soundcheck, echostage) · 2024 → now` (drop "ambassador"). Beatprint → `resident · artist hospitality + booking · transmission dc`. Add the benefit concert for children's music education as an events line **only with a name/date/venue** (it's on both resumes, so it's real, but there's nothing on disk about it).

**Now line**: should read "next: strand (dc) · october 24, 2026". It will not today: `isFuture()` compares at month granularity, so any show in the current month counts as past on the 1st. Fix in §6 (day-level dates).

---

## 4. About page (`/about`) and landing

- `about.meta.role` → `technical analyst ii · full-stack developer · fiserv`. `based` → `new jersey → dc / nyc` (IG bio and EPK both say DC/NYC evenly).
- Paragraph 2: append the 2026 arc in one sentence — residency at Transmission, a first headline night in Brooklyn, open + close at Echostage.
- Paragraph 3: replace "full-stack developer on the ML/AI team at Fiserv" with the developer-portal sentence from LinkedIn.
- Paragraph 5: fold in the work half of the agentic thesis — "at work that means a governed multi-agent delivery pipeline where independent AI review runs before a human sees the code; at home it means local models and small fleets."
- `about.socials`: add `resume ↗` → `/resume.pdf`. Also add to `contact.items`? No — keep contact to email.
- Hero `elevatorPitch`: "a full-stack engineer building governed agentic systems and real-time collaboration for a payments company — and, performing as monty (us), a house and tech-house producer and dj who's headlined in brooklyn and opened and closed the #1-ranked club in the country. i've always loved making things, and these are the two i keep coming back to." Subtitle stays (38 chars drives the reveal timing).
- Contact: add an `availability` line from the EPK — "dc and nyc · open, support or close" — under booking.
- Presence cards: LinkedIn `company` → `fiserv · global business solutions`, `role` → the LinkedIn headline's first clause. Spotify `single` label → `latest`. SoundCloud/IG numbers refreshed (I can pull them, or you paste them).

**Resume on the site**: publish `public/resume.pdf` generated from `build_resume.py` with the phone number removed (the Desktop PDF has it). Link from about.socials, the footer, and the machine view `## contact`.

---

## 5. Timeline, now-lines, machine view

- Timeline (`groupByYear(2021)`) picks everything up: 2023 gains Galago, 2024 gains PIRL, 2026 goes from 2 entries to 7. Period strings must use the em-dash form `June 2025 — present` / `July 2024 — May 2025`; `parsePeriod` already handles month-year starts.
- `now.ts` software line: currently "building anvil". Change the rule to prefer a `now` flag on a project over "first wip" so it can read "building the 3d stage" (or "building superset v2") without lying about Anvil.
- `machine.ts` / `llms.txt`: add experience `highlights` + `href`, the resume link, and the "in the studio" block. These regenerate from content.json so nothing else drifts.

---

## 6. Code changes (small, typed)

- `lib/stack-data.ts` `ExperienceEntry`: add `href?: string`, `highlights?: string[]`.
- `components/cards/experience-card.tsx`: render `highlights` as a compact mono list under the description (same pill style as tags, no new component), org name becomes a link when `href` exists.
- `lib/releases-data.ts`: `Release.type` already includes `"mix"`; add `music.releases.upcoming?: { note: string; tracks: string[] }` and a 6-line block in the release section.
- `lib/now.ts`: `projects.find(p => p.now) ?? projects.find(p => p.status === "wip")`.
- `lib/timeline.ts`: `parseDate` accepts `"October 24, 2026"` (day optional, kept in `ParsedDate.day`); `isFuture` compares to today's date when a day is present, else month-level as now. `sortKey` stays year*100+month so grouping is unchanged. Both October shows depend on this; the existing month-only strings keep working.
- `lib/content.json` `_README`: document the new keys.
- `public/resume.pdf`; the three `ianasher_*.webp` stills and `ianasher_promo.mp4` + poster are already in `public/BrodyEvents/` (untracked) and get wired into `event_echostage_ianasher.media` and the promo section.

No stage, director, or engine files are touched.

---

## 7. Branch and sequencing

1. Branch `content/2026-10-refresh` off `feat/3d-stage` (`436d452`). Commits grouped: `content(software)`, `content(music)`, `content(about)`, `feat(experience): highlights + org links`, `chore(media)`.
2. PR into `feat/3d-stage`. The 3D stage's visual go/no-go is independent and stays gated on your eyes.
3. **Backport to `main` the same week.** LinkedIn now points recruiters at brodymontag.com as the portfolio, and the live site still says "ml/ai team" and shows nothing after September 2025. `content.json` has diverged (main lacks `journey` and project `date` fields), so this is a scripted re-apply of the JSON edits plus the experience-card change, not a cherry-pick. Half a day at most.
4. Vault: update `Coding/Projects/Brody Montag Site.md` status and the context gig table with the EPK's four 2026 shows (Azure, Laissez Faire, Flash matinée, PAS Noizu) — they are not in the vault yet.

---

## 8. Verification

- `npx tsc --noEmit` and `next build` green; every new date string parses (a throwaway script that imports `getAllEntries()` and prints the 2026 group).
- `/machine` and `/llms.txt` diffed before/after: new experience, shows, resume link present; no Fiserv internals beyond the LinkedIn text.
- `nowLines()` prints `next: public art space (nyc) · december 2026` and the new software line.
- Playwright smoke (desktop 1440×900, mobile 390×844, reduced-motion) on `/software`, `/music`, `/about`, two new show pages, `/resume.pdf` 200.
- Grep `content.json` for `.mp4` → zero.

---

## 9. Needs you (blocking only the rows they touch)

Resolved 2026-10-14: Superior Ingredients = Rivo takeover Oct 30 (slot TBC); After Dark venue = Harriet's Lounge; Soloween Oct 24 added; `rivo` logo explained; Echostage media located on Drive.

Resolved 2026-10-14 (later): stills downloaded and converted; Rivo slot = "supporting" until confirmed; promo edit received and encoded.

3. Photos from Aug 1 (Harriet's Lounge).
4. Which of the five finished records, if any, are public to link; and whether to list mixes.
5. Benefit concert: name, date, venue — or leave it on the resume only.
6. Anvil: still active, or let the now-line move to the 3D stage?
7. OK to publish the resume PDF (phone removed)?
8. Add pbandjsounds.com and this site as projects?
