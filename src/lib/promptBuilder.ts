import fs from "fs";
import path from "path";

const promptCache = new Map<string, string>();

export function loadPromptFile(filename: string): string {
  if (promptCache.has(filename)) {
    return promptCache.get(filename)!;
  }
  const filePath = path.join(process.cwd(), "personas", filename);
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    promptCache.set(filename, content);
    return content;
  } catch (error) {
    console.error(`Error reading prompt file ${filename}:`, error);
    return "";
  }
}

export function buildSystemPrompt(persona: "hitesh" | "piyush"): string {
  const guardrails = loadPromptFile("shared-guardrails.md");
  const personaPrompt = loadPromptFile(`${persona}.system.md`);

  let systemPrompt = `=== SHARED GUARDRAILS ===\n${guardrails}\n\n`;
  systemPrompt += `=== PERSONA INSTRUCTIONS ===\n${personaPrompt}\n\n`;

  return systemPrompt;
}
