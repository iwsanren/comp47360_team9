import { useState, useEffect } from 'react';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  const authenticate = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await fetch('/api/validation', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      });
    }
  };

  useEffect(() => {
    authenticate();
    
    // Refresh token every 59 minutes
    const interval = setInterval(authenticate, 59 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    ...authState,
    authenticate,
  };
};

// Helper function for authenticated API calls
export const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
  });

  if (response.status === 401) {
    // Token expired, try to refresh
    const authResponse = await fetch('/api/validation', {
      method: 'POST',
      credentials: 'include',
    });

    if (authResponse.ok) {
      // Retry original request
      return fetch(url, {
        ...options,
        credentials: 'include',
      });
    }
  }

  return response;
};
