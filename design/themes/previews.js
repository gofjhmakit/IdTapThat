/* Theme previews for the theme picker. Each SVG is self-contained (viewBox 0 0 120 80),
   gradient ids are prefixed tp-<id>- to avoid clashes. */
window.THEME_META = [
  { id: 'default', name: 'Classic',  tagline: 'The original midnight look' },
  { id: 'fantasy', name: 'Fantasy',  tagline: 'Gold leaf, elder kingdoms' },
  { id: 'gothic',  name: 'Gothic',   tagline: 'Cathedral by candlelight' },
  { id: 'angel',   name: 'Angel',    tagline: 'Pearl, halo and sky' },
  { id: 'fire',    name: 'Fire',     tagline: 'Embers and molten rage' },
  { id: 'ice',     name: 'Ice',      tagline: 'Glacier frost, arctic night' },
  { id: 'nature',  name: 'Nature',   tagline: 'Moss, bark and sunlight' },
  { id: 'arcane',  name: 'Arcane',   tagline: 'Starlight from the void' },
  { id: 'abyss',   name: 'Abyss',    tagline: 'Depths where krakens sleep' },
  { id: 'desert',  name: 'Desert',   tagline: 'Sun-bleached sandstone sands' },
];

window.THEME_PREVIEWS = {
  default:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80"><defs><radialGradient id="tp-default-g" cx=".5" cy="0" r=".9"><stop offset="0" stop-color="#1a0a30"/><stop offset="1" stop-color="#0b0b14"/></radialGradient><linearGradient id="tp-default-b"><stop offset="0" stop-color="#e94560"/><stop offset="1" stop-color="#ff6b35"/></linearGradient></defs>' +
    '<rect width="120" height="80" fill="url(#tp-default-g)"/>' +
    '<rect x="28" y="14" width="22" height="31" rx="3" fill="#13132a" stroke="#2a2a44"/>' +
    '<rect x="62" y="18" width="22" height="31" rx="3" fill="#1a1a2e" stroke="#ffd700" transform="rotate(90 73 33.5)"/>' +
    '<circle cx="73" cy="33.5" r="4" fill="#4ecdc4"/>' +
    '<rect x="22" y="58" width="76" height="11" rx="5" fill="url(#tp-default-b)"/></svg>',

  fantasy:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80"><defs><radialGradient id="tp-fantasy-g" cx=".5" cy="0" r=".9"><stop offset="0" stop-color="#263a20"/><stop offset="1" stop-color="#0e1810"/></radialGradient><linearGradient id="tp-fantasy-b"><stop offset="0" stop-color="#d4a838"/><stop offset="1" stop-color="#f0d585"/></linearGradient></defs>' +
    '<rect width="120" height="80" fill="url(#tp-fantasy-g)"/>' +
    '<path d="M0 54L18 46 34 52 52 42 70 50 90 40 120 50V80H0z" fill="#162318"/>' +
    '<path d="M40 52V30l-3-4h4v-4h3v4h4v-4h3v4h4l-3 4v6h6V28l-2-3h3v-6l4-8 4 8v6h3l-2 3v24z" fill="#1d2d1f" stroke="#d4a838" stroke-width=".8"/>' +
    '<rect x="65" y="34" width="2.4" height="4" rx="1.2" fill="#f2d27a"/>' +
    '<path d="M94 12l1.5 4.5 4.5 1.5-4.5 1.5-1.5 4.5-1.5-4.5-4.5-1.5 4.5-1.5z" fill="#f2d27a"/>' +
    '<rect x="22" y="60" width="76" height="11" rx="4" fill="url(#tp-fantasy-b)"/>' +
    '<rect x="24" y="62" width="72" height="7" rx="3" fill="none" stroke="#1c1405" stroke-opacity=".3" stroke-width=".6"/></svg>',

  gothic:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80"><defs><linearGradient id="tp-gothic-w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c4183a"/><stop offset="1" stop-color="#5e1d73"/></linearGradient><linearGradient id="tp-gothic-b"><stop offset="0" stop-color="#c4183a"/><stop offset="1" stop-color="#5e1d73"/></linearGradient></defs>' +
    '<rect width="120" height="80" fill="#0a070b"/><ellipse cx="60" cy="0" rx="60" ry="40" fill="#2c0818" opacity=".7"/>' +
    '<path d="M44 52V26Q44 10 60 4Q76 10 76 26V52z" fill="#150d14" stroke="#cfc8d6" stroke-opacity=".6"/>' +
    '<path d="M48 50V27Q48 15 60 9Q72 15 72 27V50z" fill="url(#tp-gothic-w)" opacity=".85"/>' +
    '<path d="M60 9V50M48 30H72M48 40H72" stroke="#0a070b" stroke-width="1.4"/>' +
    '<circle cx="60" cy="21" r="5" fill="none" stroke="#0a070b" stroke-width="1.4"/>' +
    '<rect x="22" y="60" width="76" height="11" fill="url(#tp-gothic-b)"/></svg>',

  angel:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80"><defs><radialGradient id="tp-angel-g" cx=".5" cy=".3" r=".7"><stop offset="0" stop-color="#fff3d1"/><stop offset="1" stop-color="#f8f4ea"/></radialGradient><linearGradient id="tp-angel-b"><stop offset="0" stop-color="#a57620"/><stop offset="1" stop-color="#e6c97e"/></linearGradient></defs>' +
    '<rect width="120" height="80" fill="url(#tp-angel-g)"/>' +
    '<g stroke="#e6c97e" stroke-width="1.2" opacity=".7"><path d="M60 26L60 2M60 26L40 6M60 26L80 6M60 26L28 18M60 26L92 18"/></g>' +
    '<ellipse cx="60" cy="16" rx="11" ry="3.5" fill="none" stroke="#a57620" stroke-width="1.6"/>' +
    '<path d="M57 34C46 24 32 26 22 32c8 0 12 2 16 5-6 0-9 2-12 5 8-2 14-1 19 2-3 1-5 3-6 5 8-3 15-6 18-15z" fill="#fffdf7" stroke="#dcd1b9"/>' +
    '<path d="M63 34c11-10 25-8 35-2-8 0-12 2-16 5 6 0 9 2 12 5-8-2-14-1-19 2 3 1 5 3 6 5-8-3-15-6-18-15z" fill="#fffdf7" stroke="#dcd1b9"/>' +
    '<rect x="22" y="60" width="76" height="11" rx="5.5" fill="url(#tp-angel-b)"/>' +
    '<circle cx="96" cy="12" r="3" fill="#3d75b0" opacity=".5"/></svg>',

  fire:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80"><defs><linearGradient id="tp-fire-f" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#e0301a"/><stop offset=".6" stop-color="#ff7a1f"/><stop offset="1" stop-color="#ffd34a"/></linearGradient><linearGradient id="tp-fire-b"><stop offset="0" stop-color="#ff5a1f"/><stop offset="1" stop-color="#ffb627"/></linearGradient></defs>' +
    '<rect width="120" height="80" fill="#120806"/><ellipse cx="60" cy="56" rx="60" ry="18" fill="#3d0f04"/>' +
    '<path d="M60 52c-14 0-20-9-16-19 2 5 5 6 7 6-3-9 2-20 11-27-1 8 3 12 7 16 2-3 2-6 1-9 7 6 10 15 6 24-2 6-8 9-16 9z" fill="url(#tp-fire-f)"/>' +
    '<path d="M60 52c-6 0-9-4-7-9 1 2 3 3 4 3-1-5 2-9 5-12 0 4 2 6 4 8 2 4 0 10-6 10z" fill="#ffd34a"/>' +
    '<g fill="#ffb627"><circle cx="34" cy="20" r="1.2"/><circle cx="86" cy="14" r="1"/><circle cx="92" cy="30" r="1.4"/><circle cx="28" cy="36" r=".9"/></g>' +
    '<rect x="22" y="60" width="76" height="11" rx="5" fill="url(#tp-fire-b)"/></svg>',

  ice:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80"><defs><radialGradient id="tp-ice-g" cx=".5" cy="0" r=".9"><stop offset="0" stop-color="#0f3350"/><stop offset="1" stop-color="#07121f"/></radialGradient><linearGradient id="tp-ice-b"><stop offset="0" stop-color="#5fd3f3"/><stop offset="1" stop-color="#d2f5ff"/></linearGradient></defs>' +
    '<rect width="120" height="80" fill="url(#tp-ice-g)"/>' +
    '<path d="M0 56L14 40 22 50 30 34 40 56zM84 56L94 38 102 48 110 30 120 44V56z" fill="#12253b" stroke="#5fd3f3" stroke-opacity=".5" stroke-width=".7"/>' +
    '<g stroke="#e8f6fc" stroke-width="1.6" stroke-linecap="round"><path d="M60 10V46M44.4 19L75.6 37M44.4 37L75.6 19"/>' +
    '<path d="M55 13L60 18 65 13M55 43L60 38 65 43M45 25L52 24 49 18M75 31L68 32 71 38M45 31L52 32 49 38M75 25L68 24 71 18" stroke-width="1.1"/></g>' +
    '<rect x="22" y="60" width="76" height="11" rx="3" fill="url(#tp-ice-b)"/></svg>',

  nature:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80"><defs><radialGradient id="tp-nature-s" cx=".85" cy="0" r=".8"><stop offset="0" stop-color="#f0c04a" stop-opacity=".35"/><stop offset="1" stop-color="#0c140b" stop-opacity="0"/></radialGradient><linearGradient id="tp-nature-b"><stop offset="0" stop-color="#7cc04a"/><stop offset="1" stop-color="#e0b23c"/></linearGradient></defs>' +
    '<rect width="120" height="80" fill="#0c140b"/><rect width="120" height="80" fill="url(#tp-nature-s)"/>' +
    '<path d="M57 56V36l-8-8M60 40l9-10M60 46l-6-5" stroke="#6b4a2b" stroke-width="3" fill="none" stroke-linecap="round"/>' +
    '<path d="M54 56h12" stroke="#6b4a2b" stroke-width="4"/>' +
    '<g fill="#7cc04a"><ellipse cx="60" cy="22" rx="18" ry="13"/><ellipse cx="44" cy="30" rx="10" ry="8" fill="#5aa83a"/><ellipse cx="76" cy="28" rx="11" ry="8" fill="#5aa83a"/></g>' +
    '<path d="M18 46q6-10 14-4-6 10-14 4zM96 44q8-6 12 2-8 6-12-2z" fill="#95d462"/>' +
    '<rect x="22" y="60" width="76" height="11" rx="5.5" fill="url(#tp-nature-b)"/></svg>',

  arcane:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80"><defs><radialGradient id="tp-arcane-o" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ece8ff"/><stop offset=".35" stop-color="#9670ff"/><stop offset="1" stop-color="#26104d" stop-opacity="0"/></radialGradient><linearGradient id="tp-arcane-b"><stop offset="0" stop-color="#7c4dff"/><stop offset="1" stop-color="#c03fe0"/></linearGradient></defs>' +
    '<rect width="120" height="80" fill="#08061a"/>' +
    '<g fill="#ece8ff"><circle cx="14" cy="12" r=".9"/><circle cx="104" cy="8" r="1.1"/><circle cx="96" cy="44" r=".7"/><circle cx="20" cy="48" r=".8"/><circle cx="36" cy="6" r=".6"/></g>' +
    '<circle cx="60" cy="30" r="22" fill="url(#tp-arcane-o)"/>' +
    '<ellipse cx="60" cy="30" rx="30" ry="8" fill="none" stroke="#5ee6e0" stroke-opacity=".7" transform="rotate(-18 60 30)"/>' +
    '<path d="M88 22l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" fill="#ffd970"/>' +
    '<rect x="22" y="60" width="76" height="11" rx="5.5" fill="url(#tp-arcane-b)"/></svg>',

  abyss:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80"><defs><linearGradient id="tp-abyss-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#06374a"/><stop offset="1" stop-color="#03121a"/></linearGradient><linearGradient id="tp-abyss-b"><stop offset="0" stop-color="#1fb5c4"/><stop offset="1" stop-color="#6fd68a"/></linearGradient></defs>' +
    '<rect width="120" height="80" fill="url(#tp-abyss-g)"/>' +
    '<path d="M0 10q15-6 30 0t30 0 30 0 30 0" fill="none" stroke="#1fb5c4" stroke-opacity=".35"/>' +
    '<g fill="none" stroke="#1fb5c4" stroke-width="3.2" stroke-linecap="round"><path d="M38 56c-4-10 6-14 2-24s6-10 8-4"/><path d="M60 56c0-12-8-16-2-26 4-6 10-2 8 3"/><path d="M82 56c4-10-6-14-2-22s-4-12-9-6"/></g>' +
    '<g fill="#8ef0b5" fill-opacity=".6"><circle cx="24" cy="30" r="1.6"/><circle cx="27" cy="22" r="1"/><circle cx="96" cy="26" r="1.3"/></g>' +
    '<circle cx="104" cy="52" r="2.4" fill="#f4d06f"/>' +
    '<rect x="22" y="60" width="76" height="11" rx="5" fill="url(#tp-abyss-b)"/></svg>',

  desert:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80"><defs><linearGradient id="tp-desert-b"><stop offset="0" stop-color="#b0502a"/><stop offset="1" stop-color="#c8752c"/></linearGradient></defs>' +
    '<rect width="120" height="80" fill="#f1e3c8"/><circle cx="92" cy="16" r="9" fill="#fff3d6" stroke="#e6c48a"/>' +
    '<path d="M0 50q30-14 60-4t60-8V80H0z" fill="#ead8b6"/>' +
    '<path d="M30 52L48 22 66 52z" fill="#d5bd95"/><path d="M48 22L66 52H52z" fill="#c8a574"/>' +
    '<path d="M64 52L76 32 88 52z" fill="#d5bd95"/><path d="M76 32L88 52H79z" fill="#c8a574"/>' +
    '<path d="M0 58q40-8 120-2" fill="none" stroke="#b0502a" stroke-opacity=".25"/>' +
    '<rect x="22" y="60" width="76" height="11" rx="3" fill="url(#tp-desert-b)"/></svg>',
};
