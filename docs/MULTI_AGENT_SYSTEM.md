# Multi-Agent System with Switchable System Prompts

**Last Updated:** 2025-11-05  
**Status:** Research & Design Phase  
**Purpose:** Design document for implementing a multi-agent system with switchable system prompts in Tambo

---

## Table of Contents

1. [Current State](#current-state)
2. [Desired Feature](#desired-feature)
3. [Research Findings](#research-findings)
4. [Recommended Architecture](#recommended-architecture)
5. [Implementation Plan](#implementation-plan)
6. [Code Examples](#code-examples)
7. [UI/UX Design](#uiux-design)
8. [Testing Strategy](#testing-strategy)

---

## Current State

### What Works Today

**System Prompt Configuration:**
- System prompts can be set in the Tambo dashboard (https://tambo.co/dashboard)
- The system prompt is configured per project/API key
- Changes to the system prompt reflect immediately in the application
- The prompt is sent with every message to the LLM

**Limitations:**
- ✅ Only **one system prompt** per project
- ❌ No built-in UI for switching between multiple prompts
- ❌ No concept of "agents" with different personalities/behaviors
- ❌ Users must manually change the prompt in the dashboard

### Current Implementation

**TamboProvider Configuration:**
```typescript
// src/app/chat/page.tsx
<TamboProvider
  apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY}
  components={components}
  tools={tools}
  contextHelpers={contextHelpers}
>
  {children}
</TamboProvider>
```

**System Prompt Location:**
- Configured in Tambo dashboard
- Stored server-side by Tambo
- Applied automatically to all messages

---

## Desired Feature

### User Story

> "As a user, I want to switch between different AI agents (e.g., 'Code Assistant', 'Documentation Writer', 'Bug Fixer', 'Feature Planner') via a dropdown menu or similar UI, where each agent has a different personality, expertise, or behavior defined by its system prompt."

### Requirements

**Functional Requirements:**
1. **Multiple Predefined Agents**: Store 4-8 agent configurations with unique system prompts
2. **Easy Switching**: Dropdown menu or similar UI to switch between agents
3. **Persistent Selection**: Remember the selected agent across sessions
4. **Visual Feedback**: Clear indication of which agent is currently active
5. **Agent Metadata**: Each agent has a name, description, icon, and system prompt

**Non-Functional Requirements:**
1. **Performance**: Switching agents should be instant (< 100ms)
2. **Reliability**: Agent selection should persist across page refreshes
3. **Scalability**: Support adding new agents without code changes
4. **Accessibility**: Keyboard navigation and screen reader support

### Example Agents

| Agent Name | Icon | Expertise | System Prompt Focus |
|------------|------|-----------|---------------------|
| Code Assistant | 💻 | Writing and debugging code | "You are an expert software engineer. Focus on writing clean, efficient code with proper error handling." |
| Documentation Writer | 📝 | Creating documentation | "You are a technical writer. Focus on clear, comprehensive documentation with examples." |
| Bug Fixer | 🐛 | Debugging and troubleshooting | "You are a debugging specialist. Focus on identifying root causes and providing fixes." |
| Feature Planner | 🎯 | Planning and architecture | "You are a software architect. Focus on high-level design and planning." |
| Code Reviewer | 👀 | Reviewing code quality | "You are a code reviewer. Focus on best practices, security, and maintainability." |
| Test Writer | 🧪 | Writing tests | "You are a testing expert. Focus on comprehensive test coverage and edge cases." |

---

## Research Findings

### Tambo API Capabilities

**Finding 1: No Built-In Multi-Agent Support**
- ❌ Tambo does not provide built-in multi-agent or prompt switching features
- ❌ The system prompt is configured per API key in the dashboard
- ❌ No API endpoint to dynamically change the system prompt at runtime

**Finding 2: Initial Messages Support**
- ✅ Tambo supports "initial messages" when creating a new thread
- ✅ Initial messages can include system messages
- ✅ This can be used to override or supplement the dashboard system prompt

**Finding 3: Thread-Level Configuration**
- ✅ Each thread can have its own initial messages
- ✅ Threads are isolated from each other
- ✅ Switching agents = creating a new thread with different initial messages

### Relevant Tambo Documentation

**Initial Messages API:**
```typescript
// From Tambo docs: concepts/message-threads/initial-messages
const { threadId } = await createThread({
  initialMessages: [
    {
      role: "system",
      content: "You are a helpful assistant specialized in...",
    },
    {
      role: "user",
      content: "Hello! I need help with...",
    },
  ],
});
```

**Thread Management:**
```typescript
// From Tambo docs: concepts/message-threads/switching-thread
const { switchThread } = useTamboThread();

// Switch to a different thread
switchThread(newThreadId);
```

### Control Bar Component

**Finding 4: Control Bar for Agent Selection**
- ✅ Official `control-bar` component exists
- ✅ Spotlight-style command palette
- ✅ Can be used for quick agent switching
- ❌ Not yet installed in this project

**Potential Use:**
- Use control bar for quick agent switching (Cmd+K → "Switch to Code Assistant")
- Provides keyboard-first UX
- Consistent with modern developer tools

---

## Recommended Architecture

### Approach: Thread-Based Agent Switching

**Core Concept:**
- Each agent = a new thread with a specific system prompt in initial messages
- Switching agents = creating a new thread with the selected agent's system prompt
- Store agent configurations in localStorage or database
- Maintain a mapping of agent → threadId for quick switching

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        User Interface                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Agent Selector Dropdown                              │  │
│  │  [💻 Code Assistant ▼]                                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Agent Manager Service                     │
│  - getAgents(): Agent[]                                      │
│  - selectAgent(agentId): void                                │
│  - getCurrentAgent(): Agent                                  │
│  - createThreadForAgent(agentId): threadId                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Agent Configuration Store                 │
│  - agents: Agent[]                                           │
│  - currentAgentId: string                                    │
│  - agentThreadMap: Map<agentId, threadId>                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Tambo Thread Management                   │
│  - createThread(initialMessages)                             │
│  - switchThread(threadId)                                    │
│  - sendMessage(content)                                      │
└─────────────────────────────────────────────────────────────┘
```

### Data Model

**Agent Configuration:**
```typescript
interface Agent {
  id: string;
  name: string;
  description: string;
  icon: string; // Emoji or icon name
  systemPrompt: string;
  color?: string; // Optional theme color
  capabilities?: string[]; // Optional list of capabilities
}
```

**Agent Store:**
```typescript
interface AgentStore {
  agents: Agent[];
  currentAgentId: string | null;
  agentThreadMap: Map<string, string>; // agentId → threadId
  
  // Actions
  selectAgent: (agentId: string) => Promise<void>;
  getCurrentAgent: () => Agent | null;
  addAgent: (agent: Agent) => void;
  removeAgent: (agentId: string) => void;
  updateAgent: (agentId: string, updates: Partial<Agent>) => void;
}
```

### Storage Strategy

**Option 1: localStorage (Recommended for MVP)**
- ✅ Simple implementation
- ✅ No backend required
- ✅ Persists across sessions
- ❌ Limited to single device
- ❌ No sync across devices

**Option 2: IndexedDB (Recommended for Production)**
- ✅ Larger storage capacity (50+ MB)
- ✅ Already used in this project for document storage
- ✅ Can store complex data structures
- ❌ More complex API
- ❌ Still no cross-device sync

**Option 3: Database (Future Enhancement)**
- ✅ Cross-device sync
- ✅ Centralized management
- ✅ User-specific agent configurations
- ❌ Requires backend
- ❌ More complex implementation

**Recommendation**: Start with localStorage for MVP, migrate to IndexedDB for production, add database sync as future enhancement.

---

## Implementation Plan

### Phase 1: Core Agent System (MVP)

**Tasks:**
1. Create agent configuration file with predefined agents
2. Create Zustand store for agent management
3. Implement agent selection logic with thread creation
4. Add localStorage persistence
5. Create basic agent selector dropdown UI

**Estimated Effort**: 4-6 hours

### Phase 2: Enhanced UI

**Tasks:**
1. Design and implement agent selector dropdown with icons
2. Add agent switching animation/transition
3. Display current agent in header/toolbar
4. Add keyboard shortcuts for agent switching
5. Implement agent preview/description on hover

**Estimated Effort**: 3-4 hours

### Phase 3: Advanced Features

**Tasks:**
1. Implement control-bar integration for quick switching
2. Add agent customization UI (edit system prompts)
3. Add agent import/export functionality
4. Implement agent templates/presets
5. Add agent usage analytics

**Estimated Effort**: 6-8 hours

### Phase 4: Production Hardening

**Tasks:**
1. Migrate to IndexedDB storage
2. Add error handling and retry logic
3. Implement agent validation
4. Add comprehensive tests
5. Document agent system for users

**Estimated Effort**: 4-6 hours

**Total Estimated Effort**: 17-24 hours

---

## Code Examples

### 1. Agent Configuration

```typescript
// src/lib/agents/agent-config.ts
import { Agent } from "./types";

export const DEFAULT_AGENTS: Agent[] = [
  {
    id: "code-assistant",
    name: "Code Assistant",
    description: "Expert software engineer for writing and debugging code",
    icon: "💻",
    color: "#3b82f6",
    systemPrompt: `You are an expert software engineer with deep knowledge of modern programming languages, frameworks, and best practices.

Your primary focus is:
- Writing clean, efficient, and maintainable code
- Following language-specific conventions and idioms
- Implementing proper error handling and edge cases
- Providing clear explanations of your code
- Suggesting optimizations and improvements

When writing code:
1. Always include proper type annotations (TypeScript, Python type hints, etc.)
2. Add comments for complex logic
3. Consider performance implications
4. Follow the project's existing code style
5. Suggest tests for critical functionality

Be concise but thorough. Prioritize code quality over speed.`,
    capabilities: ["coding", "debugging", "refactoring", "optimization"],
  },
  {
    id: "documentation-writer",
    name: "Documentation Writer",
    description: "Technical writer for creating clear, comprehensive documentation",
    icon: "📝",
    color: "#10b981",
    systemPrompt: `You are a technical writer specializing in software documentation.

Your primary focus is:
- Creating clear, comprehensive documentation
- Writing for different audiences (developers, end-users, stakeholders)
- Organizing information logically
- Providing practical examples
- Maintaining consistency in terminology

When writing documentation:
1. Start with a clear overview/summary
2. Use headings and subheadings for structure
3. Include code examples with explanations
4. Add diagrams or visual aids when helpful
5. Provide links to related documentation
6. Include troubleshooting sections

Write in a friendly, professional tone. Assume the reader is intelligent but may not have context.`,
    capabilities: ["documentation", "technical-writing", "examples"],
  },
  {
    id: "bug-fixer",
    name: "Bug Fixer",
    description: "Debugging specialist for identifying and fixing issues",
    icon: "🐛",
    color: "#ef4444",
    systemPrompt: `You are a debugging specialist with expertise in identifying root causes and providing fixes.

Your primary focus is:
- Analyzing error messages and stack traces
- Identifying root causes of bugs
- Providing step-by-step debugging strategies
- Suggesting preventive measures
- Explaining why bugs occurred

When debugging:
1. Ask clarifying questions about the issue
2. Analyze the error message and context
3. Identify the root cause (not just symptoms)
4. Provide a clear fix with explanation
5. Suggest tests to prevent regression
6. Recommend preventive measures

Be systematic and thorough. Don't jump to conclusions without evidence.`,
    capabilities: ["debugging", "troubleshooting", "root-cause-analysis"],
  },
  {
    id: "feature-planner",
    name: "Feature Planner",
    description: "Software architect for planning and designing features",
    icon: "🎯",
    color: "#8b5cf6",
    systemPrompt: `You are a software architect specializing in feature planning and system design.

Your primary focus is:
- High-level system design and architecture
- Breaking down features into tasks
- Identifying dependencies and risks
- Considering scalability and maintainability
- Balancing trade-offs

When planning features:
1. Understand the requirements and constraints
2. Break down the feature into smaller tasks
3. Identify technical dependencies
4. Consider edge cases and error scenarios
5. Suggest implementation approaches
6. Estimate complexity and effort

Think strategically. Consider long-term implications, not just immediate implementation.`,
    capabilities: ["architecture", "planning", "design", "estimation"],
  },
  {
    id: "code-reviewer",
    name: "Code Reviewer",
    description: "Code reviewer focused on quality, security, and best practices",
    icon: "👀",
    color: "#f59e0b",
    systemPrompt: `You are a code reviewer with expertise in code quality, security, and best practices.

Your primary focus is:
- Identifying code quality issues
- Spotting security vulnerabilities
- Ensuring best practices are followed
- Suggesting improvements
- Maintaining consistency

When reviewing code:
1. Check for security vulnerabilities (SQL injection, XSS, etc.)
2. Verify error handling and edge cases
3. Assess code readability and maintainability
4. Check for performance issues
5. Ensure tests are adequate
6. Verify documentation is clear

Be constructive and specific. Explain why something is an issue and how to fix it.`,
    capabilities: ["code-review", "security", "best-practices", "quality"],
  },
  {
    id: "test-writer",
    name: "Test Writer",
    description: "Testing expert for writing comprehensive tests",
    icon: "🧪",
    color: "#06b6d4",
    systemPrompt: `You are a testing expert specializing in comprehensive test coverage and edge cases.

Your primary focus is:
- Writing unit, integration, and end-to-end tests
- Identifying edge cases and boundary conditions
- Ensuring test coverage is adequate
- Writing maintainable tests
- Following testing best practices

When writing tests:
1. Cover happy path scenarios
2. Test edge cases and boundary conditions
3. Test error handling
4. Use descriptive test names
5. Keep tests focused and isolated
6. Mock external dependencies appropriately

Write tests that are clear, maintainable, and provide confidence in the code.`,
    capabilities: ["testing", "unit-tests", "integration-tests", "edge-cases"],
  },
];
```

### 2. Agent Store (Zustand)

```typescript
// src/lib/agents/agent-store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Agent } from "./types";
import { DEFAULT_AGENTS } from "./agent-config";

interface AgentStore {
  agents: Agent[];
  currentAgentId: string | null;
  agentThreadMap: Map<string, string>;
  
  // Actions
  selectAgent: (agentId: string) => Promise<void>;
  getCurrentAgent: () => Agent | null;
  addAgent: (agent: Agent) => void;
  removeAgent: (agentId: string) => void;
  updateAgent: (agentId: string, updates: Partial<Agent>) => void;
  getAgentThread: (agentId: string) => string | null;
  setAgentThread: (agentId: string, threadId: string) => void;
}

export const useAgentStore = create<AgentStore>()(
  persist(
    (set, get) => ({
      agents: DEFAULT_AGENTS,
      currentAgentId: DEFAULT_AGENTS[0].id,
      agentThreadMap: new Map(),
      
      selectAgent: async (agentId: string) => {
        const agent = get().agents.find(a => a.id === agentId);
        if (!agent) {
          throw new Error(`Agent not found: ${agentId}`);
        }
        
        set({ currentAgentId: agentId });
        
        // Thread creation will be handled by the component
        // that uses this store (see next example)
      },
      
      getCurrentAgent: () => {
        const { agents, currentAgentId } = get();
        return agents.find(a => a.id === currentAgentId) || null;
      },
      
      addAgent: (agent: Agent) => {
        set(state => ({
          agents: [...state.agents, agent],
        }));
      },
      
      removeAgent: (agentId: string) => {
        set(state => ({
          agents: state.agents.filter(a => a.id !== agentId),
          currentAgentId: state.currentAgentId === agentId 
            ? state.agents[0]?.id || null 
            : state.currentAgentId,
        }));
      },
      
      updateAgent: (agentId: string, updates: Partial<Agent>) => {
        set(state => ({
          agents: state.agents.map(a => 
            a.id === agentId ? { ...a, ...updates } : a
          ),
        }));
      },
      
      getAgentThread: (agentId: string) => {
        return get().agentThreadMap.get(agentId) || null;
      },
      
      setAgentThread: (agentId: string, threadId: string) => {
        set(state => {
          const newMap = new Map(state.agentThreadMap);
          newMap.set(agentId, threadId);
          return { agentThreadMap: newMap };
        });
      },
    }),
    {
      name: "agent-store",
      // Custom serialization for Map
      partialize: (state) => ({
        agents: state.agents,
        currentAgentId: state.currentAgentId,
        agentThreadMap: Array.from(state.agentThreadMap.entries()),
      }),
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.agentThreadMap)) {
          state.agentThreadMap = new Map(state.agentThreadMap as any);
        }
      },
    }
  )
);
```

### 3. Agent Selector Component

```typescript
// src/components/ui/agent-selector.tsx
"use client";

import { useAgentStore } from "@/lib/agents/agent-store";
import { useTamboThread } from "@tambo-ai/react";
import { useState } from "react";

export function AgentSelector() {
  const { agents, currentAgentId, selectAgent, getCurrentAgent, getAgentThread, setAgentThread } = useAgentStore();
  const { createThread, switchThread } = useTamboThread();
  const [isOpen, setIsOpen] = useState(false);
  
  const currentAgent = getCurrentAgent();
  
  const handleAgentSelect = async (agentId: string) => {
    // Check if we already have a thread for this agent
    let threadId = getAgentThread(agentId);
    
    if (!threadId) {
      // Create a new thread with the agent's system prompt
      const agent = agents.find(a => a.id === agentId);
      if (!agent) return;
      
      const { threadId: newThreadId } = await createThread({
        initialMessages: [
          {
            role: "system",
            content: agent.systemPrompt,
          },
        ],
      });
      
      threadId = newThreadId;
      setAgentThread(agentId, threadId);
    }
    
    // Switch to the agent's thread
    await switchThread(threadId);
    
    // Update current agent
    await selectAgent(agentId);
    
    setIsOpen(false);
  };
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
      >
        <span className="text-xl">{currentAgent?.icon}</span>
        <span className="font-medium">{currentAgent?.name}</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-md shadow-lg border border-gray-200 z-50">
          {agents.map(agent => (
            <button
              key={agent.id}
              onClick={() => handleAgentSelect(agent.id)}
              className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 ${
                agent.id === currentAgentId ? "bg-blue-50" : ""
              }`}
            >
              <span className="text-2xl">{agent.icon}</span>
              <div className="flex-1 text-left">
                <div className="font-medium">{agent.name}</div>
                <div className="text-sm text-gray-600">{agent.description}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## UI/UX Design

### Agent Selector Dropdown

**Location**: Header/toolbar, next to other controls

**Visual Design:**
- Current agent displayed with icon and name
- Dropdown arrow indicator
- Hover state with subtle background change
- Active agent highlighted in dropdown

**Interaction:**
- Click to open dropdown
- Click agent to switch
- Click outside to close
- ESC key to close
- Arrow keys to navigate

### Agent Indicator

**Location**: Message thread header

**Visual Design:**
- Small badge with agent icon
- Agent name in subtle text
- Optional color accent based on agent

**Purpose:**
- Remind user which agent they're talking to
- Provide context for AI responses

---

## Testing Strategy

### Unit Tests

1. **Agent Store Tests**
   - Test agent selection
   - Test agent CRUD operations
   - Test thread mapping
   - Test persistence

2. **Agent Selector Tests**
   - Test dropdown open/close
   - Test agent switching
   - Test keyboard navigation
   - Test thread creation

### Integration Tests

1. **Agent Switching Flow**
   - Select agent → Create thread → Switch thread → Send message
   - Verify system prompt is applied
   - Verify thread isolation

2. **Persistence Tests**
   - Select agent → Refresh page → Verify agent persisted
   - Create threads → Refresh → Verify threads persisted

### E2E Tests

1. **User Journey**
   - Open app → Select "Code Assistant" → Ask coding question → Get code response
   - Switch to "Documentation Writer" → Ask for docs → Get documentation response
   - Verify responses match agent personalities

---

## Next Steps

### Immediate Actions

1. **Create agent configuration file** with 6 predefined agents
2. **Implement agent store** with Zustand + localStorage
3. **Build agent selector component** with basic dropdown UI
4. **Test agent switching** with thread creation

### Future Enhancements

1. **Control Bar Integration**: Use official `control-bar` for quick switching
2. **Agent Customization**: Allow users to edit system prompts
3. **Agent Templates**: Provide templates for common agent types
4. **Agent Analytics**: Track which agents are used most
5. **Cross-Device Sync**: Store agent configurations in database

---

**End of Document**

