"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { Sparkles, Bot, Send, FileText, Download, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

interface AiSidebarProps {
  isOpen: boolean
  onClose: () => void
}

interface Message {
  id: string
  sender: "user" | "assistant"
  text: string
}

export function AiSidebar({ isOpen, onClose }: AiSidebarProps) {
  const [activeTab, setActiveTab] = useState("architect")
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Clear timeout on unmount or when handleSend is reconstructed
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Auto-resize textarea between 40px and 120px
  const adjustHeight = useCallback(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = "auto"
    ta.style.height = `${Math.min(Math.max(ta.scrollHeight, 40), 120)}px`
  }, [])

  useEffect(() => {
    adjustHeight()
  }, [inputValue, adjustHeight])

  // Scroll to the latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isGenerating])

  const handleSend = useCallback(() => {
    if (!inputValue.trim() || isGenerating) return

    const userMsg: Message = {
      id: `msg_${Date.now()}`,
      sender: "user",
      text: inputValue.trim(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInputValue("")
    setIsGenerating(true)

    // Clear any previous scheduled timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_${Date.now() + 1}`,
          sender: "assistant",
          text: `I've analyzed your prompt: "${userMsg.text}". Here is a structured recommendation for this design. Let me know if you'd like me to generate a markdown spec in the Specs tab or apply changes to the canvas.`,
        },
      ])
      setIsGenerating(false)
    }, 1000)
  }, [inputValue, isGenerating])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleChipClick = (prompt: string) => {
    setInputValue(prompt)
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  return (
    // z-40 so it sits above the z-30 ShapePanel / CanvasControls inside the canvas
    <aside
      className={cn(
        "absolute right-0 top-0 bottom-0 z-40 w-80 border-l border-surface-border bg-base/95 backdrop-blur-md",
        "flex flex-col overflow-hidden",
        "transition-transform duration-300 ease-in-out select-none shadow-2xl",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      {/* ── Header ─────────────────────────────────── */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-surface-border shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-brand-ai/15 border border-brand-ai/20 flex items-center justify-center text-brand-ai-text shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-xs font-semibold tracking-wider text-copy-primary uppercase leading-none">
              AI Workspace
            </h2>
            <span className="text-[10px] text-copy-muted mt-0.5 font-light">
              Collaborate with Ghost AI
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          className="h-7 w-7 rounded-lg text-copy-muted hover:text-copy-primary hover:bg-subtle transition-colors duration-200 cursor-pointer"
          aria-label="Close AI Sidebar"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* ── Tabs ───────────────────────────────────── */}
      {/*
        Key layout contract:
          • The <Tabs> root is a flex-col that fills the remaining height.
          • TabsList wrapper is shrink-0 (never grows).
          • Each TabsContent is flex-col and fills all remaining space via flex-1.
          • Inside the architect tab, the message list is overflow-y-auto flex-1,
            and the input bar is shrink-0 — so it is always visible at the bottom.
      */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col overflow-hidden min-h-0"
      >
        {/* Tab strip */}
        <div className="px-4 py-2.5 border-b border-surface-border/50 shrink-0">
          <TabsList className="w-full bg-subtle p-0.5 rounded-xl flex border border-surface-border/20">
            <TabsTrigger
              value="architect"
              className="flex-grow flex items-center justify-center text-xs font-medium py-1.5 rounded-lg text-copy-muted transition-all duration-200 cursor-pointer"
            >
              AI Architect
            </TabsTrigger>
            <TabsTrigger
              value="specs"
              className="flex-grow flex items-center justify-center text-xs font-medium py-1.5 rounded-lg text-copy-muted transition-all duration-200 cursor-pointer"
            >
              Specs
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ── Tab 1: AI Architect ── */}
        <TabsContent
          value="architect"
          className="flex-1 flex flex-col overflow-hidden min-h-0 outline-none"
        >
          {/* Scrollable message list — takes all available space */}
          <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0 chat-scrollbar">
            {messages.length === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center h-full text-center animate-in fade-in duration-300">
                <div className="h-12 w-12 rounded-full bg-brand-ai/10 border border-brand-ai/20 flex items-center justify-center mb-4 text-brand-ai-text shadow-lg shadow-brand-ai/5">
                  <Bot className="h-6 w-6" />
                </div>
                <h3 className="text-xs font-semibold text-copy-primary mb-1">
                  Architectural Copilot
                </h3>
                <p className="text-[11px] text-copy-muted leading-relaxed max-w-[200px] mb-6 font-light">
                  Ask Ghost AI to design database schemas, microservice flows, or configure pipelines.
                </p>

                {/* Starter chips */}
                <div className="flex flex-col gap-2 w-full max-w-[240px]">
                  {[
                    { emoji: "🚀", label: "Design an e-commerce backend" },
                    { emoji: "💬", label: "Create a chat app architecture" },
                    { emoji: "🛠️", label: "Build a CI/CD pipeline" },
                  ].map(({ emoji, label }) => (
                    <button
                      key={label}
                      onClick={() => handleChipClick(label)}
                      className="w-full text-left px-3 py-2 rounded-xl bg-subtle hover:bg-subtle/80 text-[10px] text-brand hover:text-brand/80 transition-all duration-200 border border-surface-border/50 shadow-sm font-medium cursor-pointer"
                    >
                      {emoji} {label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Message bubbles */
              <div className="flex flex-col gap-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "max-w-[88%] rounded-2xl p-3 text-xs leading-relaxed shadow-md animate-in fade-in duration-200",
                      msg.sender === "user"
                        ? "self-end bg-brand-dim border-2 border-brand/50 text-copy-primary rounded-tr-none"
                        : "self-start bg-elevated border border-surface-border text-copy-secondary rounded-tl-none"
                    )}
                  >
                    {msg.text}
                  </div>
                ))}

                {/* Thinking indicator */}
                {isGenerating && (
                  <div className="self-start bg-elevated border border-surface-border rounded-2xl rounded-tl-none p-3 max-w-[88%] text-xs text-copy-muted flex items-center gap-2 shadow-md">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-ai-text shrink-0" />
                    <span>Ghost AI is thinking…</span>
                  </div>
                )}

                {/* Scroll anchor */}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          {/* ── Input bar — always pinned at the bottom ── */}
          <div className="p-3 border-t border-surface-border bg-surface/60 shrink-0">
            <div className="flex items-end gap-2 bg-subtle border border-surface-border rounded-xl p-2 focus-within:border-brand-ai/50 transition-colors duration-200">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Ghost AI…"
                rows={1}
                style={{ height: "40px" }}
                className="flex-1 bg-transparent border-0 outline-none focus:ring-0 p-0 text-xs text-copy-primary placeholder:text-copy-faint resize-none leading-relaxed font-sans overflow-y-auto"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isGenerating}
                className="h-7 w-7 rounded-lg bg-brand-ai hover:bg-brand-ai/85 text-white transition-all duration-200 shrink-0 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-[9px] text-copy-faint text-center mt-1.5 font-light">
              Enter to send · Shift+Enter for newline
            </p>
          </div>
        </TabsContent>

        {/* ── Tab 2: Specs ── */}
        <TabsContent
          value="specs"
          className="flex-1 flex flex-col p-4 gap-4 outline-none overflow-y-auto min-h-0"
        >
          {/* Generate Spec button */}
          <button className="w-full bg-brand-ai hover:bg-brand-ai/85 text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer border-0">
            <Sparkles className="h-4 w-4" />
            Generate Spec
          </button>

          {/* Demo Spec card */}
          <div className="bg-elevated border border-surface-border rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-copy-primary truncate">
                  ecommerce-backend-spec.md
                </span>
                <span className="text-[10px] text-copy-muted mt-0.5">
                  Markdown Spec File
                </span>
              </div>
            </div>
            <p className="text-[10px] text-copy-secondary leading-relaxed font-light bg-subtle/40 border border-surface-border/30 rounded-lg p-2.5">
              Baseline system design specification for e-commerce microservices, covering API Gateway routing, token auth, and database schema conventions.
            </p>
            <div className="flex items-center justify-between border-t border-surface-border/50 pt-2.5">
              <span className="text-[9px] font-mono text-copy-faint uppercase">
                Ready to export
              </span>
              <button
                disabled
                title="Download Spec (configure workspace first)"
                className="h-6 w-6 rounded-md text-copy-muted opacity-40 flex items-center justify-center cursor-not-allowed"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </aside>
  )
}
