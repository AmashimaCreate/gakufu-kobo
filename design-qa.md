# Design QA

## Result

`pass`

## Browser evidence

- Implementation: `/Users/tamaken/Documents/New project/staff-paper-maker/index.html`
- Browser-tested URL: `http://127.0.0.1:8765/`
- Final browser capture: `/private/tmp/staff-paper-maker-final.png`（1280 × 720 px）
- Browser DOM and visual checks completed for:
  - standard staff paper and bass-clef placement;
  - 200% zoom with working horizontal and vertical scrolling to both limits;
  - staff + 6-string TAB with the TAB label outside the rules;
  - horizontal 6-fret diagrams in a complete 5 × 7 layout;
  - two-column chord paper with 12 aligned rows per column;
  - 4-string bass fretboards;
  - compact 2-column × 5-row keyboard diagrams without memo lines.
- The score-type grid was keyboard-tested: `ArrowDown` from 五線譜 moves to the control directly below, 五線譜＋TAB.
- The zoom control exposes the current percentage in its accessible name and announces zoom changes in the single visible live region.

## Resolved findings

- Staff, piano, TAB, and staff+TAB requested row counts and spacing are stored independently. Capacity fitting no longer destroys the requested values.
- Corrupt JSON, valid JSON with an invalid shape, unknown settings objects, and future schema versions are not overwritten automatically.
- Sparse legacy favorites that only contain common fields such as margin, line weight, or title visibility are migrated instead of deleted.
- Storage-block and storage-failure warnings reappear if a temporary action message replaces them, and successful recovery is announced.
- Presets retain their selected label; favorite migration scans until 20 valid entries are collected.
- The bass clef is aligned to the fourth-line F position. Staff brackets include their painted stroke in the SVG bounds, including clef-none and thick-line output.
- TAB and staff+TAB keep interior measure dividers but leave the right edge open.
- At 851–1100 px screen widths, the preview consumes the remaining height instead of using a stale fixed header offset. Screen-only layout rules do not affect printing.
- Segmented controls use one tab stop, arrow navigation, Home, and End. Vertical arrows respect the rendered column count.
- Preview controls wrap without clipping, focus rings remain visible, and the current percentage is available when focus returns to the 100% button.
- Print output is protected from internal page breaks and receives an exact dynamic `@page` size for the selected paper and orientation.
- PDF export rejects aspect-ratio mismatches and uses one uniform scale, preventing stretched notation.

## Automated verification

Run from `/Users/tamaken/Documents/New project/staff-paper-maker`:

```sh
npm test
```

The passing suite covers:

- schema 11 plus legacy settings and favorite migration;
- all eight paper types and independent per-mode state;
- 768 unified-TAB combinations;
- full and compact keyboard layouts;
- staff+TAB geometry and symbol clearance;
- 10,368 diagram combinations across paper, orientation, margin, line weight, size, 4–7 strings, nine complete grid layouts, vertical/horizontal direction, and 4/5/6 frets;
- 576 one/two-column chord-paper combinations;
- painted SVG bounds including stroke width, line caps, transformed music-symbol paths, and thick brackets;
- A4 portrait and B5 landscape PDF bytes, exact `MediaBox`, balanced graphics state, DATE text, xref offsets, `startxref`, and EOF;
- dynamic print page-size creation/removal;
- one live region, current terminology, accessible labels, storage protection, and recovery warnings.

## Public release verification

- The public product name is consistently shown as `楽譜工房` in the page title, heading, manifest, favicon label, Open Graph data, Twitter card data, and WebApplication structured data.
- SVG, 192 px, 512 px, and Apple touch icons are present and referenced by the document and manifest.
- A 1200 × 630 PNG sharing image is referenced by absolute Open Graph and Twitter URLs for the planned GitHub Pages address.
- The first render uses a neutral loading state and changes to `ライブプレビュー` only after successful initialization; JavaScript-disabled and startup-failure messages are available.
- Skip links, stronger control borders, and an on-device storage notice were added without changing printed output.
- The public-readiness test validates all local resource references, unique IDs, metadata, manifest fields, icon dimensions, and the absence of placeholder deployment URLs.
- The deployment build copies only the 15 verified public files, excluding tests, source artwork, documentation, and the unused font.
- A fresh-origin browser run completed with no console warnings or errors. Staff+TAB still had zero right-edge closing lines after the public-facing changes.

## Remaining physical check

The generated pages and PDF bytes are verified. A final monochrome print on the target printer is still useful for choosing the preferred line-density setting, but no software blocker remains.

final result: pass
