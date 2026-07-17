// Team lineup shown on the About page. Kept in its own module so the page
// component and the image preloader can both use it without breaking
// React Fast Refresh (a component file should export only components).

export const TEAM_MEMBERS = [
  // { name: 'Someone', role: 'Keeper', badge: 'Founder', avatar: null },
  { name: 'Natrium \'K\'',     role: 'System Designer',   badge: 'Founder', avatar: 'https://assets.catoolu.quest/team/dfebc529-cc05-4aba-9837-48f9bf71cf58.jpg' },
  { name: 'ItLiemai',    role: 'System Optimizer',        badge: 'Founder',            avatar: null },
  { name: 'Alistair',    role: 'Consultant',        badge: 'Founder',            avatar: 'https://assets.catoolu.quest/team/1f5db6a9-dbf9-4e3f-a80c-d8f1ee8c4a73.jpg' },
  { name: 'Tear_Celestia',    role: 'Feature Visionary',        badge: 'KEY CONTRIBUTOR',            avatar: 'https://assets.catoolu.quest/team/0fc620fd-b49e-474a-89fa-6964f07cb718.jpg' },
  //{ name: 'Un_sa',       role: 'Animator',          badge: 'Commissioner',       avatar: 'https://assets.catoolu.quest/team/3f5f97d5-1b68-46aa-9cd4-c66bd7d9d006.jpg' },
  { name: 'Momoru',      role: 'Oliver Artist',     badge: 'Commissioner',       avatar: 'https://assets.catoolu.quest/team/4e03d549-f051-4757-9427-b55e5265b8ff.jpg' },
  { name: 'Rippa_Platu', role: 'Background Artist', badge: 'Commissioner',       avatar: 'https://assets.catoolu.quest/team/a7c11404-1ee5-4631-8342-62e5fe8a0827.jpg' },
];

// Remote images on the About page — preloaded on app idle so they're cached
// before the user navigates there.
export const ABOUT_PRELOAD_IMAGES = TEAM_MEMBERS.map(m => m.avatar).filter(Boolean);
