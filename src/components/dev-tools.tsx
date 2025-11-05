"use client";

import { useEffect } from "react";

export function DevTools() {
  useEffect(() => {
    // Only load React DevTools in development
    if (process.env.NODE_ENV === "development") {
      import("react-devtools").then((devtools) => {
        devtools.install();
      });
    }
  }, []);

  return null; // This component doesn't render anything
}
