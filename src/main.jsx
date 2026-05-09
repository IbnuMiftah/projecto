import { createRoot } from 'react-dom/client';
import './styles/global.css';
import App from './App';
import { ThemeProvider } from './contexts/ThemeContext';

createRoot(document.getElementById('root')).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);
