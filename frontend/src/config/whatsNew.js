// One entry per release. Most recent first.
// WHATS_NEW[0] is always treated as the current release.
// Keep the last 3-5 versions so users can browse history.

export const WHATS_NEW = [
  {
    version: '1.6e',
    codename: 'Nakamaru',
    date: 'June 2026',
    sections: [
      {
        heading: 'Room Connection Persistence',
        items: [
          'The active room is now remembered across browser refreshes — no more dropping connections silently',
          'The NavBar pill reappears immediately on load and the socket re-subscribes in the background automatically',
        ],
      },
      {
        heading: 'Disconnect & Quit',
        items: [
          'The "Leave Table" label is gone, replaced with a unified "Disconnect from Room" action',
          'Disconnecting from inside the room returns you to the campaign list; disconnecting from the NavBar pill stays on the current page',
          'Disconnect button in the icon strip now has a confirmation dialog to prevent accidental clicks',
          'NavBar pill exits with a proper pop-out animation that mirrors how it entered',
          'New "Quit Campaign" button in the Players panel for permanent exits, completely hidden from the Keeper',
        ],
      },
      {
        heading: 'Notes Window',
        items: [
          'Notes window now behaves like an OS program window, minimising to a movable pill',
          'Clicking the pill restores the window, expanding outward from wherever the pill currently is',
          'Window and pill positions are saved and persist across page refreshes',
          'Window is now clamped to the viewport so it can never open partially off-screen',
        ],
      },
      {
        heading: 'Campaign Room',
        items: [
          'Players can now view and edit possessions mid-session via a new Possessions tab in the room sub-nav',
          'Keeper side panel now updates automatically in real-time as players edit their sheets (skills, HP/MP/Sanity, items, etc.)',
          'Possessions changes save immediately and flow to the Keeper\'s live view automatically',
        ],
      },
      {
        heading: 'UI Polish',
        items: [
          'All native browser tooltips replaced with custom, theme-aware portal tooltips featuring a 300ms hover delay',
          'Character editor toolbar updated with proper Material Symbol icons instead of text arrows',
          'Active profile picture is now protected from accidental deletion in the File Manager (marked with a lock icon)',
        ],
      },
    ],
  },
  {
    version: '1.6d',
    codename: 'Icewind Dale',
    date: 'June 2026',
    sections: [
      {
        heading: 'Background Art',
        items: [
          'The app now has a parallax background — dead trees and tentacles shifting as you move your mouse',
          'Art appears on the dashboard, character editor, Keeper page, and campaign list',
          'Three layers move independently for depth — front trees move most, back layer drifts slowly',
          'Theme-adaptive: the silhouettes blend into each theme\'s surface colour rather than sitting on top',
          'Control it from NavBar Preferences: toggle background on/off, parallax on/off, and adjust intensity',
        ],
      },
      {
        heading: 'Bouts of Madness',
        items: [
          'Full CoC 7e Bouts of Madness reference now lives in the Keeper\'s campaign room panel',
          'Four tabs: Temporary Insanity, Indefinite Insanity, Sample Phobias (100 entries), Sample Manias (100 entries)',
          'Official text from the Keeper Rulebook — Tables VII, VIII, IX, and X',
          'Accordion rows expand on click so you can read the full description without scrolling',
        ],
      },
      {
        heading: 'Campaign Room',
        items: [
          'New loading screen when joining a room — ring spinner with rotating CoC flavour text instead of a blank wait',
          'Campaign name, role badge, connection dot, and AFK toggle moved into a compact left panel header',
          'Connection dot breathes slowly when connected, pulses faster when reconnecting, goes red when lost',
          'Leave Table button moved into the sidebar icon strip — no more hunting through menus',
          'Sidebar panel now slides open and closed with a smooth animation',
          'Return to Room pill in the NavBar reveals a Leave Table option on hover',
        ],
      },
      {
        heading: 'Navigation & Polish',
        items: [
          'Campaign cards now open the correct campaign detail panel directly when clicking the gear icon',
          'All three main pages (dashboard, Keeper, campaigns) show a logo-pulse loading state consistently',
          'NavBar tabs now sit in a pill tray — subtle track background matching the RoomSubNav style',
          'Investigator cards now lift and deepen their shadow on hover, matching campaign cards',
          'All destructive confirmation dialogs now use red consistently — no more mixed warning/danger colours',
        ],
      },
    ],
  },
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
