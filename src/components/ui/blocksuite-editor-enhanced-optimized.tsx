"use client";

import { useEffect, useRef, useState, useCallback, lazy, Suspense } from "react";
import { useTambo } from "@tambo-ai/react";
import { Zap, FileText, Table, Code, List, Quote, Workflow, Brain, Target, Users, BarChart3 } from "lucide-react";

export interface BlockSuiteEditorProps {
  className?: string;
}

// Lazy load the slash menu component to reduce initial bundle
const SlashMenu = lazy(() => import("./blocksuite-slash-menu").then(mod => ({ default: mod.SlashMenu })));

export function BlockSuiteEditorEnhancedOptimized({ className = "" }: BlockSuiteEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const editorElRef = useRef<HTMLElement | null>(null);
  const [ready, setReady] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ x: 0, y: 0 });
  const [currentQuery, setCurrentQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const tambo = useTambo();

  const handleAIRequest = async (prompt: string) => {
    try {
      console.log("AI Request:", prompt);
      
      // Dynamically import templates only when needed
      const { getTemplateContent } = await import("./blocksuite-templates");
      
      if (prompt.toLowerCase().includes("brainstorm")) {
        await addBlock("rich-text", { content: getTemplateContent("brainstorm") });
      } else if (prompt.toLowerCase().includes("meeting notes")) {
        await addBlock("rich-text", { content: getTemplateContent("meeting") });
      } else if (prompt.toLowerCase().includes("project plan")) {
        await addBlock("rich-text", { content: getTemplateContent("project") });
      } else if (prompt.toLowerCase().includes("swot")) {
        await addBlock("rich-text", { content: getTemplateContent("swot") });
      }
    } catch (error) {
      console.error("AI request failed:", error);
    }
  };

  const addBlock = async (type: string, data: any = {}) => {
    console.log(`Adding ${type} block:`, data);
    
    const blockData = {
      type,
      data,
      timestamp: new Date().toISOString()
    };
    
    return { success: true, block: blockData };
  };

  // Slash command definitions (kept minimal, templates loaded on demand)
  const slashCommands = [
    {
      name: "AI Assistant",
      description: "Ask AI for help with content",
      icon: Zap,
      keywords: ["ai", "assistant", "help", "suggestion", "brain"],
      execute: (query: string) => handleAIRequest(query)
    },
    {
      name: "Brainstorm",
      description: "AI-powered brainstorming session",
      icon: Brain,
      keywords: ["brainstorm", "ideas", "creative", "think"],
      execute: () => handleAIRequest("brainstorm")
    },
    {
      name: "Meeting Notes",
      description: "Meeting notes template",
      icon: Users,
      keywords: ["meeting", "notes", "minutes", "agenda"],
      execute: () => handleAIRequest("meeting notes")
    },
    {
      name: "Project Plan",
      description: "Project planning template",
      icon: Target,
      keywords: ["project", "plan", "timeline", "milestone"],
      execute: () => handleAIRequest("project plan")
    },
    {
      name: "SWOT Analysis",
      description: "SWOT analysis template",
      icon: BarChart3,
      keywords: ["swot", "analysis", "strategy", "strengths"],
      execute: () => handleAIRequest("swot")
    },
    {
      name: "Heading",
      description: "Create a heading",
      icon: FileText,
      keywords: ["heading", "title", "h1", "h2", "h3"],
      execute: () => addBlock("heading", { level: 1 })
    },
    {
      name: "To-Do List",
      description: "Create a to-do list",
      icon: List,
      keywords: ["todo", "task", "checklist", "list"],
      execute: () => addBlock("todo-list", { items: ["New task 1", "New task 2"] })
    },
    {
      name: "Code Block",
      description: "Add a code block with syntax highlighting",
      icon: Code,
      keywords: ["code", "codeblock", "snippet", "script"],
      execute: () => addBlock("code-block", { language: "typescript" })
    },
    {
      name: "Table",
      description: "Insert a table",
      icon: Table,
      keywords: ["table", "spreadsheet", "grid", "data"],
      execute: () => addBlock("table", { rows: 3, columns: 3 })
    },
    {
      name: "Database",
      description: "Create a database table",
      icon: Table,
      keywords: ["database", "db", "data", "records"],
      execute: () => addBlock("database", {
        properties: [
          { name: "Title", type: "title" },
          { name: "Status", type: "select", options: ["To Do", "In Progress", "Done"] },
          { name: "Priority", type: "select", options: ["Low", "Medium", "High"] }
        ]
      })
    },
    {
      name: "Kanban",
      description: "Create a Kanban board",
      icon: Workflow,
      keywords: ["kanban", "board", "task", "workflow"],
      execute: () => addBlock("kanban", { 
        columns: ["To Do", "In Progress", "Done"],
        items: [
          { title: "Task 1", column: 0 },
          { title: "Task 2", column: 0 }
        ]
      })
    },
    {
      name: "Callout",
      description: "Add a callout box",
      icon: Workflow,
      keywords: ["callout", "alert", "info", "warning", "note"],
      execute: () => addBlock("callout", { type: "info", text: "Important information" })
    },
    {
      name: "Quote",
      description: "Add a blockquote",
      icon: Quote,
      keywords: ["quote", "blockquote", "citation"],
      execute: () => addBlock("quote", { text: "Your quote here" })
    }
  ];

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Slash command trigger
      if (event.key === '/' && !showSlashMenu) {
        event.preventDefault();
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          setSlashMenuPosition({ x: rect.left, y: rect.bottom + 5 });
          setShowSlashMenu(true);
          setCurrentQuery("");
        }
      }

      // ESC to close slash menu
      if (event.key === 'Escape' && showSlashMenu) {
        setShowSlashMenu(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showSlashMenu]);

  const handleSlashCommand = useCallback(async (query: string) => {
    setShowSlashMenu(false);
    setCurrentQuery("");

    const matchedCommand = slashCommands.find(cmd => 
      cmd.name.toLowerCase().includes(query.toLowerCase()) ||
      cmd.keywords.some(keyword => query.toLowerCase().includes(keyword)) ||
      query.toLowerCase().includes(cmd.name.toLowerCase())
    );

    if (matchedCommand) {
      await matchedCommand.execute(query);
    } else if (query.toLowerCase().startsWith("/ai ")) {
      await handleAIRequest(query.substring(4));
    } else {
      // If no exact match, try AI interpretation
      await handleAIRequest(query);
    }
  }, [tambo]);

  // Filtered commands for slash menu
  const filteredCommands = slashCommands.filter(cmd =>
    currentQuery === "" || 
    cmd.name.toLowerCase().includes(currentQuery.toLowerCase()) ||
    cmd.keywords.some(keyword => keyword.includes(currentQuery.toLowerCase()))
  );

  useEffect(() => {
    if (!hostRef.current) return;

    let mounted = true;

    // Dynamically import BlockSuite only when component mounts
    const initializeEditor = async () => {
      try {
        setIsLoading(true);
        
        // Load BlockSuite library dynamically
        await import("@blocksuite/editor");
        
        if (!mounted || !hostRef.current) return;

        // Create the out-of-the-box BlockSuite editor web component
        const editorEl = document.createElement("simple-affine-editor");
        editorElRef.current = editorEl;

        // Size the editor and mount
        editorEl.style.display = "block";
        editorEl.style.height = "100%";
        editorEl.style.width = "100%";

        hostRef.current.appendChild(editorEl);
        setReady(true);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to load BlockSuite editor:", error);
        setIsLoading(false);
      }
    };

    initializeEditor();

    return () => {
      mounted = false;
      if (hostRef.current && editorElRef.current) {
        try {
          hostRef.current.removeChild(editorElRef.current);
        } catch {}
      }
      editorElRef.current = null;
    };
  }, []);

  return (
    <div className={`h-full w-full ${className} relative`}>
      <div
        ref={hostRef}
        className="h-full w-full overflow-auto min-h-[500px] bg-white border border-border rounded-md"
      />
      
      {/* Slash Menu - Lazy loaded */}
      {showSlashMenu && (
        <Suspense fallback={null}>
          <SlashMenu
            position={slashMenuPosition}
            query={currentQuery}
            onQueryChange={setCurrentQuery}
            commands={filteredCommands}
            onCommandSelect={handleSlashCommand}
            onClose={() => setShowSlashMenu(false)}
          />
        </Suspense>
      )}
      
      {isLoading && (
        <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span>Loading enhanced BlockSuite editor…</span>
          </div>
        </div>
      )}
    </div>
  );
}

