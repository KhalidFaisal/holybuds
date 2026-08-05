'use client';

import { useEffect, useRef } from 'react';
import { SessionProvider, useSession } from 'next-auth/react';
import posthog from 'posthog-js';

function PostHogIdentity() {
  const { data: session, status } = useSession();
  const previousUserId = useRef(null);
  const user = session?.user;

  useEffect(() => {
    if (status === 'authenticated' && user?.id) {
      if (previousUserId.current && previousUserId.current !== user.id) {
        posthog.reset();
      }

      posthog.identify(user.id, {
        email: user.email,
        name: user.name,
      });
      previousUserId.current = user.id;
    } else if (status === 'unauthenticated' && previousUserId.current) {
      posthog.reset();
      previousUserId.current = null;
    }
  }, [status, user?.id, user?.email, user?.name]);

  return null;
}

export default function AuthProvider({ children }) {
  return (
    <SessionProvider>
      <PostHogIdentity />
      {children}
    </SessionProvider>
  );
}
