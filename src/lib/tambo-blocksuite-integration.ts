/**
 * @file tambo-blocksuite-integration.ts
 * @description Integration between Tambo AI components and BlockSuite documents
 * 
 * This module provides functionality to insert Tambo-generated components
 * as rich content into BlockSuite documents.
 */

import { getBlockSuiteController } from "./blocksuite-control";

// Component type definitions
export interface InsertableComponent {
  id: string;
  name: string;
  type: 'form' | 'chart' | 'map' | 'card' | 'table' | 'list' | 'custom';
  content: string;
  metadata?: Record<string, any>;
  props?: Record<string, any>;
}

export interface ComponentInsertionResult {
  success: boolean;
  blockId?: string;
  error?: string;
}

export class TamboBlockSuiteIntegration {
  private controller = getBlockSuiteController();

  /**
   * Insert a Tambo-generated component into the BlockSuite document
   */
  async insertComponent(component: InsertableComponent): Promise<ComponentInsertionResult> {
    try {
      let success = false;

      switch (component.type) {
        case 'form':
          success = await this.insertFormComponent(component);
          break;
        case 'chart':
          success = await this.insertChartComponent(component);
          break;
        case 'map':
          success = await this.insertMapComponent(component);
          break;
        case 'card':
          success = await this.insertCardComponent(component);
          break;
        case 'table':
          success = await this.insertTableComponent(component);
          break;
        case 'list':
          success = await this.insertListComponent(component);
          break;
        case 'custom':
          success = await this.insertCustomComponent(component);
          break;
        default:
          success = await this.insertTextComponent(component);
      }

      return {
        success,
        blockId: component.id,
        error: success ? undefined : 'Failed to insert component'
      };
    } catch (error) {
      console.error('Failed to insert component:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Insert a form component as structured content
   */
  private async insertFormComponent(component: InsertableComponent): Promise<boolean> {
    try {
      // Add heading for the form
      await this.controller.addHeading(`AI Generated Form: ${component.name}`, 2);
      
      // Add description if available
      if (component.metadata?.description) {
        await this.controller.addTextBlock(component.metadata.description);
      }

      // Add form fields as a structured list
      const formFields = component.props?.fields || [];
      if (formFields.length > 0) {
        const fieldLabels = formFields.map((field: any) => 
          `${field.label || field.name} (${field.type})`
        );
        await this.controller.addListBlock(fieldLabels, false);
      }

      // Add the component as a code block for now (can be enhanced later)
      const componentJson = JSON.stringify(component, null, 2);
      await this.controller.addCodeBlock(componentJson, 'json');

      return true;
    } catch (error) {
      console.error('Failed to insert form component:', error);
      return false;
    }
  }

  /**
   * Insert a chart component
   */
  private async insertChartComponent(component: InsertableComponent): Promise<boolean> {
    try {
      await this.controller.addHeading(`Data Visualization: ${component.name}`, 2);
      
      // Add chart description
      if (component.metadata?.title) {
        await this.controller.addTextBlock(`Chart: ${component.metadata.title}`);
      }

      // Add chart data as a table if available
      if (component.props?.data) {
        await this.insertChartDataAsTable(component.props.data);
      }

      // Add chart configuration as code
      const chartConfig = {
        type: component.props?.type || 'bar',
        title: component.metadata?.title,
        data: component.props?.data
      };
      await this.controller.addCodeBlock(JSON.stringify(chartConfig, null, 2), 'json');

      return true;
    } catch (error) {
      console.error('Failed to insert chart component:', error);
      return false;
    }
  }

  /**
   * Insert map component
   */
  private async insertMapComponent(component: InsertableComponent): Promise<boolean> {
    try {
      await this.controller.addHeading(`Interactive Map: ${component.name}`, 2);
      
      const mapInfo = [
        `Type: ${component.props?.type || 'Interactive Map'}`,
        `Markers: ${component.props?.markers?.length || 0}`,
        `Center: ${component.props?.center?.lat || 'N/A'}, ${component.props?.center?.lng || 'N/A'}`,
        `Zoom: ${component.props?.zoom || 'Default'}`
      ];

      await this.controller.addListBlock(mapInfo, false);
      
      // Add map configuration
      const mapConfig = {
        center: component.props?.center,
        zoom: component.props?.zoom,
        markers: component.props?.markers,
        style: component.props?.style
      };
      await this.controller.addCodeBlock(JSON.stringify(mapConfig, null, 2), 'json');

      return true;
    } catch (error) {
      console.error('Failed to insert map component:', error);
      return false;
    }
  }

  /**
   * Insert card component
   */
  private async insertCardComponent(component: InsertableComponent): Promise<boolean> {
    try {
      await this.controller.addHeading(`Card: ${component.name}`, 2);
      
      // Add card content
      if (component.content) {
        await this.controller.addTextBlock(component.content);
      }

      // Add card properties as a list
      const cardProperties = [];
      if (component.props?.title) cardProperties.push(`Title: ${component.props.title}`);
      if (component.props?.subtitle) cardProperties.push(`Subtitle: ${component.props.subtitle}`);
      if (component.props?.description) cardProperties.push(`Description: ${component.props.description}`);
      if (component.props?.actions?.length) cardProperties.push(`Actions: ${component.props.actions.length} available`);

      if (cardProperties.length > 0) {
        await this.controller.addListBlock(cardProperties, false);
      }

      return true;
    } catch (error) {
      console.error('Failed to insert card component:', error);
      return false;
    }
  }

  /**
   * Insert table component
   */
  private async insertTableComponent(component: InsertableComponent): Promise<boolean> {
    try {
      await this.controller.addHeading(`Table: ${component.name}`, 2);
      
      // Create table with component data
      const tableData = component.props?.data || [];
      if (tableData.length > 0) {
        const rows = Math.min(tableData.length + 1, 10); // Limit to 10 rows
        const cols = Math.min(Object.keys(tableData[0] || {}).length + 1, 6); // Limit to 6 columns
        
        await this.controller.addTableBlock(rows, cols);
      }

      return true;
    } catch (error) {
      console.error('Failed to insert table component:', error);
      return false;
    }
  }

  /**
   * Insert list component
   */
  private async insertListComponent(component: InsertableComponent): Promise<boolean> {
    try {
      await this.controller.addHeading(`List: ${component.name}`, 2);
      
      const listItems = component.props?.items || [];
      const isOrdered = component.props?.ordered || false;
      
      if (listItems.length > 0) {
        await this.controller.addListBlock(listItems, isOrdered);
      }

      return true;
    } catch (error) {
      console.error('Failed to insert list component:', error);
      return false;
    }
  }

  /**
   * Insert custom component as code block
   */
  private async insertCustomComponent(component: InsertableComponent): Promise<boolean> {
    try {
      await this.controller.addHeading(`Custom Component: ${component.name}`, 2);
      
      if (component.content) {
        await this.controller.addTextBlock(component.content);
      }

      // Add component configuration
      const componentConfig = {
        name: component.name,
        type: component.type,
        props: component.props,
        metadata: component.metadata
      };
      
      await this.controller.addCodeBlock(JSON.stringify(componentConfig, null, 2), 'json');

      return true;
    } catch (error) {
      console.error('Failed to insert custom component:', error);
      return false;
    }
  }

  /**
   * Insert as text component (fallback)
   */
  private async insertTextComponent(component: InsertableComponent): Promise<boolean> {
    try {
      await this.controller.addHeading(component.name, 2);
      await this.controller.addTextBlock(component.content || 'No content available');
      return true;
    } catch (error) {
      console.error('Failed to insert text component:', error);
      return false;
    }
  }

  /**
   * Insert chart data as a table
   */
  private async insertChartDataAsTable(data: any): Promise<boolean> {
    try {
      if (!data.labels || !data.datasets) return false;

      const rows = data.labels.length + 1; // +1 for header
      const cols = data.datasets.length + 1; // +1 for labels column

      if (rows > 1 && cols > 1) {
        await this.controller.addTableBlock(Math.min(rows, 10), Math.min(cols, 6));
      }

      return true;
    } catch (error) {
      console.error('Failed to insert chart data as table:', error);
      return false;
    }
  }

  /**
   * Convert a Tambo message component to an insertable component
   */
  convertTamboMessageToInsertable(message: any): InsertableComponent | null {
    if (!message.renderedComponent) return null;

    // Extract component information from the rendered component
    const component = message.renderedComponent;
    
    return {
      id: message.id,
      name: this.extractComponentName(component),
      type: this.determineComponentType(component),
      content: this.extractComponentContent(component),
      metadata: this.extractComponentMetadata(component),
      props: this.extractComponentProps(component)
    };
  }

  /**
   * Extract component name from rendered component
   */
  private extractComponentName(component: any): string {
    if (component?.props?.title) return component.props.title;
    if (component?.type?.name) return component.type.name;
    if (component?.name) return component.name;
    return 'AI Generated Component';
  }

  /**
   * Determine component type
   */
  private determineComponentType(component: any): InsertableComponent['type'] {
    const name = this.extractComponentName(component).toLowerCase();
    
    if (name.includes('form')) return 'form';
    if (name.includes('chart') || name.includes('graph')) return 'chart';
    if (name.includes('map')) return 'map';
    if (name.includes('card')) return 'card';
    if (name.includes('table')) return 'table';
    if (name.includes('list')) return 'list';
    
    return 'custom';
  }

  /**
   * Extract component content
   */
  private extractComponentContent(component: any): string {
    if (typeof component === 'string') return component;
    if (component?.props?.children) return String(component.props.children);
    return 'AI Generated Content';
  }

  /**
   * Extract component metadata
   */
  private extractComponentMetadata(component: any): Record<string, any> {
    return {
      description: component?.props?.description,
      variant: component?.props?.variant,
      size: component?.props?.size
    };
  }

  /**
   * Extract component props
   */
  private extractComponentProps(component: any): Record<string, any> {
    return component?.props || {};
  }

  /**
   * Batch insert multiple components
   */
  async insertMultipleComponents(components: InsertableComponent[]): Promise<ComponentInsertionResult[]> {
    const results: ComponentInsertionResult[] = [];
    
    for (const component of components) {
      const result = await this.insertComponent(component);
      results.push(result);
      
      // Add a small delay between insertions for better UX
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
  }
}

// Global instance
let _integration: TamboBlockSuiteIntegration | null = null;

export function getTamboBlockSuiteIntegration(): TamboBlockSuiteIntegration {
  if (!_integration) {
    _integration = new TamboBlockSuiteIntegration();
  }
  return _integration;
}