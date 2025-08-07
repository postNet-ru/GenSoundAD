import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

import {
  Source,
  Arrangements,
  TimeOfRecords,
  TimeOfRecord,
  ExportSettings,
  Arrangement,
} from "app/context/types";

export interface ExportProgress {
  stage: 'loading' | 'processing' | 'encoding' | 'completed' | 'error';
  progress: number; // 0-100
  message: string;
  recordName?: string;
}

export async function renderAllAudios({
  sources,
  arrangements,
  timeOfRecords,
  format,
  bitrate,
  onProgress,
}: {
  sources: Source[];
  arrangements: Arrangements;
  timeOfRecords: TimeOfRecords;
  format: ExportSettings["extension"];
  bitrate: ExportSettings["bitrate"];
  onProgress?: (progress: ExportProgress) => void;
}): Promise<Record<string, Blob>> {
  const updateProgress = (stage: ExportProgress['stage'], progress: number, message: string, recordName?: string) => {
    if (onProgress) {
      onProgress({ stage, progress, message, recordName });
    }
  };

  try {
    // Валидация входных данных
    if (!sources.length) {
      throw new Error("Нет источников для экспорта");
    }

    const recordsToProcess = Object.entries(arrangements).filter(([, arr]) => arr.length > 0);
    if (!recordsToProcess.length) {
      throw new Error("Нет объявлений для экспорта");
    }

    updateProgress('loading', 0, 'Инициализация FFmpeg...');

    const ffmpeg = new FFmpeg();

    if (!ffmpeg.loaded) {
      try {
        // Используем локальные файлы FFmpeg
        await ffmpeg.load({
          coreURL: "/ffmpeg/ffmpeg-core.js",
          wasmURL: "/ffmpeg/ffmpeg-core.wasm",
        });
      } catch (loadError) {
        console.error('Ошибка загрузки FFmpeg:', loadError);
        throw new Error('Не удалось загрузить FFmpeg. Проверьте что файлы ffmpeg-core.js и ffmpeg-core.wasm находятся в папке /public/ffmpeg/');
      }
    }

    updateProgress('loading', 20, 'Декодирование аудиофайлов...');

    const audioContext = new AudioContext();
    const buffers = new Map<string, AudioBuffer>();

    // Кэшируем все source-файлы с валидацией
    for (let i = 0; i < sources.length; i++) {
      const src = sources[i];
      const progress = 20 + (i / sources.length) * 30;
      updateProgress('loading', progress, `Обработка файла: ${src.title}`);

      try {
        if (!src.file || src.file.size === 0) {
          console.warn(`Файл пустой или отсутствует: ${src.title}`);
          continue;
        }

        const buf = await src.file.arrayBuffer();
        if (!buf || buf.byteLength === 0) {
          console.warn(`Файл пустой: ${src.title}`);
          continue;
        }

        const audioBuffer = await audioContext.decodeAudioData(buf);
        if (audioBuffer.length === 0) {
          console.warn(`Аудиобуфер пустой: ${src.title}`);
          continue;
        }

        buffers.set(src.id, audioBuffer);
      } catch (e) {
        console.error(`Ошибка при декодировании файла ${src.title}:`, e);
        // Продолжаем обработку других файлов
      }
    }

    if (buffers.size === 0) {
      throw new Error("Не удалось декодировать ни одного аудиофайла");
    }

    updateProgress('processing', 50, 'Создание композиций...');

    const output: Record<string, Blob> = {};
    const totalRecords = recordsToProcess.length;

    for (let recordIndex = 0; recordIndex < totalRecords; recordIndex++) {
      const [recordName, arrangementList] = recordsToProcess[recordIndex];
      const baseProgress = 50 + (recordIndex / totalRecords) * 40;
      
      updateProgress('processing', baseProgress, `Обработка записи: ${recordName}`, recordName);

      try {
        const recordTiming = timeOfRecords[recordName];
        if (!recordTiming) {
          console.warn(`Отсутствует время записи для: ${recordName}`);
          continue;
        }

        const totalDuration = (recordTiming.end.valueOf() - recordTiming.start.valueOf()) / 1000;
        if (totalDuration <= 0) {
          console.warn(`Некорректная длительность записи для: ${recordName}`);
          continue;
        }

        // Ограничение для браузерной версии (максимум 2 часа)
        const MAX_BROWSER_DURATION = 7200; // 2 часа в секундах
        if (totalDuration > MAX_BROWSER_DURATION) {
          throw new Error(`Запись "${recordName}" слишком длинная для браузера (${Math.round(totalDuration/3600)}ч). Максимум: ${MAX_BROWSER_DURATION/3600}ч. Используйте десктопную версию для длинных записей.`);
        }

        console.log(`Processing record "${recordName}"`);
        console.log(`- Duration: ${totalDuration}s`);
        console.log(`- Time range: ${recordTiming.start.format('HH:mm:ss')} - ${recordTiming.end.format('HH:mm:ss')}`);
        console.log(`- Arrangements: ${arrangementList.length}`);

        const sampleRate = audioContext.sampleRate;
        const numChannels = 1; // Моно формат

        const finalBuffer = audioContext.createBuffer(
          numChannels,
          Math.floor(totalDuration * sampleRate),
          sampleRate,
        );

        // Обрабатываем каждое объявление с применением эффектов
        for (let arrIndex = 0; arrIndex < arrangementList.length; arrIndex++) {
          const arrangement = arrangementList[arrIndex];
          const src = sources.find((s) => s.typeId === arrangement.typeId);
          if (!src) {
            console.warn(`Источник не найден для объявления: ${arrangement.typeId}`);
            continue;
          }

          const sourceBuffer = buffers.get(src.id);
          if (!sourceBuffer) {
            console.warn(`Аудиобуфер не найден для источника: ${src.id}`);
            continue;
          }

          console.log(`Processing arrangement ${arrIndex + 1}/${arrangementList.length} for record "${recordName}"`);
          console.log(`- Source: ${src.title}`);
          console.log(`- Cut: ${src.cut.start}s - ${src.cut.end}s`);
          console.log(`- Playing time: ${arrangement.playingTime.start.format('HH:mm:ss')} - ${arrangement.playingTime.end.format('HH:mm:ss')}`);
          console.log(`- Loudness: ${arrangement.loudness}%`);

          await applyArrangementToBuffer(
            finalBuffer,
            sourceBuffer,
            src,
            arrangement,
            recordTiming,
            sampleRate
          );
        }

        updateProgress('encoding', baseProgress + 30, `Кодирование: ${recordName}`, recordName);

        // Нормализуем громкость перед кодированием (оптимизированная версия для моно)
        const targetData = finalBuffer.getChannelData(0);
        let maxAmplitude = 0;
        
        // Находим максимальную амплитуду (векторизованный поиск)
        for (let i = 0; i < targetData.length; i++) {
          const amplitude = Math.abs(targetData[i]);
          if (amplitude > maxAmplitude) {
            maxAmplitude = amplitude;
          }
        }

        // Нормализуем только если нужно (избегаем изменений если громкость в норме)
        if (maxAmplitude > 0.95) {
          const normalizationFactor = 0.9 / maxAmplitude; // Оставляем запас
          for (let i = 0; i < targetData.length; i++) {
            targetData[i] *= normalizationFactor;
          }
          console.log(`Нормализация применена: ${normalizationFactor.toFixed(3)}`);
        }

        const wav = await renderToWav(finalBuffer);
        const blob = await encodeWithFFmpeg(ffmpeg, wav, recordName, format, bitrate);
        output[recordName] = blob;

      } catch (e) {
        console.error(`Ошибка при обработке записи ${recordName}:`, e);
        // Продолжаем обработку других записей
      }
    }

    updateProgress('completed', 100, 'Экспорт завершен');
    return output;

  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Неизвестная ошибка при экспорте';
    updateProgress('error', 0, errorMessage);
    throw new Error(errorMessage);
  }
}

async function renderToWav(buffer: AudioBuffer): Promise<ArrayBuffer> {
  const ctx = new OfflineAudioContext({
    numberOfChannels: buffer.numberOfChannels,
    length: buffer.length,
    sampleRate: buffer.sampleRate,
  });
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.connect(ctx.destination);
  src.start();
  const rendered = await ctx.startRendering();
  return audioBufferToWav(rendered);
}

function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length * numChannels * 2 + 44;
  const output = new DataView(new ArrayBuffer(length));
  let offset = 0;

  const writeString = (s: string) =>
    [...s].forEach((c) => output.setUint8(offset++, c.charCodeAt(0)));
  const writeUint32 = (v: number) => {
    output.setUint32(offset, v, true);
    offset += 4;
  };
  const writeUint16 = (v: number) => {
    output.setUint16(offset, v, true);
    offset += 2;
  };

  writeString("RIFF");
  writeUint32(length - 8);
  writeString("WAVE");
  writeString("fmt ");
  writeUint32(16);
  writeUint16(1);
  writeUint16(numChannels);
  writeUint32(sampleRate);
  writeUint32(sampleRate * numChannels * 2);
  writeUint16(numChannels * 2);
  writeUint16(16);
  writeString("data");
  writeUint32(buffer.length * numChannels * 2);

  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      let sample = buffer.getChannelData(ch)[i];
      sample = Math.max(-1, Math.min(1, sample));
      output.setInt16(offset, sample * 0x7fff, true);
      offset += 2;
    }
  }

  return output.buffer;
}

/**
 * Применяет объявление к финальному буферу с эффектами
 */
async function applyArrangementToBuffer(
  finalBuffer: AudioBuffer,
  sourceBuffer: AudioBuffer,
  src: Source,
  arrangement: Arrangement,
  recordTiming: TimeOfRecord,
  sampleRate: number
): Promise<void> {
  const cutStart = src.cut.start;
  const cutEnd = src.cut.end;
  const loudness = (arrangement.loudness ?? 100) / 100; // Нормализуем от 0 до 1

  // Вычисляем время начала воспроизведения относительно начала записи
  const arrangementStartMs = arrangement.playingTime.start.valueOf();
  const arrangementEndMs = arrangement.playingTime.end.valueOf();
  const recordStartMs = recordTiming.start.valueOf();
  
  // Смещение в секундах от начала записи
  const offsetSec = (arrangementStartMs - recordStartMs) / 1000;
  const startOffsetSamples = Math.floor(offsetSec * sampleRate);
  
  // Длительность объявления в секундах
  const arrangementDurationSec = (arrangementEndMs - arrangementStartMs) / 1000;
  
  // Длительность обрезанного источника в секундах
  const sourceCutDurationSec = cutEnd - cutStart;
  
  // Используем минимальную из двух длительностей
  const actualDurationSec = Math.min(arrangementDurationSec, sourceCutDurationSec);
  const actualDurationSamples = Math.floor(actualDurationSec * sampleRate);

  console.log(`Applying arrangement: offset=${offsetSec}s, duration=${actualDurationSec}s, cut=${cutStart}-${cutEnd}s, fadeIn=${arrangement.fadeIn}, fadeOut=${arrangement.fadeOut}`);

  // Получаем данные источника (конвертируем в моно если нужно)
  let sourceData: Float32Array;
  if (sourceBuffer.numberOfChannels === 1) {
    sourceData = sourceBuffer.getChannelData(0);
  } else {
    // Смешиваем стерео в моно для лучшего качества
    const leftChannel = sourceBuffer.getChannelData(0);
    const rightChannel = sourceBuffer.getChannelData(1);
    sourceData = new Float32Array(leftChannel.length);
    for (let i = 0; i < leftChannel.length; i++) {
      sourceData[i] = (leftChannel[i] + rightChannel[i]) * 0.5;
    }
  }

  const targetData = finalBuffer.getChannelData(0); // Моно выход
  
  const cutStartSample = Math.floor(cutStart * sampleRate);
  const cutEndSample = Math.min(
    Math.floor(cutEnd * sampleRate),
    cutStartSample + actualDurationSamples,
    sourceData.length
  );

  // Параметры fade эффектов (увеличиваем длительность для лучшего звучания)
  const fadeInDuration = arrangement.fadeIn ? Math.min(0.3 * sampleRate, actualDurationSamples / 3) : 0; // 300ms или 1/3 длительности
  const fadeOutDuration = arrangement.fadeOut ? Math.min(0.3 * sampleRate, actualDurationSamples / 3) : 0; // 300ms или 1/3 длительности

  // Оптимизированный цикл обработки сэмплов
  const samplesToProcess = cutEndSample - cutStartSample;
  for (let i = 0; i < samplesToProcess; i++) {
    const sourceIndex = cutStartSample + i;
    const targetIndex = startOffsetSamples + i;
    
    // Проверяем границы
    if (targetIndex >= 0 && targetIndex < targetData.length && sourceIndex >= 0 && sourceIndex < sourceData.length) {
      let sample = sourceData[sourceIndex] * loudness;

      // Применяем fade in эффект
      if (fadeInDuration > 0 && i < fadeInDuration) {
        const fadeMultiplier = i / fadeInDuration;
        sample *= fadeMultiplier;
      }

      // Применяем fade out эффект
      if (fadeOutDuration > 0 && i >= samplesToProcess - fadeOutDuration) {
        const fadeMultiplier = (samplesToProcess - i) / fadeOutDuration;
        sample *= fadeMultiplier;
      }

      // Микшируем (складываем) с существующим аудио
      targetData[targetIndex] += sample;
    }
  }
}

/**
 * Кодирует WAV в заданный формат через FFmpeg
 */
async function encodeWithFFmpeg(
  ffmpeg: FFmpeg,
  wav: ArrayBuffer,
  recordName: string,
  format: string,
  bitrate: number
): Promise<Blob> {
  const sanitize = (s: string) => s.replace(/[^a-z0-9._-]/gi, "_");
  const inputName = `${sanitize(recordName)}.wav`;
  const outputName = `${sanitize(recordName)}.${format}`;

  try {
    // Конвертируем ArrayBuffer в Blob для fetchFile
    const wavBlob = new Blob([wav], { type: 'audio/wav' });
    await ffmpeg.writeFile(inputName, await fetchFile(wavBlob));

    // Применяем различные параметры в зависимости от формата
    let ffmpegArgs: string[];
    switch (format.toLowerCase()) {
      case 'mp3':
        ffmpegArgs = ["-i", inputName, "-codec:a", "libmp3lame", "-b:a", `${bitrate}k`, outputName];
        break;
      case 'ogg':
        ffmpegArgs = ["-i", inputName, "-codec:a", "libvorbis", "-b:a", `${bitrate}k`, outputName];
        break;
      case 'flac':
        ffmpegArgs = ["-i", inputName, "-codec:a", "flac", outputName];
        break;
      case 'wav':
        ffmpegArgs = ["-i", inputName, "-codec:a", "pcm_s16le", outputName];
        break;
      default:
        ffmpegArgs = ["-i", inputName, "-b:a", `${bitrate}k`, outputName];
    }

    await ffmpeg.exec(ffmpegArgs);

    const data = await ffmpeg.readFile(outputName);
    
    // Правильно обрабатываем FileData
    let uint8Array: Uint8Array;
    if (data instanceof Uint8Array) {
      uint8Array = data;
    } else if (typeof data === 'string') {
      // Если это строка (base64), декодируем её
      const binaryString = atob(data);
      uint8Array = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        uint8Array[i] = binaryString.charCodeAt(i);
      }
    } else {
      // Если это ArrayBuffer или другой тип
      uint8Array = new Uint8Array(data as ArrayBuffer);
    }

    // Очищаем временные файлы
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    return new Blob([uint8Array], { type: `audio/${format}` });

  } catch (e) {
    // Попытка очистить файлы в случае ошибки
    try {
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);
    } catch {
      // Игнорируем ошибки очистки
    }
    throw new Error(`Ошибка кодирования FFmpeg: ${e instanceof Error ? e.message : 'Неизвестная ошибка'}`);
  }
}


