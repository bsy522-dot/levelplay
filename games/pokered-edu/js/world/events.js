/* 이야기·대사 (1차: 태초마을 ~ 회색시티 체육관). 원작 흐름을 따르되 대사는 아이 눈높이로 새로 썼다. */
import { G, flag, setFlag, addItem, itemCount, receive, healParty, save, alive, seen, maxHp } from '../state.js';
import { DB, ITEMS, sp, monArt } from '../data.js';
import { say, ask, choose, toast, fade, PORTRAIT } from '../ui.js';
import { sfx, music } from '../audio.js';
import { makeMon } from '../battle/mech.js';
import { josa, pick } from '../util.js';
import { W } from './overworld.js';
import { placementPlan, placementQuestion, placementAnswer, placementDone, onBadge, GRADES, PRACTICE_REWARD } from '../learn/tutor.js';
import { placementQuiz } from '../learn/quiz.js';

const P = () => G.s.name, R = () => G.s.rival;
const who = { oak: ['오박사', 'oak'], rival: [null, 'rival'], mom: ['엄마', 'mom'], nurse: ['간호순', 'nurse'], clerk: ['점원', 'clerk'], brock: ['웅', 'brock'] };
const sayAs = (k, lines) => say(lines, { who: k === 'rival' ? R() : who[k][0], face: who[k][1] });

/* ── 지도별 음악 ── */
export function mapMusic(map) {
  const id = map.id;
  if (id === 'OaksLab') return 'lab';
  if (/Pokecenter|Mart/.test(id)) return 'center';
  if (/Gym$/.test(id)) return 'gym';
  if (id === 'ViridianForest' || /^MtMoon[1B]/.test(id)) return 'forest';
  if (/Route/.test(id)) return 'route';
  return 'town';
}
export const announceIndoor = (id) => /Pokecenter|Mart|Gym|OaksLab|SchoolHouse|MtMoon/.test(id);
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
  if (map === 'MtMoonPokecenter' && idx === 4) return false;
  if (map === 'CeruleanCity' && (idx === 0 || idx === 1 || idx === 7)) return false;
  if (map === 'MtMoonB2F' && (idx === 5 || idx === 6)) return !flag('fossil');
  if (map === 'BillsHouse') return idx === 0 ? !flag('billSaved') : idx === 1 ? flag('billSaved') : false;
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
  if (map === 'CeruleanGym' && idx === 0) return 'misty';
  if (map === 'VermilionGym' && idx === 0) return 'surge';
  if (map === 'BillsHouse' && idx === 0) return 'mon:35';
  if (map === 'VermilionCity' && idx === 4) return 'mon:66';
  if (map === 'BillsHouse' && idx === 1) return 'nerd';
  if (n.spriteName === 'Sailor') return 'sailor';
  if (n.trainerClass === 'Hiker') return 'hiker';
  if (n.spriteName === 'Fossil') return 'item';
  if (n.trainerClass === 'BugCatcher') return 'bugcatcher';
  if (n.trainerClass === 'Lass' || n.trainerClass === 'JrTrainerF') return 'coolf';
  return K[n.spriteName] || null;
}
export function extraBlock(map, x, y) { return false; }
export const trainerBeaten = (map, o) => flag(`tr:${map}:${o.idx}`);

/* ── 막힌 문 ── */
export async function lockedDoor(dest) {
  if (/Gym/.test(dest || '')) return say(['체육관 문이 잠겨 있다…', '관장이 자리를 비운 것 같아.']);
  if (/Museum/.test(dest || '')) return say(['회색시티 박물관', '“화석과 우주 전시는 다음 모험에서 열려요!”']);
  if (/CeruleanCave/.test(dest || '')) return say(['아주 강한 포켓몬이 산다는 동굴이다…', '지금은 들어갈 수 없어.']);
  if (/Cave/.test(dest || '')) return say(['어두운 동굴이다… 지금은 들어가지 않는 게 좋겠어.']);
  if (/BikeShop/.test(dest || '')) return say(['자전거 가게다. 자전거 한 대에 100만 원!', '…지금은 너무 비싸다.']);
  if (/Route[56]Gate/.test(dest || '')) return say(['“목이 말라서 아무도 못 지나가게 할 거야!”', '(노랑시티로 가는 길은 다음 모험에서 열린다.)']);
  if (/VermilionDock/.test(dest || '')) return say(['상트앙느호는 이미 먼 바다로 떠났다…']);
  if (/Daycare/.test(dest || '')) return say(['포켓몬 키우미집: “지금은 문을 닫았어요.”']);
  if (/FanClub/.test(dest || '')) return say(['포켓몬 팬클럽: “회원 모집은 다음 모험에서!”']);
  if (/Trashed/.test(dest || '')) return say(['“로켓단이 이 집에 도둑질을 했어요! 지금은 경찰이 조사 중이에요.”']);
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
  if (map === 'CeruleanCity' && flag('badge1') && !flag('rival2') && x <= 12) { await rivalCerulean(); return true; }
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
    await say(['이 길은 다음 모험에서 열려!', '💡 화면 위 “다음 목표”를 눌러 보면 어디로 갈지 알려 줘.']);
    W.busy = false;
  }
}
export async function enterMap(id) {
  if (id === 'CeruleanCity' && flag('badge1') && !flag('rival2')) { await rivalCerulean(); return; }
  if (id === 'VermilionGym' && !flag('gym3Intro')) {
    setFlag('gym3Intro'); W.busy = true;
    await say(['갈색시티 체육관에 들어왔다! 찌릿찌릿 전기 냄새가 난다.']);
    if (!flag('diglettGift')) await LINES['VermilionGym:4']();
    W.busy = false;
  }
  if (id === 'CeruleanGym' && !flag('gym2Intro')) {
    setFlag('gym2Intro'); W.busy = true;
    await say(['블루시티 체육관에 들어왔다! 가운데에 커다란 수영장이 있다.', '관장 이슬은 물 포켓몬을 쓴다. 피카츄의 전기 기술이 효과가 굉장할 거야!']);
    W.busy = false;
  }
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
    const iid = ITEMS[o.n.itemId] ? o.n.itemId : 20;
    const it = ITEMS[iid];
    addItem(iid, 1); setFlag(`item:${map}:${i}`); W.scene.removeNpc(o); sfx('item');
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
    const y = await ask(`연습 문제를 3개 풀어 볼래? 한 문제 맞힐 때마다 ${PRACTICE_REWARD}원을 줄게!`, { who: '선생님', face: 'coolf' });
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
  'PewterCity:4': () => say(flag('badge1') ? ['회색배지를 땄구나! 대단해!', '이 길로 쭉 가면 3번도로, 그 너머가 달맞이산이야!'] : ['웅을 이기기 전엔 이 길로 못 가!']),
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
  if (/Pokecenter$/.test(map) && s.textId === 1) return W.openBox?.();
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
function objectiveBase() {
  const f = flag, map = G.s.map;
  const go = (target, text, detail) => ({ text, detail, dir: map === target ? '' : DIR[ROUTE_TO[target]?.[map]] || '' });
  if (!f('oakEscort')) return { text: '집을 나가 마을 북쪽 풀숲 쪽으로 가 보자', detail: ['계단(오른쪽 위)으로 1층에 내려가서, 아래쪽 문으로 나가자.', '마을 위쪽 풀숲으로 가면 오박사님을 만날 수 있어!'], dir: map === 'PalletTown' ? DIR.north : '' };
  if (!f('placement') || !f('gotStarter')) return { text: '연구소에서 오박사님께 말을 걸자', detail: ['오박사님 앞에서 A(스페이스) 버튼을 누르면 돼.'], dir: '' };
  if (!f('rivalBattled')) return { text: '연구소 출구 쪽으로 걸어가 보자 (라이벌이 기다려!)', detail: ['아래쪽 출구로 걸어가면 라이벌이 승부를 걸어 와.'], dir: '↓' };
  if (!f('pokedex')) return go('ViridianCity', '상록시티 파란 지붕 가게에서 도감 받기', ['태초마을 북쪽 → 1번도로 → 상록시티.', '파란 지붕 “프렌들리숍”에 들어가 점원에게 말을 걸자!']);
  if (!f('badge1')) {
    if (/^Pewter/.test(map)) return { text: '회색시티 체육관(보라 지붕)에서 관장 웅을 이기자', detail: ['체육관 가이드에게 먼저 말을 걸면 선물을 줘!', '포켓몬이 지치면 포켓몬센터(빨간 지붕)에서 쉬자.'], dir: '', targets: map === 'PewterGym' ? [[4, 2, '웅 앞']] : map === 'PewterCity' ? [[16, 18, '체육관 문']] : null };
    return go('PewterCity', '상록숲을 지나 회색시티로!', ['상록시티 북쪽 → 2번도로 → 건물(숲 입구)로 들어가 상록숲을 통과하자.', '숲에서는 표지판을 읽으며 북쪽 출구를 찾자!']);
  }
  if (!f('badge2')) {
    if (map === 'PewterCity' || map === 'PewterPokecenter' || map === 'PewterMart' || map === 'PewterGym') return { text: '회색시티 동쪽 3번도로로 가자', detail: ['회색시티 오른쪽(동쪽) 길로 나가면 3번도로야.'], dir: '→ 동쪽' };
    if (map === 'Route3') return { text: '3번도로 끝에서 위로 올라가 달맞이산으로', detail: ['트레이너들을 이기며 동쪽 끝까지 가서 위(북쪽)로!', '달맞이산 앞 포켓몬센터에서 꼭 회복하자.'], dir: '→ 동쪽 끝에서 ↑' };
    if (map === 'MtMoonPokecenter') return { text: '달맞이산 동굴 입구로 들어가자', detail: ['센터를 나와 오른쪽 바위산의 동굴 입구로!', '(잉어킹 파는 아저씨도 있어!)'], dir: '' };
    if (/^MtMoon[1B]/.test(map)) return mtMoonGoal(map);
    if (map === 'Route4') return !f('fossil') && G.s.x < 22 ? { text: '달맞이산 동굴 입구로 들어가자', detail: ['바위산의 검은 입구로 들어가자.'], dir: '' } : { text: '동쪽으로 가면 블루시티!', detail: ['턱을 뛰어내리며 오른쪽으로 쭉!'], dir: '→ 동쪽' };
    if (map === 'CeruleanGym') return { text: '체육관 맨 위의 관장 이슬에게 말을 걸자', detail: ['수영장 사이 길을 따라 위로!', '물 포켓몬에게는 피카츄의 전기 기술이 효과 굉장!'], dir: '', targets: [[4, 3, '이슬 앞']] };
    if (/^Cerulean/.test(map)) return { text: '블루시티 체육관에서 관장 이슬을 이기자', detail: map === 'CeruleanCity' ? ['체육관은 오른쪽 가운데쯤, 보라 지붕 건물이야.', '물 포켓몬에게는 피카츄의 전기 기술이 효과 굉장!'] : ['밖으로 나가 보라 지붕 체육관으로 가자.'], dir: '', targets: map === 'CeruleanCity' ? [[30, 20, '체육관 문']] : null };
    return { text: '회색시티를 지나 동쪽 3번도로로!', detail: ['회색시티 오른쪽 길 → 3번도로 → 달맞이산 → 블루시티.'], dir: '' };
  }
  if (!f('billSaved')) {
    if (map === 'CeruleanCity' || /^Cerulean/.test(map)) return { text: '블루시티 북쪽 너겟 브릿지를 건너자', detail: ['블루시티 위쪽(북쪽) 다리로!', '다리 위 트레이너 5명을 이기면 선물이 있대.'], dir: map === 'CeruleanCity' ? '↑ 북쪽' : '' };
    // 목표는 8~9번째 줄 동쪽 끝: 그 위(4~6줄)는 '<' 턱 너머라 다리 쪽에서 올라갈 수 없다(안내가 길을 못 찾던 원인)
    if (map === 'Route24') return { text: '다리를 건너 동쪽 25번도로로', detail: ['다리 끝까지 간 뒤 오른쪽(동쪽)으로!'], dir: '↑ 그다음 →', targets: [[19, 8, '25번도로 쪽'], [19, 9, '']] };
    if (map === 'Route25') return { text: '길 끝의 이수재 박사님 집으로!', detail: ['동쪽 끝 오두막이 이수재 박사님 집이야.'], dir: '→ 동쪽', targets: [[45, 4, '오두막 문 앞']] };
    if (map === 'BillsHouse') return f('billAsk') ? { text: '왼쪽 PC에서 “분리”를 실행하자', detail: ['방 왼쪽 컴퓨터 앞에서 A 버튼!'], dir: '', targets: [[1, 5, 'PC 앞']] } : { text: '삐삐에게 말을 걸어 보자', detail: ['방 안의 삐삐… 뭔가 이상한데?'], dir: '', targets: [[6, 6, '삐삐 앞']] };
    return { text: '블루시티 북쪽으로 가서 이수재 박사님을 만나자', detail: ['블루시티 → 북쪽 다리(24번도로) → 25번도로 끝 오두막.'], dir: '' };
  }
  if (!f('badge3')) {
    if (/^Vermilion/.test(map)) return { text: '갈색시티 체육관에서 관장 마티스를 이기자', detail: ['체육관에 들어가면 가이드가 디그다를 빌려줘!', '땅 타입에는 전기 기술이 안 통해.'], dir: '', targets: map === 'VermilionGym' ? [[5, 2, '마티스 앞']] : map === 'VermilionCity' ? [[12, 20, '체육관 문']] : null };
    if (map === 'BillsHouse' && !f('billGift')) return { text: '사람으로 돌아온 이수재 박사님께 말을 걸자', detail: ['방 가운데의 이수재 박사님 앞에서 A 버튼!'], dir: '', targets: [[4, 5, '이수재 앞']] };
    if (map === 'BillsHouse' || map === 'Route25' || map === 'Route24') return { text: '블루시티로 돌아가서 남쪽 5번도로로', detail: ['왔던 길로 블루시티에 간 뒤, 아래쪽(남쪽) 출구로!'], dir: map === 'Route24' ? '↓ 남쪽' : '← 서쪽' };
    if (/^Cerulean/.test(map)) return { text: '블루시티 남쪽 5번도로로 가자', detail: ['블루시티 아래쪽(남쪽) 길로 나가면 5번도로야.'], dir: map === 'CeruleanCity' ? '↓ 남쪽' : '' };
    if (map === 'Route5') return { text: '오른쪽 작은 건물(지하통로 입구)로 들어가자', detail: ['5번도로 아래쪽 오른편의 건물이 지하통로 입구야.', '(가운데 큰 건물은 지금은 못 지나가.)'], dir: '↓' };
    if (/^UndergroundPath/.test(map)) return { text: '지하통로를 따라 남쪽으로!', detail: ['계단을 내려가 긴 통로를 쭉 따라가면 6번도로야.'], dir: '↓ 남쪽' };
    if (map === 'Route6') return { text: '남쪽으로 가면 갈색시티!', detail: ['트레이너들을 이기며 아래쪽으로 쭉!'], dir: '↓ 남쪽' };
    return { text: '갈색시티를 향해!', detail: ['블루시티 남쪽 → 5번도로 → 지하통로 → 6번도로 → 갈색시티.'], dir: '' };
  }
  return { text: '3판 완료! 도감을 채우며 다음 판을 기다리자', detail: ['여러 곳의 풀숲에서 새로운 포켓몬을 찾아보자!'], dir: '' };
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


/* ════════════════ 2판: 3번도로 · 달맞이산 · 4번도로 · 블루시티 ════════════════ */
async function rivalCerulean() {
  const S = W.scene;
  W.busy = true;
  try {
    const sp2 = S.add.sprite(0, 0, 'ch_rival', 9).setOrigin(0.5, 1);
    const o = { n: { spriteName: 'Blue' }, idx: 99, sp: sp2, x: G.s.x + 3, y: G.s.y, kind: 'rival', facing: 'left' };
    S.placeSprite(sp2, o.x, o.y); S.npcs.push(o); S.mapObjs.push(sp2);
    S.facePlayer('right');
    await S.walkNpc(o, 'left', 1, 180);
    await sayAs('rival', [`어이, ${P()}! 달맞이산을 벌써 지나왔어?`, '실력이 얼마나 늘었는지 보자!']);
    const res = await W.trainerBattle({ party: [[17, 15], [133, 16]], name: R(), face: 'rival', intro: `라이벌 ${josa(R(), '이/가')} 승부를 걸어 왔다!`, lose: '쳇… 제법인데?', win: '헤헤, 아직 멀었어!', money: 600 });
    setFlag('rival2');
    if (res !== 'win') return; // 전멸했으면 이미 포켓몬센터로 돌아감
    await sayAs('rival', res === 'win' ? ['흥, 이번엔 봐준 거야!', '블루시티 체육관 관장 이슬은 물 포켓몬을 써. 피카츄라면 해볼 만하겠지. 그럼 난 간다!'] : ['내가 더 강하지롱! 이슬 관장한테도 이길 수 있겠어?']);
    for (let i = 0; i < 4; i++) await S.walkNpc(o, 'right', 1, 150);
    S.removeNpc(o); save();
  } finally { W.busy = false; }
}

async function magikarpSale() {
  await say(['이봐 꼬마! 아주 특별한 포켓몬이 있는데 말이야…', '이 잉어킹을 단돈 500원에 줄게! 나중에 엄청나게 강해진다고!'], { who: '아저씨', face: 'gambler' });
  if (flag('magikarp')) return say(['환불은 안 돼! 허허.'], { who: '아저씨', face: 'gambler' });
  const yes = await ask('잉어킹을 500원에 살까?');
  if (!yes) return say(['아쉽구먼. 후회할 텐데~'], { who: '아저씨', face: 'gambler' });
  if (G.s.money < 500) return say(['돈이 모자라잖아!'], { who: '아저씨', face: 'gambler' });
  G.s.money -= 500; setFlag('magikarp'); sfx('item');
  const where = receive(makeMon(129, 5));
  return say([`${josa(P(), '은/는')} 잉어킹을 받았다!${where === 'box' ? ' (보관함으로)' : ''}`, '(잉어킹은 레벨 20이 되면 갸라도스로 진화한다는 소문이…)']);
}

async function fossilNerd() {
  if (flag('fossil')) return say(['화석은 아주 오래전 생물이 흙에 묻혀 돌처럼 굳은 거야.', '지층이 쌓인 순서를 보면 어느 것이 더 오래됐는지도 알 수 있지!'], { who: '과학자', face: 'nerd' });
  if (!flag('nerdBeaten')) {
    await say(['이 화석은 내가 먼저 찾았어! 가져가려면 나를 이겨야 해!'], { who: '과학자', face: 'nerd' });
    const res = await W.trainerBattle({ cls: 'SuperNerd', set: 1, name: '과학자', face: 'nerd', intro: '과학자가 승부를 걸어 왔다!', lose: '알았어, 하나만 가져가!', money: 400 });
    if (res !== 'win') return;
    setFlag('nerdBeaten');
  }
  await say(['좋아, 화석 하나는 네 거야. 어느 걸 고를래?'], { who: '과학자', face: 'nerd' });
  const pick2 = await choose([{ label: '돔 화석 (투구)', value: 140 }, { label: '조개 화석 (암나이트)', value: 138 }], { cancel: false });
  setFlag('fossil', pick2); sfx('item');
  for (const f of W.scene.npcs.filter((x) => x.n.spriteName === 'Fossil')) W.scene.removeNpc(f);
  await say([`${josa(P(), '은/는')} ${pick2 === 140 ? '돔 화석' : '조개 화석'}을 받았다!`]);
  await say(['그때 지나가던 박사님이 휴대용 기계를 꺼냈다!', '“화석 속에 남은 정보로 포켓몬을 되살릴 수 있단다. 잠깐만!”', '위이이잉… 번쩍!'], { who: '박사님', face: 'scientist' });
  PORTRAIT['mon'] = monArt(pick2);
  const where = receive(makeMon(pick2, 12));
  sfx('caught');
  await say([`${sp(pick2).name}이(가) 되살아났다!${where === 'box' ? ' (보관함으로)' : ''}`, '💡 과학 이야기: 화석은 흙·모래가 쌓인 퇴적층에서 발견돼. 아래층일수록 더 오래된 거야!'], { who: sp(pick2).name, face: 'mon' });
  save();
}

async function mistyBattle() {
  if (flag('badge2')) return say(['블루배지는 물처럼 유연하게 생각한 증거야!', '다음 체육관도 힘내!'], { who: '이슬', face: 'misty' });
  await say(['안녕! 나는 블루시티 체육관 관장 이슬이야.', '내 물 포켓몬은 흐르는 물처럼 자유롭지!', '물의 흐름을 이해하는 트레이너만 나를 이길 수 있어. 문제를 잘 읽어 봐!'], { who: '이슬', face: 'misty' });
  const res = await W.trainerBattle({ cls: 'Misty', set: 0, name: '이슬', face: 'misty', intro: '관장 이슬이 승부를 걸어 왔다!', story: true, gym: true, lose: '와… 네가 이겼어! 인정할게!', money: 2079, music: 'gym' });
  if (res !== 'win') return;
  await say(['이 블루배지를 받아!'], { who: '이슬', face: 'misty' });
  setFlag('badge2'); G.s.badges.push('cascade'); onBadge(); sfx('badge');
  await say([`${josa(P(), '은/는')} 블루배지를 받았다!`, '(문제가 한 단계 더 어려워진다! 멋진 트레이너가 되어 가고 있어.)']);
  save();
  await W.chapterEnd?.(2);
}

Object.assign(LINES, {
  'Route3:0': () => say(['이 앞은 달맞이산이야.', '동굴 속은 어둡고 길이 복잡하니까 포켓몬센터에서 꼭 회복하고 가!']),
  'MtMoonPokecenter:0': nurse,
  'MtMoonPokecenter:1': () => say(['달맞이산에는 삐삐가 산대!', '밤이 되면 달을 향해 춤을 춘다나?']),
  'MtMoonPokecenter:2': () => say(['동굴에서는 풀숲이 없어도 어디서든 야생 포켓몬이 나와. 조심하렴!']),
  'MtMoonPokecenter:3': magikarpSale,
  'MtMoonPokecenter:5': () => say(['통신 교환 서비스는 지금 준비 중이에요.'], { who: '안내원', face: 'nurse' }),
  'Route4:0': () => say(['달맞이산에서 로켓단을 봤어! 화석을 노린대.', '나쁜 사람들이니까 조심해!']),
  'MtMoonB2F:0': () => fossilNerd(),
  'MtMoonB2F:5': () => say(['돔처럼 둥근 화석이다.', '💡 옆에 있는 과학자에게 말을 걸어 보자!']),
  'MtMoonB2F:6': () => say(['소용돌이 모양의 조개 화석이다.', '💡 옆에 있는 과학자에게 말을 걸어 보자!']),
  'CeruleanCity:2': () => say(['자전거가 있으면 엄청 빨리 달릴 수 있대.', '하지만 가게 자전거는 너무 비싸…']),
  'CeruleanCity:3': () => say(['블루시티는 물이 맑기로 유명해.', '물은 햇볕에 데워지면 수증기가 되어 하늘로 올라가 구름이 된단다.']),
  'CeruleanCity:4': () => say(['체육관 관장 이슬은 수영도 엄청 잘해!']),
  'CeruleanCity:5': () => say(['로켓단이 이 집에 도둑질을 했대요! 경찰이 지키고 있어요.'], { who: '경찰', face: 'clerk' }),
  'CeruleanCity:10': () => say(['출입 금지! 사건 조사 중입니다.'], { who: '경찰', face: 'clerk' }),
  'CeruleanCity:6': () => say(['물 포켓몬에게는 전기와 풀 기술이 잘 들어!']),
  'CeruleanCity:8': () => say(['블루시티 북쪽 다리는 “너겟 브릿지”야. 다음 모험에서 가 볼 수 있을 거야!']),
  'CeruleanCity:9': () => say(['이 동굴 안에는 아주 강한 포켓몬이 산대…']),
  'CeruleanPokecenter:0': nurse,
  'CeruleanPokecenter:1': () => say(['포켓몬이 쓰러지기 전에 가방의 상처약을 쓰는 게 좋아!']),
  'CeruleanPokecenter:2': () => say(['물 포켓몬 체육관이라… 전기 포켓몬이 있으면 든든하지!']),
  'CeruleanPokecenter:3': () => say(['통신 교환 서비스는 지금 준비 중이에요.'], { who: '안내원', face: 'nurse' }),
  'CeruleanMart:0': clerk,
  'CeruleanMart:1': () => say(['해독제·마비치료제도 몇 개 챙겨 둬!']),
  'CeruleanMart:2': () => say(['몬스터볼은 여러 개 사 두면 좋아. 새로운 포켓몬이 많거든!']),
  'CeruleanGym:0': () => mistyBattle(),
  'CeruleanGym:3': () => say(['어이, 챔피언 지망생!', '이슬 관장은 물 포켓몬 별가사리·아쿠스타를 써.', '전기·풀 기술이 효과가 굉장하지! 그리고 관장은 상황 문제를 내니 끝까지 읽어!'], { who: '가이드', face: 'guide' }),
});
Object.assign(SIGNS, {
  'Route3:1': ['3번도로', '← 회색시티 · 달맞이산 →'],
  'Route4:1': ['포켓몬센터'], 'Route4:2': ['달맞이산', '동굴 입구 — 로켓단 주의!'], 'Route4:3': ['4번도로', '← 달맞이산 · 블루시티 →'],
  'MtMoon1F:1': ['주의! 달맞이산에서 화석을 훔치는 로켓단이 목격됨.', '— 블루시티 경찰서'],
  'CeruleanCity:1': ['프렌들리숍'], 'CeruleanCity:2': ['블루시티', '물빛이 아름다운 도시'], 'CeruleanCity:3': ['트레이너 팁', '물 포켓몬에게는 전기·풀 기술이 효과 굉장!'],
  'CeruleanCity:4': ['포켓몬센터'], 'CeruleanCity:5': ['자전거 가게'], 'CeruleanCity:6': ['블루시티 체육관', '관장: 이슬 — 말괄량이 인어공주!'],
  'MtMoonPokecenter:2': ['포켓몬센터', '포켓몬의 건강을 책임집니다!'], 'CeruleanPokecenter:2': ['포켓몬센터', '포켓몬의 건강을 책임집니다!'],
  'CeruleanGym:1': () => [flag('badge2') ? `블루시티 체육관 — 우승 트레이너: ${P()}` : '블루시티 체육관 — 우승 트레이너: …'],
  'CeruleanGym:2': () => [flag('badge2') ? `블루시티 체육관 — 우승 트레이너: ${P()}` : '블루시티 체육관 — 우승 트레이너: …'],
});
const T2 = (name, pre, post, money) => ({ name, pre: [pre], post, money });
Object.assign(TRAINER, {
  'Route3:1': T2('곤충채집소년', '내 벌레 포켓몬 실력을 보여 줄게!', ['졌다!', '나비 날개의 색은 아주 작은 비늘가루 때문이래!'], 100),
  'Route3:2': T2('반바지꼬마', '눈 마주쳤지? 승부다!', ['으악, 졌다!', '반바지가 편하고 좋아!'], 150),
  'Route3:3': T2('미니스커트', '내 포켓몬 귀엽지? 그래도 강하다!', ['힝… 졌어.', '포켓몬도 칭찬해 주면 더 힘을 낸대!'], 200),
  'Route3:4': T2('곤충채집소년', '벌레 포켓몬의 한살이를 아니?', ['졌다!', '알→애벌레→번데기→어른벌레! 이게 완전 탈바꿈이야.'], 100),
  'Route3:5': T2('미니스커트', '나랑 한판 붙자!', ['졌다… 넌 강하구나!'], 200),
  'Route3:6': T2('반바지꼬마', '내 꼬렛은 앞니가 최고야!', ['졌다!', '꼬렛 앞니는 계속 자라서 딱딱한 걸 갉아야 한대.'], 150),
  'Route3:7': T2('곤충채집소년', '숲에서 잡은 친구들이야!', ['으으, 졌다!'], 120),
  'Route3:8': T2('미니스커트', '달맞이산 가기 전에 나부터 이겨 봐!', ['대단한걸! 동굴에서도 힘내!'], 240),
  'Route4:1': T2('미니스커트', '블루시티 가기 전에 승부야!', ['졌다! 블루시티는 바로 저 앞이야.'], 300),
  'MtMoon1F:0': T2('등산가', '산은 내 집이나 다름없지! 승부다!', ['허허, 졌구먼!', '동굴은 오랜 시간 물이 바위를 녹이고 깎아서 생긴 거란다.'], 300),
  'MtMoon1F:1': T2('반바지꼬마', '동굴에서 길 잃었는데… 승부나 하자!', ['졌다… 출구는 어디지?'], 150),
  'MtMoon1F:2': T2('미니스커트', '어두운 데서 만나서 깜짝 놀랐잖아!', ['졌어! 삐삐 봤니? 너무 귀여워!'], 250),
  'MtMoon1F:3': T2('과학자', '달맞이산의 돌을 연구하는 중이야!', ['졌다!', '하늘에서 떨어진 돌을 “운석”이라고 해.'], 350),
  'MtMoon1F:4': T2('미니스커트', '승부! 봐주지 않을 거야!', ['졌다… 다음엔 이길 거야!'], 250),
  'MtMoon1F:5': T2('곤충채집소년', '파라스를 잡으러 왔어! 너부터 이긴다!', ['졌다!', '파라스 등에는 버섯이 자란대!'], 140),
  'MtMoon1F:6': T2('곤충채집소년', '동굴에도 벌레 포켓몬이 산다고!', ['졌다!'], 140),
  'MtMoonB2F:1': T2('로켓단 조무래기', '우리는 로켓단! 화석은 우리가 가져간다!', ['으악! 꼬마한테 지다니!'], 450),
  'MtMoonB2F:2': T2('로켓단 조무래기', '로켓단을 방해하면 혼난다!', ['크윽… 보스한테 혼나겠네.'], 450),
  'MtMoonB2F:3': T2('로켓단 조무래기', '화석은 비싸게 팔린다고! 비켜!', ['졌다! 철수다!'], 450),
  'MtMoonB2F:4': T2('로켓단 조무래기', '여기까지 오다니 제법인데?', ['이, 이럴 수가!', '로켓단은 다시 돌아온다!'], 500),
  'CeruleanGym:1': T2('주니어트레이너', '이슬 언니한테 가려면 나부터!', ['졌다!', '물은 0도에서 얼고 100도에서 끓어!'], 350),
  'CeruleanGym:2': T2('수영선수', '물속에서는 내가 최고야!', ['첨벙! 졌다!', '물에 뜨는 건 부력 덕분이야. 물이 위로 밀어 올려 주는 힘!'], 300),
});
Object.assign(EXTRA_WILD, {
  Route3: [['Mankey', 7], ['NidoranM', 7], ['NidoranF', 7], ['Sandshrew', 7], ['Ekans', 7], ['Rattata', 7]],
  MtMoon1F: [['Onix', 9], ['Sandshrew', 9], ['Clefairy', 9]],
  MtMoonB1F: [['Onix', 10], ['Sandshrew', 10], ['Clefairy', 10]],
  MtMoonB2F: [['Onix', 11], ['Clefairy', 11], ['Sandshrew', 11]],
  Route4: [['Mankey', 10], ['Sandshrew', 10], ['Meowth', 10], ['Psyduck', 10], ['Poliwag', 10]],
});


/* ════════════════ 3판: 너겟 브릿지 · 이수재 · 지하통로 · 갈색시티 ════════════════ */
async function nuggetRocket() {
  if (flag('nuggetRocket')) return say(['크윽… 로켓단의 비밀이 들통나다니!'], { who: '로켓단', face: 'rocket' });
  await say(['축하해! 너겟 브릿지 5연승을 해냈구나!', '상으로 이 금덩이를 주지. (팔면 5000원!)'], { who: '아저씨', face: 'camper' });
  G.s.money += 5000; sfx('item');
  await say([`${josa(P(), '은/는')} 금덩이를 받아서 5000원이 되었다!`]);
  await say(['…그런데 말이야. 너처럼 강한 아이라면 우리 “로켓단”에 들어오지 않을래?', '싫다고? 그럼 힘으로 데려가 주마!'], { who: '로켓단', face: 'rocket' });
  const res = await W.trainerBattle({ cls: 'Rocket', set: 5, name: '로켓단 조무래기', face: 'rocket', intro: '로켓단 조무래기가 승부를 걸어 왔다!', lose: '으윽… 이 꼬마 뭐야!', money: 500 });
  if (res === 'win') { setFlag('nuggetRocket'); save(); await say(['로켓단은 포기하지 않는다! 두고 보자!'], { who: '로켓단', face: 'rocket' }); }
}

async function billPokemon() {
  if (flag('billSaved')) return;
  await say(['어이! 거기 너! 나 좀 도와줘!', '나는 포켓몬 박사 이수재야. 포켓몬을 전송하는 실험을 하다가…', '실수로 포켓몬이랑 합쳐져 버렸어! 😱', '저쪽 PC(전송 기계 옆 컴퓨터)에서 “분리” 버튼을 눌러 줘! 그동안 나는 기계에 들어가 있을게!'], { who: '삐삐(이수재)', face: 'mon' });
  setFlag('billAsk'); save();
}
async function billPC() {
  if (flag('billSaved')) return say(['포켓몬 전송 기계의 PC다. 보관함 정리가 잘 되어 있다.']);
  if (!flag('billAsk')) return say(['복잡한 프로그램이 켜져 있다… 함부로 만지면 안 될 것 같다.']);
  const yes = await ask('“분리 프로그램”을 실행할까?');
  if (!yes) return;
  sfx('evolve');
  await fade(true, 250); await fade(false, 120); await fade(true, 120); await fade(false, 250);
  setFlag('billSaved'); save();
  await W.scene.loadMap('BillsHouse', G.s.x, G.s.y, G.s.facing, { quiet: true });
  await say(['위이이잉… 번쩍!', '기계 속에서 사람이 걸어 나왔다!']);
}
async function billThanks() {
  if (flag('billGift')) return say(['포켓몬 전송은 포켓몬을 “정보”로 바꿔 전기 신호로 보내는 거야.', '그래서 PC에서 PC로 옮길 수 있지! 과학 멋지지?'], { who: '이수재', face: 'bill' });
  await say(['휴, 살았다! 고마워, 정말 고마워!', '나는 포켓몬 박사 이수재. 네 덕분에 원래대로 돌아왔어.', '고마움의 표시로 이걸 줄게!'], { who: '이수재', face: 'bill' });
  addItem(40, 3); setFlag('billGift'); sfx('item');
  await say([`${josa(P(), '은/는')} 이상한사탕을 3개 받았다!`, '(가방에서 포켓몬에게 먹이면 레벨이 1 오른다!)']);
  await say(['다음 모험은 블루시티 남쪽이야. 5번도로에서 지하통로를 지나면 항구 도시 갈색시티가 나와!', '갈색시티 체육관 관장 마티스는 전기 포켓몬의 달인이란다.'], { who: '이수재', face: 'bill' });
  W.updateGoal?.(); save();
}

async function surgeBattle() {
  if (flag('badge3')) return say(['헤이! 오렌지배지는 네가 번개처럼 똑똑하다는 증거야!'], { who: '마티스', face: 'surge' });
  await say(['헤이, 꼬마 트레이너! 나는 갈색시티 체육관 관장 마티스!', '전쟁터에서 내 목숨을 구해 준 건 전기 포켓몬이었지!', '전기의 힘을 제대로 이해한 트레이너만 나를 이길 수 있다! 문제를 잘 읽어!'], { who: '마티스', face: 'surge' });
  const res = await W.trainerBattle({ cls: 'LtSurge', set: 0, name: '마티스', face: 'surge', intro: '관장 마티스가 승부를 걸어 왔다!', story: true, gym: true, lose: '와우! 너 정말 대단하구나!', money: 2376, music: 'gym' });
  if (res !== 'win') return;
  await say(['이 오렌지배지를 받아라!'], { who: '마티스', face: 'surge' });
  setFlag('badge3'); G.s.badges.push('thunder'); onBadge(); sfx('badge');
  await say([`${josa(P(), '은/는')} 오렌지배지를 받았다!`, '(문제가 한 단계 더 어려워진다! 이제 진짜 실력파 트레이너야.)']);
  save();
  await W.chapterEnd?.(3);
}

Object.assign(LINES, {
  'Route24:0': () => nuggetRocket(),
  'BillsHouse:0': () => billPokemon(),
  'BillsHouse:1': () => billThanks(),
  'BillsHouse:2': () => billThanks(),
  'UndergroundPathRoute5:0': () => say(['이 지하통로는 5번도로와 6번도로를 이어 줘.', '땅 밑으로 곧장 가면 금방이야!']),
  'UndergroundPathRoute6:0': () => say(['지하통로를 지나왔구나! 남쪽으로 조금만 가면 갈색시티야.']),
  'VermilionCity:0': () => say(['갈색시티는 바다를 끼고 있는 항구 도시야!', '밀물과 썰물은 달이 바닷물을 끌어당겨서 생긴대.']),
  'VermilionCity:1': () => say(['체육관 관장 마티스는 번개 같은 사나이지!']),
  'VermilionCity:2': () => say(['상트앙느호는 벌써 출항했어.', '큰 배가 무거운데도 물에 뜨는 건 배가 밀어낸 물의 무게만큼 물이 위로 밀어 주기 때문이야!'], { who: '선원', face: 'sailor' }),
  'VermilionCity:3': () => say(['땅 타입 포켓몬에게는 전기 기술이 전혀 안 통해.', '전기가 땅속으로 흘러가 버리거든!']),
  'VermilionCity:4': () => say(['알통몬이 땅을 쿵쿵 다지고 있다!', '“이렇게 땅을 다져 놓아야 건물을 지을 수 있대!”']),
  'VermilionCity:5': () => say(['바닷물은 짜서 그냥 마시면 안 돼!'], { who: '선원', face: 'sailor' }),
  'VermilionPokecenter:0': nurse,
  'VermilionPokecenter:1': () => say(['낚시는 참을성이 필요하지. 공부도 그렇단다, 허허.']),
  'VermilionPokecenter:2': () => say(['마티스 관장의 라이츄는 엄청 빨라!'], { who: '선원', face: 'sailor' }),
  'VermilionPokecenter:3': () => say(['통신 교환 서비스는 지금 준비 중이에요.'], { who: '안내원', face: 'nurse' }),
  'VermilionMart:0': clerk,
  'VermilionMart:1': () => say(['마비치료제를 챙겨 가! 전기 기술에 맞으면 몸이 저리거든.']),
  'VermilionMart:2': () => say(['갈색시티 항구에는 먼 나라 물건도 많이 들어와!']),
  'VermilionGym:0': () => surgeBattle(),
  'VermilionGym:4': async () => {
    if (!flag('diglettGift')) {
      await say(['어이, 챔피언 지망생! 마티스 관장은 전기 포켓몬을 써.', '피카츄의 전기 기술은 전기 포켓몬에게 잘 안 통해…', '그래서 도전자에게 빌려주는 친구가 있지. 땅 속을 다니는 디그다야!'], { who: '가이드', face: 'guide' });
      const where = receive(makeMon(50, 22)); setFlag('diglettGift'); sfx('item');
      await say([`${josa(P(), '은/는')} 디그다를 받았다!${where === 'box' ? ' (보관함으로 보냈다)' : ''}`, '💡 땅 타입은 전기 기술을 전혀 안 받아! 배틀 중 “포켓몬”을 눌러 디그다로 바꿔 보자.']);
      save(); return;
    }
    return say(['땅 타입 포켓몬이면 전기 기술이 전혀 안 통해!', '마티스 관장은 상황 문제를 내니 끝까지 읽어!'], { who: '가이드', face: 'guide' });
  },
});
Object.assign(SIGNS, {
  'Route25:1': ['바닷가 오두막', '이수재의 집'],
  'BillsHouse:2': () => (billPC(), null),
  'Route5:1': ['지하통로 입구', '← 블루시티 · 갈색시티 →'],
  'Route6:1': ['지하통로 입구', '← 블루시티 · 갈색시티 →'],
  'VermilionCity:1': ['갈색시티', '황혼빛 항구 도시'], 'VermilionCity:2': ['트레이너 팁', '땅 타입에는 전기 기술이 통하지 않아요!'],
  'VermilionCity:3': ['프렌들리숍'], 'VermilionCity:4': ['포켓몬센터'], 'VermilionCity:5': ['포켓몬 팬클럽'],
  'VermilionCity:6': ['갈색시티 체육관', '관장: 마티스 — 번개 아메리칸!'], 'VermilionCity:7': ['갈색시티 항구', '상트앙느호 선착장'],
  'VermilionPokecenter:2': ['포켓몬센터', '포켓몬의 건강을 책임집니다!'],
  'VermilionGym:16': () => [flag('badge3') ? `갈색시티 체육관 — 우승 트레이너: ${P()}` : '갈색시티 체육관 — 우승 트레이너: …'],
  'VermilionGym:17': () => [flag('badge3') ? `갈색시티 체육관 — 우승 트레이너: ${P()}` : '갈색시티 체육관 — 우승 트레이너: …'],
  'VermilionGym:18': ['쓰레기통이다… 잘 보니 전선이 연결되어 있다.', '(원래 게임에서는 스위치 퍼즐이 있었지만, 여기선 문이 열려 있다!)'],
});
for (let i = 1; i <= 15; i++) SIGNS['VermilionGym:' + i] = ['쓰레기통이다… 아무것도 없다.', i % 5 === 0 ? '💡 전기는 전선처럼 이어진 길(회로)로만 흐른단다.' : ''].filter(Boolean);
Object.assign(TRAINER, {
  'Route24:1': T2('주니어트레이너', '너겟 브릿지 첫 번째 관문이다!', ['졌다! 다음 관문도 힘내!'], 350),
  'Route24:2': T2('주니어트레이너', '두 번째 관문! 쉽지 않을걸?', ['으악, 졌다!'], 350),
  'Route24:3': T2('미니스커트', '세 번째 관문은 나야!', ['졌어… 넌 정말 강하구나!'], 300),
  'Route24:4': T2('반바지꼬마', '네 번째 관문! 여기까지 오다니!', ['졌다! 마지막 관문만 남았어!'], 250),
  'Route24:5': T2('미니스커트', '다섯 번째, 마지막 관문이야!', ['너겟 브릿지 5연승이야! 저 끝의 아저씨에게 가 봐!'], 300),
  'Route24:6': T2('곤충채집소년', '다리 옆에서 곤충을 찾는 중이었어!', ['졌다!', '잠자리 눈은 수천 개의 작은 눈이 모인 겹눈이래!'], 200),
  'Route25:0': T2('반바지꼬마', '바닷가 길은 내 구역이야!', ['졌다!'], 250),
  'Route25:1': T2('반바지꼬마', '나랑 겨뤄 보자!', ['으으, 졌다!'], 250),
  'Route25:2': T2('주니어트레이너', '이수재 박사님 집에 가려면 나를 이겨!', ['졌다! 박사님은 조금 이상한 분이야.'], 350),
  'Route25:3': T2('미니스커트', '바다 바람이 시원하지? 승부!', ['졌어!', '바닷바람은 낮에는 바다에서 육지로 불어!'], 300),
  'Route25:4': T2('반바지꼬마', '눈 마주쳤다! 승부!', ['졌다!'], 250),
  'Route25:5': T2('미니스커트', '마지막 한 판!', ['대단해! 이수재 박사님 집은 바로 저 앞이야.'], 300),
  'Route25:6': T2('등산가', '산에서 내려온 김에 승부다!', ['허허, 졌구먼!'], 400),
  'Route25:7': T2('등산가', '내 바위 포켓몬은 단단하다고!', ['졌다!', '바위는 물·바람에 깎여 모래와 흙이 된단다.'], 400),
  'Route25:8': T2('등산가', '허허, 젊은이! 한판 붙세!', ['졌네! 대단한 청년일세.'], 400),
  'Route6:0': T2('주니어트레이너', '우리 둘은 한 팀이야!', ['졌다!'], 350),
  'Route6:1': T2('주니어트레이너', '나도 있다고!', ['졌어!'], 350),
  'Route6:2': T2('곤충채집소년', '6번도로의 벌레왕이 나야!', ['졌다!'], 200),
  'Route6:3': T2('주니어트레이너', '갈색시티 가기 전 마지막 시험!', ['졌다! 갈색시티는 바로 저기야.'], 350),
  'Route6:4': T2('주니어트레이너', '나랑도 겨뤄야지!', ['졌다…!'], 350),
  'Route6:5': T2('곤충채집소년', '곤충은 다리가 몇 개인지 알아?', ['졌다!', '정답은 6개! 머리·가슴·배로 나뉘어 있어.'], 200),
  'VermilionGym:1': T2('신사', '마티스 관장님께 가려면 나를 먼저!', ['허허, 졌네. 제법이구먼!'], 700),
  'VermilionGym:2': T2('로커', '짜릿한 전기 록을 들려주지!', ['졌다!', '번개는 구름 속 전기가 한꺼번에 흐르는 거야!'], 500),
  'VermilionGym:3': T2('선원', '바다 사나이의 힘을 보여 주마!', ['졌다! 항해하듯 앞으로 나아가라!'], 400),
});
Object.assign(EXTRA_WILD, {
  Route24: [['Bellsprout', 12], ['Venonat', 12], ['Psyduck', 12], ['Mankey', 12]],
  Route25: [['Bellsprout', 12], ['Venonat', 12], ['Psyduck', 12], ['Mankey', 12], ['Eevee', 12]],
  Route5: [['Meowth', 14], ['Jigglypuff', 14], ['Psyduck', 14], ['Bellsprout', 14], ['Growlithe', 14]],
  Route6: [['Meowth', 14], ['Psyduck', 14], ['Poliwag', 14], ['Bellsprout', 14], ['Vulpix', 14], ['Drowzee', 14]],
});


/* 달맞이산 층별 길 안내: 걸어서 닿는 첫 목표로 방향·걸음 수를 보여 준다 (navTo) */
function mtMoonGoal(map) {
  const f = flag('fossil');
  if (map === 'MtMoon1F') return f
    ? { text: '출구는 지하 1층 오른쪽 위야 — 가운데 사다리로!', detail: ['가운데 사다리 → 지하 1층 → 다시 지하 2층 왼쪽 위 사다리 → 지하 1층 출구.'], dir: '', targets: [[17, 11, '가운데 사다리']] }
    : { text: '가운데 사다리로 내려가자', detail: ['오른쪽 아래 사다리는 막다른 길이야!', '가운데 사다리 → 지하 1층 → 바로 옆 사다리 → 지하 2층.'], dir: '', targets: [[17, 11, '가운데 사다리']] };
  if (map === 'MtMoonB1F') return f
    ? { text: '출구로! (오른쪽 위 계단)', detail: ['오른쪽 위 계단으로 나가면 4번도로 동쪽이야.', '출구가 없는 곳이면 가까운 사다리로 지하 2층에 갔다가 왼쪽 위 사다리로 올라오자.'], dir: '', targets: [[27, 3, '출구'], [17, 11, '지하 2층 사다리'], [21, 17, '지하 2층 사다리']] }
    : { text: '사다리를 타고 지하 2층으로!', detail: ['지하 2층에 로켓단과 화석을 지키는 과학자가 있어.'], dir: '', targets: [[17, 11, '지하 2층 사다리'], [21, 17, '지하 2층 사다리'], [25, 15, '막다른 길 — 1층으로 돌아가자']] };
  return f
    ? { text: '왼쪽 위 사다리로 올라가면 출구야', detail: ['지하 2층 왼쪽 위 사다리 → 지하 1층 → 바로 오른쪽 계단이 출구!'], dir: '', targets: [[5, 7, '왼쪽 위 사다리'], [15, 27, '막다른 길 — 올라가자']] }
    : { text: '과학자를 찾아 화석을 받자', detail: ['로켓단을 이기며 서쪽(왼쪽)으로 빙 돌아가면 과학자가 있어.'], dir: '', targets: [[13, 8, '과학자 옆'], [15, 27, '막다른 길 — 올라가자']] };
}


/* ── 길 안내 목적지: 목표 문구에 목적지가 없으면 지도별 다음 출구·문으로 안내 ── */
export function navTargets(map, f) {
  const s = G.s;
  switch (map) {
    case 'PalletTown': return !f.oakEscort ? [[10, 2, '풀숲 입구']] : !f.pokedex ? [[10, 0, '1번도로'], [11, 0, '']] : null;
    case 'Route1': return !f.pokedex ? [[10, 0, '상록시티'], [11, 0, '']] : null;
    case 'ViridianCity': return !f.pokedex ? [[29, 20, '파란 지붕 가게 문 앞']] : !f.badge1 ? [[17, 0, '2번도로'], [18, 0, ''], [19, 0, '']] : null;
    case 'Route2': return !f.badge1 ? [[3, 44, '숲 입구 건물'], [8, 0, '회색시티'], [9, 0, '']] : null;
    case 'ViridianForestSouthGate': return [[4, 0, '숲으로'], [5, 0, '']];
    case 'ViridianForest': return [[1, 0, '숲 출구'], [2, 0, '']];
    case 'ViridianForestNorthGate': return [[4, 0, '2번도로로'], [5, 0, '']];
    case 'PewterCity': return f.badge1 && !f.badge2 ? [[39, 16, '3번도로'], [39, 17, ''], [39, 18, ''], [39, 19, '']] : null;
    case 'Route3': return f.badge1 && !f.badge2 ? [58, 59, 60, 61, 62, 63].map((x, i) => [x, 0, i ? '' : '4번도로(달맞이산)']) : null;
    case 'Route4': return !f.badge2 ? (!f.fossil && s.x < 22 ? [[18, 6, '동굴 입구 앞']] : [[89, 4, '블루시티'], [89, 10, ''], [89, 11, '']]) : null;
    case 'CeruleanCity': return f.badge2 && !f.billSaved ? [[20, 0, '24번도로'], [21, 0, '']] : f.billSaved && !f.badge3 ? [[12, 35, '5번도로'], [13, 35, '']] : null;
    case 'Route24': return f.billSaved && !f.badge3 ? [[10, 35, '블루시티'], [11, 35, '']] : null;
    case 'Route25': return f.billSaved && !f.badge3 ? [[0, 8, '24번도로'], [0, 9, '']] : null;
    case 'Route5': return f.billSaved && !f.badge3 ? [[17, 28, '지하통로 입구 앞']] : null;
    case 'UndergroundPathRoute5': return [[4, 4, '계단']];
    case 'UndergroundPathNorthSouth': return [[2, 41, '남쪽 계단']];
    case 'UndergroundPathRoute6': return [[3, 7, '출구'], [4, 7, '']];
    case 'Route6': return f.billSaved && !f.badge3 ? [[8, 35, '갈색시티'], [9, 35, '']] : null;
    default: return null;
  }
}
export function objective() {
  const o = objectiveBase();
  if (!o.targets) o.targets = navTargets(G.s.map, G.s.flags);
  // 건물 안인데 여기서 할 일이 없으면 → 출구(맨 아래 매트)로 안내
  const m = DB.maps[G.s.map];
  if (!o.targets && m && !m.outdoor && m.tileset !== 'Cavern') {
    const exits = [];
    m.grid[m.h - 1].split('').forEach((c, x) => { if (c === 'D') exits.push([x, m.h - 1, exits.length ? '' : '출구']); });
    if (exits.length) o.targets = exits;
  }
  return o;
}
