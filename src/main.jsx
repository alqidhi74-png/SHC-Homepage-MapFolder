import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import App from './App.jsx'
import LoginPage from './components/Login/LoginPage.jsx'

import Dashboard from './dashboard'
import RequireAdmin from './auth/RequireAdmin.jsx'

import { AdminAuthProvider } from './auth/AdminAuth.jsx'
import { PageTransitionProvider } from './components/PageTransition/PageTransitionProvider.jsx'

import './styles.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AdminAuthProvider>
        <PageTransitionProvider>

          <Routes>

            <Route
              path="/login"
              element={<LoginPage />}
            />

            <Route
              path="/dashboard"
              element={
                <RequireAdmin>
                  <Dashboard />
                </RequireAdmin>
              }
            />

            <Route
              path="*"
              element={<App />}
            />

          </Routes>

        </PageTransitionProvider>
      </AdminAuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)