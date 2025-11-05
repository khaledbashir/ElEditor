"use client";

import { LucideIcon } from "lucide-react";

export interface SlashCommand {
  name: string;
  description: string;
  icon: LucideIcon;
  keywords: string[];
  execute: (query: string) => void | Promise<void>;
}

export interface SlashMenuProps {
  position: { x: number; y: number };
  query: string;
  onQueryChange: (query: string) => void;
  commands: SlashCommand[];
  onCommandSelect: (commandName: string) => void;
  onClose: () => void;
}

export function SlashMenu({
  position,
  query,
  onQueryChange,
  commands,
  onCommandSelect,
  onClose
}: SlashMenuProps) {
  return (
    <div 
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[280px] max-w-[400px]"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <input
        type="text"
        placeholder="Search commands..."
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        autoFocus
      />
      
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {commands.length > 0 ? (
          commands.map((command, index) => {
            const IconComponent = command.icon;
            return (
              <button
                key={index}
                className="w-full flex items-center gap-3 p-2 hover:bg-gray-100 rounded text-left"
                onClick={() => onCommandSelect(command.name)}
              >
                <IconComponent className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm font-medium text-gray-900">{command.name}</div>
                  <div className="text-xs text-gray-500">{command.description}</div>
                </div>
              </button>
            );
          })
        ) : (
          <div className="text-xs text-gray-500 p-2 text-center">
            No commands found
          </div>
        )}
      </div>
      
      <div className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-100">
        Press ESC to close • AI commands available with /ai
      </div>
    </div>
  );
}

