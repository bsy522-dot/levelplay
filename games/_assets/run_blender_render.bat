@echo off
REM ============================================
REM 동물농장 Blender 헤드리스 렌더 실행 배치
REM ============================================
chcp 65001 > nul
setlocal

set "BLENDER=D:\AI\06_도구\Blender\blender-4.5.9-windows-x64\blender.exe"
set "SCRIPT=%~dp0blender_render.py"
set "LOG=%~dp0blender_render.log"

if not exist "%BLENDER%" (
    echo [ERROR] blender.exe를 찾을 수 없습니다: %BLENDER%
    pause
    exit /b 1
)

if not exist "%SCRIPT%" (
    echo [ERROR] blender_render.py를 찾을 수 없습니다: %SCRIPT%
    pause
    exit /b 1
)

echo ============================================
echo Blender 헤드리스 렌더 시작
echo ============================================
echo Blender: %BLENDER%
echo Script:  %SCRIPT%
echo Log:     %LOG%
echo.

"%BLENDER%" -b -P "%SCRIPT%" > "%LOG%" 2>&1

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCCESS] 렌더 완료. 결과: %~dp0blender_sprites\
) else (
    echo.
    echo [FAILED] 에러 코드 %ERRORLEVEL%. 로그 확인: %LOG%
)

echo.
pause
endlocal
