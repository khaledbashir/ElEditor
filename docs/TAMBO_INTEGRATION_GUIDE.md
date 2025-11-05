# Tambo Integration Guide

**Last Updated:** 2025-11-05  
**Purpose:** Comprehensive guide for AI assistants and developers working with Tambo in this project.

---

## Table of Contents

1. [Overview](#overview)
2. [Official Tambo Components](#official-tambo-components)
3. [Component Registration Pattern](#component-registration-pattern)
4. [Custom vs Official Decision Tree](#custom-vs-official-decision-tree)
5. [Architecture Overview](#architecture-overview)
6. [Component Audit Results](#component-audit-results)
7. [Common Patterns](#common-patterns)
8. [Troubleshooting](#troubleshooting)

---

## Overview

### What is Tambo?

Tambo is a generative UI framework that enables AI assistants to dynamically create and render React components in response to user requests. It provides:

- **Component Registration**: Register React components with Zod schemas for prop validation
- **Streaming Support**: Components receive props incrementally as the LLM generates them
- **Tool Integration**: Extend AI capabilities with custom business logic and API integrations
- **Model Context Protocol (MCP)**: Connect to external tools and services

### How We Use Tambo

In this project, Tambo powers:

1. **Dynamic Component Insertion**: AI can insert forms, graphs, and other interactive components into the message thread
2. **Spreadsheet Manipulation**: Tools for updating cells, ranges, and managing spreadsheet data
3. **Document Editing**: BlockSuite editor integration for rich text manipulation
4. **Tab Management**: Tools for creating and managing workspace tabs

**Key Distinction:**
- **Tambo Components**: Dynamic, AI-insertable UI elements (forms, charts, dialogs)
- **Tools**: Functions for manipulating existing persistent UI (spreadsheet operations, tab management)
- **Persistent UI**: Elements like the spreadsheet that are NOT registered as components

---

## Official Tambo Components

Tambo provides 8 official components via the CLI (`npx tambo add <component>`):

### 1. Message Thread Components

#### `message-thread-full`
- **Description**: Full-screen chat interface with history and typing indicators
- **Installation**: `npx tambo add message-thread-full`
- **When to Use**: Building a standalone chat application
- **Docs**: https://docs.tambo.co/concepts/message-threads

#### `message-thread-panel`
- **Description**: Split-view chat with integrated workspace
- **Installation**: `npx tambo add message-thread-panel`
- **When to Use**: Chat alongside other content (e.g., editor, spreadsheet)
- **Docs**: https://docs.tambo.co/concepts/message-threads

#### `message-thread-collapsible`
- **Description**: Collapsible chat for sidebars
- **Installation**: `npx tambo add message-thread-collapsible`
- **When to Use**: Space-constrained layouts, sidebar chat
- **Docs**: https://docs.tambo.co/concepts/message-threads

### 2. Interactive Components

#### `form`
- **Description**: AI-powered form components with 8 field types (text, number, select, textarea, radio, checkbox, slider, yes-no)
- **Installation**: `npx tambo add form`
- **When to Use**: User requests forms, surveys, questionnaires, data collection interfaces
- **Status**: ✅ **Already Installed** in this project
- **Docs**: https://docs.tambo.co/components/form

#### `graph`
- **Description**: Interactive graph visualization with Recharts integration
- **Installation**: `npx tambo add graph`
- **When to Use**: Data visualization, charts, analytics dashboards
- **Status**: ✅ **Already Installed** in this project
- **Docs**: https://docs.tambo.co/components/graph

#### `canvas-space`
- **Description**: Canvas workspace for visual AI interactions
- **Installation**: `npx tambo add canvas-space`
- **When to Use**: Visual design tools, drag-and-drop interfaces, spatial layouts
- **Docs**: https://docs.tambo.co/components/canvas-space

#### `control-bar`
- **Description**: Spotlight-style command palette
- **Installation**: `npx tambo add control-bar`
- **When to Use**: Quick component insertion, search, navigation
- **Docs**: https://docs.tambo.co/components/control-bar

#### `input-fields`
- **Description**: Smart input field components
- **Installation**: `npx tambo add input-fields`
- **When to Use**: Individual input fields with validation and smart features
- **Docs**: https://docs.tambo.co/components/input-fields

---

## Component Registration Pattern

### Step-by-Step Guide

#### 1. Install Official Component (if available)

```bash
npx tambo add <component-name>
```

This automatically:
- Installs the component to `src/components/tambo/<component-name>.tsx`
- Configures CSS and Tailwind setup
- Provides a production-ready implementation

#### 2. Create Zod Schema

Define a Zod schema for prop validation:

```typescript
import { z } from "zod";

export const myComponentSchema = z.object({
  title: z.string().describe("The title to display"),
  items: z.array(z.object({
    id: z.string(),
    label: z.string(),
  })).describe("List of items to render"),
  onSubmit: z.function().optional().describe("Optional callback function"),
});

export type MyComponentProps = z.infer<typeof myComponentSchema>;
```

**Best Practices:**
- Use `.describe()` to provide AI guidance on each field
- Make callbacks optional (AI can't provide functions)
- Provide sensible defaults for optional fields

#### 3. Create Component Registration File

Create `src/components/tambo/<component-name>-component.ts`:

```typescript
import type { TamboComponent } from "@tambo-ai/react";
import { MyComponent, myComponentSchema } from "./my-component";

export const myComponent: TamboComponent = {
  name: "my-component",
  description: `
Creates [brief description]. Use this when a user requests [use cases].

## When to Use
- User asks for [scenario 1]
- User needs [scenario 2]
- User wants to [scenario 3]

## Field Descriptions
- title: [detailed description]
- items: [detailed description with examples]
- onSubmit: [optional callback behavior]

## Examples
User: "Create a task list"
Response: Use this component with title="My Tasks" and items=[...]

User: "Show me a form"
Response: Consider using the form component instead for data collection.

## Important Notes
- [Any limitations or gotchas]
- [Performance considerations]
- [Related components]
  `.trim(),
  component: MyComponent,
  propsSchema: myComponentSchema,
};
```

**Description Guidelines:**
- **Be comprehensive**: 100-300 lines of guidance
- **Include use cases**: When to use vs when not to use
- **Provide examples**: Show typical user requests and how to respond
- **Mention alternatives**: Guide AI to better components when appropriate
- **Document limitations**: Be upfront about what the component can't do

#### 4. Register with TamboProvider

Add to `src/lib/tambo.ts`:

```typescript
import { myComponent } from "@/components/tambo/my-component-component";

export const components: TamboComponent[] = [
  graphComponent,
  formComponent,
  myComponent, // Add your component here
];
```

---

## Custom vs Official Decision Tree

### Decision Flow

```
User requests a feature
    ↓
Does an official Tambo component exist?
    ├─ YES → Use official component (npx tambo add <name>)
    │         ↓
    │         Is customization needed?
    │         ├─ NO → Use as-is
    │         └─ YES → Extend official component
    │
    └─ NO → Is it a persistent UI element?
              ├─ YES → Build as persistent UI + tools
              │         (e.g., spreadsheet, editor)
              └─ NO → Build custom Tambo component
                        ↓
                        Follow Component Registration Pattern
```

### Guidelines

**Use Official Tambo Components When:**
- ✅ An official component exists for your use case
- ✅ The official component meets 80%+ of requirements
- ✅ You want production-ready, tested implementations
- ✅ You need streaming-aware components out of the box

**Build Custom Components When:**
- ✅ No official equivalent exists (e.g., maps, dashboards)
- ✅ Highly specialized business logic required
- ✅ Integration with proprietary systems
- ✅ Unique UX requirements not covered by official components

**Build Persistent UI + Tools When:**
- ✅ Element should persist across messages (e.g., spreadsheet)
- ✅ AI needs to manipulate existing UI, not create new instances
- ✅ State management is complex and shared across components
- ✅ Element is core to the application (not message-specific)

---

## Architecture Overview

### Three-Layer AI Interaction Model

#### 1. Context Helpers (Read-Only Automatic Context)

**Purpose**: Provide AI with automatic context on every message

**Files:**
- `src/lib/spreadsheet-context-helper.ts` - Formats active spreadsheet as markdown table
- `src/lib/spreadsheet-selection-context.ts` - Provides current cell selection

**How It Works:**
- Called automatically on every AI message
- Returns markdown-formatted context
- AI receives this context without explicit tool calls

**Example:**
```typescript
export const spreadsheetContextHelper = {
  name: "spreadsheet-context",
  getContext: async () => {
    const state = useSpreadsheetTabsStore.getState();
    return `Current Spreadsheet:\n${formatAsMarkdownTable(state.data)}`;
  },
};
```

#### 2. Interactables (Structured Metadata)

**Purpose**: Expose UI state as structured metadata to AI

**Files:**
- `src/components/ui/interactable-tabs.tsx` - Exposes tab metadata (names, IDs, active tab)
- `src/components/ui/interactable-spreadsheet.tsx` - (exists but not currently used)

**How It Works:**
- Uses `withInteractable` HOC to publish state updates
- AI receives structured metadata about UI elements
- Enables AI to reference specific UI elements by ID

**Example:**
```typescript
export const InteractableTabs = withInteractable(TabsComponent, {
  getMetadata: () => ({
    tabs: tabs.map(t => ({ id: t.id, name: t.name })),
    activeTab: activeTabId,
  }),
});
```

#### 3. Tools (Mutations)

**Purpose**: Allow AI to manipulate existing UI

**Files:**
- `src/tools/spreadsheet-tools.ts` - 10 tools for spreadsheet manipulation
- `src/tools/tab-tools.ts` - Tools for tab management
- `src/tools/blocksuite-tools.ts` - Tools for document editing

**How It Works:**
- Registered in `src/lib/tambo.ts` tools array
- AI calls tools to perform actions
- Tools mutate Zustand stores or trigger UI updates

**Example:**
```typescript
export const updateCellTool: TamboTool = {
  name: "updateCell",
  description: "Updates a single cell in the spreadsheet",
  parameters: z.object({
    row: z.number(),
    col: z.number(),
    value: z.string(),
  }),
  execute: async ({ row, col, value }) => {
    useSpreadsheetTabsStore.getState().updateCell(row, col, value);
    return { success: true };
  },
};
```

### State Management

**Zustand Stores:**
- `src/lib/canvas-storage.ts` - Canvas/tab state management
- `src/lib/spreadsheet-tabs-store.ts` - Spreadsheet data and operations

**Storage System:**
- **IndexedDB**: Primary storage backend (50+ MB capacity)
- **Thread-Document Association**: Each thread has its own persistent document
- **Auto-Save**: Debounced auto-save with queue management
- **Migration**: Automatic localStorage → IndexedDB migration

**Key Files:**
- `src/lib/storage/` - Core storage system
- `src/lib/storage-system-singleton.ts` - Global storage instance
- `src/hooks/useThreadDocument.ts` - React hook for document management

---

## Component Audit Results

### Official Components (Already Installed)

| Component | Status | Location | Registration |
|-----------|--------|----------|--------------|
| `form` | ✅ Installed | `src/components/tambo/form.tsx` | ✅ Registered in `tambo.ts` |
| `graph` | ✅ Installed | `src/components/tambo/graph.tsx` | ✅ Registered in `tambo.ts` |

### Custom Components (src/components/tambo/)

| Component | Lines | Purpose | Official Equivalent? | Recommendation |
|-----------|-------|---------|---------------------|----------------|
| `ai-canvas-space-component.tsx` | 582 | Enhanced canvas with workspace management | ⚠️ `canvas-space` | **Evaluate**: Compare with official `canvas-space`. If official version meets needs, migrate. |
| `ai-controlbar-component.tsx` | 604 | Spotlight-style command palette | ⚠️ `control-bar` | **Evaluate**: Compare with official `control-bar`. If official version meets needs, migrate. |
| `ai-dashboard-card-component.tsx` | 523 | Metric visualization with status indicators | ❌ None | **Keep**: No official equivalent. Specialized business component. |
| `ai-map-component.tsx` | 538 | Interactive map with markers and heatmaps | ❌ None | **Keep**: No official equivalent. Specialized visualization. |
| `ai-graph-component.tsx` | 383 | Graph with Recharts integration | ⚠️ `graph` | **Evaluate**: We already have official `graph` registered. Consider consolidating. |

### Message Thread Components

| Component | Lines | Purpose | Official Equivalent? | Recommendation |
|-----------|-------|---------|---------------------|----------------|
| `message-thread-full.tsx` | ? | Full-screen chat interface | ✅ `message-thread-full` | **Evaluate**: Compare with official version. |
| `thread-container.tsx` | ? | Thread container wrapper | Part of message-thread | **Evaluate**: May be custom wrapper around official component. |
| `thread-content.tsx` | ? | Thread content renderer | Part of message-thread | **Evaluate**: May be custom wrapper around official component. |
| `thread-history.tsx` | ? | Thread history management | Part of message-thread | **Evaluate**: May be custom wrapper around official component. |

### Persistent UI Components (src/components/ui/)

| Component | Purpose | Type | Keep/Migrate |
|-----------|---------|------|--------------|
| `spreadsheet-tabs.tsx` | Spreadsheet tab interface | Persistent UI | ✅ **Keep**: Core application feature |
| `interactable-spreadsheet.tsx` | Spreadsheet interactable wrapper | Interactable | ✅ **Keep**: Custom integration |
| `interactable-tabs.tsx` | Tab metadata for AI | Interactable | ✅ **Keep**: Custom integration |
| `blocksuite-editor-enhanced.tsx` | Enhanced BlockSuite editor | Persistent UI | ✅ **Keep**: Core application feature |
| `component-stash-panel.tsx` | Component stash UI | Persistent UI | ✅ **Keep**: Custom feature |

### Migration Priority

**High Priority (Evaluate First):**
1. `ai-canvas-space-component.tsx` vs official `canvas-space`
2. `ai-controlbar-component.tsx` vs official `control-bar`
3. `ai-graph-component.tsx` vs official `graph` (already have official registered)

**Medium Priority:**
4. Message thread components vs official message-thread variants

**Low Priority (Keep):**
5. `ai-dashboard-card-component.tsx` - No official equivalent
6. `ai-map-component.tsx` - No official equivalent
7. All persistent UI components - Core application features

---

## Common Patterns

### Pattern 1: Streaming-Aware Components

**Problem**: Props arrive incrementally during LLM generation

**Solution**: Use `useTamboStreamStatus` hook

```typescript
import { useTamboStreamStatus } from "@tambo-ai/react";

export function MyComponent(props: MyComponentProps) {
  const { isStreaming, isComplete } = useTamboStreamStatus();
  
  // Safe destructuring with defaults
  const { title = "Loading...", items = [] } = props || {};
  
  // Validate minimum required props
  if (!isComplete && items.length === 0) {
    return <div>Loading...</div>;
  }
  
  return (
    <div>
      <h1>{title}</h1>
      {items.map(item => <div key={item.id}>{item.label}</div>)}
      {isStreaming && <Spinner />}
    </div>
  );
}
```

### Pattern 2: Optional Callbacks

**Problem**: AI can't provide function implementations

**Solution**: Make callbacks optional with default behavior

```typescript
export const formSchema = z.object({
  fields: z.array(fieldSchema),
  onSubmit: z.function().optional(),
});

export function FormComponent({ fields, onSubmit }: FormProps) {
  const handleSubmit = (data: FormData) => {
    if (onSubmit) {
      onSubmit(data);
    } else {
      // Default behavior: log to console
      console.log("Form submitted:", data);
    }
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Pattern 3: Tool Registration

**Problem**: Need to expose functionality to AI

**Solution**: Register tools in `src/lib/tambo.ts`

```typescript
import { spreadsheetTools } from "@/tools/spreadsheet-tools";
import { tabTools } from "@/tools/tab-tools";

export const tools: TamboTool[] = [
  ...spreadsheetTools,
  ...tabTools,
];
```

### Pattern 4: Context Helpers

**Problem**: AI needs automatic context on every message

**Solution**: Register context helpers in TamboProvider

```typescript
<TamboProvider
  components={components}
  tools={tools}
  contextHelpers={[
    spreadsheetContextHelper,
    selectionContextHelper,
  ]}
>
  {children}
</TamboProvider>
```

---

## Troubleshooting

### Issue 1: AI Not Using Component

**Symptoms**: AI uses low-level tools instead of component

**Causes**:
1. Component not registered in `src/lib/tambo.ts`
2. Component description not clear enough
3. Component name doesn't match user's request

**Solutions**:
1. Verify component is in `components` array
2. Enhance component description with more use cases
3. Add aliases or examples to description

### Issue 2: Component Props Not Streaming

**Symptoms**: Component shows "Loading..." indefinitely

**Causes**:
1. Not using `useTamboStreamStatus` hook
2. Not handling partial props gracefully
3. Required props not marked as optional

**Solutions**:
1. Add `useTamboStreamStatus` hook
2. Use optional chaining: `items?.[0]?.property`
3. Provide defaults: `const { items = [] } = props || {}`

### Issue 3: Tool Not Working

**Symptoms**: AI calls tool but nothing happens

**Causes**:
1. Tool not registered in `src/lib/tambo.ts`
2. Tool parameters don't match schema
3. Tool execution throws error

**Solutions**:
1. Verify tool is in `tools` array
2. Check Zod schema matches function parameters
3. Add error handling and logging to tool

### Issue 4: Component Stale After Update

**Symptoms**: Component doesn't reflect latest changes

**Causes**:
1. Next.js cache not cleared
2. Component not re-exported from index
3. TypeScript types not regenerated

**Solutions**:
1. Restart dev server: `npm run dev`
2. Clear `.next` folder: `rm -rf .next`
3. Regenerate types: `npm run check-types`

### Issue 5: Form Component Required Callback

**Symptoms**: Form component fails without `onSubmit`

**Causes**:
1. `onSubmit` marked as required in schema
2. No default behavior implemented

**Solutions**:
1. Make `onSubmit` optional: `z.function().optional()`
2. Add default logging behavior in component

---

## Next Steps

### Immediate Actions

1. **Evaluate Canvas Space**: Compare `ai-canvas-space-component.tsx` with official `canvas-space`
2. **Evaluate Control Bar**: Compare `ai-controlbar-component.tsx` with official `control-bar`
3. **Consolidate Graph Components**: Decide between `ai-graph-component.tsx` and official `graph`

### Future Enhancements

1. **Install Missing Official Components**: Consider adding `input-fields`, `canvas-space`, `control-bar`
2. **Document Custom Components**: Add comprehensive descriptions to custom components
3. **Create Component Library**: Build a visual catalog of all available components
4. **Add Component Tests**: Write tests for custom components to ensure reliability

---

## Resources

- **Tambo Documentation**: https://docs.tambo.co
- **Tambo GitHub**: https://github.com/tambo-ai/tambo
- **Tambo Discord**: https://tambo.co/discord
- **Tambo Dashboard**: https://tambo.co/dashboard

---

**End of Guide**

