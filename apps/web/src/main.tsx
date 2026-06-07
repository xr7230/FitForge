import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ToastProvider } from './components/ToastContext'
import App from './App'
import './index.css'

// Demo mode: intercept fetch to mock API on GitHub Pages
const isDemo = localStorage.getItem("fitforge_demo_mode") === "true";
if (isDemo) {
  const origFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (url.includes("/api/")) {
      const { handleDemoRequest } = await import("./demo/demoApi");
      return handleDemoRequest(url, init);
    }
    return origFetch(input, init);
  };
}


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename="/FitForge">
      <ToastProvider><App /></ToastProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
