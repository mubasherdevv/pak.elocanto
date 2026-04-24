import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import './bones/registry'
import App from './App.jsx'

const rootElement = document.getElementById('root');
const initialData = window.__INITIAL_DATA__;

if (initialData && Object.keys(initialData).length > 0) {
  hydrateRoot(rootElement, <App />);
} else {
  createRoot(rootElement).render(<App />);
}
