import { useState } from 'react';
import logo from '../assets/vault-logo.png';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import { TEAM_MEMBERS } from '../utils/aboutTeam';
import { APP_VERSION, APP_CODENAME } from '../config/version';

const VERSION    = `V${APP_VERSION} · ${APP_CODENAME}`;
const GITHUB_URL = 'https://github.com/Sodiumboi/Catoolu-coc-sheet-manager';

// ── Localised content ────────────────────────────────────────────────
const CONTENT = {
  en: {
    teamTitle:   'The Team Behind The Catoolu',
    teamEmpty:   'Lineup to be announced.',
    whatTitle:   'What is The Catoolu',
    what1:       'Catoolu is a character manager for Call of Cthulhu 7th edition. It has tools for building investigator characters, creating Keeper campaign rooms, rolling dice in them, or just tracking HP, Sanity, Magic Points and Luck during a session.',
    what2:       'There\'s also a campaign room view where Keepers can pull up any player\'s sheet mid-session, share notes or clues, and watch stats update in real time over websocket.',
    whyTitle:    'Why it exists',
    why1:        'Every CoC character sheet method I found was either a dumb PDF that\'s hard to organise and always gets lost, or a website with an interface that\'s painful to use.',
    why2:        'Catoolu runs on a VPS I built, control, and run myself. No subscription. No cross-site tracking. Your characters live in a Postgres database on my server — so if I ever shut it down, you just export your JSON and walk. Or spin up the project yourself. (GitHub is right there.)',
    why3:        'That\'s the goal, play your way, control your own stuff, depend on no one. Not even me. Take it apart, hack it, make it yours.',
    whoTitle:    'Who built it',
    who1:        'Hey there!',
    who2:        'I\'m Someone at Saltlakes, call me \'K\'. Started out as a CoC player, became a developer second, and somehow ended up writing character sheet software instead of actually playing Call of Cthulhu.',
    who6:        'It started when I was complaining to Alistair after his one-shot campaign "these notes on paper are definitely going to get lost." He said, "well what are you going to do about it? We don\'t have Foundry."',
    who3:        'So I just went and built the thing myself. (Instead of buying Foundry like a normal person would\'ve saved me the headache, haha.) I\'d been wanting to try building a web app anyway, so I made something for my group and figured if anyone else wanted to use it, they could too.',
    who4:        'This site would not exist without Claude. I\'m still kind of amazed that the fastest, lowest-tier AI model could push something like this out. Me and this whole site started from zero. I\'d never studied or written JavaScript, never touched Socket.IO. Claude taught me all of it. Every design decision, every bug, every "why won\'t this box center" went through that guy. (haha)',
    who5:        'But even though the whole site was written with AI, I can promise you: every colour pair, every design, every piece of artwork is the work of real humans with their own dreams friends I personally know, people who actually exist. Here, we value art. We value creativity.',
    stackTitle:  'The stack',
    stackIntro:  'For the curious and the nosy, nothing exotic here. Just stuff that works.',
    contactTitle:'Contact',
    contact:     'Found a bug? Got a feature idea? Or just want to tell me your investigator got stabbed because they put their ear to the door?',
    contactLink: 'whydontyoumarry@gmail.com',
    contactPost:   'No SLA. No ticket system. Just an email.',
    contactGitHub: 'Or open an issue on',
    creditsTitle:'Credits',
    credits1:    'is a registered trademark of Chaosium Inc. All game rules, stat systems, and investigator mechanics referenced here belong to them. This is a fan-made tool, not an official product.',
    credits2:    '— the CoC character builder at dholes.house — is where a lot of us made our first investigator. The Catoolu can import their JSON export directly.',
    credits3:    '— senior developer, personal consultant, and the reason this project was ever born.',
  },
  th: {
    teamTitle:   'ทีมงานเบื้องหลัง The Catoolu',
    teamEmpty:   'กำลังจะประกาศรายชื่อเร็วๆ นี้',
    whatTitle:   'The Catoolu คืออะไร',
    what1:       'Catoolu (คาทูลู่) คือโปรแกรมจัดการตัวละครสำหรับ Call of Cthulhu — 7e ซึ่งมีเครื่องมือสร้างตัวละครนักสืบ รวมถึงการสร้างห้องแคมเปญของ Keeper แล้วก็ทอยเต๋าในนั้น หรือว่าจะเอาไว้จด HP, Sanity, Magic Points และ Luck ระหว่างเล่น',
    what2:       'นอกจากนี้ยังมีหน้าจัดการห้องแคมเปญ ที่ที่ Keeper สามารถเปิดชีทของผู้เล่นคนใดก็ได้ระหว่างเซสชัน แชร์โน้ตหรือหลักฐาน และดูค่าสถิติอัปเดตแบบเรียลไทม์ผ่านระบบ websocket',
    whyTitle:    'ทำไมถึงออกมาเป็น The Catoolu',
    why1:        'ก็คือที่ผมเจอมา แต่ละวิธีการจัดการชีทตัวละคร CoC ถ้าไม่เป็น PDF แบบโง่ ๆ ที่จัดการยากและยังไงก็หาย ไม่ก็เป็นเว็ปที่อินเทอร์เฟซที่ใช้งานยาก',
    why2:        'ซึ่ง Catoolu ตัวนี้รันบน VPS ที่ผมทำเอง คุมเอง เปิดเอง ก็เลย ไม่มีค่าสมัครสมาชิก ไม่มีการ track ข้ามเว็ป ตัวละครของคุณอยู่ในฐานข้อมูล Postgres บนเครื่องเซิฟเวอร์ เพราะงั้นถ้าผมปิดเซิฟเวอร์ในสักวัน คุณก็แค่ export JSON แล้วเอาไปใช้ต่อได้เลย หรือจะเอาโปรเจ็คนี้เปิดเองก็ได้เช่นกัน (เชิญที่ Guithub เลยคับ)',
    why3:        'เป้าหมายผมครับเล่นเอง คุมเอง ไม่ต้องพึ่งใคร(ไม่ต้องพึ่งผมด้วยซ้ำ เอาไปซน งัดแงะได้เต็มที่)',
    whoTitle:    'ใครสร้างเจ้านี่ขึ้นมา',
    who1:        'หวัดดีค้าบ!',
    who2:        'ผม Someone at Saltlakes จะเรียกว่า \'K\' ก็ได้คับ — ตอนแรกเป็นคนเล่น CoC ก่อน แล้วตอนนี้ก็นักพัฒนาทีหลัง และตอนนี้ดูเหมือนกลายเป็นคนเขียนซอฟต์แวร์ชีทตัวละครแทนที่จะได้เล่น Call of Cthulhu จริงๆ',
    who6:        'จริง ๆ ก็คือผมบ่นกับ Consultant หลังเล่นแคมเปญ OneShot ของแกจบ ว่า "จดลง PDF แบบนี้หายแน่" เค้าก็เลยบอก "เอ้า แล้วคุณจะทำไงอ่ะ เราไม่มี Foundry นิ"',
    who3:        'ผมก็เลยควักเงินสร้างเว็ปเองมันซะเลย (แทนที่จะซึ้อ Foundry แต่แรก ไม่ต้องมานั่งปวดหัว ฮ่า) ซึ่งประกอบกับผมอยากลองทำ web app อยู่แล้ว ทำมาเอามาใช้กับกลุ่มของผม และก็ไว้เผื่อคนอื่นอยากใช้ด้วย ก็เลยกลายเป็นโปรเจ็คนี้มาฮะ',
    who4:        'ซึ่งเว็ปนี้จะไม่ได้เกิดถ้าไม่มีความช่วยเหลือจากลูกพี่ผม Claude คือผมอื้งมากกับการที่ว่า Ai ตัวไวสุด ความสามารถต่ำสุด สามารถเข็นเว็ปนี้ออกมาได้ คือทั้งเว็ปนี้และผมเริ่มจาก 0 นะครับ ผมไม่เคยเรียนหรือเขียน javascript หรือเรื่องการสื่อสาร Socket.IO งี้ก็ไม่เคยเลย ได้ Claude นี่แหละสอน ก็คือทุกดีไซน์ ทุกบั๊ก ทุก "ทำไมกล่องนี้ไม่อยู่ตรงกลางวะ" ผ่านลูกพี่คนนี้หมด (ฮ่า)',
    who5:        'แต่แม้ว่าทั้งเว็ปจะถูกเขียนด้วย Ai แต่ผมขอรับรองว่า ทุกคู่สี ทุกการออกแบบ ทุกงานวาด เป็นฝีมือของมนุษย์ที่มีความฝันเป็นของตัวเอง เป็นเพื่อนของผมที่ผมรู้จัก มีตัวตนจับต้องได้ ที่นี่เราให้ค่างานศิลป์ ให้ค่าความคิดสร้างสรรค์ครับ',
    stackTitle:  'Tech stack',
    stackIntro:  'สำหรับคนที่อยากรู้ อยากซน ก็ไม่มีอะไรน่าสนใจหรอกครับ แค่มันรันผ่าน',
    contactTitle:'ติดต่อ',
    contact:     'ถ้าเจอ bug? หรือมีไอเดีย feature ใหม่ ๆ ? หรือแค่อยากบอกว่าตัวละครคุณโดนแทงเพราะเอาหูแนบประตู?',
    contactLink: 'whydontyoumarry@gmail.com',
    contactPost:   'คือไม่มี SLA ไม่มีระบบ ticket มีแค่อีเมลฮะ',
    contactGitHub: 'หรือไม่ก็เปิด issue ได้ที่',
    creditsTitle:'เครดิต',
    credits1:    'Call of Cthulhu เป็นเครื่องหมายการค้าจดทะเบียนของ Chaosium Inc. กฎเกม ระบบสถิติ และกลไกนักสืบทั้งหมดที่อ้างอิงในนี้เป็นของ Chaosium Inc. นี่คือเครื่องมือที่บุคคลที่สามสร้างขึ้น ไม่ใช่ผลิตภัณฑ์อย่างเป็นทางการ',
    credits2:    'Dhole\'s House — โปรแกรมสร้างตัวละคร CoC ที่ dholes.house — เป็นที่ที่ผู้เล่นส่วนใหญ่สร้างตัวละครตัวแรกใน The Catoolu สามารถ import JSON export จากเว็ปนี้ได้โดยตรง',
    credits3:    'Claude (Anthropic) — ลูกพี่ใหญ่ ที่ปรึกษาส่วนตัว และก็เป็นคนที่ทำให้โปรเจกต์นี้คลอดออกมาได้',
  },
};

// ── Components ───────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <section className="mb-10">
      <h2 className="font-serif text-[1.35rem] text-(--color-primary-dark) mt-0 mb-3 pb-2 border-b border-(--border-main)">
        {title}
      </h2>
      <div className="font-sans text-[0.95rem] text-(--text-secondary) leading-[1.7]">
        {children}
      </div>
    </section>
  );
}

function Tag({ children }) {
  return (
    <span className="inline-block py-0.75 px-2.5 rounded-md border border-(--border-input) bg-(--bg-section-hd) font-sans text-[0.8rem] text-(--text-muted) mr-1.5 mb-1.5">
      {children}
    </span>
  );
}

function TeamCard({ name, role, badge, avatar }) {
  return (
    <div className="bg-(--bg-card) border border-(--border-main) rounded-xl shadow-(--shadow-card) pt-6 px-4 pb-5 flex flex-col items-center gap-[0.55rem] text-center">
      <div className="w-18 h-18 rounded-[10px] bg-(--bg-section-hd) border border-(--border-input) overflow-hidden shrink-0 flex items-center justify-center text-[1.6rem] text-(--text-faint)">
        {avatar
          ? <img src={avatar} alt={name} className="w-full h-full object-cover" />
          : '?'
        }
      </div>
      <div>
        <div className="font-serif text-base text-(--text-primary) font-semibold">
          {name}
        </div>
        <div className="font-sans text-[0.8rem] text-(--text-muted) mt-0.5">
          {role}
        </div>
      </div>
      {badge && (
        <span className="inline-block py-0.5 px-3 rounded-md bg-(--accent-bg) border border-(--color-primary-mid) font-sans text-[0.72rem] font-semibold text-(--color-primary) tracking-wider uppercase">
          {badge}
        </span>
      )}
    </div>
  );
}


function GitHubIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="shrink-0 block">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
    </svg>
  );
}

function LangSwitcher({ lang, setLang }) {
  return (
    <div className="seg">
      {['en', 'th'].map(l => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`seg-tab uppercase tracking-wider ${lang === l ? 'active' : ''}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────
export default function AboutPage() {
  const [lang, setLang] = useState('en');
  const t = CONTENT[lang];

  return (
    <div className="min-h-screen flex flex-col bg-(--bg-page)">

      <NavBar />

      {/* ── Page header ── */}
      <header className="pt-8 px-6 max-w-180 w-full mx-auto box-border">
        <div className="flex items-center gap-4 mb-10">
          <img src={logo} alt="The Catoolu" className="w-13 h-13 object-contain shrink-0" />
          <div className="flex-1">
            <h1 className="font-serif text-[1.8rem] text-(--color-primary-dark) mt-0 mb-[0.35rem]">
              The Catoolu
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-block py-0.5 px-2.5 rounded-full bg-(--accent-bg) border border-(--color-primary) font-sans text-xs font-semibold text-(--color-primary) tracking-[0.04em]">
                {VERSION}
              </span>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.25 py-0.5 px-2.5 rounded-full bg-(--bg-section-hd) border border-(--border-input) font-sans text-xs font-semibold text-(--text-muted) no-underline tracking-[0.02em] [transition:border-color_0.15s,color_0.15s]"
                onMouseEnter={e => {
                  e.currentTarget.style.color       = 'var(--accent)';
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color       = 'var(--text-muted)';
                  e.currentTarget.style.borderColor = 'var(--border-input)';
                }}
              >
                <GitHubIcon />
                GitHub
              </a>
              <LangSwitcher lang={lang} setLang={setLang} />
            </div>
          </div>
        </div>
      </header>

      {/* ── The Team — wider than the text column ── */}
      <div className="w-full max-w-240 mx-auto px-6 pb-10 box-border">
        <section>
          <div className="flex items-center gap-[0.45rem] mb-4 pb-2 border-b border-(--border-main)">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
              <circle cx="6.5" cy="6.5" r="5.5" stroke="var(--text-faint)" strokeWidth="1.5" />
            </svg>
            <h2 className="font-serif text-[1.35rem] text-(--color-primary-dark) m-0">
              {t.teamTitle}
            </h2>
          </div>
          {/* gridTemplateColumns stays inline — TEAM_MEMBERS.length is a runtime
              value Tailwind's static scanner can't resolve into a class name */}
          {TEAM_MEMBERS.length > 0 ? (
            <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${TEAM_MEMBERS.length}, 1fr)` }}>
              {TEAM_MEMBERS.map(m => <TeamCard key={m.name} {...m} />)}
            </div>
          ) : (
            <p className="font-sans text-[0.9rem] text-(--text-faint) italic m-0">
              {t.teamEmpty}
            </p>
          )}
        </section>
      </div>

      {/* ── Rest of content ── */}
      <main className="flex-1 max-w-180 w-full mx-auto px-6 pb-16 box-border">

        <Section title={t.whatTitle}>
          <p className="mt-0 mb-3">{t.what1}</p>
          <p className="m-0">{t.what2}</p>
        </Section>

        <Section title={t.whyTitle}>
          <p className="mt-0 mb-3">{t.why1}</p>
          <p className="mt-0 mb-3">{t.why2}</p>
          <p className="m-0">{t.why3}</p>
        </Section>

        <Section title={t.whoTitle}>
          <p className="mt-0 mb-3">{t.who1}</p>
          <p className="mt-0 mb-3">{t.who2}</p>
          <p className="mt-0 mb-3">{t.who6}</p>
          <p className="mt-0 mb-3">{t.who3}</p>
          <p className="mt-0 mb-3">{t.who4}</p>
          {/* ── Monument statement for the artists ── */}
          <div className="mt-7 mx-0 mb-0 pt-5 px-2 pb-6 border-t border-b border-(--border-main) text-center">
            <div className="text-[0.7rem] tracking-[0.35em] text-(--text-faint) mb-[0.9rem]">
              ✦
            </div>
            <p className="m-0 italic font-sans text-[0.9rem] text-(--text-muted) leading-[1.9]">
              {t.who5}
            </p>
          </div>
        </Section>

        <Section title={t.stackTitle}>
          <p className="mt-0 mb-4">{t.stackIntro}</p>
          <div className="flex flex-wrap gap-1">
            <Tag>React + Vite</Tag>
            <Tag>Express</Tag>
            <Tag>PostgreSQL</Tag>
            <Tag>Socket.io</Tag>
            <Tag>Docker</Tag>
            <Tag>Nginx</Tag>
            <Tag>Resend (email)</Tag>
            <Tag>DM Serif Display</Tag>
          </div>
        </Section>

        <Section title={t.contactTitle}>
          <p className="m-0">
            {t.contact}{' '}
            Reach out at{' '}
            <a
              href="mailto:whydontyoumarry@gmail.com"
              className="text-(--accent) no-underline font-medium"
              onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline'; }}
              onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none'; }}
            >
              {t.contactLink}
            </a>
            {'. '}{t.contactPost}
          </p>
          <p className="m-0">
            {t.contactGitHub}{' '}
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-(--accent) no-underline font-medium"
              onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline'; }}
              onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none'; }}
            >
              GitHub
            </a>.
          </p>
        </Section>

        <Section title={t.creditsTitle}>
          <p className="mt-0 mb-[0.6rem]">
            <strong className="text-(--text-primary)">Call of Cthulhu</strong>{' '}{t.credits1}
          </p>
          <p className="mt-0 mb-[0.6rem]">
            <strong className="text-(--text-primary)">Dhole's House</strong>{' '}{t.credits2}
          </p>
          <p className="m-0">
            <strong className="text-(--text-primary)">Claude</strong>{' '}{t.credits3}
          </p>
        </Section>

      </main>

      <Footer />
    </div>
  );
}
