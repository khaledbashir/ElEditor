/**
 * Enhanced CanvasSpace Component for Tambo AI
 * Dedicated mini-app rendering area with workspace management
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Maximize2, 
  Minimize2, 
  X, 
  Play, 
  Pause, 
  RotateCcw, 
  Download, 
  Upload,
  Share, 
  Settings, 
  Grid, 
  Monitor, 
  Smartphone, 
  Tablet,
  Layers,
  Eye,
  EyeOff,
  Zap,
  Sparkles,
  Plus,
  Save,
  ArrowLeft
} from 'lucide-react';
import { useTambo } from '@tambo-ai/react';

export interface CanvasElement {
  id: string;
  type: string;
  component: React.ComponentType<any>;
  props: Record<string, any>;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  locked?: boolean;
  visible?: boolean;
}

export interface CanvasWorkspace {
  id: string;
  name: string;
  elements: CanvasElement[];
  background?: string;
  gridSize?: number;
  snapToGrid?: boolean;
  device?: 'desktop' | 'tablet' | 'mobile';
  theme?: 'light' | 'dark';
  createdAt: number;
  lastModified: number;
}

export interface CanvasSpaceProps {
  workspace?: CanvasWorkspace;
  onWorkspaceChange?: (workspace: CanvasWorkspace) => void;
  onElementSelect?: (element: CanvasElement | null) => void;
  onElementCreate?: (element: Omit<CanvasElement, 'id'>) => void;
  onElementUpdate?: (id: string, updates: Partial<CanvasElement>) => void;
  onElementDelete?: (id: string) => void;
  autoClear?: boolean;
  fullScreen?: boolean;
  allowResize?: boolean;
  allowDrag?: boolean;
  gridEnabled?: boolean;
  snapToGrid?: boolean;
  showRuler?: boolean;
  readOnly?: boolean;
}

/**
 * Beautiful Enhanced CanvasSpace - The heart of mini-app creation
 */
export function AI_CanvasSpace({
  workspace,
  onWorkspaceChange,
  onElementSelect,
  onElementCreate,
  onElementUpdate,
  onElementDelete,
  autoClear = true,
  fullScreen = false,
  allowResize = true,
  allowDrag = true,
  gridEnabled = true,
  snapToGrid = true,
  showRuler = true,
  readOnly = false
}: CanvasSpaceProps) {
  const [currentWorkspace, setCurrentWorkspace] = useState<CanvasWorkspace>(() => {
    return workspace || {
      id: `workspace-${Date.now()}`,
      name: 'New Canvas',
      elements: [],
      gridSize: 20,
      snapToGrid: true,
      device: 'desktop',
      theme: 'light',
      createdAt: Date.now(),
      lastModified: Date.now()
    };
  });
  
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(fullScreen);
  const [showGrid, setShowGrid] = useState(gridEnabled);
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { thread } = useTambo();

  // Update workspace when props change
  useEffect(() => {
    if (workspace) {
      setCurrentWorkspace(workspace);
    }
  }, [workspace]);

  // Auto-clear workspace when thread changes (if autoClear is true)
  useEffect(() => {
    if (autoClear && thread?.id) {
      const threadKey = `canvas-${thread.id}`;
      const saved = localStorage.getItem(threadKey);
      
      if (!saved) {
        handleClearWorkspace();
      } else {
        try {
          const savedWorkspace = JSON.parse(saved);
          setCurrentWorkspace(savedWorkspace);
        } catch {
          handleClearWorkspace();
        }
      }
    }
  }, [thread?.id, autoClear]);

  // Save workspace to localStorage
  useEffect(() => {
    if (autoClear && currentWorkspace) {
      const threadKey = `canvas-${thread?.id}`;
      localStorage.setItem(threadKey, JSON.stringify(currentWorkspace));
    }
  }, [currentWorkspace, autoClear, thread?.id]);

  // Update workspace timestamp
  useEffect(() => {
    setCurrentWorkspace(prev => ({
      ...prev,
      lastModified: Date.now()
    }));
  }, [currentWorkspace.elements]);

  const handleClearWorkspace = () => {
    setCurrentWorkspace(prev => ({
      ...prev,
      elements: [],
      name: 'New Canvas'
    }));
    setSelectedElement(null);
  };

  const handleElementSelect = (elementId: string | null) => {
    setSelectedElement(elementId);
    onElementSelect?.(elementId ? currentWorkspace.elements.find(el => el.id === elementId) || null : null);
  };

  const handleElementCreate = (elementConfig: Omit<CanvasElement, 'id'>) => {
    const newElement: CanvasElement = {
      ...elementConfig,
      id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    
    const updatedElements = [...currentWorkspace.elements, newElement];
    const updatedWorkspace = { ...currentWorkspace, elements: updatedElements };
    
    setCurrentWorkspace(updatedWorkspace);
    onElementCreate?.(elementConfig);
    handleElementSelect(newElement.id);
  };

  const handleElementUpdate = (elementId: string, updates: Partial<CanvasElement>) => {
    const updatedElements = currentWorkspace.elements.map(el =>
      el.id === elementId ? { ...el, ...updates } : el
    );
    
    const updatedWorkspace = { ...currentWorkspace, elements: updatedElements };
    setCurrentWorkspace(updatedWorkspace);
    onElementUpdate?.(elementId, updates);
  };

  const handleElementDelete = (elementId: string) => {
    const updatedElements = currentWorkspace.elements.filter(el => el.id !== elementId);
    const updatedWorkspace = { ...currentWorkspace, elements: updatedElements };
    setCurrentWorkspace(updatedWorkspace);
    onElementDelete?.(elementId);
    
    if (selectedElement === elementId) {
      setSelectedElement(null);
    }
  };

  const handleDragStart = (elementId: string, event: React.MouseEvent) => {
    if (!allowDrag || readOnly) return;
    
    event.preventDefault();
    setDraggedElement(elementId);
    setDragStart({ x: event.clientX, y: event.clientY });
    
    const element = currentWorkspace.elements.find(el => el.id === elementId);
    if (element) {
      setPanOffset({ x: element.position.x, y: element.position.y });
    }
  };

  const handleDragMove = useCallback((event: MouseEvent) => {
    if (!draggedElement || !allowDrag) return;
    
    const deltaX = event.clientX - dragStart.x;
    const deltaY = event.clientY - dragStart.y;
    
    let newX = panOffset.x + deltaX;
    let newY = panOffset.y + deltaY;
    
    // Snap to grid if enabled
    if (snapToGrid && currentWorkspace.gridSize) {
      newX = Math.round(newX / currentWorkspace.gridSize) * currentWorkspace.gridSize;
      newY = Math.round(newY / currentWorkspace.gridSize) * currentWorkspace.gridSize;
    }
    
    handleElementUpdate(draggedElement, {
      position: { x: newX, y: newY }
    });
  }, [draggedElement, dragStart, panOffset, allowDrag, snapToGrid, currentWorkspace.gridSize]);

  const handleDragEnd = useCallback(() => {
    setDraggedElement(null);
  }, []);

  // Global mouse events for dragging
  useEffect(() => {
    if (draggedElement) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [draggedElement, handleDragMove, handleDragEnd]);

  const handleExport = () => {
    const exportData = {
      workspace: currentWorkspace,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentWorkspace.name.replace(/\s+/g, '_')}_canvas.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);
        if (importData.workspace) {
          setCurrentWorkspace({
            ...importData.workspace,
            id: `workspace-${Date.now()}`,
            createdAt: Date.now(),
            lastModified: Date.now()
          });
        }
      } catch (error) {
        console.error('Failed to import workspace:', error);
      }
    };
    reader.readAsText(file);
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const getDeviceSize = () => {
    switch (currentWorkspace.device) {
      case 'mobile':
        return { width: 375, height: 667 };
      case 'tablet':
        return { width: 768, height: 1024 };
      default:
        return { width: 1200, height: 800 };
    }
  };

  const deviceSize = getDeviceSize();

  return (
    <div className={`
      ${isFullScreen ? 'fixed inset-0 z-50 bg-white' : 'relative'} 
      flex flex-col h-full bg-gray-50
    `}>
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Workspace Name */}
          <input
            type="text"
            value={currentWorkspace.name}
            onChange={(e) => setCurrentWorkspace(prev => ({ ...prev, name: e.target.value }))}
            className="text-lg font-semibold bg-transparent border-none outline-none focus:bg-gray-50 px-2 py-1 rounded"
            readOnly={readOnly}
          />
          
          {/* Element Count */}
          <span className="text-sm text-gray-500">
            {currentWorkspace.elements.length} elements
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Device Selector */}
          <div className="flex items-center space-x-1 border border-gray-200 rounded-lg p-1">
            <button
              onClick={() => setCurrentWorkspace(prev => ({ ...prev, device: 'desktop' }))}
              className={`p-2 rounded ${currentWorkspace.device === 'desktop' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
              title="Desktop"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentWorkspace(prev => ({ ...prev, device: 'tablet' }))}
              className={`p-2 rounded ${currentWorkspace.device === 'tablet' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
              title="Tablet"
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentWorkspace(prev => ({ ...prev, device: 'mobile' }))}
              className={`p-2 rounded ${currentWorkspace.device === 'mobile' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
              title="Mobile"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>
          
          {/* Actions */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2 rounded ${showGrid ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
            title="Toggle Grid"
          >
            <Grid className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-2 rounded ${isPlaying ? 'bg-green-100 text-green-600' : 'text-gray-400'}`}
            title="Play/Pause"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          
          <button
            onClick={handleExport}
            className="p-2 text-gray-400 hover:text-blue-600 rounded"
            title="Export"
          >
            <Download className="w-4 h-4" />
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-400 hover:text-blue-600 rounded"
            title="Import"
          >
            <Upload className="w-4 h-4" />
          </button>
          
          <button
            onClick={toggleFullScreen}
            className="p-2 text-gray-400 hover:text-blue-600 rounded"
            title={isFullScreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Canvas Container */}
      <div className="flex-1 overflow-auto p-8" ref={canvasRef}>
        <div className="mx-auto" style={{ width: deviceSize.width, height: deviceSize.height }}>
          {/* Device Frame */}
          <div className={`
            relative bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-200
            ${currentWorkspace.device === 'mobile' ? 'mx-auto' : ''}
          `} style={{ width: deviceSize.width, height: deviceSize.height }}>
            
            {/* Canvas Workspace */}
            <div
              ref={workspaceRef}
              className="relative w-full h-full overflow-hidden"
              style={{ backgroundColor: currentWorkspace.background || '#ffffff' }}
            >
              {/* Grid Background */}
              {showGrid && (
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: `
                      linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: `${currentWorkspace.gridSize}px ${currentWorkspace.gridSize}px`
                  }}
                />
              )}
              
              {/* Elements */}
              {currentWorkspace.elements.map((element) => (
                <div
                  key={element.id}
                  className={`
                    absolute border-2 transition-all duration-200
                    ${selectedElement === element.id 
                      ? 'border-blue-500 ring-2 ring-blue-200' 
                      : 'border-transparent hover:border-gray-300'
                    }
                    ${element.locked ? 'cursor-not-allowed' : 'cursor-move'}
                    ${element.visible === false ? 'opacity-50' : 'opacity-100'}
                  `}
                  style={{
                    left: element.position.x,
                    top: element.position.y,
                    width: element.size.width,
                    height: element.size.height,
                    zIndex: element.zIndex
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleElementSelect(element.id);
                  }}
                  onMouseDown={(e) => handleDragStart(element.id, e)}
                >
                  {/* Render Element Component */}
                  <element.component {...element.props} />
                  
                  {/* Selection Overlay */}
                  {selectedElement === element.id && !readOnly && (
                    <div className="absolute -inset-1 bg-blue-500/10 border-2 border-blue-500 rounded pointer-events-none">
                      {/* Resize Handles */}
                      <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 rounded-full" />
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
                      <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 rounded-full" />
                      <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
                    </div>
                  )}
                </div>
              ))}
              
              {/* Empty State */}
              {currentWorkspace.elements.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <Layers className="w-16 h-16 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Empty Canvas</h3>
                    <p className="mb-4">Start building your mini-app by adding components</p>
                    <button
                      onClick={() => {
                        // Open component palette
                        const event = new CustomEvent('tambo-open-component-palette');
                        window.dispatchEvent(event);
                      }}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Plus className="w-4 h-4 inline mr-2" />
                      Add Component
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for managing CanvasSpace
 */
export function useCanvasSpace() {
  const [workspaces, setWorkspaces] = useState<CanvasWorkspace[]>([]);

  const createWorkspace = (config: Partial<CanvasWorkspace>) => {
    const newWorkspace: CanvasWorkspace = {
      id: `workspace-${Date.now()}`,
      name: 'New Canvas',
      elements: [],
      gridSize: 20,
      snapToGrid: true,
      device: 'desktop',
      theme: 'light',
      createdAt: Date.now(),
      lastModified: Date.now(),
      ...config
    };
    
    setWorkspaces(prev => [...prev, newWorkspace]);
    return newWorkspace.id;
  };

  const updateWorkspace = (id: string, updates: Partial<CanvasWorkspace>) => {
    setWorkspaces(prev => prev.map(workspace => 
      workspace.id === id ? { 
        ...workspace, 
        ...updates, 
        lastModified: Date.now() 
      } : workspace
    ));
  };

  const deleteWorkspace = (id: string) => {
    setWorkspaces(prev => prev.filter(workspace => workspace.id !== id));
  };

  const duplicateWorkspace = (id: string) => {
    const workspace = workspaces.find(w => w.id === id);
    if (workspace) {
      return createWorkspace({
        ...workspace,
        name: `${workspace.name} (Copy)`,
        id: undefined,
        createdAt: undefined
      });
    }
    return null;
  };

  return {
    workspaces,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    duplicateWorkspace
  };
}

export default AI_CanvasSpace;