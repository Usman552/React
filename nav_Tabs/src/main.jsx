import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Tabs from './components/tabs.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Tabs />
  </StrictMode>,
)
