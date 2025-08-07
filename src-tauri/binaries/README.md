# FFmpeg Binaries

Этот проект требует FFmpeg для кодирования аудио. Для каждой поддерживаемой платформы необходимо поместить соответствующий исполняемый файл FFmpeg в нужную папку.

## Загрузка FFmpeg

### Windows
1. Скачайте FFmpeg с https://ffmpeg.org/download.html#build-windows
2. Извлеките `ffmpeg.exe` из архива
3. Поместите `ffmpeg.exe` в папку `windows/`

### macOS  
1. Скачайте FFmpeg с https://ffmpeg.org/download.html#build-mac
2. Или установите через Homebrew: `brew install ffmpeg`
3. Скопируйте исполняемый файл `ffmpeg` в папку `macos/`

### Linux
1. Скачайте FFmpeg с https://ffmpeg.org/download.html#build-linux
2. Или установите через пакетный менеджер: `apt install ffmpeg` (Ubuntu/Debian)
3. Скопируйте исполняемый файл `ffmpeg` в папку `linux/`

## Структура папок

```
binaries/
├── windows/
│   └── ffmpeg.exe
├── macos/
│   └── ffmpeg  
├── linux/
│   └── ffmpeg
└── README.md
```

## Права доступа

Убедитесь, что исполняемые файлы имеют права на выполнение:

```bash
chmod +x macos/ffmpeg
chmod +x linux/ffmpeg
```

## Размер файлов

FFmpeg файлы довольно большие (30-100 МБ каждый), поэтому они не включены в репозиторий. 
Их нужно загружать отдельно для каждой платформы.

## Альтернативы

Если не хотите включать FFmpeg в bundle, можно:

1. Требовать от пользователей установки FFmpeg в системе
2. Использовать онлайн сервис для конвертации
3. Реализовать кодирование на Rust (более сложно)
