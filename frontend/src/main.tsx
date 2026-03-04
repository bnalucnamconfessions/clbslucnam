import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import FontLoader from './components/FontLoader'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <FontLoader>
        <App />
      </FontLoader>
    </BrowserRouter>
  </React.StrictMode>
)
