/* 이야기·대사 (1차: 태초마을 ~ 회색시티 체육관). 원작 흐름을 따르되 대사는 아이 눈높이로 새로 썼다. */
import { G, flag, setFlag, addItem, itemCount, receive, healParty, save, alive, seen, maxHp } from '../state.js';
import { DB, ITEMS, sp, monArt } from '../data.js';
import { say, ask, choose, toast, fade, PORTRAIT } from '../ui.js';
import { sfx, music } from '../audio.js';
import { makeMon } from '../battle/mech.js';
import { josa, pick } from '../util.js';
import { W } from './overworld.js';
import { placementPlan, placementQuestion, placementAnswer, placementDone, onBadge, GRADES } from '../learn/tutor.js';
import { placementQuiz } from '../learn/quiz.js';

const P = () => G.s.name, R = () => G.s.rival;
const who = { oak: ['오박사', 'oak'], rival: [null, 'rival'], mom: ['엄마', 'mom'], nurse: ['간호순', 'nurse'], clerk: ['점원', 'clerk'], brock: ['웅', 'brock'] };
const sayAs = (k, lines) => say(lines, { who: k === 'rival' ? R() : who[k][0], face: who[k][1] });

/* ── 지도별 음악 ── */
export function mapMusic(map) {
  const id = map.id;
  if (id === 'OaksLab') return 'lab';
  if (/Pokecenter|Mart/.test(id)) return 'center';
  if (id === 'PewterGym') return 'gym';
  if (id === 'ViridianForest') return 'forest';
  if (/Route/.test(id)) return 'route';
  return 'town';
}
export const announceIndoor = (id) => /Pokecenter|Mart|Gym|OaksLab|SchoolHouse/.test(id);
export const encounterChance = (rate) => Math.min(0.16, rate / 256);

/* ── NPC 보이기/위치/모습 ── */
export function npcVisible(map, n, idx) {
  const f = flag;
  if (map === 'PalletTown' && idx === 0) return false; // 오박사는 등장 연출 때만
  if (map === 'OaksLab') {
    if (idx === 4) return f('oakEscort');
    if (idx === 7) return false;
    if (idx === 0) return !f('rivalLeft');
    if (idx >= 1 && idx <= 3) return !(f('ball' + idx));
  }
  if (map === 'BluesHouse' && idx === 1) return false;
  if (map === 'ViridianCity') {
    if (idx === 4) return !f('pokedex');
    if (idx === 6) return f('pokedex');
  }
  if (map === 'PewterPokecenter' && idx === 2) return false;
  if (n.spriteName === 'PokeBall' && n.itemId && f(`item:${map}:${idx}`)) return false;
  return true;
}
export function npcPos(map, n, idx) { return null; }
export function npcKind(map, n, idx) {
  const K = { Mom: 'mom', Nurse: 'nurse', Clerk: 'clerk', Daisy: 'coolf', BrunetteGirl: 'girl', LittleGirl: 'girl', Gramps: 'oldman', Gentleman: 'gambler', LinkReceptionist: 'nurse', SuperNerd: 'nerd' };
  if (map === 'PewterGym' && idx === 0) return 'brock';
  if (map === 'ViridianForest' && n.isTrainer) return 'bugcatcher';
  if (map === 'PewterGym' && idx === 1) return 'camper';
  if (map === 'ViridianSchoolHouse' && idx === 1) return 'coolf';
  return K[n.spriteName] || null;
}
export function extraBlock(map, x, y) { return false; }
export const trainerBeaten = (map, o) => flag(`tr:${map}:${o.idx}`);

/* ── 막힌 문 ── */
export async function lockedDoor(dest) {
  if (/Gym/.test(dest || '')) return say(['체육관 문이 잠겨 있다…', '관장이 자리를 비운 것 같아.']);
  if (/Museum/.test(dest || '')) return say(['회색시티 박물관', '“화석과 우주 전시는 다음 모험에서 열려요!”']);
  if (/Cave/.test(dest || '')) return say(['어두운 동굴이다… 지금은 들어가지 않는 게 좋겠어.']);
  return say(['문이 잠겨 있다.']);
}

/* ── 걸을 때 일어나는 일 ── */
export async function stepTrigger(map, x, y, d) {
  const S = W.scene;
  if (map === 'PalletTown' && y <= 1 && !flag('gotStarter') && !flag('oakEscort')) { await oakIntercept(); return true; }
  if (map === 'OaksLab' && flag('gotStarter') && !flag('rivalBattled') && y >= 6) { await rivalBattle(); return true; }
  if (map === 'ViridianCity' && !flag('pokedex') && y <= 9 && y >= 8 && x >= 17 && x <= 19) {
    W.busy = true;
    await say(['“여긴 못 지나가! 포켓몬 도감도 없는 꼬마는 안 돼!”', '(할아버지가 길 한가운데 누워서 비켜 주지 않는다…)'], { who: '할아버지', face: 'oldman' });
    await say(['💡 힌트: 할아버지를 비키게 하려면', '① 오른쪽 아래 파란 지붕 가게(프렌들리숍)에 들어가서', '② 카운터의 점원에게 말을 걸어 포켓몬 도감을 받으면 돼!']);
    await S.walkPlayer('down', 1);
    W.busy = false;
    return true;
  }
  if (map === 'PewterCity' && !flag('badge1') && x >= 36 && y >= 15 && y <= 19) {
    W.busy = true;
    await say(['“잠깐! 체육관 관장 웅을 이기지 않으면 이 길로 못 가!”'], { who: '소년', face: 'youngster' });
    await S.walkPlayer('left', 1);
    W.busy = false;
    return true;
  }
  return false;
}
export async function bumpTrigger(map, x, y, d) {
  const m = DB.maps[map];
  if (!m.outdoor) return;
  if (x < 0 || y < 0 || x >= m.w || y >= m.h) {
    W.busy = true;
    await say(['이 길은 다음 모험에서 열려!', '지금은 회색시티 체육관 배지를 목표로 가 보자.']);
    W.busy = false;
  }
}
export async function enterMap(id) {
  if (id === 'PewterGym' && !flag('gymIntro')) {
    setFlag('gymIntro');
    W.busy = true;
    await say(['회색시티 체육관에 들어왔다!', '관장 웅은 “상황 문제”를 낸다고 한다. 문제를 끝까지 잘 읽자!']);
    if (!flag('squirtleGift')) await LINES['PewterGym:2']();
    W.busy = false;
  }
}

/* ── 오박사 등장 ~ 연구소 ── */
async function oakIntercept() {
  const S = W.scene;
  W.busy = true;
  await say(['“잠깐! 기다려라!”'], { who: '???' });
  const pal = DB.maps.PalletTown;
  const n = pal.npcs[0];
  const sp2 = S.add.sprite(0, 0, 'ch_oak', 3).setOrigin(0.5, 1);
  const o = { n, idx: 0, sp: sp2, x: G.s.x, y: G.s.y + 3, kind: 'oak', facing: 'up' };
  S.placeSprite(sp2, o.x, o.y); S.npcs.push(o); S.mapObjs.push(sp2);
  S.facePlayer('down');
  await S.walkNpc(o, 'up', 2, 200);
  await sayAs('oak', ['휴, 큰일 날 뻔했구나!', '풀숲에는 야생 포켓몬이 살고 있단다. 포켓몬 없이 들어가면 위험해!', `${P()}, 나를 따라 연구소로 오너라.`]);
  await fade(true, 250);
  setFlag('oakEscort');
  await S.loadMap('OaksLab', 5, 3, 'up', { quiet: true });
  await fade(false, 250);
  await labIntro();
  W.busy = false;
}

async function labIntro() {
  const S = W.scene;
  await sayAs('rival', ['할아버지! 기다리다 지쳤다고요!']);
  await sayAs('oak', [`오, ${R()}. 조금만 기다리려무나.`, `${P()}, 기다렸단다!`, '포켓몬 트레이너가 되려면 먼저 간단한 “자격 시험”을 봐야 해.', '어렵지 않아. 지금 알고 있는 만큼만 편하게 풀어 보렴.', '이 시험으로 너에게 딱 맞는 문제를 준비해 두마!']);
  const plan = placementPlan();
  for (let i = 0; i < plan.length; i++) {
    const q = placementQuestion(plan[i]);
    const ok = await placementQuiz(q, i + 1, plan.length);
    placementAnswer(q, ok);
  }
  const r = placementDone();
  setFlag('placement');
  await sayAs('oak', ['좋아, 수고했다!', `수학은 “${r.math}”부터, 과학은 “${r.sci}”부터 모험하면서 배워 보자.`,
    '포켓몬이 기술을 쓸 때마다 문제가 나온단다. 맞히면 기술이 명중하고, 틀리면 빗나가지.', '틀려도 괜찮아. 왜 틀렸는지 내가 옆에서 알려 주마!',
    '자, 이제 너의 첫 포켓몬을 줄 차례구나!']);
  save();
  await givePikachu();
}

/* 만화 1화처럼: 파이리·꼬부기·이상해씨는 이미 없고, 남은 한 마리 = 피카츄 */
async function givePikachu() {
  const S = W.scene;
  await sayAs('oak', ['원래 저 탁자 위에 파이리, 꼬부기, 이상해씨가 있었는데…', '아침 일찍 온 친구들이 모두 데려가 버렸단다. 허허, 이런!', '하지만 딱 한 마리가 남아 있지. 조금 고집이 세지만… 아주 특별한 아이란다.']);
  PORTRAIT['mon'] = monArt(25);
  seen(25);
  sfx('item');
  await say(['피카피카~! ⚡'], { who: '피카츄', face: 'mon' });
  const m = makeMon(25, 5);
  receive(m);
  setFlag('gotStarter', 25);
  await say([`${josa(P(), '은/는')} 오박사에게서 피카츄를 받았다!`]);
  await sayAs('oak', ['이 피카츄는 몬스터볼 안에 들어가는 걸 싫어한단다.', '대신 너를 졸졸 따라다닐 거야. 사이좋게 지내렴!', '피카츄에게 말을 걸면 기분도 알 수 있단다.']);
  W.scene.refreshFollower?.();
  // 라이벌은 이브이
  await sayAs('rival', ['할아버지! 나도! 나도 포켓몬 줘요!']);
  await sayAs('oak', ['허허, 그래. 너에게는 이 이브이를 주마.']);
  seen(133);
  setFlag('rivalStarter', 133);
  sfx('item');
  await sayAs('rival', [`${josa(R(), '은/는')} 오박사에게서 이브이를 받았다!`, '헤헤, 이브이는 나중에 여러 모습으로 진화할 수 있다고! 부럽지?']);
  save();
}

async function pickStarter(idx) {
  if (!flag('gotStarter')) return sayAs('oak', ['그 몬스터볼은 비어 있단다. 나에게 말을 걸어 보렴!']);
  return say(['빈 몬스터볼이다. 다른 트레이너가 포켓몬을 데려갔나 봐.']);
}

async function rivalBattle() {
  const S = W.scene;
  W.busy = true;
  const rv = S.npcBy((x) => x.idx === 0);
  S.facePlayer('up');
  await sayAs('rival', [`잠깐, ${P()}!`, '할아버지한테 받은 포켓몬으로 한번 겨뤄 보자!']);
  await sayAs('oak', ['첫 배틀이구나! 잘 들어라.', '“싸운다”를 누르고 기술을 고르면 문제가 나온단다.', '문제를 맞히면 기술이 명중! 틀리면 빗나가지만, 내가 이유를 설명해 주마.', '연속으로 맞히면 경험치도 더 많이 받는단다. 자, 시작!']);
  const res = await W.trainerBattle({ party: [[133, 5]], name: R(), face: 'rival', intro: `라이벌 ${josa(R(), '이/가')} 승부를 걸어 왔다!`, lose: '뭐야! 내 포켓몬이 더 유리했는데!', win: '헤헤, 역시 내가 최고야!', noBlackout: true, money: 175 });
  setFlag('rivalBattled');
  healParty();
  if (res === 'win') await sayAs('rival', ['쳇, 이번엔 운이 좋았어!', '더 강한 포켓몬을 잔뜩 잡아서 다시 올 테다! 할아버지, 안녕!']);
  else await sayAs('rival', ['헤헤, 내가 이겼다! 더 강해져서 다시 덤벼!']);
  await sayAs('oak', ['둘 다 멋진 승부였다! 포켓몬 체력은 내가 회복시켜 두었단다.']);
  if (rv) { await S.walkNpc(rv, rv.x < 5 ? 'down' : 'down', 1); for (let i = 0; i < 7 && rv.y < 11; i++) await S.walkNpc(rv, 'down', 1, 160); S.removeNpc(rv); }
  setFlag('rivalLeft');
  save();
  W.busy = false;
}

/* ── 말 걸기 ── */
export async function talk(map, o) {
  const f = flag;
  const i = o.idx;
  const k = `${map}:${i}`;
  // 아이템 공
  if (o.n.itemId && o.n.spriteName === 'PokeBall') {
    const it = ITEMS[o.n.itemId] || { name: '도구' };
    addItem(o.n.itemId, 1); setFlag(`item:${map}:${i}`); W.scene.removeNpc(o); sfx('item');
    return say([`${josa(P(), '은/는')} ${josa(it.name, '을/를')} 주웠다!`]);
  }
  if (o.n.isTrainer && !trainerBeaten(map, o)) return trainerEncounter(map, o);
  if (o.n.isTrainer && TRAINER[k]) return say(TRAINER[k].post.slice(1).length ? TRAINER[k].post.slice(1) : TRAINER[k].post, { who: TRAINER[k].name, face: o.kind });
  const L = LINES[k];
  if (typeof L === 'function') return L(o);
  if (L) return say(Array.isArray(L) ? L : [L], { who: o.kind === 'nurse' ? '간호순' : undefined, face: o.kind });
  return say(['……']);
}

const nurse = async () => {
  const yes = await ask('포켓몬센터에 어서 오세요! 포켓몬을 회복시켜 드릴까요?', { who: '간호순', face: 'nurse' });
  if (!yes) return say(['또 오세요!'], { who: '간호순', face: 'nurse' });
  await say(['포켓몬을 잠시 맡아 둘게요…'], { who: '간호순', face: 'nurse' });
  sfx('heal'); healParty();
  G.s.respawn = { map: G.s.map, x: G.s.x, y: G.s.y };
  save();
  return say(['기다리셨죠! 포켓몬이 모두 건강해졌어요.', '또 오세요!'], { who: '간호순', face: 'nurse' });
};
const clerk = async () => {
  if (!flag('parcel') && !flag('pokedex') && G.s.map === 'ViridianMart') {
    await say(['어서 오세요! 어, 네가 피카츄를 데리고 다닌다는 그 트레이너구나?', '오박사님이 전화로 부탁하셨어. 이걸 꼭 너에게 전해 달라고!'], { who: '점원', face: 'clerk' });
    setFlag('parcel'); setFlag('pokedex'); sfx('item');
    await say([`${josa(P(), '은/는')} 포켓몬 도감을 받았다!`, '만난 포켓몬과 잡은 포켓몬이 자동으로 기록된다!']);
    addItem(4, 5); sfx('item');
    await say([`${josa(P(), '은/는')} 몬스터볼을 5개 받았다!`]);
    await say(['아, 그리고 북쪽 길에 누워 계시던 할아버지 말이야…', '도감을 받은 트레이너에게는 길을 비켜 주신대! 이제 2번도로로 갈 수 있을 거야.'], { who: '점원', face: 'clerk' });
    W.updateGoal?.(); save(); return;
  }
  return W.openShop?.();
};

const LINES = {
  'RedsHouse1F:0': async () => {
    if (!flag('gotStarter')) return say([`${P()}, 오늘은 오박사님 댁에 가는 날이지?`, '풀숲에는 혼자 들어가면 안 된다! 조심히 다녀오렴.'], { who: '엄마', face: 'mom' });
    await say([`${P()}! 모험은 즐겁니?`, '잠깐 쉬고 가렴.'], { who: '엄마', face: 'mom' });
    sfx('heal'); healParty(); save();
    return say(['포켓몬들이 기운을 되찾았다!', '엄마: “힘내! 틀린 문제는 모험의 보물이란다.”']);
  },
  'BluesHouse:0': () => say(flag('gotStarter') ? ['포켓몬이랑 사이좋게 지내렴!', `${R()} 녀석, 벌써 상록시티로 갔다던데?`] : [`안녕 ${P()}!`, `${R()}는 할아버지 연구소에 갔어.`], { who: '누나', face: 'coolf' }),
  'BluesHouse:2': () => say(['탁자 위에 지도가 펼쳐져 있다. 태초마을 위쪽에 상록시티가 있다!']),
  'PalletTown:1': () => say(['나도 포켓몬을 키우고 있어!', '포켓몬이 있으면 풀숲에 들어가도 괜찮아.']),
  'PalletTown:2': () => say(['과학의 힘은 대단해!', '포켓몬을 컴퓨터로 옮겨서 보관할 수도 있대.']),
  'Route1:0': async () => {
    if (flag('potionSample')) return say(['몬스터볼은 상록시티 프렌들리숍에서 팔아!']);
    await say(['안녕! 나는 프렌들리숍 점원이야.', '상록시티 가게를 홍보하는 중이지. 옜다, 견본품!']);
    addItem(20, 1); setFlag('potionSample'); sfx('item');
    return say([`${josa(P(), '은/는')} 상처약을 받았다!`, '(가방에서 쓰면 포켓몬 HP가 20 회복돼!)']);
  },
  'Route1:1': () => say(['저기 턱 보이지?', '위에서 뛰어내릴 수는 있지만, 아래에서 올라갈 순 없어!']),
  'ViridianCity:0': () => say(['허리에 몬스터볼을 찼구나! 멋지다!', '포켓몬은 언제 어디서나 함께할 수 있어.']),
  'ViridianCity:1': () => say(['이 체육관은 늘 닫혀 있어.', '관장이 대체 누굴까?']),
  'ViridianCity:2': async () => {
    const y = await ask('애벌레 포켓몬 두 종류에 대해 알고 싶니?');
    return say(y ? ['캐터피는 독이 없지만, 뿔충이는 머리에 독침이 있어!', '뿔충이의 독침을 조심해!'] : ['그래, 알았어!']);
  },
  'ViridianCity:3': () => say(flag('pokedex') ? ['회색시티에 가려면 상록숲을 지나가야 해.', '숲은 미로 같으니까 표지판을 잘 읽어 봐!'] : ['할아버지! 너무해요!', '미안해… 할아버지는 포켓몬 도감을 가진 트레이너만 지나가게 해 주셔.', '파란 지붕 가게(프렌들리숍) 점원 아저씨가 오박사님 선물을 갖고 있대. 가 봐!']),
  'ViridianCity:4': () => say(['“포켓몬 도감이 없으면 못 지나가!”', '💡 파란 지붕 가게(프렌들리숍) 점원에게 말을 걸어 도감을 받아 오자!'], { who: '할아버지', face: 'oldman' }),
  'ViridianCity:5': () => say(['하암~ 햇볕 아래서 깜빡 졸았네.', '꿈속에서 곱셈구구를 외우고 있었지 뭐야!']),
  'ViridianCity:6': async () => {
    await say(['아, 커피를 마시니 기분이 좋구나!', '포켓몬 도감을 들고 있네? 포켓몬을 잡으면 도감이 자동으로 채워진단다.']);
    const y = await ask('포켓몬 잡는 법을 알려 줄까?', { who: '할아버지', face: 'oldman' });
    if (!y) return say(['시간은 금이지! 어서 가 보렴.']);
    return say(['첫째, 싸워서 야생 포켓몬의 HP를 줄여라.', 'HP가 빨간색이 될 만큼 줄었을 때 “가방”에서 몬스터볼을 던지면 잘 잡힌단다.', '잠들거나 마비된 포켓몬은 더 잘 잡혀!', '확률 이야기이니, 여러 번 던지면 언젠가는 잡힐 거야. 허허!'], { who: '할아버지', face: 'oldman' });
  },
  'ViridianPokecenter:0': nurse, 'PewterPokecenter:0': nurse,
  'ViridianPokecenter:1': () => say(['포켓몬센터에서는 언제든지 공짜로 포켓몬을 회복할 수 있단다.']),
  'ViridianPokecenter:2': () => say(['포켓몬이 6마리가 넘으면 자동으로 보관함에 들어가.', '구석의 PC로 보관함을 볼 수 있어!']),
  'ViridianPokecenter:3': () => say(['통신 교환 서비스는 지금 준비 중이에요.'], { who: '안내원', face: 'nurse' }),
  'PewterPokecenter:1': () => say(['바위 포켓몬에게는 전기 기술이 전혀 안 통해!', '땅 타입이 섞여 있으면 전기를 땅으로 흘려보내 버리거든.']),
  'PewterPokecenter:3': () => say(['통신 교환 서비스는 지금 준비 중이에요.'], { who: '안내원', face: 'nurse' }),
  'ViridianMart:0': clerk, 'PewterMart:0': clerk,
  'ViridianMart:1': () => say(['몬스터볼은 포켓몬 HP가 적을 때 던져야 잘 잡혀!']),
  'ViridianMart:2': () => say(['상처약은 배틀 중에도 가방에서 쓸 수 있어.']),
  'PewterMart:1': () => say(['해독제도 몇 개 챙겨 둬. 상록숲의 뿔충이는 독침을 쓰거든!']),
  'PewterMart:2': () => say(['박물관에 가 봤니? 수억 년 전 화석이 있대!']),
  'ViridianSchoolHouse:0': () => say(['칠판을 봐! 선생님이 내 공부 기록을 적어 주셨어.', '틀린 문제를 다시 풀면 진짜 실력이 된대!']),
  'ViridianSchoolHouse:1': async () => {
    await say(['트레이너 학교에 온 걸 환영해!'], { who: '선생님', face: 'coolf' });
    const y = await ask('연습 문제를 3개 풀어 볼래? 한 문제 맞힐 때마다 100원을 줄게!', { who: '선생님', face: 'coolf' });
    if (!y) return say(['언제든 다시 오렴!'], { who: '선생님', face: 'coolf' });
    return W.practice?.(3);
  },
  'ViridianForestSouthGate:0': () => say(['상록숲은 미로 같아.', '나무 사이 좁은 길을 잘 찾아 봐!']),
  'ViridianForestSouthGate:1': () => say(['숲에는 벌레 포켓몬이 많아!', '피카츄도 아주 가끔 나온대!']),
  'ViridianForestNorthGate:0': () => say(['상록숲을 빠져나왔구나!', '회색시티 박물관에는 화석이 있어. 화석은 아주 오래전 생물의 흔적이야.']),
  'ViridianForestNorthGate:1': () => say(['허허, 숲을 무사히 지나왔구나. 장하다!']),
  'ViridianForest:0': () => say(['숲 속 트레이너들은 눈이 마주치면 바로 승부를 걸어 와!', '포켓몬 HP가 적으면 조심해!']),
  'ViridianForest:7': () => say(['피카츄는 이 숲에서 아주 가끔 나와.', '전기 포켓몬이라 비행 포켓몬에게 강하대!']),
  'PewterCity:0': () => say(['박물관에 가 봤니?', '돌 속에 조개 모양이 찍힌 화석이 있어. 옛날엔 여기가 바다였대!']),
  'PewterCity:1': () => say(['웅은 회색시티 체육관 관장이야.', '바위처럼 단단한 포켓몬을 쓰지!']),
  'PewterCity:2': () => say(['바위 포켓몬에게는 물이나 풀 기술이 잘 들어!', '불꽃이나 노말 기술은 잘 안 통해.']),
  'PewterCity:3': () => say(['강한 트레이너는 문제를 풀 때도 차분하게 끝까지 읽는대!']),
  'PewterCity:4': () => say(flag('badge1') ? ['회색배지를 땄구나! 대단해!', '다음 길은 곧 열릴 거야. 조금만 기다려!'] : ['웅을 이기기 전엔 이 길로 못 가!']),
  'PewterGym:2': async () => {
    if (!flag('squirtleGift')) {
      await say(['어이, 챔피언 지망생! 피카츄를 데리고 왔구나.', '그런데 웅의 바위 포켓몬에게는 전기 기술이 전혀 안 통해!', '그래서 도전자에게 빌려주는 친구가 있지. 이 꼬부기를 데려가!'], { who: '가이드', face: 'guide' });
      const m = makeMon(7, 8); const where = receive(m); setFlag('squirtleGift'); sfx('item');
      await say([`${josa(P(), '은/는')} 꼬부기를 받았다!${where === 'box' ? ' (보관함으로 보냈다)' : ''}`, '💡 배틀 중 “포켓몬”을 눌러 꼬부기로 바꾸면 물 기술로 바위 포켓몬을 쉽게 이길 수 있어!']);
      save(); return;
    }
    return say(['어이, 챔피언 지망생!', '웅의 포켓몬은 바위 타입이야. 물·풀 기술이 효과가 굉장하지!', '그리고 웅은 “상황 문제”를 내. 포켓몬 세계 이야기 속 문제니까 끝까지 읽어!', '체력이 걱정되면 포켓몬센터에서 회복하고 오렴!'], { who: '가이드', face: 'guide' });
  },
  'PewterGym:0': async (o) => {
    if (flag('badge1')) return say(['회색배지는 네가 힘들게 배운 증거야.', '다음 체육관에서도 멋지게 해 봐!'], { who: '웅', face: 'brock' });
    await say(['나는 회색시티 체육관 관장, 웅!', '내 바위 포켓몬은 단단하고, 내 문제는 진짜 세상 이야기로 되어 있지.', '문제를 잘 읽고, 왜 그런지 생각하는 트레이너만 나를 이길 수 있다!', '자, 덤벼라!'], { who: '웅', face: 'brock' });
    const res = await W.trainerBattle({ cls: 'Brock', set: 0, name: '웅', face: 'brock', intro: '관장 웅이 승부를 걸어 왔다!', story: true, gym: true, lose: '…졌다. 네 실력을 인정하마!', money: 1386, music: 'gym' });
    if (res !== 'win') return;
    await say(['네가 이겼다. 대단하구나!', '이 회색배지를 받아라.'], { who: '웅', face: 'brock' });
    setFlag('badge1'); G.s.badges.push('boulder'); onBadge(); sfx('badge');
    await say([`${josa(P(), '은/는')} 회색배지를 받았다!`, '(이제 문제가 한 단계 더 어려워진다! 더 멋진 트레이너가 되어 보자.)']);
    save();
    await W.chapterEnd?.();
  },
};

/* ── 표지판 ── */
const SIGNS = {
  'PalletTown:1': ['오박사 포켓몬 연구소'], 'PalletTown:2': ['태초마을', '새하얀 시작의 마을'],
  'PalletTown:3': () => [`${P()}의 집`], 'PalletTown:4': () => [`${R()}의 집`],
  'RedsHouse1F:1': ['TV에서 영화를 하고 있다.', '소년 네 명이 기찻길을 따라 모험을 떠난다… 나도 가 볼까!'],
  'RedsHouse2F:1': async () => {
    if (!flag('pcPotion')) { setFlag('pcPotion'); addItem(20, 1); sfx('item'); return ['PC를 켰다.', '보관해 둔 상처약을 꺼냈다!']; }
    return ['PC를 켰다. 특별한 건 없다.'];
  },
  'RedsHouse2F:2': ['게임기다!', '…지금은 진짜 모험을 떠날 시간이야!'],
  'BluesHouse:1': ['책장에 포켓몬 책이 가득하다.'], 'BluesHouse:2': ['책장에 포켓몬 책이 가득하다.'], 'BluesHouse:3': ['창밖으로 태초마을이 보인다.'],
  'OaksLab:1': ['포켓몬 연구 자료가 빼곡하다.'], 'OaksLab:2': ['포켓몬 연구 자료가 빼곡하다.'],
  'OaksLab:3': ['PC에 이메일이 와 있다.', '“오박사님, 곧 소포를 보내 드릴게요. — 상록시티 프렌들리숍”'], 'OaksLab:4': ['PC에 포켓몬 연구 자료가 띄워져 있다.'],
  'Route1:1': ['1번도로', '태초마을 ↔ 상록시티'],
  'ViridianCity:1': ['상록시티', '영원히 푸른 낙원'], 'ViridianCity:2': ['트레이너 팁', '포켓몬을 많이 잡을수록 배틀이 쉬워져요!'],
  'ViridianCity:3': ['트레이너 팁', '기술은 PP만큼 쓸 수 있어요. PP는 포켓몬센터에서 채울 수 있어요!'],
  'ViridianCity:4': ['프렌들리숍'], 'ViridianCity:5': ['포켓몬센터'], 'ViridianCity:6': ['상록시티 포켓몬 체육관'],
  'ViridianPokecenter:1': null, 'ViridianPokecenter:2': ['포켓몬센터', '포켓몬의 건강을 책임집니다!'],
  'PewterPokecenter:1': null, 'PewterPokecenter:2': ['포켓몬센터', '포켓몬의 건강을 책임집니다!'],
  'ViridianSchoolHouse:1': ['공책에 적혀 있다.', '“틀린 문제는 보물! 왜 틀렸는지 알면 두 번 틀리지 않는다.”'],
  'ViridianSchoolHouse:2': null,
  'Route2:1': ['2번도로', '상록시티 ↔ 회색시티'], 'Route2:2': ['디그다굴', '(동굴 입구다)'],
  'ViridianForest:1': ['트레이너 팁', '풀숲을 피해서 걸으면 야생 포켓몬을 덜 만나요.'],
  'ViridianForest:2': ['숲 속 과학 이야기', '캐터피 → 단데기 → 버터플!', '알 → 애벌레 → 번데기 → 어른벌레처럼 번데기를 거치는 것을 “완전 탈바꿈”이라고 해요.'],
  'ViridianForest:3': ['트레이너 팁', '독에 걸리면 걸을 때마다 HP가 줄어요. 해독제를 쓰거나 포켓몬센터에 가요!'],
  'ViridianForest:4': ['숲 속 과학 이야기', '숲은 여름에도 시원해요.', '나뭇잎이 햇빛을 가리고, 잎에서 물이 수증기로 날아가면서 열을 가져가기 때문이에요.'],
  'ViridianForest:5': ['상록숲', '출구는 북쪽!'], 'ViridianForest:6': ['상록숲 출구', '이 앞은 회색시티 방향'],
  'PewterCity:1': ['회색시티', '바위처럼 단단한 회색의 도시'], 'PewterCity:2': ['트레이너 팁', '배틀 전에는 포켓몬센터에서 회복해요!'],
  'PewterCity:3': ['프렌들리숍'], 'PewterCity:4': ['포켓몬센터'], 'PewterCity:5': ['회색시티 박물관', '화석과 우주의 비밀'],
  'PewterCity:6': ['회색시티 포켓몬 체육관', '관장: 웅 — 바위처럼 단단한 남자!'],
  'PewterCity:7': ['트레이너 팁', '체육관 관장은 “상황 문제”를 내요. 끝까지 읽어 보세요!'],
  'PewterGym:1': () => [flag('badge1') ? `회색시티 체육관 — 우승 트레이너: ${P()}` : '회색시티 체육관 — 우승 트레이너: …'],
  'PewterGym:2': () => [flag('badge1') ? `회색시티 체육관 — 우승 트레이너: ${P()}` : '회색시티 체육관 — 우승 트레이너: …'],
};

export async function readSign(map, s) {
  const key = `${map}:${s.textId}`;
  // 포켓몬센터 PC, 학교 칠판은 특별한 화면
  if ((map === 'ViridianPokecenter' || map === 'PewterPokecenter') && s.textId === 1) return W.openBox?.();
  if (map === 'ViridianSchoolHouse' && s.textId === 2) return W.openReport?.();
  let L = SIGNS[key];
  if (typeof L === 'function') L = await L();
  if (!L) return say(['……']);
  return say(L);
}
export async function inspect(map, x, y, c) {
  // 오박사 연구소 탁자 위 몬스터볼 / 도감
  if (map === 'OaksLab') {
    const npc = DB.maps.OaksLab.npcs.findIndex((n) => n.x === x && n.y === y);
    if (npc === 5 || npc === 6) return say(['탁자 위에 만들다 만 포켓몬 도감이 놓여 있다.']);
  }
  if (c === 'K') return say(['책장에 책이 가득하다.']);
  if (c === 'M') return say(['기계가 윙윙 소리를 내고 있다.']);
  if (c === 'V') return say(['TV 속에서 포켓몬 퀴즈 쇼를 하고 있다!']);
}

/* 오박사 대화 (연구소) */
LINES['OaksLab:4'] = async () => {
  if (!flag('placement')) return labIntro();
  if (!flag('gotStarter')) return givePikachu();
  if (itemCount(900) && !flag('pokedex')) {
    await sayAs('oak', ['오! 그건 내가 주문한 소포로구나. 고맙다!', '답례로 이걸 주마. 포켓몬 도감이란다!', '만난 포켓몬과 잡은 포켓몬이 자동으로 기록되지.', '151마리를 모두 채우는 게 나의 꿈이란다. 네가 도와주겠니?']);
    addItem(900, -1); setFlag('pokedex'); sfx('item');
    await say([`${josa(P(), '은/는')} 포켓몬 도감을 받았다!`]);
    addItem(4, 5); sfx('item');
    await say([`${josa(P(), '은/는')} 몬스터볼을 5개 받았다!`]);
    await sayAs('oak', ['야생 포켓몬을 약하게 만든 뒤 몬스터볼을 던지면 잡을 수 있단다.', '북쪽 상록시티를 지나면 상록숲, 그 너머 회색시티에 체육관이 있지. 힘내라!']);
    save(); return;
  }
  if (!flag('pokedex')) return sayAs('oak', ['북쪽 1번도로를 쭉 올라가면 상록시티가 나온단다.', '상록시티의 파란 지붕 가게(프렌들리숍)에 너에게 줄 선물을 맡겨 두었지!', '점원에게 말을 걸어 보렴.']);
  const c = Object.keys(G.s.dex.caught).length;
  return sayAs('oak', [`도감은 잘 채우고 있니? 지금 ${c}마리를 잡았구나!`, c < 10 ? '풀숲마다 사는 포켓몬이 달라. 여기저기 찾아보렴!' : '훌륭해! 이대로 151마리를 향해!']);
};
LINES['OaksLab:0'] = () => sayAs('rival', flag('gotStarter') ? ['내 포켓몬이 더 강해!'] : ['할아버지가 포켓몬을 준다고 해서 기다리는 중이야!']);
LINES['OaksLab:1'] = () => pickStarter(1);
LINES['OaksLab:2'] = () => pickStarter(2);
LINES['OaksLab:3'] = () => pickStarter(3);
LINES['OaksLab:8'] = () => say(['오박사님은 포켓몬 연구의 최고 권위자셔!']);
LINES['OaksLab:9'] = () => say(['포켓몬이 기술을 쓸 때 머리를 쓰면 더 강해진다… 오박사님의 연구 주제야.']);
LINES['OaksLab:10'] = () => say(['도감 기능을 개발 중이야. 조금만 기다려 줘!']);

/* ── 트레이너 ── */
const TRAINER = {
  'ViridianForest:1': { name: '곤충채집소년', pre: ['숲에서 만난 트레이너는 무조건 승부야!'], post: ['캐터피로는 안 되나…', '다음엔 버터플로 진화시켜서 올 거야!'], money: 60 },
  'ViridianForest:2': { name: '곤충채집소년', pre: ['잠깐! 벌레 포켓몬의 무서움을 보여 주지!'], post: ['포켓몬이 다 떨어졌어…', '뿔충이는 딱충이가 되고, 나중엔 독침붕이 돼!'], money: 70 },
  'ViridianForest:3': { name: '곤충채집소년', pre: ['눈이 마주쳤다! 승부다!'], post: ['졌다! 너 정말 잘하는구나!', '곤충은 다리가 6개야. 거미는 8개라서 곤충이 아니래!'], money: 90 },
  'PewterGym:1': { name: '캠프보이', pre: ['웅 관장님께 가려면 나를 먼저 이겨라!', '바위 포켓몬은 단단하다고!'], post: ['졌다!', '빛의 속도로 1년 동안 가는 거리를 “광년”이라고 해. 시간이 아니라 거리야!'], money: 220 },
};
export async function trainerEncounter(map, o) {
  const k = `${map}:${o.idx}`;
  const t = TRAINER[k] || { name: '트레이너', pre: ['승부다!'], post: ['졌다!'], money: 50 };
  await say(t.pre, { who: t.name, face: o.kind });
  const res = await W.trainerBattle({ cls: o.n.trainerClass, set: (o.n.trainerSet || 1) - 1, name: t.name, face: o.kind, intro: `${josa(t.name, '이/가')} 승부를 걸어 왔다!`, lose: t.post[0], money: t.money });
  if (res === 'win') { setFlag(`tr:${map}:${o.idx}`); save(); await say(t.post.slice(1).length ? t.post.slice(1) : ['…'], { who: t.name, face: o.kind }); }
}
export { GRADES };

/* ── 따라오는 포켓몬에게 말 걸기 ── */
export async function talkFollower() {
  const m = G.s.party[0]; if (!m) return;
  const nm = sp(m.sp).name;
  PORTRAIT['mon'] = monArt(m.sp);
  const mx = maxHp(m);
  const lines = m.hp <= 0 ? [`${josa(nm, '은/는')} 지쳐서 쓰러져 있다… 포켓몬센터에 데려가자!`]
    : m.hp < mx / 3 ? [`${josa(nm, '은/는')} 조금 힘들어 보인다. 쉬고 싶은 것 같아.`]
    : [pick([`${josa(nm, '은/는')} 신나서 폴짝 뛰었다!`, `${josa(nm, '은/는')} ${P()}의 얼굴을 빤히 보고 있다.`, `${josa(nm, '은/는')} 문제를 맞힐 때마다 기분이 좋아지는 것 같다!`, `${josa(nm, '은/는')} 콧노래를 부르고 있다.`]), m.sp === 25 ? '피카피카~! ⚡' : `${nm}! ♪`];
  sfx('talk');
  return say(lines, { who: nm, face: 'mon' });
}

/* ── 다음 목표 (화면 위 안내판) ── */
const DIR = { north: '↑ 북쪽', south: '↓ 남쪽', east: '→ 동쪽', west: '← 서쪽' };
// 목표 지도로 가는 길: 지금 지도 -> 가야 할 방향
const ROUTE_TO = {
  ViridianCity: { PalletTown: 'north', Route1: 'north', RedsHouse1F: 'south', RedsHouse2F: 'south', OaksLab: 'south', BluesHouse: 'south' },
  PewterCity: { PalletTown: 'north', Route1: 'north', ViridianCity: 'north', Route2: 'north', ViridianForest: 'north', ViridianForestSouthGate: 'north', ViridianForestNorthGate: 'north',
    ViridianPokecenter: 'south', ViridianMart: 'south', ViridianSchoolHouse: 'south', OaksLab: 'south', RedsHouse1F: 'south', RedsHouse2F: 'south', BluesHouse: 'south' },
};
export function objective() {
  const f = flag, map = G.s.map;
  const go = (target, text, detail) => ({ text, detail, dir: map === target ? '' : DIR[ROUTE_TO[target]?.[map]] || '' });
  if (!f('oakEscort')) return { text: '집을 나가 마을 북쪽 풀숲 쪽으로 가 보자', detail: ['계단(오른쪽 위)으로 1층에 내려가서, 아래쪽 문으로 나가자.', '마을 위쪽 풀숲으로 가면 오박사님을 만날 수 있어!'], dir: map === 'PalletTown' ? DIR.north : '' };
  if (!f('placement') || !f('gotStarter')) return { text: '연구소에서 오박사님께 말을 걸자', detail: ['오박사님 앞에서 A(스페이스) 버튼을 누르면 돼.'], dir: '' };
  if (!f('rivalBattled')) return { text: '연구소 출구 쪽으로 걸어가 보자 (라이벌이 기다려!)', detail: ['아래쪽 출구로 걸어가면 라이벌이 승부를 걸어 와.'], dir: '↓' };
  if (!f('pokedex')) return go('ViridianCity', '상록시티 파란 지붕 가게에서 도감 받기', ['태초마을 북쪽 → 1번도로 → 상록시티.', '파란 지붕 “프렌들리숍”에 들어가 점원에게 말을 걸자!']);
  if (!f('badge1')) {
    if (/^Pewter/.test(map)) return { text: '회색시티 체육관(보라 지붕)에서 관장 웅을 이기자', detail: ['체육관 가이드에게 먼저 말을 걸면 선물을 줘!', '포켓몬이 지치면 포켓몬센터(빨간 지붕)에서 쉬자.'], dir: '' };
    return go('PewterCity', '상록숲을 지나 회색시티로!', ['상록시티 북쪽 → 2번도로 → 건물(숲 입구)로 들어가 상록숲을 통과하자.', '숲에서는 표지판을 읽으며 북쪽 출구를 찾자!']);
  }
  return { text: '1차 모험 완료! 도감을 채우며 다음 판을 기다리자', detail: ['풀숲에서 여러 포켓몬을 잡아 보자!'], dir: '' };
}

/* ── 야생 포켓몬: 원작 출현표 + 여러 친구 섞기 ── */
const EXTRA_WILD = {
  Route1: [['Spearow', 3], ['NidoranF', 3], ['NidoranM', 3], ['Jigglypuff', 3], ['Mankey', 3], ['Meowth', 3]],
  Route2: [['Caterpie', 4], ['NidoranF', 4], ['NidoranM', 4], ['Oddish', 4], ['Bellsprout', 4], ['Mankey', 4], ['Sandshrew', 4]],
  ViridianForest: [['Oddish', 5], ['Bellsprout', 5], ['Paras', 5], ['Venonat', 5], ['Butterfree', 7], ['Beedrill', 7]],
};
/** 35% 확률로 여러 친구 중 하나, 아니면 null(원작 출현표 사용) */
export function wildPick(mapId) {
  const extra = EXTRA_WILD[mapId];
  if (extra && Math.random() < 0.35) { const [key, lv] = extra[Math.floor(Math.random() * extra.length)]; return { species: key, level: lv + Math.floor(Math.random() * 2) }; }
  return null;
}
