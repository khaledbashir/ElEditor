"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useTambo } from "@tambo-ai/react";
import { Zap, FileText, Table, Code, List, Quote, Workflow, Brain, Target, Users, BarChart3, Plus, Sparkles } from "lucide-react";
import { InsertToDocButton } from '@/components/tambo/insert-to-doc-button';
import { useTamboBlockSuiteIntegration } from '@/lib/tambo-to-blocksuite-integration';

export interface BlockSuiteEditorProps {
  className?: string;
}

// Global reference to the BlockSuite doc for programmatic access
let globalDoc: any = null;
let globalCollection: any = null;

export function getBlockSuiteDoc() {
  return globalDoc;
}

export function getBlockSuiteCollection() {
  return globalCollection;
}

export function BlockSuiteEditorEnhanced({ className = "" }: BlockSuiteEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const editorElRef = useRef<HTMLElement | null>(null);
  const [ready, setReady] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ x: 0, y: 0 });
  const [currentQuery, setCurrentQuery] = useState("");
  const tambo = useTambo();
  const { components: insertedComponents } = useTamboBlockSuiteIntegration();

  const handleAIRequest = async (prompt: string) => {
    try {
      // console.log("AI Request:", prompt);
      
      if (prompt.toLowerCase().includes("brainstorm")) {
        await addBrainstormingContent();
      } else if (prompt.toLowerCase().includes("meeting notes")) {
        await addMeetingNotesTemplate();
      } else if (prompt.toLowerCase().includes("project plan")) {
        await addProjectPlanTemplate();
      } else if (prompt.toLowerCase().includes("swot")) {
        await addSWOTTemplate();
      }
    } catch (error) {
      console.error("AI request failed:", error);
    }
  };

  const addBlock = async (type: string, data: any = {}) => {
    // console.log(`Adding ${type} block:`, typeof data === "object" ? "Block data" : data);
    
    const blockData = {
      type,
      data,
      timestamp: new Date().toISOString()
    };
    
    return { success: true, block: blockData };
  };

  const addBrainstormingContent = async () => {
    const content = `## 🚀 Brainstorming Session

### 💡 Ideas
- **Idea 1**: First creative thought with potential impact
- **Idea 2**: Second innovative approach worth exploring
- **Idea 3**: Third brilliant concept to develop further

### 🎯 Focus Areas
- **Innovation**: Push boundaries and think differently
- **Feasibility**: Consider practical implementation
- **Impact**: Evaluate potential outcomes

### 📋 Next Steps
- [ ] Prioritize top 3 ideas
- [ ] Research market demand
- [ ] Prototype chosen concept
- [ ] Gather user feedback

### 🔄 Iteration Cycle
*Generated with AI on ${new Date().toLocaleDateString()}*`;

    await addBlock("rich-text", { content });
  };

  const addMeetingNotesTemplate = async () => {
    const content = `## 📅 Meeting Notes - ${new Date().toLocaleDateString()}

### 👥 Attendees
- [ ] [Name 1] - Role/Department
- [ ] [Name 2] - Role/Department  
- [ ] [Name 3] - Role/Department

### 📋 Agenda
1. Topic 1 - [Owner]
2. Topic 2 - [Owner]
3. Topic 3 - [Owner]

### 💬 Discussion Points

#### Topic 1
- Key discussion point 1
- Decision made: [Decision]
- Rationale: [Reason]

#### Topic 2
- Key discussion point 2
- Action item: [Owner] - [Task] - [Due Date]

#### Topic 3
- Key discussion point 3
- Budget consideration: [Amount]

### ✅ Action Items
- [ ] **[Task Description]** - [Owner] - [Due Date]
- [ ] **[Task Description]** - [Owner] - [Due Date]
- [ ] **[Task Description]** - [Owner] - [Due Date]

### 📅 Next Meeting
- **Date**: [Date]
- **Time**: [Time]
- **Agenda**: [Key topics]

---
*Generated with AI • Ready for collaboration*`;

    await addBlock("rich-text", { content });
  };

  const addProjectPlanTemplate = async () => {
    const content = `## 🎯 Project Plan: [Project Name]

### 📊 Overview
- **Objective**: [Primary goal description]
- **Timeline**: [Duration]
- **Budget**: [Estimated cost]
- **Team**: [Key members]

### 📅 Timeline & Milestones

#### Phase 1: Planning (Weeks 1-2)
- [ ] Define requirements
- [ ] Create wireframes/prototypes
- [ ] Set up development environment
- [ ] Stakeholder approval

#### Phase 2: Development (Weeks 3-8)
- [ ] Frontend development
- [ ] Backend development
- [ ] API integrations
- [ ] Unit testing

#### Phase 3: Testing (Weeks 9-10)
- [ ] QA testing
- [ ] User acceptance testing
- [ ] Performance optimization
- [ ] Bug fixes

#### Phase 4: Launch (Weeks 11-12)
- [ ] Production deployment
- [ ] Documentation completion
- [ ] Team training
- [ ] Post-launch monitoring

### ⚠️ Risks & Mitigation
- **Risk 1**: [Description]
  - *Mitigation*: [Strategy]
- **Risk 2**: [Description]
  - *Mitigation*: [Strategy]

### 📈 Success Metrics
- [ ] **Metric 1**: [Target value]
- [ ] **Metric 2**: [Target value]
- [ ] **Metric 3**: [Target value]

### 💰 Resource Requirements
- **Development**: [Hours/Resources]
- **Design**: [Hours/Resources]
- **Testing**: [Hours/Resources]

---
*Generated with AI • Project Ready for Kickoff*`;

    await addBlock("rich-text", { content });
  };

  const addSWOTTemplate = async () => {
    const content = `## 📊 SWOT Analysis - [Topic/Company/Project]

### 💪 Strengths (Internal, Positive)
- **S1**: [Internal strength 1]
- **S2**: [Internal strength 2]
- **S3**: [Internal strength 3]
- **S4**: [Internal strength 4]

### ⚡ Weaknesses (Internal, Negative)
- **W1**: [Internal weakness 1]
- **W2**: [Internal weakness 2]
- **W3**: [Internal weakness 3]
- **W4**: [Internal weakness 4]

### 🌟 Opportunities (External, Positive)
- **O1**: [External opportunity 1]
- **O2**: [External opportunity 2]
- **O3**: [External opportunity 3]
- **O4**: [External opportunity 4]

### ⚠️ Threats (External, Negative)
- **T1**: [External threat 1]
- **T2**: [External threat 2]
- **T3**: [External threat 3]
- **T4**: [External threat 4]

### 🎯 Strategic Insights
- **SO Strategy**: Use strengths to capitalize on opportunities
- **WO Strategy**: Address weaknesses to seize opportunities
- **ST Strategy**: Use strengths to avoid threats
- **WT Strategy**: Defensive strategy to minimize weaknesses and threats

### ✅ Action Items
- [ ] Leverage top 2 strengths for opportunities
- [ ] Address top 2 weaknesses that impact opportunities
- [ ] Develop mitigation plan for top 2 threats

---
*Generated with AI • Strategic Planning Complete*`;

    await addBlock("rich-text", { content });
  };

  // Slash command definitions
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
      execute: () => addBrainstormingContent()
    },
    {
      name: "Meeting Notes",
      description: "Meeting notes template",
      icon: Users,
      keywords: ["meeting", "notes", "minutes", "agenda"],
      execute: () => addMeetingNotesTemplate()
    },
    {
      name: "Project Plan",
      description: "Project planning template",
      icon: Target,
      keywords: ["project", "plan", "timeline", "milestone"],
      execute: () => addProjectPlanTemplate()
    },
    {
      name: "SWOT Analysis",
      description: "SWOT analysis template",
      icon: BarChart3,
      keywords: ["swot", "analysis", "strategy", "strengths"],
      execute: () => addSWOTTemplate()
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
    },
    {
      name: "AI Component",
      description: "Insert AI-generated component",
      icon: Sparkles,
      keywords: ["ai", "component", "tambo", "widget", "form", "chart"],
      execute: async () => {
        // Trigger the insert to doc modal
        const button = document.querySelector('[data-insert-to-doc-trigger]') as HTMLElement;
        if (button) {
          button.click();
        } else {
          // Fallback: add a placeholder component
          await addBlock("ai-component", { 
            type: "FormComponent",
            title: "AI Generated Form",
            fields: [
              { name: "name", type: "text", label: "Name", required: true },
              { name: "email", type: "email", label: "Email", required: true }
            ]
          });
        }
      }
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
        // Load BlockSuite library dynamically
        await import("@blocksuite/editor");

        if (!mounted || !hostRef.current) return;

        // Create the simple-affine-editor web component
        const editorEl = document.createElement("simple-affine-editor") as any;
        editorElRef.current = editorEl;

        // Size the editor and mount
        editorEl.style.display = "block";
        editorEl.style.height = "100%";
        editorEl.style.width = "100%";

        hostRef.current.appendChild(editorEl);

        // Wait for the editor to initialize its workspace and page
        // The simple-affine-editor creates these automatically
        setTimeout(async () => {
          if (editorEl.workspace && editorEl.page) {
            // Store global references for the tools to access
            globalCollection = editorEl.workspace;
            globalDoc = editorEl.page;

            // console.log("✅ BlockSuite editor initialized");
            // console.log("   Workspace:", editorEl.workspace);
            // console.log("   Page:", editorEl.page);
            console.log("   Page ID:", editorEl.page.id);

            // Expose to window for debugging and manual testing
            if (typeof window !== 'undefined') {
              (window as any).__blocksuiteWorkspace = editorEl.workspace;
              (window as any).__blocksuitePage = editorEl.page;

              // Import the controller for manual testing
              const { getBlockSuiteController } = await import("@/lib/blocksuite-control");
              const controller = getBlockSuiteController();

              // Expose helper functions for manual testing in console
              (window as any).addText = (content: string) => {
                return controller.addTextBlock(content || "This is a test paragraph.");
              };
              (window as any).addHeading = (text: string, level: number = 1) => {
                return controller.addHeading(text || "Test Heading", level);
              };
              (window as any).addList = (items?: string[], ordered?: boolean) => {
                return controller.addListBlock(
                  items || ["First item", "Second item", "Third item"],
                  ordered || false
                );
              };
              (window as any).addCode = (code?: string, language?: string) => {
                return controller.addCodeBlock(
                  code || 'console.log("Hello, BlockSuite!");',
                  language || "typescript"
                );
              };
              (window as any).clearEditor = () => {
                return controller.clearEditor();
              };

              // console.log("📝 Manual testing functions available:");
              // console.log("   addText(content) - Add a paragraph");
              // console.log("   addHeading(text, level) - Add a heading (level 1-3)");
              console.log("   addList(items, ordered) - Add a list");
              console.log("   addCode(code, language) - Add a code block");
              console.log("   clearEditor() - Clear all content");
            }
          }
        }, 500);

        setReady(true);
      } catch (error) {
        console.error("Failed to load BlockSuite editor:", error);
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
      globalDoc = null;
      globalCollection = null;

      // Clean up window references
      if (typeof window !== 'undefined') {
        delete (window as any).__blocksuiteWorkspace;
        delete (window as any).__blocksuitePage;
      }
    };
  }, []);

  return (
    <div className={`h-full w-full ${className} relative`}>
      {/* Enhanced Toolbar with AI Components */}
      <div className="bg-white border-b border-gray-200 p-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            Enhanced BlockSuite Editor
          </h3>
          {insertedComponents.length > 0 && (
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
              {insertedComponents.length} AI components inserted
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* AI Components Button */}
          <button
            onClick={() => {
              // Trigger the insert to doc functionality
              const button = document.querySelector('[data-insert-to-doc-trigger]') as HTMLElement;
              if (button) button.click();
            }}
            className="flex items-center space-x-1 px-3 py-1.5 bg-linear-to-r from-blue-500 to-purple-600 text-white text-xs font-medium rounded-md hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
            title="Insert AI Component"
          >
            <Sparkles className="w-3 h-3" />
            <span>AI Components</span>
          </button>
          
          {/* Quick Actions */}
          <button
            onClick={() => addBlock("code", { code: "// Your code here", language: "typescript" })}
            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            title="Add Code Block"
          >
            <Code className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => addBlock("table", { rows: 3, cols: 3 })}
            className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
            title="Add Table"
          >
            <Table className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div
        ref={hostRef}
        className="h-[calc(100%-60px)] w-full overflow-auto min-h-[500px] bg-white border border-border rounded-md"
      />
      
      {/* Floating Insert to Doc Button */}
      <div data-insert-to-doc-trigger>
        <InsertToDocButton 
          variant="floating" 
          size="md"
          className="bottom-20 right-6"
        />
      </div>
      
      {/* Slash Menu */}
      {showSlashMenu && (
        <div 
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[280px] max-w-[400px]"
          style={{
            left: slashMenuPosition.x,
            top: slashMenuPosition.y,
          }}
        >
          <input
            type="text"
            placeholder="Search commands..."
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={currentQuery}
            onChange={(e) => setCurrentQuery(e.target.value)}
            autoFocus
          />
          
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {filteredCommands.length > 0 ? (
              filteredCommands.map((command, index) => {
                const IconComponent = command.icon;
                return (
                  <button
                    key={index}
                    className="w-full flex items-center gap-3 p-2 hover:bg-gray-100 rounded text-left"
                    onClick={() => handleSlashCommand(command.name)}
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
      )}
      
      {!ready && (
        <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
          Loading enhanced BlockSuite editor…
        </div>
      )}
    </div>
  );
}