@echo off
echo ========================================================
echo        Batz Dashboard - Build and Release Script
echo ========================================================
echo.

:: 1. Check and create release folder
if not exist "Batz_Release" (
    echo [1/6] Creating Batz_Release folder...
    mkdir Batz_Release
) else (
    echo [1/6] Batz_Release folder exists, cleaning old files...
    if exist "Batz_Release\dist" rmdir /s /q "Batz_Release\dist"
    if exist "Batz_Release\admin\dist" rmdir /s /q "Batz_Release\admin\dist"
)

:: 2. Build Client
echo.
echo [2/6] Building Dashboard (Client) ...
call npm run build:client
if %errorlevel% neq 0 (
    echo [ERROR] Client build failed!
    pause
    exit /b %errorlevel%
)

:: 3. Build Admin
echo.
echo [3/6] Building Admin Panel ...
call npm run build:admin
if %errorlevel% neq 0 (
    echo [ERROR] Admin build failed!
    pause
    exit /b %errorlevel%
)

:: 4. Build Server Executable
echo.
echo [4/6] Building Server Executable via pkg ...
call npm run build:server
if %errorlevel% neq 0 (
    echo [ERROR] Server build failed!
    pause
    exit /b %errorlevel%
)

:: 5. Copy files to Release directory
echo.
echo [5/6] Copying files to Batz_Release ...

:: Copy Client
xcopy /E /I /Y "dist\*" "Batz_Release\dist\" > nul

:: Copy Admin
if not exist "Batz_Release\admin" mkdir Batz_Release\admin
xcopy /E /I /Y "admin\dist\*" "Batz_Release\admin\dist\" > nul

:: Copy Server Executable
copy /Y "dist-server\batz-backend.exe" "Batz_Release\batz-backend.exe" > nul

:: Copy Environment File (if exists)
if exist "server\.env" (
    copy /Y "server\.env" "Batz_Release\.env" > nul
)

echo.
echo ========================================================
echo [6/6] SUCCESS! Build and update complete!
echo ========================================================
echo All files have been updated in the [Batz_Release] folder.
echo You can now zip the [Batz_Release] folder and send it to the client.
echo.
pause