"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Send, User, Trash2, Code, Zap, Loader2, Bot, AlertTriangle } from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export default function ChatPage() {
  const [persona, setPersona] = useState<"hitesh" | "piyush">("hitesh");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Generate a simple session ID on mount
  useEffect(() => {
    setSessionId(Math.random().toString(36).substring(7));
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleClearChat = () => {
    if (confirm("Are you sure you want to clear the chat history?")) {
      setMessages([]);
      setSessionId(Math.random().toString(36).substring(7));
    }
  };

  const handleSubmit = async (e?: React.FormEvent, presetMsg?: string) => {
    e?.preventDefault();
    const messageText = presetMsg || input;
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: "user", content: messageText };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const assistantId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persona,
          sessionId,
          message: messageText,
        }),
      });

      if (!response.ok) throw new Error("Network response was not ok");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (reader && !done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunkValue = decoder.decode(value, { stream: true });
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId ? { ...msg, content: msg.content + chunkValue } : msg
            )
          );
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "assistant", content: "Oops! Something went wrong while connecting to the LLM. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const currentAvatar = persona === "hitesh" ? "/hitesh.webp" : "/piyush.png";
  const currentName = persona === "hitesh" ? "Hitesh Sir" : "Piyush Garg";

  return (
    <div className="flex flex-col h-screen max-w-5xl mx-auto p-4 md:p-6">
      
      {/* Disclosure Banner */}
      <div className="bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs md:text-sm py-2 px-4 rounded-xl flex items-center justify-center gap-2 mb-6 shadow-sm backdrop-blur-sm">
        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
        <p className="text-center">
          <strong>AI Persona Demo:</strong> This is an AI trained on public teaching styles. Not the real individuals. Unaffiliated and unendorsed.
        </p>
      </div>

      {/* Header & Persona Switcher */}
      <header className="mb-6 flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-amber-200 to-amber-600 bg-clip-text text-transparent">
            ChaiCode Persona
          </h1>
          <p className="text-gray-400 mt-1 text-sm md:text-base">Chat with AI avatars of top tech educators.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setPersona("hitesh")}
            className={`relative flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 border ${
              persona === "hitesh"
                ? "bg-amber-900/20 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/50"
                : "bg-white/5 border-white/10 hover:bg-white/10"
            }`}
          >
            <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-white/10">
              <Image src="/hitesh.webp" alt="Hitesh Choudhary" fill unoptimized className="object-cover" />
            </div>
            <div className="text-left hidden sm:block">
              <h3 className="font-bold text-white text-lg">Hitesh Choudhary</h3>
              <p className="text-xs text-gray-400 line-clamp-1">Fundamentals & Analogies (Chai aur Code)</p>
            </div>
          </button>

          <button
            onClick={() => setPersona("piyush")}
            className={`relative flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 border ${
              persona === "piyush"
                ? "bg-amber-900/20 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/50"
                : "bg-white/5 border-white/10 hover:bg-white/10"
            }`}
          >
            <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-white/10 bg-black">
              <Image src="/piyush.png" alt="Piyush Garg" fill unoptimized className="object-cover" />
            </div>
            <div className="text-left hidden sm:block">
              <h3 className="font-bold text-white text-lg">Piyush Garg</h3>
              <p className="text-xs text-gray-400 line-clamp-1">Fast-paced Builder (piyushgargdev)</p>
            </div>
          </button>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden flex flex-col bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md shadow-2xl">
        
        {/* Chat Header */}
        <div className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-black/20">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 rounded-full overflow-hidden">
              <Image src={currentAvatar} alt={currentName} fill unoptimized className="object-cover" />
            </div>
            <span className="font-medium text-white text-sm">Chatting with {currentName}</span>
          </div>
          <button
            onClick={handleClearChat}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
            title="Clear Chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-80">
              <Bot className="w-16 h-16 text-amber-500/50" />
              <div>
                <p className="text-gray-300 font-medium">Start a conversation!</p>
                <p className="text-gray-500 text-sm mt-1 max-w-md">Ask a technical question, seek career advice, or ask for a code explanation.</p>
              </div>
              
              <div className="grid gap-3 w-full max-w-md mt-4">
                <button 
                  onClick={() => handleSubmit(undefined, "Which language should I learn in 2026?")}
                  className="p-3 text-sm border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-left flex items-center gap-3"
                >
                  <Code className="w-4 h-4 text-amber-500" /> Which language should I learn in 2026?
                </button>
                <button 
                  onClick={() => handleSubmit(undefined, "Can you explain APIs with a simple analogy?")}
                  className="p-3 text-sm border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-left flex items-center gap-3"
                >
                  <Zap className="w-4 h-4 text-amber-500" /> Can you explain APIs with a simple analogy?
                </button>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden relative ${msg.role === "user" ? "bg-amber-600" : "bg-black border border-white/10"}`}>
                  {msg.role === "user" ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Image src={currentAvatar} alt={currentName} fill unoptimized className="object-cover" />
                  )}
                </div>
                
                <div
                  className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 ${
                    msg.role === "user"
                      ? "bg-amber-600 text-white rounded-tr-none"
                      : "bg-white/5 border border-white/10 text-gray-200 rounded-tl-none prose prose-invert prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 prose-amber max-w-none"
                  }`}
                >
                  {msg.role === "user" ? (
                    <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                  ) : msg.content === "" ? (
                    <div className="flex gap-1 py-1">
                      <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"></div>
                    </div>
                  ) : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-black/40 border-t border-white/10">
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full p-1 pl-4 focus-within:ring-1 focus-within:ring-amber-500/50 transition-all"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask ${currentName} something...`}
              disabled={isLoading}
              className="flex-1 bg-transparent text-white outline-none placeholder:text-gray-500 text-sm md:text-base py-3"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-3 bg-amber-600 hover:bg-amber-500 disabled:bg-white/5 disabled:text-gray-500 text-white rounded-full transition-colors flex items-center justify-center shrink-0"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-1" />}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
