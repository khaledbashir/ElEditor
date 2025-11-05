import { useState, useEffect, useRef } from 'react';
import { getBlockSuiteController } from '@/lib/blocksuite-control';

export function useBlockSuiteController() {
  const controllerRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialize controller
    const controller = getBlockSuiteController();
    controllerRef.current = controller;

    // Check if editor is ready
    const checkReady = () => {
      if (controller.editor && controller.page) {
        setIsReady(true);
        console.log("✅ BlockSuite controller hook ready");
      } else {
        // Check again in 500ms
        setTimeout(checkReady, 500);
      }
    };

    checkReady();

    return () => {
      // Cleanup if needed
      controllerRef.current = null;
    };
  }, []);

  return controllerRef.current;
}