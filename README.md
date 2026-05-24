
# 🐙 The Catoolu
<img width="3518" height="769" alt="Catoolu baner" src="https://github.com/user-attachments/assets/e9152550-067b-4385-a2e9-9634fdabaa04" />

### A Self-Hosted Call of Cthulhu 7e Character Sheet Manager

> *"Ph'nglui mglw'nafh Cthulhu R'lyeh wgah'nagl fhtagn"*
> *— and also please remember to track your sanity points.*

**The Catoolu** is a full-stack web application for managing Call of Cthulhu 7th Edition investigator sheets. Import from Dhole's House, edit everything interactively with live CoC rule calculations, track your sanity in real time, and host it yourself — because the Ancient Ones shouldn't have access to your character data either.

---

## ✨ Features

### 🔐 Authentication
- Secure registration and login with JWT tokens
- Password hashing via bcrypt (your secrets are safe, unlike your investigator's)
- Forgot password flow with email reset links (Resend SMTP)
- User profile management — change username, email, or password

### 📋 Dashboard
- Character card grid with investigator portraits, SAN, and HP at a glance
- One-click import from Dhole's House `.json` export files
- Click any card to open the full sheet

### 📝 Character Editor
- **Full sheet editing** — Personal Details, Characteristics, Skills, Weapons, Backstory, Possessions, Cash
- **Portrait upload** — Dynamic aspect ratio display, click to change
- **Live CoC 7e calculations** — Change STR and watch Damage Bonus, Build, and Move update instantly. Change POW and watch Sanity and Magic Points recalculate. No manual math required.
- **Separate current tracking** — Hit Points, Magic Points, Sanity, and Luck each have a Maximum and a Current box. Track damage, spell costs, and sanity loss mid-session.
- **Grouped skills** — Displayed in Dhole's House style with parent groups (Art/Craft, Fighting, Firearms, Language, Science) and editable subskill names
- **Skill search** — Filter 60+ skills instantly
- **Half and Fifth values** — Auto-calculated on every keystroke
- **Weapon presets** — Browse and add from an official CoC 7e weapon list covering Hand-to-Hand, Handguns, Rifles, Shotguns, Thrown, and Modern weapons
- **Add / delete weapons and possessions** — Full control over equipment
- **Editable cash fields** — Spending limit, cash on hand, and assets

### 📓 Session Notes
- Rich text editor built into the character sheet
- Bold, italic, underline, strikethrough, bullet and numbered lists
- Custom text colours with saveable swatches (stored in localStorage)
- Notes saved to the database only — clearly marked as not included in JSON export

### 🎨 UI & Theming
- **Dark theme** — brooding, parchment-gold aesthetic befitting investigators of cosmic horror
- **Parchment theme** — high-contrast cream and sepia for those who prefer their eldritch documents readable
- **Skill text size toggle** — Small, Medium, or Large — your eyes, your choice
- Theme and size preferences persist across sessions

### 📤 Import / Export
- Import any Dhole's House `.json` file directly from the dashboard
- Export back to `.json` in full Dhole's House format — compatible with other CoC tools
- Export warning if session notes exist (notes are database-only and won't appear in the file)

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS |
| **Backend** | Node.js, Express |
| **Database** | PostgreSQL 16 (character data stored as JSONB) |
| **Auth** | JWT (jsonwebtoken), bcryptjs |
| **Email** | Nodemailer + Resend SMTP |
| **Containerisation** | Docker, Docker Compose |
| **Serving** | Nginx (static frontend + API reverse proxy) |

---

## 🚀 Running Locally (Development)

### Prerequisites
- Node.js v20+ (via NVM recommended)
- PostgreSQL 16
- A Resend account (free tier) for email features

### Setup

```bash
# Clone the repository
git clone https://github.com/Sodiumboi/Catoolu-coc-sheet-manager.git
cd Catoolu-coc-sheet-manager

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

Create `backend/.env`:

```env
PORT=3001
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=coc_dev
DB_USER=your_postgres_username
DB_PASSWORD=
JWT_SECRET=your_long_random_secret_here
JWT_EXPIRES_IN=7d
RESEND_API_KEY=re_your_key_here
EMAIL_FROM=onboarding@resend.dev
FRONTEND_URL=http://localhost:5173
```

Initialise the database:

```bash
cd backend
createdb coc_dev
npm run db:init
```

Start both servers (two terminals):

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Open **http://localhost:5173**

---

## 🐳 Self-Hosting with Docker

### Prerequisites
- Docker and Docker Compose installed on your server

### Deploy

```bash
# Clone the repo on your server
git clone https://github.com/Sodiumboi/Catoolu-coc-sheet-manager.git
cd Catoolu-coc-sheet-manager

# Create production environment file
cp backend/.env.example backend/.env.production
# Edit .env.production with your values

# Build and start
docker compose up -d --build
```

The app will be available at **http://your-server-ip:8088**

### Environment Variables (Production)

| Variable | Description |
|---|---|
| `DB_PASSWORD` | PostgreSQL password — must match `docker-compose.yml` |
| `JWT_SECRET` | Long random string — generate with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `RESEND_API_KEY` | Your Resend API key |
| `FRONTEND_URL` | Your server's URL — used in password reset emails |

---

## 📐 CoC 7e Calculation Reference

The rules engine implements the following official formulas:

| Derived Stat | Formula |
|---|---|
| Max Hit Points | `⌊(CON + SIZ) / 10⌋` |
| Max Magic Points | `⌊POW / 5⌋` |
| Starting Sanity | `POW` |
| Max Sanity | `99 − Cthulhu Mythos skill` |
| Dodge | `⌊DEX / 2⌋` |
| Skill Half | `⌊skill / 2⌋` |
| Skill Fifth | `⌊skill / 5⌋` |
| Damage Bonus / Build | STR+SIZ table per Keeper Rulebook p.33 |
| Move Rate | DEX/STR vs SIZ comparison per Keeper Rulebook p.34 |

---

## 🗂️ Project Structure

```
catoolu-coc-sheet-manager/
├── backend/
│   ├── src/
│   │   ├── config/        ← Database + email setup
│   │   ├── middleware/    ← JWT authentication
│   │   └── routes/        ← Auth, characters, profile API
│   ├── sql/
│   │   └── schema.sql     ← PostgreSQL schema
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/           ← Axios client with interceptors
│   │   ├── components/    ← Reusable UI components
│   │   ├── context/       ← Auth + Theme context providers
│   │   ├── pages/         ← Login, Dashboard, Editor, Profile
│   │   └── utils/         ← CoC rules engine, weapon presets
│   ├── nginx/
│   │   └── default.conf   ← Nginx config for API proxying
│   └── Dockerfile
└── docker-compose.yml
```

---

## 🔒 Security Notes

- Passwords are hashed with bcrypt (12 salt rounds) — never stored in plaintext
- JWT tokens expire after 7 days
- Password reset tokens are single-use and expire after 1 hour
- Each user can only access their own characters — ownership is enforced at the database query level
- Sensitive environment variables (passwords, JWT secret, API keys) are never committed to the repository

---

## 📜 License

This project is for personal and educational use.
Call of Cthulhu is a registered trademark of Chaosium Inc.
Character sheet format based on Dhole's House (dholeshouse.org).
This project is not affiliated with or endorsed by Chaosium Inc.

---

## 🙏 Credits

Built by **Someone at Saltlakes** with an unreasonable amount of help from **Claude** —
who patiently explained every concept from scratch, debugged every error,
and never once failed a Sanity roll despite the horrors encountered along the way.


> *This project began with zero web development experience and ended with a fully containerised,
> self-hosted full-stack application. The dice were kind.*
>
> *— rolled a 02 on the final push to production.*

---

*"Ph'nglui mglw'nafh Nat-One d20 wgah'nagl Advantage."* 🐙
