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
| v2.0    | _Shub-Niggurath_ | The Black Goat       | Fertile and multiplying — many branches                                 |
| v2.5    | _Yog-Sothoth_    | The Key and the Gate | Omniscient — sees all times and places                                  |
| v3.0    | _Cthulhu_        | The Great Dreamer    | The final form — the one it was all named for                           |

---

## ✅ v1.0 — Azathoth

**Status: Released — May 2026**
**"In the beginning there was chaos, and the chaos had character sheets."**

The foundation. Built from zero web development experience to a fully containerised, self-hosted production application.

### Features

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
**"Familiar, but transformed. The bridge between worlds."**

The UI transformation. A complete visual redesign establishing a proper corporate identity and design system.

### Features

- [x] **Design System** — CSS Custom Property token layer (colours, fonts, shadows)
- [x] **DM Serif Display + DM Sans** — new typography pair across all pages
- [x] **Catoolu Green CI** — new primary accent colour derived from the logo
- [x] **Parchment light mode** — warm cream default replacing dark brown
- [x] **Cool-gray dark mode** — proper neutral dark theme
- [x] **Tab navigation bar** — Investigators · Keeper · Campaign · Inbox
- [x] **Avatar dropdown** — circular avatar with initials and dropdown menu
- [x] **In-place Preferences panel** — slide animation, theme + skill size controls
- [x] **Investigator count badge** — live count on the Investigators tab
- [x] **Shared NavBar component** — one component used by all pages
- [x] **White elevated character cards** — modern card style with ghost buttons
- [x] **Investigator search** — live filter by name and occupation
- [x] **Login with username or email** — login accepts either identifier
- [x] **Login page redesign** — pill tabs, DM Serif, new CI throughout
- [x] **Auth pages redesign** — Forgot Password and Reset Password match new CI
- [x] **Profile page redesign** — side-by-side layout, portrait placeholder (v1.5)
- [x] **Coming Soon pages** — Keeper, Campaign, Inbox with version badges
- [x] **Shared Footer** — version, build credit, Lovecraft quote on every page

---

## ✅ v1.2 — Hypnos

**Status: Released — May 2026**
**"The god who catches you before you drift away."**

A focused patch release. One feature, one file, complete data protection.

### Features

- [x] **Unsaved changes detection** — `isDirty` state tracks all edits since last save
- [x] **Section-level change summary** — modal lists which sections changed (Personal Details, Characteristics, Skills, Weapons, Backstory, Possessions, Financial Status)
- [x] **In-app navigation guard** — `← Dashboard` button intercepted when dirty
- [x] **Browser back button interception** — History API `pushState` / `popstate` pattern prevents accidental back navigation
- [x] **Warning modal** — three actions: Cancel, Discard Changes, Save & Leave
- [x] **Save button dirty indicator** — `✓ Saved` (clean) vs `💾 Save*` (dirty) with visual state change
- [x] **CSS variable bug fix** — `--danger` circular reference resolved

---

## 🔜 v1.5 — Nyarlathotep

**Status: Planned — Target Q3 2026**
**"The Messenger arrives. The investigators can finally talk to each other."**

The social layer. The Catoolu becomes a shared space.

### Planned Features

- [ ] **Campaigns** — Keepers create campaigns and invite players by username
- [ ] **Campaign dashboard** — view all member investigators in one place
- [ ] **Keeper read-only view** — Keeper can see all player sheets
- [ ] **Real-time chatroom** — per-campaign chat using WebSockets (Socket.io)
- [ ] **Persistent chat history** — scroll back through session logs
- [ ] **System messages** — _"Kurt Weber has joined the investigation"_
- [ ] **Dice roller** — `/roll 1d100`, `/roll 2d6+3` in chat
- [ ] **Skill rolls** — `/roll Firearms` rolls against the investigator's skill and shows CoC success level
- [ ] **Public dice results** — all players see every roll in chat
- [ ] **Profile photo upload** — complete the portrait placeholder from v1.1

### New Tech

- Socket.io (WebSockets for real-time communication)
- Campaign data model (many-to-many: users ↔ campaigns)

---

## 🔮 v2.0 — Shub-Niggurath

**Status: Planned — Target Q4 2026**
**"A thousand young. The platform branches and multiplies."**

The Keeper's tools. Genuinely useful at the table.

### Planned Features

- [ ] **Keeper's Screen** — live view of all investigator HP, Sanity, Luck
- [ ] **Push sanity loss** — Keeper inputs loss, player's sheet updates live
- [ ] **Push damage** — same mechanic for Hit Points
- [ ] **Handouts** — Keeper uploads images and shares to campaign
- [ ] **Handout gallery** — per-campaign image library
- [ ] **NPC / Monster stat blocks** — Keeper-only quick reference
- [ ] **Initiative tracker** — drag-to-reorder turn list, visible to all

### New Tech

- File/image upload handling
- Real-time multi-user state synchronisation

---

## 🔮 v2.5 — Yog-Sothoth

**Status: Planned — Target Q1 2027**
**"The Gate. It knows. It sees. Your investigators' history is preserved."**

The memory layer. The Catoolu remembers everything.

### Planned Features

- [ ] **Session journal** — post-session summaries attached to campaigns
- [ ] **Investigator change log** — _"Sanity dropped from 55 to 49 — Session 4"_
- [ ] **Death records** — with cause of death (obviously)
- [ ] **Campaign timeline** — visual session history with events and NPCs
- [ ] **Clue board** — Keeper-managed investigation board with linked clue cards
- [ ] **Lore entries** — locations, tomes, and contacts per campaign

### New Tech

- Timeline UI components
- Graph/connection data model for clue linking

---

## 🔮 v3.0 — Cthulhu

**Status: Planned — Target Q2 2027**
**"Ph'nglui mglw'nafh. The Great Dreamer wakes. The platform is complete."**

The full vision. The Catoolu as a proper lightweight CoC VTT.

### Planned Features

- [ ] **Multiple campaigns** — archive, templates, shareable invite links
- [ ] **Audio ambience** — Keeper streams ambient sound to all players
- [ ] **Character advancement** — post-session XP, skill improvement rolls, Keeper approval
- [ ] **Full advancement audit trail** — how every investigator grew over a campaign
- [ ] **Mobile-optimised UI** — full responsive redesign for phone play at the table
- [ ] **PWA support** — installable on phone home screen
- [ ] **Push notifications** — _"The Keeper is ready to start"_
- [ ] **Offline sheet viewing** — service worker caching

### New Tech

- Web Audio API
- PWA manifest + service workers
- Mobile-first responsive redesign

---

## Release Timeline

```
2026
 May  ████████████████  v1.0 Azathoth       ✅ Released
 May  ████████████████  v1.1 Dagon          ✅ Released
 May  ████████████████  v1.2 Hypnos         ✅ Released
 Jul  ░░░░░░░░░░░░░░░░  v1.5 Nyarlathotep   🔜 Planned
 Sep  ░░░░░░░░░░░░░░░░  v2.0 Shub-Niggurath 🔮 Planned

2027
 Jan  ░░░░░░░░░░░░░░░░  v2.5 Yog-Sothoth    🔮 Planned
 May  ░░░░░░░░░░░░░░░░  v3.0 Cthulhu        🔮 Planned
```

---

## Contributing

This is a personal project built for a CoC group of approximately 3 investigators.
Feature requests from the players are accepted.
Feature requests from the Ancient Ones are not.

---

_Ia! Ia! The Catoolu fhtagn!_ 🐙
