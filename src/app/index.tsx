import { ThemeProvider } from "@gravity-ui/uikit";
import "@gravity-ui/uikit/styles/fonts.css";
import "@gravity-ui/uikit/styles/styles.css";
import ContextProvider from "./context";
import Router from "./router";
import "./styles/reset.css";
import { useEffect } from "react";
import { TauriAudioAPI } from "../shared/tauriAudioAPI";

const App = () => {
  // Проверяем доступность Tauri и запускаем автоапдейт
  useEffect(() => {
    const checkTauriAndUpdate = async () => {
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
          
          if (asyncCheck) {
            // Tauri доступен, запускаем проверку обновлений
            console.log('Tauri доступен, проверяем обновления...');
            await checkForUpdates();
          }
        } catch (error) {
          console.log('Async Tauri check failed:', error);
          // Если асинхронная проверка не удалась, но базовая/расширенная сработала
          if (basicCheck || extendedCheck) {
            console.log('Trying updates anyway since basic checks passed...');
            await checkForUpdates();
          }
        }
      } else {
        console.log('Tauri недоступен, пропускаем проверку обновлений');
      }
    };

    const checkForUpdates = async () => {
      try {
        console.log('Начинаем проверку обновлений...');
        const { check } = await import('@tauri-apps/plugin-updater');
        const { relaunch } = await import('@tauri-apps/plugin-process');

        const updateInfo = await check();
        if (updateInfo) {
          console.log('Найдено обновление:', updateInfo);
          console.log('Загружаем и устанавливаем обновление...');
          await updateInfo.downloadAndInstall();
          console.log('Обновление установлено, перезапускаем приложение...');
          await relaunch();
        } else {
          console.log('Обновлений не найдено');
        }
      } catch (error) {
        console.error('Ошибка при проверке обновлений:', error);
      }
    };

    checkTauriAndUpdate();
  }, []);
  return (
    <ThemeProvider theme="light">
      <ContextProvider>
        <Router />
      </ContextProvider>
    </ThemeProvider>
  );
};

export default App;
