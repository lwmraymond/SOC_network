import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './euiIcons';
import './styles.css';
import './styles-differentiated.css';
import './styles-polish.css';
import { App } from './App';
import { AppErrorBoundary } from './AppErrorBoundary';
import { PlatformThemeProvider } from './theme';

const root = document.getElementById('root');
if (!root) throw new Error('Application root element was not found.');

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <PlatformThemeProvider><BrowserRouter><App /></BrowserRouter></PlatformThemeProvider>
    </AppErrorBoundary>
  </React.StrictMode>,
);
