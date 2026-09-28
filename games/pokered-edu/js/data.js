/* 게임 데이터 로드 (포켓몬, 기술, 트레이너, 지도, 과학 문제) */
export const DB = { species: [], byKey: {}, moves: {}, trainers: {}, maps: {}, science: [] };

export const MAP_IDS = ['PalletTown', 'RedsHouse1F', 'RedsHouse2F', 'BluesHouse', 'OaksLab', 'Route1', 'ViridianCity',
  'ViridianPokecenter', 'ViridianMart', 'ViridianSchoolHouse', 'Route2', 'ViridianForestSouthGate', 'ViridianForest',
  'ViridianForestNorthGate', 'PewterCity', 'PewterPokecenter', 'PewterMart', 'PewterGym',
  'Route3', 'MtMoonPokecenter', 'Route4', 'MtMoon1F', 'MtMoonB1F', 'MtMoonB2F', 'CeruleanCity', 'CeruleanPokecenter', 'CeruleanMart', 'CeruleanGym',
  'Route24', 'Route25', 'BillsHouse', 'Route5', 'UndergroundPathRoute5', 'UndergroundPathNorthSouth', 'UndergroundPathRoute6', 'Route6',
  'VermilionCity', 'VermilionPokecenter', 'VermilionMart', 'VermilionGym'];

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
};

async function j(path) {
  const r = await fetch(path);
  if (!r.ok) throw new Error(path + ' ' + r.status);
  return r.json();
}

export async function loadAll(onProgress) {
  const [species, moves, trainers, sa, sb] = await Promise.all([
    j('data/species.json'), j('data/moves.json'), j('data/trainers.json'),
    j('data/science_a.json').catch(() => []), j('data/science_b.json').catch(() => []),
  ]);
  DB.species = species;
  species.forEach((s) => { DB.byKey[s.key] = s; });
  DB.moves = moves;
  DB.trainers = trainers;
  DB.science = [...sa, ...sb];
  onProgress?.(0.5);
  const maps = await Promise.all(MAP_IDS.map((id) => j(`data/maps/${id}.json`)));
  maps.forEach((m) => { DB.maps[m.id] = m; });
  onProgress?.(1);
}

export const sp = (id) => DB.species[id - 1];
export const monArt = (id) => `art/mon/${id}.webp`;
