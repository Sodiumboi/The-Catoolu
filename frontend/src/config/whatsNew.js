// One entry per release. Most recent first.
// WHATS_NEW[0] is always treated as the current release.
// Keep the last 3-5 versions so users can browse history.

export const WHATS_NEW = [
  {
  version: '1.7',
  codename: 'Eihort',
  date: 'July 2026',
  sections: [
    {
      heading: 'Frosted Gem',
      items: [
        'Catoolu now has a named design language — Frosted Gem. Every button, tab, and interactive surface rebuilt from shared classes, consistent across all six themes.',
        'Nav tabs redesigned — darker opaque container, accent-green active pill. The text didn\'t change colour; it just reads brighter against the darker background.',
        'New focus animation on form inputs — border fades to green, soft glow appears. No more hard-cut outlines.',
      ],
    },
    {
      heading: 'Character Creation — Beta',
      items: [
        'The character creation wizard is back, behind a beta badge. Cross-check your finished investigator against Dhole\'s House before treating it as final.',
        'Core rules fixed: Luck is now a proper independent roll, EDU improvement uses the correct 1D10 mechanic, age deductions match the rulebook exactly.',
        'Occupation skill picker rebuilt from scratch — a new modal handles free picks, fixed choice lists, open specialty groups, and either/or language choices across 88 occupations.',
        'Cthulhu Mythos is no longer reachable from the free skill picker. (It was. That was bad.)',
      ],
    },
    {
      heading: 'Error Handling',
      items: [
        'The app no longer swallows failures silently. Every error now tells you what broke, what to do next, and optionally the technical details.',
        'Toast notifications — five types, retry actions, expandable details, timer bar that pauses on hover.',
        'A crashed component now shows an error panel instead of a white screen.',
        'The campaign room was silently discarding server error events — failed dice rolls and sends just appeared to hang. That\'s fixed.',
      ],
    },
    {
      heading: 'Polish & Fixes',
      items: [
        'Notes font size stepper replaces the dropdown — Aa⁻, the current size, Aa⁺. Updates immediately instead of waiting for autosave.',
        'Handout Library: bulk delete with multi-select and partial-failure retry.',
        'Long campaign names no longer break card layouts or hide the Edit button.',
        'Password reset emails were broken in production. Fixed.',
        'Cloudflare fallback page rebuilt — ghost-fade illustration, Catoolu fonts, "Something stirs in the deep."',
      ],
    },
  ],
},
 
// ─── Keep the v1.6 consolidated block below this ───────────────────────────
// Replace all individual v1.6a/b/c/d/e entries with this single block:
 
{
  version: '1.6',
  codename: 'Atlach-Nacha',
  date: 'June – July 2026',
  sections: [
    {
      heading: 'Patches: Jade Palace · High Moor · Semphar · Icewind Dale · Nakamaru',
      items: [
        'Full campaign room: Keeper roll requests, handouts library, chat image attachments, message deletion.',
        'Background parallax art across dashboard, editor, Keeper, and campaign pages.',
        'Bouts of Madness reference panel (CoC 7e Tables VII–X) in the Keeper room panel.',
        'Six themes: Parchment, Shale, Farmilia Dark, Marsh, Archive, Cosmic Void.',
        'Notes window rebuilt with OS-style minimize/restore — movable pill, position persists.',
        'Possessions tab in the campaign room — editable mid-session, Keeper sees live updates.',
        'Room connection persists across browser refreshes — socket re-subscribes automatically.',
        'Custom dropdowns, portal tooltips, and uniform confirm dialogs across the whole app.',
        'File Manager bulk delete, handout drag-and-drop, What\'s New modal.',
      ],
    },
  ],
},
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
