import { Groq } from "groq-sdk";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface SessionData {
  history: ChatMessage[];
  summary: string;
  currentPersona: "hitesh" | "piyush";
}

// In-memory session store (simple Map)
const sessionsStore = new Map<string, SessionData>();

export function getOrCreateSession(sessionId: string, initialPersona: "hitesh" | "piyush"): SessionData {
  if (!sessionsStore.has(sessionId)) {
    sessionsStore.set(sessionId, {
      history: [],
      summary: "",
      currentPersona: initialPersona,
    });
  }
  return sessionsStore.get(sessionId)!;
}

export function updateSessionPersona(sessionId: string, persona: "hitesh" | "piyush") {
  const session = getOrCreateSession(sessionId, persona);
  session.currentPersona = persona;
}

/**
 * Periodically compresses history when it exceeds the limit
 * Keep the last N messages, summarize everything before that.
 */
export async function manageContextWindow(
  sessionId: string,
  groq: Groq,
  model: string,
  maxHistoryLength = 10 // Turn threshold (approx 10 messages)
): Promise<SessionData> {
  const session = sessionsStore.get(sessionId);
  if (!session) {
    return { history: [], summary: "", currentPersona: "hitesh" };
  }

  // If history exceeds max history length, we summarize the oldest part
  if (session.history.length > maxHistoryLength) {
    // Keep the last 4 messages (2 turns) as active context
    const keepCount = 4;
    const toSummarize = session.history.slice(0, session.history.length - keepCount);
    const toKeep = session.history.slice(session.history.length - keepCount);

    const formattedHistory = toSummarize
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n");

    try {
      const prompt = `You are a helpful assistant. Summarize the following part of the conversation history in 2-3 sentences. Preserve key topics discussed, questions asked, and answers given. Avoid repeating greetings or meta talk.\n\nPrevious Summary: ${session.summary}\n\nRecent messages to summarize:\n${formattedHistory}`;
      
      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: model,
        temperature: 0.3,
        max_tokens: 150,
      });

      const newSummary = completion.choices[0]?.message?.content || session.summary;
      session.summary = newSummary.trim();
      session.history = toKeep;
    } catch (error) {
      console.error("Error summarizing history:", error);
      // Fallback: don't truncate if summarization fails
    }
  }

  return session;
}
