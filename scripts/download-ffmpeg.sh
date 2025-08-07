#!/bin/bash

# Скрипт для автоматической загрузки FFmpeg для всех платформ
# Запускать из корня проекта: ./scripts/download-ffmpeg.sh

set -e

BINARIES_DIR="src-tauri/binaries"

echo "🔧 Загрузка FFmpeg для всех платформ..."

# Создаем временную папку
TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"

# Windows
echo "📦 Загрузка FFmpeg для Windows..."
if [ ! -f "../$BINARIES_DIR/windows/ffmpeg.exe" ]; then
    # Скачиваем ffmpeg для Windows (версия от Gyan)
    curl -L "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip" -o ffmpeg-windows.zip
    unzip ffmpeg-windows.zip
    cp ffmpeg-master-latest-win64-gpl/bin/ffmpeg.exe "../$BINARIES_DIR/windows/"
    echo "✅ FFmpeg для Windows установлен"
else
    echo "✅ FFmpeg для Windows уже установлен"
fi

# macOS (если запускается на macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "📦 Загрузка FFmpeg для macOS..."
    if [ ! -f "../$BINARIES_DIR/macos/ffmpeg" ]; then
        # Проверяем, есть ли ffmpeg в системе
        if command -v ffmpeg &> /dev/null; then
            cp "$(which ffmpeg)" "../$BINARIES_DIR/macos/"
            chmod +x "../$BINARIES_DIR/macos/ffmpeg"
            echo "✅ FFmpeg для macOS скопирован из системы"
        else
            echo "❌ FFmpeg не найден в системе macOS. Установите через: brew install ffmpeg"
        fi
    else
        echo "✅ FFmpeg для macOS уже установлен"
    fi
fi

# Linux (если запускается на Linux)
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "📦 Загрузка FFmpeg для Linux..."
    if [ ! -f "../$BINARIES_DIR/linux/ffmpeg" ]; then
        # Скачиваем статическую сборку для Linux
        curl -L "https://johnvansickle.com/ffmpeg/builds/ffmpeg-git-amd64-static.tar.xz" -o ffmpeg-linux.tar.xz
        tar -xf ffmpeg-linux.tar.xz
        cp ffmpeg-git-*-amd64-static/ffmpeg "../$BINARIES_DIR/linux/"
        chmod +x "../$BINARIES_DIR/linux/ffmpeg"
        echo "✅ FFmpeg для Linux установлен"
    else
        echo "✅ FFmpeg для Linux уже установлен"
    fi
fi

# Очистка
cd - > /dev/null
rm -rf "$TEMP_DIR"

echo "🎉 Загрузка FFmpeg завершена!"
echo ""
echo "📁 Проверьте файлы в $BINARIES_DIR/:"
ls -la "$BINARIES_DIR"/*/ 2>/dev/null || true
