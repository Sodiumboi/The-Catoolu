// One entry per release. Most recent first.
// WHATS_NEW[0] is always treated as the current release.
// Keep the last 3-5 versions so users can browse history.

export const WHATS_NEW = [
  {
  version: '1.6',
  codename: 'Atlach-Nacha',
  date: 'June – July 2026',
  sections: [
    {
      heading: 'Patches: Jade Palace · High Moor · Semphar · Icewind Dale · Nakamaru',
      items: [
        'Full campaign room: Keeper roll requests, handouts library, chat image attachments, message deletion',
        'Background parallax art across dashboard, editor, Keeper, and campaign pages',
        'Bouts of Madness reference panel (CoC 7e Tables VII–X) in the Keeper room panel',
        'Six themes: Parchment, Shale, Farmilia Dark, Marsh, Archive, Cosmic Void',
        'Notes window rebuilt with OS-style minimize/restore — movable pill, position persists across refreshes',
        'Possessions tab in the campaign room — editable mid-session, Keeper sees live updates',
        'Room connection persists across browser refreshes — socket re-subscribes automatically',
        'Chat history loads in batches, scroll chaining fixed, server auto-recovers on reconnect',
        'Custom dropdowns, portal tooltips, and uniform confirm dialogs across the whole app',
        'File Manager bulk delete, handout drag-and-drop, What\'s New modal',
      ],
    },
  ],
},
];
