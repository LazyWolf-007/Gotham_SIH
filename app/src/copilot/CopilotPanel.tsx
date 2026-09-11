import React, { useState, useEffect } from "react";
import { GraphNode, GraphEdge } from "../types";
import { queryCopilot, CopilotResponse } from "../lib/api";
import { useToast } from "../context/ToastContext";
import { ProvenanceBadge } from "../components/ProvenanceBadge";
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
  Clock,
  FileCheck,
  Target,
  Plus,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface CopilotPanelProps {
  selectedNodeId: string | null;
  nodes: GraphNode[];
  onHighlightNodes: (nodeIds: string[]) => void;
  onSelectNode: (nodeId: string) => void;
  onOpenTimeline?: () => void;
  onOpenEvidence?: () => void;
  onOpenDossier?: () => void;
  onOpenGraph?: (focusId?: string) => void;
  onAddToDossier?: (entityId: string) => void;
}

interface ChatMessage {
  id: string;
  sender: "user" | "copilot";
  content: string;
  citations?: string[];
  provider?: string;
  sources?: ("GRAPH" | "EVIDENCE" | "TIMELINE" | "PATTERN" | "CASE")[];
  timestamp: string;
}

const PRESET_PROMPTS = [
  {
    label: "What connects this subject?",
    query: "What connects this subject to other entities and accounts in the network?",
    sources: ["GRAPH", "EVIDENCE"] as const,
  },
  {
    label: "What evidence is associated with this subject?",
    query: "What evidence items, FIRs, and CDR call logs are associated with this subject?",
    sources: ["EVIDENCE", "CASE"] as const,
  },
  {
    label: "What patterns involve this subject?",
    query: "What detected syndicate patterns (Hawala cycle, Mule burst, Accountant cut-point) involve this subject?",
    sources: ["PATTERN", "GRAPH"] as const,
  },
  {
    label: "Show the relevant network context.",
    query: "Show the 2-hop relevant network context and structural connections for this subject.",
    sources: ["GRAPH", "CASE"] as const,
  },
  {
    label: "What survives if this subject is removed?",
    query: "What residual communication paths survive if this subject is removed or arrested?",
    sources: ["TIMELINE", "GRAPH"] as const,
  },
];

export const CopilotPanel: React.FC<CopilotPanelProps> = ({
  selectedNodeId,
  nodes,
  onHighlightNodes,
  onSelectNode,
  onOpenTimeline,
  onOpenEvidence,
  onOpenDossier,
  onOpenGraph,
  onAddToDossier,
}) => {
  const { showToast } = useToast();
  const [seedId, setSeedId] = useState<string>(selectedNodeId || "person:naveen_bhatia");
  const [inputQuery, setInputQuery] = useState("");
  const [provider, setProvider] = useState<"local" | "groq" | "gemini">("local");
  const [loading, setLoading] = useState(false);
  const [addedDossierMap, setAddedDossierMap] = useState<Record<string, boolean>>({});

  const activeSeedNode = nodes.find((n) => n.id === seedId) || nodes[0];

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init-1",
      sender: "copilot",
      content:
        "**Police Investigation Assistant Active.**\n\n- Powered by **Graph-Local 2-Hop Bounded RAG** (Max 40 nodes, 5 evidence snippets).\n- *Grounding Law*: Analyzes verified graph kernel facts only. Zero hallucinations.\n- Click any entity badge `[node_id]` to locate and highlight it on the canvas.",
      sources: ["CASE", "GRAPH"],
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  // Keep seedId in sync with selected canvas node
  useEffect(() => {
    if (selectedNodeId) {
      setSeedId(selectedNodeId);
    }
  }, [selectedNodeId]);

  const handleSend = async (customSeed?: string, customQuery?: string, sourcesOverride?: ("GRAPH" | "EVIDENCE" | "TIMELINE" | "PATTERN" | "CASE")[]) => {
    const targetSeed = customSeed || seedId;
    const queryText = customQuery !== undefined ? customQuery : inputQuery;

    if (!targetSeed) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      content: queryText || `Briefing on ${targetSeed}`,
      sources: sourcesOverride || ["GRAPH"],
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

      // Factual source indicators based on query content
      const detectedSources: ("GRAPH" | "EVIDENCE" | "TIMELINE" | "PATTERN" | "CASE")[] = [];
      const lowerQ = (queryText || "").toLowerCase();
      if (lowerQ.includes("evidence") || lowerQ.includes("fir") || lowerQ.includes("cdr")) detectedSources.push("EVIDENCE");
      if (lowerQ.includes("pattern") || lowerQ.includes("hawala") || lowerQ.includes("burst")) detectedSources.push("PATTERN");
      if (lowerQ.includes("survive") || lowerQ.includes("remove") || lowerQ.includes("timeline")) detectedSources.push("TIMELINE");
      if (lowerQ.includes("connect") || lowerQ.includes("context") || detectedSources.length === 0) detectedSources.push("GRAPH");
      detectedSources.push("CASE");

      const copilotMsg: ChatMessage = {
        id: `copilot-${Date.now()}`,
        sender: "copilot",
        content: resp.answer,
        citations: citationsList,
        provider: resp.provider,
        sources: sourcesOverride || Array.from(new Set(detectedSources)),
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, copilotMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "copilot",
          content: "**WHAT HAPPENED**\nFailed to complete AI query on external model endpoint.\n\n**WHAT THE USER CAN DO**\n- Switch the provider dropdown to **Deterministic Graph (Offline)** above for guaranteed local execution.\n- Or verify API key setup in backend environment.",
          sources: ["GRAPH"],
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Render formatted markdown text line-by-line with clickable citation badges & clean typography
  const renderFormattedContent = (content: string) => {
    const lines = content.split("\n");

    return lines.map((line, lineIdx) => {
      let trimmed = line.trim();
      if (!trimmed) return <div key={lineIdx} className="h-1" />;

      // Header Parsing: ### Title or ## Title or # Title
      let isHeader = false;
      if (trimmed.startsWith("### ")) {
        isHeader = true;
        trimmed = trimmed.replace(/^###\s+/, "");
      } else if (trimmed.startsWith("## ")) {
        isHeader = true;
        trimmed = trimmed.replace(/^##\s+/, "");
      } else if (trimmed.startsWith("# ")) {
        isHeader = true;
        trimmed = trimmed.replace(/^#\s+/, "");
      }

      // Bullet List Parsing: - item or * item
      let isBullet = false;
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        isBullet = true;
        trimmed = trimmed.replace(/^[-*]\s+/, "");
      }

      // Parse inline formatting (citations [id], bold **text**, code `code`)
      const renderInline = (str: string) => {
        const tokens = str.split(/(\[[a-zA-Z0-9_\-:]+\]|\*\*[^*]+\*\*|`[^`]+`)/g);

        return tokens.map((token, tIdx) => {
          if (token.startsWith("[") && token.endsWith("]")) {
            const rawId = token.slice(1, -1);
            return (
              <button
                key={tIdx}
                onClick={() => {
                  onSelectNode(rawId);
                  if (onOpenGraph) onOpenGraph(rawId);
                }}
                className="inline-flex items-center gap-0.5 mx-0.5 px-1.5 py-0.5 rounded bg-sky-950/80 hover:bg-sky-900 border border-sky-600/50 text-sky-300 font-mono text-[10px] font-bold transition-all shadow-sm cursor-pointer"
                title={`Focus [${rawId}] on Canvas`}
              >
                <Pin className="w-2.5 h-2.5 text-sky-400" />
                <span>{rawId}</span>
              </button>
            );
          }
          if (token.startsWith("**") && token.endsWith("**")) {
            return (
              <strong key={tIdx} className="text-white font-bold">
                {token.slice(2, -2)}
              </strong>
            );
          }
          if (token.startsWith("`") && token.endsWith("`")) {
            return (
              <code key={tIdx} className="px-1.5 py-0.2 rounded bg-[#20252A] text-amber-300 font-mono text-[10px]">
                {token.slice(1, -1)}
              </code>
            );
          }
          return <span key={tIdx}>{token}</span>;
        });
      };

      if (isHeader) {
        return (
          <div key={lineIdx} className="text-xs font-bold text-white border-b border-[#20252A] pb-1 mt-2 mb-1 uppercase tracking-wider font-mono">
            {renderInline(trimmed)}
          </div>
        );
      }

      if (isBullet) {
        return (
          <div key={lineIdx} className="flex items-start gap-1.5 ml-1 my-0.5">
            <span className="text-[#FF3038] font-bold text-[10px] select-none">•</span>
            <div className="flex-1">{renderInline(trimmed)}</div>
          </div>
        );
      }

      return (
        <div key={lineIdx} className="my-0.5 leading-relaxed">
          {renderInline(trimmed)}
        </div>
      );
    });
  };

  return (
    <div className="h-full flex flex-col bg-[#050607] border-l border-[#20252A] text-slate-200 text-xs font-sans select-none">
      {/* Header: Police Assistant Bar */}
      <div className="p-3 border-b border-[#20252A] bg-[#0A0D10] space-y-2.5 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-white uppercase tracking-wider text-xs">
            <Bot className="w-4 h-4 text-[#FF3038]" />
            <span>Investigation Assistant</span>
            <ProvenanceBadge type="GRAPH ANALYSIS" />
          </div>

          {/* Model Provider Selector */}
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as any)}
            className="bg-[#0E1216] border border-[#20252A] text-slate-300 text-[10px] rounded-lg px-2 py-1 font-mono outline-none cursor-pointer hover:border-[#384048]"
          >
            <option value="local">Deterministic Graph (Offline)</option>
            <option value="groq">Groq (Llama-3.3)</option>
            <option value="gemini">Google Gemini</option>
          </select>
        </div>

        {/* Active Seed Entity & Case Context Pill */}
        <div className="flex items-center justify-between gap-2 bg-[#0E1216] border border-[#20252A] rounded-xl p-2">
          <div className="min-w-0 flex-1 flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-[#858B92] uppercase">
              SUBJECT:
            </span>
            <select
              value={seedId}
              onChange={(e) => setSeedId(e.target.value)}
              className="flex-1 bg-transparent text-white font-bold text-xs outline-none cursor-pointer truncate font-mono"
            >
              {nodes.map((n) => (
                <option key={n.id} value={n.id} className="bg-[#0E1216] text-slate-200">
                  {n.label || n.id} ({n.id})
                </option>
              ))}
            </select>
          </div>

          {/* Quick Add to Dossier */}
          {onAddToDossier && (
            <button
              onClick={() => {
                onAddToDossier(seedId);
                setAddedDossierMap((prev) => ({ ...prev, [seedId]: true }));
                showToast(`Subject ${seedId} added to dossier`, "success");
              }}
              className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1 border shrink-0 ${
                addedDossierMap[seedId]
                  ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-300"
                  : "bg-[#20252A] hover:bg-[#E21B23] border-transparent text-slate-200 hover:text-white"
              }`}
              title="Add subject to investigation dossier"
            >
              {addedDossierMap[seedId] ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Added</span>
                </>
              ) : (
                <>
                  <Plus className="w-3 h-3" />
                  <span>Dossier</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Tactical Quick Questions Presets */}
        <div className="space-y-1">
          <div className="text-[9px] font-mono text-[#858B92] uppercase tracking-wider font-bold">
            QUICK SUGGESTED PROMPTS
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {PRESET_PROMPTS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(seedId, p.query, p.sources as any)}
                className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-[#0E1216] hover:bg-[#20252A] border border-[#20252A] hover:border-[#E21B23]/50 text-[10px] text-slate-300 hover:text-white font-mono transition-all cursor-pointer shrink-0"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#050607]">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${
              m.sender === "user" ? "items-end" : "items-start"
            }`}
          >
            <div
              className={`max-w-[95%] rounded-2xl p-3 text-xs leading-relaxed space-y-2 ${
                m.sender === "user"
                  ? "bg-[#E21B23]/20 border border-[#E21B23]/40 text-white rounded-br-sm font-mono text-[11px]"
                  : "bg-[#0E1216] border border-[#20252A] text-slate-200 rounded-bl-sm shadow-md"
              }`}
            >
              <div className="flex items-center justify-between text-[10px] text-[#858B92] font-mono border-b border-[#20252A] pb-1">
                <span className="font-bold">{m.sender === "user" ? "INVESTIGATOR" : "COPILOT ASSISTANT"}</span>
                {m.provider && (
                  <span className="text-emerald-400 font-bold uppercase">{m.provider}</span>
                )}
              </div>

              {/* Source Indicators Badges */}
              {m.sources && m.sources.length > 0 && (
                <div className="flex items-center gap-1 font-mono text-[9px] flex-wrap pt-0.5">
                  <span className="text-[#858B92] font-bold">SOURCES:</span>
                  {m.sources.map((src, idx) => (
                    <span
                      key={idx}
                      className={`px-1.5 py-0.2 rounded font-bold ${
                        src === "GRAPH"
                          ? "bg-sky-950/80 text-sky-300 border border-sky-600/40"
                          : src === "EVIDENCE"
                          ? "bg-emerald-950/80 text-emerald-300 border border-emerald-600/40"
                          : src === "TIMELINE"
                          ? "bg-purple-950/80 text-purple-300 border border-purple-600/40"
                          : src === "PATTERN"
                          ? "bg-amber-950/80 text-amber-300 border border-amber-600/40"
                          : "bg-slate-800 text-slate-300 border border-slate-700"
                      }`}
                    >
                      {src}
                    </span>
                  ))}
                </div>
              )}

              <div className="whitespace-pre-wrap">{renderFormattedContent(m.content)}</div>
            </div>
            <span className="text-[9px] text-[#555C63] px-1 mt-0.5 font-mono">{m.timestamp}</span>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 p-3 bg-[#0E1216] border border-[#20252A] rounded-2xl text-slate-300 text-xs font-mono">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#FF3038]" />
            <span>Extracting 2-hop neighborhood & verified evidence snippets...</span>
          </div>
        )}
      </div>

      {/* Quick Action Navigation Bar */}
      <div className="px-3 py-2 border-t border-[#20252A] bg-[#0A0D10] flex items-center justify-between gap-1.5 shrink-0">
        <span className="text-[9px] font-mono text-[#858B92] uppercase font-bold hidden sm:inline">
          ACTIONS:
        </span>

        <div className="flex items-center gap-1.5 flex-1 justify-end">
          {onOpenGraph && (
            <button
              onClick={() => {
                onSelectNode(seedId);
                onOpenGraph(seedId);
              }}
              className="px-2 py-1 rounded bg-[#0E1216] hover:bg-[#20252A] border border-[#20252A] hover:border-[#E21B23]/60 text-[10px] font-mono text-slate-200 hover:text-white transition-colors cursor-pointer flex items-center gap-1 shrink-0"
              title="Investigate subject in Graph Canvas"
            >
              <Target className="w-3 h-3 text-[#FF3038]" />
              <span className="hidden xl:inline">Graph</span>
            </button>
          )}

          {onOpenDossier && (
            <button
              onClick={() => {
                onSelectNode(seedId);
                onOpenDossier();
              }}
              className="px-2 py-1 rounded bg-[#0E1216] hover:bg-[#20252A] border border-[#20252A] hover:border-purple-500/60 text-[10px] font-mono text-slate-200 hover:text-white transition-colors cursor-pointer flex items-center gap-1 shrink-0"
              title="Open Subject Dossier"
            >
              <FileText className="w-3 h-3 text-purple-400" />
              <span className="hidden xl:inline">Dossier</span>
            </button>
          )}

          {onOpenEvidence && (
            <button
              onClick={onOpenEvidence}
              className="px-2 py-1 rounded bg-[#0E1216] hover:bg-[#20252A] border border-[#20252A] hover:border-sky-500/60 text-[10px] font-mono text-slate-200 hover:text-white transition-colors cursor-pointer flex items-center gap-1 shrink-0"
              title="View Case Evidence"
            >
              <FileCheck className="w-3 h-3 text-sky-400" />
              <span className="hidden xl:inline">Evidence</span>
            </button>
          )}

          {onOpenTimeline && (
            <button
              onClick={onOpenTimeline}
              className="px-2 py-1 rounded bg-[#0E1216] hover:bg-[#20252A] border border-[#20252A] hover:border-emerald-500/60 text-[10px] font-mono text-slate-200 hover:text-white transition-colors cursor-pointer flex items-center gap-1 shrink-0"
              title="Open Case Timeline"
            >
              <Clock className="w-3 h-3 text-emerald-400" />
              <span className="hidden xl:inline">Timeline</span>
            </button>
          )}
        </div>
      </div>

      {/* Query Input Bar */}
      <div className="p-2.5 border-t border-[#20252A] bg-[#050607] shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-1.5 bg-[#0E1216] border border-[#20252A] rounded-xl px-3 py-1.5 focus-within:border-[#E21B23] transition-all"
        >
          <input
            type="text"
            placeholder={`Ask Copilot about ${activeSeedNode?.label || seedId}...`}
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            disabled={loading}
            className="flex-1 bg-transparent text-slate-200 placeholder-[#858B92] text-xs outline-none font-sans"
          />
          <button
            type="submit"
            disabled={loading}
            className="p-1.5 rounded-lg bg-[#E21B23] hover:bg-[#FF3038] text-white disabled:opacity-40 transition-all font-bold cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
