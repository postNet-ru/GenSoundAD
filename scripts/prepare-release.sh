#!/bin/bash

# Скрипт подготовки к релизу Ring Generator
# Использование: ./scripts/prepare-release.sh [version]

set -e

VERSION=${1:-"1.0.0"}
echo "🚀 Подготовка релиза Ring Generator v$VERSION"

# Проверяем, что мы в корне проекта
if [ ! -f "package.json" ]; then
    echo "❌ Ошибка: запустите скрипт из корня проекта"
    exit 1
fi

echo "📋 Проверка зависимостей..."

# Проверяем Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен"
    exit 1
fi

# Проверяем Rust
if ! command -v rustc &> /dev/null; then
    echo "❌ Rust не установлен"
    exit 1
fi

# Проверяем Tauri CLI
if ! command -v cargo tauri &> /dev/null; then
    echo "📦 Установка Tauri CLI..."
    cargo install tauri-cli
fi

echo "🔧 Установка зависимостей..."
npm ci

echo "🎯 Загрузка FFmpeg..."
if [ -f "scripts/download-ffmpeg.sh" ]; then
    chmod +x scripts/download-ffmpeg.sh
    ./scripts/download-ffmpeg.sh
else
    echo "⚠️  Предупреждение: скрипт загрузки FFmpeg не найден"
    echo "   Убедитесь, что FFmpeg файлы находятся в src-tauri/binaries/"
fi

echo "🔍 Проверка типов TypeScript..."
npm run type-check

echo "🧹 Проверка линтера..."
npm run lint || {
    echo "⚠️  Предупреждение: есть ошибки линтера, но продолжаем..."
}

echo "🏗️  Сборка фронтенда..."
npm run build

echo "🧪 Тестовая сборка Tauri..."
npm run tauri build -- --debug

echo "📊 Проверка размеров файлов..."
if [ -d "src-tauri/target/debug/bundle" ]; then
    find src-tauri/target/debug/bundle -name "*.exe" -o -name "*.app" -o -name "*.deb" -o -name "*.dmg" | while read file; do
        size=$(du -h "$file" | cut -f1)
        echo "   📦 $file: $size"
    done
fi

echo "✅ Релиз готов к сборке!"
echo ""
echo "📋 Следующие шаги:"
echo "   1. Для сборки production версии: npm run tauri:build"
echo "   2. Для сборки под конкретную платформу:"
echo "      - Windows: npm run build:windows"
echo "      - macOS: npm run build:macos" 
echo "      - Linux: npm run build:linux"
echo "   3. Готовые файлы будут в src-tauri/target/release/bundle/"
