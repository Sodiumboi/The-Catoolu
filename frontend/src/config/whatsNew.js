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
        'Minimises to a pill that remembers its position across sessions',
        'Now available to the Keeper too, not just players',
        'Notes button moved to the top-right of the tab bar for both roles',
      ],
    },
    {
      heading: 'Session Fixes',
      items: [
        'Keeper can now delete rolled result cards from the feed',
        'Roll popup no longer hides below the viewport for skills near the bottom of the list',
        'Shift+Enter adds a new line in chat instead of sending',
        'Handout back button now returns to the room correctly instead of refreshing',
        'Chat messages now preserve line breaks',
        'Own roll cards are right-aligned again',
      ],
    },
    {
      heading: 'Chat Images',
      items: [
        'Players can now attach images directly in the campaign room chat',
        'Paste an image from clipboard directly into the chat bar',
        'Attach multiple images at once — they send as a grouped gallery',
        'Images open in a full-screen viewer on click',
        'Upload progress bar shows while files are being sent',
      ],
    },
    {
      heading: 'Anti-Double-Click',
      items: [
        'Chat send, dice rolls, and skill clicks now show a pending state while the server responds',
        'Prevents the same action from firing twice on slow connections',
      ],
    },
    {
      heading: 'Quality of Life',
      items: [
        'File Manager: select multiple files for bulk delete',
        'Handout library: drag and drop images anywhere on the page to upload',
        'Handout library: dashed create tiles replace the old toolbar buttons',
        'Handout library and campaign list now have sort options — preference saved per device',
        'Six themes: Parchment, Shale, Farmilia Dark, Marsh, Archive, Cosmic Void',
        'Theme picker with colour swatches in NavBar Preferences',
        'What\'s New modal — you\'re reading it right now',
      ],
    },
    {
      heading: 'UI Polish',
      items: [
        'Confirmation dialogs are now uniform across the whole app',
        'Dropdowns are now custom-built — no more browser-default selects',
        'Hover tooltips throughout the app — no more browser title text',
        'Notes resize grip redesigned — rounded triangle in the corner',
        'Jump-to-present button re-centred in the feed',
        'Chat bubble delete menu moved to the bottom, opens upward',
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
