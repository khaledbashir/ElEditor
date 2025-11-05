import type { TamboComponent } from "@tambo-ai/react";
import { Graph, graphSchema } from "./graph";

/**
 * Graph Component Configuration for Tambo
 *
 * This component allows the AI to create charts and graphs from spreadsheet data.
 * The AI can render bar charts, line charts, and pie charts by reading data from
 * spreadsheet tabs.
 */
export const graphComponent: TamboComponent = {
  name: "graph",
  description: `
Creates an interactive data visualization graph using Recharts. Use this when the user wants to see data represented visually as a chart.

## When to Use
- The user explicitly asks for a "graph", "chart", or "plot".
- The user wants to visualize a dataset from the spreadsheet.
- The user is asking to see trends, comparisons, or distributions in numerical data.

## Field Descriptions
- The \`data\` property is an array of objects, where each object is a data point.
- The \`type\` property can be 'bar', 'line', 'area', etc.

## Examples
User: "Show me a bar chart of the sales data in the spreadsheet"
AI Response: First, use a tool to read the data from the spreadsheet. Then, use this graph component with the retrieved data.

## Important Notes
- This component is for visualizing data, not for creating editable diagrams. For that, consider the canvas component.
- Always ensure the data is in the correct format (an array of objects) before passing it to this component.
`.trim(),
  component: Graph,
  propsSchema: graphSchema,
};
