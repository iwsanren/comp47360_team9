'use client';

import { useEffect, useState } from 'react';

const validateToken = async (setReady: any) => {
  try {
    const res = await fetch('/api/validation', {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) {
      console.warn("Token invalid or missing, requesting new token...");
      await fetch('/api/token', {
        method: 'POST',
        credentials: 'include',
      });
    }
  } catch (err) {
    console.error("Failed to validate token:", err);
  } finally {
    setReady(true)
  }
};

const AuthWrapper = ({ children }: Readonly<{
    children: React.ReactNode;
  }>) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Trigger the validation request immediately on component mount
    validateToken(setReady)

    // Then repeat the validation request every 50 minutes
    const interval = setInterval(() => validateToken(setReady), 50 * 60 * 1000); // 50 minutes

    // Clear the interval when the component unmounts
    return () => {
      clearInterval(interval);
    }
}, []);
  if (ready) {
    return <>{children}</>;
  }
}

export default AuthWrapper
