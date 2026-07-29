# 🐙 The Catoolu

<img alt="Catoolu banner" src="https://assets.catoolu.quest/team/f2ffcbdb-d89d-4efb-beda-b796297c3b54.png" />

### A Self-Hosted Call of Cthulhu 7e Character Manager & Lightweight VTT

> _"Ph'nglui mglw'nafh Nat-One d20 wgah'nagl Advantage."_

**The Catoolu** is a full-stack web application for running Call of Cthulhu 7th Edition sessions. It combines a full character sheet editor with a real-time virtual tabletop — so your investigators can manage their sheets, roll dice, and descend into madness together, all from a browser.

Built for home server deployment. No subscriptions, no ads, no cloud dependency. Your campaign data lives on your own machine.

![Version](https://img.shields.io/badge/version-1.7%20Eihort-3B6D11?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)
![Built with](https://img.shields.io/badge/built%20with-React%20%2B%20Express%20%2B%20PostgreSQL-4A90E2?style=flat-square)

---

## 🌐 Access

The Catoolu is available in two ways:

**catoolu.quest** — a live instance running on a personal home server.
Free to use. Sign up to create investigators and join campaigns.

Note: catoolu.quest runs on personal hardware with no uptime guarantee.
It may go down for maintenance, updates, or the occasional home server reboot.
There is no active support queue or ticket system — if something is broken,
open a GitHub issue or use the in-app bug report form.

Your data (characters, campaigns, uploads) lives on this personal server,
not a managed cloud provider. If you want your account or data removed,
contact via the email on the About page.

**Self-hosting** — the recommended path if you want full control and
reliability. See the [Self-Hosting](#-self-hosting) section below.
Your data, your server, your rules.

---

## ✨ Features

### 🔐 Authentication

- Register and login with JWT tokens (7-day sessions)
- Passwords hashed with bcrypt — never stored in plaintext
- Forgot password flow — single-use reset link via email, expires in 1 hour
- Discord OAuth and Google OAuth login (backwards compatible with password accounts)
- User profile page — change username, email, password, and profile picture
- Upload quota panel — track file storage usage

### 📋 Investigator Dashboard

- Character cards with portrait, name, occupation, SAN, and HP at a glance
- Import directly from [Dhole's House](https://www.dholes-house.de/) JSON export
- Live investigator search — filter by name or occupation
- One-click export back to Dhole's House format

### 📝 Character Editor

A full interactive CoC 7e character sheet with live rule calculations.

- **Personal Details** — name, occupation, age, gender, birthplace, residence, portrait
- **Characteristics** — all 8 core stats with auto-calculated Half / Fifth values
- **Live CoC 7e rules engine** — change STR and watch Damage Bonus, Build, and Move update instantly. Change POW and watch Sanity and Magic Points recalculate. No manual arithmetic.
- **Separate current tracking** — HP, MP, Sanity, and Luck each have an independent current value. Track damage and sanity loss mid-session.
- **Skills** — all 60+ CoC 7e skills in Dhole's House grouped layout. Occupation skill highlighting, editable subskill names, live Half/Fifth, skill search.
- **Weapons** — full weapon table with official CoC 7e preset picker. Add, edit, delete.
- **Backstory** — all 8 official fields: Traits, Ideology, Significant People, Phobias, Meaningful Locations, Treasured Possessions, Tomes & Artefacts, Description.
- **Possessions & Financial Status** — editable item list, Spending Limit, Cash, Assets.
- **Notes** — full floating notes window (draggable, resizable) with TipTap v3 rich text editor. Notes are tagged to a character or session, private per user, and accessible from the editor and campaign room.
- **Unsaved changes guard** — section-level dirty state tracking. Warning modal on navigation with Cancel / Discard / Save & Leave.

### 🎲 Campaign Room

- Real-time chat and dice rolling via Socket.io
- Hardware-entropy dice using `crypto.randomInt()` — cryptographically fair, server-side
- Advantage / Disadvantage rolls, custom notation (`2d6+3`, `1d100adv`)
- `/roll` and `/r` alias with slash-command hinting as you type
- Roll visibility — Only Me or Everyone
- Digit-box roll cards with suspense reveal (skeleton shimmer)
- Nat 1 / Nat 100 celebration with custom meme + confetti 🎉 (toggleable per device)
- **Session sheet** — clickable skills, stats, and weapons roll directly from the sheet
- Weapon attacks auto-roll damage on hit
- HP / MP / Luck / Sanity +/- popup with auto-save and live broadcast to Keeper
- Rollable Sanity and Luck — Adv/Dis aware, current value not max
- Editable money fields (Spending Limit, Cash, Assets) directly in the session sheet
- Session sheet font scale preference — adjustable in the profile dropdown, persisted across sessions
- Portrait and character name stored in message history at send time — survives character changes and page refreshes
- **Image attachments** — attach images via button or paste from clipboard, preview before sending
- **Message deletion** — delete your own messages; Keeper can delete any message
- **Roll feed** — auto-scroll stays pinned, floating "Jump to present" button when scrolled up
- **Feed background** — toggleable wallpaper texture per device

### 👁 Keeper Tools

- Keeper campaign page — manage campaigns, invite players, view and remove members
- Live player stat tracking (HP / MP / Sanity) during session
- Keeper player cards update in real time when players change their investigator
- Resizable side panel opens the full character sheet beside the player list
- ReadOnly sheet view for any registered investigator — now matches the Editor layout exactly
- Dedicated Notes tab in the Keeper panel
- **Roll requests** — ask one player or all players to roll a specific skill or stat; result is server-side and broadcasts to everyone
- **Handout library** — build a collection of images and text blocks on the campaign manage page; share into the session room with one click

### 📝 Notes System

- Floating notes window — draggable, resizable, remembers position and size
- Minimises to a pill with morph animation and spring physics
- TipTap v3 rich text — bold, italic, underline, highlight, font size, lists, alignment, colour, links
- Notes tagged to the character or campaign they were created in
- Player notes are private — Keepers cannot see them

### 📎 Handouts

- Keeper builds a handout library per campaign — images and text blocks
- Share into the room — compact chip appears in the chat feed for all players
- Players collect all shared handouts in a dedicated Handouts tab — grid or list view
- Hold-to-peek preview, full campaign history persisted across sessions
- Images sent via chat attachment are automatically added to the handout library

### 💾 File Manager

- Per-user storage quota — 200MB total, 50MB per 5 minutes
- File Manager at `/files` — browse all uploaded files with previews
- Delete individual files from R2 and quota tracking in one action
- Bulk delete with multi-select, select-all, and partial-failure retry
- Quota panel in the NavBar shows live usage

### 🧙 Character Creation Wizard (Beta)

- Step-by-step CoC 7e character creation from scratch
- Stats generated via dice rolls (3D6×5, 2D6+6×5) or point allocation
- Occupation picker with correct skill point calculations
- Occupation skill picker with modal choice system for free picks, specialty groups, and either/or choices — covering 88+ occupations
- Personal interest skill allocation with era-filtering (Modern/Classic)
- Age-based stat deductions per CoC 7e rules — STR/CON/DEX pool, APP auto-reduces, MOV penalty applied
- EDU improvement roll (1D10 per age bracket, 2–4 checks)
- Full derived stats preview before saving
- Draft resume — close the tab, come back later
- Beta badge with Dhole's House cross-check disclaimer

### 🎨 UI & Theming

- **Frosted Gem design language** — named visual identity system with 26 shared CSS classes across every button, pill, and nav element in the app
- DM Serif Display + DM Sans typography
- Catoolu Green brand identity
- Six themes — Parchment, Shale, Farmilia Dark, Marsh, Archive, Cosmic Void
- Material Symbols icon system
- Font scale system — independent sheet text and display text scales, per-device
- All preferences persist across sessions
- Focus animation system — form inputs fade to accent border with soft glow

### 🛡 Admin & Reliability

- Bug report form with screenshot upload — accessible from the NavBar dropdown
- Admin dashboard — view and resolve bug reports, toggle maintenance mode, live stats
- Maintenance flag — socket broadcast to all users, red NavBar pill with tooltip
- Server down page — shown when origin is completely unreachable
- **Error handling system** — toast notifications (5 types: success/info/warning/error/critical) with retry actions and expandable technical details. ErrorBoundary prevents white-screens. Socket error events surface to the user instead of silently hanging.
- Cloudflare Worker fallback page with Catoolu branding — shown when the tunnel itself is unreachable

### 🔧 Deployment

- Docker image-based deploy via GitHub Container Registry
- GitHub Actions CI — auto-builds `linux/amd64` + `linux/arm64` on every push to main
- Nginx reverse proxy via Cloudflare Tunnel — no open ports required
- Cloudflare R2 file storage — avatars and screenshots on CDN, survive redeployments
- Cloudflare DDNS — automatic IP updates for home server
- Cloudflare Worker — maintenance fallback page when origin is unreachable
- Dice fairness tester with chi-squared analysis

---

## 🛠️ Tech Stack

| Layer        | Technology                                          |
| ------------ | --------------------------------------------------- |
| Frontend     | React 19.2.6 + Vite + Tailwind CSS v4               |
| Backend      | Node.js + Express                                   |
| Database     | PostgreSQL 16 (JSONB)                               |
| Real-time    | Socket.io                                           |
| Auth         | JWT + bcrypt                                        |
| File Storage | Cloudflare R2                                       |
| Email        | Resend API                                          |
| Deploy       | Docker + Nginx + Cloudflare Tunnel + GitHub Actions |

---

## 🚀 Self-Hosting

### Requirements

- Docker + Docker Compose
- A domain or DuckDNS subdomain
- 1 GB RAM minimum (2 GB recommended)

### Quick Start

```bash
git clone https://github.com/Sodiumboi/Catoolu-coc-sheet-manager.git
cd Catoolu-coc-sheet-manager

cp backend/.env.example backend/.env.production
# Edit .env.production with your values

docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

Visit `http://localhost:8088` to get started.

### Environment Variables

Create `backend/.env.production`:

```env
NODE_ENV=production
PORT=3001

DB_HOST=postgres
DB_PORT=5432
DB_NAME=coc_production
DB_USER=coc_user
DB_PASSWORD=your_secure_password

JWT_SECRET=your_very_long_random_secret
JWT_EXPIRES_IN=7d

RESEND_API_KEY=re_xxxxxxxxxxxx
FROM_EMAIL=noreply@yourdomain.com
FRONTEND_URL=https://yourdomain.com

# Cloudflare R2 (file storage — required)
R2_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_32_char_s3_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=catoolu-assets
R2_PUBLIC_URL=https://assets.yourdomain.com

# OAuth (optional — remove if not using)
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_CALLBACK_URL=https://yourdomain.com/api/auth/discord/callback
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback
SESSION_SECRET=your_long_random_session_secret
```

> **R2 note:** `R2_ACCESS_KEY_ID` must be the S3-compatible access key (32 characters),
> not the Cloudflare API token format (`cfat_...`). Get it from
> R2 → Manage R2 API Tokens → your token → S3 credentials section.

### Setting Up an Admin User

After first deploy, register an account normally via the app, then grant
admin privileges directly in the database:

```bash
# Get into the postgres container
docker exec -it coc_postgres psql -U coc_user -d coc_production

# Grant admin to your account (replace with your username)
UPDATE users SET is_admin = TRUE WHERE username = 'your_username';

# Verify
SELECT id, username, is_admin FROM users WHERE username = 'your_username';

# Exit
\q
```

The admin dashboard is then accessible at `/admin` from the NavBar.

---

## 📐 CoC 7e Calculation Reference

| Derived Stat         | Formula                                            |
| -------------------- | -------------------------------------------------- |
| Max Hit Points       | `⌊(CON + SIZ) / 10⌋`                               |
| Max Magic Points     | `⌊POW / 5⌋`                                        |
| Starting Sanity      | `POW`                                              |
| Max Sanity           | `99 − Cthulhu Mythos skill`                        |
| Dodge                | `⌊DEX / 2⌋`                                        |
| Skill Half           | `⌊skill / 2⌋`                                      |
| Skill Fifth          | `⌊skill / 5⌋`                                      |
| Damage Bonus / Build | STR+SIZ table per Keeper Rulebook p.33             |
| Move Rate            | DEX/STR vs SIZ comparison per Keeper Rulebook p.34 |

---

## 🗂️ Project Structure

```
Catoolu-coc-sheet-manager/
├── frontend/
│   ├── src/
│   │   ├── pages/          # Route pages (CampaignRoomPage, FileManagerPage, etc.)
│   │   ├── components/
│   │   │   ├── sheet/      # Shared sheet module library
│   │   │   ├── handouts/   # Handout components (Library, Viewer, PlayerTab, etc.)
│   │   │   └── ...         # Other shared UI components
│   │   ├── context/        # Auth, Theme, Campaign, Toast context providers
│   │   └── utils/          # preloadImages, aboutTeam, etc.
│   └── nginx/
│       └── default.conf    # Nginx config — static + API proxy
├── backend/
│   ├── src/
│   │   ├── routes/         # REST endpoints (campaigns, handouts, profile, bugs)
│   │   ├── migrations/     # Auto-run DB migrations on startup
│   │   ├── config/         # DB, R2 client config
│   │   ├── socket.js       # Socket.io event handlers
│   │   └── utils/          # Dice engine, R2 upload, quota tracking
├── .github/
│   └── workflows/
│       └── docker-publish.yml  # CI — auto-build on push
└── docker-compose.prod.yml
```

---

## 🔒 Security Notes

- Passwords hashed with bcrypt (12 salt rounds) — never stored in plaintext
- JWT tokens expire after 7 days
- Password reset tokens are single-use and expire after 1 hour
- All dice rolls happen server-side — clients cannot influence results
- Character ownership enforced at the database query level — precise 404 vs 403 distinction
- Character and campaign URLs use UUIDs — numeric IDs never exposed
- Uploaded files stored on Cloudflare R2 with backend-controlled access
- Sensitive environment variables never committed to the repository

---

## 📜 License

MIT — do whatever you want, just don't blame me when the investigators go insane.

Call of Cthulhu is a registered trademark of Chaosium Inc.
Character sheet format based on [Dhole's House](https://www.dholes-house.de/).
This project is not affiliated with or endorsed by Chaosium Inc.

---

## 🙏 Credits

Built by **Someone at Saltlakes** with an unreasonable amount of help from **Claude** —
who patiently explained every concept from scratch, debugged every error,
and never once failed a Sanity roll despite the horrors encountered along the way.

> _This project began with zero web development experience and ended with a fully containerised,
> self-hosted full-stack application. The dice were kind._
>
> _— rolled a 02 on the final push to production._

---

_Ph'nglui mglw'nafh Nat-One d20 wgah'nagl Advantage._ 🐙
