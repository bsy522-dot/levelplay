/* 조사 교정기 점검: node _tools/test_josa.mjs */
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const { fixJosa } = await import(pathToFileURL(path.join(here, '../js/learn/math.js')).href);
const cases = [
  ['19를 10과 9으로 나눠', '19를 10과 9로 나눠'],
  ['2.2은(는) 커', '2.2는 커'],
  ['2이(가) 답', '2가 답'],
  ['16라서 안 돼', '16이라서 안 돼'],
  ['1/2와 1/3', '1/2과 1/3'],
  ['꼬렛이(가) 나왔다', '꼬렛이 나왔다'],
  ['피카츄이(가) 나왔다', '피카츄가 나왔다'],
  ['7와 3를 모으면 10야', '7과 3을 모으면 10이야'],
  ['레벨 10(으)로', '레벨 10으로'],
  ['레벨 7(으)로', '레벨 7로'],
  ['레벨 9(으)로', '레벨 9로'],
];
let bad = 0;
for (const [a, want] of cases) { const got = fixJosa(a); if (got !== want) { bad++; console.log('✗', a, '→', got, '(기대:', want + ')'); } }
console.log(bad ? `조사 ${bad}건 틀림` : `조사 ${cases.length}건 모두 맞음`);
process.exit(bad ? 1 : 0);
