import { 
  Source, 
  Arrangement,
  AdType,
  Tab,
  TabsSync,
  ExportSettings
} from '../app/context/types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function getAudioDuration(file: File | Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const audio = new Audio(objectUrl);

    const onLoadedMetadata = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(audio.duration);
    };

    const onError = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load audio metadata"));
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("error", onError, { once: true });
  });
}

export interface ProjectFileMetadata {
  version: string;
  createdAt: string;
  modifiedAt: string;
  appVersion: string;
  totalRecords: number;
  totalSources: number;
  projectName: string;
}

export interface ProjectFileData {
  metadata: ProjectFileMetadata;
  sources: Array<Omit<Source, 'file'>>;
  arrangements: Record<string, Arrangement[]>;
  timeOfRecords: Record<string, { start: string; end: string }>;
  adTypes: AdType[];
  tabs: Tab[];
  tabsSync: TabsSync;
  exportSettings: ExportSettings;
}

/**
 * Сохраняет проект в файл с метаданными
 */
export async function saveProjectToFile(
  projectData: Omit<ProjectFileData, 'metadata'>,
  filename: string
): Promise<void> {
  try {
    const metadata: ProjectFileMetadata = {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      appVersion: '1.0.0',
      totalRecords: Object.keys(projectData.arrangements).length,
      totalSources: projectData.sources.length,
      projectName: filename
    };

    const fullData: ProjectFileData = {
      metadata,
      ...projectData
    };

    const dataToSave = JSON.stringify(fullData, null, 2);
    const blob = new Blob([dataToSave], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename + '.rgen';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('Проект сохранен:', filename);

  } catch (error) {
    console.error('Ошибка при сохранении проекта:', error);
    throw new Error(`Не удалось сохранить проект: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
  }
}

/**
 * Загружает проект из файла с валидацией и миграцией
 */
export async function loadProjectFromFile(file: File): Promise<ProjectFileData> {
  try {
    const data = await file.text();
    const projectData = JSON.parse(data) as ProjectFileData;

    // Валидация структуры файла
    if (!validateProjectFileStructure(projectData)) {
      throw new Error('Неверная структура файла проекта');
    }

    // Миграция старых версий
    const migratedData = migrateProjectData(projectData);

    console.log('Проект загружен:', migratedData.metadata.projectName || file.name);
    return migratedData;

  } catch (error) {
    console.error('Ошибка при загрузке проекта:', error);
    
    if (error instanceof SyntaxError) {
      throw new Error('Файл поврежден или имеет неверный формат JSON');
    }
    
    throw new Error(`Не удалось загрузить проект: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
  }
}

/**
 * Валидирует структуру файла проекта
 */
function validateProjectFileStructure(data: unknown): data is ProjectFileData {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const obj = data as Record<string, unknown>;

  // Проверяем обязательные поля
  const requiredFields = ['sources', 'arrangements', 'timeOfRecords'];
  for (const field of requiredFields) {
    if (!(field in obj)) {
      return false;
    }
  }

  // Проверяем типы
  if (!Array.isArray(obj.sources)) {
    return false;
  }

  if (typeof obj.arrangements !== 'object' || obj.arrangements === null) {
    return false;
  }

  if (typeof obj.timeOfRecords !== 'object' || obj.timeOfRecords === null) {
    return false;
  }

  return true;
}

/**
 * Мигрирует данные проекта с старых версий на новые
 */
function migrateProjectData(data: ProjectFileData): ProjectFileData {
  // Если нет метаданных, создаем их (старая версия)
  if (!data.metadata) {
    data.metadata = {
      version: '0.9.0', // Старая версия
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      appVersion: '1.0.0',
      totalRecords: Object.keys(data.arrangements).length,
      totalSources: data.sources.length,
      projectName: 'Migrated Project'
    };
  }

  // Добавляем недостающие поля
  if (!data.adTypes) {
    data.adTypes = [];
  }

  if (!data.tabs) {
    data.tabs = [];
  }

  if (!data.tabsSync) {
    data.tabsSync = {};
  }

  if (!data.exportSettings) {
    data.exportSettings = {
      bitrate: 128,
      extension: 'mp3'
    };
  }

  // Обновляем дату модификации
  data.metadata.modifiedAt = new Date().toISOString();
  data.metadata.version = '1.0.0';

  return data;
}

/**
 * Создает резервную копию текущего проекта
 */
export async function createBackup(
  projectData: Omit<ProjectFileData, 'metadata'>,
  prefix: string = 'backup'
): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${prefix}_${timestamp}`;
  
  await saveProjectToFile(projectData, filename);
}

/**
 * Получает информацию о файле проекта без полной загрузки
 */
export async function getProjectFileInfo(file: File): Promise<ProjectFileMetadata | null> {
  try {
    const data = await file.text();
    const projectData = JSON.parse(data);
    return projectData.metadata || null;

  } catch (error) {
    console.error('Ошибка при получении информации о файле:', error);
    return null;
  }
}

/**
 * Валидирует корректность данных проекта
 */
export function validateProjectData(projectData: Omit<ProjectFileData, 'metadata'>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Проверяем обязательные поля
    if (!projectData.sources || !Array.isArray(projectData.sources)) {
      errors.push('Отсутствуют или некорректные данные источников');
    }

    if (!projectData.arrangements || typeof projectData.arrangements !== 'object') {
      errors.push('Отсутствуют или некорректные данные объявлений');
    }

    if (!projectData.timeOfRecords || typeof projectData.timeOfRecords !== 'object') {
      errors.push('Отсутствуют или некорректные данные временных записей');
    }

    // Если базовая структура некорректна, возвращаем ошибки
    if (errors.length > 0) {
      return { isValid: false, errors, warnings };
    }

    // Проверяем источники
    if (projectData.sources.length === 0) {
      errors.push('Добавьте хотя бы один источник звука');
    }

    projectData.sources.forEach((source, index) => {
      if (!source.id || !source.title) {
        errors.push(`Источник ${index + 1}: отсутствует ID или название`);
      }
      if (!source.typeId) {
        warnings.push(`Источник "${source.title}": не назначен тип`);
      }
    });

    // Проверяем объявления
    const arrangementEntries = Object.entries(projectData.arrangements);
    const hasArrangements = arrangementEntries.some(([, arr]) => Array.isArray(arr) && arr.length > 0);
    
    if (!hasArrangements) {
      errors.push('Добавьте хотя бы одно объявление в записи');
    }

    // Проверяем каждую запись
    for (const [recordName, arrangements] of arrangementEntries) {
      if (!Array.isArray(arrangements)) {
        errors.push(`Запись "${recordName}": объявления должны быть массивом`);
        continue;
      }

      arrangements.forEach((arrangement, index) => {
        if (!arrangement.id) {
          errors.push(`Запись "${recordName}", объявление ${index + 1}: отсутствует ID`);
        }
        if (!arrangement.typeId) {
          warnings.push(`Запись "${recordName}", объявление ${index + 1}: не назначен тип источника`);
        }
      });
    }

    // Проверяем временные записи
    const timeRecordEntries = Object.entries(projectData.timeOfRecords);
    if (timeRecordEntries.length === 0) {
      errors.push('Создайте хотя бы одну временную запись');
    }

    // Проверяем связи между источниками и объявлениями
    const sourceTypeIds = new Set(projectData.sources.map(s => s.typeId).filter(Boolean));
    const arrangementTypeIds = new Set<string>();
    
    Object.values(projectData.arrangements).forEach(arr => {
      if (Array.isArray(arr)) {
        arr.forEach(arrangement => {
          if (arrangement.typeId) {
            arrangementTypeIds.add(arrangement.typeId);
          }
        });
      }
    });

    const missingSourceTypes = Array.from(arrangementTypeIds).filter(
      typeId => !sourceTypeIds.has(typeId)
    );

    if (missingSourceTypes.length > 0) {
      errors.push('Для некоторых объявлений отсутствуют соответствующие источники звука');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };

  } catch (error) {
    return {
      isValid: false,
      errors: [`Ошибка валидации: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`],
      warnings: []
    };
  }
}
