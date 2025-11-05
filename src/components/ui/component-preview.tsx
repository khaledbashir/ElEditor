"use client";

import React, { useState, useEffect } from "react";
import { StashedComponent } from "@/lib/component-stash";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Copy, 
  Download, 
  Eye, 
  Trash2, 
  Edit, 
  Star,
  ExternalLink,
  Code,
  Play
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ComponentPreviewProps {
  component: StashedComponent;
  onEdit?: (component: StashedComponent) => void;
  onDelete?: (id: string) => void;
  onUse?: (component: StashedComponent) => void;
  showActions?: boolean;
  compact?: boolean;
}

export function ComponentPreview({
  component,
  onEdit,
  onDelete,
  onUse,
  showActions = true,
  compact = false,
}: ComponentPreviewProps) {
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(component.code);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([component.code], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${component.name.replace(/\s+/g, '-').toLowerCase()}.jsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  if (compact) {
    return (
      <div className="p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium truncate">{component.name}</h4>
            <p className="text-sm text-muted-foreground truncate">{component.type}</p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onUse?.(component)}
              className="h-8 w-8 p-0"
            >
              <Play className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCode(!showCode)}
              className="h-8 w-8 p-0"
            >
              <Code className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {showCode && (
          <div className="mt-2">
            <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
              <code>{component.code.substring(0, 200)}...</code>
            </pre>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{component.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{component.description}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary">{component.type}</Badge>
              <Badge variant="outline">v{component.metadata.version}</Badge>
              {component.metadata.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onUse?.(component)}
              className="text-green-600 hover:text-green-700"
            >
              <Play className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCode(!showCode)}
            >
              <Code className="h-4 w-4" />
            </Button>
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(component)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(component.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Component Preview */}
        <div className="border rounded-lg p-4 bg-muted/20 min-h-[120px]">
          {isPreviewLoading ? (
            <div className="flex items-center justify-center h-24">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : previewError ? (
            <div className="flex items-center justify-center h-24 text-red-500 text-sm">
              Preview error: {previewError}
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Component preview</p>
            </div>
          )}
        </div>

        {/* Code Display */}
        {showCode && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Code</h4>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyCode}
                  className="h-8"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="h-8"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>
            <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto max-h-60 overflow-y-auto">
              <code>{component.code}</code>
            </pre>
          </div>
        )}

        {/* Metadata */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div>Created: {formatDate(component.metadata.createdAt)}</div>
          <div>Updated: {formatDate(component.metadata.updatedAt)}</div>
          {component.metadata.author && (
            <div>Author: {component.metadata.author}</div>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <Button
              variant="default"
              size="sm"
              onClick={() => onUse?.(component)}
              className="flex-1"
            >
              <Play className="h-4 w-4 mr-1" />
              Use Component
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCode(!showCode)}
            >
              {showCode ? 'Hide' : 'Show'} Code
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ComponentGridProps {
  components: StashedComponent[];
  onEdit?: (component: StashedComponent) => void;
  onDelete?: (id: string) => void;
  onUse?: (component: StashedComponent) => void;
  compact?: boolean;
  loading?: boolean;
}

export function ComponentGrid({
  components,
  onEdit,
  onDelete,
  onUse,
  compact = false,
  loading = false,
}: ComponentGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2 mt-2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-24 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (components.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground">
          <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No components found</h3>
          <p className="text-sm">
            Save your first component to see it here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "grid gap-4",
      compact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
    )}>
      {components.map((component) => (
        <ComponentPreview
          key={component.id}
          component={component}
          onEdit={onEdit}
          onDelete={onDelete}
          onUse={onUse}
          compact={compact}
          showActions={!compact}
        />
      ))}
    </div>
  );
}