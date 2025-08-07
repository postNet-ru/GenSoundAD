# PowerShell скрипт подготовки к релизу Ring Generator
# Использование: .\scripts\prepare-release.ps1 [version]

param(
    [string]$Version = "1.0.0"
)

Write-Host "🚀 Подготовка релиза Ring Generator v$Version" -ForegroundColor Green

# Проверяем, что мы в корне проекта
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Ошибка: запустите скрипт из корня проекта" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Проверка зависимостей..." -ForegroundColor Yellow

# Проверяем Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js не установлен" -ForegroundColor Red
    exit 1
}

# Проверяем Rust
try {
    $rustVersion = rustc --version
    Write-Host "✅ Rust: $rustVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Rust не установлен" -ForegroundColor Red
    exit 1
}

# Проверяем Tauri CLI
try {
    cargo tauri --version | Out-Null
    Write-Host "✅ Tauri CLI установлен" -ForegroundColor Green
} catch {
    Write-Host "📦 Установка Tauri CLI..." -ForegroundColor Yellow
    cargo install tauri-cli
}

Write-Host "🔧 Установка зависимостей..." -ForegroundColor Yellow
npm ci

Write-Host "🎯 Загрузка FFmpeg..." -ForegroundColor Yellow
if (Test-Path "scripts\download-ffmpeg.ps1") {
    & ".\scripts\download-ffmpeg.ps1"
} else {
    Write-Host "⚠️  Предупреждение: скрипт загрузки FFmpeg не найден" -ForegroundColor Yellow
    Write-Host "   Убедитесь, что FFmpeg файлы находятся в src-tauri\binaries\" -ForegroundColor Yellow
}

Write-Host "🔍 Проверка типов TypeScript..." -ForegroundColor Yellow
try {
    npm run type-check
    Write-Host "✅ TypeScript проверка пройдена" -ForegroundColor Green
} catch {
    Write-Host "❌ Ошибки типов TypeScript" -ForegroundColor Red
    throw
}

Write-Host "🧹 Проверка линтера..." -ForegroundColor Yellow
try {
    npm run lint
    Write-Host "✅ Линтер проверка пройдена" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Предупреждение: есть ошибки линтера, но продолжаем..." -ForegroundColor Yellow
}

Write-Host "🏗️  Сборка фронтенда..." -ForegroundColor Yellow
npm run build

Write-Host "🧪 Тестовая сборка Tauri..." -ForegroundColor Yellow
npm run tauri build -- --debug

Write-Host "📊 Проверка размеров файлов..." -ForegroundColor Yellow
$bundleDir = "src-tauri\target\debug\bundle"
if (Test-Path $bundleDir) {
    Get-ChildItem -Path $bundleDir -Recurse -Include "*.exe", "*.msi" | ForEach-Object {
        $size = [math]::Round($_.Length / 1MB, 2)
        Write-Host "   📦 $($_.Name): ${size} MB" -ForegroundColor Cyan
    }
}

Write-Host "✅ Релиз готов к сборке!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Следующие шаги:" -ForegroundColor Cyan
Write-Host "   1. Для сборки production версии: npm run tauri:build" -ForegroundColor White
Write-Host "   2. Для сборки под Windows: npm run build:windows" -ForegroundColor White
Write-Host "   3. Готовые файлы будут в src-tauri\target\release\bundle\" -ForegroundColor White
