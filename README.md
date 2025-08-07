# GenSoundAD - Генератор аудио контента с рекламными вставками

Профессиональное десктопное приложение для создания многочасовых аудиоплейлистов с автоматическим размещением рекламы и джинглов.

Currently, two official plugins are available:

- ✅ Создание многочасовых аудиоплейлистов (до 8+ часов)
- ✅ Автоматическое размещение рекламы и джинглов по времени
- ✅ Поддержка различных аудиоформатов (MP3, WAV, OGG, FLAC, M4A, AAC)  
- ✅ Экспорт в высоком качестве до 320 kbps
- ✅ Кроссплатформенность (Windows, macOS, Linux)
- ✅ Нативная производительность без ограничений браузера
- ✅ Автоматические обновления через встроенную систему

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

- Node.js 18+
- Rust 1.77.2+
- FFmpeg (автоматически включается в сборку)

## 🔧 Установка для разработчиков

1. **Клонирование репозитория**
```bash
git clone https://github.com/Noradrenalin-team/GenSoundAD.git
cd GenSoundAD
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from 'eslint-plugin-react'

export default tseslint.config({
  // Set the react version
  settings: { react: { version: '18.3' } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
  },
})
```

3. **Установка FFmpeg** (обязательно!)

Выберите один из вариантов:

**Автоматическая загрузка (Windows):**
```powershell
.\scripts\download-ffmpeg.ps1
```

**Автоматическая загрузка (macOS/Linux):**
```bash
chmod +x scripts/download-ffmpeg.sh
./scripts/download-ffmpeg.sh
```

**Ручная установка:**
- Скачайте FFmpeg с https://ffmpeg.org/download.html
- Поместите исполняемые файлы в соответствующие папки:
  - Windows: `src-tauri/binaries/windows/ffmpeg.exe`
  - macOS: `src-tauri/binaries/macos/ffmpeg`  
  - Linux: `src-tauri/binaries/linux/ffmpeg`

4. **Запуск в режиме разработки**
```bash
npm run tauri:dev
```

## 📦 Сборка

```bash
# Сборка для текущей платформы
npm run tauri:build

# Сборка только фронтенда  
npm run build
```

## 🎵 Использование

1. Загрузите аудиофайлы (реклама, джинглы, музыка)
2. Создайте временные слоты для размещения
3. Настройте типы контента и их расписание
4. Выберите параметры экспорта (формат, битрейт)
5. Нажмите "Экспортировать" и выберите папку для сохранения

## 🔧 Конфигурация

### Поддерживаемые форматы экспорта:
- **MP3**: 128, 192, 256, 320 kbps
- **WAV**: без сжатия, 44.1 kHz  
- **OGG**: 128, 192, 256, 320 kbps
- **FLAC**: lossless сжатие

### Ограничения браузерной версии:
- Максимум 30 минут аудио
- Ограниченная память браузера
- Рекомендуется использовать десктопную версию

## 🐛 Решение проблем

### FFmpeg не найден
```
Error: Ошибка экспорта: Не удалось запустить FFmpeg: program not found
```

**Решение:**
1. Убедитесь что FFmpeg файлы находятся в правильных папках
2. Проверьте права на выполнение (macOS/Linux): `chmod +x ffmpeg`  
3. Запустите `npm run tauri:dev` заново

### Проблемы с компиляцией Rust
```bash
cargo clean
npm run tauri:dev
```

### Ошибки TypeScript
```bash
npm run type-check
```

## 📁 Структура проекта

```
GenSoundAD/
├── src/                          # React фронтенд
│   ├── features/components/       # UI компоненты
│   ├── shared/                   # Утилиты и API
│   └── app/context/              # Состояние приложения
├── src-tauri/                    # Rust бэкенд
│   ├── src/                      # Rust код
│   ├── binaries/                 # FFmpeg исполняемые файлы
│   └── Cargo.toml               # Rust зависимости
└── scripts/                     # Скрипты автоматизации
```

## 🤝 Вклад в проект

1. Форкните репозиторий
2. Создайте ветку: `git checkout -b feature/amazing-feature`
3. Внесите изменения: `git commit -m 'Add amazing feature'`
4. Отправьте изменения: `git push origin feature/amazing-feature`  
5. Откройте Pull Request

## 📄 Лицензия

Этот проект распространяется под лицензией MIT. См. файл `LICENSE` для подробностей.

## 📞 Поддержка

- 🐛 [Сообщить об ошибке](https://github.com/Noradrenalin-team/GenSoundAD/issues)
- 💡 [Предложить функцию](https://github.com/Noradrenalin-team/GenSoundAD/issues)
- 📧 Email: support@noradrenalin.team
