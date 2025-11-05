import type { TamboComponent } from "@tambo-ai/react";
import { FormComponent, formSchema } from "./form";

/**
 * Form Component Configuration for Tambo
 *
 * This component allows the AI to create interactive forms with various field types.
 * The AI can render forms for data collection, surveys, lead generation, contact forms,
 * feedback forms, and any other user input scenarios.
 */
export const formComponent: TamboComponent = {
  name: "form",
  description: `
Creates a dynamic, multi-field form. Use this tool whenever a user asks to collect structured information.

## When to Use
- The user explicitly asks for a "form", "survey", or "questionnaire".
- The user wants to collect multiple pieces of information at once (e.g., "I need to get their name, email, and phone number").
- The user is creating a lead generation, contact, or feedback form.

## Field Descriptions
- The \`fields\` property is an array of objects, where each object defines a single form field.
- Supported field types are: 'text', 'number', 'select', 'textarea', 'radio', 'checkbox', 'slider', and 'yes-no'.

## Examples
User: "Make me a contact form"
AI Response: Use this component with fields for name (text), email (text), and message (textarea).

## Important Notes
- Do not use this tool for single-question confirmations; a simple text response is better.
- For simple choices, a text response with options is often faster than a full form.
`.trim(),
  component: FormComponent,
  propsSchema: formSchema,
};

