import '@fontsource-variable/anybody';
import '@fontsource-variable/source-sans-3';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { App } from './app/App';
import { PersistedProvider } from './app/PersistedProvider';
import { systemClock } from './platform/clock/systemClock';
import { appRoot } from './platform/dom/appRoot';
import { cryptoIdProvider } from './platform/ids/cryptoIdProvider';
import { createBrowserStorageAdapter } from './platform/storage/localStorageAdapter';
import './ui/global.css';

createRoot(appRoot()).render(
  <StrictMode>
    <HashRouter>
      <PersistedProvider
        adapter={createBrowserStorageAdapter()}
        clock={systemClock}
        ids={cryptoIdProvider}
      >
        <App />
      </PersistedProvider>
    </HashRouter>
  </StrictMode>,
);
