# Release: October 2026

The 3D journey site (`feat/3d-stage`) replacing the live tabbed site
(`origin/main`, tag `original-live`). Nothing is pushed or deployed yet.

## What ships

**The site**
- Landing split into software, music and about pages, with the persistent
  laser stage (3D on capable devices, 2D worker fallback elsewhere).
- Music: John Narvell's Echostage film (last 7.6 s of the edit), edge to edge
  under the opener, looping muted, dimming the lasers while on screen.
- About: the two signals fuse and explode, and the debris assembles the
  timeline's road. Lamp posts stream past; the car holds until "start over",
  then drives off.

**Content (from the September resume and LinkedIn)**
- Fiserv: Technical Analyst II, Global Business Solutions, with four
  highlights taken from public LinkedIn text only.
- New experience: PIRL undergraduate researcher, Galago / BloomOptix intern.
- Stack rebuilt to mirror the resume.
- Location: "east coast" everywhere (detail grid, about opener, metadata, the
  Instagram card).
- Shows added: Soloween at Strand (Oct 24), Rivo at Superior Ingredients
  (Oct 30, "supporting"), Public Art Space closing for Noizu (Dec), Laissez
  Faire (Jul), Azure with No Static (Jun), Flash with Veggi (May), Beatprint
  residency debut (Feb). After Dark venue is Harriet's Lounge.
- Ian Asher show page: three frames from the edit.

**Production fixes**
- Next.js 16.3.3 → 16.3.8: patches 7 advisories, one critical (remote code
  execution in `next/og`). Production dependencies: 0 vulnerabilities.
- Section pages re-render hourly, so a show moves from "next up" to played
  without a redeploy. "Today" is Eastern time.
- Frame rate: shimmer on one 20 Hz clock, the 2D tier uncapped, no per-frame
  style write on `<html>`, navigation immediate, page setup moved out of the
  view transition (`docs/performance.md`).
- 12 dead video references removed from show data.

## Verified

| Check | Result |
|---|---|
| Typecheck, production build | pass |
| e2e suite (`npm run e2e`) | 28 / 28 |
| Pages crawled (prod build) | 30, no console errors, no broken internal links or images |
| Phone width (390 px) | no horizontal scroll on any section page |
| External links | 32, all resolve (LinkedIn and Shotgun block scripts) |
| Scroll, CPU slowed 6× | 120 fps |

## Your QA checklist

Run it on the production build at `http://localhost:3100`. Dev mode is slower
and isn't representative.

1. Landing: name types out, three choices, hover wakes each figure.
2. Each nav click: the page changes right away, with no freeze.
3. Software: Fiserv, PIRL and Galago read correctly. The org names link out.
4. Music: the film loops under the opener. "next up" lists Strand, Superior
   Ingredients, Public Art Space in that order. The live line reads
   "next: strand (dc) · october 24, 2026".
5. Music gigs: Harriet's Lounge, the 2026 run, then the older shows.
6. About: "about me" fully visible. The opener line reads "east coast based".
   Scroll through the fusion, debris, road, and "start over".
7. Show pages: Ian Asher has three frames. Soloween and Rivo have ticket links.
8. Phone: a quick pass on a real phone.
9. Wording you want changed anywhere: the copy is all in `lib/content.json`.

## Not in this release (your call)

- Resume PDF on the site (needs your OK, with the phone number removed).
- PB&J Sounds and this site as projects.
- The five finished, unreleased records.
- The benefit concert (no name, date or venue on file).
- After Dark photos.
- Anvil is still shown as in progress, and the software "now" line still
  reads "building anvil".

## Deploy (on your go)

Vercel deploys `main` to production. `main` is an ancestor of
`feat/3d-stage`, so this is a fast-forward:

```bash
git push origin feat/3d-stage
```

That gives a Vercel preview URL for a last check on real infrastructure.
Then fast-forward `main` on GitHub straight from this branch (no local
checkout of `main` needed; the push is refused if it isn't a fast-forward):

```bash
git push origin feat/3d-stage:main
```

**Rollback:** Vercel's instant rollback to the previous production
deployment, or reset `main` to tag `original-live` and push.

No environment variables are needed: every feature flag's default lives in
`lib/flags.ts`.
