import { ThemeProvider } from "@gravity-ui/uikit";
import "@gravity-ui/uikit/styles/fonts.css";
import "@gravity-ui/uikit/styles/styles.css";
import ContextProvider from "./context";
import Router from "./router";
import "./styles/reset.css";
import { useEffect } from "react";

const App = () => {
  useEffect(() => {
    const update = async () => {
      try {
        // Проверяем доступность Tauri
        if (typeof window === 'undefined' || !(window as typeof window & { __TAURI__?: unknown }).__TAURI__) {
          console.log('Tauri API недоступен, пропускаем проверку обновлений');
          return;
        }

        const { check } = await import('@tauri-apps/plugin-updater');
        const { relaunch } = await import('@tauri-apps/plugin-process');

        const updateInfo = await check();
        if (updateInfo) {
          await updateInfo.downloadAndInstall();
          await relaunch();
        }
      } catch (error) {
        console.error('Ошибка при проверке обновлений:', error);
      }
    };

    update();
  }, []);
  useEffect(() => {
    const loadTauriModules = async () => {
      try {
        // Проверяем доступность Tauri
        if (typeof window === 'undefined' || !(window as typeof window & { __TAURI__?: unknown }).__TAURI__) {
          console.log('Tauri API недоступен, пропускаем проверку обновлений');
          return;
        }

        const { check } = await import('@tauri-apps/plugin-updater');
        const { relaunch } = await import('@tauri-apps/plugin-process');

        const updateInfo = await check();
        if (updateInfo) {
          await updateInfo.downloadAndInstall();
          await relaunch();
        }
      } catch (error) {
        console.error('Ошибка при проверке обновлений:', error);
      }
    };

    loadTauriModules();
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
