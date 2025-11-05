/**
 * Component Stash System
 * 
 * A Sandpack-style component preview, save, and reuse functionality
 * with IndexedDB storage for persisting components across sessions.
 */

export interface StashedComponent {
  id: string;
  name: string;
  description: string;
  type: string;
  props: Record<string, any>;
  code: string;
  preview?: string;
  metadata: {
    createdAt: number;
    updatedAt: number;
    tags: string[];
    author?: string;
    version: string;
  };
}

export interface ComponentStashDB {
  components: StashedComponent[];
  categories: string[];
  settings: {
    maxComponents: number;
    autoSave: boolean;
  };
}

class ComponentStash {
  private dbName = 'ComponentStash';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create components store
        if (!db.objectStoreNames.contains('components')) {
          const componentStore = db.createObjectStore('components', { keyPath: 'id' });
          componentStore.createIndex('type', 'type', { unique: false });
          componentStore.createIndex('createdAt', 'metadata.createdAt', { unique: false });
          componentStore.createIndex('tags', 'metadata.tags', { unique: false, multiEntry: true });
        }

        // Create categories store
        if (!db.objectStoreNames.contains('categories')) {
          db.createObjectStore('categories', { keyPath: 'name' });
        }

        // Create settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }

  async saveComponent(component: Omit<StashedComponent, 'id' | 'metadata'>): Promise<string> {
    if (!this.db) await this.init();

    const id = `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    const stashedComponent: StashedComponent = {
      ...component,
      id,
      metadata: {
        createdAt: now,
        updatedAt: now,
        tags: component.metadata?.tags || [],
        version: '1.0.0',
        ...component.metadata,
      },
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['components'], 'readwrite');
      const store = transaction.objectStore('components');
      const request = store.put(stashedComponent);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(id);
    });
  }

  async updateComponent(id: string, updates: Partial<StashedComponent>): Promise<void> {
    if (!this.db) await this.init();

    const existing = await this.getComponent(id);
    if (!existing) throw new Error(`Component with id ${id} not found`);

    const updated: StashedComponent = {
      ...existing,
      ...updates,
      id,
      metadata: {
        ...existing.metadata,
        ...updates.metadata,
        updatedAt: Date.now(),
      },
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['components'], 'readwrite');
      const store = transaction.objectStore('components');
      const request = store.put(updated);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getComponent(id: string): Promise<StashedComponent | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['components'], 'readonly');
      const store = transaction.objectStore('components');
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async getAllComponents(): Promise<StashedComponent[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['components'], 'readonly');
      const store = transaction.objectStore('components');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  async getComponentsByType(type: string): Promise<StashedComponent[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['components'], 'readonly');
      const store = transaction.objectStore('components');
      const index = store.index('type');
      const request = index.getAll(type);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  async getComponentsByTag(tag: string): Promise<StashedComponent[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['components'], 'readonly');
      const store = transaction.objectStore('components');
      const index = store.index('tags');
      const request = index.getAll(tag);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  async deleteComponent(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['components'], 'readwrite');
      const store = transaction.objectStore('components');
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async searchComponents(query: string): Promise<StashedComponent[]> {
    const allComponents = await this.getAllComponents();
    const lowercaseQuery = query.toLowerCase();

    return allComponents.filter(component =>
      component.name.toLowerCase().includes(lowercaseQuery) ||
      component.description.toLowerCase().includes(lowercaseQuery) ||
      component.type.toLowerCase().includes(lowercaseQuery) ||
      component.metadata.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  async exportComponents(): Promise<string> {
    const components = await this.getAllComponents();
    return JSON.stringify({
      version: '1.0.0',
      exportedAt: Date.now(),
      components,
    }, null, 2);
  }

  async importComponents(jsonData: string): Promise<number> {
    const data = JSON.parse(jsonData);
    const components = data.components || [];

    let imported = 0;
    for (const component of components) {
      try {
        await this.saveComponent({
          name: component.name,
          description: component.description,
          type: component.type,
          props: component.props,
          code: component.code,
          preview: component.preview,
          metadata: {
            ...component.metadata,
            createdAt: Date.now(), // Reset creation time for import
            updatedAt: Date.now(),
          },
        });
        imported++;
      } catch (error) {
        console.error('Failed to import component:', component.name, error);
      }
    }

    return imported;
  }
}

// Singleton instance
export const componentStash = new ComponentStash();