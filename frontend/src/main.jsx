import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from "react-router-dom";
import LabContextProvider from './context/LabContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
  <BrowserRouter>
  <LabContextProvider>
    <App />
    </LabContextProvider>
    </BrowserRouter>
    </StrictMode>
  
)
