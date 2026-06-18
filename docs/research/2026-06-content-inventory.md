# Content inventory — old site → new data layer

**Date:** 2026-06-18
**Type:** read-only findings. No code was changed; no content was ported.
**Old site:** `/Users/al_b/Desktop/projects/chunkylabsnyc2` (SvelteKit, content held as inline
arrays inside `src/components/*.svelte`).
**New repo:** this repo — content data layer at `src/data/inventory.ts` and `src/data/stations.ts`.

## Purpose

Before porting the real catalog, get a clean picture of (a) what content actually exists in
the old site and (b) what the new data layer holds today (all skeleton/placeholder). This doc
lists, per category, the old-site count and the real URLs/entries, the new-repo state, and the
delta still to port — plus mapping ambiguities and schema gaps flagged for CD review. **It
decides nothing.**

## Intended content mapping (from the task brief — not yet implemented anywhere)

| Old section              | New surface                                                        |
| ------------------------ | ------------------------------------------------------------------ |
| SoundCloud mixes         | Mixtape shelf                                                      |
| Spotify "Vibes"          | Dedicated bin (series identity preserved)                          |
| Spotify "Various"        | Dissolved + recurated as genre **section-divider cards** in a 2nd bin |
| Beatport releases        | Counter (purchase CTA surface)                                    |
| News / updates           | Gig-flyer **corkboard** by entrance                               |
| (Salsa)                  | Appears in **both bins AND** the mixtape shelf                    |

## Where the content lives in the old site

`src/routes/+page.svelte` composes the page in this order:
`Head → Hero → Updates → SoundCloudSpot → SpotifyVibes → SpotifyVarious → DigitalDownloads → Footer`.

The five named components are the complete set of content-bearing components. Adjacent files
checked and found to carry **no inventory**:

- `Hero.svelte` — a single headline string ("Latest news, mixes and playlists for al b").
- `Footer.svelte` — copyright + "made by shade" credit (`https://shade.ninja`).
- `Head.svelte` — nav bar with **artist-level profile/contact links** (see note below).
- `Carousel.svelte` — presentation only (grid + visibility), no data.
- `src/Hero.svelte` (repo root) — **dead boilerplate** (TailwindUI starter markup); not
  imported anywhere. Ignore.

**Artist/contact links in `Head.svelte`** (global identity, *not* per-item inventory, but
relevant to CTAs/contact surfaces): SoundCloud artist `soundcloud.com/dj-al-b`, Spotify artist
`open.spotify.com/artist/7oPYCCo25JWlo82qurQLUg`, Beatport artist
`beatport.com/artist/al-b/219020`, Instagram `instagram.com/dj_alb_official`, email
`chunkylabsnyc@gmail.com`.

---

## Category 1 — SoundCloud mixes → mixtape shelf

**Old site:** `SoundCloudSpot.svelte`, section titled **"SoundCloud Spotlight"**.
**Count: 5 embeds**, all SoundCloud *playlist* embeds (opaque numeric playlist IDs, no titles
in code). Order as displayed:

| # | SoundCloud playlist ID | Player embed (`w.soundcloud.com/player/?url=…/playlists/soundcloud:playlists:<ID>`) |
| - | ---------------------- | ----------------------------------------------------------------------------------- |
| 1 | `2059410711`           | `.../soundcloud%3Aplaylists%3A2059410711`                                           |
| 2 | `497097`               | `.../soundcloud%3Aplaylists%3A497097`                                               |
| 3 | `1526138`              | `.../soundcloud%3Aplaylists%3A1526138`                                              |
| 4 | `1096372`              | `.../soundcloud%3Aplaylists%3A1096372`                                              |
| 5 | `2058781242`           | `.../soundcloud%3Aplaylists%3A2058781242`                                           |

**Additional SoundCloud items mentioned only in Updates (NOT in the embed grid):**

- `soundcloud.com/dj-al-b/housetape-2024` — "Housetape 2024" (House mix)
- `soundcloud.com/dj-al-b/storm-2023` — "Storm" (Deep House mix)
- `soundcloud.com/laurent-garnier/s4e24` — third-party radio show featuring an al b remix
- A "Tapes" sub-collection was "added to the SoundCloud Spotlight" (Updates 07.22.25) — may
  correspond to one of the 5 playlist embeds above, but this is not stated in code.

**New repo:** `MIXTAPES` in `inventory.ts` — **2 placeholder mixtapes** ("Placeholder Mixtape
Vol. 1/2"), both explicitly fake. The `Mixtape` type is `{ id, title, description, trackCount }`.

**Delta:** Port the 5 SoundCloud playlist embeds (titles need sourcing — only numeric IDs
exist). Decide whether the standalone Updates-mentioned mixes (Housetape, Storm, the Tapes
sub-collection) also become mixtapes.

---

## Category 2 — Spotify "Vibes" → dedicated bin (series preserved)

**Old site:** `SpotifyVibes.svelte`, section titled **"Vibes Series"**.
**Count: 18 entries** (each has an `embed` `src` + a public `link`). Displayed newest-first
(internal `id` 18 → 1). Playlist IDs:

| Vibes # (by `id`) | Spotify playlist ID        |
| ----------------- | -------------------------- |
| 18                | `1a3ZlBowVT2CMfWjzm4hvT`   |
| 17                | `5cQWRRQwpwpezJY5RTfd2x`   |
| 16                | `0cm55dvJAy7rO7NJZi2cLI`   |
| 15                | `4NfaOvb8dMjjQ6BWHdxjGO`   |
| 14                | `31wRFBzKyvTX5MqSCwYb2E`   |
| 13                | `5QiRuB5rg8eD4BHDJ6p4d3`   |
| 12                | `1KzTWI74Qoe0fyiFAegVPD`   |
| 11                | `3XapXTfikXL9QOqvptA9xK`   |
| 10                | `4EMKuW0DsLcDegIhkAgfrI`   |
| 9                 | `36BHFD4ZpyWrnIkCBpfmIB`   |
| 8                 | `7t1WxoMe6MZBlJaEnPgsD3`   |
| 7                 | `6vviA7YBVzCsOFTnksXkV7`   |
| 6                 | `07A467fclpwLLzHTVWvpDk`   |
| 5                 | `2hzZ8LhvYg4fzuoYMIUosR`   |
| 4                 | `60YEbsjUfOuGjF5qaM0bRU`   |
| 3                 | `52FlFupiggMZc2FcQSNbj4`   |
| 2                 | `7tDW9oOgzjHvT6oABqaZom`   |
| 1                 | `067gebWfQgzosIHrdOc0Jj`   |

> The internal `id` is **not** confirmed to equal the "Vibes N" release number — it just
> happens to run 1–18 and the newest (`id` 18) matches the "Vibes 18 just dropped" update
> (02.28.26). Treat the series-number mapping as plausible-but-unverified.

Embed URL form: `open.spotify.com/embed/playlist/<ID>?utm_source=generator` (except `id` 18,
which uses the `?si=…` form). Public link form: `open.spotify.com/playlist/<ID>?si=<token>`.

**New repo:** No Vibes data. The nearest shape is `RecordItem` (`{ id, title, artist, year?,
binId, previewUrl? }`) sitting in a `Bin`. `BINS` are two generic crates (`left-bins`,
`right-bins`) with placeholder labels. **3 placeholder `RECORDS` total**, none real.

**Delta:** Port 18 Vibes playlists into a bin. See schema gaps — the `RecordItem` shape is
record-shaped (artist/year/single `previewUrl`), not playlist-shaped (series index, embed src
+ public link pair), and no bin is designated as "the Vibes bin."

---

## Category 3 — Spotify "Various" → genre divider cards in a 2nd bin

**Old site:** `SpotifyVarious.svelte`, section titled **"Various Playlists"**.
**Count: 5 entries** (each `embed` `src` + public `link`):

| # | Spotify playlist ID        | Note                                                       |
| - | -------------------------- | ---------------------------------------------------------- |
| 1 | `4Y2QDVRBrlGCJ9SGeDwuGq`   |                                                            |
| 2 | `7eSRm40kcExqyggV6dbpvK`   |                                                            |
| 3 | `4LtK2bI7FBoHro1JdsoxdQ`   |                                                            |
| 4 | `3TEUnudIE8nTH9TkFHDBX1`   |                                                            |
| 5 | `0n3716q0T1PJSENPSYIevj`   | **"sancocho numero tres"** — latin/salsa (per Updates 12.25.23) |

**New repo:** No "Various" data and **no divider-card concept anywhere**.

**Delta:** The mapping calls for *dissolving* these into recurated **genre section-divider
cards** in a second bin. There is no schema for divider cards, and the playlists carry **no
genre labels in code** — only opaque IDs — so the recuration cannot be derived from the repo
(see ambiguities).

---

## Category 4 — Beatport releases → counter (purchase CTA)

**Old site:** `DigitalDownloads.svelte`, section titled **"Digital Downloads"**.
**Count: 2 releases** (each = artwork `<img>` + purchase `link`):

| # | Artwork file        | Purchase link                                          | Track slug      |
| - | ------------------- | ------------------------------------------------------ | --------------- |
| 1 | `/assets/carry.png` | `beatport.com/track/house-like-this/8323955`           | house-like-this |
| 2 | `/assets/escandalo.png` | `beatport.com/track/nocturning/2757165`            | nocturning      |

> Note the artwork filename does not obviously match the track slug (`carry` vs
> `house-like-this`; `escandalo` vs `nocturning`). Canonical release titles need sourcing.

**New repo:** The `counter` station exists in `stations.ts` with a placeholder DOM layer
(heading "The Counter", placeholder body) and the `StationCta` type (`{ label, href }`) — a
**single** optional CTA per station. `inventory.ts` has **no release/product type at all**.

**Delta:** Port 2 Beatport releases. No data structure exists for a *list* of releases with
artwork + title + purchase URL; the counter currently only supports one DOM CTA.

---

## Category 5 — News / updates → gig-flyer corkboard

**Old site:** `Updates.svelte`. **Count: 16 article blocks** (raw HTML strings; first 3 shown,
"more+" reveals all). Newest-first:

| # | Date     | Gist                                                                 | Type        |
| - | -------- | -------------------------------------------------------------------- | ----------- |
| 1 | 02.28.26 | "Vibes 18" dropped → Vibes section                                   | release     |
| 2 | 10.03.25 | "Vibes 17" out → Vibes section                                       | release     |
| 3 | 10.01.25 | "Sunday at Il Posto" film streaming on AppleTV                       | press/film  |
| 4 | 07.22.25 | New "Tapes" section added to SoundCloud Spotlight                    | release     |
| 5 | 12.20.24 | "Vibes 16" available → Vibes section                                 | release     |
| 6 | 07.21.24 | Block party, Greenpoint BK (Dobbins/Norman St), al b + Ben Manzone   | **gig**     |
| 7 | 06.14.24 | New House mix "Housetape 2024" on SoundCloud                         | release     |
| 8 | 12.25.23 | "sancocho numero tres" (latin) → Various section                    | release     |
| 9 | 11.11.23 | "Vibes 15" available → Vibes section                                 | release     |
| 10| 09.30.23 | Abe's Pagoda (Bushwick), al b w/ Tre Dambrocia                       | **gig**     |
| 11| 08.04.23 | "Storm" deep house mix → SoundCloud section                         | release     |
| 12| 05.08.23 | "Vibes 14" available → Vibes section                                 | release     |
| 13| 05.06.23 | Site launch (Chunkylabs 2.0); old site link                          | site news   |
| 14| 04.11.23 | Abe's Pagoda (Bushwick), al b w/ Gant Johnson                        | **gig**     |
| 15| 03.10.23 | Laurent Garnier radio show featuring al b's Carry Nation remix       | press       |
| 16| 02.22.23 | al b's small role in indie film about Il Posto Accanto               | press/film  |

**New repo:** **No corkboard station** (the entrance is `street` → `door`; neither has an
updates surface) and **no `Update`/`Article`/`Flyer` type** in `inventory.ts`.

**Delta:** Port 16 updates. Nothing in the schema represents them, and only ~3 of 16 are
actually gigs (the rest are releases/press/site-news) — see ambiguity on the "gig-flyer" framing.

---

## New-repo data layer — current state (summary)

`src/data/inventory.ts` — **shape + placeholders only**, explicitly "obviously fake on
purpose." Pure data, no browser/video dependency (it backs the `/music` escape hatch).

| Export             | Type                                            | Current contents             |
| ------------------ | ----------------------------------------------- | ---------------------------- |
| `BINS`             | `Bin {id,label,description}`                    | 2 generic (left/right) bins  |
| `RECORDS`          | `RecordItem {id,title,artist,year?,binId,previewUrl?}` | 3 placeholder records |
| `MIXTAPES`         | `Mixtape {id,title,description,trackCount}`     | 2 placeholder mixtapes       |
| `CLERK_VOICE_LINES`| `ClerkVoiceLine {id,context,text}`              | 3 placeholder lines          |

`src/data/stations.ts` — 6 stations (`street, door, counter, left-bins, right-bins,
mixtape-shelf`), placeholder transition assets, placeholder DOM. Types: `Station`,
`TransitionAsset`, `StationCta {label,href}`, `StationDomLayer {heading?,body?,cta?}`.
The `mixtape-shelf` station has a CTA to `/music`. **No real content anywhere; no embed URL
exists in the new repo** (confirmed by grep).

---

## Schema-shape coverage — which target surfaces have a shape, which don't

| Target surface (mapping)          | Schema shape today?                                                                                       |
| --------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **Mixtape shelf**                 | **Partial.** `Mixtape` type exists but has **no media/embed field** — nowhere to put a SoundCloud playlist URL/ID. |
| **Vibes bin**                     | **Partial / mismatched.** `Bin` + `RecordItem` exist, but `RecordItem` is record-shaped (artist/year, single `previewUrl?`), not playlist-shaped (no series index, no embed-src + public-link pair); no bin is designated "Vibes." |
| **Genre divider cards (2nd bin)** | **Missing.** No divider-card type/concept at all; `RecordItem` has no "divider"/"section" variant.        |
| **Counter (Beatport purchase)**   | **Missing.** No release/product type; counter has only `StationDomLayer` + a single `StationCta`. No list of releases (artwork + title + purchase URL). |
| **Corkboard (updates by entrance)** | **Missing.** No `Update`/`Article` type, and no corkboard station near the entrance.                     |

**Has a shape:** mixtape shelf (partial), Vibes bin (partial). **No shape yet:** genre divider
cards, counter releases, corkboard updates.

---

## Flagged ambiguities (for CD — NOT resolved here)

1. **Salsa lands in multiple surfaces, but genre isn't in the data.** The mapping says salsa
   appears in *both bins AND* the mixtape shelf, but no old-site item carries a genre tag —
   section identity (Vibes/Various/SoundCloud) is the only taxonomy. Which specific
   playlists/mixes are "salsa" can't be derived from the repo.
2. **"sancocho numero tres"** (`0n3716q0T1PJSENPSYIevj`) is a *Various* playlist that is also
   latin/salsa and is referenced in Updates. Under the mapping, Various dissolves into genre
   divider cards — but salsa is also supposed to land in a bin and on the mixtape shelf. Where
   does this one item go (divider card, bin record, mixtape, or several)? Undecided.
3. **"Various" recuration needs genres that aren't in the repo.** Turning the 5 Various
   playlists into "genre section-divider cards" requires each playlist's genre; the code only
   has opaque Spotify IDs and no titles. Cannot derive.
4. **What counts as a "mixtape"?** SoundCloud → mixtape shelf, but the section has 5 *playlist*
   embeds plus standalone mixes mentioned only in Updates (Housetape 2024, Storm 2023) and a
   "Tapes" sub-collection. Are all 5 embeds mixtapes? Do the standalone mixes also belong?
5. **Vibes share-token variance (cosmetic, but pick a canonical form).** Several Vibes
   playlists appear with *different* `?si=` share tokens in the embed grid vs. the Updates
   mentions — same playlist ID, different token: Vibes 17 (`5cQWRRQwpwpezJY5RTfd2x`), Vibes 16
   (`0cm55dvJAy7rO7NJZi2cLI`), Vibes 15 (`4NfaOvb8dMjjQ6BWHdxjGO`), Vibes 14
   (`31wRFBzKyvTX5MqSCwYb2E`). Recommend storing the bare playlist ID and dropping `si`/`pt`/
   `utm_source` tokens on port — flagged so it's a deliberate call, not silent.
6. **Vibes series-number = internal `id`?** Unverified (see Category 2 note). If the new bin
   should preserve "Vibes N" identity, the release number must be sourced/confirmed, not
   assumed from array `id`.
7. **Beatport artwork vs. track title mismatch.** Artwork filenames (`carry.png`,
   `escandalo.png`) don't match the URL track slugs (`house-like-this`, `nocturning`).
   Canonical release titles need sourcing.
8. **"Gig-flyer corkboard" vs. mixed update types.** Only ~3 of 16 updates are gigs (Greenpoint
   block party; two Abe's Pagoda nights). The rest are release drops, press/film items, and a
   site-launch note. Does the corkboard carry all updates, or only gigs?
9. **In-page anchor cross-refs won't port.** Updates use `scrollToAnchor('anchor-vibes'…)` style
   in-page jumps that reference old single-page section anchors (`#anchor-vibes`, `#anchor-sc`,
   `#anchor-spot-various`). These won't translate to the station/route model and need a new
   linking approach.

---

## Old-site totals (at a glance)

| Category            | Old count | New real entries | Delta to port |
| ------------------- | --------- | ---------------- | ------------- |
| SoundCloud mixes    | 5 embeds (+3 named in Updates) | 0 (2 placeholders) | 5 + decide on the named extras |
| Spotify Vibes       | 18        | 0 (placeholders) | 18            |
| Spotify Various     | 5         | 0                | 5 (to recurate) |
| Beatport releases   | 2         | 0                | 2             |
| News / updates      | 16        | 0                | 16            |

*No content has been ported. The new data layer is entirely placeholder/scaffold.*
