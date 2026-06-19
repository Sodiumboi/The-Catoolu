import { useState } from 'react';
import logo from '../assets/vault-logo.png';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import { TEAM_MEMBERS } from '../utils/aboutTeam';

const VERSION    = 'V1.6a · Atlach-Nacha - Jade Palace';
const GITHUB_URL = 'https://github.com/Sodiumboi/Catoolu-coc-sheet-manager';

// ── Localised content ────────────────────────────────────────────────
const CONTENT = {
  en: {
    teamTitle:   'The Team Behind The Catoolu',
    teamEmpty:   'Lineup to be announced.',
    whatTitle:   'What is The Catoolu',
    what1:       'Catoolu is a character manager for Call of Cthulhu — 7th edition. It has tools for building investigator characters, creating Keeper campaign rooms, rolling dice in them, or just tracking HP, Sanity, Magic Points and Luck during a session.',
    what2:       'There\'s also a campaign room view where Keepers can pull up any player\'s sheet mid-session, share notes or clues, and watch stats update in real time over websocket.',
    whyTitle:    'Why it exists',
    why1:        'Every CoC character sheet method I found was either a dumb PDF that\'s hard to organise and always gets lost, or a website with an interface that\'s painful to use.',
    why2:        'Catoolu runs on a VPS I built, control, and run myself. No subscription. No cross-site tracking. Your characters live in a Postgres database on my server — so if I ever shut it down, you just export your JSON and walk. Or spin up the project yourself. (GitHub is right there.)',
    why3:        'That\'s the goal — play your way, control your own stuff, depend on no one. Not even me. Take it apart, hack it, make it yours.',
    whoTitle:    'Who built it',
    who1:        'Hey there!',
    who2:        'I\'m Someone at Saltlakes — call me \'K\'. Started out as a CoC player, became a developer second, and somehow ended up writing character sheet software instead of actually playing Call of Cthulhu.',
    who6:        'It started when I was complaining to Alistair after his one-shot campaign — "these notes on paper are definitely going to get lost." He said, "well what are you going to do about it? We don\'t have Foundry."',
    who3:        'So I just went and built the thing myself. (Instead of buying Foundry like a normal person — would\'ve saved me the headache, haha.) I\'d been wanting to try building a web app anyway, so I made something for my group — and figured if anyone else wanted to use it, they could too.',
    who4:        'This site would not exist without Claude. I\'m still kind of amazed that the fastest, lowest-tier AI model could push something like this out. Me and this whole site started from zero — I\'d never studied or written JavaScript, never touched Socket.IO. Claude taught me all of it. Every design decision, every bug, every "why won\'t this box center" went through that guy. (haha)',
    who5:        'But even though the whole site was written with AI, I can promise you: every colour pair, every design, every piece of artwork is the work of real humans with their own dreams — friends I personally know, people who actually exist. Here, we value art. We value creativity.',
    stackTitle:  'The stack',
    stackIntro:  'For the curious and the nosy — nothing exotic here. Just stuff that works.',
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
    why2:        'ซึ่ง Catoolu ตัวนี้รันบน VPS ที่ผมทำเอง คุมเอง เปิดเอง ก็เลย ไม่มีค่าสมัครสมาชิก ไม่มีการ track ข้ามเว็ป ตัวละครของคุณอยู่ในฐานข้อมูล Postgres บนเครื่องเซิฟเวอร์ เพราะงั้นถ้าผมปิดตัวลงในสักวัน คุณก็แค่ export JSON แล้วเดินจากไปได้เลย หรือจะเอาโปรเจ็คนี้เปิดเองก็ได้เช่นกัน (เชิญที่ Guithub เลยคับ)',
    why3:        'เป้าหมายผมครับ — เล่นเอง คุมเอง ไม่ต้องพึ่งใคร(ไม่ต้องพึ่งผมด้วยซ้ำ เอาไปซน งัดแงะได้เต็มที่)',
    whoTitle:    'ใครสร้างเจ้านี่ขึ้นมา',
    who1:        'หวัดดีค้าบ!',
    who2:        'ผม Someone at Saltlakes จะเรียกว่า \'K\' ก็ได้คับ — ตอนแรกเป็นคนเล่น CoC ก่อน แล้วตอนนี้ก็นักพัฒนาทีหลัง และตอนนี้ดูเหมือนกลายเป็นคนเขียนซอฟต์แวร์ชีทตัวละครแทนที่จะได้เล่น Call of Cthulhu จริงๆ',
    who6:        'จริงก็คือผมบ่นกับ Consultant หลังเล่น แคมเปญ OneShot ของแกจบว่า "จดลง PDF แบบนี้หายแน่" เค้าก็เลยบอก "เอ้า แล้วคุณจะทำไงอ่ะ เราไม่มี Foundry นิ"',
    who3:        'ผมก็เลยควักเงินสร้างเว็ปเองมันซะเลย (แทนที่จะซึ้อ Foundry แต่แรก ไม่ต้องมานั่งปวดหัว ฮ่า) ซึ่งประกอบกับผมอยากลองทำ web app อยู่แล้ว ทำมาเอามาใช้กับกลุ่มของผม และก็ไว้เผื่อคนอื่นอยากใช้ด้วย ก็เลยกลายเป็นโปรเจ็คนี้มาฮะ',
    who4:        'ซึ่งเว็ปนี้จะไม่ได้เกิดถ้าไม่มีความช่วยเหลือจากลูกพี่ผม Claude คือผมอื้งมากกับการที่ว่า Ai ตัวไวสุด ความสามารถต่ำสุด สามารถเข็นเว็ปนี้ออกมาได้ คือทั้งเว็ปนี้และผมเริ่มจาก 0 นะครับ ผมไม่เคยเรียนหรือเขียน javascript หรือเรื่องการสื่อสาร Socket.IO งี้ก็ไม่เคยเลย ได้ Claude นี่แหละสอน ก็คือทุกดีไซน์ ทุกบั๊ก ทุก "ทำไมกล่องนี้ไม่อยู่ตรงกลางวะ" ผ่านลูกพี่คนนี้หมด (ฮ่า)',
    who5:        'แต่แม้ว่าทั้งเว็ปจะถูกเขียนด้วย Ai แต่ผมขอรับรองว่า ทุกคู่สี ทุกการออกแบบ ทุกงานวาด เป็นฝีมือของมนุษย์ที่มีความฝันเป็นของตัวเอง เป็นเพื่อนของผมที่ผมรู้จัก มีตัวตนจับต้องได้ ที่นี่เราให้ค่างานศิลป์ ให้ค่าความคิดสร้างสรรค์ครับ',
    stackTitle:  'Tech stack',
    stackIntro:  'สำหรับคนที่อยากรู้ อยากซน ก็ไม่มีอะไรน่าสนใจหรอกครับ — แค่ใช้แล้วเวิร์ก',
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
    <section style={{ marginBottom: '2.5rem' }}>
      <h2 style={{
        fontFamily:    'var(--font-serif)',
        fontSize:      '1.35rem',
        color:         'var(--color-primary-dark)',
        margin:        '0 0 0.75rem',
        paddingBottom: '0.5rem',
        borderBottom:  '1px solid var(--border-main)',
      }}>
        {title}
      </h2>
      <div style={{
        fontFamily: 'var(--font-sans)',
        fontSize:   '0.95rem',
        color:      'var(--text-secondary)',
        lineHeight: 1.7,
      }}>
        {children}
      </div>
    </section>
  );
}

function Tag({ children }) {
  return (
    <span style={{
      display:      'inline-block',
      padding:      '3px 10px',
      borderRadius: '6px',
      border:       '1px solid var(--border-input)',
      background:   'var(--bg-section-hd)',
      fontFamily:   'var(--font-sans)',
      fontSize:     '0.8rem',
      color:        'var(--text-muted)',
      marginRight:  '6px',
      marginBottom: '6px',
    }}>
      {children}
    </span>
  );
}

function TeamCard({ name, role, badge, avatar }) {
  return (
    <div style={{
      background:    'var(--bg-card)',
      border:        '1px solid var(--border-main)',
      borderRadius:  '12px',
      boxShadow:     'var(--shadow-card)',
      padding:       '1.5rem 1rem 1.25rem',
      display:       'flex',
      flexDirection: 'column',
      alignItems:    'center',
      gap:           '0.55rem',
      textAlign:     'center',
    }}>
      <div style={{
        width:          '72px',
        height:         '72px',
        borderRadius:   '10px',
        background:     'var(--bg-section-hd)',
        border:         '1px solid var(--border-input)',
        overflow:       'hidden',
        flexShrink:     0,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        fontSize:       '1.6rem',
        color:          'var(--text-faint)',
      }}>
        {avatar
          ? <img src={avatar} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : '?'
        }
      </div>
      <div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 600 }}>
          {name}
        </div>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
          {role}
        </div>
      </div>
      {badge && (
        <span style={{
          display:       'inline-block',
          padding:       '2px 12px',
          borderRadius:  '6px',
          background:    'var(--accent-bg)',
          border:        '1px solid var(--color-primary-mid)',
          fontFamily:    'var(--font-sans)',
          fontSize:      '0.72rem',
          fontWeight:    600,
          color:         'var(--color-primary)',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>
          {badge}
        </span>
      )}
    </div>
  );
}


function GitHubIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ flexShrink: 0, display: 'block' }}>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
    </svg>
  );
}

function LangSwitcher({ lang, setLang }) {
  return (
    <div style={{
      display:      'flex',
      alignItems:   'center',
      gap:          '2px',
      background:   'var(--bg-section-hd)',
      border:       '1px solid var(--border-input)',
      borderRadius: '20px',
      padding:      '2px',
    }}>
      {['en', 'th'].map(l => (
        <button
          key={l}
          onClick={() => setLang(l)}
          style={{
            padding:      '3px 12px',
            borderRadius: '20px',
            border:       'none',
            background:   lang === l ? 'var(--color-primary)' : 'transparent',
            color:        lang === l ? '#fff' : 'var(--text-muted)',
            fontFamily:   'var(--font-sans)',
            fontSize:     '0.72rem',
            fontWeight:   600,
            letterSpacing:'0.05em',
            textTransform:'uppercase',
            cursor:       lang === l ? 'default' : 'pointer',
            transition:   'background 0.15s, color 0.15s',
          }}
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-page)' }}>

      <NavBar />

      {/* ── Page header ── */}
      <header style={{ padding: '2rem 1.5rem 0', maxWidth: '720px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
          <img src={logo} alt="The Catoolu" style={{ width: '52px', height: '52px', objectFit: 'contain', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontFamily: 'var(--font-serif)',
              fontSize:   '1.8rem',
              color:      'var(--color-primary-dark)',
              margin:     '0 0 0.35rem',
            }}>
              The Catoolu
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{
                display:      'inline-block',
                padding:      '2px 10px',
                borderRadius: '20px',
                background:   'var(--accent-bg)',
                border:       '1px solid var(--color-primary)',
                fontFamily:   'var(--font-sans)',
                fontSize:     '0.75rem',
                fontWeight:   600,
                color:        'var(--color-primary)',
                letterSpacing:'0.04em',
              }}>
                {VERSION}
              </span>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display:        'inline-flex',
                  alignItems:     'center',
                  gap:            '5px',
                  padding:        '2px 10px',
                  borderRadius:   '20px',
                  background:     'var(--bg-section-hd)',
                  border:         '1px solid var(--border-input)',
                  fontFamily:     'var(--font-sans)',
                  fontSize:       '0.75rem',
                  fontWeight:     600,
                  color:          'var(--text-muted)',
                  textDecoration: 'none',
                  letterSpacing:  '0.02em',
                  transition:     'border-color 0.15s, color 0.15s',
                }}
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
      <div style={{ width: '100%', maxWidth: '960px', margin: '0 auto', padding: '0 1.5rem 2.5rem', boxSizing: 'border-box' }}>
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-main)' }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
              <circle cx="6.5" cy="6.5" r="5.5" stroke="var(--text-faint)" strokeWidth="1.5" />
            </svg>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', color: 'var(--color-primary-dark)', margin: 0 }}>
              {t.teamTitle}
            </h2>
          </div>
          {TEAM_MEMBERS.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${TEAM_MEMBERS.length}, 1fr)`, gap: '0.75rem' }}>
              {TEAM_MEMBERS.map(m => <TeamCard key={m.name} {...m} />)}
            </div>
          ) : (
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9rem', color: 'var(--text-faint)', fontStyle: 'italic', margin: 0 }}>
              {t.teamEmpty}
            </p>
          )}
        </section>
      </div>

      {/* ── Rest of content ── */}
      <main style={{ flex: 1, maxWidth: '720px', width: '100%', margin: '0 auto', padding: '0 1.5rem 4rem', boxSizing: 'border-box' }}>

        <Section title={t.whatTitle}>
          <p style={{ margin: '0 0 0.75rem' }}>{t.what1}</p>
          <p style={{ margin: 0 }}>{t.what2}</p>
        </Section>

        <Section title={t.whyTitle}>
          <p style={{ margin: '0 0 0.75rem' }}>{t.why1}</p>
          <p style={{ margin: '0 0 0.75rem' }}>{t.why2}</p>
          <p style={{ margin: 0 }}>{t.why3}</p>
        </Section>

        <Section title={t.whoTitle}>
          <p style={{ margin: '0 0 0.75rem' }}>{t.who1}</p>
          <p style={{ margin: '0 0 0.75rem' }}>{t.who2}</p>
          <p style={{ margin: '0 0 0.75rem' }}>{t.who6}</p>
          <p style={{ margin: '0 0 0.75rem' }}>{t.who3}</p>
          <p style={{ margin: '0 0 0.75rem' }}>{t.who4}</p>
          {/* ── Monument statement for the artists ── */}
          <div style={{
            margin:       '1.75rem 0 0',
            padding:      '1.25rem 0.5rem 1.5rem',
            borderTop:    '1px solid var(--border-main)',
            borderBottom: '1px solid var(--border-main)',
            textAlign:    'center',
          }}>
            <div style={{
              fontSize:      '0.7rem',
              letterSpacing: '0.35em',
              color:         'var(--text-faint)',
              marginBottom:  '0.9rem',
            }}>
              ✦
            </div>
            <p style={{
              margin:     0,
              fontStyle:  'italic',
              fontFamily: 'var(--font-sans)',
              fontSize:   '0.9rem',
              color:      'var(--text-muted)',
              lineHeight: 1.9,
            }}>
              {t.who5}
            </p>
          </div>
        </Section>

        <Section title={t.stackTitle}>
          <p style={{ margin: '0 0 1rem' }}>{t.stackIntro}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
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
          <p style={{ margin: 0 }}>
            {t.contact}{' '}
            Reach out at{' '}
            <a
              href="mailto:whydontyoumarry@gmail.com"
              style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}
              onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline'; }}
              onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none'; }}
            >
              {t.contactLink}
            </a>
            {'. '}{t.contactPost}
          </p>
          <p style={{ margin: 0 }}>
            {t.contactGitHub}{' '}
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}
              onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline'; }}
              onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none'; }}
            >
              GitHub
            </a>.
          </p>
        </Section>

        <Section title={t.creditsTitle}>
          <p style={{ margin: '0 0 0.6rem' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Call of Cthulhu</strong>{' '}{t.credits1}
          </p>
          <p style={{ margin: '0 0 0.6rem' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Dhole's House</strong>{' '}{t.credits2}
          </p>
          <p style={{ margin: 0 }}>
            <strong style={{ color: 'var(--text-primary)' }}>Claude</strong>{' '}{t.credits3}
          </p>
        </Section>

      </main>

      <Footer />
    </div>
  );
}
