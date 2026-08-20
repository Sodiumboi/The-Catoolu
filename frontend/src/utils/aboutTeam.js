// Team lineup shown on the About page. Kept in its own module so the page
// component and the image preloader can both use it without breaking
// React Fast Refresh (a component file should export only components).

export const TEAM_MEMBERS = [
  // { name: 'Someone', role: 'Keeper', badge: 'Founder', avatar: null },
  { name: 'Natrium \'K\'',     role: 'System Designer',   badge: 'Founder', avatar: 'https://assets.catoolu.quest/team/b2f0d862-f1d7-46d0-bf4c-8c0e8fd60e2d.jpg' },
  { name: 'ItLiemai',    role: 'System Optimizer',        badge: 'Founder',            avatar: null },
  { name: 'Alistair',    role: 'Consultant, Translator',        badge: 'Founder',            avatar: 'https://assets.catoolu.quest/team/195830fc-b0d9-483c-b7a5-b80676299a61.png' },
  { name: 'Tear_Celestia',    role: 'Feature Visionary',        badge: 'KEY CONTRIBUTOR',            avatar: 'https://assets.catoolu.quest/team/f41d1542-1590-4279-868c-dd8f0eb091c8.jpg' },
  //{ name: 'Un_sa',       role: 'Animator',          badge: 'Commissioner',       avatar: 'https://assets.catoolu.quest/team/3f5f97d5-1b68-46aa-9cd4-c66bd7d9d006.jpg' },
  { name: 'Momoru',      role: 'Oliver Design Artist',     badge: 'Commissioner',       avatar: 'https://assets.catoolu.quest/team/65c977f0-8d31-4d1f-90b8-0c9932880973.jpg' },
  { name: 'Rippa_Platu', role: 'Atmospheric Background Artist', badge: 'Commissioner',       avatar: 'https://assets.catoolu.quest/team/5e299260-6c44-4385-89e9-983ae5f6d123.jpg' },
];

// Remote images on the About page — preloaded on app idle so they're cached
// before the user navigates there.
export const ABOUT_PRELOAD_IMAGES = TEAM_MEMBERS.map(m => m.avatar).filter(Boolean);
