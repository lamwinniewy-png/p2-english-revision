/* "Cloudy" — an original fluffy white puppy mascot (inspired by soft pastel Sanrio style; not an official character) */
'use strict';
function pup(mood = 'happy', extra = '') {
  const eyes = mood === 'wink'
    ? `<path d="M68 92 q6 -6 12 0" stroke="#2B5C9E" stroke-width="3.5" fill="none" stroke-linecap="round"/><ellipse cx="122" cy="92" rx="6.5" ry="8" fill="#2B5C9E"/><circle cx="124" cy="89" r="2.4" fill="#fff"/>`
    : mood === 'sad'
    ? `<ellipse cx="76" cy="94" rx="6" ry="7" fill="#2B5C9E"/><ellipse cx="122" cy="94" rx="6" ry="7" fill="#2B5C9E"/><circle cx="78" cy="91" r="2.2" fill="#fff"/><circle cx="124" cy="91" r="2.2" fill="#fff"/><path d="M66 82 l14 4 M132 82 l-14 4" stroke="#9BB8D8" stroke-width="2.5" stroke-linecap="round"/>`
    : `<ellipse cx="76" cy="92" rx="6.5" ry="8" fill="#2B5C9E"/><ellipse cx="122" cy="92" rx="6.5" ry="8" fill="#2B5C9E"/><circle cx="78" cy="89" r="2.4" fill="#fff"/><circle cx="124" cy="89" r="2.4" fill="#fff"/>`;
  const mouth = mood === 'sad'
    ? `<path d="M92 116 q7 -5 14 0" stroke="#7A5560" stroke-width="2.6" fill="none" stroke-linecap="round"/>`
    : `<path d="M90 110 q9 10 18 0" stroke="#7A5560" stroke-width="2.6" fill="#FF9DB8" stroke-linecap="round"/>`;
  return `<svg viewBox="0 0 200 200" class="pup" aria-hidden="true">
  <defs><radialGradient id="pf${mood}" cx="45%" cy="38%" r="70%"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#EAF4FF"/></radialGradient></defs>
  <!-- tail -->
  <path d="M150 150 q34 -6 26 -30 q-6 -14 -18 -4 q10 4 2 14 q-8 8 -18 6z" fill="#fff" stroke="#BFDDF5" stroke-width="3"/>
  <!-- body -->
  <ellipse cx="100" cy="160" rx="44" ry="30" fill="url(#pf${mood})" stroke="#BFDDF5" stroke-width="3"/>
  <ellipse cx="78" cy="184" rx="13" ry="8" fill="#fff" stroke="#BFDDF5" stroke-width="3"/><ellipse cx="122" cy="184" rx="13" ry="8" fill="#fff" stroke="#BFDDF5" stroke-width="3"/>
  <!-- long floppy ears -->
  <path d="M58 62 C20 58 6 92 14 128 C18 144 34 142 38 128 C44 104 50 88 66 78z" fill="#fff" stroke="#BFDDF5" stroke-width="3"/>
  <path d="M142 62 C180 58 194 92 186 128 C182 144 166 142 162 128 C156 104 150 88 134 78z" fill="#fff" stroke="#BFDDF5" stroke-width="3"/>
  <path d="M30 96 C26 112 28 124 32 130" stroke="#FFD3E0" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/>
  <path d="M170 96 C174 112 172 124 168 130" stroke="#FFD3E0" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/>
  <!-- head -->
  <ellipse cx="100" cy="94" rx="56" ry="48" fill="url(#pf${mood})" stroke="#BFDDF5" stroke-width="3"/>
  <!-- fluffy tuft -->
  <path d="M86 50 q6 -14 14 -4 q6 -12 14 2" fill="#fff" stroke="#BFDDF5" stroke-width="3" stroke-linejoin="round"/>
  ${eyes}
  <ellipse cx="62" cy="108" rx="10" ry="6" fill="#FFC2D4" opacity=".85"/><ellipse cx="138" cy="108" rx="10" ry="6" fill="#FFC2D4" opacity=".85"/>
  <ellipse cx="99" cy="103" rx="4.5" ry="3.4" fill="#7A5560"/>
  ${mouth}
  ${extra}
</svg>`;
}
const MASCOT = {
  happy: pup('happy'),
  wink: pup('wink', '<text x="160" y="56" font-size="30">✨</text>'),
  sad: pup('sad'),
  star: pup('happy', '<text x="150" y="58" font-size="34">⭐</text>'),
  cloud: `<svg viewBox="0 0 120 60" class="cloud" aria-hidden="true"><path d="M20 50 a16 16 0 0 1 4 -31 a22 22 0 0 1 42 -6 a18 18 0 0 1 32 12 a13 13 0 0 1 2 25z" fill="#fff"/></svg>`,
};
