import { BrowserRouter } from 'react-router-dom';
import Routes from './Routes';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';
import { useAuthStore } from './stores/authStore';
import { auth } from './config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect } from 'react';

function App() {
  const { setUser, fetchUserProfile } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        await fetchUserProfile(user.uid);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, [setUser, fetchUserProfile]);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
