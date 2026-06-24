// One entry per release. Most recent first.
// WHATS_NEW[0] is always treated as the current release.
// Keep the last 3-5 versions so users can browse history.

export const WHATS_NEW = [
  {
    version: '1.6c',
    codename: 'Semphar',
    date: 'June 2026',
    sections: [
      {
        heading: 'Notes Window',
        items: [
          'Drag and resize finally work correctly — rebuilt with native pointer events',
          'Bubble pill animates in smoothly and remembers its position',
        ],
      },
      {
        heading: 'Session Fixes',
        items: [
          'Keeper can now delete rolled result cards from the feed',
          'Bottom skill roll button no longer hides below the viewport',
          'Shift+Enter adds a new line in chat instead of sending',
          'Handout back button now returns to the room correctly',
        ],
      },
      {
        heading: 'Quality of Life',
        items: [
          'File Manager: select multiple files for bulk delete',
          'Handout library and campaign list now have sort options — preference saved per device',
          'Pending indicator on chat send, dice rolls, and skill clicks — prevents double-clicks on slow connections',
          'Upload progress bar on all file uploads',
        ],
      },
    ],
  },
  {
    version: '1.6b',
    codename: 'High Moor',
    date: 'June 2026',
    sections: [
      {
        heading: 'Stability',
        items: [
          'Chat history loads in batches — scroll to the top to load older messages',
          'False "Server Unreachable" page eliminated — requires 3 real failures now',
          'Server auto-recovers and reloads when it comes back online',
          'Scroll chaining fixed — NavBar and Footer no longer shift on trackpad',
        ],
      },
      {
        heading: 'Version Checker',
        items: [
          'Footer shows when a newer version is available on GitHub',
        ],
      },
    ],
  },
  {
    version: '1.6a',
    codename: 'Jade Palace',
    date: 'June 2026',
    sections: [
      {
        heading: 'New Features',
        items: [
          'Keeper roll requests — ask one player or all players to roll a specific skill',
          'Handouts — share images and text into the session room from a campaign library',
          'Image attachments in chat — attach or paste images directly',
          'Message deletion — delete your own messages, Keeper can delete any',
        ],
      },
      {
        heading: 'Roll Feed',
        items: [
          'New roll card design with portrait and auto-scroll improvements',
          'Jump to present button when scrolled up in history',
          'Room settings: toggle crit memes and feed background',
        ],
      },
    ],
  },
];
