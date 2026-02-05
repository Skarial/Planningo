@echo off
setlocal

echo ==> Build: gradlew assembleDebug
call gradlew assembleDebug
if errorlevel 1 exit /b 1

echo ==> Install: adb install -r app\build\outputs\apk\debug\app-debug.apk
adb install -r app\build\outputs\apk\debug\app-debug.apk
if errorlevel 1 exit /b 1

echo ==> Done
