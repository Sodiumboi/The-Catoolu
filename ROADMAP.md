# 🐙 The Catoolu — Development Roadmap

> _"That is not dead which can eternal lie, and with strange aeons even death may die."_
> — H.P. Lovecraft

A self-hosted Call of Cthulhu 7e character manager on its way to becoming a full lightweight VTT.
Built by **Someone at Saltlakes** with **Claude** (Anthropic).

---

## Version Naming Convention

Each version is named after a Great Old One from the Cthulhu Mythos.
As the platform grows, so do the horrors it contains.

| Version | Codename         | Entity               | Meaning                                                                 |
| ------- | ---------------- | -------------------- | ----------------------------------------------------------------------- |
| v1.0    | _Azathoth_       | The Blind Idiot God  | The chaotic origin — the first thing that existed                       |
| v1.1    | _Dagon_          | The Half-Deep One    | Familiar, but transformed — the bridge between worlds                   |
| v1.2    | _Hypnos_         | The God of Sleep     | Catches you at the threshold — before you drift away and lose your work |
| v1.5    | _Nyarlathotep_   | The Crawling Chaos   | The messenger — the one who connects things                             |
| v1.6    | _Atlach-Nacha_   | The Spider God       | Eternally weaves the web — the threads connect                          |
| v1.7    | _Eihort_         | The Pale Beast       | Lives in the tunnels beneath — the deep internal work nobody sees       |
| v1.8    | _Glaaki_         | Lord of Dead Dreams  | Pulls things out of the deep and gives them new life                    |
| v2.0    | _Shub-Niggurath_ | The Black Goat       | Fertile and multiplying — many branches                                 |
| v2.5    | _Yog-Sothoth_    | The Key and the Gate | Omniscient — sees all times and places                                  |
| v3.0    | _Cthulhu_        | The Great Dreamer    | The final form — the one it was all named for                           |

---

## ✅ v1.0 — Azathoth

**Status: Released — May 2026**
_"In the beginning there was fool, and that fool had Claude that help build character sheets."_

The foundation. Built from zero web development experience to a fully containerised, self-hosted production application.

- [x] User registration and login with JWT authentication
- [x] Password hashing with bcrypt
- [x] Forgot password flow with email reset links (Resend)
- [x] User profile page — change username, email, password
- [x] Investigator dashboard with portrait cards (SAN + HP display)
- [x] Dhole's House `.json` import and export
- [x] Full CoC 7e character editor
- [x] Live CoC 7e rule calculations (HP, MP, Sanity, Damage Bonus, Build, Dodge, Move)
- [x] Separate current tracking for HP, MP, Sanity, and Luck
- [x] Characteristics displayed with Reg / Half / Fifth values
- [x] Grouped skill display (Dhole's House style)
- [x] Skill search filter
- [x] Editable subskill names
- [x] Official CoC 7e weapon preset picker
- [x] Add / delete weapons and possessions
- [x] Session notes with rich text editor
- [x] Saveable colour swatches for notes
- [x] Dark and Parchment theme toggle
- [x] Skill text size toggle (Small / Medium / Large)
- [x] Dynamic portrait aspect ratio
- [x] Docker + Docker Compose containerisation
- [x] Nginx reverse proxy with HTTPS via DuckDNS
- [x] Self-hosted on ZimaOS

---

## ✅ v1.1 — Dagon

**Status: Released — May 2026**
_"Familiar, but transformed. The bridge between worlds."_

The UI transformation. A complete visual redesign establishing a proper design system and brand identity.

- [x] CSS Custom Property token layer (colours, fonts, shadows)
- [x] DM Serif Display + DM Sans typography pair
- [x] Catoolu Green brand identity
- [x] Parchment light mode — warm cream replacing dark brown
- [x] Cool-gray dark mode — proper neutral dark theme
- [x] Tab navigation bar (Investigators · Keeper · Campaign)
- [x] Avatar dropdown with initials fallback
- [x] In-place Preferences panel with slide animation
- [x] Investigator count badge on dashboard tab
- [x] Shared NavBar component across all pages
- [x] Investigator search — live filter by name and occupation
- [x] Login with username or email
- [x] Login, auth, and profile pages redesigned to match new CI
- [x] Shared Footer with version and Lovecraft quote

---

## ✅ v1.2 — Hypnos

**Status: Released — May 2026**
_"The god who catches you before you drift away."_

One feature, one file, complete data protection.

- [x] Unsaved changes detection — `isDirty` state tracks all edits since last save
- [x] Section-level change summary — modal lists which sections changed
- [x] In-app navigation guard — `← Dashboard` intercepted when dirty
- [x] Browser back button interception via History API
- [x] Warning modal — Cancel / Discard Changes / Save & Leave
- [x] Save button dirty indicator — `✓ Saved` vs `💾 Save*`
- [x] CharacterEditor refactored into folder module
- [x] UUID injected on import (prevents ID collisions)

---

## ✅ v1.5 — Nyarlathotep

**Status: Released — May 2026**
_"The Messenger arrives. The investigators can finally talk to each other. Just ignore a bunch of bug still left in the room"_

The social layer. The Catoolu becomes a shared space with real-time campaigns, dice, and a full session experience.

- [x] Campaigns — Keepers create campaigns and invite players
- [x] Campaign dashboard — view all member investigators
- [x] Real-time chatroom per campaign via Socket.io
- [x] Persistent chat and roll history
- [x] System messages — _"Kurt Weber has joined the investigation"_
- [x] Dice roller — `/roll`, `/r` alias, custom notation (`2d6+3`, `1d100adv`)
- [x] Hardware-entropy dice via `crypto.randomInt()` — server-side, unforgeable
- [x] Advantage / Disadvantage rolls
- [x] Roll visibility — Only Me / Everyone
- [x] Digit-box roll cards with suspense reveal (skeleton shimmer)
- [x] Nat 1 / Nat 100 meme celebration + confetti 🎉
- [x] Profile picture upload with auto-compression
- [x] GitHub Actions CI — auto-build on push to main
- [x] Docker image-based deploy via GitHub Container Registry
- [x] Campaign room — two-column layout, vertical tab sidebar
- [x] AFK toggle, stat broadcast
- [x] Character registration per campaign
- [x] Keeper player cards with live HP/MP/Sanity tracking
- [x] Session sheet — clickable stats, skills, and weapons
- [x] Weapon attack + damage auto-roll on hit
- [x] HP / MP / Luck / Sanity +/- popup with auto-save and broadcast
- [x] Rollable Sanity and Luck (current value, Adv/Dis aware)
- [x] Material Symbols icon system
- [x] ReadOnly character sheet for Keeper view
- [x] Keeper player card sheet preview (open_in_new → ReadOnlySheet modal)
- [x] Editable money fields in session sheet
- [x] Session sheet font scale preference (persisted to localStorage)
- [x] Dice fairness tester with chi-squared analysis
- [x] Production avatar 404 fix (Nginx `/uploads/` proxy + Docker volume)
- [x] Portrait persistence — avatar and character name stored in message history

---

## ✅ v1.6 — Atlach-Nacha (base release)

**Status: Released — June 2026**
_"The Spider God weaves the web. The threads connect. The investigators can now take notes, log in with Discord, and file bug reports while their characters descend into madness."_

The feature release. A unified sheet engine, a full notes system, OAuth login, cloud file storage, a new domain, and everything the table actually needed.

- [x] Unified sheet module library — OG Editor, KeeperSheet, and RoomSheet draw from shared components
- [x] KeeperSheet rebuilt to match the Editor layout exactly — read-only, full detail
- [x] Keeper panel redesigned — resizable side panel replacing the old fixed modal
- [x] Create/Import modal — animated unified entry point on the dashboard
- [x] Font scale system — independent sheet text and display text scales, per-device
- [x] ADV/DIS winner highlighting — winner accented, loser dimmed
- [x] Notes window — floating, draggable, resizable with bubble/full morph animation
- [x] TipTap v3 rich text editor in notes — full toolbar
- [x] Notes tagged to character or session context, private per user
- [x] Discord OAuth login + Google OAuth login (backwards compatible)
- [x] Character creation engine promoted to `/create` — official, accessible from dashboard
- [x] Creation engine draft resume — close the tab, come back later
- [x] Bug report form with screenshot upload from NavBar dropdown
- [x] Admin dashboard — bug reports, maintenance toggle, live stats
- [x] Maintenance flag — socket broadcast, red NavBar pill, health endpoint
- [x] MaintenancePage + ServerDownPage
- [x] Cloudflare R2 cloud file storage — avatars and screenshots survive redeployments
- [x] Image crop modal rewritten — canvas drawImage preview, portal, scroll lock
- [x] Upload rate limiting (20 uploads per 60 seconds)
- [x] catoolu.quest domain via Cloudflare Tunnel
- [x] Cloudflare Worker maintenance fallback page
- [x] Background art engine scaffold — ready for artist delivery
- [x] `/legal` page — Terms of Service + Privacy Policy in English and Thai
- [x] About page — GitHub badge, artist monument block, full content
- [x] Roll popup positioning fix
- [x] Double `$$` in Financial Status fixed
- [x] Sheet panel minimum width raised to 480px
- [x] `(None)` placeholder skills hidden correctly
- [x] Cthulhu Mythos always visible regardless of value
- [x] Campaign UUID URLs (`/campaign/uuid` replacing `/campaign/4`)
- [x] Username change now updates auth context immediately

---

## ✅ v1.6a — Jade Palace

**Status: Released — June 2026**
_"The palace stands. The investigators find more than they bargained for."_

First patch on Atlach-Nacha. Seven feature areas shipped.

- [x] Keeper roll request system — searchable picker, server-side roll, player pill with breathing border
- [x] Keeper can request from one player or all players simultaneously
- [x] Handouts feature — library on manage page, Keeper room panel, player Handouts tab
- [x] Handout bundles — stacked card visual, nested bundles, share whole bundle into chat
- [x] Chat image attachments — attach button, paste-to-attach, preview chip
- [x] Message deletion — own messages for players, any message for Keeper
- [x] Roll feed overhaul — reliable auto-scroll, floating "Jump to present" button
- [x] Roll cards redesigned — portrait beside content, opaque base layer
- [x] Room settings — crit memes toggle, feed background toggle (per-device)
- [x] Upload quota overhaul — 200MB total / 50MB per 5 min, replaces avatar-count limiter
- [x] File Manager at `/files` — storage bar, preview, per-file R2 delete
- [x] About page image preloading — team avatars warm on idle
- [x] Specialty skill picker multi-select hotfix (Lawyer "Pick 2" fixed)
- [x] Doctor of Medicine compound skill fix (Science Biology + Pharmacy split correctly)
- [x] Character creation engine disabled (hotfix) — fatal occupation logic errors

---

## ✅ v1.6b — High Moor

**Status: Released — June 2026**
_"The moor stretches in every direction. The investigators find the ground more stable than it looked."_

Stability patch. No new features — just everything that revealed itself during real sessions.

- [x] Chat history pagination — Discord-style batch loading on scroll-to-top
- [x] Unified `/feed` endpoint — UNION ALL of messages + handout shares, composite cursor
- [x] False "Server Unreachable" fix — 3 consecutive failures required, visibilitychange handler
- [x] Server-down auto-recovery — polls every 5s while down, auto-reloads on return
- [x] Version checker — GitHub Releases API, update pill in Footer
- [x] `APP_VERSION` + `APP_CODENAME` centralised in `version.js`
- [x] Scroll chaining fix — `overscroll-behavior: contain` on 19 containers + root safety net

---

## ✅ v1.6c — Semphar

**Status: Released — June 2026**
_"The silk road city-state. A crossroads. Everything arrives here eventually."_

The largest patch since Atlach-Nacha itself. Notes rebuilt, chat overhauled, six themes, and the UI consistency pass the app needed.

- [x] Notes window rebuilt with native pointer events (react-rnd incompatible with React 19)
- [x] Notes accessible to both Keeper and player from the same RoomSubNav button
- [x] Chat image upload — multi-attach, paste, grouped gallery message
- [x] Anti-double-click — pending state on dice, send, and skill clicks
- [x] Keeper delete roll cards from the feed
- [x] Roll popup overflow fix — flips upward near viewport bottom
- [x] Multiline chat — Shift+Enter for new line, Enter to send
- [x] Line breaks preserved in rendered chat bubbles
- [x] Unified ConfirmDialog + useConfirm hook across all destructive actions
- [x] What's New modal — auto-shows once per release, reopenable from Footer
- [x] Six themes — Parchment, Shale, Farmilia Dark, Marsh, Archive, Cosmic Void
- [x] CustomDropdown — portal dropdown replacing all native `<select>` elements
- [x] Custom portal tooltip component — no more browser `title` attribute tooltips
- [x] Handout library — dashed create tiles, page-wide drag-and-drop with staging modal
- [x] Safari drag-and-drop compatibility
- [x] File Manager — multi-select, select-all, bulk delete

---

## ✅ v1.6d — Icewind Dale

**Status: Released — June 2026**
_"The frozen valley. Something stirs beneath the ice."_

The atmosphere patch. The app now has a visual identity that matches the game it runs.

- [x] Parallax background art — three-layer mouse-move parallax on four lobby pages
- [x] Theme-adaptive art — multiply/screen blend modes, per-theme colour filters
- [x] Background Visuals controls in NavBar Preferences (toggle, parallax, intensity)
- [x] Bouts of Madness reference panel — full CoC 7e Tables VII-X, Keeper-only
- [x] Campaign room loading screen — ring spinner with rotating CoC flavour text
- [x] Compact left panel header — name, role badge, breathing connection dot, AFK toggle
- [x] Disconnect from Room moved to sidebar icon strip (bottom-pinned)
- [x] Return to Room pill reveals Disconnect option on hover
- [x] Campaign gear icon navigates directly to correct campaign
- [x] Logo-pulse loading states on all three main pages
- [x] NavBar pill tray style
- [x] Investigator card hover lift + token shadows
- [x] All destructive dialogs unified to --danger (red)

---

## ✅ v1.6e — Nakamaru

**Status: Released — July 2026**
_"The castle town. Walls repainted. Gates rehung. Everything works the way it should have from the start."_

The polish patch. No new systems — just everything that was slightly wrong, slightly rough, or slightly invisible getting fixed and finished.

- [x] Disconnect from Room — pill bug fixed, NavBar pill self-sufficient; in-room disconnect navigates to campaign list
- [x] NavBar pill exit animation — symmetric reverse of the pop-in
- [x] Quit Campaign button — Players panel only, hidden from Keeper, permanent leave with confirmation
- [x] Persistent room connection — active room survives browser refresh, socket re-subscribes automatically
- [x] Custom tooltips app-wide — all native `title=` replaced across 24 files, 300ms delay
- [x] Live sheet sync (Keeper view) — Keeper's open sheet updates automatically when the player edits
- [x] Profile picture deletion guard — active avatar protected at backend and frontend
- [x] Character editor toolbar — Material Symbol icons throughout, text arrows gone
- [x] Notes window OS-style minimize/restore — pill appears where the window was, restore expands from the pill
- [x] Possessions & Equipment in the campaign room — new Possessions tab, fully editable, Keeper live-sync

---

## ✅ v1.7 — Eihort

**Status: Released — July 2026**
_"The Pale Beast. Lives in the tunnels. Does the deep internal work nobody sees."_

The largest release since Nyarlathotep. Three independent systems, a new design language, and a complete visual sweep.

- [x] **Tailwind CSS migration** — ~1,700 inline styles eliminated across ~70 files. Everything looks identical after.
- [x] **Frosted Gem design language** — 26 shared CSS classes, every button and pill rebuilt. Nav tabs restyled to dark gem aesthetic.
- [x] **Focus animation system** — form inputs fade to green border with a soft glow, app-wide.
- [x] **Character creation engine (Beta)** — rules fixed (Luck, EDU, age deductions, DB/Build, Dodge), occupation skill data model overhauled across 116 occupations. Modal choice picker for free picks, fixed lists, and specialty groups. Behind a beta badge with Dhole's House cross-check disclaimer.
- [x] **Error handling system** — toast notifications (5 types, retry actions, expandable technical details), ErrorBoundary (no more white-screens), socket error bridge, replaced all silent failures.
- [x] Notes font size stepper, room tab jitter fix, keeper detail scroll fix
- [x] Handout Library bulk delete, Checkbox primitive
- [x] Campaign name overflow fix + startup migration for legacy data
- [x] Cloudflare fallback page redesign — Frosted Gem CI, ghost-fade illustration
- [x] Password reset fix (Resend from address)

---

## Planned

### v1.8 — Glaaki

**Status: Planned — Target Q4 2026**
_"Lord of Dead Dreams. Pulls things out of the deep and gives them new life."_

The refactor. TypeScript migration followed by a code readability pass.

- [ ] TypeScript migration — shared types first, then page by page
- [ ] `CampaignRoomPage.jsx` refactor — split into focused sub-components
- [ ] Creation engine re-enable — final QA on 10 deferred occupation edge cases, remove beta badge
- [ ] Dead file cleanup (4 orphaned components confirmed unused)
- [ ] Remaining Tailwind migration deferred files

---

### v2.0 — Shub-Niggurath

_The Black Goat of the Woods with a Thousand Young_

**Status: Planned — Target Q1 2027**
_"A thousand young. The platform branches and multiplies."_

**Keeper's Screen**

- [ ] Full Keeper HUD during sessions
- [ ] Live push of HP/Sanity changes from Keeper to players
- [ ] NPC stat blocks — create and track enemies
- [ ] Initiative tracker — drag-to-reorder, visible to all

**Character Sheet**

- [ ] Portrait upload directly on the sheet
- [ ] Backstory section visible during session
- [ ] Contacts and allies

**Campaign**

- [ ] Session log — automatic record of all rolls and events
- [ ] Campaign history timeline
- [ ] Public sheet sharing at `/share/:uuid` — no auth required, read-only

---

### v2.5 — Yog-Sothoth

_The Key and the Gate_

**Status: Planned — Target Q2 2027**
_"The Gate. It knows. It sees. Your investigators' history is preserved."_

- [ ] Session journal — post-session summaries
- [ ] Investigator change log — _"Sanity dropped from 55 to 49 — Session 4"_
- [ ] Death records (with cause of death — obviously)
- [ ] Campaign timeline — visual session history
- [ ] Clue board — Keeper-managed investigation board
- [ ] Lore entries — locations, tomes, and contacts per campaign

---

### v3.0 — Cthulhu

_The Great Dreamer_

**Status: Planned — Target Q3 2027**
_"Ph'nglui mglw'nafh. The Great Dreamer wakes. The platform is complete."_

- [ ] Audio ambience — Keeper streams ambient sound to all players
- [ ] Dice roll sound effects with Keeper control
- [ ] Mobile-optimised UI — full responsive redesign
- [ ] PWA support — installable on phone home screen
- [ ] Offline sheet viewing via service worker
- [ ] PDF character sheet export
- [ ] Multi-system support (Delta Green, CoC 6e)

---

## Won't Do

- Video / voice chat (use Discord)
- AI-generated content
- Cloud hosting / SaaS version
- Windows-native app

---

## Release Timeline

```
2026
 May  ████████████████  v1.0  Azathoth        ✅ Released
 May  ████████████████  v1.1  Dagon           ✅ Released
 May  ████████████████  v1.2  Hypnos          ✅ Released
 May  ████████████████  v1.5  Nyarlathotep    ✅ Released
 Jun  ████████████████  v1.6  Atlach-Nacha    ✅ Released
 Jun  ████████████████  v1.6a Jade Palace     ✅ Released
 Jun  ████████████████  v1.6b High Moor       ✅ Released
 Jun  ████████████████  v1.6c Semphar         ✅ Released
 Jun  ████████████████  v1.6d Icewind Dale    ✅ Released
 Jul  ████████████████  v1.6e Nakamaru        ✅ Released
 Jul  ████████████████  v1.7  Eihort          ✅ Released
 Q4   ░░░░░░░░░░░░░░░░  v1.8  Glaaki          🔮 Planned

2027
 Q1   ░░░░░░░░░░░░░░░░  v2.0  Shub-Niggurath  🔮 Planned
 Q2   ░░░░░░░░░░░░░░░░  v2.5  Yog-Sothoth     🔮 Planned
 Q3   ░░░░░░░░░░░░░░░░  v3.0  Cthulhu         🔮 Planned
```

---

## Contributing

This is a personal project built for a CoC group of approximately 3 investigators.
Feature requests from the players are accepted.
Feature requests from the Ancient Ones are not.

---

_Ia! Ia! The Catoolu fhtagn!_ 🐙
