import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Enable dark theme by default
if (typeof document !== 'undefined') {
  document.documentElement.classList.add('dark')
}

createRoot(document.getElementById("root")!).render(<App />);
