
import { pathToFileURL } from 'url';
import path from 'path';
const R = (p) => pathToFileURL(path.join('..', p)).href;
const V = await import(R('js/learn/variety.js'));
const M = await import(R('js/learn/math.js')); const A = await import(R('js/learn/math_adv.js'));
const byId = Object.fromEntries([...M.MATH, ...(A.MATH_ADV||[])].map(s=>[s.id,s]));
const s = byId['m_ratio'];
console.log('NUM', V.numTemplateCount('m_ratio'), 'FRAME', V.frameTemplateCount('m_ratio'));
const vg = V.vary(s.gen, 'm_ratio');
const rawq = s.gen(false).q;
console.log('원본 q:', JSON.stringify(rawq));
console.log('원본 숫자:', (String(rawq).match(/\d+(?:[.]\d+)?/g)||[]));
console.log('변형 4:', JSON.stringify([vg(false).q, vg(false).q, vg(false).q, vg(false).q], null, 0).slice(0,400));
