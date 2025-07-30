'use client';

import { useEffect, useState } from 'react';

const validateToken = async (setReady: any) => {
  try {
    const res = await fetch('/api/validation', {
      method: 'POST',
      credentials: 'include',
    })
    if (!res.ok) {
      console.warn("Token invalid or missing, requesting new token...");
      await fetch('/api/token', {
        method: 'POST',
        credentials: 'include',
      })
    }
    setReady(true);
  } catch (err) {
    console.error("Failed to validate token:", err);
    setReady('Please refresh the website, thanks')
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
  if (typeof ready == 'string') {
    return <div className="flex justify-center items-center h-[100dvh] text-xl">{ready}</div>;
  }
  if (ready) {
    return <>{children}</>;
  }
}

export default AuthWrapper
