'use client';

import { useEffect } from 'react';

const validateToken = async () => {
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
    }
  };

export default function AuthWrapper({ children }: Readonly<{
    children: React.ReactNode;
  }>) {
  useEffect(() => {
    // Trigger the validation request immediately on component mount
    validateToken()

    // Then repeat the validation request every 59 minutes
    const interval = setInterval(() => validateToken(), 59 * 60 * 1000); // 59 minutes

    // Clear the interval when the component unmounts
    return () => clearInterval(interval);
}, []);

  return <>{children}</>;
}
