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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages from localStorage on mount and persona change
  useEffect(() => {
    const saved = localStorage.getItem(`chaicode-messages-${persona}`);
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        setMessages([]);
      }
    } else {
      setMessages([]);
    }
  }, [persona]);

  // Save messages to localStorage whenever they update
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`chaicode-messages-${persona}`, JSON.stringify(messages));
    } else {
      localStorage.removeItem(`chaicode-messages-${persona}`);
    }
  }, [messages, persona]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleClearChat = () => {
    setMessages([]);
    localStorage.removeItem(`chaicode-messages-${persona}`);
  };

  const handlePersonaSwitch = (newPersona: "hitesh" | "piyush") => {
    if (newPersona === persona) return;
    setPersona(newPersona);
    // Messages will automatically reload via the useEffect when persona changes
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
      // Send the last 12 messages for context + the new message
      const contextMessages = [...messages, userMessage].slice(-12);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persona,
          messages: contextMessages,
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
    <div className="flex flex-col h-screen max-w-5xl mx-auto p-3 md:p-4">
      

      {/* Compact Header & Persona Switcher */}
      <header className="mb-3 flex flex-col gap-3 shrink-0">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Title */}
          <div className="text-center sm:text-left">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-200 to-amber-600 bg-clip-text text-transparent font-[family-name:var(--font-poppins)]">
              ChaiCode Persona
            </h1>
            <p className="text-gray-400 mt-0.5 text-xs md:text-sm font-[family-name:var(--font-poppins)]">Chat with AI avatars of top tech educators.</p>
          </div>

          {/* Persona Switcher - Compact Pills */}
          <div className="flex gap-2">
            <button
              onClick={() => handlePersonaSwitch("hitesh")}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-300 border ${
                persona === "hitesh"
                  ? "bg-amber-900/20 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/50"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              }`}
            >
              <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-white/10">
                <Image src="/hitesh.webp" alt="Hitesh Choudhary" fill unoptimized className="object-cover" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-white text-sm leading-tight">Hitesh Choudhary</h3>
                <p className="text-[10px] text-gray-400 leading-tight">Chai aur Code</p>
              </div>
            </button>

            <button
              onClick={() => handlePersonaSwitch("piyush")}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-300 border ${
                persona === "piyush"
                  ? "bg-amber-900/20 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/50"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              }`}
            >
              <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-white/10 bg-white">
                <Image src="/piyush.png" alt="Piyush Garg" fill unoptimized className="object-cover" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-white text-sm leading-tight">Piyush Garg</h3>
                <p className="text-[10px] text-gray-400 leading-tight">piyushgargdev</p>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden flex flex-col bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md shadow-2xl min-h-0">
        
        {/* Chat Header */}
        <div className="h-12 border-b border-white/10 flex items-center justify-between px-4 bg-black/20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`relative w-7 h-7 rounded-full overflow-hidden ${persona === 'piyush' ? 'bg-white' : ''}`}>
              <Image src={currentAvatar} alt={currentName} fill unoptimized className="object-cover" />
            </div>
            <span className="font-medium text-white text-sm">Chatting with {currentName}</span>
          </div>
          <button
            onClick={handleClearChat}
            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
            title="Clear Chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-4 scroll-smooth">
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
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden relative ${msg.role === "user" ? "bg-amber-600" : persona === "piyush" ? "bg-white border border-white/10" : "bg-black border border-white/10"}`}>
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
