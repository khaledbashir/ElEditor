"use client";

import { useState, useEffect } from "react";

interface ClientOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * ClientOnly component that only renders children on the client side.
 * This prevents hydration mismatches for components that depend on browser APIs.
 */
export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [hasMounted, setHasMounted] = useState(false);

  // During SSR or before mount, render fallback
  if (!hasMounted) {
    return <>{fallback}</>;
  }

  // After mount on client, render children
  return <>{children}</>;
}