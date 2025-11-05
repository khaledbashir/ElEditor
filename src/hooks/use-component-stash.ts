"use client";

import { useState, useEffect, useCallback } from "react";
import { componentStash, StashedComponent } from "@/lib/component-stash";

export function useComponentStash() {
  const [components, setComponents] = useState<StashedComponent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load all components
  const loadComponents = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const allComponents = await componentStash.getAllComponents();
      setComponents(allComponents.sort((a, b) => b.metadata.updatedAt - a.metadata.updatedAt));
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save a new component
  const saveComponent = useCallback(async (componentData: Omit<StashedComponent, 'id' | 'metadata'>) => {
    try {
      const id = await componentStash.saveComponent(componentData);
      await loadComponents(); // Refresh the list
      return id;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [loadComponents]);

  // Update an existing component
  const updateComponent = useCallback(async (id: string, updates: Partial<StashedComponent>) => {
    try {
      await componentStash.updateComponent(id, updates);
      await loadComponents(); // Refresh the list
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [loadComponents]);

  // Delete a component
  const deleteComponent = useCallback(async (id: string) => {
    try {
      await componentStash.deleteComponent(id);
      await loadComponents(); // Refresh the list
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [loadComponents]);

  // Search components
  const searchComponents = useCallback(async (query: string) => {
    try {
      const results = await componentStash.searchComponents(query);
      return results;
    } catch (err) {
      setError(err as Error);
      return [];
    }
  }, []);

  // Get components by type
  const getComponentsByType = useCallback(async (type: string) => {
    try {
      const results = await componentStash.getComponentsByType(type);
      return results;
    } catch (err) {
      setError(err as Error);
      return [];
    }
  }, []);

  // Get components by tag
  const getComponentsByTag = useCallback(async (tag: string) => {
    try {
      const results = await componentStash.getComponentsByTag(tag);
      return results;
    } catch (err) {
      setError(err as Error);
      return [];
    }
  }, []);

  // Export components
  const exportComponents = useCallback(async () => {
    try {
      return await componentStash.exportComponents();
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  // Import components
  const importComponents = useCallback(async (jsonData: string) => {
    try {
      const imported = await componentStash.importComponents(jsonData);
      await loadComponents(); // Refresh the list
      return imported;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [loadComponents]);

  // Initialize on mount
  useEffect(() => {
    loadComponents();
  }, [loadComponents]);

  return {
    components,
    isLoading,
    error,
    loadComponents,
    saveComponent,
    updateComponent,
    deleteComponent,
    searchComponents,
    getComponentsByType,
    getComponentsByTag,
    exportComponents,
    importComponents,
  };
}