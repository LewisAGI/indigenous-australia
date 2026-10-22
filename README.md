# Indigenous Australia

A static reading site for a sourced pack about Aboriginal and Torres Strait Islander nations, places, stories, people, and further reading. Lists, the timeline, and people are the primary surfaces. The globe is a locator for the one coordinate the pack actually gives. It draws no nation boundaries.

## Cultural protocol

- Link the [AIATSIS map of Indigenous Australia](https://aiatsis.gov.au/explore/map-indigenous-australia). Do not crop it, overlay it, or turn it into a GIS layer.
- Link-only stories are a neutral label and the custodians' link. The Anangu entry links only to https://uluru.gov.au. Stories and places still waiting on a custodian check are the same: a neutral line and that custodian's own source, with the story name left out.
- Kata Tjuta and Wollumbin stay places. No story is attached.
- Anthwerrke (Emily Gap): no photographs of the rock art.
- Djang'kawu: do not reproduce the designs.
- An entry whose sources were only seen as a search summary or a search-result extract stays out of the public catalog. A source that is unchecked is marked Unchecked when a checked source is also cited.
- Knowledge flagged `RESTRICTED -` is not published. The place record remains, without a story.
- A person with no life-status flag, or an unknown one, keeps the deceased-persons warning. A flag that says living does not.
- The pack note that says no deceased people are named is withheld. Later entries do name people.
- Placeholder or example rows are labelled Example data.

## Develop

```bash
npm ci
npm test
npm run build
npm run test:e2e
```

`npm test` publishes `public/catalog.json`, runs Vitest, builds `dist/`, and greps every file in `dist/` for link-only names and private notes. `npm run build` typechecks, builds `dist/`, and checks that `dist/` contains no link-only retelling, no Pages Functions, and the security headers. `npm run test:e2e` runs the Playwright suite. Use `--project=chromium` or `--project=webkit` to run one browser.

There is no Cloudflare token in this repo and no deploy job. The history-of-humanity-map bridge publishes `dist/` to the `indigenous-australia` Pages project.

## Pack

`data/content.json` and `data/sources.json` are the v3 pack. `data/schema.json` describes them. `data/README.md` records what the site keeps out of the public catalog.
