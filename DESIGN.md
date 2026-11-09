# Playground Meet design system

References inspected on 2026-11-09: [Playground](https://tryplayground.net/) and [Browserbase](https://www.browserbase.com/), including rendered desktop screenshots, source styles and branding extraction. The extractor misidentified Playground’s logo as a CTA arrow and its primary font as Mono; source CSS and the rendered page corrected both.

## Observed Playground assets and tokens

- Deep teal #123B3F, warm cream #FBF7EB, coral #FF7548, supporting blue #0864B6.
- Main typeface: Manrope variable font (source CSS `manrope-s.p.3259ncl47-hqj.woff2`, weight 400–800).
- Official wordmark consists of a pinwheel mark and `playground.` text. The actual mark uses `/brand/playground-mark.webp` as a luminance mask, 170% sizing and 54%/43% position. The same mask treatment is reused here.
- `/brand/playground-landscape.png` is the existing pixel-art landscape; bundled locally, not regenerated. `/brand/icon-180.png` supplies the app icon.
- Source font and brand files remain the property of their respective owners; reused for the user-requested Playground product, not offered as a new stock-asset license.

## Observed Browserbase references

The inspected page uses generous whitespace, technical mono labels, black/orange contrast, thin boundaries and a large pixel-textured landscape. The app borrows the sense of a technical product canvas, not its logo, copy, private fonts or service integration. No Browserbase API is installed.

## Meet interface

The interface prioritizes starting and joining calls. A compact header provides Meetings and Help navigation, followed by the meeting form and real recent meeting history. White surfaces, a neutral #F8F9F7 background, teal controls and Manrope retain Playground's identity. The main desktop container is 1120px; the homepage becomes one column at 800px. These are app design decisions, not claimed source measurements. Decorative landscape art, floating cards, dotted backgrounds and marketing sections were removed after user feedback.

The meeting room uses a plain dark stage so camera content dominates. Primary call controls, Chat and People remain visible with labels; a single Tools menu opens whiteboard, shared notes, polls, focus timer and product review. Collaboration panels reuse readable light/dark app surfaces. Controls wrap on phones and panels fill the stage. Native dialogs provide focus trapping, Escape support and accessible names.

Dark theme uses paper #111918, surface #17221F, warm text #F5F1E4 and muted green-gray. Motion is limited to feedback such as toasts, reactions and brief hover transitions, with reduced-motion support. Interactive calls never use fabricated participant counts, fake meeting activity or stock portraits as if they were live.
