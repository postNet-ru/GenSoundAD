import { Button, useToaster, Progress, Text, Flex } from "@gravity-ui/uikit";
import {
  useActiveTab,
  useArrangements,
  useExportSettings,
  useSources,
  useTabs,
  useTimeOfRecords,
} from "app/context/hooks";
import { useState, useEffect } from "react";
import { TauriAudioAPI, TauriExportProgress } from "shared/tauriAudioAPI";
import { renderAllAudios, ExportProgress } from "shared/audioTools";
import { validateExportData, estimateExportSize } from "shared/exportValidation";
import { validateAllRecords, getProjectValidationSummary, getDetailedValidationErrors, getDetailedValidationWarnings } from "shared/timeValidation";

const SaveButton = () => {
  const activeTab = useActiveTab();
  const tabs = useTabs();
  const sources = useSources();
  const arrangements = useArrangements();
  const timeOfRecords = useTimeOfRecords();
  const exportSettings = useExportSettings();
  const toaster = useToaster();

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | TauriExportProgress | null>(null);
  const [isTauriAvailable, setIsTauriAvailable] = useState(false);

  // Проверяем доступность Tauri при загрузке компонента
  useEffect(() => {
    const checkTauri = async () => {
      console.log('=== Tauri Availability Check ===');
      console.log('Window object exists:', typeof window !== 'undefined');
      console.log('Navigator userAgent:', navigator.userAgent);
      console.log('Window.__TAURI__:', !!(window as any).__TAURI__);
      console.log('Window.__TAURI_INTERNALS__:', !!(window as any).__TAURI_INTERNALS__);
      console.log('Window.__TAURI_METADATA__:', !!(window as any).__TAURI_METADATA__);
      
      const basicCheck = TauriAudioAPI.isAvailable();
      console.log('Basic Tauri check:', basicCheck);
      
      const extendedCheck = await TauriAudioAPI.isAvailableExtended();
      console.log('Extended Tauri check:', extendedCheck);
      
      if (basicCheck || extendedCheck) {
        try {
          const asyncCheck = await TauriAudioAPI.testAvailability();
          console.log('Async Tauri check:', asyncCheck);
          setIsTauriAvailable(asyncCheck);
          
          if (asyncCheck) {
            // Дополнительно проверим FFmpeg
            const ffmpegCheck = await TauriAudioAPI.checkFFmpegAvailability();
            console.log('FFmpeg check:', ffmpegCheck);
          }
        } catch (error) {
          console.log('Async check failed:', error);
          // Если асинхронная проверка не удалась, но базовая/расширенная сработала
          // возможно Tauri доступен, но команда не работает
          setIsTauriAvailable(basicCheck || extendedCheck);
        }
      } else {
        console.log('All checks failed, setting isTauriAvailable to false');
        setIsTauriAvailable(false);
      }
    };
    
    checkTauri();
  }, []);

  // Находим название текущего таба
  const currentTabName = tabs.find(tab => tab.id === activeTab)?.title || activeTab;

  // Подписываемся на события прогресса от Tauri
  useEffect(() => {
    if (!isTauriAvailable) return;
    
    const tauriAPI = new TauriAudioAPI();
    const unsubscribe = tauriAPI.onProgress((tauriProgress) => {
      setProgress(tauriProgress);
    });

    return unsubscribe;
  }, [isTauriAvailable]);

  async function onClick() {
    setLoading(true);
    setProgress(null);

    // Фильтруем данные только для активного таба
    const currentTabArrangements = { [activeTab]: arrangements[activeTab] || [] };
    const currentTabTimeRecord = { [activeTab]: timeOfRecords[activeTab] };

    // Валидация временных интервалов только для текущего таба
    const timeValidationResults = validateAllRecords(currentTabArrangements, currentTabTimeRecord);
    const timeSummary = getProjectValidationSummary(timeValidationResults);

    if (timeSummary.hasErrors) {
      setLoading(false);
      
      // Получаем детальные ошибки и предупреждения
      const detailedErrors = getDetailedValidationErrors(timeValidationResults);
      const detailedWarnings = getDetailedValidationWarnings(timeValidationResults);
      
      // Показываем каждую ошибку отдельно
      detailedErrors.forEach((error, index) => {
        toaster.add({
          name: `error-${index}`,
          title: `Ошибка ${index + 1}: ${error}`,
          theme: "danger",
          autoHiding: 6000,
        });
      });
      
      // Показываем предупреждения
      detailedWarnings.forEach((warning, index) => {
        toaster.add({
          name: `warning-${index}`,
          title: `Предупреждение ${index + 1}: ${warning}`,
          theme: "warning",
          autoHiding: 5000,
        });
      });
      
      return;
    }

    // Показываем предупреждения о времени, если нет критических ошибок
    if (timeSummary.hasWarnings) {
      const detailedWarnings = getDetailedValidationWarnings(timeValidationResults);
      detailedWarnings.forEach((warning, index) => {
        toaster.add({
          name: `time-warning-${index}`,
          title: `Предупреждение: ${warning}`,
          theme: "warning",
          autoHiding: 4000,
        });
      });
    }

    // Комплексная валидация данных только для текущего таба
    const validationResult = validateExportData({
      sources,
      arrangements: currentTabArrangements,
      timeOfRecords: currentTabTimeRecord
    });

    if (!validationResult.isValid) {
      setLoading(false);
      validationResult.errors.forEach(error => {
        toaster.add({
          name: "error",
          title: error,
          theme: "danger",
          autoHiding: 3000,
        });
      });
      return;
    }

    // Показываем предупреждения, если есть
    validationResult.warnings.forEach(warning => {
      toaster.add({
        name: "warning",
        title: warning,
        theme: "warning",
        autoHiding: 4000,
      });
    });

    // Показываем информацию о предполагаемом размере экспорта только для текущего таба
    const sizeEstimate = estimateExportSize(
      { sources, arrangements: currentTabArrangements, timeOfRecords: currentTabTimeRecord },
      exportSettings.extension,
      exportSettings.bitrate
    );

    if (sizeEstimate.estimatedSizeMB > 100) {
      toaster.add({
        name: "info",
        title: `Предполагаемый размер экспорта: ${sizeEstimate.estimatedSizeMB} МБ`,
        theme: "info",
        autoHiding: 5000,
      });
    }

    try {
      if (isTauriAvailable) {
        // ВСЕГДА используем Tauri когда приложение запущено как десктопное
        
        // Проверяем доступность FFmpeg
        const ffmpegCheck = await TauriAudioAPI.checkFFmpegAvailability();
        if (!ffmpegCheck.available) {
          throw new Error(`${ffmpegCheck.message}\n\nИнструкции по установке FFmpeg см. в документации проекта.`);
        }
        
        const tauriAPI = new TauriAudioAPI();
        const outputPath = await tauriAPI.exportAudio(
          sources,
          currentTabArrangements,
          currentTabTimeRecord,
          exportSettings,
          activeTab
        );

        toaster.add({
          name: "success",
          title: `Аудиофайл сохранен: ${outputPath}`,
          theme: "success",
          autoHiding: 5000,
        });
      } else {
        // Fallback на браузерную версию только если Tauri недоступен
        const recordDuration = (currentTabTimeRecord[activeTab].end.valueOf() - 
                               currentTabTimeRecord[activeTab].start.valueOf()) / 1000;
        
        // Предупреждение о ограничениях браузерной версии
        if (recordDuration > 1800) { // Больше 30 минут
          toaster.add({
            name: "browser-limitation",
            title: "Внимание: браузерная версия ограничена файлами до 30 минут. Для длинных записей используйте десктопную версию.",
            theme: "warning",
            autoHiding: 6000,
          });
        }
        
        if (recordDuration > 3600) { // Больше 1 часа - отказываем
          throw new Error("Для записей длиннее 1 часа требуется десктопная версия приложения");
        }

        const blobs = await renderAllAudios({
          sources,
          arrangements: currentTabArrangements,
          timeOfRecords: currentTabTimeRecord,
          format: exportSettings.extension,
          bitrate: exportSettings.bitrate,
          onProgress: (progressInfo) => {
            setProgress(progressInfo);
          }
        });

        // Скачиваем файлы
        for (const [name, blob] of Object.entries(blobs)) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${name}.${exportSettings.extension}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }

        toaster.add({
          name: "success",
          title: `Успешно экспортировано ${Object.keys(blobs).length} файл(ов)`,
          theme: "success",
          autoHiding: 3000,
        });
      }

      setLoading(false);
      setProgress(null);

    } catch (e) {
      console.error(e);
      setLoading(false);
      setProgress(null);
      
      const errorMessage = e instanceof Error ? e.message : "Произошла ошибка при экспорте";
      toaster.add({
        name: "error",
        title: errorMessage,
        theme: "danger",
        autoHiding: 4000,
      });
    }
  }

  return (
    <Flex direction="column" gap="2" style={{ width: "max-content" }}>
      <Button
        onClick={onClick}
        loading={loading}
        style={{ width: "max-content" }}
        view="action"
        disabled={loading}
      >
        {isTauriAvailable ? 
          `Экспортировать "${currentTabName}" (Нативно)` : 
          `Экспортировать "${currentTabName}" (Браузер)`
        }
      </Button>
      
      {progress && progress.stage !== 'completed' && (
        <Flex direction="column" gap="1" style={{ minWidth: "250px" }}>
          <Progress value={progress.progress} />
          <Text variant="caption-2" color="secondary">
            {progress.message}
            {/* {progress.recordName && ` (${progress.recordName})`} */}
          </Text>
        </Flex>
      )}
    </Flex>
  );
};

export default SaveButton;
