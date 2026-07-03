import { Groq } from "groq-sdk";
import { buildSystemPrompt } from "@/lib/promptBuilder";

export const runtime = "nodejs";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { persona, messages } = await req.json();

    if (!persona || !messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Missing required fields or invalid format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

    // Build system prompt
    const systemPrompt = buildSystemPrompt(persona);

    // Map messages to ensure only valid fields are sent to Groq API
    const cleanMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Create Groq streaming chat completion
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        ...cleanMessages,
      ],
      model: model,
      temperature: 0.7,
      stream: true,
    });

    // Create a ReadableStream to stream the response to the client
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of chatCompletion) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
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
