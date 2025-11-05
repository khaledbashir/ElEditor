/**
 * Spotlight-Style ControlBar Component for Tambo AI
 * Command palette for quick component insertion, search, and navigation
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Search, 
  Zap, 
  FileText, 
  BarChart3, 
  Map, 
  Settings, 
  Palette, 
  Code, 
  Table, 
  Image, 
  MessageSquare,
  ArrowRight,
  Star,
  Clock,
  Command,
  Target,
  Layers,
  Sparkles,
  Plus
} from 'lucide-react';

export interface ControlCommand {
  id: string;
  title: string;
  description: string;
  icon: any;
  category: 'components' | 'navigation' | 'actions' | 'ai';
  shortcut?: string;
  keywords: string[];
  execute: () => void;
  featured?: boolean;
  recent?: boolean;
}

export interface ControlBarProps {
  isOpen: boolean;
  onClose: () => void;
  onCommandExecute?: (command: ControlCommand) => void;
  triggerShortcut?: string;
  showRecentCommands?: boolean;
  maxResults?: number;
}

/**
 * Beautiful Spotlight ControlBar - The command center for AI components
 */
export function AI_ControlBar({
  isOpen,
  onClose,
  onCommandExecute,
  triggerShortcut = 'cmd+k',
  showRecentCommands = true,
  maxResults = 20
}: ControlBarProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentCommands, setRecentCommands] = useState<ControlCommand[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // All available commands
  const allCommands: ControlCommand[] = [
    // Component Commands
    {
      id: 'insert-form',
      title: 'Insert Form Component',
      description: 'Add a beautiful AI-generated form to your document',
      icon: FileText,
      category: 'components',
      keywords: ['form', 'input', 'tambo', 'component'],
      execute: () => {
        addRecentCommand('insert-form');
        triggerInsertToDoc('FormComponent');
      }
    },
    {
      id: 'insert-chart',
      title: 'Insert Chart Component',
      description: 'Create interactive charts from your data',
      icon: BarChart3,
      category: 'components',
      keywords: ['chart', 'graph', 'data', 'visualization'],
      execute: () => {
        addRecentCommand('insert-chart');
        triggerInsertToDoc('Graph');
      }
    },
    {
      id: 'insert-map',
      title: 'Insert Map Component',
      description: 'Add interactive maps with markers and locations',
      icon: Map,
      category: 'components',
      keywords: ['map', 'location', 'marker', 'geo'],
      execute: () => {
        addRecentCommand('insert-map');
        triggerInsertToDoc('Map');
      }
    },
    {
      id: 'insert-table',
      title: 'Insert Table Component',
      description: 'Create dynamic tables with sorting and filtering',
      icon: Table,
      category: 'components',
      keywords: ['table', 'data', 'grid', 'spreadsheet'],
      execute: () => {
        addRecentCommand('insert-table');
        triggerInsertToDoc('TableComponent');
      }
    },
    {
      id: 'insert-code',
      title: 'Insert Code Block',
      description: 'Add syntax-highlighted code blocks',
      icon: Code,
      category: 'components',
      keywords: ['code', 'syntax', 'programming', 'snippet'],
      execute: () => {
        addRecentCommand('insert-code');
        triggerInsertToDoc('CodeBlock');
      }
    },
    {
      id: 'insert-image',
      title: 'Insert Image Component',
      description: 'Add responsive images with AI optimization',
      icon: Image,
      category: 'components',
      keywords: ['image', 'photo', 'picture', 'media'],
      execute: () => {
        addRecentCommand('insert-image');
        triggerInsertToDoc('ImageComponent');
      }
    },

    // Navigation Commands
    {
      id: 'goto-chat',
      title: 'Go to Chat',
      description: 'Switch to the chat interface',
      icon: MessageSquare,
      category: 'navigation',
      keywords: ['chat', 'conversation', 'message'],
      execute: () => {
        addRecentCommand('goto-chat');
        navigateToPage('/chat');
      }
    },
    {
      id: 'goto-documents',
      title: 'Go to Documents',
      description: 'Browse and manage your documents',
      icon: FileText,
      category: 'navigation',
      keywords: ['document', 'files', 'browse'],
      execute: () => {
        addRecentCommand('goto-documents');
        navigateToPage('/');
      }
    },
    {
      id: 'goto-templates',
      title: 'Browse Templates',
      description: 'Explore pre-built component templates',
      icon: Layers,
      category: 'navigation',
      keywords: ['template', 'starter', 'example'],
      execute: () => {
        addRecentCommand('goto-templates');
        // Open templates modal
      }
    },

    // AI Commands
    {
      id: 'ai-generate',
      title: 'AI Generate Component',
      description: 'Generate components using AI from natural language',
      icon: Sparkles,
      category: 'ai',
      keywords: ['ai', 'generate', 'create', 'magic'],
      execute: () => {
        addRecentCommand('ai-generate');
        // Open AI generator
      }
    },
    {
      id: 'ai-optimize',
      title: 'AI Optimize Document',
      description: 'Let AI improve your document structure and content',
      icon: Zap,
      category: 'ai',
      keywords: ['optimize', 'improve', 'enhance', 'ai'],
      execute: () => {
        addRecentCommand('ai-optimize');
        // Trigger AI optimization
      }
    },

    // Action Commands
    {
      id: 'save-document',
      title: 'Save Document',
      description: 'Save current document to external storage',
      icon: Command,
      category: 'actions',
      keywords: ['save', 'export', 'backup'],
      execute: () => {
        addRecentCommand('save-document');
        triggerSave();
      }
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'Configure Tambo AI and editor preferences',
      icon: Settings,
      category: 'actions',
      keywords: ['settings', 'preferences', 'config'],
      execute: () => {
        addRecentCommand('settings');
        // Open settings modal
      }
    },
    {
      id: 'theme',
      title: 'Switch Theme',
      description: 'Change between light and dark mode',
      icon: Palette,
      category: 'actions',
      keywords: ['theme', 'dark', 'light', 'mode'],
      execute: () => {
        addRecentCommand('theme');
        toggleTheme();
      }
    }
  ];

  // Helper functions
  const addRecentCommand = (commandId: string) => {
    setCommandHistory(prev => {
      const updated = [commandId, ...prev.filter(id => id !== commandId)].slice(0, 5);
      localStorage.setItem('tambo-recent-commands', JSON.stringify(updated));
      return updated;
    });
  };

  const triggerInsertToDoc = (componentType: string) => {
    // Trigger the insert to doc functionality
    const event = new CustomEvent('tambo-insert-component', {
      detail: { componentType }
    });
    window.dispatchEvent(event);
    onClose();
  };

  const navigateToPage = (path: string) => {
    window.location.href = path;
  };

  const triggerSave = () => {
    // Trigger document save
    const event = new CustomEvent('tambo-save-document');
    window.dispatchEvent(event);
    onClose();
  };

  const toggleTheme = () => {
    // Toggle theme
    document.documentElement.classList.toggle('dark');
    onClose();
  };

  // Filter commands based on query
  const filteredCommands = React.useMemo(() => {
    if (!query.trim()) {
      return showRecentCommands ? 
        allCommands.filter(cmd => commandHistory.includes(cmd.id)).slice(0, maxResults) :
        allCommands.slice(0, maxResults);
    }

    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    
    return allCommands
      .map(command => {
        let score = 0;
        const titleMatch = command.title.toLowerCase().includes(query.toLowerCase());
        const descMatch = command.description.toLowerCase().includes(query.toLowerCase());
        const keywordMatch = command.keywords.some(keyword => 
          searchTerms.some(term => keyword.toLowerCase().includes(term))
        );

        if (titleMatch) score += 10;
        if (descMatch) score += 5;
        if (keywordMatch) score += 3;
        if (commandHistory.includes(command.id)) score += 2;
        if (command.featured) score += 1;

        return { ...command, score };
      })
      .filter(cmd => cmd.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);
  }, [query, commandHistory, showRecentCommands, maxResults]);

  // Load recent commands on mount
  useEffect(() => {
    const saved = localStorage.getItem('tambo-recent-commands');
    if (saved) {
      setCommandHistory(JSON.parse(saved));
    }
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            Math.min(prev + 1, filteredCommands.length - 1)
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].execute();
            onCommandExecute?.(filteredCommands[selectedIndex]);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current && filteredCommands[selectedIndex]) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, filteredCommands]);

  // Listen for global keyboard shortcut
  useEffect(() => {
    const handleGlobalShortcut = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Toggle control bar
        onClose(); // This would be controlled by parent
      }
    };

    document.addEventListener('keydown', handleGlobalShortcut);
    return () => document.removeEventListener('keydown', handleGlobalShortcut);
  }, [onClose]);

  if (!isOpen) return null;

  const getCategoryIcon = (category: string) => {
    const iconMap = {
      components: Layers,
      navigation: Target,
      actions: Zap,
      ai: Sparkles
    };
    return iconMap[category as keyof typeof iconMap] || Command;
  };

  const getCategoryColor = (category: string) => {
    const colorMap = {
      components: 'text-blue-500',
      navigation: 'text-green-500',
      actions: 'text-orange-500',
      ai: 'text-purple-500'
    };
    return colorMap[category as keyof typeof colorMap] || 'text-gray-500';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="flex items-start justify-center min-h-screen p-4 pt-20">
        <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Search Input */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search commands, components, or type '?' for help..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-lg border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {query === '' && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                  ⌘K
                </div>
              )}
            </div>
          </div>

          {/* Results */}
          <div ref={resultsRef} className="max-h-96 overflow-y-auto">
            {filteredCommands.length > 0 ? (
              <div className="py-2">
                {/* Recent Commands Section */}
                {query === '' && commandHistory.length > 0 && (
                  <div className="px-4 py-2">
                    <div className="flex items-center space-x-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      <Clock className="w-3 h-3" />
                      <span>Recent</span>
                    </div>
                  </div>
                )}

                {/* Commands List */}
                {filteredCommands.map((command, index) => {
                  const CategoryIcon = getCategoryIcon(command.category);
                  const CommandIcon = command.icon;
                  const isSelected = index === selectedIndex;
                  const isRecent = commandHistory.includes(command.id);

                  return (
                    <button
                      key={command.id}
                      onClick={() => {
                        command.execute();
                        onCommandExecute?.(command);
                      }}
                      className={`w-full px-4 py-3 flex items-center space-x-3 text-left transition-colors ${
                        isSelected 
                          ? 'bg-blue-50 border-r-2 border-blue-500' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {/* Icon */}
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isSelected ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          <CommandIcon className={`w-4 h-4 ${getCategoryColor(command.category)}`} />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className={`font-medium truncate ${
                            isSelected ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                            {command.title}
                          </h3>
                          {isRecent && (
                            <Clock className="w-3 h-3 text-gray-400" />
                          )}
                          {command.featured && (
                            <Star className="w-3 h-3 text-yellow-500" />
                          )}
                        </div>
                        <p className={`text-sm truncate ${
                          isSelected ? 'text-blue-600' : 'text-gray-500'
                        }`}>
                          {command.description}
                        </p>
                      </div>

                      {/* Category & Shortcut */}
                      <div className="flex-shrink-0 flex items-center space-x-2">
                        <CategoryIcon className={`w-3 h-3 ${getCategoryColor(command.category)}`} />
                        {command.shortcut && (
                          <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 rounded">
                            {command.shortcut}
                          </kbd>
                        )}
                        <ArrowRight className={`w-4 h-4 ${
                          isSelected ? 'text-blue-500' : 'text-gray-400'
                        }`} />
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center">
                <Command className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No commands found</h3>
                <p className="text-gray-500 mb-4">
                  Try searching for "form", "chart", "map" or type "?" for help
                </p>
                <button
                  onClick={() => {
                    setQuery('ai');
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Try AI Commands
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-4">
                <span>↑↓ Navigate</span>
                <span>↵ Select</span>
                <span>⎋ Close</span>
              </div>
              <div className="flex items-center space-x-2">
                <Sparkles className="w-3 h-3" />
                <span>Powered by Tambo AI</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for managing ControlBar
 */
export function useControlBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [lastCommand, setLastCommand] = useState<string | null>(null);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const executeCommand = useCallback((command: ControlCommand) => {
    setLastCommand(command.id);
    setIsOpen(false);
  }, []);

  // Global keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);

  return {
    isOpen,
    open,
    close,
    toggle,
    executeCommand,
    lastCommand
  };
}

export default AI_ControlBar;