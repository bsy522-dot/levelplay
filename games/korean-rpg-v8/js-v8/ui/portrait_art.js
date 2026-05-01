// js-v8/ui/portrait_art.js
// 한국사 영웅전 v8 · 인물 SVG 일러스트 (영걸전 톤)
// emoji 대신 stylized SVG 초상 — 환인/환웅/풍백/우사/운사/단군/웅녀/해설 등

const SIZE = 'viewBox="0 0 200 280" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block;border-radius:14px"';

// ─────────────────────────────────────────────
// 공통 부속
// ─────────────────────────────────────────────
const sunRays = (cx, cy, r1, r2, color, count = 12) => {
  let s = `<g transform="translate(${cx},${cy})" opacity="0.55" stroke="${color}" stroke-width="1.6">`;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    s += `<line x1="${Math.cos(a)*r1}" y1="${Math.sin(a)*r1}" x2="${Math.cos(a)*r2}" y2="${Math.sin(a)*r2}"/>`;
  }
  return s + '</g>';
};
const face = (cx, cy, r, skin) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${skin}" stroke="#8a5a2a" stroke-width="1"/>`;
const eyes = (cx, cy, dx = 9, ey = 0) => `
  <ellipse cx="${cx-dx}" cy="${cy+ey}" rx="2.2" ry="1.4" fill="#000"/>
  <ellipse cx="${cx+dx}" cy="${cy+ey}" rx="2.2" ry="1.4" fill="#000"/>
  <path d="M${cx-13} ${cy-5} Q${cx-dx} ${cy-9} ${cx-3} ${cy-5}" stroke="#3a1a08" fill="none" stroke-width="1.5"/>
  <path d="M${cx+3} ${cy-5} Q${cx+dx} ${cy-9} ${cx+13} ${cy-5}" stroke="#3a1a08" fill="none" stroke-width="1.5"/>
`;
const mouth = (cx, cy, w = 8) => `<path d="M${cx-w} ${cy} Q${cx} ${cy+3} ${cx+w} ${cy}" stroke="#5a2a1a" fill="none" stroke-width="1.6" stroke-linecap="round"/>`;

// ─────────────────────────────────────────────
// 인물별 SVG
// ─────────────────────────────────────────────
const ART = {
  // 환인 — 하늘의 아버지, 황금 후광, 흰 수염, 천관
  hwanin: `<svg ${SIZE}>
    <defs>
      <radialGradient id="bg-hwanin" cx="50%" cy="35%" r="80%">
        <stop offset="0%" stop-color="#fff5d0"/>
        <stop offset="40%" stop-color="#ffba50"/>
        <stop offset="100%" stop-color="#5a2c00"/>
      </radialGradient>
    </defs>
    <rect width="200" height="280" fill="url(#bg-hwanin)"/>
    ${sunRays(100, 95, 50, 92, '#fff8b0', 16)}
    <ellipse cx="100" cy="270" rx="80" ry="14" fill="#3a1a00" opacity="0.5"/>
    <!-- 도포 -->
    <path d="M55 158 Q50 200 52 270 L148 270 Q150 200 145 158 Q120 150 100 150 Q80 150 55 158 Z" fill="#e8b860" stroke="#8a5018" stroke-width="1.5"/>
    <path d="M100 158 L100 268" stroke="#8a5018" stroke-width="2"/>
    <circle cx="100" cy="180" r="6" fill="#cd7f32" stroke="#5a3000" stroke-width="1"/>
    <!-- 머리 -->
    ${face(100, 108, 32, '#fde0b8')}
    <!-- 천관 (관) -->
    <path d="M68 88 L100 56 L132 88 Z" fill="#cd7f32" stroke="#5a3000" stroke-width="1.5"/>
    <rect x="64" y="86" width="72" height="9" fill="#a06020" stroke="#5a3000" stroke-width="1"/>
    <circle cx="100" cy="62" r="4" fill="#ffd700"/>
    <!-- 흰 수염 -->
    <path d="M82 130 Q90 170 100 175 Q110 170 118 130" fill="#f0f0f0" stroke="#bbb" stroke-width="1"/>
    <path d="M86 138 Q100 165 114 138" fill="#fff" opacity="0.7"/>
    ${eyes(100, 110)}
    <!-- 콧수염 흰 -->
    <path d="M88 124 Q100 128 112 124" stroke="#ccc" stroke-width="2" fill="none"/>
  </svg>`,

  // 환웅 — 청년 천왕, 청동 헬멧, 어깨 갑옷, 망토
  hwanwoong: `<svg ${SIZE}>
    <defs>
      <linearGradient id="bg-hwanwoong" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#5a3a8a"/>
        <stop offset="60%" stop-color="#2a1a40"/>
        <stop offset="100%" stop-color="#1a0820"/>
      </linearGradient>
    </defs>
    <rect width="200" height="280" fill="url(#bg-hwanwoong)"/>
    ${sunRays(100, 90, 48, 80, '#ffd060', 12)}
    <!-- 망토 (붉은) -->
    <path d="M40 160 L20 270 L80 270 L70 165" fill="#aa2020" opacity="0.85"/>
    <path d="M160 160 L180 270 L120 270 L130 165" fill="#aa2020" opacity="0.85"/>
    <!-- 갑옷 -->
    <path d="M55 160 Q50 210 55 270 L145 270 Q150 210 145 160 Q120 152 100 152 Q80 152 55 160 Z" fill="#c4956a" stroke="#5a3a1a" stroke-width="1.5"/>
    <!-- 어깨 보호대 -->
    <ellipse cx="58" cy="160" rx="14" ry="9" fill="#cd7f32" stroke="#5a3000" stroke-width="1"/>
    <ellipse cx="142" cy="160" rx="14" ry="9" fill="#cd7f32" stroke="#5a3000" stroke-width="1"/>
    <!-- 가슴 단추 3개 -->
    <circle cx="100" cy="180" r="5" fill="#cd7f32" stroke="#5a3000"/>
    <circle cx="100" cy="200" r="5" fill="#cd7f32" stroke="#5a3000"/>
    <circle cx="100" cy="220" r="5" fill="#cd7f32" stroke="#5a3000"/>
    <!-- 머리 -->
    ${face(100, 110, 30, '#f4cea8')}
    <!-- 청동 헬멧 -->
    <path d="M70 95 Q70 60 100 50 Q130 60 130 95" fill="#cd7f32" stroke="#5a3000" stroke-width="1.5"/>
    <ellipse cx="100" cy="50" rx="5" ry="14" fill="#aa6020"/>
    <path d="M100 36 Q97 30 100 22 Q103 30 100 36" fill="#aa2020"/>
    <!-- 머리카락 (검은 앞머리) -->
    <path d="M75 100 Q90 90 100 92 Q110 90 125 100" fill="#1a0a00"/>
    ${eyes(100, 112)}
    ${mouth(100, 128, 6)}
  </svg>`,

  // 풍백 — 바람 신장, 푸른 도포, 머리에 깃털
  pungbaek: `<svg ${SIZE}>
    <defs>
      <linearGradient id="bg-pung" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#3a6080"/>
        <stop offset="100%" stop-color="#0a1a2a"/>
      </linearGradient>
    </defs>
    <rect width="200" height="280" fill="url(#bg-pung)"/>
    <!-- 바람 흐름선 -->
    <path d="M0 80 Q60 70 130 90 T200 100" stroke="#9bd0ff" fill="none" stroke-width="1.5" opacity="0.6"/>
    <path d="M0 130 Q70 120 150 145 T200 155" stroke="#9bd0ff" fill="none" stroke-width="1.5" opacity="0.5"/>
    <path d="M0 200 Q80 195 160 215 T200 225" stroke="#9bd0ff" fill="none" stroke-width="1.5" opacity="0.4"/>
    <!-- 도포 -->
    <path d="M55 160 Q50 210 55 270 L145 270 Q150 210 145 160 Q120 152 100 152 Q80 152 55 160 Z" fill="#3a5a8a" stroke="#1a3050" stroke-width="1.5"/>
    <path d="M100 158 L100 268" stroke="#1a3050" stroke-width="2"/>
    <!-- 어깨 -->
    <path d="M55 160 L70 158 L65 175 Z" fill="#5a7aaa"/>
    <path d="M145 160 L130 158 L135 175 Z" fill="#5a7aaa"/>
    <!-- 머리 -->
    ${face(100, 112, 30, '#e8c098')}
    <!-- 머리카락 (긴) -->
    <path d="M70 100 Q72 85 80 75 Q90 70 100 72 Q110 70 120 75 Q128 85 130 100 Q135 130 132 145 L130 142 Q128 130 128 110 Q72 130 72 142 L70 145 Q65 130 70 100 Z" fill="#1a1810"/>
    <!-- 깃털 (3개) -->
    <path d="M75 70 Q72 50 75 42 Q78 50 78 70 Z" fill="#fff" stroke="#aaa" stroke-width="1"/>
    <path d="M100 60 Q97 35 100 25 Q103 35 103 60 Z" fill="#fff" stroke="#aaa" stroke-width="1"/>
    <path d="M125 70 Q122 50 125 42 Q128 50 128 70 Z" fill="#fff" stroke="#aaa" stroke-width="1"/>
    ${eyes(100, 114)}
    ${mouth(100, 130, 5)}
  </svg>`,

  // 우사 — 비 신장, 회푸른 도포, 우산모자
  usa: `<svg ${SIZE}>
    <defs>
      <linearGradient id="bg-usa" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#506a8a"/>
        <stop offset="100%" stop-color="#0a1828"/>
      </linearGradient>
    </defs>
    <rect width="200" height="280" fill="url(#bg-usa)"/>
    <!-- 빗줄기 -->
    ${[20,40,60,80,100,120,140,160,180].map(x => `<line x1="${x}" y1="20" x2="${x-8}" y2="60" stroke="#a8d0ff" stroke-width="1.2" opacity="0.55"/>`).join('')}
    ${[15,55,95,135,175].map(x => `<line x1="${x}" y1="60" x2="${x-8}" y2="100" stroke="#a8d0ff" stroke-width="1.2" opacity="0.45"/>`).join('')}
    <!-- 도포 -->
    <path d="M55 160 Q50 210 55 270 L145 270 Q150 210 145 160 Q120 152 100 152 Q80 152 55 160 Z" fill="#506680" stroke="#202c40" stroke-width="1.5"/>
    <path d="M100 158 L100 268" stroke="#202c40" stroke-width="2"/>
    <!-- 머리 -->
    ${face(100, 116, 28, '#dab895')}
    <!-- 삿갓 (우산모자) -->
    <ellipse cx="100" cy="86" rx="48" ry="14" fill="#3a4a5a" stroke="#1a2030" stroke-width="1.5"/>
    <path d="M52 86 Q100 60 148 86" fill="#5a6a7a" stroke="#1a2030" stroke-width="1.5"/>
    <ellipse cx="100" cy="86" rx="6" ry="3" fill="#1a2030"/>
    ${eyes(100, 118)}
    ${mouth(100, 134, 5)}
  </svg>`,

  // 운사 — 구름 신장, 흰 도포, 구름 모티프
  unsa: `<svg ${SIZE}>
    <defs>
      <linearGradient id="bg-unsa" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#a0a8b8"/>
        <stop offset="100%" stop-color="#2a3040"/>
      </linearGradient>
    </defs>
    <rect width="200" height="280" fill="url(#bg-unsa)"/>
    <!-- 구름 패턴 -->
    <ellipse cx="40" cy="60" rx="22" ry="10" fill="#fff" opacity="0.55"/>
    <ellipse cx="55" cy="58" rx="18" ry="9" fill="#fff" opacity="0.5"/>
    <ellipse cx="160" cy="80" rx="26" ry="11" fill="#fff" opacity="0.5"/>
    <ellipse cx="175" cy="78" rx="14" ry="8" fill="#fff" opacity="0.45"/>
    <ellipse cx="100" cy="35" rx="30" ry="9" fill="#fff" opacity="0.4"/>
    <!-- 도포 -->
    <path d="M55 160 Q50 210 55 270 L145 270 Q150 210 145 160 Q120 152 100 152 Q80 152 55 160 Z" fill="#e8e8f0" stroke="#5a5a6a" stroke-width="1.5"/>
    <path d="M100 158 L100 268" stroke="#5a5a6a" stroke-width="2"/>
    <!-- 구름 무늬 (가슴) -->
    <ellipse cx="90" cy="190" rx="10" ry="5" fill="#bcc4d4" opacity="0.7"/>
    <ellipse cx="110" cy="200" rx="12" ry="6" fill="#bcc4d4" opacity="0.7"/>
    <!-- 머리 -->
    ${face(100, 112, 30, '#e0c8a8')}
    <!-- 머리카락 (회색) -->
    <path d="M70 100 Q72 75 100 70 Q128 75 130 100 L128 105 Q100 90 72 105 Z" fill="#5a5a6a"/>
    <!-- 띠 -->
    <ellipse cx="100" cy="80" rx="32" ry="5" fill="#cccdd0" stroke="#5a5a6a"/>
    ${eyes(100, 114)}
    ${mouth(100, 130, 5)}
  </svg>`,

  // 단군 — 청년 왕, 황금 도포, 왕관
  dangun: `<svg ${SIZE}>
    <defs>
      <radialGradient id="bg-dangun" cx="50%" cy="35%" r="80%">
        <stop offset="0%" stop-color="#fff0c0"/>
        <stop offset="50%" stop-color="#aa7020"/>
        <stop offset="100%" stop-color="#3a1800"/>
      </radialGradient>
    </defs>
    <rect width="200" height="280" fill="url(#bg-dangun)"/>
    ${sunRays(100, 90, 50, 86, '#ffd700', 14)}
    <!-- 도포 (황금) -->
    <path d="M55 160 Q50 210 55 270 L145 270 Q150 210 145 160 Q120 152 100 152 Q80 152 55 160 Z" fill="#e0a830" stroke="#5a3a08" stroke-width="1.5"/>
    <!-- 가슴 자수 (태극) -->
    <circle cx="100" cy="200" r="14" fill="#cd1f1f" stroke="#5a0808"/>
    <path d="M100 186 Q86 200 100 214 Q114 200 100 186 Z" fill="#1a3aaa"/>
    <circle cx="100" cy="193" r="3" fill="#cd1f1f"/>
    <circle cx="100" cy="207" r="3" fill="#1a3aaa"/>
    <!-- 머리 -->
    ${face(100, 112, 30, '#f4cea8')}
    <!-- 왕관 (5점) -->
    <path d="M68 88 L72 64 L82 80 L92 56 L100 78 L108 56 L118 80 L128 64 L132 88 Z" fill="#ffd700" stroke="#5a3a08" stroke-width="1.5"/>
    <rect x="68" y="86" width="64" height="6" fill="#cd9020" stroke="#5a3a08"/>
    <circle cx="100" cy="68" r="4" fill="#cd1f1f"/>
    <!-- 검은 머리 -->
    <path d="M75 102 Q90 95 100 96 Q110 95 125 102" fill="#0a0500"/>
    ${eyes(100, 114)}
    ${mouth(100, 130, 6)}
  </svg>`,

  // 웅녀 — 분홍 한복, 머리장식 꽃
  ungnyeo: `<svg ${SIZE}>
    <defs>
      <linearGradient id="bg-ung" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffb0c8"/>
        <stop offset="100%" stop-color="#5a2030"/>
      </linearGradient>
    </defs>
    <rect width="200" height="280" fill="url(#bg-ung)"/>
    <!-- 꽃잎 흩날림 -->
    ${[[30,80],[170,60],[60,180],[150,200],[90,40],[120,140]].map(([x,y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#ffe0e8" opacity="0.7"/>`).join('')}
    <!-- 한복 치마 (분홍) -->
    <path d="M50 175 Q40 220 45 270 L155 270 Q160 220 150 175 Q120 165 100 165 Q80 165 50 175 Z" fill="#e890a8" stroke="#5a2030" stroke-width="1.5"/>
    <!-- 저고리 (옅은 분홍) -->
    <path d="M60 158 L60 178 Q80 175 100 175 Q120 175 140 178 L140 158 Q120 152 100 152 Q80 152 60 158 Z" fill="#fadce4" stroke="#aa5060" stroke-width="1.5"/>
    <!-- 옷고름 (붉은 끈) -->
    <path d="M100 160 L100 180 M95 165 L105 165" stroke="#cd1f1f" stroke-width="2"/>
    <!-- 머리 -->
    ${face(100, 110, 30, '#fadcb8')}
    <!-- 검은 머리 (가르마) -->
    <path d="M70 95 Q72 70 100 65 Q128 70 130 95 L128 100 Q100 78 72 100 Z" fill="#1a0808"/>
    <path d="M100 65 L100 95" stroke="#3a1808" stroke-width="1"/>
    <!-- 머리장식 (꽃) -->
    <g transform="translate(80,72)">
      <circle r="6" fill="#ffd0e0" stroke="#aa5060"/>
      <circle r="3" fill="#cd1f1f"/>
    </g>
    <g transform="translate(120,72)">
      <circle r="5" fill="#ffd0e0" stroke="#aa5060"/>
      <circle r="2" fill="#cd1f1f"/>
    </g>
    ${eyes(100, 112, 8)}
    <!-- 입술 (붉은) -->
    <path d="M93 130 Q100 134 107 130" stroke="#cd1f1f" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <!-- 볼 (분홍) -->
    <ellipse cx="83" cy="120" rx="4" ry="2" fill="#ff90a8" opacity="0.7"/>
    <ellipse cx="117" cy="120" rx="4" ry="2" fill="#ff90a8" opacity="0.7"/>
  </svg>`,

  // 해설 — 두루마리 + 붓
  narrator: `<svg ${SIZE}>
    <defs>
      <linearGradient id="bg-nar" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#3a3a4a"/>
        <stop offset="100%" stop-color="#0a0a18"/>
      </linearGradient>
    </defs>
    <rect width="200" height="280" fill="url(#bg-nar)"/>
    <!-- 두루마리 -->
    <rect x="30" y="80" width="140" height="140" rx="6" fill="#f0e0c0" stroke="#5a3a1a" stroke-width="2"/>
    <line x1="40" y1="120" x2="160" y2="120" stroke="#8a5a2a" stroke-width="1.2"/>
    <line x1="40" y1="140" x2="160" y2="140" stroke="#8a5a2a" stroke-width="1.2"/>
    <line x1="40" y1="160" x2="160" y2="160" stroke="#8a5a2a" stroke-width="1.2"/>
    <line x1="40" y1="180" x2="160" y2="180" stroke="#8a5a2a" stroke-width="1.2"/>
    <line x1="40" y1="200" x2="160" y2="200" stroke="#8a5a2a" stroke-width="1.2"/>
    <!-- 두루마리 양쪽 봉 -->
    <rect x="22" y="76" width="14" height="148" fill="#aa6020" stroke="#5a3000" stroke-width="1.5" rx="3"/>
    <rect x="164" y="76" width="14" height="148" fill="#aa6020" stroke="#5a3000" stroke-width="1.5" rx="3"/>
    <!-- 한자 (古/史) -->
    <text x="100" y="160" font-size="64" font-weight="900" fill="#3a1a08" text-anchor="middle" font-family="'Noto Serif KR', serif">史</text>
    <!-- 붓 -->
    <line x1="160" y1="240" x2="120" y2="200" stroke="#5a3000" stroke-width="3"/>
    <ellipse cx="118" cy="198" rx="4" ry="8" fill="#1a0a00" transform="rotate(-45 118 198)"/>
  </svg>`,
};

// ─────────────────────────────────────────────
// API
// ─────────────────────────────────────────────
export function getPortraitSVG(id) {
  if (!id) return null;
  return ART[id] || null;
}

export function hasPortraitArt(id) {
  return !!ART[id];
}
