/*
  Block: Frontend entrypoint

  - Ten plik (`main.jsx`) tylko mountuje Reacta i uruchamia aplikację.
  - Jeśli chcesz zmienić globalne wrappery (np. provider, router), dodaj je tutaj.
*/
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
