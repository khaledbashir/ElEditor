"use client";

import { useEffect } from "react";

export function DevTools() {
  useEffect(() => {
    // React DevTools integration disabled for now
    // Can be re-enabled later if needed
    if (process.env.NODE_ENV === "development") {
      console.debug("React DevTools disabled to prevent import errors");
    }
  }, []);

  return null; // This component doesn't render anything
}
