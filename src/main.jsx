// oxlint-disable react/only-export-components
import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { LoadingScreen } from './components/LoadingScreen.jsx'
import { AuthProvider } from './context/AuthContext.jsx'

const HomePage = lazy(() => import('./pages/HomePage.jsx'))
const PostPage = lazy(() => import('./pages/PostPage.jsx'))
const TimelinePage = lazy(() => import('./pages/TimelinePage.jsx'))
const AdminPage = lazy(() => import('./pages/AdminPage.jsx'))
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage.jsx'))
const AboutPage = lazy(() => import('./pages/AboutPage.jsx'))
const SuggestPage = lazy(() => import('./pages/SuggestPage.jsx'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'))

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<App />}>
              <Route index element={<HomePage />} />
              <Route path="post/:slug" element={<PostPage />} />
              <Route path="timeline/:timeline" element={<TimelinePage />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="suggest" element={<SuggestPage />} />
              <Route path="admin" element={<AdminPage />} />
              <Route path="admin/users" element={<AdminUsersPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)
