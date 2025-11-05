# Interactable Components
URL: /concepts/components/interactable-components

When you want to place specific components on screen rather than letting Tambo choose which to show, but still want to allow your users to interact with them using natural language, use Tambo's Interactable components.

Unlike regular registered components that Tambo generates and renders from scratch when responding to messages, interactable components are pre-placed by you while still allowing Tambo to modify their props.

## Creating Interactable Components

The easiest way to make a component interactable to Tambo is by using `withInteractable`. Pass in your component, a name, a description, and the props schema, and get an interactable version of your component that Tambo knows about.

<Callout type="info" title="No Registration Required">
  Unlike regular components that need to be registered in the `TamboProvider` components array, interactable components are automatically registered when they mount. You don't need to add them to your components array.
</Callout>

<Callout type="warn" title="Want Inline Generation Too?">
  If you want Tambo to be able to both modify pre-placed instances AND generate new instances inline, you'll need to register the component normally in the `TamboProvider` as well.
</Callout>

```tsx
import { withInteractable } from "@tambo-ai/react";
import { z } from "zod";

// Your existing component
function Note({ title, content, color = "white" }) {
  return (
    <div className={`note note-${color}`}>
      <h3>{title}</h3>
      <p>{content}</p>
    </div>
  );
}

// Make it interactable
const InteractableNote = withInteractable(Note, {
  componentName: "Note",
  description:
    "A simple note component that can display title and content with different colors",
  propsSchema: z.object({
    title: z.string(),
    content: z.string(),
    color: z.enum(["white", "yellow", "blue", "green"]).optional(),
  }),
});

// Another simple component
function Counter({ count, label }) {
  return (
    <div className="counter">
      <span>
        {label}: {count}
      </span>
    </div>
  );
}

const InteractableCounter = withInteractable(Counter, {
  componentName: "Counter",
  description: "A simple counter that displays a label and count value",
  propsSchema: z.object({
    count: z.number(),
    label: z.string(),
  }),
});

// Place both components in your app
function Page() {
  return (
    <div>
      <InteractableNote
        title="Welcome"
        content="This is a simple note that Tambo can update!"
        color="yellow"
      />
      <InteractableCounter count={42} label="Items" />
    </div>
  );
}
```

Now Tambo is able to read and update these components in-place when responding to messages. Users can ask things like:

* "Change the note title to 'Important Reminder'"
* "Update the note content to 'Don't forget the meeting at 3pm'"
* "Make the note blue"
* "Set the counter to 100"
* "Change the counter label to 'Tasks Completed'"

### InteractableConfig

When using `withInteractable`, you provide a configuration object describing the component to Tambo:

```tsx
interface InteractableConfig {
  componentName: string; // Name for Tambo to reference
  description: string; // Description of what the component does
  propsSchema: z.ZodTypeAny; // Schema of props for Tambo to generate
}
```

### How it Works

For each component marked as interactable using `withInteractable`, behind the scenes Tambo stores a state object representing the props of the component, and registers a tool to update that object.

When Tambo decides to update an interactable component while responding to a message, it uses that component's 'update' tool, which updates the state and triggers a re-render of your wrapped component.

## Integration with Tambo Provider

Make sure your app is wrapped with the `<TamboProvider/>`.

```tsx
import { TamboProvider } from "@tambo-ai/react";

function App() {
  return (
    <TamboProvider>
      {/* Your app with interactable components */}
      <InteractableNote />
      <InteractableCounter />
    </TamboProvider>
  );
}
```

This creates a truly conversational interface where users can modify your UI through natural language, making your applications more accessible and user-friendly.

## Automatic Context Awareness

When you use `TamboInteractableProvider`, your interactable components are automatically included in the AI's context. This means:

* The AI knows what components are currently on the page
* Users can ask "What's on this page?" and get a comprehensive answer
* The AI can see the current state (props) of all interactable components
* Component changes are reflected in real-time

**No additional setup required** - this context is provided automatically and can be customized or disabled if needed.

### Example Interactions

With interactable components on the page, users can ask:

* "What components are available?"
* "Change the note title to 'Important Reminder'"
* "Show me the current state of all my components"
* "Make the counter red and set it to 100"

## Customizing Automatic Context

The automatic context can be disabled, enabled selectively, or customized to show only specific information.

### Disable Globally

To disable interactables context across your entire app:

```tsx
<TamboProvider
  apiKey={apiKey}
  contextHelpers={{
    // Disable interactables context globally
    interactables: () => null,
  }}
>
  <TamboInteractableProvider>
    {/* Interactables context is disabled, but components still work */}
    <InteractableNote title="Hidden from AI" />
  </TamboInteractableProvider>
</TamboProvider>
```

### Enable Locally (Override Global Disable)

If you've disabled it globally but want to enable it for a specific page or section:

```tsx
function SpecificPage() {
  const { addContextHelper } = useTamboContextHelpers();
  const snapshot = useCurrentInteractablesSnapshot();

  React.useEffect(() => {
    // Re-enable interactables context for this page only
    const helper = () => {
      if (snapshot.length === 0) return null;

      return {
        description: "Interactable components on this page that you can modify",
        components: snapshot.map((component) => ({
          id: component.id,
          componentName: component.name,
          description: component.description,
          props: component.props,
          propsSchema: component.propsSchema ? "Available" : "Not specified",
        })),
      };
    };

    addContextHelper("interactables", helper);
  }, [addContextHelper, snapshot]);

  return (
    <TamboInteractableProvider>
      {/* Context is now enabled for this page */}
      <InteractableNote title="Visible to AI" />
    </TamboInteractableProvider>
  );
}
```

### Custom Context (IDs Only Example)

Sometimes you might want to share summary information and have the AI request the full context when needed.

This is an example of how to only IDs and names with every message:

```tsx
import {
  useCurrentInteractablesSnapshot,
  useTamboContextHelpers,
} from "@tambo-ai/react";

function IdsOnlyInteractables() {
  const { addContextHelper } = useTamboContextHelpers();
  const snapshot = useCurrentInteractablesSnapshot();

  React.useEffect(() => {
    const idsOnlyHelper = () => {
      if (snapshot.length === 0) return null;

      return {
        description: "Available interactable component ids.",
        components: snapshot.map((component) => ({
          id: component.id,
          componentName: component.name,
          // Deliberately omit props.
        })),
      };
    };

    // Override the default helper with our ids only version
    addContextHelper("interactables", idsOnlyHelper);
  }, [addContextHelper, snapshot]);

  return null; // This component just sets up the context helper
}

// Usage
<TamboInteractableProvider>
  <PrivacyFriendlyInteractables />
  <InteractableNote title="Not visible unless requested." />
  <InteractableCounter count={42} />
</TamboInteractableProvider>;
```

### Filter by Component Type

Maybe you only want to show certain types of components.

Here is an example of how you could filter by component type:

```tsx
function FilteredInteractablesContext() {
  const { addContextHelper } = useTamboContextHelpers();
  const snapshot = useCurrentInteractablesSnapshot();

  React.useEffect(() => {
    const filteredHelper = () => {
      // Only show Notes and Counters, hide other component types
      const allowedTypes = ["Note", "Counter"];
      const filteredComponents = snapshot.filter((component) =>
        allowedTypes.includes(component.name),
      );

      if (filteredComponents.length === 0) return null;

      return {
        description: "Available interactable components (filtered)",
        components: filteredComponents.map((component) => ({
          id: component.id,
          componentName: component.name,
          props: component.props,
        })),
      };
    };

    addContextHelper("interactables", filteredHelper);
  }, [addContextHelper, snapshot]);

  return null;
}
```

## Partial Updates (Property Replacement)

Interactable component props are updated via partial updates. When an update occurs, only the provided top-level props are replaced in the component's existing props. This uses property replacement behavior:

* Providing `{ count: 5 }` only updates `count`, leaving other props unchanged.
* Providing nested objects replaces that nested object entirely, potentially losing other properties within that object.

Example property replacement behavior:

```tsx
// Original props
{
  title: "Original Title",
  config: {
    theme: "light",
    language: "en",
    features: { notifications: true, analytics: false },
  },
}

// Update with a nested object that omits some keys
{
  config: { theme: "dark" }
}

// Resulting props (config object is completely replaced)
{
  title: "Original Title",
  config: {
    theme: "dark",
    // language and features are now undefined because the entire config object was replaced
  },
}
```

Best practice for nested updates: Since nested objects are completely replaced, if you need to update a deeply nested value but keep the rest, provide the full nested object for that branch.

```tsx
// Proper nested update (preserves other nested keys)
{
  config: {
    theme: "light",
    language: "en",
    features: {
      notifications: true,
      analytics: false,
    },
  },
}
```

### Update Results and Errors

Updates return a string status:

* `"Updated successfully"` for successful updates when props actually change
* `"No changes needed - all provided props are identical to current values"` when no props change
* `"Error: Component with ID <id> not found"` when the target does not exist
* `"Warning: No props provided for component with ID <id>."` when the update object is empty/null/undefined

## Auto-registered Tools for Interactables

When there are interactable components present, the following tools are registered automatically to help the AI reason about and modify your UI:

* `get_all_interactable_components` — Returns all interactable components with their current props.
* `get_interactable_component_by_id` — Returns a specific interactable component by id.
* `remove_interactable_component` — Removes a component from the interactables list.
* `update_interactable_component_<id>` — Updates the props for a specific component id using partial props. The argument schema is derived from the component's `propsSchema` and accepts partials.

These tools enable the AI to discover what's on the page and perform targeted updates.

## Snapshot Hook: useCurrentInteractablesSnapshot

Use this hook to read the current interactables without risking accidental mutation of internal state. It returns a cloned snapshot of each item and its props.

```tsx
import {
  useCurrentInteractablesSnapshot,
  useTamboContextHelpers,
} from "@tambo-ai/react";

function InteractablesContextSummary() {
  const { addContextHelper } = useTamboContextHelpers();
  const snapshot = useCurrentInteractablesSnapshot();

  React.useEffect(() => {
    const helper = () => {
      if (snapshot.length === 0) return null;
      return {
        description: "Interactable components currently on screen",
        components: snapshot.map((c) => ({
          id: c.id,
          componentName: c.name,
          props: c.props,
        })),
      };
    };

    addContextHelper("interactables", helper);
  }, [addContextHelper, snapshot]);

  return null;
}
```

## Practical Tips

* For nested updates, provide the complete nested object to avoid unintended `undefined` values, since nested objects are completely replaced.
* Arrays are replaced entirely when provided in partial updates.
* If you need fine-grained nested updates, structure your props to keep critical nested branches small and independent.
* The property replacement behavior is predictable and explicit - you always know exactly what will be updated.

With these tools and behaviors, you can confidently let Tambo adjust parts of your UI through natural language while retaining predictable update semantics. 

# Dynamic Registration
URL: /concepts/components/registering-components-dynamically

For runtime registration of components, you can use the `registerComponent` function from the `useTamboRegistry()` hook. This approach allows you to register components based on conditions, user interactions, or other dynamic factors.

```tsx title="page.tsx"
import { useEffect } from "react";
import { useTamboRegistry } from "@tambo-ai/react";
import { z } from "zod";
import { WeatherDisplay } from "@/components/WeatherDisplay";

// Define simple Zod schemas for component props
const WeatherDisplayProps = z.object({
  city: z.string(),
  temperature: z.number(),
  condition: z.string(),
});

export default function Page() {
  const { registerComponent } = useTamboRegistry();

  useEffect(() => {
    if(someCondition) {
        registerComponent({
            name: "WeatherDisplay",
            description: "A display of the weather in a city.",
            component: WeatherDisplay,
            propsSchema: WeatherDisplayProps,
        })
    }
  }, [registerComponent]);

  return (
    // Your page content
  );
}
```


# React Hooks
URL: /api-reference/react-hooks

The `@tambo-ai/react` npm package provides hooks that expose state values and functions to make building AI apps with Tambo simple.

Here you'll find a description of each state value and function, organized by hook.

### useTamboRegistry

This hook provides helpers for component and tool registration.

#### registerComponent

`const { registerComponent } = useTamboRegistry()`

This function is used to register components with Tambo, allowing them to be potentially used in Tambo's responses.

#### registerTool

`const { registerTool } = useTamboRegistry()`

This function is used to register tools with Tambo.

#### registerTools

`const { registerTools } = useTamboRegistry()`

This function allows registering multiple tools at once.

#### addToolAssociation

`const { addToolAssociation } = useTamboRegistry()`

This function creates an association between components and tools.

#### componentList

`const { componentList } = useTamboRegistry()`

This value provides access to the list of registered components.

#### toolRegistry

`const { toolRegistry } = useTamboRegistry()`

This value provides access to the registry of all registered tools.

#### componentToolAssociations

`const { componentToolAssociations } = useTamboRegistry()`

This value provides access to the associations between components and tools.

### useTamboThread

This hook provides access to the current thread and functions for managing thread interactions.

#### thread

`const { thread } = useTamboThread()`

The current thread object containing messages and metadata. Messages can be accessed via `thread.messages`. This value is kept up-to-date automatically by Tambo when messages are sent or received.

#### sendThreadMessage

`const { sendThreadMessage } = useTamboThread()`

Function to send a user message to Tambo and receive a response. A call to this function will update the provided `thread` state value.

To have the response streamed, use `sendThreadMessage(message, {streamResponse: true})`.

#### generationStage

`const { generationStage } = useTamboThread()`

Current stage of message generation. Possible values are:

* `IDLE`: The thread is not currently generating any response (Initial stage)
* `CHOOSING_COMPONENT`: Tambo is determining which component to use for the response
* `FETCHING_CONTEXT`: Gathering necessary context for the response by calling a registered tool
* `HYDRATING_COMPONENT`: Generating the props for a chosen component
* `STREAMING_RESPONSE`: Actively streaming the response
* `COMPLETE`: Generation process has finished successfully
* `ERROR`: An error occurred during the generation process

#### inputValue

`const { inputValue } = useTamboThread()`

Current value of the thread input field.

#### generationStatusMessage

`const { generationStatusMessage } = useTamboThread()`

Status message describing the current generation state, as generated by Tambo.

#### isIdle

`const { isIdle } = useTamboThread()`

Boolean indicating whether the thread is in an idle state (`generationStage` is `IDLE`, `COMPLETE`, or `ERROR`).

#### switchCurrentThread

`const { switchCurrentThread } = useTamboThread()`

Function to change the active thread by id. This will update the `thread` state value to the fetched thread.

#### addThreadMessage

`const { addThreadMessage } = useTamboThread()`

Function to append a new message to the thread.

#### updateThreadMessage

`const { updateThreadMessage } = useTamboThread()`

Function to modify an existing thread message.

#### setLastThreadStatus

`const { setLastThreadStatus } = useTamboThread()`

Function to update the status of the most recent thread message.

#### setInputValue

`const { setInputValue } = useTamboThread()`

Function to update the input field value.

### useTamboThreadList

This hook provides access to the list of all threads for a project and their loading states.

#### data

`const { data } = useTamboThreadList()`

Array of threads or null if not yet loaded.

#### isPending

`const { isPending } = useTamboThreadList()`

Boolean indicating if threads are currently being fetched.

#### isSuccess

`const { isSuccess } = useTamboThreadList()`

Boolean indicating if threads were successfully fetched.

#### isError

`const { isError } = useTamboThreadList()`

Boolean indicating if an error occurred while fetching threads.

#### error

`const { error } = useTamboThreadList()`

Error object containing details if the fetch failed.

### useTamboThreadInput

This hook provides utilities for building an input interface that sends messages to Tambo.

#### value

`const { value } = useTamboThreadInput()`

Current value of the input field.

#### setValue

`const { setValue } = useTamboThreadInput()`

Function to update the input field value.

#### submit

`const { submit } = useTamboThreadInput()`

Function to submit the current input value, with optional context and streaming configuration.

#### isPending

`const { isPending } = useTamboThreadInput()`

Boolean indicating if a submission is in progress.

#### isSuccess

`const { isSuccess } = useTamboThreadInput()`

Boolean indicating if the last submission was successful.

#### isError

`const { isError } = useTamboThreadInput()`

Boolean indicating if the last submission failed.

#### error

`const { error } = useTamboThreadInput()`

Error object containing details if the submission failed.

### useTamboSuggestions

This hook provides utilities for managing AI-generated message suggestions.

#### suggestions

`const { suggestions } = useTamboSuggestions()`

List of available AI-generated suggestions for the next message.

#### selectedSuggestionId

`const { selectedSuggestionId } = useTamboSuggestions()`

ID of the currently selected suggestion.

#### accept

`const { accept } = useTamboSuggestions()`

Function to accept and apply a suggestion, with an option for automatic submission.

#### acceptResult

`const { acceptResult } = useTamboSuggestions()`

Detailed mutation result for accepting a suggestion.

#### generateResult

`const { generateResult } = useTamboSuggestions()`

Detailed mutation result for generating new suggestions.

#### isPending

`const { isPending } = useTamboSuggestions()`

Boolean indicating if a suggestion operation is in progress.

#### isSuccess

`const { isSuccess } = useTamboSuggestions()`

Boolean indicating if the last operation was successful.

#### isError

`const { isError } = useTamboSuggestions()`

Boolean indicating if the last operation resulted in an error.

#### error

`const { error } = useTamboSuggestions()`

Error object containing details if the operation failed.

### useTamboClient

This hook provides direct access to the Tambo client instance.

#### client

`const { client } = useTamboClient()`

The Tambo client instance for direct API access.

### useTamboComponentState

This hook is similar to React's `useState`, but allows Tambo to see the state values to help respond to later messages.

`const [myValue, setMyValue] = useTamboComponentState()`

#### value and setValue

`const { value } = useTamboComponentState()`

Current state value stored in the thread message for the given key.

#### setValue

`const { setValue } = useTamboComponentState()`

Function to update the state value, synchronizing both local state and server state.

### useTamboContextHelpers

This hook provides dynamic control over context helpers.

#### getContextHelpers

`const { getContextHelpers } = useTamboContextHelpers()`

Returns the current map of registered helper functions keyed by name.

#### addContextHelper

`const { addContextHelper } = useTamboContextHelpers()`

Adds or replaces a helper at the given key.

#### removeContextHelper

`const { removeContextHelper } = useTamboContextHelpers()`

Removes a helper by key so it is no longer included in outgoing messages.

### useCurrentInteractablesSnapshot

`const snapshot = useCurrentInteractablesSnapshot()`

Returns a cloned snapshot of the current interactable components.   # Component State
URL: /concepts/components/component-state

Components generated by Tambo may have internal state values that are updated by user interactions after the component is rendered. To allow Tambo to track the current value of a component's internal state, replace `useState` with `useTamboComponentState`.

This allows Tambo to consider the current state values when responding to subsequent user messages, and allows rendering previous thread messages with their latest values.

import { ImageZoom } from "fumadocs-ui/components/image-zoom";

<ImageZoom src="/assets/docs/use-tambo-component-state.gif" alt="Demo GIF" width={500} height={500} style={{ border: "2px solid #e5e7eb", borderRadius: "8px", width: "80%" }} />

## Tracking State with `useTamboComponentState`

Consider this simple React component that allows a user to update an `emailBody` field, and tracks whether the email has been sent:

```tsx title="Simple email component"

export const EmailSender = () => {
  ...
  const [emailBody, setEmailBody] = useState("") // tracks the message being typed
  const [isSent, setIsSent] = useState(false) // tracks whether the 'send' button has been clicked
  ...
}
```

If Tambo renders this component and the user edits the `emailBody` field, Tambo will not know about the edit. A following user message like "Help me edit what I've typed so far" will not generate a relevant response.

To allow Tambo to see these state values, simply replace `useState` with `useTamboComponentState`, and pass a `keyName` for each value:

```tsx title="Email component with tambo state"
import { useTamboComponentState } from "@tambo-ai/react";

export const EmailSender = () => {
  ...
  const [emailBody, setEmailBody] = useTamboComponentState("emailBody", "");
  const [isSent, setIsSent] = useTamboComponentState("isSent", false);
  ...
}
```

Now tambo will know the current values of `emailBody` and `isSent`.

## Updating editable state from props

Often when we have an editable state value, like the `emailBody` above, we want Tambo to be able to generate and stream in the initial value. If a user sends "Help me generate an email asking about a good time to meet," Tambo should be able to fill in the value with relevant text, and then the user should be able to edit it.

When using `useState` this can be done by adding a `useEffect` that updates the state value with prop value changes:

```tsx title="Simple email component"

export const EmailSender = ({ initialEmailBody }: { initialEmailBody: string }) => {
  ...
  const [emailBody, setEmailBody] = useState("") // tracks the message being typed
  const [isSent, setIsSent] = useState(false) // tracks whether the 'send' button has been clicked

  useEffect(() => {
    setEmailBody(initialEmailBody)
  }, [initialEmailBody])
  ...
}
```

However, when using `useTamboComponentState`, this pattern will cause the initial prop value to overwrite the latest stored state value when re-rendering a previously generated component.

Instead, use the `setFromProp` parameter of `useTamboComponentState` to specify a prop value that should be used to set the initial state value:

```tsx title="Simple email component"

export const EmailSender = ({ initialEmailBody }: { initialEmailBody: string }) => {
  ...
  const [emailBody, setEmailBody] = useTamboComponentState("emailBody", "", initialEmailBody) // tracks the message being typed, and sets initial value from the prop
  const [isSent, setIsSent] = useTamboComponentState("isSent", false) // tracks whether the 'send' button has been clicked
  ...
}
```


# Integrate
URL: /getting-started/integrate

<Callout type="info">
  This example assumes an application using NextJs, but NextJs is not required.
</Callout>

If you have an existing React application and want to add Tambo functionality, follow these steps:

### Step 1: Install tambo-ai

```bash
npx tambo full-send
```

This command will:

* Setup Tambo in your existing project and get you an API key
* Install components that are hooked up to tambo-ai
* Show you how to wrap your app with the `<TamboProvider>`

If you prefer manual setup, you can run `npx tambo init` which will just get you set up with an API key. If you don't have an account yet, <a href="https://tambo.co/dashboard" className="font-medium underline underline-offset-4 decoration-muted-foreground hover:text-foreground hover:decoration-foreground transition-colors">sign up for free</a> first.

### Step 2: Add the TamboProvider

Once the installation completes, update your `src/app/layout.tsx` file to enable Tambo:

```tsx title="src/app/layout.tsx"
"use client";

import { TamboProvider } from "@tambo-ai/react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TamboProvider apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}>
      {children}
    </TamboProvider>
  );
}
```

<Callout type="info" title="API Key Setup">
  You need to create a `.env.local` file in the root of your project to store
  your Tambo API key: `NEXT_PUBLIC_TAMBO_API_KEY=your_api_key_here`
  Replace `your_api_key_here` with the actual API key you received during setup.
  This file should not be committed to version control as it contains sensitive
  information.
</Callout>

Note that the `TamboProvider` only works in the browser. On Next.js, specify
`"use client"` at the top of your file to ensure that the `TamboProvider` is
rendered in the browser.

### Step 3: Add the MessageThreadCollapsible component

The `<MessageThreadCollapsible>` component that the `full-send` command installed provides a complete chat interface for your AI assistant. Here's how to add it to your `src/app/page.tsx` file:

```tsx title="src/app/page.tsx"
"use client";
import { MessageThreadCollapsible } from "../source/components/message-thread-collapsible";

export default function Home() {
  return (
    <main>
      <MessageThreadCollapsible />
    </main>
  );
}
```

### Run your app

```bash
npm run dev
```

When you are done, you should see a chat interface like this:

<div className="flex justify-center my-6">
  <video controls className="rounded-lg border shadow-sm" width="600" height="400">
    <source src="/assets/docs/quickstart-demo.mp4" type="video/mp4" />

    Your browser does not support the video tag.
  </video>
</div>
# Dynamic Control
URL: /concepts/additional-context/dynamic-control

Context helpers can be dynamically managed using the `useTamboContextHelpers` hook.

## Available Functions

```tsx
import { useTamboContextHelpers } from "@tambo-ai/react";

const {
  getContextHelpers, // Get the current map of helpers
  addContextHelper, // Add or replace a helper
  removeContextHelper, // Remove a helper
} = useTamboContextHelpers();
```

**Note:**

* Helpers are just functions; to “disable” a helper, replace it with a function that returns null.
* You can also configure helpers declaratively using `TamboContextHelpersProvider`; both approaches write to the same global registry.

## Add/Replace Helpers at Runtime

Useful when context depends on user actions or app state:

```tsx
function ProjectContextController({ projectId }: { projectId: string }) {
  const { addContextHelper, removeContextHelper } = useTamboContextHelpers();

  useEffect(() => {
    if (!projectId) return;

    addContextHelper("currentProject", async () => ({
      projectId,
      projectName: await getProjectName(projectId),
      projectData: await getProjectData(projectId),
    }));

    return () => {
      removeContextHelper("currentProject");
    };
  }, [projectId]);

  return null;
}
```

## Removing Helpers

```tsx
const { removeContextHelper } = useTamboContextHelpers();

// User logs out
removeContextHelper("session");
```

## Building a Settings UI

`getContextHelpers` returns the current map of helper functions keyed by name.
You can build toggles by swapping in a real function or a no-op function that returns null:

```tsx
function ContextSettings() {
  const { getContextHelpers, addContextHelper } = useTamboContextHelpers();
  const helpers = getContextHelpers();

  return (
    <div>
      <h3>Privacy Settings</h3>
      {Object.keys(helpers).map((key) => (
        <div key={key}>
          <span>{key}</span>
          <button onClick={() => addContextHelper(key, () => null)}>
            Disable
          </button>
        </div>
      ))}
    </div>
  );
}
```

## Register helpers from multiple pages using the Provider

You can also register helpers declaratively at the page or layout level with `TamboContextHelpersProvider`. Helpers are registered when the provider mounts and are active only while that provider remains mounted (for example, while you’re on that page/layout). If the same key is registered multiple times at different times, the most recently mounted provider takes effect for as long as it’s mounted.

**App layout (optional global helpers):**

```tsx title="app/layout.tsx"
import { TamboProvider, TamboContextHelpersProvider } from "@tambo-ai/react";
import { currentTimeContextHelper } from "@tambo-ai/react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TamboProvider
      apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
      contextHelpers={{
        // Global helper available across pages
        userTime: currentTimeContextHelper,
      }}
    ></TamboProvider>
  );
}
```

**Page A (adds a page-specific helper):**

```tsx title="app/dashboard/page.tsx"
"use client";

import { TamboContextHelpersProvider } from "@tambo-ai/react";
import { currentPageContextHelper } from "@tambo-ai/react";
import { MessageThreadFull } from "@/components/tambo/message-thread-full";

export default function DashboardPage() {
  return (
    <TamboContextHelpersProvider
      contextHelpers={{
        // Page-specific helper; overrides any existing "userPage" key
        userPage: currentPageContextHelper,
      }}
    >
      <MessageThreadFull contextKey="dashboard" />
    </TamboContextHelpersProvider>
  );
}
```

**Page B (adds a different helper or overrides a key):**

```tsx title="app/settings/page.tsx"
"use client";

import { TamboContextHelpersProvider } from "@tambo-ai/react";

const getUserSettingsContext = async () => ({
  theme: "dark",
  notifications: true,
});

export default function SettingsPage() {
  return (
    <TamboContextHelpersProvider
      contextHelpers={{
        // Different key; active only while this page is mounted
        userSettings: getUserSettingsContext,
        // Optionally override userPage for this page's context
        // userPage: () => ({ url: "/settings", title: "Settings" }),
      }}
    >
      {/* Components that send messages */}
    </TamboContextHelpersProvider>
  );
}
```

* If you only want a helper active while a page is mounted, register it in that page’s provider (like above), or use the hook with add/remove in a `useEffect` with cleanup.
* Consider namespacing keys if multiple parts of the app might register the same context (e.g., `dashboard:userPage`).

## What Happens Behind the Scenes

When you send a message, Tambo automatically:

1. Calls all configured helper functions.
2. Filters out null/undefined results.
3. Merges the results with any manual `additionalContext`.
4. Sends everything with the message.
# Global Options
URL: /cli/global-options

All Tambo CLI commands support these global options. You can use them with any command to modify behavior, skip prompts, or handle common scenarios.

## Available Options

### `--version`

Shows the current version of the Tambo CLI.

```bash
npx tambo --version
# Output: 1.2.3
```

### `--yes, -y`

Auto-answers "yes" to all confirmation prompts.

**Examples:**

```bash
# Skip all prompts during setup
npx tambo init --yes

# Install components without confirmation
npx tambo add form graph --yes

# Update all components without asking
npx tambo update installed --yes

# Migrate components automatically
npx tambo migrate --yes
```

**Use cases:**

* Automated deployments
* CI/CD pipelines
* Batch operations
* When you're confident about the changes

### `--legacy-peer-deps`

Installs dependencies using npm's `--legacy-peer-deps` flag. This resolves common dependency conflicts.

**Examples:**

```bash
# Install with legacy peer deps
npx tambo init --legacy-peer-deps

# Add components with legacy peer deps
npx tambo add message-thread-full --legacy-peer-deps

# Upgrade project with legacy peer deps
npx tambo upgrade --legacy-peer-deps
```

**When to use:**

* Getting peer dependency warnings
* Working with older React versions
* Complex dependency trees
* Corporate environments with strict package policies

<Callout type="info" title="Dependency Conflicts">
  If you see errors like "unable to resolve dependency tree" or peer dependency
  warnings, try adding `--legacy-peer-deps` to your command.
</Callout>

### `--prefix <path>`

Specifies a custom directory for components instead of the default `components/tambo`.

**Examples:**

```bash
# Install components in src/components/ui
npx tambo add form --prefix=src/components/ui

# List components in custom directory
npx tambo list --prefix=src/components/ui

# Update components in custom location
npx tambo update installed --prefix=src/components/custom

# Migrate from custom source to custom destination
npx tambo migrate --prefix=src/components/tambo
```

**Common prefix patterns:**

* `src/components/ui` - Traditional UI components directory
* `src/components/tambo` - Dedicated Tambo directory in src
* `app/components/ui` - App router components
* `lib/components` - Library-style organization

### `--dry-run`

Preview changes before applying them. Available for commands that modify files.

**Examples:**

```bash
# Preview migration changes
npx tambo migrate --dry-run

# Preview component updates
npx tambo update installed --dry-run

# Preview upgrade changes
npx tambo upgrade --dry-run
```

**Output example:**

```
🔍 Dry run mode - no changes will be made

The following changes would be applied:
  📁 Move: components/ui/form.tsx → components/tambo/form.tsx
  📁 Move: components/ui/graph.tsx → components/tambo/graph.tsx
  📝 Update: lib/tambo.ts (import paths)

Run without --dry-run to apply these changes.
```

## Combining Options

You can combine multiple options in a single command:

```bash
# Install components with custom prefix, skip prompts, and handle conflicts
npx tambo add form graph --prefix=src/components/ui --yes --legacy-peer-deps

# Upgrade with all safety options
npx tambo upgrade --dry-run --prefix=src/components/ui

# Migrate automatically with custom paths
npx tambo migrate --yes --prefix=src/components/custom
```

## Command-Specific Options

Some commands have additional options beyond these global ones:

### `create-app` specific options

```bash
# Initialize git repository
npx tambo create-app my-app --init-git

# Use specific template
npx tambo create-app my-app --template=mcp
```

### `add` specific options

```bash
# Preview component before installing
npx tambo add form --preview

# Install multiple components
npx tambo add form graph canvas-space
```

## Best Practices

### For Development

```bash
# Safe exploration - always preview first
npx tambo migrate --dry-run
npx tambo upgrade --dry-run

# Quick iterations
npx tambo add form --yes
npx tambo update form --yes
```

## Troubleshooting

### Common Issues

**Issue: Command not found**

```bash
# Check CLI version
npx tambo --version

# Update to latest
npm install -g @tambo-ai/cli@latest
```

**Issue: Permission errors**

```bash
# Use npx instead of global install
npx tambo init --yes
```

**Issue: Dependency conflicts**

```bash
# Use legacy peer deps
npx tambo add form --legacy-peer-deps
```

**Issue: Wrong directory**

```bash
# Check current components
npx tambo list

# Use correct prefix
npx tambo list --prefix=src/components/ui
```
# CSS & Tailwind Configuration
URL: /cli/configuration

The Tambo CLI automatically configures your CSS and Tailwind setup based on your project's Tailwind CSS version. This page explains what changes are made and how to configure them manually if needed.

## What Gets Configured

When you run Tambo CLI commands (`full-send`, `add`, `update`, `upgrade`), the CLI:

1. **Detects your Tailwind CSS version** (v3 or v4)
2. **Updates your `globals.css`** with required CSS variables
3. **Updates your `tailwind.config.ts`** (v3 only) with basic configuration
4. **Preserves your existing styles** and configuration

<Callout type="info" title="Automatic Detection">
  The CLI automatically detects your Tailwind version from your `package.json`
  and applies the appropriate configuration format. You don't need to specify
  which version you're using.
</Callout>

## CSS Variables Added

Tambo components require specific CSS variables to function properly. The CLI adds these in the appropriate format for your Tailwind version:

### Core Tailwind Variables

These standard Tailwind CSS variables are added with Tambo's default color scheme:

```css
/* Light mode */
--background: /* White or appropriate light background */ --foreground:
  /* Dark text color */
  --primary: /* Tambo brand primary color */
  --secondary: /* Secondary accent color */
  --muted: /* Muted backgrounds and borders */ --border: /* Border colors */
  /* ... additional standard Tailwind variables */;
```

### Tambo-Specific Variables

These custom variables control Tambo component layouts and behavior:

```css
/* Layout dimensions */
--panel-left-width: 500px;
--panel-right-width: 500px;
--sidebar-width: 3rem;

/* Container and backdrop styles */
--container: /* Light container background */ --backdrop:
  /* Modal backdrop opacity */
  --muted-backdrop: /* Subtle backdrop for overlays */ /* Border radius */
  --radius: 0.5rem;
```

<Callout type="warn" title="Required Variables">
  The Tambo-specific variables (`--panel-left-width`, `--panel-right-width`,
  `--sidebar-width`, `--container`, `--backdrop`, `--muted-backdrop`) are
  essential for proper component functionality. Removing these will break
  component layouts.
</Callout>

## Tailwind CSS v3 Configuration

For Tailwind v3 projects, the CLI uses the `@layer base` approach:

### Complete globals.css for v3

```css title="app/globals.css"
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Default Tailwind CSS Variables customized with tambo colors */
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;
    --primary: 235 12% 21%;
    --primary-foreground: 0 0% 98%;
    --secondary: 218 11% 46%;
    --secondary-foreground: 0 0% 100%;
    --muted: 217 14% 90%;
    --muted-foreground: 217 14% 68%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    --destructive: 0 84.2% 60.2%;
    --border: 207 22% 90%;
    --input: 240 5.9% 90%;
    --ring: 240 10% 3.9%;
    --chart-1: 30 80% 54.9%;
    --chart-2: 339.8 74.8% 54.9%;
    --chart-3: 219.9 70.2% 50%;
    --chart-4: 160 60% 45.1%;
    --chart-5: 280 64.7% 60%;

    /* Tambo Specific Variables needed for tambo components */
    --radius: 0.5rem;
    --container: 210 29% 97%;
    --backdrop: 210 88% 14% / 0.25;
    --muted-backdrop: 210 88% 14% / 0.1;
    --panel-left-width: 500px;
    --panel-right-width: 500px;
    --sidebar-width: 3rem;
  }
  .dark {
    /* Default Tailwind CSS Variables customized with tambo colors */
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --card: 240 10% 3.9%;
    --card-foreground: 0 0% 98%;
    --popover: 240 10% 3.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 240 5.9% 10%;
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    --accent: 240 3.7% 15.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --ring: 240 4.9% 83.9%;
    --chart-1: 30 80% 54.9%;
    --chart-2: 339.8 74.8% 54.9%;
    --chart-3: 219.9 70.2% 50%;
    --chart-4: 160 60% 45.1%;
    --chart-5: 280 64.7% 60%;

    /* Tambo Specific Variables needed for tambo components */
    --radius: 0.5rem;
    --container: 210 29% 97%;
    --backdrop: 210 88% 14% / 0.25;
    --muted-backdrop: 210 88% 14% / 0.1;
    --panel-left-width: 500px;
    --panel-right-width: 500px;
    --sidebar-width: 3rem;
  }
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
}
```

### tailwind.config.ts for v3

```tsx title="tailwind.config.ts"
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  // Your existing theme config is preserved and merged
};

export default config;
```

## Tailwind CSS v4 Configuration

Tailwind v4 uses CSS-first configuration with a different approach:

### Complete globals.css for v4

```css title="app/globals.css"
@import "tailwindcss";

@custom-variant dark (&:is(.dark *));

@theme inline {
  /* Tailwind CSS Variables customized with tambo colors */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);

  /* Tambo Specific Variables needed for tambo components */
  --color-container: var(--container);
  --color-backdrop: var(--backdrop);
  --color-muted-backdrop: var(--muted-backdrop);
}

:root {
  /* Default Tailwind CSS Variables customized with tambo colors */
  --background: oklch(1 0 0);
  --foreground: oklch(0.14 0 285);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.14 0 285);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.14 0 285);
  --primary: oklch(0.31 0.02 281);
  --primary-foreground: oklch(0.98 0 0);
  --secondary: oklch(0.54 0.027 261);
  --secondary-foreground: oklch(1 0 0);
  --muted: oklch(0.92 0 260);
  --muted-foreground: oklch(0.73 0.022 260);
  --accent: oklch(0.97 0 286);
  --accent-foreground: oklch(0.21 0 286);
  --destructive: oklch(0.64 0.2 25);
  --border: oklch(0.93 0 242);
  --input: oklch(0.92 0 286);
  --ring: oklch(0.14 0 285);
  --chart-1: oklch(0.72 0.15 60);
  --chart-2: oklch(0.62 0.2 6);
  --chart-3: oklch(0.53 0.2 262);
  --chart-4: oklch(0.7 0.13 165);
  --chart-5: oklch(0.62 0.2 313);

  /* Tambo Specific Variables needed for tambo components */
  --container: oklch(0.98 0 247);
  --backdrop: oklch(0.25 0.07 252 / 0.25);
  --muted-backdrop: oklch(0.25 0.07 252 / 0.1);
  --radius: 0.5rem;
  --panel-left-width: 500px;
  --panel-right-width: 500px;
  --sidebar-width: 3rem;
}

.dark {
  /* Dark Mode Tailwind CSS Variables customized with tambo colors */
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
  --chart-1: oklch(0.72 0.15 60);
  --chart-2: oklch(0.62 0.2 6);
  --chart-3: oklch(0.53 0.2 262);
  --chart-4: oklch(0.7 0.13 165);
  --chart-5: oklch(0.62 0.2 313);

  /* Tambo Specific Variables needed for tambo components */
  --container: oklch(0.98 0 247);
  --backdrop: oklch(0.25 0.07 252 / 0.25);
  --muted-backdrop: oklch(0.25 0.07 252 / 0.1);
  --radius: 0.5rem;
  --panel-left-width: 500px;
  --panel-right-width: 500px;
  --sidebar-width: 3rem;
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
    font-family: Arial, Helvetica, sans-serif;
  }
}
```

<Callout type="info" title="Tailwind v4 Configuration">
  With Tailwind v4, most configuration is done in CSS using `@theme inline`. The
  JavaScript config file is not needed.
</Callout>

## Manual Configuration

If you need to manually configure these files or the automatic setup doesn't work:

### 1. Check Your Tailwind Version

```bash
npm list tailwindcss
# or check package.json
```

### 2. Copy the Appropriate CSS

Choose the v3 or v4 format based on your version and copy the complete CSS above into your `globals.css` file.

### 3. Update Tailwind Config (v3 only)

For v3, ensure your `tailwind.config.ts` includes `darkMode: "class"` and the proper content paths.

### 4. Verify Required Variables

Ensure these Tambo-specific variables are present:

* `--panel-left-width`
* `--panel-right-width`
* `--sidebar-width`
* `--container`
* `--backdrop`
* `--muted-backdrop`
* `--radius`

## Merging with Existing Styles

<Callout type="warn" title="Preserving Custom Styles">
  If you already have CSS variables defined, you'll want to merge them carefully
  rather than replacing your entire file. The CLI automatically preserves
  existing variables, but manual setup requires more care.
</Callout>

### If you have existing CSS variables:

1. **Keep your existing variables** that aren't listed in the Tambo configuration
2. **Add missing Tambo variables** from the appropriate version above
3. **Update conflicting variables** if you want to use Tambo's color scheme
4. **Preserve your custom styling** outside of the CSS variables

### If you have existing `@layer base` blocks:

For Tailwind v3, add the Tambo variables inside your existing `@layer base` block rather than creating a duplicate.

## Troubleshooting

### Components Look Broken

**Problem**: Components have no styling or look broken

**Solution**: Check that all CSS variables are present in your `globals.css`

### Dark Mode Not Working

**Problem**: Dark mode styles not applying

**Solution**:

* For v3: Ensure `darkMode: "class"` in `tailwind.config.ts`
* For v4: Check `@custom-variant dark` is present
* Verify `.dark` class variables are defined

### Version Mismatch

**Problem**: Wrong CSS format for your Tailwind version

**Solution**:

* Check your Tailwind version with `npm list tailwindcss`
* Use v3 format (HSL) for Tailwind 3.x
* Use v4 format (OKLCH) for Tailwind 4.x

### Layout Issues

**Problem**: Panels or sidebars have wrong dimensions

**Solution**: Ensure Tambo layout variables (`--panel-left-width`, etc.) are defined and have appropriate values

### Existing Styles Overridden

**Problem**: Your custom CSS variables got replaced

**Solution**: The CLI preserves existing variables, but if manually copying, merge with your existing styles rather than replacing them

## CLI Behavior

### What the CLI Does

* ✅ **Preserves existing styles**: Your custom CSS is kept
* ✅ **Adds only missing variables**: Won't override your existing variables
* ✅ **Backs up files**: Creates `.backup` files before making changes
* ✅ **Shows diffs**: Previews changes before applying them
* ✅ **Asks permission**: Prompts before modifying existing files

### What the CLI Doesn't Do

* ❌ **Override existing variables**: Your customizations are preserved
* ❌ **Change your color scheme**: Only adds missing standard variables
* ❌ **Modify other CSS**: Only touches CSS variable definitions
* ❌ **Break existing config**: Merges with your existing Tailwind config

<Callout type="info" title="Safe Configuration">
  The CLI is designed to be safe and non-destructive. It preserves your existing
  configuration and only adds what's needed for Tambo components to work.
</Callout>
# Common Workflows
URL: /cli/workflows

This guide covers the most common workflows you'll use with the Tambo CLI, organized by scenario and use case.

## Getting Started Workflows

### New Project Setup

For brand new projects, use the template approach:

```bash
# Create new project with template
npm create tambo-app@latest my-tambo-app
cd my-tambo-app

# Complete setup with API key
npx tambo init

# Start development
npm run dev
```

### Adding to Existing Project

For existing React/Next.js projects:

```bash
# Quick setup with components
npx tambo full-send

# Or step-by-step approach
npx tambo init
npx tambo add message-thread-full
```

<Callout type="info" title="API Key Required">
  After running `init` or `full-send`, make sure to add your API key to
  `.env.local`: `NEXT_PUBLIC_TAMBO_API_KEY=your_api_key_here`
</Callout>

## Component Management Workflows

### Adding Components Strategically

Start with core components, then add specialized ones:

```bash
# 1. Start with a message interface
npx tambo add message-thread-collapsible

# 2. Add form capabilities
npx tambo add form

# 3. Add visualization components
npx tambo add graph canvas-space

# 4. Add advanced interactions
npx tambo add control-bar
```

### Checking What's Installed

```bash
# See what components you have
npx tambo list

# Check if updates are available
npx tambo update --dry-run
```

## Development Workflows

### Building a Chat Interface

```bash
# 1. Setup project
npx tambo init

# 2. Add chat component
npx tambo add message-thread-full

# 3. Configure in your app
# Add TamboProvider to layout.tsx
# Import and use MessageThreadFull component
```

### Building a Form Experience

```bash
# 1. Add form components
npx tambo add form input-fields

# 2. Register form-related tools in lib/tambo.ts
# 3. Create form validation components
```

### Building a Data Visualization App

```bash
# 1. Add visualization components
npx tambo add graph canvas-space

# 2. Add control interface
npx tambo add control-bar

# 3. Register data tools for fetching/processing
```

## Maintenance Workflows

### Keeping Everything Updated

```bash
# Option 1: Update everything at once
npx tambo upgrade

# Option 2: Update selectively
npx tambo update installed  # All components
npx tambo update form graph # Specific components
```

### Migrating from Legacy Structure

If you installed Tambo components before the directory structure change (more info [here](https://docs.tambo.co/cli/commands/migrate)):

```bash
# 1. Check what needs migration
npx tambo migrate --dry-run

# 2. Perform migration
npx tambo migrate

# 3. Test everything still works
npm run dev
```

## Troubleshooting Workflows

### Dependency Conflicts

If you encounter peer dependency issues:

```bash
# Use legacy peer deps flag
npx tambo add message-thread-full --legacy-peer-deps
npx tambo upgrade --legacy-peer-deps
```

### Component Not Working

```bash
# 1. Check if component is properly installed
npx tambo list

# 2. Update to latest version
npx tambo update <component-name>

# 3. Check your TamboProvider setup
# Make sure API key is set
# Verify component is imported correctly
```

### Clean Reinstall

```bash
# 1. Remove existing components
rm -rf components/tambo/*

# 2. Reinstall fresh
npx tambo add message-thread-full form graph

# 3. Update configuration
npx tambo upgrade
```

## Quick Reference

### Most Common Commands

```bash
# Quick setup
npx tambo full-send

# Add components
npx tambo add message-thread-full form

# Update everything
npx tambo upgrade

# Check status
npx tambo list
```

### Flags You'll Use Often

For detailed information about all available flags and options, see the [Global Options](/cli/global-options) page.

Quick reference:

* `--yes` - Skip confirmation prompts
* `--legacy-peer-deps` - Fix dependency conflicts
* `--prefix=<path>` - Custom component directory
* `--dry-run` - Preview changes before applying
# Chat Starter App
URL: /examples-and-templates/chat-starter-app

<img src="/assets/docs/template.gif" alt="Demo GIF" style={{ border: "2px solid #e5e7eb", borderRadius: "8px", width: "80%" }} />

[Github](https://github.com/tambo-ai/tambo-template?tab=readme-ov-file#tambo-template)

```bash title="Install the starter app:"
npm create tambo-app@latest my-tambo-app
```

This template app shows how to setup the fundamental parts of an AI application using tambo:

**Component registration**

See in [src/lib/tambo.ts](https://github.com/tambo-ai/tambo-template/blob/main/src/lib/tambo.ts) how a graph component is registered with tambo.

**Tool Registration**

See in [src/lib/tambo.ts](https://github.com/tambo-ai/tambo-template/blob/main/src/lib/tambo.ts) how population data tools are registered with tambo.

**UI for sending messages to tambo and showing responses**

The components used within [src/components/tambo/message-thread-full.tsx](https://github.com/tambo-ai/tambo-template/blob/main/src/components/tambo/message-thread-full.tsx) use hooks from tambo's react SDK to send messages and show the thread history.

**Wrap the app with the `TamboProvider`**

In [src/app/chat/page.tsx](https://github.com/tambo-ai/tambo-template/blob/main/src/app/chat/page.tsx) we wrap the page with the `TamboProvider` to enable the usage of tambo's react SDK within the message sending and thread UI components.
# Supabase MCP Client App
URL: /examples-and-templates/supabase-mcp-client

Add MCP server tools and UI tools to a React app using tambo to build an AI app with minimal custom code.

Use this as a starting point to build apps to interact with any MCP server.

<img src="/assets/docs/supabase-mcp-client-short.gif" alt="Demo GIF" style={{ border: "2px solid #e5e7eb", borderRadius: "8px", width: "80%" }} />

[Github](https://github.com/tambo-ai/supabase-mcp-client/tree/main?tab=readme-ov-file#supabase-mcp-client-react-app)

This application makes use of tambo's `TamboMcpProvider` to easily add the tools defined by the official [Supabase MCP server](https://github.com/supabase-community/supabase-mcp).

Custom react components to show interactive visualizations of the responses from the Supabase tools are registered with tambo in [src/lib/tambo.ts](https://github.com/tambo-ai/supabase-mcp-client/blob/main/src/lib/tambo.ts)
# Supabase MCP Client App
URL: /examples-and-templates/supabase-mcp-client

Add MCP server tools and UI tools to a React app using tambo to build an AI app with minimal custom code.

Use this as a starting point to build apps to interact with any MCP server.

<img src="/assets/docs/supabase-mcp-client-short.gif" alt="Demo GIF" style={{ border: "2px solid #e5e7eb", borderRadius: "8px", width: "80%" }} />

[Github](https://github.com/tambo-ai/supabase-mcp-client/tree/main?tab=readme-ov-file#supabase-mcp-client-react-app)

This application makes use of tambo's `TamboMcpProvider` to easily add the tools defined by the official [Supabase MCP server](https://github.com/supabase-community/supabase-mcp).

Custom react components to show interactive visualizations of the responses from the Supabase tools are registered with tambo in [src/lib/tambo.ts](https://github.com/tambo-ai/supabase-mcp-client/blob/main/src/lib/tambo.ts)

# create-app
URL: /cli/commands/create-app

`npx tambo create-app [directory]` or `npm create tambo-app my-app`

Creates a new Tambo app from a template. Choose from pre-built templates to get started quickly with different use cases.

**Available Templates:**

* `standard` - Tambo + Tools + MCP - general purpose AI app template with MCP integration
* `analytics` - Generative UI analytics template with drag-and-drop canvas and data visualization
* More templates coming soon!

**Examples:**

```bash
# Create app with interactive prompts
npx tambo create-app

# Create in current directory
npx tambo create-app .

# Create with specific template
npx tambo create-app my-app --template=mcp

# Initialize git repository automatically
npx tambo create-app my-app --init-git

# Use legacy peer deps
npx tambo create-app my-app --legacy-peer-deps
```

**Manual Setup After Creating:**

```bash
cd my-app
npx tambo init         # Complete setup with API key
npm run dev            # Start development server
```
