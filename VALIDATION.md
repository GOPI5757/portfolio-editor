# Validation — Visual Editor update

## Checks performed on 22 October 2026

- Parsed all shipped JavaScript and built the embedded standalone editor.
- Tested real artist-template text binding, helper arguments, inherited options and optional text styles. Local changes left the shared helper file unchanged.
- Tested the new inspector with a DOM unit harness: visible content fields, custom enabled setting, typed appearance controls, text save, and no source/configuration paths in the interface.
- Tested direct canvas text editing with a DOM unit harness: selecting one text node in a formatted sentence, preserving the bold span and original text nodes, Escape cancellation, and flushing the text before export.
- Tested contextual matching and refusal to choose an arbitrary duplicate text source.
- Tested artist project/category detection, plain JavaScript data lists, names stored in helper calls, unique project IDs, copied nested media/detail templates, undo/redo and export/reimport.
- Tested navigation classification for local standalone HTML, query-based detail pages, hash project routes, external addresses and unknown destinations.
- Re-ran the existing module-loader checks: top-level await, local static/dynamic modules, query context, and compilation of both supplied portfolios.
- Re-ran repeated-HTML unit checks for detection, duplicate ID/ARIA relinking, reordering and removal.
- Re-ran inline-script, overlapping formatted-text fallback and concurrent-save regression checks.
- Round-tripped the complete supplied gameplay portfolio ZIP with one test edit. All 1,647 untouched file contents matched their original SHA-256 hashes. The original ZIP was not modified.
- Checked final package integrity and embedded output against the readable sources.

## Verification boundary

Interactive browser testing of this update could not run. Browser access continued to return “Local browser use is disabled in Work settings”, including after the user enabled it, mentioned Browser, and the connection was refreshed.

DOM unit harnesses check logic, not real-browser layout or pointer interaction. The new floating toolbar, on-canvas Add controls, separate HTML detail-page duplication and empty HTML-list restoration still need interactive verification when that permission error is resolved. This build must not be described as universally compatible or bug-free.

Earlier builds had browser verification, but those results do not prove the new interactions. No private website content or test archives are included in the editor package.
