import fs from "fs";
import path from "path";
import { ChatMessage } from "./contextWindow";

export function loadPromptFile(filename: string): string {
  const filePath = path.join(process.cwd(), "personas", filename);
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch (error) {
    console.error(`Error reading prompt file ${filename}:`, error);
    return "";
  }
}

export function buildSystemPrompt(persona: "hitesh" | "piyush", conversationSummary?: string): string {
  const guardrails = loadPromptFile("shared-guardrails.md");
  const personaPrompt = loadPromptFile(`${persona}.system.md`);

  let systemPrompt = `=== SHARED GUARDRAILS ===\n${guardrails}\n\n`;
  systemPrompt += `=== PERSONA INSTRUCTIONS ===\n${personaPrompt}\n\n`;

  if (conversationSummary) {
    systemPrompt += `=== CONVERSATION MEMORY SO FAR ===\nBelow is a brief summary of the conversation history before the latest turns. Use this context to maintain consistency:\n${conversationSummary}\n\n`;
  }

  return systemPrompt;
}
