import { useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage/LoginPage';
import MainLayout from './components/Layout/MainLayout';

export default function App() {
  const { user } = useAuth();
  return user ? <MainLayout /> : <LoginPage />;
}
