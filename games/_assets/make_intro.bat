@echo off
REM ============================================================
REM 동물농장 인트로 영상 생성 배치
REM ------------------------------------------------------------
REM 정지 이미지 + 텍스트 오버레이 + BGM -> 1080p MP4 5초
REM
REM 입력 파일 (이 배치 파일과 같은 폴더 또는 인자로 전달):
REM   1) 배경 이미지: intro_bg.png (1920x1080 권장)
REM   2) BGM: intro_bgm.mp3 또는 .wav (5초 이상 권장)
REM
REM 출력:
REM   videos/intro.mp4
REM
REM 사용법:
REM   make_intro.bat                          (기본 입력 사용)
REM   make_intro.bat my_bg.png my_bgm.mp3     (커스텀 입력)
REM ============================================================

setlocal ENABLEDELAYEDEXPANSION

set "SCRIPT_DIR=%~dp0"
set "INPUT_BG=%~1"
set "INPUT_BGM=%~2"
if "%INPUT_BG%"=="" set "INPUT_BG=%SCRIPT_DIR%intro_bg.png"
if "%INPUT_BGM%"=="" set "INPUT_BGM=%SCRIPT_DIR%intro_bgm.mp3"

set "OUTPUT_DIR=%SCRIPT_DIR%videos"
set "OUTPUT=%OUTPUT_DIR%\intro.mp4"

if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"

REM ffmpeg 존재 확인
where ffmpeg >nul 2>&1
if errorlevel 1 (
    echo [ERROR] ffmpeg를 PATH에서 찾을 수 없음.
    echo         winget install Gyan.FFmpeg 로 설치하세요.
    exit /b 2
)

if not exist "%INPUT_BG%" (
    echo [ERROR] 배경 이미지 없음: %INPUT_BG%
    echo         intro_bg.png 를 같은 폴더에 두거나 인자로 전달하세요.
    exit /b 1
)

if not exist "%INPUT_BGM%" (
    echo [WARN] BGM 없음: %INPUT_BGM%
    echo        무음으로 진행합니다.
    set "AUDIO_INPUT=-f lavfi -i anullsrc=r=44100:cl=stereo"
    set "AUDIO_MAP=-map 1:a"
) else (
    set "AUDIO_INPUT=-i ""%INPUT_BGM%"""
    set "AUDIO_MAP=-map 1:a"
)

set "TITLE_TEXT=동물농장"
set "SUBTITLE_TEXT=Animal Farm"
set "FONT=C\:/Windows/Fonts/malgun.ttf"

set "FILTER=scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=black,format=yuv420p,drawtext=fontfile='%FONT%':text='%TITLE_TEXT%':fontsize=120:fontcolor=white:borderw=4:bordercolor=black:x=(w-text_w)/2:y=(h-text_h)/2-80:enable='between(t,0.8,4.5)':alpha='if(lt(t,1.2),(t-0.8)/0.4,if(lt(t,4.0),1,(4.5-t)/0.5))',drawtext=fontfile='%FONT%':text='%SUBTITLE_TEXT%':fontsize=48:fontcolor=white:borderw=2:bordercolor=black:x=(w-text_w)/2:y=(h-text_h)/2+60:enable='between(t,1.2,4.5)':alpha='if(lt(t,1.6),(t-1.2)/0.4,if(lt(t,4.0),1,(4.5-t)/0.5))'"

echo [CMD] ffmpeg intro 생성...
ffmpeg -y ^
    -loop 1 -t 5 -i "%INPUT_BG%" ^
    %AUDIO_INPUT% ^
    -filter_complex "%FILTER%" ^
    -map 0:v %AUDIO_MAP% ^
    -shortest -t 5 ^
    -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p ^
    -c:a aac -b:a 192k ^
    -movflags +faststart ^
    "%OUTPUT%"

if errorlevel 1 (
    echo [ERROR] 생성 실패
    exit /b 1
)

echo [OK] 생성됨: %OUTPUT%
endlocal
