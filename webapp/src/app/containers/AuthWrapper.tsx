'use client';

import { useEffect } from 'react';

export default function AuthWrapper({ children }: Readonly<{
    children: React.ReactNode;
  }>) {
  useEffect(() => {
    const interval = setInterval(() =>  {
      fetch('/api/validation', {
        method: 'POST',
        credentials: 'include',
      });
    }, 59 * 50 * 1000) // refresh every 59 mins
    return () => clearInterval(interval);
  }, []);

  return <>{children}</>;
}
