# indigenous-australia content pack (v1, 2026-10-22)
Files: content.json (entries grouped by section), sources.json (id, title, author_org, url, date_accessed, quality).
Entry schema: {id, text, sources[] (ids in sources.json), label ("evidence" | "inference" | qualified evidence), optional coords {lat, lon, source_format DMS}, uncertainty, sensitivity, debate}.
Coordinates: only where a source (UNESCO) gives them, converted from DMS. null means not sourced. UNESCO points are site centroids.
Labels: "evidence" means it is stated in the cited source. "inference" is marked inline. Some peer-reviewed items were read only at abstract or summary level, and their labels say so.
Validation: valid JSON; every entry has >=1 source id that resolves in sources.json.

## Cultural protocol (read first)
- AIATSIS map caveat: boundaries are approximate and contested, and the map is not suitable for native title or land claims. This applies to every group/location (boundary_caveat field). Only Traditional Custodians can speak for Country.
- The AIATSIS map must not be cropped, overlaid or turned into GIS layers. Link to it; don't redraw it.
- Kuniya & Liru: Parks Australia/Anangu ask that Tjukurpa NOT be retold or replicated. Marked publish_status "link-only". Get permission before publishing more.
- No secret or sacred material is included. Restricted categories are noted only so they can be excluded.
- deceased_persons_warning_default is in meta; no deceased people are named.
## Gaps
Only 2 nations and 2 stories so far. Story candidates need nation-owned publications plus ICIP permission. Need AustLang codes per group, and Torres Strait Islander content (none yet). The Yankunytjatjara pairing is inference. Budj Bim eruption dates disagree across sources (30k/32k/37k).

## v2 expansion (2026-10-22)
Counts: knowledge 25, groups 16 (3 Torres Strait), stories 6, places 10. 56 sources.
New fields: groups[].austlang, groups[].torres_strait, stories[].publish_status (link-only, summary-with-credit, summary-pending-review), stories[].deceased_note.
Stories: Tagai (s3) and the Three Sisters/Muggadah (s6) mention deceased people, so they're flagged deceased_persons=true. Kata Tjuta and Wollumbin are recorded only as restricted places, with no stories.
Remaining gaps:
- AustLang codes S59, W41, N64, N20, N153, K29, L3, Y1 and S20 were confirmed from search results only, not by opening each AustLang page. The full AustLang CSV couldn't be downloaded (connection refused).
- No AustLang code for Gundungurra yet.
- Bunjil (s4) and Waakal (s5) are only at search-summary level and need checking against the Traditional Owner corporations.
- No sourced coordinates for the new places.
- Still not covered: central desert nations other than Anangu, Tasmania, Yolŋu, Arrernte.

## v3 (2026-10-22)
New sections: `people`, `timeline`, `further_reading` (same entry schema; every entry has sources[]).
- AustLang: all 9 search-derived codes now page-verified; added C8 Arrernte, C14 Alyawarr, C15 Warlpiri (C14/C15/T16 read via search extracts), Yolngu Matha N234 (cited from N64 page; N234 page empty).
- Added Tasmania/palawa (TAC sources), Arrernte caterpillar story (s7, sacred site: no rock-art photos), Yolngu Djang'kawu (s8, NMA resource; do not copy designs), Seven Sisters (s9, link-only), Papunya Tula, Yirrkala Bark Petitions.
- Bunjil (s4) upgraded: Parks Victoria page verified. Waugal/Waakal (s5) rewritten to archived Kaartdijin Noongar text; Derbarl Yerrigan link remains unverified.
- People entries with unknown life status carry `deceased_persons: "unknown - apply warning"`.
Gaps: no coordinates for new places (deliberately; boundaries contested); TAC gazettal dates per name not captured; Tasmania stories not added (none publicly shared in sources read); N234 page not readable.

## Site use

The site does not read this pack in the browser. `scripts/publish-catalog.mjs` writes `public/catalog.json`, and that file is what the pages load.

Left out of the public catalog:

- `meta.deceased_warning_note` (later entries do name people, so the pack sentence that says otherwise is not shown)
- `public_summary` on link-only stories, and those stories' names (the public title is a neutral label plus the custodians' link)
- `deceased_note` on every entry (the deceased-persons warning covers it)
- raw `sensitivity` text (the site keeps only the fixed lines "Do not photograph", "Designs not reproduced", and "Shared with permission of custodians")
- stories marked secret or sacred, pending review, or with a search-summary label
- any entry whose sources are all unchecked (a search summary or a search-result page extract)
- knowledge whose sensitivity begins `RESTRICTED -` or says not to publish

Coordinates are copied only where this pack already has them. Names are not geocoded. Kata Tjuta and Wollumbin remain places with no story. Anthwerrke (Emily Gap) keeps the no-photography note. Djang'kawu keeps the no-designs note. A missing or unknown life status keeps the deceased-persons warning.
