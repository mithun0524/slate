# slate.tools

Next 16 (App Router, TypeScript) · GSAP ScrollTrigger · Lenis. No CSS
framework: the design system is `app/globals.css`, and its tokens are lifted
from the app itself (`src/styles.css`, Dark Modern) so the site and the
product read as one thing.

```
npm run dev     # http://localhost:3000
npm run build   # 17 static routes
```

## Shape

```
app/
  layout.tsx        Geist fonts, backdrop, header, footer
  page.tsx          home — hero video, problem, mechanism, views, spec, FAQ
  download/ docs/ changelog/ privacy/ terms/ accessibility/
  not-found.tsx  sitemap.ts  robots.ts  icon.svg
  globals.css       tokens → chrome → home → inner pages
components/
  Chrome.tsx        Lenis smooth scroll + a short fade between routes
  Header/Footer     sticky nav, mobile sheet, footer columns
  HeroVideo.tsx     the Remotion demo, with pause/restart and a still fallback
  ViewTabs.tsx      the six views as a keyboard-navigable tab switcher
  Reveal.tsx        one small scroll reveal, used everywhere
  Doc/DocsNav/Code  docs frame, sidebar, tiny syntax colouring
  CopyLine/Faq/DownloadCard
public/demo/        slate-demo.mp4 · .webm · poster.jpg  (built by ../video)
```

## Rules

- Colour comes from the app. `--fg` white is the only "accent" for buttons;
  green/red appear solely where the product shows a diff.
- Motion supports content: a 0.6s reveal, a 0.4s route fade, nothing else.
  Everything checks `reduced()` in `lib/gsap.ts`.
- Type tops out at ~58px. No poster type, no marquees.

## Before launch

- Replace `/releases/*` and the checksum table in `app/download/page.tsx`.
- Point `metadataBase`, `sitemap.ts` and `public/.well-known/security.txt` at
  the real domain.
