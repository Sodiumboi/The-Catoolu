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
- [x] Cloudflare DDNS — automatic IP updates
- [x] Cloudflare Worker maintenance fallback page
- [x] Background art engine scaffold — ready for artist delivery
- [x] `/legal` page — Terms of Service + Privacy Policy in English and Thai
- [x] Legal modal on login page
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

## 🔄 v1.6b — In Progress

**Status: In Progress — June 2026**
_"The fixes accumulate. The session stabilises."_

- [x] Chat history pagination — Discord-style batch loading on scroll-to-top
- [x] Unified `/feed` endpoint — UNION ALL of messages + handout shares, composite cursor
- [x] False "Server Unreachable" fix — 3 consecutive failures required, visibilitychange handler
- [x] Server-down auto-recovery — polls every 5s while down, auto-reloads on return
- [x] Version checker — GitHub Releases API, update pill in Footer
- [x] `APP_VERSION` + `APP_CODENAME` centralised in `version.js`
- [x] Scroll chaining fix — `overscroll-behavior: contain` on 19 containers + root safety net
- [ ] Free specialty picks — "any two other skills" two independent dropdowns (creation engine)
- [ ] Re-enable character creation engine (blocked on specialty picks fix)

---

## Planned

### v1.7 — Eihort

**Status: Planned — Target Q3 2026**
_"The Pale Beast. Lives in the tunnels. Does the deep internal work nobody sees."_

The migration. No new features — just bringing the stylesheet up to standard.

- [ ] Tailwind migration — one page at a time, visually identical after

---

### v1.8 — Glaaki

**Status: Planned — Target Q4 2026**
_"Lord of Dead Dreams. Pulls things out of the deep and gives them new life."_

The refactor. No new features — just making the code readable and maintainable.

- [ ] Break large components into smaller focused ones
- [ ] Remove prop drilling where it has gotten out of hand
- [ ] Consistent naming conventions throughout
- [ ] Remove dead code and commented-out blocks
- [ ] Add comments on anything non-obvious

---

### v2.0 — Shub-Niggurath

_The Black Goat of the Woods with a Thousand Young_

**Status: Planned — Target Q3 2026**
_"A thousand young. The platform branches and multiplies."_

**Keeper's Screen**

- [ ] Full Keeper HUD during sessions
- [ ] Live push of HP/Sanity changes from Keeper to players
- [ ] NPC stat blocks — create and track enemies
- [ ] Initiative tracker — drag-to-reorder, visible to all
- [ ] Session notes (Keeper-only)

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

**Status: Planned — Target Q1 2027**
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

**Status: Planned — Target Q2 2027**
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
 May  ████████████████  v1.0 Azathoth       ✅ Released
 May  ████████████████  v1.1 Dagon          ✅ Released
 May  ████████████████  v1.2 Hypnos         ✅ Released
 May  ████████████████  v1.5 Nyarlathotep   ✅ Released
 Jun  ████████████████  v1.6  Atlach-Nacha   ✅ Released
 Jun  ████████████████  v1.6a Jade Palace    ✅ Released
 Jun  ░░░░░░░░░░░░░░░░  v1.6b TBD            🔄 In Progress
 Q3   ░░░░░░░░░░░░░░░░  v1.7  Eihort         🔮 Planned
 Q4   ░░░░░░░░░░░░░░░░  v1.8  Glaaki         🔮 Planned

2027
 Q1   ░░░░░░░░░░░░░░░░  v2.0  Shub-Niggurath 🔮 Planned
 Q2   ░░░░░░░░░░░░░░░░  v2.5  Yog-Sothoth    🔮 Planned
 Q3   ░░░░░░░░░░░░░░░░  v3.0  Cthulhu        🔮 Planned
```

---

## Contributing

This is a personal project built for a CoC group of approximately 3 investigators.
Feature requests from the players are accepted.
Feature requests from the Ancient Ones are not.

---

_Ia! Ia! The Catoolu fhtagn!_ 🐙
