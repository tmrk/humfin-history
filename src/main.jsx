import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@fontsource/noto-sans/400.css';
import '@fontsource/noto-sans/500.css';
import '@fontsource/noto-sans/700.css';
import '@fontsource/noto-serif/400.css';
import '@fontsource/noto-serif/400-italic.css';
import '@fontsource/noto-serif/700.css';
import '@fontsource/noto-sans-mono/400.css';
import '@fontsource/noto-sans-mono/500.css';
import './styles.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
