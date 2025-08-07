# PowerShell скрипт для загрузки FFmpeg на Windows
# Запускать из корня проекта: .\scripts\download-ffmpeg.ps1

$BinariesDir = "src-tauri\binaries"
$TempDir = [System.IO.Path]::GetTempPath() + [System.Guid]::NewGuid().ToString()

Write-Host "🔧 Загрузка FFmpeg для Windows..." -ForegroundColor Green

# Создаем временную папку
New-Item -ItemType Directory -Path $TempDir | Out-Null
Set-Location $TempDir

try {
    if (-not (Test-Path "..\$BinariesDir\windows\ffmpeg.exe")) {
        Write-Host "📦 Скачивание FFmpeg..." -ForegroundColor Yellow
        
        # Скачиваем последнюю версию FFmpeg
        $ProgressPreference = 'SilentlyContinue'
        Invoke-WebRequest -Uri "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip" -OutFile "ffmpeg-windows.zip"
        
        Write-Host "📦 Извлечение архива..." -ForegroundColor Yellow
        Expand-Archive -Path "ffmpeg-windows.zip" -DestinationPath "." -Force
        
        # Копируем ffmpeg.exe
        $ExtractedDir = Get-ChildItem -Directory | Where-Object { $_.Name -like "ffmpeg-master*" }
        Copy-Item "$($ExtractedDir.FullName)\bin\ffmpeg.exe" "..\$BinariesDir\windows\"
        
        Write-Host "✅ FFmpeg для Windows установлен" -ForegroundColor Green
    } else {
        Write-Host "✅ FFmpeg для Windows уже установлен" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Ошибка при загрузке FFmpeg: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Попробуйте скачать вручную с https://ffmpeg.org/download.html" -ForegroundColor Yellow
} finally {
    # Очистка
    Set-Location ".."
    Remove-Item -Path $TempDir -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "🎉 Проверка завершена!" -ForegroundColor Green
Write-Host "📁 Содержимое папки с бинарниками:" -ForegroundColor Cyan
Get-ChildItem "$BinariesDir\*" -Recurse | Select-Object Name, Length, LastWriteTime
