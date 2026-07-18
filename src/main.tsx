import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { EuiProvider } from '@elastic/eui';
import './euiIcons';
import './styles.css';
import { App } from './App';
import { AppErrorBoundary } from './AppErrorBoundary';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Application root element #root was not found.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <EuiProvider colorMode="light">
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </EuiProvider>
    </AppErrorBoundary>
  </React.StrictMode>,
);
