import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// De statische meta-tags in index.html zijn een fallback voor social-crawlers
// (die geen JS draaien). In de browser zet SeoHead/Helmet ze per pagina, dus
// verwijderen we de statische varianten om dubbele tags te voorkomen.
document
  .querySelectorAll(
    'head meta[name="description"]:not([data-rh]), head meta[property^="og:"]:not([data-rh]), head meta[name^="twitter:"]:not([data-rh]), head link[rel="canonical"]:not([data-rh])'
  )
  .forEach((el) => el.remove());

createRoot(document.getElementById("root")!).render(<App />);
