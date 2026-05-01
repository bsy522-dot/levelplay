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

  // ── EP.1 적군 ────────────────────────────────────

  // 천무장 — 하늘의 장수, 붉은 갑옷, 큰 검
  cheonmujang: `<svg ${SIZE}>
    <defs><linearGradient id="bg-chm" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#6a1a1a"/><stop offset="100%" stop-color="#1a0606"/>
    </linearGradient></defs>
    <rect width="200" height="280" fill="url(#bg-chm)"/>
    <path d="M30 80 L40 60 M170 80 L160 60 M100 30 L100 50" stroke="#ff6060" stroke-width="2" opacity="0.5"/>
    <!-- 큰 검 (좌측) -->
    <rect x="38" y="100" width="6" height="120" fill="#c0c0c8" stroke="#3a3a4a" stroke-width="1"/>
    <rect x="32" y="98" width="18" height="6" fill="#5a3a1a" stroke="#2a1a08"/>
    <path d="M41 220 L36 232 L46 232 Z" fill="#2a1a08"/>
    <!-- 망토 -->
    <path d="M50 160 L30 270 L75 270 L70 165" fill="#5a1010" opacity="0.85"/>
    <path d="M150 160 L170 270 L125 270 L130 165" fill="#5a1010" opacity="0.85"/>
    <!-- 갑옷 (붉은) -->
    <path d="M55 160 Q50 210 55 270 L145 270 Q150 210 145 160 Q120 152 100 152 Q80 152 55 160 Z" fill="#8a2a2a" stroke="#3a0808" stroke-width="1.5"/>
    <ellipse cx="58" cy="160" rx="14" ry="9" fill="#5a1818" stroke="#2a0808"/>
    <ellipse cx="142" cy="160" rx="14" ry="9" fill="#5a1818" stroke="#2a0808"/>
    <path d="M85 175 L100 205 L115 175 Z" fill="#3a0808"/>
    <!-- 머리 -->
    ${face(100, 110, 30, '#d8a888')}
    <!-- 투구 (흑금) -->
    <path d="M68 95 Q70 55 100 48 Q130 55 132 95" fill="#2a1808" stroke="#0a0400" stroke-width="1.5"/>
    <path d="M70 88 L80 76 L90 84 L100 70 L110 84 L120 76 L130 88" fill="#6a3010" stroke="#2a1000" stroke-width="1"/>
    <ellipse cx="100" cy="48" rx="4" ry="10" fill="#cd1f1f"/>
    <!-- 콧수염 (붉은) -->
    <path d="M85 124 Q100 134 115 124" stroke="#3a0808" stroke-width="3" fill="none"/>
    <path d="M88 132 Q100 140 112 132" stroke="#3a0808" stroke-width="2" fill="none"/>
    <!-- 사나운 눈 -->
    <path d="M82 110 L98 112 M118 112 L102 110" stroke="#1a0808" stroke-width="2"/>
    <ellipse cx="90" cy="113" rx="2" ry="1.5" fill="#cd1f1f"/>
    <ellipse cx="110" cy="113" rx="2" ry="1.5" fill="#cd1f1f"/>
  </svg>`,

  // 뇌공 — 천둥 궁수, 청흑 갑옷, 활
  noigong: `<svg ${SIZE}>
    <defs><linearGradient id="bg-noi" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1a3050"/><stop offset="100%" stop-color="#050818"/>
    </linearGradient></defs>
    <rect width="200" height="280" fill="url(#bg-noi)"/>
    <!-- 번개 -->
    <path d="M40 30 L48 60 L40 65 L52 100" stroke="#ffd700" stroke-width="2.5" fill="none"/>
    <path d="M160 35 L154 65 L162 70 L150 105" stroke="#ffd700" stroke-width="2" fill="none"/>
    <!-- 활 (우측) -->
    <path d="M155 90 Q175 160 155 230" stroke="#3a1a00" stroke-width="4" fill="none"/>
    <line x1="155" y1="92" x2="155" y2="228" stroke="#aaa" stroke-width="0.8"/>
    <!-- 갑옷 (가죽) -->
    <path d="M55 160 Q50 210 55 270 L145 270 Q150 210 145 160 Q120 152 100 152 Q80 152 55 160 Z" fill="#3a4a5a" stroke="#0a1828" stroke-width="1.5"/>
    <path d="M70 170 L100 165 L130 170 L130 200 L100 200 L70 200 Z" fill="#1a2838" opacity="0.7"/>
    <!-- 어깨 가죽끈 -->
    <path d="M100 152 L70 200" stroke="#5a3a1a" stroke-width="3"/>
    <path d="M100 152 L130 200" stroke="#5a3a1a" stroke-width="3"/>
    <!-- 머리 -->
    ${face(100, 112, 28, '#c89878')}
    <!-- 머리띠 (천) -->
    <rect x="68" y="98" width="64" height="8" fill="#3a1010" stroke="#1a0404"/>
    <!-- 검은 머리 (긴) -->
    <path d="M70 106 Q72 80 100 76 Q128 80 130 106 L130 145 Q120 130 100 130 Q80 130 70 145 Z" fill="#0a0500"/>
    <!-- 화살통 (등 뒤) -->
    <rect x="48" y="155" width="10" height="38" fill="#4a3018" stroke="#1a0a00"/>
    <line x1="51" y1="148" x2="51" y2="156" stroke="#aaa" stroke-width="1"/>
    <line x1="55" y1="146" x2="55" y2="156" stroke="#aaa" stroke-width="1"/>
    ${eyes(100, 114, 8)}
    <path d="M88 132 Q100 130 112 132" stroke="#3a1010" stroke-width="2" fill="none"/>
  </svg>`,

  // 화신 — 불의 신장, 적황 도포, 화염 머리
  hwashin: `<svg ${SIZE}>
    <defs><radialGradient id="bg-hws" cx="50%" cy="40%" r="80%">
      <stop offset="0%" stop-color="#ffaa30"/><stop offset="60%" stop-color="#aa2010"/><stop offset="100%" stop-color="#1a0500"/>
    </radialGradient></defs>
    <rect width="200" height="280" fill="url(#bg-hws)"/>
    <!-- 불꽃 흩날림 -->
    ${[[30,60],[170,80],[60,30],[140,40],[20,140],[180,150]].map(([x,y]) =>
      `<path d="M${x} ${y} Q${x-3} ${y-8} ${x} ${y-14} Q${x+3} ${y-8} ${x} ${y}" fill="#ffaa30" opacity="0.7"/>`).join('')}
    <!-- 도포 (적황) -->
    <path d="M55 160 Q50 210 55 270 L145 270 Q150 210 145 160 Q120 152 100 152 Q80 152 55 160 Z" fill="#cd4020" stroke="#5a1808" stroke-width="1.5"/>
    <path d="M55 165 L145 165 L140 200 L60 200 Z" fill="#ff6020" opacity="0.5"/>
    <!-- 화염 자수 -->
    <path d="M85 195 Q90 215 100 220 Q110 215 115 195" fill="#ffd060" opacity="0.7"/>
    <!-- 머리 -->
    ${face(100, 116, 28, '#f4b888')}
    <!-- 화염 머리카락 -->
    <path d="M68 100 Q70 70 80 60 Q85 50 95 60 Q100 40 105 60 Q115 50 120 60 Q130 70 132 100 L130 105 Q100 80 70 105 Z" fill="#cd2010"/>
    <path d="M75 95 Q80 70 90 65 L95 70 Q90 80 80 100" fill="#ffaa30" opacity="0.8"/>
    <path d="M125 95 Q120 70 110 65 L105 70 Q110 80 120 100" fill="#ffaa30" opacity="0.8"/>
    <!-- 빨간 눈 -->
    <ellipse cx="91" cy="118" rx="2.5" ry="1.5" fill="#ff3030"/>
    <ellipse cx="109" cy="118" rx="2.5" ry="1.5" fill="#ff3030"/>
    <path d="M82 113 Q91 109 100 113 M100 113 Q109 109 118 113" stroke="#3a0808" fill="none" stroke-width="1.5"/>
    ${mouth(100, 134, 6)}
  </svg>`,

  // 산령 — 산의 영령, 회갈 갑옷, 돌덩이
  sanryeong: `<svg ${SIZE}>
    <defs><linearGradient id="bg-san" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#5a4a3a"/><stop offset="100%" stop-color="#1a1208"/>
    </linearGradient></defs>
    <rect width="200" height="280" fill="url(#bg-san)"/>
    <!-- 산 실루엣 -->
    <path d="M0 110 L40 70 L80 100 L120 60 L160 95 L200 75 L200 280 L0 280 Z" fill="#2a2010" opacity="0.5"/>
    <!-- 돌 갑옷 (회갈) -->
    <path d="M55 160 Q50 210 55 270 L145 270 Q150 210 145 160 Q120 152 100 152 Q80 152 55 160 Z" fill="#5a4a38" stroke="#1a1208" stroke-width="2"/>
    <!-- 돌 패턴 -->
    <path d="M65 170 L78 175 L72 188 L60 183 Z" fill="#7a6a4a" stroke="#3a2818"/>
    <path d="M122 170 L138 175 L132 188 L120 183 Z" fill="#7a6a4a" stroke="#3a2818"/>
    <path d="M82 195 L98 200 L92 215 L78 210 Z" fill="#7a6a4a" stroke="#3a2818"/>
    <path d="M105 200 L120 198 L120 213 L102 213 Z" fill="#7a6a4a" stroke="#3a2818"/>
    <!-- 머리 (반쯤 돌) -->
    ${face(100, 114, 30, '#9a8a6a')}
    <path d="M70 100 Q70 60 100 56 Q130 60 130 100 L130 110 Q115 95 100 95 Q85 95 70 110 Z" fill="#3a2a18"/>
    <!-- 이끼 (녹색) -->
    <ellipse cx="80" cy="78" rx="6" ry="3" fill="#3a5a2a" opacity="0.7"/>
    <ellipse cx="120" cy="80" rx="5" ry="2" fill="#3a5a2a" opacity="0.7"/>
    <ellipse cx="92" cy="65" rx="4" ry="2" fill="#3a5a2a" opacity="0.6"/>
    <!-- 노란 눈 (영기) -->
    <ellipse cx="91" cy="116" rx="2.5" ry="2" fill="#ffd060"/>
    <ellipse cx="109" cy="116" rx="2.5" ry="2" fill="#ffd060"/>
    <path d="M82 112 Q91 108 100 112 M100 112 Q109 108 118 112" stroke="#1a0a00" fill="none" stroke-width="1.5"/>
    <path d="M88 134 L100 136 L112 134" stroke="#1a0a00" fill="none" stroke-width="2"/>
  </svg>`,

  // 수장 — 물의 궁수, 청록 갑옷, 활
  sujang: `<svg ${SIZE}>
    <defs><linearGradient id="bg-suj" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1a4060"/><stop offset="100%" stop-color="#050818"/>
    </linearGradient></defs>
    <rect width="200" height="280" fill="url(#bg-suj)"/>
    <!-- 물결 -->
    <path d="M0 70 Q50 60 100 70 T200 70" stroke="#4aa0ff" stroke-width="1.8" fill="none" opacity="0.6"/>
    <path d="M0 100 Q50 90 100 100 T200 100" stroke="#4aa0ff" stroke-width="1.5" fill="none" opacity="0.5"/>
    <path d="M0 130 Q50 120 100 130 T200 130" stroke="#4aa0ff" stroke-width="1.2" fill="none" opacity="0.4"/>
    <!-- 활 -->
    <path d="M155 90 Q175 160 155 230" stroke="#1a3a4a" stroke-width="4" fill="none"/>
    <line x1="155" y1="92" x2="155" y2="228" stroke="#a8d0ff" stroke-width="0.8"/>
    <!-- 갑옷 (청록) -->
    <path d="M55 160 Q50 210 55 270 L145 270 Q150 210 145 160 Q120 152 100 152 Q80 152 55 160 Z" fill="#2a5a7a" stroke="#0a2030" stroke-width="1.5"/>
    <!-- 비늘 패턴 -->
    ${[[80,180],[100,180],[120,180],[90,195],[110,195],[80,210],[100,210],[120,210]].map(([x,y]) =>
      `<path d="M${x-6} ${y} Q${x} ${y-5} ${x+6} ${y} Q${x} ${y+3} ${x-6} ${y}" fill="#3a7a9a" opacity="0.7"/>`).join('')}
    <!-- 머리 -->
    ${face(100, 112, 28, '#b8c8d8')}
    <!-- 푸른 머리 -->
    <path d="M70 102 Q72 78 100 72 Q128 78 130 102 Q132 130 130 145 L128 142 Q120 130 100 130 Q80 130 72 142 L70 145 Q68 130 70 102 Z" fill="#1a3a5a"/>
    <!-- 머리띠 (조개) -->
    <path d="M75 95 Q100 88 125 95" stroke="#a8d0ff" stroke-width="2" fill="none"/>
    <ellipse cx="100" cy="92" rx="6" ry="3" fill="#fff" stroke="#a8d0ff"/>
    ${eyes(100, 114, 8)}
    <path d="M88 132 Q100 130 112 132" stroke="#1a3a5a" stroke-width="2" fill="none"/>
  </svg>`,

  // ── EP.2 ────────────────────────────────────────

  // 신하장군 — 황금 기마장군
  sinha_general: `<svg ${SIZE}>
    <defs><linearGradient id="bg-shg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#5a4a1a"/><stop offset="100%" stop-color="#1a1000"/>
    </linearGradient></defs>
    <rect width="200" height="280" fill="url(#bg-shg)"/>
    ${sunRays(100, 90, 45, 80, '#ffd700', 10)}
    <!-- 창 (좌측) -->
    <line x1="42" y1="90" x2="42" y2="245" stroke="#5a3a1a" stroke-width="3"/>
    <path d="M42 90 L36 76 L48 76 Z" fill="#c0c0c8" stroke="#3a3a4a"/>
    <rect x="38" y="98" width="8" height="6" fill="#aa2010"/>
    <!-- 망토 -->
    <path d="M55 160 L35 270 L75 270 L70 165" fill="#5a3010" opacity="0.85"/>
    <path d="M145 160 L165 270 L125 270 L130 165" fill="#5a3010" opacity="0.85"/>
    <!-- 갑옷 (황금) -->
    <path d="M55 160 Q50 210 55 270 L145 270 Q150 210 145 160 Q120 152 100 152 Q80 152 55 160 Z" fill="#aa8a30" stroke="#3a2810" stroke-width="1.5"/>
    <ellipse cx="58" cy="160" rx="14" ry="9" fill="#cd9020" stroke="#5a3a08"/>
    <ellipse cx="142" cy="160" rx="14" ry="9" fill="#cd9020" stroke="#5a3a08"/>
    <!-- 가슴 자수 (사슴) -->
    <path d="M92 195 L108 195 L100 218 Z" fill="#5a3a08"/>
    <circle cx="100" cy="195" r="3" fill="#cd1f1f"/>
    <!-- 머리 -->
    ${face(100, 110, 30, '#e0b890')}
    <!-- 투구 (장식) -->
    <path d="M68 95 Q70 56 100 50 Q130 56 132 95" fill="#5a3a08" stroke="#1a1000" stroke-width="1.5"/>
    <path d="M88 50 L100 30 L112 50 Z" fill="#cd1f1f" stroke="#5a0808"/>
    <ellipse cx="100" cy="56" rx="6" ry="14" fill="#aa6020"/>
    <!-- 콧수염 -->
    <path d="M85 124 L100 130 L115 124" stroke="#1a0808" stroke-width="3" fill="none"/>
    ${eyes(100, 112)}
    <path d="M90 138 Q100 142 110 138" stroke="#5a3a08" stroke-width="2" fill="none"/>
  </svg>`,

  // 호족 부족장 — 범가죽 갑옷, 호랑이 머리장식
  hojok_chief: `<svg ${SIZE}>
    <defs><linearGradient id="bg-hjc" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#5a2010"/><stop offset="100%" stop-color="#1a0500"/>
    </linearGradient></defs>
    <rect width="200" height="280" fill="url(#bg-hjc)"/>
    <!-- 으르렁 -->
    <path d="M30 30 L45 50 M170 35 L155 55" stroke="#cd6020" stroke-width="2" opacity="0.5"/>
    <!-- 큰 검 (좌측) -->
    <rect x="38" y="100" width="6" height="120" fill="#c0c0c8" stroke="#3a3a4a" stroke-width="1"/>
    <rect x="32" y="98" width="18" height="6" fill="#5a3a1a" stroke="#2a1a08"/>
    <path d="M41 220 L36 232 L46 232 Z" fill="#2a1a08"/>
    <!-- 갑옷 (범가죽 - 주황+검은줄무늬) -->
    <path d="M55 160 Q50 210 55 270 L145 270 Q150 210 145 160 Q120 152 100 152 Q80 152 55 160 Z" fill="#cd7020" stroke="#3a1808" stroke-width="1.5"/>
    <!-- 호랑이 줄무늬 -->
    <path d="M60 175 Q70 180 78 175 Q80 190 70 195 Q62 188 60 175 Z" fill="#1a0a00" opacity="0.7"/>
    <path d="M125 178 Q132 185 140 180 Q142 195 132 200 Q124 192 125 178 Z" fill="#1a0a00" opacity="0.7"/>
    <path d="M85 200 Q95 210 105 205 L100 220 Q90 218 85 200 Z" fill="#1a0a00" opacity="0.7"/>
    <path d="M110 215 Q120 220 130 215 L125 230 Q115 228 110 215 Z" fill="#1a0a00" opacity="0.7"/>
    <!-- 머리 -->
    ${face(100, 112, 30, '#d8a878')}
    <!-- 호랑이 머리장식 (모자) -->
    <path d="M65 95 Q70 50 100 45 Q130 50 135 95 L135 105 Q120 90 100 90 Q80 90 65 105 Z" fill="#cd6020" stroke="#3a1808" stroke-width="1.5"/>
    <!-- 호랑이 귀 -->
    <path d="M70 60 L78 45 L88 60 Z" fill="#cd6020" stroke="#3a1808"/>
    <path d="M130 60 L122 45 L112 60 Z" fill="#cd6020" stroke="#3a1808"/>
    <ellipse cx="80" cy="55" rx="3" ry="4" fill="#fff"/>
    <ellipse cx="120" cy="55" rx="3" ry="4" fill="#fff"/>
    <!-- 머리장식 줄무늬 -->
    <path d="M75 70 L85 78 M115 70 L125 78 M95 50 L105 58" stroke="#1a0a00" stroke-width="2"/>
    <!-- 사나운 눈 -->
    <path d="M82 110 L98 113 M118 113 L102 110" stroke="#1a0a00" stroke-width="2"/>
    <ellipse cx="90" cy="114" rx="2.5" ry="1.8" fill="#ffaa20"/>
    <ellipse cx="110" cy="114" rx="2.5" ry="1.8" fill="#ffaa20"/>
    <!-- 송곳니 입 -->
    <path d="M85 132 L100 142 L115 132" stroke="#1a0a00" stroke-width="2" fill="#3a1010"/>
    <path d="M93 138 L93 144 M107 138 L107 144" stroke="#fff" stroke-width="1.5"/>
  </svg>`,

  // 호족 전사 — 가죽 갑옷, 곤봉
  hojok_warrior: `<svg ${SIZE}>
    <defs><linearGradient id="bg-hjw" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3a2818"/><stop offset="100%" stop-color="#0a0500"/>
    </linearGradient></defs>
    <rect width="200" height="280" fill="url(#bg-hjw)"/>
    <!-- 곤봉 -->
    <rect x="40" y="100" width="8" height="120" fill="#5a3a1a" stroke="#2a1a08" stroke-width="1"/>
    <ellipse cx="44" cy="100" rx="14" ry="18" fill="#3a2010" stroke="#1a0a00"/>
    <circle cx="40" cy="92" r="3" fill="#3a2010"/>
    <circle cx="48" cy="95" r="3" fill="#3a2010"/>
    <circle cx="42" cy="105" r="2.5" fill="#3a2010"/>
    <!-- 가죽 갑옷 -->
    <path d="M55 160 Q50 210 55 270 L145 270 Q150 210 145 160 Q120 152 100 152 Q80 152 55 160 Z" fill="#5a3818" stroke="#1a0a00" stroke-width="1.5"/>
    <path d="M65 175 L100 170 L135 175 L130 200 L100 195 L70 200 Z" fill="#3a2008" opacity="0.7"/>
    <!-- 가죽끈 -->
    <line x1="65" y1="200" x2="135" y2="200" stroke="#1a0a00" stroke-width="2"/>
    <line x1="65" y1="220" x2="135" y2="220" stroke="#1a0a00" stroke-width="2"/>
    <!-- 머리 -->
    ${face(100, 112, 28, '#c89878')}
    <!-- 머리띠 (가죽) -->
    <rect x="68" y="98" width="64" height="6" fill="#3a1808" stroke="#1a0a00"/>
    <!-- 검은 머리 -->
    <path d="M72 104 Q75 80 100 76 Q125 80 128 104" fill="#1a0500"/>
    <!-- 험한 인상 -->
    <path d="M82 109 L98 112 M118 112 L102 109" stroke="#1a0500" stroke-width="2"/>
    ${eyes(100, 116, 8)}
    <path d="M85 134 L100 138 L115 134" stroke="#1a0500" stroke-width="2" fill="none"/>
    <!-- 흉터 -->
    <line x1="78" y1="105" x2="92" y2="125" stroke="#8a3010" stroke-width="1.5"/>
  </svg>`,

  // 호족 궁수 — 가벼운 가죽, 활
  hojok_archer: `<svg ${SIZE}>
    <defs><linearGradient id="bg-hja" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3a2a18"/><stop offset="100%" stop-color="#0a0500"/>
    </linearGradient></defs>
    <rect width="200" height="280" fill="url(#bg-hja)"/>
    <!-- 활 -->
    <path d="M155 80 Q178 160 155 240" stroke="#3a1a00" stroke-width="4" fill="none"/>
    <line x1="155" y1="82" x2="155" y2="238" stroke="#aaa" stroke-width="0.8"/>
    <!-- 가죽 외투 -->
    <path d="M55 160 Q50 210 55 270 L145 270 Q150 210 145 160 Q120 152 100 152 Q80 152 55 160 Z" fill="#6a4a28" stroke="#1a0a00" stroke-width="1.5"/>
    <path d="M55 160 L75 200 L65 270" stroke="#3a2010" stroke-width="2" fill="none"/>
    <!-- 화살통 -->
    <rect x="50" y="155" width="10" height="40" fill="#3a2010" stroke="#1a0a00"/>
    <line x1="53" y1="148" x2="53" y2="156" stroke="#aaa" stroke-width="1"/>
    <line x1="57" y1="146" x2="57" y2="156" stroke="#aaa" stroke-width="1"/>
    <!-- 머리 -->
    ${face(100, 112, 28, '#d8a880')}
    <!-- 두건 -->
    <path d="M68 100 Q70 65 100 60 Q130 65 132 100 L130 105 Q100 88 70 105 Z" fill="#5a3818" stroke="#2a1808" stroke-width="1.5"/>
    <path d="M68 100 L60 130 L72 130" fill="#5a3818" stroke="#2a1808"/>
    ${eyes(100, 114, 8)}
    <path d="M88 132 Q100 130 112 132" stroke="#3a1808" stroke-width="2" fill="none"/>
    <!-- 깃털 (모자) -->
    <path d="M118 75 Q120 55 124 50 Q128 55 126 78" fill="#7a4818" stroke="#3a1808"/>
  </svg>`,

  // 호족 기마 — 말 위, 창
  hojok_rider: `<svg ${SIZE}>
    <defs><linearGradient id="bg-hjr" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#5a3a18"/><stop offset="100%" stop-color="#1a0a00"/>
    </linearGradient></defs>
    <rect width="200" height="280" fill="url(#bg-hjr)"/>
    <!-- 먼지 -->
    <ellipse cx="60" cy="245" rx="40" ry="6" fill="#aa8050" opacity="0.4"/>
    <ellipse cx="140" cy="250" rx="35" ry="5" fill="#aa8050" opacity="0.4"/>
    <!-- 말 머리 (좌측 하단) -->
    <ellipse cx="40" cy="225" rx="22" ry="14" fill="#5a3010" stroke="#2a1000" stroke-width="1.5"/>
    <ellipse cx="28" cy="218" rx="6" ry="5" fill="#3a1808"/>
    <ellipse cx="36" cy="220" rx="2" ry="1.5" fill="#fff"/>
    <path d="M50 215 L62 200 Q66 218 58 230" fill="#1a0a00"/>
    <!-- 창 (긴) -->
    <line x1="160" y1="40" x2="115" y2="180" stroke="#5a3a1a" stroke-width="3"/>
    <path d="M160 40 L168 30 L155 26 Z" fill="#c0c0c8" stroke="#3a3a4a"/>
    <!-- 갑옷 -->
    <path d="M55 160 Q50 200 55 250 L145 250 Q150 200 145 160 Q120 152 100 152 Q80 152 55 160 Z" fill="#7a5028" stroke="#2a1808" stroke-width="1.5"/>
    <ellipse cx="58" cy="160" rx="13" ry="8" fill="#aa7038" stroke="#5a3018"/>
    <ellipse cx="142" cy="160" rx="13" ry="8" fill="#aa7038" stroke="#5a3018"/>
    <!-- 망토 -->
    <path d="M50 175 L70 250 L40 260 L30 250 Z" fill="#5a2010" opacity="0.85"/>
    <!-- 머리 -->
    ${face(100, 110, 28, '#d8a880')}
    <!-- 투구 -->
    <path d="M70 95 Q72 60 100 55 Q128 60 130 95" fill="#3a2010" stroke="#1a0a00" stroke-width="1.5"/>
    <ellipse cx="100" cy="58" rx="4" ry="10" fill="#aa3010"/>
    <path d="M70 88 L80 82 L90 88 L100 78 L110 88 L120 82 L130 88" stroke="#1a0a00" stroke-width="1" fill="none"/>
    ${eyes(100, 112)}
    <path d="M88 130 L100 134 L112 130" stroke="#1a0a00" stroke-width="2" fill="none"/>
  </svg>`,

  // 호족 샤먼 — 깃털 두건, 지팡이
  hojok_shaman: `<svg ${SIZE}>
    <defs><linearGradient id="bg-hjs" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3a2050"/><stop offset="100%" stop-color="#0a0418"/>
    </linearGradient></defs>
    <rect width="200" height="280" fill="url(#bg-hjs)"/>
    <!-- 영기 -->
    ${[[40,50],[160,55],[30,120],[170,130],[50,90],[150,95]].map(([x,y]) =>
      `<circle cx="${x}" cy="${y}" r="2.5" fill="#a070ff" opacity="0.7"/>`).join('')}
    <!-- 지팡이 -->
    <line x1="42" y1="80" x2="42" y2="245" stroke="#3a2018" stroke-width="3"/>
    <circle cx="42" cy="76" r="8" fill="#a070ff" stroke="#5a2080" stroke-width="1.5"/>
    <circle cx="42" cy="76" r="3" fill="#fff" opacity="0.8"/>
    <!-- 도포 (보라) -->
    <path d="M55 160 Q50 210 55 270 L145 270 Q150 210 145 160 Q120 152 100 152 Q80 152 55 160 Z" fill="#5a3a7a" stroke="#1a0828" stroke-width="1.5"/>
    <!-- 토템 -->
    <circle cx="100" cy="195" r="14" fill="#3a1808" stroke="#1a0500" stroke-width="1.5"/>
    <text x="100" y="202" font-size="18" fill="#ffd060" text-anchor="middle" font-family="'Noto Serif KR', serif">巫</text>
    <!-- 어깨 (뼈 장식) -->
    <ellipse cx="58" cy="160" rx="12" ry="7" fill="#cdc8a8"/>
    <ellipse cx="142" cy="160" rx="12" ry="7" fill="#cdc8a8"/>
    <!-- 머리 -->
    ${face(100, 116, 28, '#c89878')}
    <!-- 깃털 두건 -->
    <path d="M70 100 Q72 70 100 65 Q128 70 130 100 L130 110 Q100 90 70 110 Z" fill="#3a1808" stroke="#1a0500" stroke-width="1.5"/>
    <!-- 깃털들 -->
    <path d="M75 65 Q70 40 72 30 Q76 40 80 65 Z" fill="#aa3030" stroke="#5a1010"/>
    <path d="M100 55 Q97 25 100 15 Q103 25 103 55 Z" fill="#fff" stroke="#aaa"/>
    <path d="M125 65 Q130 40 128 30 Q124 40 120 65 Z" fill="#aa3030" stroke="#5a1010"/>
    <!-- 페인트 (얼굴 줄) -->
    <line x1="92" y1="105" x2="92" y2="135" stroke="#aa3030" stroke-width="2"/>
    <line x1="108" y1="105" x2="108" y2="135" stroke="#aa3030" stroke-width="2"/>
    <ellipse cx="91" cy="118" rx="2.2" ry="1.5" fill="#a070ff"/>
    <ellipse cx="109" cy="118" rx="2.2" ry="1.5" fill="#a070ff"/>
    ${mouth(100, 138, 6)}
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
