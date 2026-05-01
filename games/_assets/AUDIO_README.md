# 동물농장 사운드 시스템

## 개요

`animal-farm.html` 내장 절차생성(Procedural) 오디오 시스템.
**외부 사운드 파일 0개** — WebAudio API로 OscillatorNode + ADSR 엔벨로프를 합성하여 즉시 재생.

## 아키텍처

```
AudioContext
  └── masterGain (전체 볼륨, 음소거 0/1)
       ├── bgmGain (BGM 채널 0~1)
       │    ├── melody oscillators (계절별 스케일)
       │    └── bass oscillators (root + fifth 패턴)
       └── sfxGain (SFX 채널 0~1)
            ├── envNote (ADSR oscillator)
            ├── play (legacy 단순 sine/square)
            └── noise (BufferSource + lowpass filter)
```

## BGM 절차생성 (4계절)

| 계절 | 스케일 | 템포 | 파형 | 분위기 |
|------|--------|------|------|--------|
| 봄 (spring) | C 메이저 | 120 BPM | triangle | 밝고 경쾌 |
| 여름 (summer) | E 메이저 | 140 BPM | square | 빠르고 활기 |
| 가을 (fall)  | A 마이너 | 90 BPM | sine | 차분, 사색 |
| 겨울 (winter) | F 믹솔리디안 | 70 BPM | sine | 느리고 잔잔 |

- **16마디 루프**: 각 마디 4박자 → 64 노트 슬롯
- **결정론적 시드**: 계절별 시드 (봄=7, 여름=13, 가을=23, 겨울=31)로 LCG 난수 생성 — 매번 같은 멜로디 보장
- **베이스라인**: 루트-5도 교대 패턴 (16마디 × 4박)
- **fade in**: bgmGain을 1.5초 동안 0→bgmVol로 linearRamp
- **루프 재예약**: setInterval로 totalDur 직전 재시작 → seamless

## SFX 카탈로그

### 동물 울음 (계절별 detune)
- `chicken`: 2음 짧은 square (900/1200 Hz)
- `cow`: 3음 긴 sawtooth (120/110/100 Hz)
- `pig`: 낮은 톤 sawtooth (180/160 Hz)
- `sheep`: 중간 triangle (440/420 Hz)
- `duck`: 빠른 더블 square (550/500 Hz)
- 겨울에 -30Hz, 여름에 +20Hz detune (계절감 표현)

### 환경/UI
- `coin()`: 880→1320 Hz (수확 코인)
- `harvest()`: 660→880→1100→1320→1760 Hz (성공음 + 코인 테일)
- `place()`: 440 Hz triangle
- `build()`: 노이즈 3연타 + lowpass 1500/1300/1100 Hz (망치질 절차생성)
- `click()`: 880 Hz square 30ms
- `modal()`: 660→880 Hz triangle 더블
- `saveSfx()`: 550→770→990 Hz sine 상승
- `achieve()`: 523→659→784→1047 Hz (도/미/솔/도 펜타토닉)
- `error()`: 220 Hz sawtooth

### 노이즈 합성 (build sound)
```js
const buf = ctx.createBuffer(1, sampleRate*dur, sampleRate);
for (let i=0; i<len; i++) data[i] = (Math.random()*2-1) * Math.pow(1-i/len, 2);
// → BufferSource → biquadFilter(lowpass) → gain → sfxGain
```

## 자동재생 정책 우회

모바일 브라우저는 사용자 제스처 없이 AudioContext 재생을 막는다.
- `init()`은 lazy로 ctx 생성
- 첫 캔버스 터치 시 `_firstTouch` 플래그로 `AU.resume()` + `AU.playBgm(G.season)`
- iOS Safari/Chrome 모두 통과 확인

## 볼륨 슬라이더 / 음소거

`🔊` 버튼 (BottomBar) → 모달:
- BGM 슬라이더 (0~100%)
- SFX 슬라이더 (0~100%)
- BGM 켜기/끄기 (개별 음소거)
- 전체 음소거 (master gain 0)
- 테스트 버튼 (동전/수확/건축/동물)

`localStorage.animalFarmAudio` 키:
```json
{"bgmVol":0.35,"sfxVol":0.6,"muted":false,"bgmMuted":false}
```

## 향후 OGG 교체 (Pixabay CC0 음원 추천)

절차생성을 유지하되, 고품질이 필요하면 다음 무료 음원 검토:

1. **Pixabay BGM**: https://pixabay.com/music/search/farm/  (농장/시골 분위기 OGG/MP3)
2. **Free Music Archive**: https://freemusicarchive.org/genre/Folk/  (포크/시골)
3. **Incompetech (Kevin MacLeod)**: https://incompetech.com/music/royalty-free/music.html  (Carefree, Bumbly March 등)
4. **OpenGameArt**: https://opengameart.org/art-search-advanced?keys=farm&field_art_type_tid%5B%5D=12  (게임용 무료)
5. **Freesound.org**: https://freesound.org/search/?q=animal+farm  (CC0/CC-BY 동물 울음 샘플)

교체 방법: `<audio>` 엘리먼트 또는 `fetch()` → `decodeAudioData()` → `BufferSource`로 `bgmGain`/`sfxGain`에 연결.

## AudioCraft / MusicGen 학습 옵션

`D:/AI/06_도구/ai-toolkit` 또는 별도 환경에서:

- **MusicGen (Meta AI)**: https://github.com/facebookresearch/audiocraft
- 농장/시골/계절 프롬프트로 BGM 생성:
  ```
  python -m audiocraft.models.musicgen \
    --model facebook/musicgen-small \
    --prompt "calm farm folk music, fiddle and acoustic guitar, spring morning"
  ```
- 생성된 wav → ffmpeg로 OGG 변환 → `_assets/audio/bgm_spring.ogg`로 배치
- LoRA 학습으로 한국 농촌 분위기 fine-tuning 가능

## 파일 위치

- 본체 코드: `D:/AI/04_게임/동물농장/animal-farm.html` (AU 객체, 약 200 LOC)
- 백업: `animal-farm.html.backup4`
- 본 문서: `D:/AI/04_게임/동물농장/_assets/AUDIO_README.md`
