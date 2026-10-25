/* 게임 데이터 로드 (포켓몬, 기술, 트레이너, 지도, 과학 문제) */
export const DB = { species: [], byKey: {}, moves: {}, trainers: {}, maps: {}, science: [], concept: [], lectures: {} };

export const MAP_IDS = ['PalletTown', 'RedsHouse1F', 'RedsHouse2F', 'BluesHouse', 'OaksLab', 'Route1', 'ViridianCity',
  'ViridianPokecenter', 'ViridianMart', 'ViridianSchoolHouse', 'Route2', 'ViridianForestSouthGate', 'ViridianForest',
  'ViridianForestNorthGate', 'PewterCity', 'PewterPokecenter', 'PewterMart', 'PewterGym',
  'Route3', 'MtMoonPokecenter', 'Route4', 'MtMoon1F', 'MtMoonB1F', 'MtMoonB2F', 'CeruleanCity', 'CeruleanPokecenter', 'CeruleanMart', 'CeruleanGym',
  'Route24', 'Route25', 'BillsHouse', 'Route5', 'UndergroundPathRoute5', 'UndergroundPathNorthSouth', 'UndergroundPathRoute6', 'Route6',
  'VermilionCity', 'VermilionPokecenter', 'VermilionMart', 'VermilionGym',
  // 4판: 상트앙느호 → 9·10번도로 → 돌산터널 → 보라타운 → 8번도로·지하통로·7번도로 → 무지개시티
  'VermilionDock', 'SSAnne1F', 'SSAnne2F', 'SSAnneCaptainsRoom', 'Route9', 'Route10', 'RockTunnelPokecenter', 'RockTunnel1F', 'RockTunnelB1F',
  'LavenderTown', 'LavenderPokecenter', 'LavenderMart', 'Route8', 'UndergroundPathRoute8', 'UndergroundPathWestEast', 'UndergroundPathRoute7', 'Route7',
  'CeladonCity', 'CeladonPokecenter', 'CeladonMart1F', 'CeladonGym',
  // 5판: 게임코너 → 로켓단 아지트 → 포켓몬타워 → 후지 노인
  'GameCorner', 'RocketHideoutB1F', 'RocketHideoutB2F', 'RocketHideoutB3F', 'RocketHideoutB4F',
  'PokemonTower1F', 'PokemonTower2F', 'PokemonTower3F', 'PokemonTower4F', 'PokemonTower5F', 'PokemonTower6F', 'PokemonTower7F', 'MrFujisHouse',
  // 6판: 12~15번도로 → 연분홍시티 → 사파리존
  'Route12', 'Route12Gate1F', 'Route13', 'Route14', 'Route15', 'Route15Gate1F', 'FuchsiaCity', 'FuchsiaPokecenter', 'FuchsiaMart', 'FuchsiaGym', 'WardensHouse',
  'SafariZoneGate', 'SafariZoneCenter', 'SafariZoneWest', 'SafariZoneSecretHouse', 'SafariZoneCenterRestHouse', 'SafariZoneWestRestHouse',
  // 7판: 노랑시티 관문 → 실프주식회사(엘리베이터 1·5·7·11층) → 초련
  'Route5Gate', 'Route6Gate', 'Route7Gate', 'Route8Gate', 'SaffronCity', 'SaffronPokecenter', 'SaffronMart', 'SilphCo1F', 'SilphCo5F', 'SilphCo7F', 'SilphCo11F', 'SilphCoElevator', 'SaffronGym',
  // 8판: 21번 바닷길 → 홍련마을 → 포켓몬 저택 → 강연
  'Route21', 'CinnabarIsland', 'CinnabarPokecenter', 'CinnabarMart', 'PokemonMansion1F', 'PokemonMansionB1F', 'CinnabarGym',
  // 9판·엔딩: 상록시티 체육관 → 22·23번도로 → 챔피언로드 → 석영고원 → 사천왕 → 챔피언 → 명예의 전당
  'ViridianGym', 'Route22', 'Route22Gate', 'Route23', 'VictoryRoad1F', 'VictoryRoad2F', 'VictoryRoad3F', 'IndigoPlateau', 'IndigoPlateauLobby',
  'LoreleisRoom', 'BrunosRoom', 'AgathasRoom', 'LancesRoom', 'ChampionsRoom', 'HallOfFame'];

export const MAP_NAME = {
  PalletTown: '태초마을', RedsHouse1F: '우리 집 1층', RedsHouse2F: '우리 집 2층', BluesHouse: '라이벌의 집', OaksLab: '오박사 연구소',
  Route1: '1번도로', ViridianCity: '상록시티', ViridianPokecenter: '상록시티 포켓몬센터', ViridianMart: '상록시티 프렌들리숍',
  ViridianSchoolHouse: '상록시티 트레이너 학교', Route2: '2번도로', ViridianForestSouthGate: '상록숲 입구', ViridianForest: '상록숲',
  ViridianForestNorthGate: '상록숲 출구', PewterCity: '회색시티', PewterPokecenter: '회색시티 포켓몬센터', PewterMart: '회색시티 프렌들리숍',
  PewterGym: '회색시티 체육관',
  Route3: '3번도로', MtMoonPokecenter: '달맞이산 포켓몬센터', Route4: '4번도로', MtMoon1F: '달맞이산 1층', MtMoonB1F: '달맞이산 지하 1층',
  MtMoonB2F: '달맞이산 지하 2층', CeruleanCity: '블루시티', CeruleanPokecenter: '블루시티 포켓몬센터', CeruleanMart: '블루시티 프렌들리숍', CeruleanGym: '블루시티 체육관',
  Route24: '24번도로 (너겟 브릿지)', Route25: '25번도로', BillsHouse: '이수재의 집', Route5: '5번도로', UndergroundPathRoute5: '지하통로 입구 (5번도로)',
  UndergroundPathNorthSouth: '지하통로', UndergroundPathRoute6: '지하통로 입구 (6번도로)', Route6: '6번도로', VermilionCity: '갈색시티',
  VermilionPokecenter: '갈색시티 포켓몬센터', VermilionMart: '갈색시티 프렌들리숍', VermilionGym: '갈색시티 체육관',
  VermilionDock: '갈색시티 항구', SSAnne1F: '상트앙느호 1층', SSAnne2F: '상트앙느호 2층', SSAnneCaptainsRoom: '상트앙느호 선장실',
  Route9: '9번도로', Route10: '10번도로', RockTunnelPokecenter: '돌산터널 포켓몬센터', RockTunnel1F: '돌산터널 1층', RockTunnelB1F: '돌산터널 지하 1층',
  LavenderTown: '보라타운', LavenderPokecenter: '보라타운 포켓몬센터', LavenderMart: '보라타운 프렌들리숍', Route8: '8번도로',
  UndergroundPathRoute8: '지하통로 입구 (8번도로)', UndergroundPathWestEast: '지하통로 (동서)', UndergroundPathRoute7: '지하통로 입구 (7번도로)', Route7: '7번도로',
  CeladonCity: '무지개시티', CeladonPokecenter: '무지개시티 포켓몬센터', CeladonMart1F: '무지개시티 백화점', CeladonGym: '무지개시티 체육관',
  GameCorner: '게임코너', RocketHideoutB1F: '로켓단 아지트 지하 1층', RocketHideoutB2F: '로켓단 아지트 지하 2층', RocketHideoutB3F: '로켓단 아지트 지하 3층',
  RocketHideoutB4F: '로켓단 아지트 지하 4층', PokemonTower1F: '포켓몬타워 1층', PokemonTower2F: '포켓몬타워 2층', PokemonTower3F: '포켓몬타워 3층',
  PokemonTower4F: '포켓몬타워 4층', PokemonTower5F: '포켓몬타워 5층', PokemonTower6F: '포켓몬타워 6층', PokemonTower7F: '포켓몬타워 7층', MrFujisHouse: '후지 노인의 집',
  Route12: '12번도로', Route12Gate1F: '12번도로 관문', Route13: '13번도로', Route14: '14번도로', Route15: '15번도로', Route15Gate1F: '15번도로 관문',
  FuchsiaCity: '연분홍시티', FuchsiaPokecenter: '연분홍시티 포켓몬센터', FuchsiaMart: '연분홍시티 프렌들리숍', FuchsiaGym: '연분홍시티 체육관', WardensHouse: '사파리존 관리인의 집',
  SafariZoneGate: '사파리존 입구', SafariZoneCenter: '사파리존 가운데', SafariZoneWest: '사파리존 서쪽', SafariZoneSecretHouse: '사파리존 비밀의 집',
  SafariZoneCenterRestHouse: '사파리존 쉼터', SafariZoneWestRestHouse: '사파리존 서쪽 쉼터',
  Route5Gate: '노랑시티 북쪽 관문', Route6Gate: '노랑시티 남쪽 관문', Route7Gate: '노랑시티 서쪽 관문', Route8Gate: '노랑시티 동쪽 관문',
  SaffronCity: '노랑시티', SaffronPokecenter: '노랑시티 포켓몬센터', SaffronMart: '노랑시티 프렌들리숍',
  SilphCo1F: '실프주식회사 1층', SilphCo5F: '실프주식회사 5층', SilphCo7F: '실프주식회사 7층', SilphCo11F: '실프주식회사 11층', SilphCoElevator: '실프주식회사 엘리베이터',
  SaffronGym: '노랑시티 체육관',
  Route21: '21번 바닷길', CinnabarIsland: '홍련마을', CinnabarPokecenter: '홍련마을 포켓몬센터', CinnabarMart: '홍련마을 프렌들리숍',
  PokemonMansion1F: '포켓몬 저택 1층', PokemonMansionB1F: '포켓몬 저택 지하', CinnabarGym: '홍련마을 체육관',
  ViridianGym: '상록시티 체육관', Route22: '22번도로', Route22Gate: '포켓몬리그 관문', Route23: '23번도로', VictoryRoad1F: '챔피언로드 1층',
  VictoryRoad2F: '챔피언로드 2층', VictoryRoad3F: '챔피언로드 3층', IndigoPlateau: '석영고원', IndigoPlateauLobby: '포켓몬리그 로비',
  LoreleisRoom: '사천왕 칸나의 방', BrunosRoom: '사천왕 시바의 방', AgathasRoom: '사천왕 국화의 방', LancesRoom: '사천왕 목호의 방',
  ChampionsRoom: '챔피언의 방', HallOfFame: '명예의 전당',
};

export const ITEMS = {
  4: { name: '몬스터볼', kind: 'ball', price: 200, rate: 1, desc: '야생 포켓몬에게 던져서 잡는 공.' },
  20: { name: '상처약', kind: 'heal', price: 300, heal: 20, desc: '포켓몬의 HP를 20 회복한다.' },
  11: { name: '해독제', kind: 'cure', price: 100, cure: 'PSN', desc: '독을 치료한다.' },
  15: { name: '마비치료제', kind: 'cure', price: 200, cure: 'PAR', desc: '마비를 치료한다.' },
  12: { name: '화상치료제', kind: 'cure', price: 250, cure: 'BRN', desc: '화상을 치료한다.' },
  14: { name: '잠깨는약', kind: 'cure', price: 250, cure: 'SLP', desc: '잠든 포켓몬을 깨운다.' },
  10: { name: '달의돌', kind: 'key', price: 0, desc: '신비한 돌. 어떤 포켓몬을 진화시킨다고 한다.' },
  35: { name: '맥스업', kind: 'key', price: 0, desc: '포켓몬의 최대 HP가 조금 오르는 약.' },
  900: { name: '오박사의 소포', kind: 'key', price: 0, desc: '오박사님께 전해 드려야 하는 소포.' },
  40: { name: '이상한사탕', kind: 'candy', price: 0, desc: '먹으면 포켓몬의 레벨이 1 오른다.' },
  901: { name: '회색배지', kind: 'key', price: 0, desc: '회색시티 체육관 관장 웅을 이긴 증거.' },
  // ── 4판~ 상점 물건 (번호는 원작 도구 번호) ──
  1: { name: '마스터볼', kind: 'ball', price: 0, rate: 255, desc: '어떤 포켓몬이든 반드시 잡히는 최고의 공.' },
  3: { name: '수퍼볼', kind: 'ball', price: 600, rate: 1.5, desc: '몬스터볼보다 잘 잡히는 공.' },
  2: { name: '하이퍼볼', kind: 'ball', price: 1200, rate: 2, desc: '아주 잘 잡히는 공.' },
  19: { name: '좋은상처약', kind: 'heal', price: 700, heal: 50, desc: '포켓몬의 HP를 50 회복한다.' },
  18: { name: '고급상처약', kind: 'heal', price: 1500, heal: 200, desc: '포켓몬의 HP를 200 회복한다.' },
  17: { name: '풀회복약', kind: 'heal', price: 2500, heal: 9999, desc: '포켓몬의 HP를 모두 회복한다.' },
  16: { name: '회복약', kind: 'full', price: 3000, desc: 'HP를 모두 회복하고 상태 이상도 낫게 한다.' },
  52: { name: '만병통치제', kind: 'cure', price: 600, cure: 'ALL', desc: '모든 상태 이상을 낫게 한다.' },
  53: { name: '기력의조각', kind: 'revive', price: 1500, desc: '기절한 포켓몬을 HP 절반으로 깨운다.' },
  30: { name: '벌레회피스프레이', kind: 'repel', price: 350, steps: 100, desc: '100걸음 동안 야생 포켓몬이 나오지 않는다.' },
  56: { name: '실버스프레이', kind: 'repel', price: 500, steps: 200, desc: '200걸음 동안 야생 포켓몬이 나오지 않는다.' },
  29: { name: '동굴탈출로프', kind: 'rope', price: 550, desc: '동굴이나 건물 안에서 마지막으로 들른 포켓몬센터 앞으로 돌아간다.' },
  32: { name: '불꽃의돌', kind: 'stone', stone: 'FireStone', price: 2100, desc: '어떤 포켓몬을 진화시키는 뜨거운 돌.' },
  33: { name: '천둥의돌', kind: 'stone', stone: 'ThunderStone', price: 2100, desc: '어떤 포켓몬을 진화시키는 찌릿한 돌. (피카츄 → 라이츄)' },
  34: { name: '물의돌', kind: 'stone', stone: 'WaterStone', price: 2100, desc: '어떤 포켓몬을 진화시키는 푸른 돌.' },
  47: { name: '리프의돌', kind: 'stone', stone: 'LeafStone', price: 2100, desc: '어떤 포켓몬을 진화시키는 잎 무늬 돌.' },
  // ── 이야기 물건·비전머신 (필드 기술: field.js) ──
  63: { name: '배표', kind: 'key', price: 0, desc: '상트앙느호에 탈 수 있는 표.' },
  72: { name: '실프스코프', kind: 'key', price: 0, desc: '눈에 보이지 않는 것을 보게 해 주는 안경.' },
  73: { name: '포켓몬피리', kind: 'key', price: 0, desc: '잠든 포켓몬을 깨우는 피리.' },
  74: { name: '엘리베이터 열쇠', kind: 'key', price: 0, desc: '로켓단 아지트 엘리베이터 열쇠.' },
  48: { name: '카드키', kind: 'key', price: 0, desc: '실프주식회사의 잠긴 문을 연다.' },
  43: { name: '비밀열쇠', kind: 'key', price: 0, desc: '홍련마을 체육관 문을 연다.' },
  64: { name: '금니', kind: 'key', price: 0, desc: '사파리존 관리인 할아버지가 잃어버린 틀니.' },
  196: { name: '비전머신01 풀베기', kind: 'key', price: 0, desc: '블루배지가 있으면 작은 나무 앞에서 A — 나무를 벤다.' },
  197: { name: '비전머신02 날아가기', kind: 'key', price: 0, desc: '오렌지배지가 있으면 메뉴에서 가 본 도시로 날아간다.' },
  198: { name: '비전머신03 파도타기', kind: 'key', price: 0, desc: '핑크배지가 있으면 물 앞에서 A — 물 위를 지나간다.' },
  199: { name: '비전머신04 괴력', kind: 'key', price: 0, desc: '무지개배지가 있으면 바위 앞에서 A — 바위를 민다.' },
  200: { name: '비전머신05 플래시', kind: 'key', price: 0, desc: '회색배지가 있으면 어두운 동굴이 밝아진다.' },
};
/** 도시별 상점 (원작 순서 비슷하게, 갈수록 좋은 물건) */
export const SHOP = {
  default: [4, 20, 11, 15, 14, 12],
  CeladonMart1F: [4, 3, 20, 19, 52, 53, 30, 29, 32, 33, 34, 47],
  LavenderMart: [4, 3, 20, 19, 53, 30, 29],
  FuchsiaMart: [3, 2, 19, 18, 52, 53, 56],
  SaffronMart: [3, 2, 18, 52, 53, 56, 29],
  CinnabarMart: [2, 18, 17, 52, 53, 56, 29],
  IndigoPlateauLobby: [2, 17, 16, 52, 53, 56],
};

async function j(path) {
  const r = await fetch(path);
  if (!r.ok) throw new Error(path + ' ' + r.status);
  return r.json();
}

export async function loadAll(onProgress) {
  const [species, moves, trainers, sa, sb, hum] = await Promise.all([
    j('data/species.json'), j('data/moves.json'), j('data/trainers.json'),
    j('data/science_a.json').catch(() => []), j('data/science_b.json').catch(() => []),
    /* ★인문 문제은행(요구사항 17번: 역사·지리·음악·미술·문명·철학).
     * 이게 없으면 HUMAN 사다리 6단계가 질문으로 연결될 자리가 없어
     * 인문이 한 번도 나오지 않았다. 없으면 조용히 [] 로 둔다(게임은 계속 돌아간다). */
    j('data/human.json').catch(() => []),
  ]);
  // 원리 문제(수학 주제마다 "왜 필요했을까") · 강의(강의 보기 버튼). 없으면 빈 채로 계속 동작한다.
  const [concept, lectures] = await Promise.all([j('data/concept_math.json').catch(() => []), j('data/lectures.json').catch(() => ({}))]);
  // 예체능·직업 문제은행 (2026-10-03 과목 비율: 수학 30·과학 30·인문 25·예체능 10·직업 5). 없으면 그 과목은 쉬고 비율이 나뉜다
  const [arts, jobs, sc] = await Promise.all([j('data/arts.json').catch(() => []), j('data/jobs.json').catch(() => []),
    j('data/science_c.json').catch(() => [])]); // 과학 빈 단원(중학교~) + 과학자·수학자 위인 (2026-10-03)
  DB.concept = concept;
  DB.lectures = lectures;
  DB.species = species;
  species.forEach((s) => { DB.byKey[s.key] = s; });
  DB.moves = moves;
  DB.trainers = trainers;
  DB.science = [...sa, ...sb, ...sc, ...hum, ...arts, ...jobs];
  onProgress?.(0.5);
  const maps = await Promise.all(MAP_IDS.map((id) => j(`data/maps/${id}.json`)));
  maps.forEach((m) => { DB.maps[m.id] = m; });
  onProgress?.(1);
}

export const sp = (id) => DB.species[id - 1];
export const monArt = (id) => `art/mon/${id}.webp`;
