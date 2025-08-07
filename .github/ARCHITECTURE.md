# Поддержка архитектур в Ring Generator

## Поддерживаемые платформы и архитектуры

### macOS
- **Apple Silicon (ARM64)** - современные Mac с процессорами M1, M2, M3, M4
  - Platform: `macos-latest`  
  - Target: `aarch64-apple-darwin`
  - Arch: `arm64`

- **Intel (x86_64)** - старые Mac с процессорами Intel
  - Platform: `macos-13`
  - Target: `x86_64-apple-darwin` 
  - Arch: `x64`

### Windows
- **x86_64** - стандартные 64-битные Windows системы
  - Platform: `windows-latest`
  - Target: `x86_64-pc-windows-msvc`
  - Arch: `x64`

### Linux
- **x86_64** - стандартные 64-битные Linux системы
  - Platform: `ubuntu-latest`
  - Target: `x86_64-unknown-linux-gnu`
  - Arch: `x64`

## Изменения в сборке

### Проблема с Universal Binary
Старый `universal-apple-darwin` target больше не поддерживается в новых версиях Rust:
```
error: component 'rust-std' for target 'universal-apple-darwin' is unavailable
```

### Решение
Используем отдельные сборки для каждой архитектуры:
- Отдельная сборка для Apple Silicon (ARM64)
- Отдельная сборка для Intel Mac (x86_64)

## Workflow конфигурация

### Release Build Matrix
```yaml
strategy:
  matrix:
    include:
      - platform: 'macos-latest'      # Apple Silicon
        args: '--target aarch64-apple-darwin'
        rust-target: 'aarch64-apple-darwin'
        arch: 'arm64'
      - platform: 'macos-13'          # Intel Mac
        args: '--target x86_64-apple-darwin'
        rust-target: 'x86_64-apple-darwin'
        arch: 'x64'
      # ... other platforms
```

### FFmpeg для macOS
```yaml
- name: Download FFmpeg (macOS)
  if: startsWith(matrix.platform, 'macos')
  run: |
    if [ "${{ matrix.arch }}" = "arm64" ]; then
      arch -arm64 brew install ffmpeg
      cp "$(arch -arm64 which ffmpeg)" "src-tauri/binaries/macos/"
    else
      arch -x86_64 brew install ffmpeg
      cp "$(arch -x86_64 which ffmpeg)" "src-tauri/binaries/macos/"
    fi
```

## Кеширование по архитектурам

Кеш теперь учитывает архитектуру:
```yaml
key: ${{ runner.os }}-${{ matrix.arch }}-cargo-${{ hashFiles('**/Cargo.lock') }}
```

Это позволяет:
- Отдельное кеширование для ARM и Intel Mac
- Избежание конфликтов между архитектурами
- Более эффективное использование кеша

## Результаты сборки

После сборки будут созданы отдельные артефакты:
- `ring-generator-macos-latest-arm64` - для Apple Silicon
- `ring-generator-macos-13-x64` - для Intel Mac  
- `ring-generator-ubuntu-latest-x64` - для Linux
- `ring-generator-windows-latest-x64` - для Windows

## Локальная сборка

### Для Apple Silicon Mac:
```bash
rustup target add aarch64-apple-darwin
npm run tauri build -- --target aarch64-apple-darwin
```

### Для Intel Mac:
```bash
rustup target add x86_64-apple-darwin
npm run tauri build -- --target x86_64-apple-darwin
```

### Проверка архитектуры системы:
```bash
uname -m
# arm64 = Apple Silicon
# x86_64 = Intel Mac
```

## Системные требования

### Apple Silicon (ARM64)
- macOS 11.0+ (Big Sur)
- Apple M1/M2/M3/M4 процессор
- 4 GB RAM
- 200 MB свободного места

### Intel Mac (x86_64) 
- macOS 10.15+ (Catalina)
- Intel процессор
- 4 GB RAM
- 200 MB свободного места

## Отладка

### Проверка target'ов:
```bash
rustup target list --installed
```

### Установка нужного target'а:
```bash
# Для Apple Silicon
rustup target add aarch64-apple-darwin

# Для Intel Mac
rustup target add x86_64-apple-darwin
```

### Принудительная установка для конкретной архитектуры:
```bash
# ARM64
arch -arm64 brew install ffmpeg

# x86_64 (через Rosetta)
arch -x86_64 brew install ffmpeg
```
