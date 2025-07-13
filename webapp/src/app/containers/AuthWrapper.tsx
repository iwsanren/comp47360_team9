'use client';

import { useEffect } from 'react';

export default function AuthWrapper({ children }: Readonly<{
    children: React.ReactNode;
  }>) {
  useEffect(() => {
      fetch('/api/validation', {
      method: 'POST',
      credentials: 'include',
    });
  }, []);

  return <>{children}</>;
}
