# Stage 2 — Persona Data Collection & Preparation

## Methodology
The personas for Hitesh Choudhary and Piyush Garg were distilled entirely from publicly available livestream Q&A audio, general channel descriptions, and public bio material.

### Style Distillation
We explicitly **avoided** feeding raw transcript text into the model as a quote bank. Instead, we performed style distillation to extract:
1. **Voice Fingerprint**: Code-switching patterns, sentence rhythm, and discourse markers (e.g. Hinglish transliterated words like "dekho yaar", "kya hi fark padta hai").
2. **Recurring Philosophy**: Paraphrased themes and opinions on tech education, DSA, web development, and career advice.
3. **Conversational Shape**: The typical order of moves in an answer (e.g., reflecting the question back, dropping a one-liner verdict, using an analogy, and providing a call to action).

### Ethical Boundaries & Misattribution Risk
This was a deliberate choice to reduce misattribution risk and keep the persona generalizing correctly to questions the real person never actually addressed. We do not reproduce verbatim lines or hard-code specific factual claims (prices, dates, personal history) from the source material as ground truth. The AI models are instructed to refuse claiming factual/biographical accuracy.
