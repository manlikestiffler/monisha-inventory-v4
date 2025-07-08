import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { useAuthStore } from './stores/authStore';
import { ThemeProvider } from './components/ThemeProvider.jsx';

// Initialize the first user check
const initializeApp = async () => {
  try {
    // Check if this is the first user registration
    await useAuthStore.getState().initializeFirstUserCheck();
    
    // Get system theme preference
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    
    // Get stored theme or use system preference
    const storedTheme = localStorage.getItem('vite-ui-theme') || 'system';
    
    // Apply initial theme class
    document.documentElement.classList.add(storedTheme === 'system' ? systemTheme : storedTheme);
    
    // Proceed with rendering the app
    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <ThemeProvider defaultTheme={storedTheme} storageKey="vite-ui-theme">
          <App />
        </ThemeProvider>
      </React.StrictMode>
    );
  } catch (error) {
    console.error('Error initializing app:', error);
    
    // Render the app anyway, even if initialization failed
    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
          <App />
        </ThemeProvider>
      </React.StrictMode>
    );
  }
};

// Start the initialization process
initializeApp();
