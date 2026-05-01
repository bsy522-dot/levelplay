# AI 농장 컨설턴트 — Ollama 연동 가이드

`animal-farm.html`의 우측 하단 🤖 버튼은 로컬 Ollama 서버에 연결되는 농장 컨설턴트입니다.

## 요건

- Ollama 서버: `http://127.0.0.1:11434` (로컬 가동)
- 모델: `gemma4:e4b` (사전 pull 필요)
- 브라우저: 게임 HTML (file:// 또는 http:// 모두 지원, 단 CORS 설정 필요)

## CORS 회피 — `OLLAMA_ORIGINS` 환경변수 (필수)

Ollama는 기본적으로 외부 origin의 fetch 요청을 차단합니다. 게임 페이지(특히 `file://` 또는 다른 포트)에서 호출하려면 환경변수로 origin을 허용해야 합니다.

### Windows (PowerShell, 영구 설정)

```powershell
[Environment]::SetEnvironmentVariable("OLLAMA_ORIGINS", "*", "User")
```

설정 후 Ollama를 **완전 재시작**:
- 시스템 트레이에서 Ollama 우클릭 → Quit
- 시작 메뉴에서 Ollama 재실행

### Windows (CMD, 단일 세션)

```cmd
set OLLAMA_ORIGINS=*
ollama serve
```

### macOS / Linux

```bash
export OLLAMA_ORIGINS="*"
ollama serve
```

영구 설정은 `~/.bashrc` 또는 `~/.zshrc`에 추가.

### 보안 강화 (선택)

`*` 대신 특정 origin만 허용:

```
OLLAMA_ORIGINS=http://localhost,http://127.0.0.1,file://
```

## 모델 준비

```bash
ollama pull gemma4:e4b
ollama list
```

`gemma4:e4b`이 보이면 OK.

## 동작 확인

브라우저 콘솔(F12) 에서:

```js
fetch('http://127.0.0.1:11434/api/tags').then(r=>r.json()).then(console.log)
```

성공 시 게임 내 컨설턴트 우측 상단의 점이 초록색(연결됨)으로 바뀝니다.

## 오프라인 폴백

Ollama 미가동 또는 CORS 차단 시, 게임은 자동으로 **정적 조언 5종**(농장 상태별 안내문)을 랜덤 표시합니다. 게임 동작에는 영향이 없습니다.

## 시스템 프롬프트

```
당신은 동물농장 게임의 친절한 AI 컨설턴트입니다.
농장 상태(JSON)나 사용자 질문을 받으면, 한국어로 1~3문장의 간단명료한 조언을 해주세요.
초등학생도 이해할 수 있게 쉽고 따뜻한 말투로, 이모지를 1~2개 섞어서 답하세요.
전문용어 금지.
```

## 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| 빨간 점, "AI 연결 실패" | Ollama 미가동 | `ollama serve` 실행 |
| 빨간 점, CORS 에러 (콘솔) | OLLAMA_ORIGINS 미설정 | 위 환경변수 설정 후 Ollama 재시작 |
| "model not found" | 모델 미설치 | `ollama pull gemma4:e4b` |
| 응답이 매우 느림 | CPU 추론, 모델 첫 로드 | 첫 호출은 10~30초 소요, 이후 캐시됨 |
| 답변이 영어로 나옴 | 모델 한국어 약함 | 시스템 프롬프트는 한국어 유지, 모델 교체 검토 |

## 데이터 저장

- 대화 이력: `localStorage['animalFarmChat']` (최근 40 메시지)
- "🗑️ 비우기" 버튼으로 초기화 가능

## 이 파일

`D:/AI/04_게임/동물농장/_assets/CONSULTANT_README.md`
