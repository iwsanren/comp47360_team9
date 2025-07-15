'use client';

import { useEffect } from 'react';

const validation = () => fetch('/api/validation', {
  method: 'POST',
  credentials: 'include',
});

export default function AuthWrapper({ children }: Readonly<{
    children: React.ReactNode;
  }>) {
  useEffect(() => {
    // Trigger the validation request immediately on component mount
    validation()

    // Then repeat the validation request every 59 minutes
    const interval = setInterval(() => validation(), 59 * 60 * 1000); // 59 minutes

    // Clear the interval when the component unmounts
    return () => clearInterval(interval);
}, []);

  return <>{children}</>;
}
