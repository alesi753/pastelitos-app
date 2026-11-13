import { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import ClientOrderView from './pages/ClientOrderView';

interface AppNavigationProps {
  adminToken: string | null;
  onLogout: () => void;
}

function AppNavigation({ adminToken, onLogout }: AppNavigationProps) {
  const { pathname } = useLocation();

  return (
    <nav className="app-navigation" aria-label="Navegación principal">
      <span className="app-brand"><span aria-hidden="true">✳</span> GLENBOCKY</span>
      {adminToken && pathname === '/admin' && (
        <button type="button" className="app-logout-button" onClick={onLogout}>
          Cerrar sesión
        </button>
      )}
    </nav>
  );
}

function App() {
  const [adminToken, setAdminToken] = useState(() => sessionStorage.getItem('adminToken'));

  const handleLogin = (token: string) => {
    sessionStorage.setItem('adminToken', token);
    setAdminToken(token);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminToken');
    setAdminToken(null);
  };

  return (
    <BrowserRouter>
      <AppNavigation adminToken={adminToken} onLogout={handleLogout} />

      <Routes>
        <Route path="/" element={<ClientOrderView />} />
        <Route
          path="/admin"
          element={adminToken ? <AdminDashboard /> : <AdminLogin onLogin={handleLogin} />}
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
