# Stage 3 — Context Management Strategy

## Prompt Structure
For each request to the LLM, the system constructs a dynamic prompt:
1. Shared Guardrails (Disclosure rules, boundaries).
2. Persona-Specific System Instructions (Voice fingerprint, philosophy, shape).
3. Rolling Conversation History (Last N turns).
4. Current User Message.

## Sliding Window & Summarization
To prevent long chats from blowing the context window or causing the persona to drift, we implemented a sliding-window memory approach:
- The system stores an in-memory session mapping `sessionId` to the conversation history.
- We maintain the last ~12 messages (6 turns) as active, raw context.
- When the history exceeds ~16 messages, the older messages are automatically sent to the LLM (using a low-temperature summarization prompt) to generate a 2-3 sentence **Conversation Memory Note**.
- This memory note is prepended to the system prompt in subsequent requests, ensuring the model remembers the topic without needing the raw tokens.

## Mid-Session Persona Switching
When the user switches from Hitesh to Piyush (or vice-versa) mid-session:
- The `sessionId` and conversation history (including the summarized topic memory) are retained.
- The backend rebuilds the prompt using the *new* persona's system instructions.
- This allows the new persona to seamlessly pick up the technical conversation where the previous one left off, just in a different teaching voice.
