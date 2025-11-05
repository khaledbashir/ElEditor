"use client";

import { useState, useEffect } from "react";
import { useTambo } from "@tambo-ai/react";
import { z } from "zod";

export interface StashedComponent {
  id: string;
  name: string;
  description: string;
  component: React.ComponentType<any>;
  props: any;
  propsSchema: z.ZodTypeAny;
  thumbnail?: string;
  createdAt: Date;
  tags: string[];
}

export function useComponentStash() {
  const [stashedComponents, setStashedComponents] = useState<StashedComponent[]>([]);
  const { registerComponent } = useTambo();

  // Load from IndexedDB on mount
  useEffect(() => {
    loadStashedComponents();
  }, []);

  const loadStashedComponents = async () => {
    try {
      const db = await getComponentStashDB();
      const transaction = db.transaction(['components'], 'readonly');
      const store = transaction.objectStore('components');
      const request = store.getAll();

      request.onsuccess = () => {
        setStashedComponents(request.result);
      };

      request.onerror = () => {
        console.error('Failed to load stashed components:', request.error);
      };
    } catch (error) {
      console.error('Failed to load stashed components:', error);
    }
  };

  const saveComponent = async (component: Omit<StashedComponent, 'id' | 'createdAt'>) => {
    const newComponent: StashedComponent = {
      ...component,
      id: `stash-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      createdAt: new Date(),
    };

    try {
      // Save to IndexedDB
      const db = await getComponentStashDB();
      const transaction = db.transaction(['components'], 'readwrite');
      const store = transaction.objectStore('components');

      return new Promise<StashedComponent>((resolve, reject) => {
        const request = store.put(newComponent);

        request.onsuccess = () => {
          // Register with Tambo for dynamic usage
          registerComponent({
            name: newComponent.name,
            description: newComponent.description,
            component: newComponent.component,
            propsSchema: newComponent.propsSchema,
          });

          // Update local state
          setStashedComponents(prev => [...prev, newComponent]);
          resolve(newComponent);
        };

        request.onerror = () => {
          console.error('Failed to save component:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Failed to save component:', error);
      throw error;
    }
  };

  const deleteComponent = async (id: string) => {
    try {
      const db = await getComponentStashDB();
      const transaction = db.transaction(['components'], 'readwrite');
      const store = transaction.objectStore('components');

      return new Promise<void>((resolve, reject) => {
        const request = store.delete(id);

        request.onsuccess = () => {
          setStashedComponents(prev => prev.filter(c => c.id !== id));
          resolve();
        };

        request.onerror = () => {
          console.error('Failed to delete component:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Failed to delete component:', error);
      throw error;
    }
  };

  const useComponent = async (stashedComponent: StashedComponent) => {
    // Register the component for immediate use
    registerComponent({
      name: stashedComponent.name,
      description: stashedComponent.description,
      component: stashedComponent.component,
      propsSchema: stashedComponent.propsSchema,
    });
  };

  return {
    stashedComponents,
    saveComponent,
    deleteComponent,
    useComponent,
    loadStashedComponents,
  };
}

// IndexedDB helper
async function getComponentStashDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ComponentStash', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('components')) {
        const store = db.createObjectStore('components', { keyPath: 'id' });
        store.createIndex('name', 'name', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
}