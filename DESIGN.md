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

## Proposed Meet system

Cream editorial workspace, restrained teal controls, coral hand-drawn underline, an interactive landscape window, orbital/dot geometry and floating idea cards. Manrope body/headings and platform monospace labels. Main desktop container is 1440px; breakpoints at 1100, 800/720 and 480px. These are app design decisions, not claimed source measurements.

The meeting room switches to a deep teal stage so camera content dominates. Collaboration panels reuse the readable light/dark app surfaces. Responsive controls wrap on phones; panels fill the remaining stage rather than narrowing video to an unusable sliver. Native dialogs provide focus trapping, Escape support and accessible names. Reduced-motion users receive static decorative components.

Dark theme is a deliberate extension: paper #0C2023, surface #143337, warm text #F5F1E4 and muted green-gray. Motion is restrained to hero parallax, floating objects, toast transitions, reactions and hover feedback. Interactive calls never use fabricated participant counts, fake meeting activity or stock portraits as if they were live.
