/* 이야기·대사 (1차: 태초마을 ~ 회색시티 체육관). 원작 흐름을 따르되 대사는 아이 눈높이로 새로 썼다. */
import { G, flag, setFlag, addItem, itemCount, receive, healParty, save, alive, seen, maxHp } from '../state.js';
import { DB, ITEMS, sp, monArt, MAP_NAME } from '../data.js';
import * as F from './field.js';
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
  const late = npcVisibleLate(map, n, idx);
  if (late != null) return late;
  return true;
}
export function npcPos(map, n, idx) { return null; }
export function npcKind(map, n, idx) {
  const K = { Mom: 'mom', Nurse: 'nurse', Clerk: 'clerk', Daisy: 'coolf', BrunetteGirl: 'girl', LittleGirl: 'girl', Gramps: 'oldman', Gentleman: 'gambler', LinkReceptionist: 'nurse', SuperNerd: 'nerd' };
  const late = npcKindLate(map, n, idx);
  if (late) return late;
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
export function extraBlock(map, x, y) {
  if (map === 'CinnabarIsland' && x === 18 && y === 3 && !itemCount(43)) return true; // 홍련마을 체육관: 비밀열쇠 전엔 잠김
  if (map === 'ViridianCity' && x === 32 && y === 7 && !flag('badge7')) return true; // 상록시티 체육관: 배지 7개 전엔 잠김
  if (map === 'Route22Gate' && y === 0 && !flag('badge8')) return true; // 리그 관문: 배지 8개
  const e = E4_BY[map];
  if (e && !flag(e.f) && e.exit.some(([ex, ey]) => ex === x && ey === y)) return true; // 사천왕: 이겨야 다음 방
  if (map === 'ChampionsRoom' && y === 0) return true; // 명예의 전당은 챔피언을 이기면 오박사가 데려간다
  return false;
}
/* 관장·보스·사천왕·라이벌은 '시선 승부' 트레이너가 아니다 — 말을 걸면 전용 대사·배지 처리(LINES)로 간다
 * (원작 데이터에서 초련 등이 isTrainer 로 표시돼 일반 트레이너 승부로 처리되고 배지가 안 나오던 문제) */
const LEADER_CLS = new Set(['Brock', 'Misty', 'LtSurge', 'Erika', 'Koga', 'Sabrina', 'Blaine', 'Giovanni', 'Lorelei', 'Bruno', 'Agatha', 'Lance', 'Rival1', 'Rival2', 'Rival3']);
export const trainerBeaten = (map, o) => LEADER_CLS.has(o.n.trainerClass) || flag(`tr:${map}:${o.idx}`);

/* ── 막힌 문 ── */
export async function lockedDoor(dest) {
  if (await lockedDoorLate(dest || '')) return;
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
  if (await stepTriggerLate(map, x, y, d)) return true;
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
  if (map === 'ViridianCity' && x === 32 && y === 7 && !flag('badge7')) { W.busy = true; await say(['체육관 문이 잠겨 있다…', '“관장은 아주 오랫동안 자리를 비웠대. 배지를 7개 모으면 돌아온다는 소문이야.”']); W.busy = false; return; }
  if (map === 'Route22Gate' && y === 0 && !flag('badge8')) { W.busy = true; await say(['여기서부터는 포켓몬 리그! 배지 8개가 있어야 지나갈 수 있다.'], { who: '경비원', face: 'clerk' }); W.busy = false; return; }
  if (E4_BY[map] && !flag(E4_BY[map].f) && y === 0) { W.busy = true; await say([`문이 굳게 닫혀 있다. 사천왕 ${josa(E4_BY[map].name, '을/를')} 이겨야 열린다!`]); W.busy = false; return; }
  if (map === 'ChampionsRoom' && y === 0) { W.busy = true; await say(['안쪽 방은 챔피언만 들어갈 수 있다.']); W.busy = false; return; }
  if (map === 'CinnabarIsland' && x === 18 && y === 3 && !itemCount(43)) { W.busy = true; await say(['체육관 문이 잠겨 있다!', '“열쇠는 저택에 두고 왔다네! 허허!” — 관장 강연', '💡 왼쪽 위 포켓몬 저택 지하에서 비밀열쇠를 찾자.']); W.busy = false; return; }
  if (!m.outdoor) return;
  if (x < 0 || y < 0 || x >= m.w || y >= m.h) {
    W.busy = true;
    await say(['이 길은 다음 모험에서 열려!', '💡 화면 위 “다음 목표”를 눌러 보면 어디로 갈지 알려 줘.']);
    W.busy = false;
  }
}
export async function enterMap(id) {
  await enterMapLate(id);
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
  if (LEADER_CLS.has(o.n.trainerClass) && typeof LINES[k] === 'function') return LINES[k](o);
  if (o.n.isTrainer && !trainerBeaten(map, o)) return trainerEncounter(map, o);
  if (o.n.isTrainer && TRAINER[k]) return say(TRAINER[k].post.slice(1).length ? TRAINER[k].post.slice(1) : TRAINER[k].post, { who: TRAINER[k].name, face: o.kind });
  if (o.n.isTrainer) { const t = autoTrainer(map, o); return say(t.post.slice(1), { who: t.name, face: o.kind }); }
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
  if (!L && DB.maps[map] && DB.maps[map].outdoor) L = [MAP_NAME[map] || '……'];
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
  const t = TRAINER[k] || autoTrainer(map, o);
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
  return objectiveLate(map);
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


/* ════════════════ 4판: 상트앙느호 · 돌산터널 · 보라타운 · 무지개시티 ════════════════
 * 길: 갈색시티 항구 → 상트앙느호(라이벌, 선장 → 풀베기) → 블루시티 동쪽 9번도로(나무 베기) → 10번도로
 *     → 돌산터널(오박사 조수의 플래시) → 보라타운 → 8번도로 · 지하통로 · 7번도로 → 무지개시티 → 민화(풀) */

/* ── 이름 없는 트레이너: 직업 이름 + 짧은 말 + 이긴 뒤 상식 하나 (모든 판 공통) ── */
const CLASS_KO = {
  Lass: '미니스커트', Youngster: '반바지꼬마', BugCatcher: '곤충채집소년', Hiker: '등산가', Pokemaniac: '포켓몬마니아', JrTrainerM: '주니어트레이너',
  JrTrainerF: '주니어트레이너', SuperNerd: '괴짜박사', Gambler: '게임왕', Beauty: '아가씨', CooltrainerF: '엘리트트레이너', CooltrainerM: '엘리트트레이너',
  Rocket: '로켓단 조무래기', Gentleman: '신사', Sailor: '선원', Fisher: '낚시꾼', Swimmer: '수영선수', Biker: '폭주족', Burglar: '도둑', Engineer: '기술자',
  Juggler: '저글러', Tamer: '조련사', BirdKeeper: '새조련사', Blackbelt: '태권왕', Psychic: '초능력자', Rocker: '로커', Channeler: '무당',
  Scientist: '과학자', CueBall: '스킨헤드', Camper: '캠프보이', Picnicker: '피크닉걸',
};
const PRE_LINES = ['눈이 마주쳤다! 승부다!', '내 포켓몬 실력 좀 볼래?', '여기서 만난 것도 인연! 한판 붙자!', '나를 이기면 지나가도 좋아!', '강해 보이는데? 겨뤄 보자!', '문제도 잘 푼다며? 배틀도 잘하나 볼까!'];
const LOSE_LINES = ['졌다!', '으윽, 강하다!', '다음엔 꼭 이길 거야!', '대단한걸!', '졌지만 즐거웠어!'];
const FUN_FACTS = [
  '지구는 하루에 한 바퀴 스스로 돌아서 낮과 밤이 생겨.', '소리는 공기가 떨리면서 전해져. 그래서 공기가 없는 우주에선 소리가 안 들려!',
  '식물은 햇빛과 물, 이산화탄소로 양분을 만들어. 이걸 광합성이라고 해.', '번개가 친 뒤 천둥소리가 늦게 들리는 건 빛이 소리보다 훨씬 빠르기 때문이야.',
  '달은 스스로 빛나지 않아. 햇빛을 반사해서 밝게 보이는 거야.', '곤충은 다리가 6개, 거미는 8개야.', '고래는 물고기가 아니라 새끼에게 젖을 먹이는 포유류야.',
  '자석의 같은 극끼리는 밀어내고, 다른 극끼리는 끌어당겨.', '무지개는 햇빛이 빗방울 속에서 꺾이고 나뉘어서 생겨.', '뼈는 살아 있어서, 부러져도 다시 붙을 수 있어.',
  '얼음이 물에 뜨는 건 물이 얼 때 부피가 커져서 같은 부피일 때 더 가볍기 때문이야.', '곱셈은 같은 수를 여러 번 더하는 걸 짧게 쓴 거야.',
  '세종대왕은 백성이 쉽게 글을 읽고 쓰도록 한글을 만들었어.', '피라미드는 아주 오래전 이집트 사람들이 왕의 무덤으로 지었어.', '운동하기 전에 준비운동을 하면 다치는 걸 막을 수 있어.',
  '소방관은 불만 끄는 게 아니라 사람을 구하고 안전을 지키는 일도 해.', '공룡은 사람이 나타나기 아주 오래전에 살았어.', '식물의 뿌리는 물을 빨아올리고, 식물이 쓰러지지 않게 붙잡아 줘.',
  '태양은 스스로 빛을 내는 별이야. 지구에서 가장 가까운 별이지!', '손을 비누로 씻으면 눈에 안 보이는 세균을 씻어 낼 수 있어.',
];
function autoTrainer(map, o) {
  const h = [...`${map}${o.idx}`].reduce((a, c) => a + c.charCodeAt(0), 0);
  const name = CLASS_KO[o.n.trainerClass] || '트레이너';
  return { name, pre: [PRE_LINES[h % PRE_LINES.length]], post: [LOSE_LINES[h % LOSE_LINES.length], `💡 ${FUN_FACTS[h % FUN_FACTS.length]}`], money: 200 + 40 * ((o.n.trainerSet || 1) % 10) };
}

/* ── 상트앙느호 ── */
async function rivalSSAnne() {
  const S = W.scene;
  W.busy = true;
  try {
    const rv = S.npcBy?.((x) => x.idx === 1);
    if (rv) S.faceNpcToPlayer(rv);
    await sayAs('rival', [`어? ${P()}! 너도 이 배에 탔어?`, '나는 선장님을 만나고 왔지. 너 실력은 좀 늘었냐? 보여 줘 봐!']);
    const res = await W.trainerBattle({ party: [[17, 19], [20, 16], [64, 18], [133, 20]], name: R(), face: 'rival', intro: `라이벌 ${josa(R(), '이/가')} 승부를 걸어 왔다!`, lose: '뭐야… 또 졌잖아!', win: '헤헤, 내가 한 수 위지!', money: 1200 });
    setFlag('rival3');
    if (res !== 'win') return;
    await sayAs('rival', ['쳇, 많이 강해졌네.', '선장님은 뱃멀미 때문에 힘들어하셔. 등이라도 쓸어 드려 봐. 그럼 난 간다!']);
    if (rv) S.removeNpc(rv);
    save();
  } finally { W.busy = false; }
}
async function captainTalk() {
  if (flag('gotCut')) return say(['덕분에 살았네! 배가 곧 떠나니 서둘러 내리게.', '💡 풀베기는 블루배지가 있으면 작은 나무 앞에서 A 버튼으로 쓸 수 있다네.'], { who: '선장', face: 'captain' });
  await say(['우욱… 뱃멀미가… 너무 심해…'], { who: '선장', face: 'captain' });
  const yes = await ask('선장님 등을 쓸어 드릴까?');
  if (!yes) return say(['우욱…'], { who: '선장', face: 'captain' });
  await say([`${josa(P(), '은/는')} 선장님 등을 천천히 쓸어 드렸다…`]);
  await say(['휴우… 이제 좀 살 것 같군! 고맙네, 꼬마 트레이너.', '뱃멀미는 눈으로 보는 것과 몸(귀 속 균형 기관)이 느끼는 흔들림이 서로 달라서 생긴다네.', '고마움의 표시로 이걸 주지!'], { who: '선장', face: 'captain' });
  addItem(F.HM.cut, 1); setFlag('gotCut'); sfx('item');
  await say([`${josa(P(), '은/는')} 비전머신01 “풀베기”를 받았다!`, '💡 블루배지가 있으니, 길을 막는 작은 나무 앞에서 A 버튼을 누르면 벨 수 있어!', '블루시티 동쪽 9번도로 입구에 그런 나무가 있대.']);
  W.updateGoal?.(); save();
}

/* ── 돌산터널: 오박사 조수의 플래시 ── */
async function aideFlash() {
  if (F.hasHM('flash')) return say(['돌산터널은 아주 어둡지만, 플래시가 있으면 환하게 보일 거야!', '터널 안에서는 오른쪽 위 사다리 → 지하 → 왼쪽 위 사다리 순서야.'], { who: '오박사 조수', face: 'scientist' });
  await say([`아, ${P()}! 오박사님 심부름으로 기다리고 있었어.`, '이 앞 돌산터널은 빛이 하나도 없는 캄캄한 동굴이야.', '이 비전머신을 쓰면 포켓몬이 빛을 내서 길이 보인단다!'], { who: '오박사 조수', face: 'scientist' });
  addItem(F.HM.flash, 1); sfx('item');
  await say([`${josa(P(), '은/는')} 비전머신05 “플래시”를 받았다!`, '💡 회색배지가 있으니, 이제 어두운 동굴에 들어가면 저절로 환해져!']);
  save();
}

/* ── 무지개시티: 날아가기 선물 ── */
async function flyGift() {
  if (F.hasHM('fly')) return say(['메뉴(☰)에서 “날아가기”를 고르면 가 본 도시로 바로 날아갈 수 있어!'], { who: '신사', face: 'gambler' });
  await say(['오, 오렌지배지를 가진 트레이너로구먼!', '이 비전머신이 있으면 새 포켓몬처럼 하늘을 날아 가 본 도시로 갈 수 있지.', '새는 날개로 공기를 아래로 밀어서 그 반대로 몸이 위로 뜬다네. 선물일세!'], { who: '신사', face: 'gambler' });
  addItem(F.HM.fly, 1); sfx('item');
  await say([`${josa(P(), '은/는')} 비전머신02 “날아가기”를 받았다!`, '💡 밖에서 메뉴(☰) → “🕊 날아가기”를 누르면 포켓몬센터가 있는 도시로 날아가!']);
  save();
}

/* ── 민화 (풀) ── */
async function erikaBattle() {
  if (flag('badge4')) return say(['무지개배지는 식물처럼 꾸준히 자란 네 마음의 증거예요.', '다음 모험도 응원할게요.'], { who: '민화', face: 'erika' });
  await say(['어머, 손님이 오셨네요. 저는 무지개시티 체육관 관장 민화예요.', '꽃과 나무는 햇빛과 물, 공기만으로 스스로 양분을 만들지요. 광합성이라고 해요.', '식물처럼 차분하게 생각하는 트레이너만 저를 이길 수 있어요. 문제를 잘 읽어 보세요.'], { who: '민화', face: 'erika' });
  const res = await W.trainerBattle({ cls: 'Erika', set: 0, name: '민화', face: 'erika', intro: '관장 민화가 승부를 걸어 왔다!', story: true, gym: true, lose: '어머… 제가 졌네요. 정말 대단해요.', money: 2900, music: 'gym' });
  if (res !== 'win') return;
  await say(['이 무지개배지를 받으세요.'], { who: '민화', face: 'erika' });
  setFlag('badge4'); G.s.badges.push('rainbow'); onBadge(); sfx('badge');
  await say([`${josa(P(), '은/는')} 무지개배지를 받았다!`, '(문제가 한 단계 더 어려워진다! 반이나 왔어, 대단해!)']);
  save();
  await W.chapterEnd?.(4);
}

Object.assign(LINES, {
  'SSAnne1F:0': () => say(['상트앙느호에 오신 걸 환영합니다! 오늘은 트레이너들의 선상 파티가 열려요.', '큰 배가 물에 뜨는 건, 배가 밀어낸 물의 무게만큼 물이 위로 밀어 주기 때문이랍니다.'], { who: '웨이터', face: 'waiter' }),
  'SSAnne1F:1': () => say(['선장님은 2층 맨 오른쪽 방에 계셔. 그런데 몸이 안 좋으시대.'], { who: '선원', face: 'sailor' }),
  'SSAnne2F:0': () => say(['배는 바람과 물결을 읽으며 나아가요. 나침반은 늘 북쪽을 가리키죠!'], { who: '웨이터', face: 'waiter' }),
  'SSAnne2F:1': () => (flag('rival3') ? null : rivalSSAnne()),
  'SSAnneCaptainsRoom:0': () => captainTalk(),
  'RockTunnelPokecenter:0': nurse,
  'RockTunnelPokecenter:1': () => aideFlash(),
  'RockTunnelPokecenter:2': () => say(['돌산터널은 바위를 뚫어 만든 길이야. 박쥐 포켓몬 주뱃이 많지!', '주뱃은 눈 대신 소리를 내고 메아리로 길을 찾는대.']),
  'RockTunnelPokecenter:3': () => say(['통신 교환 서비스는 지금 준비 중이에요.'], { who: '안내원', face: 'nurse' }),
  'LavenderTown:0': () => say(['보라타운에는 포켓몬 묘지가 있는 탑이 있어.', '요즘 그 탑에 유령이 나온다는 소문이 돌아…'], { who: '소녀', face: 'girl' }),
  'LavenderTown:1': () => say(['서쪽 8번도로로 가면 지하통로를 지나 무지개시티에 갈 수 있어!']),
  'LavenderTown:2': () => say(['유령 포켓몬은 보통 안경으로는 정체가 안 보인대.', '실프 회사에서 만든 특별한 안경이 있다던데…'], { who: '괴짜박사', face: 'nerd' }),
  'LavenderPokecenter:0': nurse,
  'LavenderPokecenter:1': () => say(['로켓단이 포켓몬을 괴롭히고 있대. 무지개시티에 아지트가 있다는 소문이야.'], { who: '신사', face: 'gambler' }),
  'LavenderPokecenter:2': () => say(['우리 탑의 후지 할아버지는 포켓몬을 정말 아끼는 분이야.'], { who: '소녀', face: 'girl' }),
  'LavenderPokecenter:3': () => say(['통신 교환 서비스는 지금 준비 중이에요.'], { who: '안내원', face: 'nurse' }),
  'LavenderMart:0': clerk,
  'LavenderMart:1': () => say(['기력의조각은 기절한 포켓몬을 깨워 줘. 비싸지만 든든하지!']),
  'LavenderMart:2': () => say(['벌레회피스프레이를 뿌리면 한동안 야생 포켓몬이 안 나와!']),
  'CeladonCity:0': () => say(['무지개시티 백화점은 엄청 커! 1층에서 진화의 돌도 팔아.'], { who: '소녀', face: 'girl' }),
  'CeladonCity:1': () => say(['허허, 게임코너는 요즘 수상한 사람들이 드나든다네.'], { who: '할아버지', face: 'oldman' }),
  'CeladonCity:2': () => say(['체육관 관장 민화 언니는 꽃꽂이 선생님이기도 해!'], { who: '소녀', face: 'girl' }),
  'CeladonCity:3': () => say(['이 연못의 물고기는 아가미로 물속에 녹은 산소를 마신단다.'], { who: '할아버지', face: 'oldman' }),
  'CeladonCity:4': () => say(['무지개시티는 이름처럼 여러 색의 사람이 어울려 사는 도시지!'], { who: '할아버지', face: 'oldman' }),
  'CeladonCity:5': () => say(['내 포켓몬 수륙챙이는 물에서도 땅에서도 지낼 수 있어!'], { who: '낚시꾼', face: 'fisher' }),
  'CeladonCity:6': () => say(['개굴!'], { who: '수륙챙이' }),
  'CeladonCity:7': () => say(['뭘 봐? 게임코너 근처에서 얼쩡대지 마!'], { who: '로켓단', face: 'rocket' }),
  'CeladonCity:8': () => say(['우리 보스는 아무도 못 이겨! …아차, 말이 너무 많았네.'], { who: '로켓단', face: 'rocket' }),
  'CeladonPokecenter:0': nurse,
  'CeladonPokecenter:1': () => flyGift(),
  'CeladonPokecenter:2': () => say(['진화의 돌은 어떤 포켓몬에게 쓰면 진화시켜 줘. 피카츄는 천둥의돌로 라이츄가 된대!'], { who: '아가씨', face: 'beauty' }),
  'CeladonPokecenter:3': () => say(['통신 교환 서비스는 지금 준비 중이에요.'], { who: '안내원', face: 'nurse' }),
  'CeladonMart1F:0': async () => { await say(['무지개시티 백화점에 오신 걸 환영해요! 위층은 공사 중이라 1층에서 모두 팔아요.'], { who: '안내원', face: 'nurse' }); return W.openShop?.(); },
  'CeladonGym:0': () => erikaBattle(),
});
Object.assign(TRAINER, {
  'CeladonGym:1': T2('미니스커트', '민화 언니께 가려면 나를 이겨야 해!', ['졌다!', '꽃의 향기는 벌과 나비를 불러서 꽃가루를 옮기게 해.'], 600),
  'CeladonGym:2': T2('아가씨', '꽃처럼 아름다운 승부를 해요!', ['졌어요…', '해바라기는 해를 따라 고개를 돌린대요. 빛을 더 받으려고!'], 700),
  'CeladonGym:3': T2('주니어트레이너', '풀 포켓몬의 힘을 보여 줄게!', ['졌다!', '나무의 나이테를 세면 나무의 나이를 알 수 있어.'], 500),
  'CeladonGym:4': T2('아가씨', '정원은 내가 지킨다!', ['졌어요!', '선인장 가시는 사실 잎이 변한 거래요. 물을 아끼려고!'], 700),
  'CeladonGym:5': T2('미니스커트', '여기까지 오다니 대단한데?', ['졌다!', '씨앗 속에는 아기 식물과 처음 먹을 양분이 들어 있어.'], 600),
  'CeladonGym:6': T2('아가씨', '마지막 꽃은 쉽게 꺾이지 않아요!', ['졌네요…', '식물도 숨을 쉬어요. 잎 뒷면의 작은 구멍(기공)으로요.'], 700),
  'CeladonGym:7': T2('엘리트트레이너', '민화 관장님은 정말 강해. 나를 이기면 인정!', ['졌다!', '광합성을 하면 산소가 나와. 우리가 숨 쉬는 산소야!'], 900),
});
Object.assign(SIGNS, {
  'VermilionCity:7': ['갈색시티 항구', '상트앙느호 선착장'],
  'Route9:1': ['9번도로', '← 블루시티 · 돌산터널 →'],
  'Route10:1': ['돌산터널', '← 포켓몬센터'], 'Route10:2': ['10번도로', '↑ 9번도로 · 보라타운 ↓'],
  'RockTunnel1F:1': ['돌산터널', '캄캄하니 플래시를 쓰세요!'],
  'LavenderTown:1': ['보라타운', '고귀한 보라색의 마을'], 'LavenderTown:2': ['새로운 실프스코프!', '보이지 않는 것을 보여 드립니다 — 실프주식회사'],
  'LavenderTown:3': ['프렌들리숍'], 'LavenderTown:4': ['포켓몬센터'], 'LavenderTown:5': ['포켓몬타워', '포켓몬의 넋을 기리는 곳'],
  'Route8:1': ['8번도로', '← 노랑시티 · 보라타운 →'],
  'CeladonCity:1': ['트레이너 팁', '풀 포켓몬에게는 불꽃·비행·얼음 기술이 잘 들어요!'], 'CeladonCity:2': ['무지개시티', '무지개처럼 다채로운 도시'],
  'CeladonCity:3': ['무지개시티 체육관', '관장: 민화 — 자연을 사랑하는 공주님'], 'CeladonCity:4': ['무지개시티 맨션'],
  'CeladonCity:5': ['무지개시티 백화점'], 'CeladonCity:6': ['포켓몬센터'], 'CeladonCity:7': ['게임코너', '어른들의 놀이터 — 어린이는 구경만!'],
  'CeladonCity:8': ['식당', '무지개 정식'], 'CeladonCity:9': ['무지개 호텔'],
  'CeladonGym:1': () => [flag('badge4') ? `무지개시티 체육관 — 우승 트레이너: ${P()}` : '무지개시티 체육관 — 우승 트레이너: …'],
  'CeladonGym:2': () => [flag('badge4') ? `무지개시티 체육관 — 우승 트레이너: ${P()}` : '무지개시티 체육관 — 우승 트레이너: …'],
});
Object.assign(EXTRA_WILD, {
  Route9: [['Rattata', 16], ['Spearow', 16], ['Ekans', 16], ['Sandshrew', 16], ['Mankey', 16]],
  Route10: [['Voltorb', 16], ['Magnemite', 16], ['Spearow', 16], ['Ekans', 16], ['Sandshrew', 16]],
  RockTunnel1F: [['Zubat', 16], ['Geodude', 16], ['Machop', 16], ['Onix', 15]],
  RockTunnelB1F: [['Zubat', 17], ['Geodude', 17], ['Machop', 17], ['Onix', 16]],
  Route8: [['Growlithe', 18], ['Vulpix', 18], ['Meowth', 18], ['Pidgey', 18], ['Abra', 17], ['Jigglypuff', 18]],
  Route7: [['Oddish', 19], ['Bellsprout', 19], ['Meowth', 19], ['Growlithe', 19], ['Vulpix', 19], ['Abra', 18]],
});

/* ── 판별 연결 고리 (공통 함수가 부른다) ── */
function npcVisibleLate(map, n, idx) {
  if (map === 'SSAnne2F' && idx === 1) return !flag('rival3');
  if (map === 'RocketHideoutB4F' && (idx === 0 || idx === 7)) return !flag('scope'); // 보스 · 실프스코프 공(보스를 이기면 바로 받는다)
  if (map === 'PokemonTower2F' && idx === 0) return !flag('rival4');
  if (map === 'PokemonTower7F' && idx === 3) return !flag('fujiSaved');
  if (map === 'Route12' && idx === 0) return !flag('snorlax12');
  if (map === 'SaffronCity' && (idx === 13 || idx === 14)) return false; // 실프 문 앞을 막던 두 명
  if (map === 'SaffronCity' && idx <= 6) return !flag('silphFreed'); // 로켓단은 실프를 구하면 떠난다
  if (map === 'SilphCo7F' && idx === 8) return !flag('rival5');
  if (map === 'SilphCo11F' && idx === 2) return !flag('silphFreed');
  if (map === 'Route22' && idx === 0) return false; // 1판 라이벌 자리(쓰지 않음)
  if (map === 'Route22' && idx === 1) return flag('badge8') && !flag('rival6');
  if (map === 'VictoryRoad2F' && idx === 5) return !flag('moltres');
  if (map === 'ChampionsRoom' && idx === 1) return false; // 오박사는 대사로만
  if (map === 'ViridianGym' && idx === 0) return true;
  return null;
}
function npcKindLate(map, n, idx) {
  if (map === 'CeladonGym' && idx === 0) return 'erika';
  if (map === 'ViridianGym' && idx === 9) return 'guide';
  if (map === 'IndigoPlateauLobby' && idx === 1) return 'guide';
  if (map === 'Route22' && idx === 1) return 'rival';
  if (map === 'ChampionsRoom' && idx === 0) return 'rival';
  if (map === 'VictoryRoad2F' && idx === 5) return 'mon:146';
  if (map === 'RockTunnelPokecenter' && idx === 1) return 'scientist';
  if (map === 'SSAnne2F' && idx === 1) return 'rival';
  if (map === 'PokemonTower2F' && idx === 0) return 'rival';
  if (map === 'GameCorner' && idx === 6) return 'guide';
  if (n.spriteName === 'MrFuji') return 'oldman';
  // 사람이 아닌 포켓몬 NPC (원작 데이터엔 'Monster' 로만 적혀 있다)
  const MON = { 'MrFujisHouse:2': 54, 'MrFujisHouse:3': 33, 'CeladonCity:6': 61, 'Route12:0': 143, 'FuchsiaCity:4': 35, 'FuchsiaCity:6': 115, 'FuchsiaCity:7': 113, 'FuchsiaCity:8': 86 };
  if (map === 'FuchsiaGym' && idx === 7) return 'guide';
  if (n.spriteName === 'Warden') return 'oldman';
  if (n.spriteName === 'SafariZoneWorker') return 'clerk';
  if (n.spriteName === 'FishingGuru') return 'fisher';
  if (map === 'SaffronGym' && idx === 0) return 'sabrina';
  if (map === 'SaffronGym' && idx === 8) return 'guide';
  if (map === 'CinnabarGym' && idx === 0) return 'blaine';
  if (map === 'CinnabarGym' && idx === 8) return 'guide';
  if (map === 'SilphCo7F' && idx === 8) return 'rival';
  if (n.spriteName === 'SilphPresident') return 'gambler';
  if (n.spriteName === 'Bird') return 'mon:16';
  if (MON[`${map}:${idx}`]) return 'mon:' + MON[`${map}:${idx}`];
  if (n.spriteName === 'Clerk') return 'clerk';
  return null;
}
async function lockedDoorLate(dest) {
  if (/GameCornerPrizeRoom/.test(dest)) { await say(['코인 교환소: “코인은 어른만 바꿀 수 있어요!”']); return true; }
  if (/RocketHideoutElevator/.test(dest)) { await say(['엘리베이터가 멈춰 있다. 계단을 이용하자!']); return true; }
  if (/CeladonMart[2-5]|CeladonMartRoof|CeladonMartElevator/.test(dest)) { await say(['“위층은 공사 중이에요! 1층에서 모든 물건을 팔아요.”']); return true; }
  if (/CeladonMansion|CeladonDiner|CeladonChiefHouse|CeladonHotel/.test(dest)) { await say(['문이 잠겨 있다. 다음에 다시 와 보자.']); return true; }
  if (/SSAnne/.test(dest)) { await say(['선실 문이 잠겨 있다. 손님들이 쉬는 중이래.']); return true; }
  if (/PokemonMansion[23]F/.test(dest)) { await say(['위층은 바닥이 무너져서 위험하다! 지하로 가 보자.']); return true; }
  if (/CinnabarLab/.test(dest)) { await say(['포켓몬 연구소: “화석 복원 기계는 점검 중이에요.”']); return true; }
  if (/^SilphCo|UnusedMap/.test(dest)) { await say(['“그 층은 공사 중이에요! 엘리베이터를 이용해 주세요.”']); return true; }
  if (/FightingDojo|CopycatsHouse|SaffronPidgeyHouse|MrPsychicsHouse/.test(dest)) { await say(['문이 잠겨 있다. 다음에 다시 와 보자.']); return true; }
  if (/PowerPlant/.test(dest)) { await say(['버려진 발전소다. 전기 포켓몬이 산다는데… 지금은 문이 잠겨 있다.']); return true; }
  if (/MrFujisHouse|LavenderCuboneHouse|NameRater/.test(dest)) { await say(['집 안에 아무도 없는 것 같다.']); return true; }
  if (/SafariZone(North|East)/.test(dest)) { await say(['“이 구역은 공사 중이에요! 서쪽 구역으로 가 보세요.”']); return true; }
  if (/Fuchsia|Route12SuperRod|Gate2F|SafariZone.*RestHouse/.test(dest)) { await say(['문이 잠겨 있다. 다음에 다시 와 보자.']); return true; }
  if (/Route1[1-9]|Route2[0-3]|Cycling/.test(dest)) { await say(['이 길은 다음 모험에서 열려!']); return true; }
  return false;
}
async function stepTriggerLate(map, x, y, d) {
  if (map === 'SSAnne2F' && !flag('rival3') && x >= 33) { await rivalSSAnne(); return true; }
  if (map === 'PokemonTower2F' && !flag('rival4') && Math.abs(x - 14) <= 2 && Math.abs(y - 5) <= 2) { await rivalTower(); return true; }
  if (map === 'PokemonTower6F' && !flag('marowak') && y >= 14 && y <= 15 && x >= 9 && x <= 12) { await marowakGhost(); return true; }
  if (/^Route[5-8]Gate$/.test(map) && !flag('badge5')) { // 노랑시티 관문: 핑크배지 전에는 못 지나간다
    W.busy = true; await gateGuard(); const back = { up: 'down', down: 'up', left: 'right', right: 'left' }[d]; await W.scene.walkPlayer(back, 1); W.busy = false; return true;
  }
  if (map === 'SilphCo7F' && !flag('rival5') && x <= 6 && y >= 5 && y <= 9) { await rivalSilph(); return true; }
  if (map === 'Route22' && flag('badge8') && !flag('rival6') && x <= 28) { await rivalRoute22(); return true; }
  const e = E4_BY[map];
  if (e && !flag(e.f) && y <= e.at[1] && Math.abs(x - e.at[0]) <= 3) { await e4Battle(e); return true; }
  if (map === 'ChampionsRoom' && !flag('champWin') && y <= 4) { await championBattle(); return true; }
  return false;
}
async function enterMapLate(id) {
  if (id === 'SilphCoElevator') { await silphElevator(); return; }
  if (id === 'VermilionDock' && !itemCount(63)) {
    W.busy = true;
    await say(['“배표가 있어야 탈 수 있어요!”', '…아, 이수재 박사님이 너에게 주라고 맡긴 게 있네요!'], { who: '선원', face: 'sailor' });
    addItem(63, 1); sfx('item');
    await say([`${josa(P(), '은/는')} 배표를 받았다!`]);
    save(); W.busy = false;
  }
  if (id === 'RockTunnel1F' && !flag('rtIntro')) {
    setFlag('rtIntro'); W.busy = true;
    await say(F.isDark(id) ? ['캄캄해서 앞이 거의 안 보인다…', '💡 10번도로 포켓몬센터의 오박사 조수에게 “플래시”를 받으면 환해져!'] : ['플래시 덕분에 동굴 안이 환하게 보인다!', '💡 오른쪽 위 사다리 → 지하 → 왼쪽 위 사다리 순서로 가면 출구야.']);
    W.busy = false;
  }
  if (id === 'CeladonGym' && !flag('gym4Intro')) {
    setFlag('gym4Intro'); W.busy = true;
    await say(['무지개시티 체육관에 들어왔다! 꽃과 나무 향기가 가득하다.', '관장 민화는 풀 포켓몬을 쓴다. 불꽃·비행·얼음 기술이 효과 굉장!', '💡 길을 막는 작은 나무는 풀베기로!']);
    W.busy = false;
  }
}

/* ── 목표 안내 (3판 다음) ── */
function objectiveLate(map) {
  if (!flag('badge4')) return ch4Goal(map);
  if (!flag('flute')) return ch5Goal(map);
  const g6 = ch6Goal(map); if (g6) return g6;
  const g7 = ch7Goal(map); if (g7) return g7;
  const g8 = ch8Goal(map); if (g8) return g8;
  const g9 = ch9Goal(map); if (g9) return g9;
  return { text: '🏆 챔피언 달성! 도감을 채우거나 사천왕에게 다시 도전하자', detail: ['진화의 돌로 포켓몬을 진화시켜 보자!', '메뉴(☰) → 🕊 날아가기로 도시를 오갈 수 있어.'], dir: '' };
}
function ch4Goal(map) {
  const T = (text, detail, targets, dir = '') => ({ text, detail, dir, targets });
  if (!flag('gotCut')) {
    if (map === 'VermilionCity') return T('갈색시티 아래쪽 항구에서 상트앙느호를 타자', ['도시 맨 아래(남쪽) 항구 입구로!', '이수재 박사님이 배표를 맡겨 두셨대.'], [[18, 31, '항구 입구']]);
    if (map === 'VermilionDock') return T('배에 오르자!', ['위쪽 배 입구로 걸어가자.'], [[14, 2, '배 입구']]);
    if (map === 'SSAnne1F') return T('왼쪽 계단으로 2층에 올라가자', ['선장님은 2층 오른쪽 끝 방에 계셔.'], [[2, 6, '2층 계단']]);
    if (map === 'SSAnne2F') return flag('rival3') ? T('오른쪽 끝 선장실로!', ['선장님 방 문으로 들어가자.'], [[36, 4, '선장실 문']]) : T('2층 오른쪽 끝으로 가자', ['누군가 기다리고 있는 것 같아…'], [[37, 5, '선장실 앞']]);
    if (map === 'SSAnneCaptainsRoom') return T('선장님께 말을 걸자', ['선장님이 많이 힘들어 보인다…'], [[4, 3, '선장 앞']]);
    return T('갈색시티 항구에서 상트앙느호를 타자', ['갈색시티 남쪽 항구 → 배 1층 → 2층 오른쪽 끝 선장실.'], null);
  }
  if (map === 'SSAnneCaptainsRoom') return T('배에서 내려 갈색시티로', ['왔던 길로 나가자.'], null);
  if (map === 'SSAnne2F') return T('배에서 내려 갈색시티로', ['왼쪽 계단으로 1층에 내려가자.'], [[2, 4, '1층 계단']]);
  if (map === 'SSAnne1F') return T('배에서 내려 갈색시티로', ['위쪽 출구로!'], [[26, 0, '출구'], [27, 0, '']]);
  if (map === 'VermilionDock') return T('갈색시티로 나가자', ['위쪽 출구로!'], [[14, 0, '갈색시티']]);
  if (/^Vermilion/.test(map)) return T('블루시티로 돌아가 동쪽 9번도로로!', ['갈색시티 북쪽 6번도로 → 지하통로 → 5번도로 → 블루시티.', '9번도로 입구의 작은 나무는 풀베기로 베자!'], map === 'VermilionCity' ? [[18, 0, '6번도로'], [19, 0, '']] : null);
  if (map === 'Route6') return T('지하통로 입구 건물로', ['오른쪽 위 작은 건물이 지하통로 입구야.'], [[17, 13, '지하통로 입구']]);
  if (map === 'UndergroundPathRoute6') return T('계단을 내려가자', [], [[4, 4, '계단']]);
  if (map === 'UndergroundPathNorthSouth') return T('지하통로를 따라 북쪽으로!', ['긴 통로를 쭉 올라가자.'], [[5, 4, '북쪽 계단']]);
  if (map === 'UndergroundPathRoute5') return T('밖으로 나가 북쪽 블루시티로', [], [[3, 7, '출구'], [4, 7, '']]);
  if (map === 'Route5') return T('북쪽으로 가면 블루시티!', [], [[10, 0, '블루시티'], [11, 0, '']]);
  if (map === 'CeruleanCity') return T('블루시티 동쪽 끝 9번도로로!', ['오른쪽(동쪽) 끝 길로 나가자.', '입구의 작은 나무는 풀베기로!'], [[39, 16, '9번도로'], [39, 17, '']]);
  if (/^Cerulean/.test(map)) return T('블루시티 동쪽 9번도로로!', [], null);
  if (map === 'Route9') return F.isCut('Route9', 5, 8) ? T('동쪽으로 쭉 가면 10번도로!', ['트레이너들을 이기며 오른쪽 끝까지!'], [[59, 8, '10번도로'], [59, 9, '']], '→ 동쪽')
    : T('작은 나무를 풀베기로 베자', ['나무 앞에서 A 버튼 → “예”!'], [[5, 8, '작은 나무 — A로 풀베기']]);
  if (map === 'Route10') {
    if (G.s.y >= 40) return T('남쪽으로 가면 보라타운!', ['아래쪽으로 쭉!'], [[6, 71, '보라타운'], [7, 71, ''], [8, 71, ''], [9, 71, '']], '↓ 남쪽');
    if (!F.hasHM('flash')) return T('포켓몬센터에서 오박사 조수를 만나자', ['돌산터널 옆 포켓몬센터에 오박사님 조수가 기다리고 있대!'], [[11, 19, '포켓몬센터']]);
    return T('돌산터널로 들어가자', ['포켓몬센터 왼쪽 동굴 입구!'], [[8, 17, '돌산터널 입구']]);
  }
  if (map === 'RockTunnelPokecenter') return F.hasHM('flash') ? T('돌산터널로 들어가자', ['센터를 나와 왼쪽 동굴로!'], null) : T('오박사 조수에게 말을 걸자', ['오른쪽 안경 쓴 아저씨야.'], [[7, 4, '오박사 조수 앞']]);
  if (map === 'RockTunnel1F') {
    const exitOk = W.scene && W.scene.map && W.scene.map.id === map && W.scene.navTo([[15, 33]]);
    return exitOk ? T('남쪽 출구로 나가자!', ['조금만 더! 아래쪽 출구야.'], [[15, 33, '남쪽 출구']]) : T('오른쪽 위 사다리로 내려가자', ['오른쪽 위 사다리 → 지하 → 왼쪽 위 사다리 → 다시 1층 → 남쪽 출구.'], [[37, 3, '오른쪽 위 사다리']]);
  }
  if (map === 'RockTunnelB1F') return T('왼쪽 위 사다리로 올라가자', ['지하를 가로질러 왼쪽 위 사다리까지!'], [[3, 3, '왼쪽 위 사다리']]);
  if (map === 'LavenderTown') return T('서쪽 8번도로로 가자', ['보라타운 왼쪽 길 → 8번도로 → 지하통로 → 7번도로 → 무지개시티.', '포켓몬센터에서 쉬어 가자!'], [[0, 9, '8번도로'], [0, 10, '']], '← 서쪽');
  if (/^Lavender/.test(map)) return T('서쪽 8번도로로 가자', [], null);
  if (map === 'Route8') return T('지하통로 입구 건물로', ['8번도로 왼쪽 위 작은 건물!'], [[13, 3, '지하통로 입구']]);
  if (map === 'UndergroundPathRoute8') return T('계단을 내려가자', [], [[4, 4, '계단']]);
  if (map === 'UndergroundPathWestEast') return T('지하통로를 따라 서쪽으로!', ['긴 통로를 쭉 왼쪽으로!'], [[2, 5, '서쪽 계단']], '← 서쪽');
  if (map === 'UndergroundPathRoute7') return T('밖으로 나가 서쪽 무지개시티로', [], null);
  if (map === 'Route7') return T('서쪽으로 가면 무지개시티!', [], [[0, 2, '무지개시티'], [0, 3, '']], '← 서쪽');
  if (map === 'CeladonCity') {
    if (!F.isCut('CeladonCity', 35, 32)) return T('체육관 가는 길의 작은 나무를 베자', ['도시 아래쪽, 체육관으로 가는 길을 나무가 막고 있어.', '💡 포켓몬센터의 신사 아저씨가 “날아가기”를 선물로 준대!'], [[35, 32, '작은 나무 — A로 풀베기']]);
    return T('무지개시티 체육관에서 관장 민화를 이기자', ['왼쪽 아래 체육관!', '풀 포켓몬에게는 불꽃·비행·얼음 기술이 효과 굉장!'], [[12, 27, '체육관 문']]);
  }
  if (map === 'CeladonGym') return F.isCut('CeladonGym', 5, 7) ? T('관장 민화에게 말을 걸자', ['맨 위 가운데!'], [[4, 4, '민화 앞']]) : T('작은 나무를 풀베기로 베자', ['나무 앞에서 A 버튼!'], [[5, 7, '작은 나무 — A로 풀베기']]);
  if (/^Celadon/.test(map)) return T('무지개시티 체육관으로!', [], null);
  return T('보라타운을 지나 무지개시티로!', ['블루시티 동쪽 9번도로 → 10번도로 → 돌산터널 → 보라타운 → 8번도로 → 지하통로 → 무지개시티.'], null);
}


/* ════════════════ 5판: 로켓단 아지트 · 포켓몬타워 · 후지 노인 · 포켓몬피리 ════════════════ */
async function giovanniHideout() {
  if (flag('scope')) return;
  await say(['…여기까지 쫓아오다니, 대단한 꼬마로군.', '나는 로켓단의 보스, 비주기다.', '포켓몬은 돈을 버는 도구일 뿐이지. 네가 그 생각을 바꿔 보겠다고?'], { who: '비주기', face: 'giovanni' });
  const res = await W.trainerBattle({ cls: 'Giovanni', set: 0, name: '비주기', face: 'giovanni', intro: '로켓단 보스 비주기가 승부를 걸어 왔다!', story: true, lose: '…이럴 수가. 내가 지다니.', money: 3000 });
  if (res !== 'win') return;
  await say(['흥… 오늘은 물러나 주지. 하지만 로켓단은 끝나지 않는다.', '이 안경은 필요 없어졌다. 가져가든 말든!'], { who: '비주기', face: 'giovanni' });
  addItem(72, 1); setFlag('scope'); sfx('item');
  await say([`${josa(P(), '은/는')} 실프스코프를 손에 넣었다!`, '💡 보이지 않는 것을 보여 주는 안경이야. 보라타운 포켓몬타워의 “유령”의 정체를 밝힐 수 있어!']);
  const g = W.scene.npcBy?.((x) => x.idx === 0 && x.kind === 'giovanni'); if (g) W.scene.removeNpc(g);
  W.updateGoal?.(); save();
}
async function rivalTower() {
  const S = W.scene;
  W.busy = true;
  try {
    const rv = S.npcBy?.((x) => x.idx === 0);
    if (rv) S.faceNpcToPlayer(rv);
    await sayAs('rival', [`${P()}! 너도 포켓몬타워에 왔구나.`, '여긴 쓰러진 포켓몬들이 잠든 곳이야. …그런데 넌 포켓몬을 제대로 아끼고 있냐? 보여 줘!']);
    const res = await W.trainerBattle({ party: [[17, 25], [20, 23], [64, 22], [133, 25]], name: R(), face: 'rival', intro: `라이벌 ${josa(R(), '이/가')} 승부를 걸어 왔다!`, lose: '쳇… 너 진짜 강해졌구나.', win: '헤헤, 아직 내가 위야!', money: 1600 });
    setFlag('rival4');
    if (res !== 'win') return;
    await sayAs('rival', ['위층에 로켓단이 후지 할아버지를 붙잡고 있대.', '유령 때문에 아무도 못 올라간다던데… 너라면 할 수 있겠지. 그럼 난 간다!']);
    if (rv) S.removeNpc(rv);
    save();
  } finally { W.busy = false; }
}
async function marowakGhost() {
  const S = W.scene;
  W.busy = true;
  try {
    if (!itemCount(72)) {
      await say(['“나가… 나가라…”', '정체를 알 수 없는 유령이 길을 막고 있다! 너무 무서워서 앞으로 갈 수 없다…', '💡 보이지 않는 것을 보여 주는 “실프스코프”가 있으면…']);
      await S.walkPlayer('up', 1);
      return;
    }
    await say(['“나가… 나가라…”', `${josa(P(), '은/는')} 실프스코프를 썼다!`, '유령의 정체는… 로켓단에게 쓰러진 텅구리의 엄마, 텅구리였다!', '아기를 지키려는 마음 때문에 아직 여기를 떠나지 못하고 있었어.']);
    const res = await W.trainerBattle({ party: [[105, 30]], name: '텅구리의 영혼', face: null, intro: '텅구리의 영혼이 덤벼든다!', lose: '…', money: 0, noBlackout: true });
    if (res !== 'win') { await S.walkPlayer('up', 1); return; }
    setFlag('marowak'); sfx('heal');
    await say(['텅구리의 영혼은 편안한 얼굴로 하늘로 올라갔다…', '이제 7층으로 갈 수 있어!']);
    save();
  } finally { W.busy = false; }
}
async function fujiTower() {
  if (flag('fujiSaved')) return;
  await say(['오오… 너 같은 아이가 나를 구하러 와 주었구나.', '로켓단은 텅구리를 잡으려다 그 엄마를 쓰러뜨렸단다. 정말 슬픈 일이지.', '자, 함께 내 집으로 가자꾸나.'], { who: '후지 노인', face: 'oldman' });
  setFlag('fujiSaved');
  await fade(true, 300);
  await W.scene.loadMap('MrFujisHouse', 3, 2, 'up', { quiet: true });
  save();
  await fade(false, 300);
  await fujiHouse();
}
async function fujiHouse() {
  if (flag('flute')) return say(['포켓몬도 우리처럼 마음이 있단다. 아껴 주렴.', '피리는 잠든 포켓몬을 깨워 줄 거야.'], { who: '후지 노인', face: 'oldman' });
  await say(['고맙구나, 정말 고마워.', '나는 주인을 잃은 포켓몬들을 돌보며 살고 있단다.', '이 피리를 받으렴. 잠든 포켓몬도 이 소리를 들으면 깨어난단다.'], { who: '후지 노인', face: 'oldman' });
  addItem(73, 1); setFlag('flute'); sfx('item');
  await say([`${josa(P(), '은/는')} 포켓몬피리를 받았다!`, '💡 소리는 공기의 떨림이야. 피리는 공기를 떨게 해서 아름다운 소리를 내지!', '보라타운 남쪽 12번도로에서 길을 막고 자는 잠만보를 깨울 수 있대.']);
  save();
  await W.chapterEnd?.(5, ['축하해! 🎉 로켓단을 물리치고 후지 노인을 구했구나!', '포켓몬피리로 잠만보를 깨우면 다음 모험이 시작돼. 연분홍시티로 가 보자!', '그동안 도감을 채우고, 문제를 더 풀어서 포켓몬을 키워 보자!']);
}

Object.assign(LINES, {
  'GameCorner:0': () => say(['게임코너는 어른들의 놀이터래. 우리는 구경만!'], { who: '아가씨', face: 'beauty' }),
  'GameCorner:1': () => say(['코인은 어른만 살 수 있어요. 미안해요!'], { who: '점원', face: 'clerk' }),
  'GameCorner:2': () => say(['확률이 낮은 건 여러 번 해도 잘 안 나와. 운에만 기대면 안 되지!']),
  'GameCorner:3': () => say(['요즘 검은 옷 입은 사람들이 저 포스터 앞을 자꾸 서성여…'], { who: '아가씨', face: 'beauty' }),
  'GameCorner:4': () => say(['낚시도 게임도 참을성이 필요하단다.'], { who: '낚시꾼', face: 'fisher' }),
  'GameCorner:5': () => say(['우리 남편은 하루 종일 여기 있어요… 휴.']),
  'GameCorner:6': () => say(['어이, 챔피언 지망생!', '저기 오른쪽 위 포스터 뒤에 비밀 계단이 있어. 로켓단 아지트로 가는 길이지!', '로켓단 보스를 이기면 대단한 물건을 얻을 수 있을 거야.'], { who: '가이드', face: 'guide' }),
  'GameCorner:7': () => say(['허허, 오늘은 운이 없구먼.'], { who: '게임왕', face: 'gambler' }),
  'GameCorner:8': () => say(['코인 교환소는 옆 건물이에요.'], { who: '점원', face: 'clerk' }),
  'GameCorner:9': () => say(['나는 공부를 많이 해서 확률을 잘 안다네. 그래서 게임은 안 하지!'], { who: '신사', face: 'gambler' }),
  'RocketHideoutB4F:0': () => giovanniHideout(),
  'PokemonTower1F:0': () => say(['포켓몬타워는 세상을 떠난 포켓몬들이 잠든 곳이에요. 조용히 다녀 주세요.'], { who: '안내원', face: 'nurse' }),
  'PokemonTower1F:1': () => say(['우리 집 강아지 포켓몬이 여기 잠들어 있단다. 매일 꽃을 가져와.']),
  'PokemonTower1F:2': () => say(['위층에 유령이 나온다는데… 나는 무서워서 못 올라가겠어.']),
  'PokemonTower1F:3': () => say(['소중한 친구를 기억하는 건 마음을 따뜻하게 해 줘.'], { who: '소녀', face: 'girl' }),
  'PokemonTower1F:4': () => say(['…위층에서 이상한 기운이 느껴진다.'], { who: '무당', face: 'channeler' }),
  'PokemonTower2F:1': () => say(['이 탑의 공기는 차갑지만, 마음은 따뜻하게 가지렴.'], { who: '무당', face: 'channeler' }),
  'PokemonTower5F:0': async () => {
    await say(['이곳은 깨끗한 기운이 모인 곳이에요. 잠시 쉬어 가세요.'], { who: '무당', face: 'channeler' });
    sfx('heal'); healParty(); save();
    return say(['포켓몬들이 기운을 되찾았다!']);
  },
  'PokemonTower7F:3': () => fujiTower(),
  'MrFujisHouse:0': () => say(['후지 할아버지는 주인 없는 포켓몬들을 돌보셔. 정말 좋은 분이야.'], { who: '괴짜박사', face: 'nerd' }),
  'MrFujisHouse:1': () => say(['이 아이들은 다 할아버지가 돌보는 포켓몬이야!'], { who: '소녀', face: 'girl' }),
  'MrFujisHouse:2': () => say(['고라파덕: 꽥?']),
  'MrFujisHouse:3': () => say(['니드리노: 끄응!']),
  'MrFujisHouse:4': () => fujiHouse(),
  'MrFujisHouse:5': () => say(['포켓몬 돌봄 일지가 놓여 있다. “오늘도 모두 밥을 잘 먹었다.”']),
});
Object.assign(TRAINER, {
  'GameCorner:10': T2('로켓단 조무래기', '포스터 앞에서 뭘 기웃거려? 썩 꺼져!', ['으윽! 비밀이 들키겠잖아!', '…포스터 뒤 계단? 그, 그런 거 몰라!'], 600),
});
Object.assign(EXTRA_WILD, {
  PokemonTower3F: [['Gastly', 22], ['Gastly', 24], ['Cubone', 22]],
  PokemonTower4F: [['Gastly', 23], ['Haunter', 24], ['Cubone', 23]],
  PokemonTower5F: [['Gastly', 24], ['Haunter', 25], ['Cubone', 24]],
  PokemonTower6F: [['Gastly', 25], ['Haunter', 26], ['Cubone', 25]],
  PokemonTower7F: [['Gastly', 26], ['Haunter', 27], ['Cubone', 26]],
});

function ch5Goal(map) {
  const T = (text, detail, targets, dir = '') => ({ text, detail, dir, targets });
  if (!flag('scope')) {
    if (map === 'CeladonCity') return T('게임코너에 숨은 로켓단 아지트를 찾자', ['도시 가운데 아래쪽 “게임코너” 건물!', '안내 가이드에게 말을 걸어 보자.'], [[28, 19, '게임코너 문']]);
    if (map === 'GameCorner') return T('오른쪽 위 포스터 뒤 계단으로!', ['계단을 지키는 로켓단을 이기고 내려가자.'], [[17, 4, '비밀 계단']]);
    if (map === 'RocketHideoutB1F') return T('계단으로 지하 2층에 내려가자', [], [[23, 2, '지하 2층 계단']]);
    if (map === 'RocketHideoutB2F') return T('계단으로 지하 3층에 내려가자', [], [[21, 8, '지하 3층 계단']]);
    if (map === 'RocketHideoutB3F') return T('계단으로 지하 4층에 내려가자', [], [[19, 18, '지하 4층 계단']]);
    if (map === 'RocketHideoutB4F') return T('로켓단 보스를 찾아 이기자!', ['오른쪽 위 방에 보스가 있어.'], [[24, 3, '보스 앞']]);
    if (/^Celadon/.test(map)) return T('무지개시티 게임코너로!', [], null);
    return T('무지개시티 게임코너의 로켓단을 혼내 주자', ['무지개시티 가운데 아래쪽 게임코너 → 포스터 뒤 계단 → 아지트.'], null);
  }
  if (!flag('fujiSaved')) {
    if (map === 'RocketHideoutB4F') return T('아지트를 나가 보라타운 포켓몬타워로', ['왔던 계단으로 올라가자.'], [[19, 10, '계단']]);
    if (map === 'RocketHideoutB3F') return T('계단으로 올라가자', [], [[25, 6, '계단']]);
    if (map === 'RocketHideoutB2F') return T('계단으로 올라가자', [], [[27, 8, '계단']]);
    if (map === 'RocketHideoutB1F') return T('계단으로 게임코너에 올라가자', [], [[21, 2, '게임코너']]);
    if (map === 'LavenderTown') return T('포켓몬타워로 들어가자', ['보라타운 오른쪽 위 높은 탑!', '실프스코프가 유령의 정체를 보여 줄 거야.'], [[14, 5, '포켓몬타워 문']]);
    if (map === 'PokemonTower1F') return T('계단으로 2층에', [], [[18, 9, '계단']]);
    if (map === 'PokemonTower2F') return flag('rival4') ? T('계단으로 3층에', [], [[3, 9, '계단']]) : T('2층을 둘러보자', ['누군가 있는 것 같아…'], [[14, 6, '사람 앞']]);
    if (map === 'PokemonTower3F' || map === 'PokemonTower5F') return T('계단으로 위층에', ['무당 트레이너들을 이기며 올라가자.', map === 'PokemonTower5F' ? '가운데 무당 아주머니 옆은 포켓몬을 회복시켜 주는 곳이야!' : ''].filter(Boolean), [[18, 9, '계단']]);
    if (map === 'PokemonTower4F') return T('계단으로 위층에', ['무당 트레이너들을 이기며 올라가자.'], [[3, 9, '계단']]);
    if (map === 'PokemonTower6F') return T('아래쪽 7층 계단으로!', [flag('marowak') ? '유령은 편히 잠들었어.' : '계단 앞에 무언가가 있는 것 같아…'], [[9, 16, '7층 계단']]);
    if (map === 'PokemonTower7F') return T('후지 노인을 구하자!', ['로켓단을 이기고 맨 위로!'], [[10, 4, '후지 노인 앞']]);
    if (/^Lavender/.test(map)) return T('포켓몬타워로!', [], null);
    return T('보라타운 포켓몬타워로 가자', [F.hasHM('fly') ? '💡 메뉴(☰) → 🕊 날아가기 → 보라타운이 제일 빨라!' : '무지개시티 동쪽 7번도로 → 지하통로 → 8번도로 → 보라타운.'], null);
  }
  if (map === 'MrFujisHouse') return T('후지 노인께 말을 걸자', [], [[3, 2, '후지 노인 앞']]);
  return T('보라타운 후지 노인의 집으로', [], map === 'LavenderTown' ? [[7, 9, '후지 노인의 집']] : null);
}


/* ════════════════ 6판: 12~15번도로 · 연분홍시티 독수 · 사파리존(파도타기·괴력) ════════════════ */
/** 지도 가장자리에서 걸을 수 있는 칸들 (도로 끝 → 다음 지도 안내용) */
function edge(map, side, label) {
  const m = DB.maps[map]; if (!m) return null;
  const cells = side === 'north' ? [...Array(m.w).keys()].map((x) => [x, 0]) : side === 'south' ? [...Array(m.w).keys()].map((x) => [x, m.h - 1])
    : side === 'west' ? [...Array(m.h).keys()].map((y) => [0, y]) : [...Array(m.h).keys()].map((y) => [m.w - 1, y]);
  return cells.filter(([x, y]) => '.,"*_'.includes(m.grid[y][x])).map(([x, y]) => [x, y, label]);
}
async function snorlaxRoute12(o) {
  if (flag('snorlax12')) return;
  if (!itemCount(73)) return say(['커다란 포켓몬이 길 한가운데서 쿨쿨 자고 있다…', '아무리 흔들어도 일어나지 않는다!', '💡 보라타운의 후지 노인을 도우면 잠든 포켓몬을 깨우는 피리를 받을 수 있대.']);
  const yes = await ask('커다란 포켓몬이 자고 있다. 포켓몬피리를 불어 볼까?');
  if (!yes) return;
  sfx('item');
  await say(['♪ 삐리리~ 삐리리리~', '잠만보가 눈을 번쩍 떴다! 잠을 깨워서 화가 난 것 같다!']);
  await W.wildBattle({ encounterRate: 0, mons: [{ species: 'Snorlax', level: 30 }] });
  setFlag('snorlax12');
  if (o) W.scene.removeNpc(o);
  await say(['잠만보는 어디론가 사라졌다… 이제 길이 열렸어!', '💡 잠만보는 하루에 아주 많이 먹고 많이 자는 포켓몬이래.']);
  W.updateGoal?.(); save();
}
async function kogaBattle() {
  if (flag('badge5')) return say(['핑크배지는 독처럼 숨은 원리까지 꿰뚫어 본 증거다.', '다음 체육관도 방심하지 마라.'], { who: '독수', face: 'koga' });
  await say(['후후후… 나는 연분홍시티 체육관 관장, 독수.', '독은 아주 적은 양으로도 몸속 물질의 균형을 깨뜨리지. 그래서 무서운 거다.', '숨은 원리를 읽어 내는 트레이너만 나를 이긴다. 문제를 잘 읽어라!'], { who: '독수', face: 'koga' });
  const res = await W.trainerBattle({ cls: 'Koga', set: 0, name: '독수', face: 'koga', intro: '관장 독수가 승부를 걸어 왔다!', story: true, gym: true, lose: '…훌륭하다. 내가 졌다.', money: 4000, music: 'gym' });
  if (res !== 'win') return;
  await say(['이 핑크배지를 받아라.'], { who: '독수', face: 'koga' });
  setFlag('badge5'); G.s.badges.push('soul'); onBadge(); sfx('badge');
  await say([`${josa(P(), '은/는')} 핑크배지를 받았다!`, '(문제가 한 단계 더 어려워진다!)', '💡 이제 “파도타기”를 쓸 수 있어! 사파리존 깊은 곳 비밀의 집에 파도타기 비전머신이 있대.']);
  save();
  await maybeEndCh6();
}
async function secretHouseSurf() {
  if (F.hasHM('surf')) return say(['파도타기는 포켓몬 등에 타고 물 위를 가는 기술이야.', '물에 뜨는 건 부력 덕분이지!'], { who: '할아버지', face: 'fisher' });
  await say(['오오! 사파리존 깊은 곳까지 찾아오다니 대단하구나!', '상으로 이 비전머신을 주마. 물 위를 건너는 “파도타기”란다!'], { who: '할아버지', face: 'fisher' });
  addItem(F.HM.surf, 1); sfx('item');
  await say([`${josa(P(), '은/는')} 비전머신03 “파도타기”를 받았다!`, flag('badge5') ? '💡 핑크배지가 있으니 물 앞에서 A 버튼 → “예”로 물 위를 건널 수 있어!' : '💡 연분홍시티 체육관의 핑크배지를 받으면 쓸 수 있어!']);
  save(); await maybeEndCh6();
}
async function wardenStrength() {
  if (F.hasHM('strength')) return say(['괴력이 있으면 큰 바위도 밀 수 있지. 지렛대처럼 힘을 잘 쓰는 게 요령이란다!'], { who: '관리인', face: 'oldman' });
  if (!itemCount(64)) return say(['으브브… 브브브…', '(관리인 할아버지가 틀니를 잃어버려서 말을 잘 못 하신다…)', '💡 사파리존 서쪽 구역 어딘가에 금니가 떨어져 있대!'], { who: '관리인', face: 'oldman' });
  await say(['으브브… 오! 그건 내 금니잖아! 찾아 줘서 고맙구나!', '…이제 말이 잘 나오는구먼! 답례로 이 비전머신을 주마. 바위를 미는 “괴력”이지!'], { who: '관리인', face: 'oldman' });
  addItem(64, -1); addItem(F.HM.strength, 1); sfx('item');
  await say([`${josa(P(), '은/는')} 비전머신04 “괴력”을 받았다!`, '💡 무지개배지가 있으니, 바위 앞에서 A → “예” 하고 바위 쪽으로 걸으면 밀 수 있어!']);
  save(); await maybeEndCh6();
}
async function maybeEndCh6() {
  if (!flag('badge5') || !F.hasHM('surf') || !F.hasHM('strength') || flag('ch6End')) return;
  setFlag('ch6End'); save();
  await W.chapterEnd?.(6, ['축하해! 🎉 핑크배지에 파도타기·괴력까지 모았구나!', '다음 모험은 노랑시티! 로켓단이 실프주식회사를 점령했대.', '그동안 도감을 채우고, 문제를 더 풀어서 포켓몬을 키워 보자!']);
}

Object.assign(LINES, {
  'Route12:0': (o) => snorlaxRoute12(o),
  'Route12Gate1F:0': () => say(['이 관문 북쪽은 보라타운, 남쪽은 “조용한 다리”야.', '다리 위에서는 낚시꾼들이 조용히 낚시를 한단다.'], { who: '경비원', face: 'clerk' }),
  'Route15Gate1F:0': () => say(['서쪽으로 가면 연분홍시티야. 사파리존이 유명하지!'], { who: '경비원', face: 'clerk' }),
  'FuchsiaCity:0': () => say(['사파리존에는 다른 곳에서 못 보는 포켓몬이 많아!']),
  'FuchsiaCity:1': () => say(['독수 관장님은 닌자의 후예래. 체육관에는 보이지 않는 벽이 있다던데…'], { who: '게임왕', face: 'gambler' }),
  'FuchsiaCity:2': () => say(['사파리존 관리인 할아버지가 금니를 잃어버려서 말을 못 하신대.'], { who: '낚시꾼', face: 'fisher' }),
  'FuchsiaCity:3': () => say(['연분홍시티 남쪽은 바다야. 파도타기가 있으면 건널 수 있지!']),
  'FuchsiaCity:4': () => say(['삐삐!'], { who: '삐삐' }),
  'FuchsiaCity:6': () => say(['캥카는 새끼를 배 주머니에 넣고 다녀!']),
  'FuchsiaCity:7': () => say(['럭키는 아주 다정한 포켓몬이야.']),
  'FuchsiaCity:8': () => say(['쥬쥬는 차가운 바다에서도 잘 지내. 두꺼운 지방층 덕분이지!']),
  'FuchsiaPokecenter:0': nurse,
  'FuchsiaPokecenter:1': () => say(['독에 걸리면 걸을 때마다 HP가 줄어! 해독제나 만병통치제를 챙겨.']),
  'FuchsiaPokecenter:2': () => say(['사파리존 깊숙한 곳에 비밀의 집이 있대!'], { who: '엘리트트레이너', face: 'coolf' }),
  'FuchsiaPokecenter:3': () => say(['통신 교환 서비스는 지금 준비 중이에요.'], { who: '안내원', face: 'nurse' }),
  'FuchsiaMart:0': clerk,
  'FuchsiaMart:1': () => say(['하이퍼볼은 정말 잘 잡혀. 비싸지만!']),
  'FuchsiaMart:2': () => say(['실버스프레이는 200걸음 동안 야생 포켓몬을 막아 줘.'], { who: '엘리트트레이너', face: 'coolf' }),
  'FuchsiaGym:0': () => kogaBattle(),
  'FuchsiaGym:7': () => say(['어이, 챔피언 지망생!', '독수 관장은 독 포켓몬을 써. 에스퍼·땅 기술이 효과 굉장하지!', '그리고 이 체육관엔 투명한 벽이 있어… 여기선 잘 보이게 해 뒀으니 걱정 마!'], { who: '가이드', face: 'guide' }),
  'WardensHouse:0': () => wardenStrength(),
  'SafariZoneGate:0': () => say(['사파리존에 오신 걸 환영해요! 어린이 트레이너는 입장 무료예요.', '안쪽 서쪽 구역 깊은 곳에 비밀의 집이 있다는 소문이 있어요.'], { who: '사파리 직원', face: 'clerk' }),
  'SafariZoneGate:1': () => say(['사파리존에서는 평소처럼 몬스터볼로 포켓몬을 잡을 수 있어요!'], { who: '사파리 직원', face: 'clerk' }),
  'SafariZoneSecretHouse:0': () => secretHouseSurf(),
  'SafariZoneCenterRestHouse:0': () => say(['서쪽 구역 가는 길은 왼쪽 출입구야!'], { who: '소녀', face: 'girl' }),
  'SafariZoneCenterRestHouse:1': () => say(['사파리존의 포켓몬은 다른 곳보다 쉽게 도망가니 조심해!'], { who: '과학자', face: 'scientist' }),
  'SafariZoneWestRestHouse:0': () => say(['비밀의 집은 서쪽 구역 왼쪽 위에 있어!'], { who: '과학자', face: 'scientist' }),
  'SafariZoneWestRestHouse:1': () => say(['코뿔소처럼 생긴 뿔카노는 땅 타입이야.']),
  'SafariZoneWestRestHouse:2': () => say(['여기서 쉬었다 가세요!'], { who: '직원', face: 'coolf' }),
});
Object.assign(TRAINER, {
  'FuchsiaGym:1': T2('저글러', '독수 관장님께는 못 간다!', ['졌다!', '저글링은 공을 던지는 높이와 박자를 맞추는 수학이야!'], 900),
  'FuchsiaGym:2': T2('저글러', '보이지 않는 벽을 찾아봐!', ['졌다…'], 900),
  'FuchsiaGym:3': T2('저글러', '독 포켓몬의 무서움을 보여 주지!', ['졌다!', '해독제는 몸속 독을 중화시켜 줘.'], 900),
  'FuchsiaGym:4': T2('조련사', '내 포켓몬은 잘 훈련됐다고!', ['졌다!'], 1000),
  'FuchsiaGym:5': T2('조련사', '마지막 관문이다!', ['졌다! 독수 관장님은 저 안쪽이야.'], 1000),
  'FuchsiaGym:6': T2('저글러', '하나, 둘, 셋! 승부!', ['졌다!'], 900),
});
Object.assign(SIGNS, {
  'Route12:1': ['12번도로', '조용한 다리 — 낚시 중이니 조용히!'],
  'FuchsiaCity:1': ['연분홍시티', '사파리존과 바다의 도시'],
  'FuchsiaGym:1': () => [flag('badge5') ? `연분홍시티 체육관 — 우승 트레이너: ${P()}` : '연분홍시티 체육관 — 우승 트레이너: …'],
  'FuchsiaGym:2': () => [flag('badge5') ? `연분홍시티 체육관 — 우승 트레이너: ${P()}` : '연분홍시티 체육관 — 우승 트레이너: …'],
});
Object.assign(EXTRA_WILD, { // 12번도로는 섞지 않는다 (피리로 깨운 잠만보가 반드시 나오게)
  Route13: [['Oddish', 24], ['Bellsprout', 24], ['Venonat', 24], ['Pidgeotto', 25], ['Ditto', 24]],
  Route14: [['Oddish', 25], ['Bellsprout', 25], ['Venonat', 25], ['Pidgeotto', 26], ['Ditto', 25]],
  Route15: [['Oddish', 26], ['Bellsprout', 26], ['Venonat', 26], ['Pidgeotto', 27], ['Ditto', 26]],
  SafariZoneCenter: [['Nidorino', 24], ['Nidorina', 24], ['Exeggcute', 24], ['Rhyhorn', 25], ['Venonat', 23], ['Parasect', 25], ['Scyther', 26], ['Chansey', 26]],
  SafariZoneWest: [['Nidorino', 25], ['Nidorina', 25], ['Exeggcute', 25], ['Tauros', 26], ['Kangaskhan', 26], ['Pinsir', 26]],
});

function ch6Goal(map) {
  const T = (text, detail, targets, dir = '') => ({ text, detail, dir, targets });
  if (!flag('snorlax12')) {
    if (map === 'LavenderTown') return T('보라타운 남쪽 12번도로로', ['아래쪽(남쪽) 길로!'], edge(map, 'south', '12번도로'), '↓ 남쪽');
    if (map === 'Route12Gate1F') return T('관문을 지나 남쪽으로', [], [[4, 7, '남쪽 출구'], [5, 7, '']]);
    if (map === 'Route12') return T('길을 막고 자는 포켓몬을 깨우자', ['포켓몬 앞에서 A → 포켓몬피리!'], [[10, 61, '잠만보 앞']]);
    if (/^Lavender|^MrFuji/.test(map)) return T('보라타운 남쪽 12번도로로', [], null);
    return T('보라타운 남쪽 12번도로의 잠만보를 깨우자', [F.hasHM('fly') ? '💡 메뉴(☰) → 🕊 날아가기 → 보라타운' : '보라타운에서 남쪽으로!'], null);
  }
  if (!flag('badge5')) {
    if (map === 'Route12Gate1F') return T('관문을 지나 남쪽으로', [], [[4, 7, '남쪽 출구'], [5, 7, '']]);
    if (map === 'LavenderTown') return T('남쪽 12번도로로', [], edge(map, 'south', '12번도로'), '↓ 남쪽');
    if (map === 'Route12') return T('남쪽으로 쭉! 13번도로로', ['조용한 다리를 지나 아래로!'], edge(map, 'south', '13번도로'), '↓ 남쪽');
    if (map === 'Route13') return T('서쪽 14번도로로', [], edge(map, 'west', '14번도로'), '← 서쪽');
    if (map === 'Route14') return T('아래로 내려가 서쪽 15번도로로', [], edge(map, 'west', '15번도로'), '↓ 그다음 ←');
    if (map === 'Route15') return G.s.x > 14 ? T('서쪽 관문 건물을 지나 연분홍시티로!', ['길 가운데 작은 건물을 통과하자.'], [[14, 8, '관문'], [14, 9, '관문']], '← 서쪽') : T('서쪽으로 가면 연분홍시티!', [], edge(map, 'west', '연분홍시티'), '← 서쪽');
    if (map === 'Route15Gate1F') return T('관문을 지나 서쪽으로', [], [[0, 4, '서쪽 출구'], [0, 5, '']]);
    if (map === 'FuchsiaCity') return T('연분홍시티 체육관에서 관장 독수를 이기자', ['왼쪽 아래 체육관!', '독 포켓몬에게는 에스퍼·땅 기술이 효과 굉장!'], [[5, 27, '체육관 문']]);
    if (map === 'FuchsiaGym') return T('관장 독수에게 말을 걸자', ['트레이너들을 이기며 가운데로!'], [[4, 11, '독수 앞']]);
    if (/^Fuchsia/.test(map)) return T('연분홍시티 체육관으로!', [], null);
    return T('남쪽 바닷길을 따라 연분홍시티로', ['12번도로 → 13번도로 → 14번도로 → 15번도로 → 연분홍시티.'], null);
  }
  const needSafari = !F.hasHM('surf') || (!F.hasHM('strength') && !itemCount(64));
  if (needSafari) {
    if (map === 'FuchsiaCity') return T('위쪽 사파리존으로!', [!F.hasHM('surf') ? '사파리존 서쪽 구역 깊은 곳 비밀의 집에 파도타기가 있대.' : '사파리존 서쪽 구역에서 관리인 할아버지의 금니를 찾자.'], [[18, 3, '사파리존 입구']]);
    if (map === 'SafariZoneGate') return T('사파리존 안으로!', [], [[3, 0, '사파리존'], [4, 0, '']]);
    if (map === 'SafariZoneCenter') return T('왼쪽 출입구로 서쪽 구역에', [], [[0, 10, '서쪽 구역'], [0, 11, '']]);
    if (map === 'SafariZoneWest') return !F.hasHM('surf') ? T('왼쪽 위 비밀의 집으로!', [], [[3, 3, '비밀의 집']]) : T('금니를 찾자!', ['반짝이는 공 안에 들어 있대.'], [[19, 7, '금니']]);
    if (map === 'SafariZoneSecretHouse') return T('할아버지께 말을 걸자', [], [[3, 4, '할아버지 앞']]);
    return T('연분홍시티 사파리존으로', [], null);
  }
  if (!F.hasHM('strength')) {
    if (map === 'SafariZoneWest') return T('사파리존을 나가 관리인 할아버지께', [], [[29, 22, '가운데 구역'], [29, 23, '']]);
    if (map === 'SafariZoneCenter') return T('입구로 나가자', [], [[14, 25, '입구'], [15, 25, '']]);
    if (map === 'SafariZoneGate') return T('연분홍시티로 나가자', [], [[3, 5, '출구'], [4, 5, '']]);
    if (map === 'FuchsiaCity') return T('관리인 할아버지께 금니를 돌려드리자', ['아래쪽 가운데 집!'], [[27, 27, '관리인의 집']]);
    if (map === 'WardensHouse') return T('관리인 할아버지께 말을 걸자', [], [[2, 4, '관리인 앞']]);
    return T('연분홍시티 관리인의 집으로', [], null);
  }
  return null; // 6판 끝 → 7판
}


/* ════════════════ 7판: 노랑시티 · 실프주식회사 · 초련 ════════════════ */
const SILPH_FLOORS = [['SilphCo1F', 20, '1층 (입구)'], ['SilphCo5F', 20, '5층'], ['SilphCo7F', 18, '7층'], ['SilphCo11F', 13, '11층 (사장실)']];
async function silphElevator() {
  W.busy = true;
  try {
    const hint = !flag('rival5') ? '💡 7층에 누군가 있대!' : !flag('silphFreed') ? '💡 7층 왼쪽 발판을 타면 11층 사장실로 가!' : '💡 1층으로 내려가서 나가자.';
    const box = await say(['엘리베이터다. 몇 층으로 갈까?', hint], { keep: true });
    const fl = await choose(SILPH_FLOORS.map(([id, , label]) => ({ label, value: id })), { cancel: false });
    box.remove();
    const [id, x] = SILPH_FLOORS.find((f) => f[0] === fl);
    sfx('door');
    await fade(true, 180);
    await W.scene.loadMap(id, x, 1, 'down', { quiet: true });
    save();
    await fade(false, 180);
  } finally { W.busy = false; }
}
async function rivalSilph() {
  const S = W.scene;
  W.busy = true;
  try {
    const rv = S.npcBy?.((x) => x.idx === 8);
    if (rv) S.faceNpcToPlayer(rv);
    await sayAs('rival', [`${P()}! 너도 로켓단을 쫓아왔구나.`, '내 이브이는 물의돌로 샤미드가 됐어! 엄청 강해졌다고. 보여 줄게!']);
    const res = await W.trainerBattle({ party: [[18, 37], [20, 35], [65, 35], [134, 40]], name: R(), face: 'rival', intro: `라이벌 ${josa(R(), '이/가')} 승부를 걸어 왔다!`, lose: '크윽… 샤미드까지 졌다고?', win: '헤헤, 역시 내가 최고야!', money: 2800 });
    setFlag('rival5');
    if (res !== 'win') return;
    await sayAs('rival', ['쳇… 인정할게. 로켓단 보스는 맨 위 사장실에 있대.', '왼쪽 발판을 타면 바로 갈 수 있을 거야. 난 다음에 더 강해져서 올 거다!']);
    if (rv) S.removeNpc(rv);
    save();
  } finally { W.busy = false; }
}
async function laprasGift() {
  if (flag('lapras')) return say(['라프라스는 사람을 등에 태우고 바다를 건너는 착한 포켓몬이야.', '파도타기를 가르치면 든든한 친구가 될 거야!'], { who: '실프 직원', face: 'nerd' });
  await say(['로켓단 때문에 숨어 있었어… 와 줘서 고마워!', '이 아이를 데려가 줘. 로켓단이 노리던 라프라스야. 너라면 소중히 해 줄 거야.'], { who: '실프 직원', face: 'nerd' });
  const where = receive(makeMon(131, 15)); setFlag('lapras'); sfx('item');
  await say([`${josa(P(), '은/는')} 라프라스를 받았다!${where === 'box' ? ' (보관함으로 보냈다)' : ''}`]);
  save();
}
async function giovanniSilph() {
  if (flag('silphFreed')) return;
  await say(['또 너냐! 이번엔 실프주식회사를 손에 넣는 중이었는데…', '마스터볼을 만드는 이 회사만 있으면 세상 포켓몬을 다 가질 수 있지!', '방해하는 꼬마는 이번에야말로 혼내 주겠다!'], { who: '비주기', face: 'giovanni' });
  const res = await W.trainerBattle({ cls: 'Giovanni', set: 1, name: '비주기', face: 'giovanni', intro: '로켓단 보스 비주기가 승부를 걸어 왔다!', story: true, lose: '…또 지다니. 이번엔 물러나 주지.', money: 4500 });
  if (res !== 'win') return;
  await say(['흥… 오늘은 철수다. 하지만 언젠가 다시 만나게 될 거다.'], { who: '비주기', face: 'giovanni' });
  setFlag('silphFreed');
  const g = W.scene.npcBy?.((x) => x.kind === 'giovanni'); if (g) W.scene.removeNpc(g);
  W.updateGoal?.(); save();
}
async function silphPresident() {
  if (!flag('silphFreed')) return say(['으으… 로켓단이…'], { who: '사장님', face: 'gambler' });
  if (flag('masterBall')) return say(['고맙네, 꼬마 영웅! 우리 회사는 다시 평화를 찾았네.'], { who: '사장님', face: 'gambler' });
  await say(['자네가 로켓단을 쫓아냈다니! 정말 고맙네.', '감사의 표시로 우리 회사의 최고 발명품을 주지. 무엇이든 반드시 잡히는 공이라네!'], { who: '사장님', face: 'gambler' });
  addItem(1, 1); setFlag('masterBall'); sfx('item');
  await say([`${josa(P(), '은/는')} 마스터볼을 받았다!`, '💡 정말 갖고 싶은 포켓몬을 만났을 때 아껴서 쓰자!']);
  save();
}
async function sabrinaBattle() {
  if (flag('badge6')) return say(['골드배지… 네 마음의 힘을 보았다.', '생각은 뇌 속 신경 세포들이 신호를 주고받으며 만들어진단다.'], { who: '초련', face: 'sabrina' });
  await say(['…네가 올 것을 알고 있었다. 나는 노랑시티 체육관 관장, 초련.', '에스퍼 포켓몬은 생각의 힘으로 싸우지. 우리의 생각은 뇌 속 신경 세포의 아주 작은 전기 신호란다.', '흔들리지 않는 마음으로 문제를 풀어 보아라.'], { who: '초련', face: 'sabrina' });
  const res = await W.trainerBattle({ cls: 'Sabrina', set: 0, name: '초련', face: 'sabrina', intro: '관장 초련이 승부를 걸어 왔다!', story: true, gym: true, lose: '…네 힘을 예측하지 못했다. 내가 졌다.', money: 4300, music: 'gym' });
  if (res !== 'win') return;
  await say(['이 골드배지를 받아라.'], { who: '초련', face: 'sabrina' });
  setFlag('badge6'); G.s.badges.push('marsh'); onBadge(); sfx('badge');
  await say([`${josa(P(), '은/는')} 골드배지를 받았다!`, '(문제가 한 단계 더 어려워진다! 배지 6개, 이제 두 개 남았어!)']);
  save();
  await W.chapterEnd?.(7, ['축하해! 🎉 실프주식회사를 구하고 골드배지까지 땄구나!', '다음 모험은 바다 건너 홍련마을! 태초마을 남쪽 바다를 파도타기로 건너 보자.', '그동안 도감을 채우고, 문제를 더 풀어서 포켓몬을 키워 보자!']);
}
async function gateGuard(map) {
  if (flag('badge5')) return say(['로켓단이 노랑시티를 점령해서 조심해야 해!', '…하지만 배지를 다섯 개나 가진 트레이너라면 믿을 수 있지. 지나가도 좋아!'], { who: '경비원', face: 'clerk' });
  return say(['로켓단 때문에 노랑시티는 위험해! 아무도 못 지나가!'], { who: '경비원', face: 'clerk' });
}

Object.assign(LINES, {
  'Route5Gate:0': () => gateGuard(), 'Route6Gate:0': () => gateGuard(), 'Route7Gate:0': () => gateGuard(), 'Route8Gate:0': () => gateGuard(),
  'SaffronCity:0': () => say(['로켓단 말고는 아무도 못 들어가!'], { who: '로켓단', face: 'rocket' }),
  'SaffronCity:1': () => say(['실프주식회사는 우리 로켓단 차지다!'], { who: '로켓단', face: 'rocket' }),
  'SaffronCity:2': () => say(['체육관? 관장이 우리 보스를 무서워해서 숨었다지, 크크.'], { who: '로켓단', face: 'rocket' }),
  'SaffronCity:3': () => say(['시끄러워! 저리 가!'], { who: '로켓단', face: 'rocket' }),
  'SaffronCity:4': () => say(['우리 보스는 마스터볼을 노리고 있지.'], { who: '로켓단', face: 'rocket' }),
  'SaffronCity:5': () => say(['…'], { who: '로켓단', face: 'rocket' }),
  'SaffronCity:6': () => say(['이 도시는 이제 로켓단 거다!'], { who: '로켓단', face: 'rocket' }),
  'SaffronCity:7': () => say(['실프주식회사는 포켓몬 도구를 만드는 큰 회사야. 몬스터볼도 거기서 만들지!'], { who: '과학자', face: 'scientist' }),
  'SaffronCity:8': () => say(['로켓단에게 쫓겨났어요… 회사에 동료들이 갇혀 있어요!'], { who: '실프 직원', face: 'nerd' }),
  'SaffronCity:9': () => say(['노랑시티는 칸토 지방 한가운데에 있는 큰 도시야.'], { who: '실프 직원', face: 'coolf' }),
  'SaffronCity:10': () => say(['내 피죤은 어디든 편지를 배달해 준단다. 새는 지구의 자기장을 느껴 길을 찾는대!'], { who: '신사', face: 'gambler' }),
  'SaffronCity:11': () => say(['구구!'], { who: '피죤' }),
  'SaffronCity:12': () => say(['격투 도장은 체육관 옆에 있어. 다음에 가 볼래?']),
  'SaffronPokecenter:0': nurse,
  'SaffronPokecenter:1': () => say(['초련 관장님은 생각만으로 숟가락을 구부린대!'], { who: '아가씨', face: 'beauty' }),
  'SaffronPokecenter:2': () => say(['에스퍼 포켓몬에게는 벌레·고스트 기술이 잘 들어.'], { who: '신사', face: 'gambler' }),
  'SaffronPokecenter:3': () => say(['통신 교환 서비스는 지금 준비 중이에요.'], { who: '안내원', face: 'nurse' }),
  'SaffronMart:0': clerk,
  'SaffronMart:1': () => say(['하이퍼볼과 고급상처약은 후반 모험의 필수품이지!'], { who: '괴짜박사', face: 'nerd' }),
  'SaffronMart:2': () => say(['만병통치제 하나면 어떤 상태 이상도 낫는대!'], { who: '엘리트트레이너', face: 'coolf' }),
  'SilphCo1F:0': () => say(flag('silphFreed') ? ['실프주식회사에 오신 걸 환영합니다! 덕분에 회사가 평화를 찾았어요.'] : ['…로켓단이 회사를 점령했어요! 엘리베이터로 위층에 가 보세요.'], { who: '안내원', face: 'nurse' }),
  'SilphCo5F:0': () => say(['로켓단이 우리 연구실을 뒤졌어요… 마스터볼 설계도를 찾는대요!'], { who: '실프 직원', face: 'nerd' }),
  'SilphCo7F:0': () => laprasGift(),
  'SilphCo7F:1': () => say(['살려 줘서 고마워!'], { who: '실프 직원', face: 'nerd' }),
  'SilphCo7F:2': () => say(['몬스터볼 안에서 포켓몬은 편히 쉰대.'], { who: '실프 직원', face: 'nerd' }),
  'SilphCo7F:3': () => say(['사장님이 11층에 갇혀 계세요!'], { who: '실프 직원', face: 'coolf' }),
  'SilphCo7F:8': () => (flag('rival5') ? null : rivalSilph()),
  'SilphCo11F:0': () => silphPresident(),
  'SilphCo11F:1': () => say(['사장님을 구해 주세요!'], { who: '비서', face: 'beauty' }),
  'SilphCo11F:2': () => giovanniSilph(),
  'SaffronGym:0': () => sabrinaBattle(),
  'SaffronGym:8': () => say(['어이, 챔피언 지망생!', '초련 관장은 에스퍼 포켓몬을 써. 벌레·고스트 기술이 효과 굉장하지!', '이 체육관은 순간이동 발판으로 된 미로야. 화면 위 안내 화살표를 따라가 봐!'], { who: '가이드', face: 'guide' }),
});
Object.assign(SIGNS, {
  'SaffronCity:1': ['노랑시티', '빛나는 황금빛 대도시'], 'SaffronCity:2': ['실프주식회사', '몬스터볼을 만드는 회사'],
  'SaffronGym:1': () => [flag('badge6') ? `노랑시티 체육관 — 우승 트레이너: ${P()}` : '노랑시티 체육관 — 우승 트레이너: …'],
});
for (const k of ['SaffronGym:1', 'SaffronGym:3', 'SaffronGym:5']) TRAINER[k] = T2('무당', '초련 님의 힘이 느껴지는가…', ['졌다…', '마음이 차분하면 생각도 맑아진단다.'], 1000);
for (const k of ['SaffronGym:2', 'SaffronGym:4', 'SaffronGym:6', 'SaffronGym:7']) TRAINER[k] = T2('초능력자', '네 다음 수가 보인다!', ['…예측이 틀렸다!', '숟가락이 휘어 보이는 건 물속 빛이 꺾이기 때문이기도 해!'], 1000);

function ch7Goal(map) {
  const T = (text, detail, targets, dir = '') => ({ text, detail, dir, targets });
  if (!flag('silphFreed')) {
    if (map === 'Route7') return G.s.x < 11 ? T('동쪽 관문을 지나 노랑시티로', [], [[11, 9, '관문'], [11, 10, '관문']], '→ 동쪽') : T('동쪽으로 가면 노랑시티!', [], edge(map, 'east', '노랑시티'), '→ 동쪽');
    if (map === 'Route8') return G.s.x > 8 ? T('서쪽 관문을 지나 노랑시티로', [], [[8, 9, '관문'], [8, 10, '관문']], '← 서쪽') : T('서쪽으로 가면 노랑시티!', [], edge(map, 'west', '노랑시티'), '← 서쪽');
    if (map === 'Route7Gate') return T('관문을 지나 동쪽으로', ['경비원에게 말을 걸어 보자.'], [[5, 3, '출구'], [5, 4, '']]);
    if (map === 'Route8Gate') return T('관문을 지나 서쪽으로', ['경비원에게 말을 걸어 보자.'], [[0, 3, '출구'], [0, 4, '']]);
    if (map === 'Route5Gate') return T('관문을 지나 남쪽으로', [], [[3, 5, '출구'], [4, 5, '']]);
    if (map === 'Route6Gate') return T('관문을 지나 북쪽으로', [], [[3, 0, '출구'], [4, 0, '']]);
    if (map === 'SaffronCity') return T('가운데 큰 건물, 실프주식회사로!', ['로켓단이 회사를 점령했대!'], [[18, 21, '실프주식회사']]);
    if (map === 'SilphCo1F') return T('엘리베이터로 위층에!', ['위쪽 가운데 엘리베이터 → 7층.'], [[20, 0, '엘리베이터']]);
    if (map === 'SilphCo5F') return T('엘리베이터로 7층에!', [], [[20, 0, '엘리베이터']]);
    if (map === 'SilphCo7F') return flag('rival5') ? T('왼쪽 발판을 타고 11층 사장실로!', ['💡 라프라스를 주는 직원도 있어!'], [[5, 7, '11층 발판']]) : T('7층 왼쪽 방으로 가 보자', ['누군가 있어…'], [[4, 7, '사람 앞']]);
    if (map === 'SilphCo11F') return T('로켓단 보스를 이기자!', [], [[6, 10, '보스 앞']]);
    return T('노랑시티의 실프주식회사를 구하자', ['무지개시티 동쪽 7번도로나 보라타운 서쪽 8번도로의 관문을 지나 노랑시티로!', F.hasHM('fly') ? '💡 날아가기로 무지개시티·보라타운까지 가면 빨라.' : ''].filter(Boolean), null);
  }
  if (!flag('badge6')) {
    if (map === 'SilphCo11F') return T(flag('masterBall') ? '엘리베이터로 1층에 내려가자' : '사장님께 말을 걸자', [], flag('masterBall') ? [[13, 0, '엘리베이터']] : [[7, 6, '사장님 앞']]);
    if (/^SilphCo/.test(map)) return T('엘리베이터로 1층에 내려가 밖으로', [], map === 'SilphCo1F' ? [[10, 17, '출구'], [11, 17, '']] : map === 'SilphCo7F' ? [[18, 0, '엘리베이터']] : [[20, 0, '엘리베이터']]);
    if (map === 'SaffronCity') return T('노랑시티 체육관에서 관장 초련을 이기자', ['오른쪽 위 체육관!', '에스퍼 포켓몬에게는 벌레·고스트 기술이 효과 굉장!'], [[34, 3, '체육관 문']]);
    if (map === 'SaffronGym') return T('순간이동 발판을 타고 초련에게!', ['화살표를 따라 발판을 밟아 보자.'], [[9, 9, '초련 앞']]);
    return T('노랑시티 체육관으로!', [], null);
  }
  return null;
}


/* ════════════════ 8판: 21번 바닷길 · 홍련마을 · 포켓몬 저택(비밀열쇠) · 강연 ════════════════ */
/** 물가: 땅과 맞닿은 물 칸 (파도타기를 시작할 곳) */
function shore(map, label, pred = () => true) {
  const m = DB.maps[map]; if (!m) return null;
  const out = [];
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    if (m.grid[y][x] !== '~' || !pred(x, y)) continue;
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => '.,"*_'.includes((m.grid[y + dy] || '')[x + dx] || '#'))) out.push([x, y, label]);
  }
  return out;
}
const edgeSurf = (map, side, label) => { // 파도타기 중이면 물 칸도 가장자리 목표로
  const m = DB.maps[map]; if (!m) return null;
  const cells = side === 'south' ? [...Array(m.w).keys()].map((x) => [x, m.h - 1]) : side === 'north' ? [...Array(m.w).keys()].map((x) => [x, 0]) : [];
  return cells.filter(([x, y]) => '.,"*~'.includes(m.grid[y][x])).map(([x, y]) => [x, y, label]);
};
async function blaineBattle() {
  if (flag('badge7')) return say(['우오오! 진홍배지는 불꽃처럼 뜨거운 네 열정의 증거다!', '불이 타려면 탈 것·산소·높은 온도 세 가지가 필요하지. 하나만 없애도 불이 꺼진다네!'], { who: '강연', face: 'blaine' });
  await say(['우오오! 나는 홍련마을 체육관 관장, 불꽃의 강연이다!', '이 섬은 화산이 만든 섬이지. 땅속 뜨거운 마그마가 솟아올라 굳은 거라네.', '불꽃처럼 뜨겁게, 하지만 머리는 차갑게! 퀴즈를 잘 풀어 보게!'], { who: '강연', face: 'blaine' });
  const res = await W.trainerBattle({ cls: 'Blaine', set: 0, name: '강연', face: 'blaine', intro: '관장 강연이 승부를 걸어 왔다!', story: true, gym: true, lose: '우오오… 내 불꽃이 꺼지다니! 졌다!', money: 4700, music: 'gym' });
  if (res !== 'win') return;
  await say(['이 진홍배지를 받게!'], { who: '강연', face: 'blaine' });
  setFlag('badge7'); G.s.badges.push('volcano'); onBadge(); sfx('badge');
  await say([`${josa(P(), '은/는')} 진홍배지를 받았다!`, '(문제가 한 단계 더 어려워진다! 배지 7개, 마지막 하나만 남았어!)']);
  save();
  await W.chapterEnd?.(8, ['축하해! 🎉 진홍배지까지 7개나 모았구나!', '마지막 배지는 상록시티 체육관에 있어. 오랫동안 닫혀 있던 그곳의 관장은…?', '그동안 도감을 채우고, 문제를 더 풀어서 포켓몬을 키워 보자!']);
}

Object.assign(LINES, {
  'Route21:0': () => say(['낚시는 기다림이야. 물고기가 미끼를 무는 순간을 놓치면 안 돼!'], { who: '낚시꾼', face: 'fisher' }),
  'CinnabarIsland:0': () => say(['홍련마을은 화산섬이야. 그래서 온천이 유명하지!'], { who: '소녀', face: 'girl' }),
  'CinnabarIsland:1': () => say(['체육관 관장 강연 할아버지는 퀴즈를 좋아해.', '체육관 문은 잠겨 있어. 열쇠는 저택 어딘가에 있다던데…'], { who: '게임왕', face: 'gambler' }),
  'CinnabarPokecenter:0': nurse,
  'CinnabarPokecenter:1': () => say(['불꽃 포켓몬에게는 물·땅·바위 기술이 효과 굉장!'], { who: '엘리트트레이너', face: 'coolf' }),
  'CinnabarPokecenter:2': () => say(['옛날 저택에서 포켓몬 연구를 했대. 일지가 아직 남아 있다던데.'], { who: '신사', face: 'gambler' }),
  'CinnabarPokecenter:3': () => say(['통신 교환 서비스는 지금 준비 중이에요.'], { who: '안내원', face: 'nurse' }),
  'CinnabarMart:0': clerk,
  'CinnabarMart:1': () => say(['풀회복약은 HP를 한 번에 다 채워 줘!'], { who: '직원', face: 'coolf' }),
  'CinnabarMart:2': () => say(['화산 근처 흙은 양분이 많아서 농사가 잘된대.'], { who: '과학자', face: 'scientist' }),
  'CinnabarGym:0': () => blaineBattle(),
  'CinnabarGym:8': () => say(['어이, 챔피언 지망생!', '강연 관장은 불꽃 포켓몬을 써. 물·땅·바위 기술이 효과 굉장하지!', '퀴즈를 좋아하는 관장이니 문제를 끝까지 읽어!'], { who: '가이드', face: 'guide' }),
});
Object.assign(SIGNS, {
  'CinnabarIsland:1': ['홍련마을', '불타는 열정의 화산섬'], 'CinnabarIsland:2': ['포켓몬 저택'], 'CinnabarIsland:3': ['홍련마을 체육관', '관장: 강연 — 불꽃의 퀴즈왕'],
  'CinnabarGym:1': () => [flag('badge7') ? `홍련마을 체육관 — 우승 트레이너: ${P()}` : '홍련마을 체육관 — 우승 트레이너: …'],
});
for (let i = 1; i <= 7; i++) TRAINER['CinnabarGym:' + i] = T2(i % 2 ? '괴짜박사' : '도둑', '강연 관장님께 가려면 나부터!', ['졌다!', ['불은 산소가 있어야 타. 그래서 덮으면 꺼지지!', '용암이 식어서 굳으면 현무암이 돼.', '불꽃의 색이 파랄수록 더 뜨거워!', '온천물은 땅속 마그마의 열로 데워진 물이야.'][i % 4]], 1100);
Object.assign(EXTRA_WILD, {
  PokemonMansion1F: [['Grimer', 32], ['Koffing', 32], ['Ponyta', 32], ['Growlithe', 32], ['Vulpix', 32]],
  PokemonMansionB1F: [['Grimer', 34], ['Muk', 35], ['Koffing', 34], ['Weezing', 35], ['Magmar', 34]],
});

function ch8Goal(map) {
  const T = (text, detail, targets, dir = '') => ({ text, detail, dir, targets });
  if (!flag('badge7')) {
    if (map === 'PalletTown') return G.s.surf ? T('남쪽으로 쭉! 홍련마을까지', [], edgeSurf(map, 'south', '21번 바닷길'), '↓ 남쪽') : T('태초마을 남쪽 바다에서 파도타기!', ['물가에서 A 버튼 → “예”!', '바다 건너 남쪽에 홍련마을이 있어.'], shore(map, '물가 — A로 파도타기', (x, y) => y >= 10), '↓ 남쪽');
    if (map === 'Route21') return T('남쪽으로 쭉! 홍련마을까지', ['물 위의 수영선수들도 승부를 걸어 와!'], G.s.surf ? edgeSurf(map, 'south', '홍련마을') : edge(map, 'south', '홍련마을'), '↓ 남쪽');
    if (map === 'CinnabarIsland') return itemCount(43) ? T('체육관에서 관장 강연을 이기자', ['오른쪽 위 체육관!', '불꽃 포켓몬에게는 물·땅·바위 기술이 효과 굉장!'], [[18, 3, '체육관 문']])
      : T('왼쪽 위 포켓몬 저택에서 체육관 열쇠를 찾자', ['체육관 문이 잠겨 있대. 열쇠는 저택 지하에 있다는 소문이야.'], [[6, 3, '포켓몬 저택']]);
    if (map === 'PokemonMansion1F') return itemCount(43) ? T('저택을 나가 체육관으로', [], [[4, 27, '출구'], [5, 27, ''], [6, 27, ''], [7, 27, '']]) : T('오른쪽 아래 계단으로 지하에!', [], [[21, 23, '지하 계단']]);
    if (map === 'PokemonMansionB1F') return itemCount(43) ? T('계단으로 올라가자', [], [[23, 22, '계단']]) : T('비밀열쇠를 찾자!', ['반짝이는 공 안에 열쇠가 들어 있대.'], [[5, 13, '비밀열쇠']]);
    if (map === 'CinnabarGym') return T('관장 강연에게 말을 걸자', ['트레이너들을 이기며 왼쪽 위로!'], [[3, 4, '강연 앞']]);
    if (/^Cinnabar/.test(map)) return T('홍련마을 체육관으로!', [], null);
    return T('바다 건너 홍련마을로!', [F.hasHM('fly') ? '💡 날아가기 → 태초마을, 그다음 남쪽 바다에서 파도타기!' : '태초마을 남쪽 바다를 파도타기로 건너자.'], null);
  }
  return null;
}


/* ════════════════ 9판·엔딩: 상록시티 비주기 → 22번도로 라이벌 → 챔피언로드 → 사천왕 → 챔피언 → 명예의 전당 ════════════════ */
const E4 = [ // 방 · 깃발 · 이름 · 얼굴 · 원작 반 · 주제 대사
  { map: 'LoreleisRoom', f: 'e4_1', name: '칸나', face: 'lorelei', cls: 'Lorelei', exit: [[4, 0], [5, 0]], at: [5, 3],
    hi: ['포켓몬 리그에 온 걸 환영해. 나는 사천왕 칸나.', '얼음은 물이 0도 아래에서 얼어 생기지. 얼음은 물보다 가벼워서 물에 뜬단다.', '차갑게 얼려 주겠어!'], lose: '…훌륭하네. 다음 방으로 가렴.' },
  { map: 'BrunosRoom', f: 'e4_2', name: '시바', face: 'bruno', cls: 'Bruno', exit: [[4, 0], [5, 0]], at: [5, 3],
    hi: ['나는 사천왕 시바! 몸과 마음을 함께 단련해 왔다!', '근육은 쓰고 쉬기를 되풀이하면서 더 굵고 강해진다. 운동 다음엔 잘 먹고 푹 자야 하지!', '우오오! 덤벼라!'], lose: '…졌다! 네 힘을 인정하마.' },
  { map: 'AgathasRoom', f: 'e4_3', name: '국화', face: 'agatha', cls: 'Agatha', exit: [[4, 0], [5, 0]], at: [5, 3],
    hi: ['오호호, 나는 사천왕 국화. 오박사와는 옛날부터 라이벌이었지.', '사람이 무서움을 느끼면 심장이 빨리 뛰고 몸이 굳는단다. 몸이 위험에 대비하는 거지.', '고스트 포켓몬의 무서움을 보여 주마!'], lose: '오호… 오박사가 너를 아끼는 이유를 알겠구나.' },
  { map: 'LancesRoom', f: 'e4_4', name: '목호', face: 'lance', cls: 'Lance', exit: [[5, 0], [6, 0]], at: [6, 2],
    hi: ['기다리고 있었다. 나는 사천왕의 대장, 드래곤 조련사 목호.', '드래곤은 전설 속 동물이지만, 공룡은 진짜로 살았던 동물이야. 화석이 그 증거지.', '마지막 사천왕의 힘, 받아 보아라!'], lose: '…내가 졌다. 챔피언이 기다리고 있다. 가라!' },
];
const E4_BY = Object.fromEntries(E4.map((e) => [e.map, e]));
async function e4Battle(e) {
  if (flag(e.f)) return say(['다음 방으로 가렴. 앞으로!'], { who: e.name, face: e.face });
  W.busy = true;
  try {
    await say(e.hi, { who: e.name, face: e.face });
    const res = await W.trainerBattle({ cls: e.cls, set: 0, name: e.name, face: e.face, intro: `사천왕 ${josa(e.name, '이/가')} 승부를 걸어 왔다!`, story: true, gym: true, lose: e.lose, money: 6000, music: 'gym' });
    if (res !== 'win') return;
    setFlag(e.f); W.updateGoal?.(); save();
    await say(['(위쪽 문이 열렸다!)']);
  } finally { W.busy = false; }
}
async function giovanniGym() {
  if (flag('badge8')) return say(['…로켓단은 오늘로 해산이다.', '땅속 지층은 아래에 있을수록 오래전에 쌓인 거다. 너는 그 위에 새 이야기를 쌓아라.'], { who: '비주기', face: 'giovanni' });
  await say(['…여기까지 왔나. 그래, 이 체육관의 관장은 바로 나, 비주기다!', '내 포켓몬은 땅 타입. 땅은 오랜 세월 흙과 모래가 차곡차곡 쌓여 굳은 지층으로 되어 있지.', '로켓단 보스의 진짜 힘을 보여 주겠다!'], { who: '비주기', face: 'giovanni' });
  const res = await W.trainerBattle({ cls: 'Giovanni', set: 2, name: '비주기', face: 'giovanni', intro: '관장 비주기가 승부를 걸어 왔다!', story: true, gym: true, lose: '…세 번이나 지다니. 내가 졌다.', money: 5000, music: 'gym' });
  if (res !== 'win') return;
  await say(['훌륭하다. 이 그린배지를 가져가라.', '나는 로켓단을 해산하고, 처음부터 다시 수련하겠다. …언젠가 다시 만나자.'], { who: '비주기', face: 'giovanni' });
  setFlag('badge8'); G.s.badges.push('earth'); onBadge(); sfx('badge');
  await say([`${josa(P(), '은/는')} 그린배지를 받았다!`, '(배지 8개를 다 모았다! 이제 포켓몬 리그에 도전할 수 있어!)', '💡 상록시티 서쪽 22번도로 → 포켓몬리그 관문 → 23번도로 → 챔피언로드!']);
  W.updateGoal?.(); save();
}
async function rivalRoute22() {
  W.busy = true;
  try {
    await sayAs('rival', [`어, ${P()}! 너도 포켓몬 리그에 가는 거야?`, '나도 배지 8개 다 모았지! 리그 가기 전에 몸풀기 한 판 하자!']);
    const res = await W.trainerBattle({ party: [[18, 47], [112, 45], [65, 47], [59, 45], [103, 45], [134, 53]], name: R(), face: 'rival', intro: `라이벌 ${josa(R(), '이/가')} 승부를 걸어 왔다!`, story: true, lose: '크윽… 몸풀기라서 봐준 거야!', win: '헤헤, 리그에서 보자!', money: 4000 });
    setFlag('rival6');
    if (res !== 'win') return;
    await sayAs('rival', ['쳇… 좋아, 리그에서 진짜 승부다! 먼저 간다!']);
    const rv = W.scene.npcBy?.((x) => x.kind === 'rival'); if (rv) W.scene.removeNpc(rv);
    W.updateGoal?.(); save();
  } finally { W.busy = false; }
}
async function moltresVR(o) {
  if (flag('moltres')) return;
  await say(['불꽃처럼 빛나는 커다란 새 포켓몬이 날개를 펼쳤다!', '전설의 포켓몬, 파이어다!']);
  await W.wildBattle({ encounterRate: 0, mons: [{ species: 'Moltres', level: 50 }] });
  setFlag('moltres');
  const b = o || W.scene.npcBy?.((x) => x.idx === 5); if (b) W.scene.removeNpc(b);
  save();
}
async function championBattle() {
  if (flag('champWin')) return;
  W.busy = true;
  try {
    await sayAs('rival', [`${P()}! 기다렸어. 내가 사천왕을 먼저 이기고 챔피언이 됐다고!`, '오박사 할아버지 손자인 내가 세상에서 제일 강한 트레이너야.', '네가 그동안 공부한 거, 내가 다 받아 주지! 덤벼!']);
    const res = await W.trainerBattle({ party: [[18, 61], [65, 59], [112, 61], [59, 61], [103, 61], [134, 65]], name: R(), face: 'champion', boss: true, heal: true, intro: `챔피언 ${josa(R(), '이/가')} 승부를 걸어 왔다!`, story: true, gym: true, lose: '말도 안 돼… 내가 지다니!', win: '헤헤, 챔피언은 역시 나야!', money: 9900, music: 'gym' });
    if (res !== 'win') return;
    setFlag('champWin'); save();
    await sayAs('rival', ['…내가 졌어. 챔피언 자리는 겨우 몇 분이었네.', '그래도 인정할게. 넌 정말 강해졌어.']);
    await say([`${P()}! 정말 축하한다!`, `${R()}, 너는 포켓몬을 믿고 아끼는 마음을 잊었던 것 같구나. 그래서 진 거란다.`, `${P()}, 너는 틀린 문제에서도 배우고, 포켓몬과 함께 끝까지 해냈어.`, '자, 따라오너라. 명예의 전당으로 가자!'], { who: '오박사', face: 'oak' });
    await hallOfFame();
  } finally { W.busy = false; }
}
async function hallOfFame() {
  await W.scene.loadMap('HallOfFame', 4, 5, 'up');
  await say(['여기는 명예의 전당. 포켓몬 리그 챔피언과 그 포켓몬들의 이름이 영원히 남는 곳이란다.', `${P()}와 함께한 포켓몬들을 기록하마!`], { who: '오박사', face: 'oak' });
  sfx('badge');
  G.s.hof = [...(G.s.hof || []), { at: Date.now(), party: G.s.party.map((m) => [m.sp, m.lv]) }];
  setFlag('champion');
  await W.ending?.();
  // 엔딩 뒤: 사천왕에 다시 도전할 수 있게 방 깃발을 되돌리고, 집에서 이어 한다
  for (const k of ['e4_1', 'e4_2', 'e4_3', 'e4_4', 'champWin']) delete G.s.flags[k];
  G.s.respawn = { map: 'RedsHouse1F', x: 3, y: 5 };
  healParty?.();
  save();
  await W.scene.loadMap('RedsHouse1F', 3, 5, 'down');
  await say(['…집에 돌아왔다. 엄마가 따뜻한 밥을 차려 두셨다.', '🎉 엔딩까지 모두 마쳤어! 이제 도감을 채우거나, 사천왕에게 다시 도전해 보자!'], {});
  W.updateGoal?.(); save();
}

Object.assign(LINES, {
  'ViridianGym:0': () => giovanniGym(),
  'ViridianGym:9': () => say(['어이, 챔피언 지망생! 드디어 마지막 체육관이야!', '관장은 땅 포켓몬을 써. 물·풀·얼음 기술이 효과 굉장!', '전기 기술은 땅 포켓몬에게 안 통하니 조심해!'], { who: '가이드', face: 'guide' }),
  'Route22Gate:0': () => say(flag('badge8') ? ['배지 8개 확인! 포켓몬 리그로 가는 길이다. 행운을 빈다!'] : ['여기서부터는 포켓몬 리그! 배지 8개가 있어야 지나갈 수 있다.'], { who: '경비원', face: 'clerk' }),
  'Route23:0': () => say(['볼배지 확인! 지나가도 좋다.'], { who: '경비원', face: 'clerk' }),
  'Route23:1': () => say(['블루배지 확인! 계속 북쪽으로!'], { who: '경비원', face: 'clerk' }),
  'Route23:2': () => say(['물속에서는 몸이 가볍게 느껴져. 물이 몸을 위로 밀어 주는 힘(부력) 때문이야!'], { who: '수영선수', face: 'swimmer' }),
  'Route23:3': () => say(['바닷물은 짜서 민물보다 몸이 더 잘 떠!'], { who: '수영선수', face: 'swimmer' }),
  'Route23:4': () => say(['핑크배지 확인! 이 앞은 물길이야. 파도타기로 건너!'], { who: '경비원', face: 'clerk' }),
  'Route23:5': () => say(['골드배지 확인! 챔피언로드가 가까워!'], { who: '경비원', face: 'clerk' }),
  'Route23:6': () => say(['진홍배지와 그린배지까지! 너라면 해낼 수 있어!'], { who: '경비원', face: 'clerk' }),
  'VictoryRoad2F:5': (o) => moltresVR(o),
  'IndigoPlateauLobby:0': nurse,
  'IndigoPlateauLobby:1': () => say(['어이! 드디어 여기까지 왔구나!', '사천왕은 네 명이 차례로 나와. 한 명을 이기면 다음 방 문이 열려.', '💡 들어가기 전에 간호순에게 포켓몬을 회복하고, 상처약을 넉넉히 사 두자!'], { who: '가이드', face: 'guide' }),
  'IndigoPlateauLobby:2': () => say(['사천왕은 얼음·격투·고스트·드래곤 포켓몬을 써. 타입 상성을 잘 생각해!'], { who: '엘리트트레이너', face: 'coolf' }),
  'IndigoPlateauLobby:3': clerk,
  'IndigoPlateauLobby:4': () => say(['통신 교환 서비스는 지금 준비 중이에요.'], { who: '안내원', face: 'nurse' }),
  'LoreleisRoom:0': () => e4Battle(E4[0]), 'BrunosRoom:0': () => e4Battle(E4[1]), 'AgathasRoom:0': () => e4Battle(E4[2]), 'LancesRoom:0': () => e4Battle(E4[3]),
  'ChampionsRoom:0': () => championBattle(),
  'HallOfFame:0': () => say(['명예의 전당에 네 이름이 남았단다. 정말 자랑스럽구나!'], { who: '오박사', face: 'oak' }),
});
Object.assign(SIGNS, {
  'ViridianGym:1': () => [flag('badge8') ? `상록시티 체육관 — 우승 트레이너: ${P()}` : '상록시티 체육관 — 우승 트레이너: …'],
});
for (let i = 1; i <= 8; i++) TRAINER['ViridianGym:' + i] = T2(['엘리트트레이너', '태권왕', '조련사'][i % 3], '비주기 님께는 못 간다!', ['졌다!', ['지층은 아래에 있는 층일수록 오래전에 쌓였어.', '지진은 땅속 판이 움직이면서 생겨.', '화석은 지층 속에 남은 옛 생물의 흔적이야.', '모래와 진흙이 쌓여 굳으면 퇴적암이 돼.'][i % 4]], 1500);

function ch9Goal(map) {
  const T = (text, detail, targets, dir = '') => ({ text, detail, dir, targets });
  if (!flag('badge8')) {
    if (map === 'ViridianCity') return T('상록시티 체육관에 도전하자!', ['드디어 문이 열렸대. 관장은 누구일까…?'], [[32, 7, '체육관 문']]);
    if (map === 'ViridianGym') return T('맨 안쪽의 관장에게 말을 걸자', ['트레이너들을 이기며 왼쪽 위로!', '땅 포켓몬에게는 물·풀·얼음 기술이 효과 굉장!'], [[2, 2, '관장 앞']]);
    return T('마지막 배지! 상록시티 체육관으로', [F.hasHM('fly') ? '💡 날아가기 → 상록시티!' : '태초마을 북쪽이 상록시티야.'], null);
  }
  if (flag('champion')) return null;
  const e = E4_BY[map];
  if (e) return flag(e.f) ? T('위쪽 문으로 다음 방에!', [], e.exit.map(([x, y], i) => [x, y, i ? '' : '다음 방'])) : T(`사천왕 ${e.name}에게 도전!`, ['앞으로 가면 승부가 시작돼.', '지면 포켓몬센터로 돌아가지만, 이긴 방은 그대로야!'], [[...e.at, e.name]]);
  if (map === 'ViridianCity') return T('서쪽 22번도로로! 포켓몬 리그까지', [], edge(map, 'west', '22번도로'), '← 서쪽');
  if (map === 'Route22') return T('포켓몬리그 관문으로!', ['서쪽 끝 건물이야.'], [[8, 5, '관문']], '← 서쪽');
  if (map === 'Route22Gate') return T('북쪽 문으로 나가자', [], [[4, 0, '북쪽 문'], [5, 0, '']], '↑ 북쪽');
  if (map === 'Route23') {
    if (G.s.y >= 72 && !G.s.surf) return T('물가에서 파도타기!', ['물가에서 A 버튼 → “예”!'], shore(map, '물가 — A로 파도타기', (x, y) => y >= 95), '↑ 북쪽');
    if (G.s.y < 32 || (G.s.x >= 14 && G.s.y < 38)) return T('북쪽으로 쭉! 석영고원까지', [], edge(map, 'north', '석영고원'), '↑ 북쪽');
    return T('챔피언로드 입구로!', ['북쪽 왼편 동굴이야.'], [[4, 31, '챔피언로드']], '↑ 북쪽');
  }
  if (map === 'VictoryRoad1F') return T('왼쪽 위 사다리로 2층에!', ['💡 바위는 괴력으로 밀 수 있어. 막히면 그냥 밀어 보자!'], [[1, 1, '2층 사다리']]);
  if (map === 'VictoryRoad2F') return T('출구를 찾자!', ['길이 막혀 있으면 3층으로 돌아가자.'], [[29, 7, '출구'], [29, 8, ''], [1, 1, '3층 사다리']]);
  if (map === 'VictoryRoad3F') return T('오른쪽 아래 구멍으로 2층에!', ['💡 바위는 괴력으로 밀 수 있어.'], [[26, 8, '2층으로']]);
  if (map === 'IndigoPlateau') return T('포켓몬 리그 건물로!', [], [[9, 5, '포켓몬 리그'], [10, 5, '']]);
  if (map === 'IndigoPlateauLobby') return T('회복하고 사천왕의 방으로!', ['간호순에게 회복 → 위쪽 문!'], [[8, 0, '사천왕의 방']]);
  if (map === 'ChampionsRoom') return T('챔피언과 승부!', [], [[4, 3, '챔피언']]);
  return T('포켓몬 리그로! 상록시티 서쪽 22번도로', [F.hasHM('fly') ? '💡 날아가기 → 상록시티!' : ''].filter(Boolean), null);
}
