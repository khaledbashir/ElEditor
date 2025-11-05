"use client";

import React, { useState, useCallback } from "react";
import { useComponentStash } from "@/hooks/use-component-stash";
import { ComponentGrid } from "@/components/ui/component-preview";
import { StashedComponent } from "@/lib/component-stash";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Search, 
  Plus, 
  Filter, 
  Download, 
  Upload, 
  X,
  Tag,
  Grid,
  List,
  Star,
  Clock,
  FolderOpen
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ComponentStashPanelProps {
  onUseComponent?: (component: StashedComponent) => void;
  onClose?: () => void;
  className?: string;
}

export function ComponentStashPanel({
  onUseComponent,
  onClose,
  className,
}: ComponentStashPanelProps) {
  const {
    components,
    isLoading,
    error,
    saveComponent,
    deleteComponent,
    searchComponents,
    getComponentsByType,
    getComponentsByTag,
    exportComponents,
    importComponents,
  } = useComponentStash();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"name" | "date" | "type">("date");
  const [showFilters, setShowFilters] = useState(false);
  const [filteredComponents, setFilteredComponents] = useState<StashedComponent[]>(components);

  // Get unique types and tags from components
  const allTypes = Array.from(new Set(components.map(c => c.type)));
  const allTags = Array.from(new Set(components.flatMap(c => c.metadata.tags)));

  // Filter and sort components
  const updateFilteredComponents = useCallback(async () => {
    let filtered = [...components];

    // Apply search filter
    if (searchQuery.trim()) {
      const searchResults = await searchComponents(searchQuery);
      filtered = searchResults;
    }

    // Apply type filter
    if (selectedType !== "all") {
      filtered = filtered.filter(c => c.type === selectedType);
    }

    // Apply tag filter
    if (selectedTag !== "all") {
      filtered = filtered.filter(c => c.metadata.tags.includes(selectedTag));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "type":
          return a.type.localeCompare(b.type);
        case "date":
        default:
          return b.metadata.updatedAt - a.metadata.updatedAt;
      }
    });

    setFilteredComponents(filtered);
  }, [components, searchQuery, selectedType, selectedTag, sortBy, searchComponents]);

  // Update filtered components when dependencies change
  React.useEffect(() => {
    updateFilteredComponents();
  }, [updateFilteredComponents]);

  const handleExport = async () => {
    try {
      const data = await exportComponents();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `component-stash-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export components:', err);
    }
  };

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const text = await file.text();
          const imported = await importComponents(text);
          alert(`Successfully imported ${imported} components`);
        } catch (err) {
          console.error('Failed to import components:', err);
          alert('Failed to import components. Please check the file format.');
        }
      }
    };
    input.click();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this component?')) {
      try {
        await deleteComponent(id);
      } catch (err) {
        console.error('Failed to delete component:', err);
      }
    }
  };

  if (error) {
    return (
      <Card className={cn("w-full max-w-4xl mx-auto", className)}>
        <CardContent className="pt-6">
          <div className="text-center text-red-500">
            <p>Error loading components: {error.message}</p>
            <Button onClick={() => window.location.reload()} className="mt-2">
              Reload
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full max-w-6xl mx-auto", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Component Stash
            <Badge variant="secondary">{filteredComponents.length}</Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-1" />
              Filters
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={handleImport}>
              <Upload className="h-4 w-4 mr-1" />
              Import
            </Button>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search components..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {showFilters && (
            <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/20 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Type:</span>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-2 py-1 rounded border bg-background text-sm"
                >
                  <option value="all">All Types</option>
                  {allTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Tag:</span>
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="px-2 py-1 rounded border bg-background text-sm"
                >
                  <option value="all">All Tags</option>
                  {allTags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-2 py-1 rounded border bg-background text-sm"
                >
                  <option value="date">Last Updated</option>
                  <option value="name">Name</option>
                  <option value="type">Type</option>
                </select>
              </div>

              <div className="flex items-center gap-1 ml-auto">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <ComponentGrid
          components={filteredComponents}
          onDelete={handleDelete}
          onUse={onUseComponent}
          compact={viewMode === "list"}
          loading={isLoading}
        />
      </CardContent>
    </Card>
  );
}

// Quick access component for the sidebar
export function ComponentStashQuickAccess({
  onUseComponent,
  className,
}: {
  onUseComponent?: (component: StashedComponent) => void;
  className?: string;
}) {
  const { components, isLoading } = useComponentStash();
  const [showAll, setShowAll] = useState(false);

  // Show only the 6 most recently updated components
  const recentComponents = components
    .sort((a, b) => b.metadata.updatedAt - a.metadata.updatedAt)
    .slice(0, 6);

  if (isLoading) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="text-sm font-medium">Recent Components</div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (components.length === 0) {
    return (
      <div className={cn("text-center py-4", className)}>
        <div className="text-muted-foreground text-sm">
          <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No saved components</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Recent Components</div>
        {components.length > 6 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="h-6 px-2 text-xs"
          >
            {showAll ? 'Show Less' : 'Show All'}
          </Button>
        )}
      </div>
      
      <div className="space-y-2">
        {(showAll ? components : recentComponents).map((component) => (
          <div
            key={component.id}
            className="p-2 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
            onClick={() => onUseComponent?.(component)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{component.name}</div>
                <div className="text-xs text-muted-foreground truncate">{component.type}</div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onUseComponent?.(component);
                }}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}