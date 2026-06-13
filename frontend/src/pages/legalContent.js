// Legal page content — TOS + Privacy Policy in EN and TH.
// Block types:
//   p          — paragraph, { text, email? } (email appended as mailto link)
//   emphasis   — important/bold paragraph, { text }
//   disclaimer — muted italic note, { text }
//   ul         — list, { items: string[] | [{label, text}] }
//   subgroup   — mini-heading + list, { heading, items: string[] }
//   table      — data table, { headers, rows }
//   email      — standalone email link line, { address }

export const content = {
  tos: {
    en: {
      title:   'Terms of Service',
      updated: 'June 2026',
      sections: [
        {
          num: 1,
          heading: 'Acceptance of Terms',
          blocks: [
            { type: 'p', text: 'By accessing or using The Catoolu ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.' },
          ],
        },
        {
          num: 2,
          heading: 'What The Catoolu Is',
          blocks: [
            { type: 'p', text: 'The Catoolu is a self-hosted, non-commercial web application for playing Call of Cthulhu 7th Edition tabletop roleplaying game. It allows users to create and manage investigator character sheets, join campaign rooms, roll dice, and track game statistics during live sessions.' },
            { type: 'disclaimer', text: 'The Catoolu is not affiliated with Chaosium Inc. or the official Call of Cthulhu product line. Call of Cthulhu is a registered trademark of Chaosium Inc.' },
          ],
        },
        {
          num: 3,
          heading: 'User Accounts',
          blocks: [
            { type: 'p', text: 'To use The Catoolu you must create an account. By doing so you agree to:' },
            { type: 'ul', items: [
              'Be at least 13 years of age',
              'Provide accurate and truthful information',
              'Keep your account credentials secure and not share them with others',
              'Be responsible for all activity that occurs under your account',
            ]},
            { type: 'p', text: 'You may register using a username and password, or via Discord or Google OAuth. OAuth login is subject to the respective platform\'s terms of service.' },
          ],
        },
        {
          num: 4,
          heading: 'User Content',
          blocks: [
            { type: 'p', text: 'You retain ownership of any content you create on The Catoolu, including character sheets, session notes, and uploaded images. By uploading content you confirm that:' },
            { type: 'ul', items: [
              'You have the right to use and upload that content',
              'The content does not violate any applicable laws',
              'The content does not infringe the intellectual property rights of others',
            ]},
            { type: 'p', text: 'We reserve the right to remove content that violates these terms without prior notice.' },
          ],
        },
        {
          num: 5,
          heading: 'Acceptable Use',
          blocks: [
            { type: 'p', text: 'You agree not to:' },
            { type: 'ul', items: [
              'Attempt to access other users\' accounts or data without authorization',
              'Use the Service for any unlawful purpose',
              'Upload malicious code, scripts, or harmful content',
              'Attempt to reverse engineer, disrupt, or overload the Service',
              'Use the Service to harass, threaten, or harm other users',
            ]},
          ],
        },
        {
          num: 6,
          heading: 'Limitation of Liability',
          blocks: [
            { type: 'p', text: 'The Catoolu is provided "as is" without warranty of any kind. We do not guarantee uninterrupted availability, data integrity, or fitness for any particular purpose. We are not liable for any loss or damage arising from your use of the Service, including loss of character data due to server failure.' },
            { type: 'p', text: 'We strongly recommend keeping your own backups of important character data using the JSON export feature.' },
          ],
        },
        {
          num: 7,
          heading: 'Service Availability',
          blocks: [
            { type: 'p', text: 'The Catoolu is self-hosted on a home server. We do not guarantee 100% uptime. Maintenance windows, power outages, or internet disruptions may cause temporary unavailability.' },
          ],
        },
        {
          num: 8,
          heading: 'Changes to These Terms',
          blocks: [
            { type: 'p', text: 'We may update these Terms from time to time. Notice will be displayed on the platform. Continued use after changes constitutes acceptance of the updated Terms.' },
          ],
        },
        {
          num: 9,
          heading: 'Governing Law',
          blocks: [
            { type: 'p', text: 'These Terms are governed by the laws of the Kingdom of Thailand, including the Personal Data Protection Act B.E. 2562 (PDPA).' },
          ],
        },
        {
          num: 10,
          heading: 'Contact',
          blocks: [
            { type: 'p', text: 'For questions about these Terms, contact us at:' },
            { type: 'email', address: 'whydontyoumarry@gmail.com' },
          ],
        },
      ],
    },

    th: {
      title:   'ข้อกำหนดการให้บริการ',
      updated: 'มิถุนายน 2026',
      sections: [
        {
          num: 1,
          heading: 'การยอมรับข้อกำหนด',
          blocks: [
            { type: 'p', text: 'การเข้าถึงหรือใช้งาน The Catoolu ("บริการ") ถือว่าท่านตกลงที่จะผูกพันตามข้อกำหนดการให้บริการฉบับนี้ หากท่านไม่ตกลง โปรดงดเว้นการเข้าใช้งานบริการ' },
          ],
        },
        {
          num: 2,
          heading: 'ข้อมูลเกี่ยวกับ The Catoolu',
          blocks: [
            { type: 'p', text: 'The Catoolu เป็นเว็บแอปพลิเคชันที่ให้บริการด้วยตนเอง (Self-hosted) และไม่แสวงหาผลกำไร สำหรับการเล่นเกมกระดานสวมบทบาท Call of Cthulhu ฉบับที่เจ็ด (7th Edition) บริการนี้อนุญาตให้ผู้ใช้งานสร้างและจัดการเอกสารตัวละคร เข้าร่วมห้องแคมเปญ ทอยลูกเต๋า และติดตามสถิติของเกมระหว่างการเล่นสด' },
            { type: 'disclaimer', text: 'The Catoolu ไม่มีส่วนเกี่ยวข้องกับบริษัท Chaosium Inc. หรือผลิตภัณฑ์สายหลักของ Call of Cthulhu อย่างเป็นทางการ Call of Cthulhu เป็นเครื่องหมายการค้าจดทะเบียนของ Chaosium Inc.' },
          ],
        },
        {
          num: 3,
          heading: 'บัญชีผู้ใช้งาน',
          blocks: [
            { type: 'p', text: 'ในการใช้งาน The Catoolu ท่านจะต้องสร้างบัญชีผู้ใช้งาน โดยการสร้างบัญชี ถือว่าท่านตกลงตามเงื่อนไขดังต่อไปนี้:' },
            { type: 'ul', items: [
              'ผู้ใช้งานต้องมีอายุไม่ต่ำกว่า 13 ปีบริบูรณ์',
              'ให้ข้อมูลที่เป็นความจริงและถูกต้องตามความเรียบร้อย',
              'เก็บรักษาข้อมูลการเข้าสู่ระบบบัญชีของท่านไว้เป็นความลับ และไม่เปิดเผยให้บุคคลอื่นล่วงรู้',
              'รับผิดชอบต่อการกระทำใดๆ ที่เกิดขึ้นภายใต้บัญชีของท่าน',
            ]},
            { type: 'p', text: 'ท่านสามารถลงทะเบียนโดยใช้ชื่อผู้ใช้งานและรหัสผ่าน หรือผ่านทางบัญชี Discord หรือ Google OAuth ทั้งนี้ การเข้าสู่ระบบผ่านระบบ OAuth จะต้องอยู่ภายใต้บังคับข้อกำหนดการให้บริการของแพลตฟอร์มที่เกี่ยวข้อง' },
          ],
        },
        {
          num: 4,
          heading: 'เนื้อหาของผู้ใช้งาน',
          blocks: [
            { type: 'p', text: 'ท่านยังคงเป็นเจ้าของกรรมสิทธิ์ในเนื้อหาใดๆ ที่ท่านสร้างขึ้นบน The Catoolu ซึ่งรวมถึงเอกสารตัวละคร บันทึกเซสชัน และรูปภาพที่อัปโหลด โดยการอัปโหลดเนื้อหาดังกล่าว ท่านรับรองและรับประกันว่า:' },
            { type: 'ul', items: [
              'ท่านมีสิทธิโดยชอบธรรมในการใช้งานและอัปโหลดเนื้อหาดังกล่าว',
              'เนื้อหาดังกล่าวไม่ละเมิดกฎหมายใดๆ ที่มีผลบังคับใช้',
              'เนื้อหาดังกล่าวไม่ละเมิดสิทธิในทรัพย์สินทางปัญญาของบุคคลภายนอก',
            ]},
            { type: 'p', text: 'ทางเราขอสงวนสิทธิในการพิจารณาลบเนื้อหาที่ละเมิดข้อกำหนดเหล่านี้โดยไม่จำเป็นต้องแจ้งให้ทราบล่วงหน้า' },
          ],
        },
        {
          num: 5,
          heading: 'นโยบายการใช้งานที่ยอมรับได้',
          blocks: [
            { type: 'p', text: 'ท่านตกลงที่จะไม่กระทำการดังต่อไปนี้:' },
            { type: 'ul', items: [
              'พยายามเข้าถึงบัญชีหรือข้อมูลของผู้ใช้งานรายอื่นโดยไม่ได้รับอนุญาต',
              'ใช้งานบริการเพื่อวัตถุประสงค์ที่ขัดต่อกฎหมาย',
              'อัปโหลดชุดคำสั่งประสงค์ร้าย (Malicious code) สคริปต์ หรือเนื้อหาที่เป็นอันตรายเข้าสู่ระบบ',
              'พยายามทำวิศวกรรมย้อนกลับ (Reverse engineer) ขัดขวาง หรือทำให้บริการรับภาระหนักเกินสมควร (Overload)',
              'ใช้บริการเพื่อคุกคาม ข่มขู่ หรือทำอันตรายต่อผู้ใช้งานรายอื่น',
            ]},
          ],
        },
        {
          num: 6,
          heading: 'ข้อจำกัดความรับผิด',
          blocks: [
            { type: 'p', text: 'บริการ The Catoolu มีให้ในลักษณะ "ตามที่เป็นอยู่" (As is) โดยปราศจากการรับประกันในรูปแบบใดๆ ทางเราไม่รับประกันความพร้อมในการใช้งานอย่างต่อเนื่อง ความสมบูรณ์ของข้อมูล หรือความเหมาะสมสำหรับวัตถุประสงค์เฉพาะเจาะจงใดๆ ทางเราจะไม่รับผิดชอบต่อความสูญเสียหรือความเสียหายใดๆ ที่เกิดขึ้นจากการใช้งานบริการของท่าน ซึ่งรวมถึงแต่ไม่จำกัดเพียง การสูญหายของข้อมูลตัวละครอันเนื่องมาจากความขัดข้องของเซิร์ฟเวอร์' },
            { type: 'p', text: 'ทางเราขอแนะนำอย่างยิ่งให้ท่านสำรองข้อมูลตัวละครที่สำคัญด้วยตนเองอย่างสม่ำเสมอ โดยใช้คุณสมบัติการส่งออกไฟล์ข้อมูลเป็นรูปแบบ JSON' },
          ],
        },
        {
          num: 7,
          heading: 'ความพร้อมในการให้บริการ',
          blocks: [
            { type: 'p', text: 'The Catoolu ดำเนินการจัดเก็บข้อมูลบนเซิร์ฟเวอร์ส่วนบุคคล (Home server) ทางเราไม่รับประกันระยะเวลาการทำงาน (Uptime) อย่างสมบูรณ์ 100% ช่วงเวลาการบำรุงรักษาระบบ ไฟฟ้าขัดข้อง หรือเหตุขัดข้องทางอินเทอร์เน็ตอาจส่งผลให้บริการไม่สามารถใช้งานได้ชั่วคราว' },
          ],
        },
        {
          num: 8,
          heading: 'การแก้ไขเปลี่ยนแปลงข้อกำหนด',
          blocks: [
            { type: 'p', text: 'ทางเราอาจดำเนินการปรับปรุงแก้ไขข้อกำหนดเหล่านี้เป็นครั้งคราว โดยจะมีการแสดงประกาศแจ้งเตือนบนแพลตฟอร์ม การที่ท่านใช้งานบริการต่อไปภายหลังจากการเปลี่ยนแปลงดังกล่าว ถือเป็นการยอมรับข้อกำหนดฉบับปรับปรุงโดยปริยาย' },
          ],
        },
        {
          num: 9,
          heading: 'กฎหมายที่ใช้บังคับ',
          blocks: [
            { type: 'p', text: 'ข้อกำหนดเหล่านี้อยู่ภายใต้บังคับและการตีความตามกฎหมายแห่งราชอาณาจักรไทย รวมถึงพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)' },
          ],
        },
        {
          num: 10,
          heading: 'การติดต่อ',
          blocks: [
            { type: 'p', text: 'หากท่านมีข้อสงสัยใดๆ เกี่ยวกับข้อกำหนดเหล่านี้ โปรดติดต่อเราได้ที่:' },
            { type: 'email', address: 'whydontyoumarry@gmail.com' },
          ],
        },
      ],
    },
  },

  privacy: {
    en: {
      title:   'Privacy Policy',
      updated: 'June 2026',
      sections: [
        {
          num: 1,
          heading: 'Information We Collect',
          blocks: [
            { type: 'subgroup', heading: 'Account information:', items: [
              'Username, email address, profile avatar',
              'If using OAuth: your name and email from Discord or Google (we do not store OAuth tokens beyond what is needed for login)',
            ]},
            { type: 'subgroup', heading: 'Content you create:', items: [
              'Investigator character sheets and all data within them',
              'Campaign information',
              'Session notes (private — only visible to you)',
              'Bug reports and optional screenshots you submit',
            ]},
            { type: 'subgroup', heading: 'Technical information:', items: [
              'Browser/device type (collected only when you submit a bug report, to help diagnose issues)',
              'Basic server access logs (standard web server logs — not used for tracking)',
            ]},
            { type: 'p', text: 'We do not collect IP addresses for tracking purposes beyond standard server logs that are not analysed or retained for user profiling.' },
          ],
        },
        {
          num: 2,
          heading: 'How We Use Your Information',
          blocks: [
            { type: 'p', text: 'We use your information to:' },
            { type: 'ul', items: [
              'Provide and operate the Service',
              'Display your character sheets and campaign data to you and your campaign members',
              'Process bug reports to improve the Service',
              'Send transactional emails (account registration, password reset) via Resend',
            ]},
            { type: 'p', text: 'We do not use your data for advertising, profiling, or any commercial purpose.' },
          ],
        },
        {
          num: 3,
          heading: 'How We Share Your Information',
          blocks: [
            { type: 'emphasis', text: 'We do not sell your personal data to any third party.' },
            { type: 'p', text: 'Your data is shared only with the following service providers as necessary to operate the Service:' },
            { type: 'table',
              headers: ['Service', 'Purpose', 'Data shared'],
              rows: [
                ['Cloudflare', 'CDN, DNS, tunnel, file storage (R2)', 'Uploaded files (avatars, screenshots)'],
                ['Discord OAuth', 'Login', 'Email, username (if you choose Discord login)'],
                ['Google OAuth', 'Login', 'Email, username (if you choose Google login)'],
                ['Resend', 'Transactional email', 'Email address'],
              ],
            },
            { type: 'p', text: 'Your character data and session notes are never shared with third parties.' },
          ],
        },
        {
          num: 4,
          heading: 'Data Visibility',
          blocks: [
            { type: 'ul', items: [
              { label: 'Character sheets', text: 'visible to you and any Keeper (Game Master) of campaigns you join' },
              { label: 'Session notes', text: 'private to you only. Keepers cannot see player notes.' },
              { label: 'Campaign data', text: 'visible to all members of that campaign' },
              { label: 'Bug reports', text: 'visible to administrators only' },
            ]},
          ],
        },
        {
          num: 5,
          heading: 'Data Security',
          blocks: [
            { type: 'ul', items: [
              'Passwords are hashed using bcrypt and never stored in plain text',
              'Authentication uses JWT tokens with expiry',
              'All traffic is encrypted via HTTPS through Cloudflare',
              'Character ownership is enforced server-side — you cannot access another user\'s data by guessing URLs',
              'Uploaded files are stored on Cloudflare R2 with access controlled by our backend',
            ]},
            { type: 'p', text: 'No system is 100% secure. We recommend using a strong, unique password.' },
          ],
        },
        {
          num: 6,
          heading: 'Data Retention and Deletion',
          blocks: [
            { type: 'subgroup', heading: 'When you delete your account:', items: [
              'Your personal information (username, email, avatar, OAuth identifiers) is permanently deleted',
              'Character and campaign data is anonymised — it is no longer linked to your identity. Anonymous orphaned data may remain in our database but cannot be attributed to you.',
              'Uploaded files (avatars, bug screenshots) are deleted from Cloudflare R2',
            ]},
            { type: 'p', text: 'To delete your account: Dashboard → Profile → Delete Account' },
            { type: 'p', text: 'You may also request deletion by emailing ', email: 'whydontyoumarry@gmail.com' },
          ],
        },
        {
          num: 7,
          heading: 'Your Rights (PDPA)',
          blocks: [
            { type: 'p', text: 'Under Thailand\'s Personal Data Protection Act B.E. 2562 you have the right to:' },
            { type: 'ul', items: [
              { label: 'Access', text: 'request a copy of your personal data' },
              { label: 'Rectification', text: 'correct inaccurate data' },
              { label: 'Erasure', text: 'request deletion of your data' },
              { label: 'Portability', text: 'export your character data via the JSON export feature' },
              { label: 'Objection', text: 'object to processing of your data' },
            ]},
            { type: 'p', text: 'To exercise these rights, contact us at ', email: 'whydontyoumarry@gmail.com' },
          ],
        },
        {
          num: 8,
          heading: 'Children',
          blocks: [
            { type: 'p', text: 'The Catoolu is not directed at children under the age of 13. If we become aware that a user is under 13, we will delete their account and associated data. If you believe a child under 13 is using the Service, please contact us.' },
            { type: 'p', text: 'Note: Call of Cthulhu contains themes of horror and mature content. We recommend parental guidance for users aged 13–17.' },
          ],
        },
        {
          num: 9,
          heading: 'Cookies and Local Storage',
          blocks: [
            { type: 'p', text: 'We do not use tracking cookies.' },
            { type: 'p', text: 'We use browser localStorage to store:' },
            { type: 'ul', items: [
              'Your theme preference (dark/light)',
              'Font scale settings',
              'Notes window position and size',
              'Other UI preferences',
            ]},
            { type: 'p', text: 'This data stays on your device and is never sent to our servers.' },
          ],
        },
        {
          num: 10,
          heading: 'Changes to This Policy',
          blocks: [
            { type: 'p', text: 'We may update this Privacy Policy from time to time. The date at the top of this page will always reflect the latest update. We will notify users of significant changes via the platform.' },
          ],
        },
        {
          num: 11,
          heading: 'Contact',
          blocks: [
            { type: 'p', text: 'For any privacy questions or data requests:' },
            { type: 'email', address: 'whydontyoumarry@gmail.com' },
          ],
        },
      ],
    },

    th: {
      title:   'นโยบายความเป็นส่วนตัว',
      updated: 'มิถุนายน 2026',
      sections: [
        {
          num: 1,
          heading: 'ข้อมูลที่เรารวบรวม',
          blocks: [
            { type: 'subgroup', heading: 'ข้อมูลบัญชีผู้ใช้งาน:', items: [
              'ชื่อผู้ใช้งาน (Username), ที่อยู่อีเมล, และภาพโปรไฟล์ (Avatar)',
              'กรณีเข้าสู่ระบบผ่าน OAuth: ชื่อและที่อยู่อีเมลของท่านจากแพลตฟอร์ม Discord หรือ Google (ทางเราไม่มีการจัดเก็บ OAuth token เกินกว่าความจำเป็นสำหรับการเข้าสู่ระบบ)',
            ]},
            { type: 'subgroup', heading: 'เนื้อหาที่ท่านสร้างขึ้น:', items: [
              'เอกสารตัวละครผู้สืบสวนและข้อมูลทั้งหมดที่ปรากฏอยู่ในเอกสารดังกล่าว',
              'ข้อมูลรายละเอียดแคมเปญ',
              'บันทึกเซสชัน (ข้อมูลส่วนบุคคล — มองเห็นได้เฉพาะท่านเท่านั้น)',
              'รายงานข้อผิดพลาด (Bug reports) และภาพหน้าจอเพิ่มเติมที่ท่านได้ส่งมอบ',
            ]},
            { type: 'subgroup', heading: 'ข้อมูลทางเทคนิค:', items: [
              'ประเภทของเบราว์เซอร์และอุปกรณ์ (เก็บรวบรวมเฉพาะเมื่อท่านส่งรายงานข้อผิดพลาด เพื่อประโยชน์ในการวินิจฉัยปัญหา)',
              'บันทึกการเข้าถึงเซิร์ฟเวอร์ขั้นพื้นฐาน (เป็นบันทึกการใช้งานเว็บเซิร์ฟเวอร์ตามมาตรฐานทั่วไป — ไม่ได้นำมาใช้เพื่อการติดตามผู้ใช้งาน)',
            ]},
            { type: 'p', text: 'ทางเราไม่มีการเก็บรวบรวมที่อยู่ไอพี (IP addresses) เพื่อวัตถุประสงค์ในการติดตาม นอกเหนือไปจากบันทึกเซิร์ฟเวอร์ตามมาตรฐาน ซึ่งจะไม่มีการนำมาวิเคราะห์หรือจัดเก็บเพื่อสร้างประวัติผู้ใช้งาน (User profiling)' },
          ],
        },
        {
          num: 2,
          heading: 'วัตถุประสงค์ในการใช้ข้อมูลส่วนบุคคล',
          blocks: [
            { type: 'p', text: 'ทางเรานำข้อมูลของท่านไปใช้เพื่อวัตถุประสงค์ดังต่อไปนี้:' },
            { type: 'ul', items: [
              'เพื่อจัดหาและดำเนินงานการให้บริการอย่างครบถ้วน',
              'เพื่อแสดงผลเอกสารตัวละครและข้อมูลแคมเปญให้แก่ท่านและสมาชิกในแคมเปญของท่าน',
              'เพื่อประมวลผลรายงานข้อผิดพลาดและนำไปปรับปรุงการให้บริการ',
              'เพื่อส่งอีเมลธุรกรรม (เช่น การลงทะเบียนบัญชี, การตั้งรหัสผ่านใหม่) ผ่านทางผู้ให้บริการ Resend',
            ]},
            { type: 'p', text: 'ทางเราไม่มีการนำข้อมูลของท่านไปใช้เพื่อการโฆษณา การจัดทำประวัติพฤติกรรม หรือเพื่อวัตถุประสงค์ในเชิงพาณิชย์อื่นใดทั้งสิ้น' },
          ],
        },
        {
          num: 3,
          heading: 'การเปิดเผยข้อมูลส่วนบุคคล',
          blocks: [
            { type: 'emphasis', text: 'ทางเราไม่มีการจำหน่ายข้อมูลส่วนบุคคลของท่านให้แก่บุคคลภายนอกไม่ว่าในกรณีใดๆ' },
            { type: 'p', text: 'ข้อมูลของท่านจะถูกเปิดเผยให้แก่ผู้ให้บริการดังต่อไปนี้ เฉพาะเท่าที่จำเป็นต่อการดำเนินงานของบริการเท่านั้น:' },
            { type: 'table',
              headers: ['ผู้ให้บริการ', 'วัตถุประสงค์', 'ข้อมูลที่ถูกเปิดเผย'],
              rows: [
                ['Cloudflare', 'เครือข่ายการส่งมอบเนื้อหา (CDN), DNS, Tunnel และการจัดเก็บไฟล์ (R2)', 'ไฟล์ที่ถูกอัปโหลด (เช่น ภาพโปรไฟล์, ภาพหน้าจอ)'],
                ['Discord OAuth', 'การเข้าสู่ระบบบัญชี', 'ที่อยู่อีเมล, ชื่อผู้ใช้งาน (เฉพาะกรณีที่ท่านเลือกเข้าสู่ระบบด้วย Discord)'],
                ['Google OAuth', 'การเข้าสู่ระบบบัญชี', 'ที่อยู่อีเมล, ชื่อผู้ใช้งาน (เฉพาะกรณีที่ท่านเลือกเข้าสู่ระบบด้วย Google)'],
                ['Resend', 'อีเมลธุรกรรม', 'ที่อยู่อีเมล'],
              ],
            },
            { type: 'p', text: 'ข้อมูลตัวละครและบันทึกเซสชันของท่านจะไม่มีการถูกเปิดเผยให้แก่บุคคลภายนอกในทุกกรณี' },
          ],
        },
        {
          num: 4,
          heading: 'สิทธิในการมองเห็นข้อมูล',
          blocks: [
            { type: 'ul', items: [
              { label: 'เอกสารตัวละคร', text: 'สามารถมองเห็นได้โดยท่าน และผู้คุมเกม (Keeper/Game Master) ในแคมเปญที่ท่านเข้าร่วม' },
              { label: 'บันทึกเซสชัน', text: 'เป็นข้อมูลส่วนบุคคลที่มองเห็นได้เฉพาะท่านเท่านั้น ผู้คุมเกมไม่สามารถเข้าถึงบันทึกของผู้เล่นได้' },
              { label: 'ข้อมูลแคมเปญ', text: 'สามารถมองเห็นได้โดยสมาชิกทุกคนที่อยู่ในแคมเปญดังกล่าว' },
              { label: 'รายงานข้อผิดพลาด', text: 'สามารถมองเห็นได้เฉพาะผู้ดูแลระบบ (Administrators) เท่านั้น' },
            ]},
          ],
        },
        {
          num: 5,
          heading: 'ความมั่นคงปลอดภัยของข้อมูล',
          blocks: [
            { type: 'ul', items: [
              'รหัสผ่านจะได้รับการเข้ารหัสทางเดียว (Hashed) ด้วยอัลกอริทึม bcrypt และไม่มีการจัดเก็บในรูปแบบข้อความธรรมดา (Plain text) โดยเด็ดขาด',
              'กระบวนการยืนยันตัวตนใช้โทเคนแบบ JWT ซึ่งมีกำหนดระยะเวลาหมดอายุเพื่อความปลอดภัย',
              'การส่งผ่านข้อมูลทั้งหมดในระบบได้รับการเข้ารหัสผ่านโปรโตคอล HTTPS ผ่านเครือข่าย Cloudflare',
              'การตรวจสอบสิทธิความเป็นเจ้าของตัวละครถูกบังคับใช้อย่างเคร่งครัดจากฝั่งเซิร์ฟเวอร์ ผู้ใช้งานไม่สามารถเข้าถึงข้อมูลของผู้ใช้งานรายอื่นผ่านทางการคาดเดา URL ได้',
              'ไฟล์ที่ถูกอัปโหลดจะถูกจัดเก็บไว้บน Cloudflare R2 โดยมีการควบคุมการเข้าถึงผ่านระบบหลังบ้าน (Backend) อย่างรัดกุม',
            ]},
            { type: 'p', text: 'ทั้งนี้ ไม่มีระบบคอมพิวเตอร์ใดที่มีความปลอดภัยสูงสุด 100% ทางเราจึงขอแนะนำให้ท่านใช้รหัสผ่านที่มีความซับซ้อนและไม่ซ้ำซ้อนกับระบบอื่น' },
          ],
        },
        {
          num: 6,
          heading: 'การเก็บรักษาและการลบข้อมูล',
          blocks: [
            { type: 'subgroup', heading: 'เมื่อท่านดำเนินการลบบัญชีผู้ใช้งาน:', items: [
              'ข้อมูลส่วนบุคคลของท่าน (ได้แก่ ชื่อผู้ใช้งาน, ที่อยู่อีเมล, ภาพโปรไฟล์, ตัวระบุข้อมูล OAuth) จะถูกลบออกจากระบบอย่างถาวร',
              'ข้อมูลตัวละครและแคมเปญจะเข้าสู่กระบวนการทำให้เป็นข้อมูลนิรนาม (Anonymised) ซึ่งจะไม่สามารถเชื่อมโยงกลับไปยังตัวตนของท่านได้อีกต่อไป ข้อมูลที่ถูกตัดขาดดังกล่าวอาจยังคงอยู่ในฐานข้อมูลของระบบ แต่จะปราศจากการระบุตัวตนว่าเป็นของท่าน',
              'ไฟล์ข้อมูลที่ท่านได้อัปโหลด (ภาพโปรไฟล์, ภาพหน้าจอรายงานข้อผิดพลาด) จะถูกลบออกจากพื้นที่ Cloudflare R2',
            ]},
            { type: 'p', text: 'วิธีการลบบัญชีด้วยตนเอง: ไปที่หน้าแดชบอร์ด (Dashboard) → โปรไฟล์ (Profile) → ลบบัญชี (Delete Account)' },
            { type: 'p', text: 'ท่านยังสามารถร้องขอให้มีการดำเนินการลบข้อมูลได้โดยส่งอีเมลไปที่ ', email: 'whydontyoumarry@gmail.com' },
          ],
        },
        {
          num: 7,
          heading: 'สิทธิของเจ้าของข้อมูลส่วนบุคคล (PDPA)',
          blocks: [
            { type: 'p', text: 'ภายใต้พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 ของราชอาณาจักรไทย ท่านมีสิทธิดังต่อไปนี้:' },
            { type: 'ul', items: [
              { label: 'สิทธิในการเข้าถึง', text: 'ขอรับสำเนาข้อมูลส่วนบุคคลของท่านที่มีการจัดเก็บไว้' },
              { label: 'สิทธิในการแก้ไข', text: 'ขอแก้ไขข้อมูลที่ไม่ถูกต้องให้มีความสมบูรณ์และเป็นปัจจุบัน' },
              { label: 'สิทธิในการลบข้อมูล', text: 'ร้องขอให้มีการลบหรือทำลายข้อมูลส่วนบุคคลของท่าน' },
              { label: 'สิทธิในการขอรับและโอนย้ายข้อมูล', text: 'ส่งออกข้อมูลตัวละครของท่านผ่านทางคุณสมบัติการส่งออกในรูปแบบ JSON' },
              { label: 'สิทธิในการคัดค้าน', text: 'คัดค้านการประมวลผลข้อมูลส่วนบุคคลของท่าน' },
            ]},
            { type: 'p', text: 'สำหรับการใช้สิทธิข้างต้น โปรดติดต่อเราได้ที่ ', email: 'whydontyoumarry@gmail.com' },
          ],
        },
        {
          num: 8,
          heading: 'เด็กและเยาวชน',
          blocks: [
            { type: 'p', text: 'บริการ The Catoolu ไม่ได้มีจุดประสงค์ในการให้บริการแก่เด็กที่มีอายุต่ำกว่า 13 ปี หากทางเราทราบว่ามีผู้ใช้งานที่มีอายุต่ำกว่าเกณฑ์ดังกล่าว ทางเราจะดำเนินการลบบัญชีและข้อมูลที่เกี่ยวข้องโดยทันที หากท่านมีเหตุอันควรเชื่อได้ว่ามีเด็กอายุต่ำกว่า 13 ปี กำลังใช้งานบริการ โปรดติดต่อทางเรา' },
            { type: 'p', text: 'หมายเหตุ: เกม Call of Cthulhu มีเนื้อหาที่เกี่ยวข้องกับความสยองขวัญและอาจมีเนื้อหาสำหรับผู้ใหญ่ (Mature content) ทางเราขอแนะนำให้มีผู้ปกครองคอยให้คำแนะนำดูแล สำหรับผู้ใช้งานที่มีอายุระหว่าง 13 ถึง 17 ปี' },
          ],
        },
        {
          num: 9,
          heading: 'การใช้คุกกี้ (Cookies) และ Local Storage',
          blocks: [
            { type: 'p', text: 'ทางเราไม่มีการใช้คุกกี้เพื่อวัตถุประสงค์ในการติดตามพฤติกรรม (Tracking cookies)' },
            { type: 'p', text: 'ทางเรามีการใช้พื้นที่จัดเก็บข้อมูลภายในเบราว์เซอร์ของท่าน (localStorage) เพื่อบันทึกข้อมูลดังต่อไปนี้:' },
            { type: 'ul', items: [
              'การตั้งค่ารูปแบบการแสดงผลของท่าน (โหมดมืด/สว่าง)',
              'การตั้งค่าสัดส่วนขนาดแบบอักษร',
              'ตำแหน่งและขนาดของหน้าต่างบันทึกข้อความ',
              'การตั้งค่าส่วนต่อประสานผู้ใช้งาน (UI) อื่นๆ',
            ]},
            { type: 'p', text: 'ข้อมูลดังกล่าวถูกจัดเก็บไว้บนอุปกรณ์ของท่านแต่เพียงผู้เดียว และไม่มีการส่งข้อมูลเหล่านั้นกลับมายังเซิร์ฟเวอร์ของเรา' },
          ],
        },
        {
          num: 10,
          heading: 'การเปลี่ยนแปลงนโยบายความเป็นส่วนตัว',
          blocks: [
            { type: 'p', text: 'ทางเราอาจดำเนินการปรับปรุงแก้ไขนโยบายความเป็นส่วนตัวฉบับนี้เป็นครั้งคราว วันที่ที่ระบุไว้บริเวณส่วนบนของหน้านี้จะแสดงถึงการอัปเดตครั้งล่าสุดเสมอ ทางเราจะแจ้งให้ผู้ใช้งานทราบถึงการเปลี่ยนแปลงที่มีนัยสำคัญผ่านทางแพลตฟอร์ม' },
          ],
        },
        {
          num: 11,
          heading: 'การติดต่อ',
          blocks: [
            { type: 'p', text: 'หากท่านมีข้อซักถามประการใดเกี่ยวกับความเป็นส่วนตัว หรือมีความประสงค์ในการจัดการข้อมูล โปรดติดต่อ:' },
            { type: 'email', address: 'whydontyoumarry@gmail.com' },
          ],
        },
      ],
    },
  },
};