'use client';

import { useEffect } from 'react';

export default function AuthWrapper({ children }: Readonly<{
    children: React.ReactNode;
  }>) {
  useEffect(() => {
    // Trigger the validation request immediately on component mount
      fetch('/api/validation', {
      method: 'POST',
      credentials: 'include',
    });

    // Then repeat the validation request every 59 minutes
    const interval = setInterval(() =>  {
      fetch('/api/validation', {
        method: 'POST',
        credentials: 'include',
      });
    }, 59 * 60 * 1000); // 59 minutes

    // Clear the interval when the component unmounts
    return () => clearInterval(interval);
}, []);

  return <>{children}</>;
}
