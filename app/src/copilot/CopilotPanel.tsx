import React, { useState } from "react";
import { GraphNode, GraphEdge } from "../types";
import { queryCopilot, CopilotResponse } from "../lib/api";
import {
  Bot,
  Send,
  Sparkles,
  ShieldCheck,
  Zap,
  Layers,
  HelpCircle,
  FileText,
  Pin,
  RefreshCw,
} from "lucide-react";

interface CopilotPanelProps {
  selectedNodeId: string | null;
  nodes: GraphNode[];
  onHighlightNodes: (nodeIds: string[]) => void;
  onSelectNode: (nodeId: string) => void;
}

interface ChatMessage {
  id: string;
  sender: "user" | "copilot";
  content: string;
  citations?: string[];
  provider?: string;
  timestamp: string;
}

const PRESET_PROMPTS = [
  {
    label: "Transaction Connections",
    seed: "person:naveen_bhatia",
    query: "What connects Naveen Bhatia to the transaction network?",
    source: "GRAPH • EVIDENCE",
  },
  {
    label: "Associated Evidence",
    seed: "person:naveen_bhatia",
    query: "What evidence is associated with this subject?",
    source: "EVIDENCE • CASE",
  },
  {
    label: "Pattern Involvement",
    seed: "person:naveen_bhatia",
    query: "What patterns involve this subject?",
    source: "PATTERN • GRAPH",
  },
  {
    label: "Residual Survival",
    seed: "person:naveen_bhatia",
    query: "What survives if this subject is removed?",
    source: "SCENARIO • TIMELINE",
  },
  {
    label: "Mule Call Burst",
    seed: "phone:ph03",
    query: "Why did phone:ph03 experience a 140+ call burst following FIR-2026-014?",
    source: "TIMELINE • EVIDENCE",
  },
];

export const CopilotPanel: React.FC<CopilotPanelProps> = ({
  selectedNodeId,
  nodes,
  onHighlightNodes,
  onSelectNode,
}) => {
  const [seedId, setSeedId] = useState<string>(selectedNodeId || "person:naveen_bhatia");
  const [inputQuery, setInputQuery] = useState("");
  const [provider, setProvider] = useState<"local" | "groq" | "gemini">("local");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init-1",
      sender: "copilot",
      content:
        "**Operation Grey Ledger Intelligence Copilot Active.**\n\n- Powered by **Graph-Local 2-Hop Bounded RAG** (Max 40 nodes, 5 provenance snippets).\n- *Zero hallucination law*: I only analyze facts present in the verified graph kernel.\n- Click any entity badge `[node_id]` to locate and highlight it on the canvas.",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  // Keep seedId in sync with selected canvas node
  React.useEffect(() => {
    if (selectedNodeId) {
      setSeedId(selectedNodeId);
    }
  }, [selectedNodeId]);

  const handleSend = async (customSeed?: string, customQuery?: string) => {
    const targetSeed = customSeed || seedId;
    const queryText = customQuery !== undefined ? customQuery : inputQuery;

    if (!targetSeed) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      content: queryText || `Briefing on ${targetSeed}`,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setLoading(true);

    try {
      const resp: CopilotResponse = await queryCopilot(targetSeed, queryText, provider);

      // Extract citation node IDs like [person:naveen_bhatia] or [acc:a02]
      const citationRegex = /\[([a-zA-Z0-9_\-:]+)\]/g;
      const foundCitations = new Set<string>();
      let match;
      while ((match = citationRegex.exec(resp.answer)) !== null) {
        foundCitations.add(match[1]);
      }
      resp.nodes.forEach((n) => foundCitations.add(n));

      const citationsList = Array.from(foundCitations);
      onHighlightNodes(citationsList);

      const copilotMsg: ChatMessage = {
        id: `copilot-${Date.now()}`,
        sender: "copilot",
        content: resp.answer,
        citations: citationsList,
        provider: resp.provider,
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, copilotMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "copilot",
          content: "Failed to query Copilot engine. Falling back to deterministic graph kernel view.",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Render text with clickable citation badges
  const renderFormattedContent = (content: string) => {
    const parts = content.split(/(\[[a-zA-Z0-9_\-:]+\])/g);
    return parts.map((part, i) => {
      if (part.startsWith("[") && part.endsWith("]")) {
        const rawId = part.slice(1, -1);
        return (
          <button
            key={i}
            onClick={() => onSelectNode(rawId)}
            className="inline-flex items-center gap-0.5 mx-0.5 px-1.5 py-0.5 rounded bg-sky-950/80 hover:bg-sky-900 border border-sky-600/50 text-sky-300 font-mono text-[10px] font-bold transition-all shadow-sm"
            title={`Pin and focus [${rawId}] on Canvas`}
          >
            <Pin className="w-2.5 h-2.5 text-sky-400" />
            <span>{rawId}</span>
          </button>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="h-full flex flex-col bg-[#090d16]/95 border-l border-slate-800 text-slate-200 text-xs">
      {/* Copilot Header */}
      <div className="p-3 border-b border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-slate-100 uppercase tracking-wider text-xs">
            <Bot className="w-4 h-4 text-sky-400" />
            <span>Graph-Local Copilot RAG</span>
          </div>

          {/* Model Provider Selector */}
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as any)}
            className="bg-slate-900 border border-slate-700/80 text-slate-300 text-[10px] rounded px-2 py-1 font-mono outline-none cursor-pointer"
          >
            <option value="local">Deterministic Graph (Offline)</option>
            <option value="groq">Groq (Llama-3.3)</option>
            <option value="gemini">Google Gemini</option>
          </select>
        </div>

        {/* Seed Entity Selector */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-xl p-1.5">
          <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider pl-1">
            Seed:
          </span>
          <select
            value={seedId}
            onChange={(e) => setSeedId(e.target.value)}
            className="flex-1 bg-transparent text-sky-400 font-mono text-xs outline-none cursor-pointer"
          >
            {nodes.map((n) => (
              <option key={n.id} value={n.id} className="bg-slate-900 text-slate-200">
                {n.label} ({n.id})
              </option>
            ))}
          </select>
        </div>

        {/* Tactical Question Presets */}
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
          {PRESET_PROMPTS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSeedId(p.seed);
                handleSend(p.seed, p.query);
              }}
              className="whitespace-nowrap px-2 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 hover:text-sky-300 font-medium transition-all"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${
              m.sender === "user" ? "items-end" : "items-start"
            }`}
          >
            <div
              className={`max-w-[95%] rounded-2xl p-3 text-xs leading-relaxed space-y-1.5 ${
                m.sender === "user"
                  ? "bg-sky-600/20 border border-sky-500/40 text-sky-100 rounded-br-sm"
                  : "bg-slate-900/90 border border-slate-800 text-slate-200 rounded-bl-sm shadow-md"
              }`}
            >
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mb-1 border-b border-slate-800/60 pb-1">
                <span>{m.sender === "user" ? "INVESTIGATOR" : "GRAPH COPILOT"}</span>
                {m.provider && (
                  <span className="text-emerald-400 font-bold uppercase">{m.provider}</span>
                )}
              </div>

              <div className="whitespace-pre-wrap">{renderFormattedContent(m.content)}</div>
            </div>
            <span className="text-[9px] text-slate-600 px-1 mt-0.5 font-mono">{m.timestamp}</span>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 p-3 bg-slate-900/80 border border-slate-800 rounded-2xl text-slate-400 text-xs">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
            <span>Extracting 2-hop neighborhood and synthesizing graph intelligence...</span>
          </div>
        )}
      </div>

      {/* Query Input Bar */}
      <div className="p-2.5 border-t border-slate-800 bg-slate-950/80">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 focus-within:border-sky-500 transition-all"
        >
          <input
            type="text"
            placeholder="Ask Copilot about seed entity or graph pattern..."
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            disabled={loading}
            className="flex-1 bg-transparent text-slate-200 placeholder-slate-500 text-xs outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="p-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 disabled:opacity-40 transition-all font-bold"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
