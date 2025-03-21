import React from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './contexts/AuthContext';
import { MessageProvider } from './contexts/MessageContext';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

createRoot(rootElement).render(
  <React.StrictMode>
    <AuthProvider>
      <MessageProvider>
        <App />
        <Toaster position="bottom-right" />
      </MessageProvider>
    </AuthProvider>
  </React.StrictMode>
);