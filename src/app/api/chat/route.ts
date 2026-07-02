import { Groq } from "groq-sdk";
import { buildSystemPrompt } from "@/lib/promptBuilder";
import { getOrCreateSession, manageContextWindow, updateSessionPersona } from "@/lib/contextWindow";

export const runtime = "nodejs";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { persona, sessionId, message } = await req.json();

    if (!persona || !sessionId || !message) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

    // 1. Get or create session
    const session = getOrCreateSession(sessionId, persona);
    
    // Update persona if changed mid-session
    if (session.currentPersona !== persona) {
      updateSessionPersona(sessionId, persona);
    }

    // Append new user message
    session.history.push({ role: "user", content: message });

    // 2. Manage sliding window context & summarize older turns if threshold exceeded
    const updatedSession = await manageContextWindow(sessionId, groq, model);

    // 3. Build system prompt
    const systemPrompt = buildSystemPrompt(updatedSession.currentPersona, updatedSession.summary);

    // 4. Create Groq streaming chat completion
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        ...updatedSession.history,
      ],
      model: model,
      temperature: 0.7,
      stream: true,
    });

    // Create a ReadableStream to stream the response to the client
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let assistantReply = "";
        try {
          for await (const chunk of chatCompletion) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              assistantReply += content;
              controller.enqueue(encoder.encode(content));
            }
          }
          // Save the full assistant reply to history
          updatedSession.history.push({ role: "assistant", content: assistantReply });
        } catch (error) {
          console.error("Streaming error:", error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("API error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
export async function GET(req: Request) {
  // Return history for a session (optional, for frontend initialization if needed)
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId");
  if (!sessionId) {
    return new Response(JSON.stringify({ error: "Missing sessionId" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const session = getOrCreateSession(sessionId, "hitesh");
  return new Response(JSON.stringify(session), {
    headers: { "Content-Type": "application/json" },
  });
}
