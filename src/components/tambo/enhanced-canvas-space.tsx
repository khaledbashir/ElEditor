/**
 * Enhanced CanvasSpace Component for Mini-App Creation
 * Dedicated rendering area that displays generated components in a clean workspace
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Layout, 
  Maximize, 
  Minimize, 
  RotateCcw, 
  Trash2, 
  Copy, 
  Share, 
  Download, 
  Eye, 
  Settings,
  Grid,
  Layers,
  ArrowLeft,
  Plus,
  Sparkles,
  Play,
  Pause,
  RotateCw,
  Save
} from 'lucide-react';
import { useTamboContext, useTamboComponentState } from '@tambo-ai/react';

export interface CanvasElement {
  id: string;
  type: 'component' | 'text' | 'image' | 'shape';
  componentName?: string;
  props?: any;
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation?: number;
  zIndex?: number;
  locked?: boolean;
  selected?: boolean;
  metadata?: {
    createdAt: number;
    updatedAt: number;
    author?: string;
    tags?: string[];
  };
}

export interface CanvasProject {
  id: string;
  name: string;
  description?: string;
  elements: CanvasElement[];
  canvasSettings: {
    width: number;
    height: number;
    background: string;
    grid: boolean;
    snapToGrid: boolean;
  };
  metadata: {
    createdAt: number;
    updatedAt: number;
    version: string;
  };
}

export interface EnhancedCanvasSpaceProps {
  initialElements?: CanvasElement[];
  onElementsChange?: (elements: CanvasElement[]) => void;
  onProjectSave?: (project: CanvasProject) => void;
  showGrid?: boolean;
  snapToGrid?: boolean;
  readonly?: boolean;
  theme?: 'light' | 'dark';
  previewMode?: boolean;
}

const DEFAULT_CANVAS_SETTINGS = {
  width: 1200,
  height: 800,
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  grid: true,
  snapToGrid: true
};

/**
 * Beautiful Enhanced CanvasSpace Component for Mini-App Creation
 */
export function EnhancedCanvasSpace({
  initialElements = [],
  onElementsChange,
  onProjectSave,
  showGrid = true,
  snapToGrid = true,
  readonly = false,
  theme = 'light',
  previewMode = false
}: EnhancedCanvasSpaceProps) {
  const [elements, setElements] = useState<CanvasElement[]>(initialElements);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [canvasSettings, setCanvasSettings] = useState(DEFAULT_CANVAS_SETTINGS);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [showGridLines, setShowGridLines] = useState(showGrid);
  const [playMode, setPlayMode] = useState(false);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const projectNameRef = useRef<string>('My Mini App');

  const { state: tamboState } = useTamboContext();
  const { state: componentState } = useTamboComponentState();

  // Update elements when props change
  useEffect(() => {
    if (initialElements.length > 0) {
      setElements(initialElements);
    }
  }, [initialElements]);

  // Notify parent of element changes
  useEffect(() => {
    onElementsChange?.(elements);
  }, [elements, onElementsChange]);

  // Snap to grid utility
  const snapToGridValue = useCallback((value: number, gridSize = 10) => {
    if (!snapToGrid || !showGridLines) return value;
    return Math.round(value / gridSize) * gridSize;
  }, [snapToGrid, showGridLines]);

  // Add new element to canvas
  const addElement = useCallback((element: Omit<CanvasElement, 'id' | 'metadata'>) => {
    const newElement: CanvasElement = {
      ...element,
      id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    };
    
    setElements(prev => [...prev, newElement]);
    return newElement.id;
  }, []);

  // Remove element from canvas
  const removeElement = useCallback((elementId: string) => {
    setElements(prev => prev.filter(el => el.id !== elementId));
    if (selectedElement === elementId) {
      setSelectedElement(null);
    }
  }, [selectedElement]);

  // Update element
  const updateElement = useCallback((elementId: string, updates: Partial<CanvasElement>) => {
    setElements(prev => prev.map(el => 
      el.id === elementId 
        ? { 
            ...el, 
            ...updates, 
            metadata: { ...el.metadata, updatedAt: Date.now() }
          }
        : el
    ));
  }, []);

  // Handle mouse events
  const handleMouseDown = useCallback((e: React.MouseEvent, elementId?: string) => {
    if (readonly || previewMode) return;

    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    const mouseX = (e.clientX - canvasRect.left - panOffset.x) / zoom;
    const mouseY = (e.clientY - canvasRect.top - panOffset.y) / zoom;

    if (elementId) {
      // Start dragging element
      const element = elements.find(el => el.id === elementId);
      if (element && !element.locked) {
        setSelectedElement(elementId);
        setIsDragging(true);
        setDragOffset({
          x: mouseX - element.position.x,
          y: mouseY - element.position.y
        });
      }
    } else {
      // Start panning
      setIsPanning(true);
      setSelectedElement(null);
    }

    e.preventDefault();
  }, [elements, readonly, previewMode, zoom, panOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (readonly || previewMode) return;

    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    const mouseX = (e.clientX - canvasRect.left - panOffset.x) / zoom;
    const mouseY = (e.clientY - canvasRect.top - panOffset.y) / zoom;

    if (isDragging && selectedElement) {
      // Update element position
      const newX = snapToGridValue(mouseX - dragOffset.x);
      const newY = snapToGridValue(mouseY - dragOffset.y);
      
      updateElement(selectedElement, {
        position: { x: Math.max(0, newX), y: Math.max(0, newY) }
      });
    } else if (isPanning) {
      // Update pan offset
      const deltaX = e.movementX;
      const deltaY = e.movementY;
      
      setPanOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
    }
  }, [isDragging, isPanning, selectedElement, dragOffset, zoom, panOffset, snapToGridValue, updateElement, readonly, previewMode]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsPanning(false);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (readonly || previewMode) return;

      // Delete selected element
      if (e.key === 'Delete' && selectedElement) {
        removeElement(selectedElement);
      }

      // Copy element
      if (e.key === 'c' && (e.metaKey || e.ctrlKey) && selectedElement) {
        const element = elements.find(el => el.id === selectedElement);
        if (element) {
          const duplicatedElement = {
            ...element,
            position: {
              x: element.position.x + 20,
              y: element.position.y + 20
            }
          };
          addElement(duplicatedElement);
        }
      }

      // Zoom controls
      if (e.key === '=' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setZoom(prev => Math.min(prev + 0.1, 3));
      }
      if (e.key === '-' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setZoom(prev => Math.max(prev - 0.1, 0.1));
      }
      if (e.key === '0' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setZoom(1);
        setPanOffset({ x: 0, y: 0 });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedElement, elements, removeElement, addElement, readonly, previewMode]);

  // Save project
  const saveProject = useCallback(() => {
    const project: CanvasProject = {
      id: `project-${Date.now()}`,
      name: projectNameRef.current,
      elements,
      canvasSettings,
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: '1.0.0'
      }
    };

    // Export as JSON
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectNameRef.current.replace(/\s+/g, '_')}.json`;
    link.click();
    URL.revokeObjectURL(url);

    onProjectSave?.(project);
  }, [elements, canvasSettings, onProjectSave]);

  // Load project
  const loadProject = useCallback((projectData: CanvasProject) => {
    setElements(projectData.elements);
    setCanvasSettings(projectData.canvasSettings);
    projectNameRef.current = projectData.name;
  }, []);

  // Clear canvas
  const clearCanvas = useCallback(() => {
    if (confirm('Are you sure you want to clear the canvas?')) {
      setElements([]);
      setSelectedElement(null);
    }
  }, []);

  // Render grid
  const renderGrid = () => {
    if (!showGridLines) return null;

    const gridSize = 20;
    const width = canvasSettings.width;
    const height = canvasSettings.height;

    return (
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, #000 1px, transparent 1px),
            linear-gradient(to bottom, #000 1px, transparent 1px)
          `,
          backgroundSize: `${gridSize * zoom}px ${gridSize * zoom}px`,
          transform: `translate(${panOffset.x}px, ${panOffset.y}px)`
        }}
      />
    );
  };

  // Render element
  const renderElement = (element: CanvasElement) => {
    const isSelected = element.id === selectedElement;
    
    return (
      <div
        key={element.id}
        className={`absolute cursor-pointer transition-all duration-200 ${
          isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''
        } ${element.locked ? 'cursor-not-allowed opacity-75' : ''}`}
        style={{
          left: element.position.x,
          top: element.position.y,
          width: element.size.width,
          height: element.size.height,
          transform: `rotate(${element.rotation || 0}deg)`,
          zIndex: element.zIndex || 1
        }}
        onMouseDown={(e) => handleMouseDown(e, element.id)}
      >
        {/* Element Content */}
        <div className="w-full h-full bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          {element.type === 'component' && (
            <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gradient-to-br from-blue-50 to-purple-50">
              <div className="text-center">
                <Sparkles className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                <div className="text-sm font-medium">{element.componentName}</div>
              </div>
            </div>
          )}
          
          {element.type === 'text' && (
            <div className="w-full h-full flex items-center justify-center text-gray-700 bg-yellow-50">
              <span className="text-lg font-medium">Text Element</span>
            </div>
          )}
          
          {element.type === 'image' && (
            <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-50">
              <span className="text-sm">📷 Image Placeholder</span>
            </div>
          )}
          
          {element.type === 'shape' && (
            <div className="w-full h-full bg-gradient-to-br from-green-400 to-blue-500 rounded-lg"></div>
          )}
        </div>

        {/* Selection Handles */}
        {isSelected && !readonly && !previewMode && (
          <div className="absolute -inset-2 border-2 border-blue-500 rounded-lg pointer-events-none">
            {/* Corner handles for resize */}
            <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`enhanced-canvas-space ${theme === 'dark' ? 'dark' : ''}`}>
      {/* Toolbar */}
      {!previewMode && (
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <input
              ref={projectNameRef as any}
              defaultValue="My Mini App"
              className="text-lg font-semibold bg-transparent border-none outline-none"
              placeholder="Project Name"
              onChange={(e) => {}}
            />
            
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>{elements.length} elements</span>
              <span>•</span>
              <span>Zoom: {Math.round(zoom * 100)}%</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Play Mode Toggle */}
            <button
              onClick={() => setPlayMode(!playMode)}
              className={`p-2 rounded-lg transition-colors ${
                playMode ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
              title={playMode ? 'Exit Play Mode' : 'Enter Play Mode'}
            >
              {playMode ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            {/* Zoom Controls */}
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.1))}
                className="p-1 text-gray-600 hover:text-gray-800"
                title="Zoom Out"
              >
                -
              </button>
              <span className="px-2 text-sm font-medium">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom(prev => Math.min(prev + 0.1, 3))}
                className="p-1 text-gray-600 hover:text-gray-800"
                title="Zoom In"
              >
                +
              </button>
            </div>

            {/* View Options */}
            <button
              onClick={() => setShowGridLines(!showGridLines)}
              className={`p-2 rounded-lg transition-colors ${
                showGridLines ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Toggle Grid"
            >
              <Grid className="w-4 h-4" />
            </button>

            {/* Settings */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              title="Canvas Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Clear Canvas */}
            <button
              onClick={clearCanvas}
              className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
              title="Clear Canvas"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Save Project */}
            <button
              onClick={saveProject}
              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
              title="Save Project"
            >
              <Save className="w-4 h-4" />
            </button>

            {/* Fullscreen */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              title="Fullscreen"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && !previewMode && (
        <div className="bg-gray-50 border-b border-gray-200 p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Canvas Width</label>
              <input
                type="number"
                value={canvasSettings.width}
                onChange={(e) => setCanvasSettings(prev => ({ ...prev, width: Number(e.target.value) }))}
                className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Canvas Height</label>
              <input
                type="number"
                value={canvasSettings.height}
                onChange={(e) => setCanvasSettings(prev => ({ ...prev, height: Number(e.target.value) }))}
                className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={showGridLines}
                onChange={(e) => setShowGridLines(e.target.checked)}
                className="mr-2"
              />
              <label className="text-sm text-gray-700">Show Grid</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={snapToGrid}
                onChange={(e) => {}}
                className="mr-2"
              />
              <label className="text-sm text-gray-700">Snap to Grid</label>
            </div>
          </div>
        </div>
      )}

      {/* Canvas Container */}
      <div 
        ref={canvasRef}
        className={`canvas-container bg-gray-100 relative overflow-hidden ${
          isFullscreen ? 'fixed inset-0 z-50' : 'h-96'
        }`}
        onMouseDown={(e) => handleMouseDown(e)}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ 
          cursor: isPanning ? 'grab' : isDragging ? 'grabbing' : 'default'
        }}
      >
        {/* Canvas Background */}
        <div
          className="absolute inset-0"
          style={{
            background: canvasSettings.background,
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
            width: canvasSettings.width,
            height: canvasSettings.height,
            transformOrigin: '0 0'
          }}
        >
          {/* Grid */}
          {renderGrid()}

          {/* Elements */}
          {elements.map(renderElement)}

          {/* Empty State */}
          {elements.length === 0 && !previewMode && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white/70">
                <Layout className="w-16 h-16 mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">Start Building Your Mini App</h3>
                <p className="text-sm mb-4">Add components, create layouts, and bring your ideas to life</p>
                <button
                  onClick={() => {
                    // Add a sample component
                    addElement({
                      type: 'component',
                      componentName: 'Sample Component',
                      position: { x: 100, y: 100 },
                      size: { width: 200, height: 150 }
                    });
                  }}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4 inline mr-2" />
                  Add First Component
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      {!previewMode && (
        <div className="bg-white border-t border-gray-200 px-4 py-2 text-xs text-gray-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span>Drag to move • Delete to remove • Cmd+C to duplicate</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>Canvas Space v1.0</span>
              <Layers className="w-3 h-3" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Hook for managing CanvasSpace
 */
export function useCanvasSpace() {
  const [projects, setProjects] = useState<CanvasProject[]>([]);
  const [currentProject, setCurrentProject] = useState<CanvasProject | null>(null);

  const createProject = (config: Partial<CanvasProject>) => {
    const project: CanvasProject = {
      id: `project-${Date.now()}`,
      name: config.name || 'Untitled Project',
      elements: config.elements || [],
      canvasSettings: { ...DEFAULT_CANVAS_SETTINGS, ...config.canvasSettings },
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: '1.0.0'
      }
    };

    setProjects(prev => [...prev, project]);
    setCurrentProject(project);
    return project.id;
  };

  const saveProject = (projectId: string, updates: Partial<CanvasProject>) => {
    setProjects(prev => prev.map(project => 
      project.id === projectId 
        ? { 
            ...project, 
            ...updates,
            metadata: { ...project.metadata, updatedAt: Date.now() }
          }
        : project
    ));

    if (currentProject?.id === projectId) {
      setCurrentProject(prev => prev ? { 
        ...prev, 
        ...updates,
        metadata: { ...prev.metadata, updatedAt: Date.now() }
      } : null);
    }
  };

  const loadProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setCurrentProject(project);
    }
  };

  const deleteProject = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    if (currentProject?.id === projectId) {
      setCurrentProject(null);
    }
  };

  return {
    projects,
    currentProject,
    createProject,
    saveProject,
    loadProject,
    deleteProject
  };
}

export default EnhancedCanvasSpace;