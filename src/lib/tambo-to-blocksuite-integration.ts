/**
 * Tambo AI to BlockSuite Integration Service
 * Enables seamless insertion of AI-generated components into BlockSuite documents
 */

import React, { useState, useEffect } from 'react';
import type { BlockSuiteEditor } from './blocksuite-control';
import { BlockSuiteSaveManager } from './blocksuite-save-utils';

export interface TamboComponentData {
  id: string;
  type: string;
  componentName: string;
  props: Record<string, any>;
  children?: TamboComponentData[];
  metadata?: {
    timestamp: number;
    threadId?: string;
    description?: string;
  };
}

export interface InsertOptions {
  position?: 'cursor' | 'end' | 'start';
  asBlock?: boolean;
  inline?: boolean;
  preserveState?: boolean;
}

/**
 * Core integration class for bridging Tambo AI components with BlockSuite
 */
export class TamboBlockSuiteIntegration {
  private editor: BlockSuiteEditor | null = null;
  private saveManager: BlockSuiteSaveManager | null = null;
  private componentCounter = 0;

  constructor() {}

  /**
   * Initialize integration with BlockSuite editor
   */
  initialize(editor: BlockSuiteSaveManager) {
    this.editor = editor.page || null;
    this.saveManager = editor;
    // console.log("🔥 TamboBlockSuite Integration initialized");
  }

  /**
   * Convert Tambo component to BlockSuite-compatible block
   */
  private componentToBlock(component: TamboComponentData): any {
    const blockId = `ai-component-${++this.componentCounter}`;
    
    switch (component.type) {
      case 'FormComponent':
        return this.formComponentToBlock(component, blockId);
      case 'Graph':
        return this.graphComponentToBlock(component, blockId);
      case 'Map':
        return this.mapComponentToBlock(component, blockId);
      case 'ControlBar':
        return this.controlBarToBlock(component, blockId);
      case 'MessageThreadFull':
        return this.chatComponentToBlock(component, blockId);
      default:
        return this.genericComponentToBlock(component, blockId);
    }
  }

  /**
   * Convert FormComponent to BlockSuite block
   */
  private formComponentToBlock(component: TamboComponentData, blockId: string): any {
    const formData = component.props;
    const fields = formData.fields || [];
    
    let html = `<div class="ai-form" data-component="form" data-id="${blockId}">`;
    html += `<h3>${component.props.title || 'AI Generated Form'}</h3>`;
    
    fields.forEach((field: any) => {
      const fieldId = `field-${field.name}`;
      html += `<div class="form-field">`;
      html += `<label for="${fieldId}">${field.label}</label>`;
      
      switch (field.type) {
        case 'text':
        case 'email':
        case 'password':
          html += `<input type="${field.type}" id="${fieldId}" name="${field.name}" ${field.required ? 'required' : ''} />`;
          break;
        case 'number':
          html += `<input type="number" id="${fieldId}" name="${field.name}" ${field.min ? `min="${field.min}"` : ''} ${field.max ? `max="${field.max}"` : ''} ${field.required ? 'required' : ''} />`;
          break;
        case 'textarea':
          html += `<textarea id="${fieldId}" name="${field.name}" ${field.required ? 'required' : ''}></textarea>`;
          break;
        case 'select':
          html += `<select id="${fieldId}" name="${field.name}" ${field.required ? 'required' : ''}>`;
          field.options?.forEach((option: any) => {
            html += `<option value="${option.value}">${option.label}</option>`;
          });
          html += `</select>`;
          break;
        case 'radio':
          field.options?.forEach((option: any) => {
            html += `<input type="radio" id="${fieldId}-${option.value}" name="${field.name}" value="${option.value}" />`;
            html += `<label for="${fieldId}-${option.value}">${option.label}</label>`;
          });
          break;
        case 'checkbox':
          field.options?.forEach((option: any) => {
            html += `<input type="checkbox" id="${fieldId}-${option.value}" name="${field.name}" value="${option.value}" />`;
            html += `<label for="${fieldId}-${option.value}">${option.label}</label>`;
          });
          break;
        case 'slider':
          html += `<input type="range" id="${fieldId}" name="${field.name}" min="${field.min || 0}" max="${field.max || 100}" value="${field.value || 50}" />`;
          break;
        case 'yes-no':
          html += `<select id="${fieldId}" name="${field.name}"><option value="yes">Yes</option><option value="no">No</option></select>`;
          break;
        default:
          html += `<input type="text" id="${fieldId}" name="${field.name}" />`;
      }
      
      html += `</div>`;
    });
    
    html += `<button type="submit">${formData.submitText || 'Submit'}</button>`;
    html += `</div>`;

    return {
      id: blockId,
      type: 'html',
      html,
      text: '',
      children: []
    };
  }

  /**
   * Convert Graph component to BlockSuite block
   */
  private graphComponentToBlock(component: TamboComponentData, blockId: string): any {
    const graphData = component.props;
    
    const html = `
    <div class="ai-graph" data-component="graph" data-id="${blockId}">
      <h3>📊 ${graphData.title || 'AI Generated Chart'}</h3>
      <div class="graph-container">
        <canvas id="chart-${blockId}" width="400" height="300"></canvas>
      </div>
      <script>
        // Initialize chart with Chart.js or similar
        const ctx = document.getElementById('chart-${blockId}').getContext('2d');
        // Chart initialization code would go here
      </script>
    </div>`;

    return {
      id: blockId,
      type: 'html',
      html,
      text: '',
      children: []
    };
  }

  /**
   * Convert Map component to BlockSuite block
   */
  private mapComponentToBlock(component: TamboComponentData, blockId: string): any {
    const mapData = component.props;
    
    const html = `
    <div class="ai-map" data-component="map" data-id="${blockId}">
      <h3>🗺️ ${mapData.title || 'AI Generated Map'}</h3>
      <div class="map-container">
        <div id="map-${blockId}" style="height: 300px; width: 100%;"></div>
      </div>
    </div>`;

    return {
      id: blockId,
      type: 'html',
      html,
      text: '',
      children: []
    };
  }

  /**
   * Convert ControlBar to BlockSuite block
   */
  private controlBarToBlock(component: TamboComponentData, blockId: string): any {
    const html = `
    <div class="ai-controlbar" data-component="controlbar" data-id="${blockId}">
      <h3>🎛️ AI Control Panel</h3>
      <div class="control-commands">
        <button>Quick Actions</button>
        <button>Settings</button>
        <button>Help</button>
      </div>
    </div>`;

    return {
      id: blockId,
      type: 'html',
      html,
      text: '',
      children: []
    };
  }

  /**
   * Convert Chat component to BlockSuite block
   */
  private chatComponentToBlock(component: TamboComponentData, blockId: string): any {
    const html = `
    <div class="ai-chat" data-component="chat" data-id="${blockId}">
      <h3>💬 AI Chat Interface</h3>
      <div class="chat-container">
        <!-- Chat interface would be embedded here -->
        <p><em>Chat interface embedded from Tambo AI</em></p>
      </div>
    </div>`;

    return {
      id: blockId,
      type: 'html',
      html,
      text: '',
      children: []
    };
  }

  /**
   * Generic component converter
   */
  private genericComponentToBlock(component: TamboComponentData, blockId: string): any {
    const html = `
    <div class="ai-component" data-component="${component.type.toLowerCase()}" data-id="${blockId}">
      <h3>🤖 AI Generated: ${component.componentName}</h3>
      <div class="component-props">
        <pre>${JSON.stringify(component.props, null, 2)}</pre>
      </div>
    </div>`;

    return {
      id: blockId,
      type: 'html',
      html,
      text: '',
      children: []
    };
  }

  /**
   * Insert component into BlockSuite document
   */
  async insertComponent(
    component: TamboComponentData,
    options: InsertOptions = {}
  ): Promise<boolean> {
    if (!this.editor || !this.saveManager) {
      // console.error("❌ TamboBlockSuite integration not initialized");
      return false;
    }

    try {
      const block = this.componentToBlock(component);
      
      // Add metadata to component
      block.metadata = {
        ...component.metadata,
        tamboComponentId: component.id,
        insertedAt: Date.now()
      };

      // Insert into BlockSuite at current cursor position or end
      const selection = this.editor.page?.selection;
      const blocks = this.editor.page?.blocks;
      
      if (blocks && blocks.length > 0) {
        blocks.push(block);
      }

      // Trigger auto-save
      if (this.saveManager) {
        await this.saveManager.saveDocument({
          format: 'json',
          includeAssets: true
        });
      }

      console.log('✅ Component inserted successfully:', component.componentName);
      return true;
    } catch (error) {
      console.error('❌ Failed to insert component:', error);
      return false;
    }
  }

  /**
   * Get all Tambo components from current document
   */
  getDocumentComponents(): TamboComponentData[] {
    if (!this.editor) return [];

    const components: TamboComponentData[] = [];
    const blocks = this.editor.page?.blocks || [];

    blocks.forEach((block: any) => {
      if (block.type === 'html' && block.html?.includes('data-component')) {
        const match = block.html.match(/data-component="([^"]+)"/);
        if (match) {
          components.push({
            id: block.id,
            type: match[1],
            componentName: match[1],
            props: { ...block.metadata },
            metadata: block.metadata
          });
        }
      }
    });

    return components;
  }

  /**
   * Remove component from document
   */
  removeComponent(componentId: string): boolean {
    if (!this.editor) return false;

    try {
      const blocks = this.editor.page?.blocks;
      if (blocks) {
        const index = blocks.findIndex((block: any) => block.id === componentId);
        if (index !== -1) {
          blocks.splice(index, 1);
          console.log('✅ Component removed:', componentId);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('❌ Failed to remove component:', error);
      return false;
    }
  }

  /**
   * Update component in document
   */
  updateComponent(componentId: string, updates: Partial<TamboComponentData>): boolean {
    if (!this.editor) return false;

    try {
      const blocks = this.editor.page?.blocks;
      if (blocks) {
        const block = blocks.find((b: any) => b.id === componentId);
        if (block && block.type === 'html') {
          const component = { ...updates } as TamboComponentData;
          const newBlock = this.componentToBlock(component);
          Object.assign(block, newBlock);
          console.log('✅ Component updated:', componentId);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('❌ Failed to update component:', error);
      return false;
    }
  }
}

/**
 * Singleton instance
 */
export const tamboBlockSuiteIntegration = new TamboBlockSuiteIntegration();

/**
 * React Hook for Tambo-BlockSuite integration
 */
export function useTamboBlockSuiteIntegration() {
  const [components, setComponents] = React.useState<TamboComponentData[]>([]);
  const [isIntegrating, setIsIntegrating] = React.useState(false);

  const insertComponent = async (
    component: TamboComponentData,
    options?: InsertOptions
  ) => {
    setIsIntegrating(true);
    try {
      const success = await tamboBlockSuiteIntegration.insertComponent(component, options);
      if (success) {
        setComponents(tamboBlockSuiteIntegration.getDocumentComponents());
      }
      return success;
    } finally {
      setIsIntegrating(false);
    }
  };

  const removeComponent = (componentId: string) => {
    const success = tamboBlockSuiteIntegration.removeComponent(componentId);
    if (success) {
      setComponents(tamboBlockSuiteIntegration.getDocumentComponents());
    }
    return success;
  };

  const updateComponent = (componentId: string, updates: Partial<TamboComponentData>) => {
    const success = tamboBlockSuiteIntegration.updateComponent(componentId, updates);
    if (success) {
      setComponents(tamboBlockSuiteIntegration.getDocumentComponents());
    }
    return success;
  };

  const refreshComponents = () => {
    setComponents(tamboBlockSuiteIntegration.getDocumentComponents());
  };

  return {
    components,
    isIntegrating,
    insertComponent,
    removeComponent,
    updateComponent,
    refreshComponents
  };
}