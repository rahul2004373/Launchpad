import { useState, useRef, useEffect } from "react";
import { Copy, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LogLine {
  ts: string;
  level: "INFO" | "ERROR" | "WARN";
  msg: string;
}

interface LogViewerProps {
  logs: LogLine[];
}

const MESSAGE_COLORS: Record<string, string> = {
  INFO: "text-neutral-300",
  ERROR: "text-red-400 font-medium",
  WARN: "text-yellow-400",
};

// ANSI color escape codes parser
function parseAnsi(text: string): React.ReactNode[] {
  if (!text) return [];
  const ansiRegex = /\u001b\[([0-9;]*)m/g;
  const parts = text.split(ansiRegex);
  
  if (parts.length === 1) {
    return [text];
  }
  
  const elements: React.ReactNode[] = [];
  let currentClass = "";
  let isBold = false;
  
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      const content = parts[i];
      if (content) {
        elements.push(
          <span key={i} className={`${currentClass} ${isBold ? "font-bold text-white" : ""}`}>
            {content}
          </span>
        );
      }
    } else {
      const code = parts[i];
      if (code === "0" || code === "") {
        currentClass = "";
        isBold = false;
      } else {
        const subCodes = code.split(";");
        for (const sub of subCodes) {
          if (sub === "1") {
            isBold = true;
          } else if (sub === "30") {
            currentClass = "text-neutral-800";
          } else if (sub === "31" || sub === "91") {
            currentClass = "text-red-400";
          } else if (sub === "32" || sub === "92") {
            currentClass = "text-emerald-400";
          } else if (sub === "33" || sub === "93") {
            currentClass = "text-yellow-400";
          } else if (sub === "34" || sub === "94") {
            currentClass = "text-blue-400";
          } else if (sub === "35" || sub === "95") {
            currentClass = "text-fuchsia-400";
          } else if (sub === "36" || sub === "96") {
            currentClass = "text-cyan-400";
          } else if (sub === "37" || sub === "97") {
            currentClass = "text-neutral-200";
          } else if (sub === "90") {
            currentClass = "text-neutral-500";
          }
        }
      }
    }
  }
  
  return elements;
}

export default function LogViewer({ logs }: LogViewerProps) {
  const [copied, setCopied] = useState(false);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;

    // Check if the user is scrolled near the bottom (within 50px)
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;
    
    setIsAutoScrollEnabled(isAtBottom);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container && isAutoScrollEnabled) {
      container.scrollTop = container.scrollHeight;
    }
  }, [logs, isAutoScrollEnabled]);

  const jumpToLatest = () => {
    const container = containerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
      setIsAutoScrollEnabled(true);
    }
  };

  const copyAll = () => {
    const text = logs.map((l) => {
      let formattedTs = "";
      try {
        formattedTs = new Date(l.ts).toLocaleTimeString([], { hour12: false });
      } catch {
        formattedTs = l.ts;
      }
      return `[${formattedTs}] ${l.msg}`;
    }).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative bg-[#0b0c10] border border-neutral-850 rounded-lg overflow-hidden shadow-2xl flex flex-col h-[480px]">
      {/* Console Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#13151a] border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-neutral-400 font-mono tracking-wider font-semibold animate-pulse">LIVE LOGS</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={copyAll}
          className="h-7 px-2.5 text-xs text-neutral-400 hover:text-white hover:bg-neutral-800 gap-1.5 transition-colors"
          data-testid="button-copy-logs"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy Logs"}
        </Button>
      </div>

      {/* Log Output Console */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-5 font-mono text-[11px] leading-relaxed bg-[#0b0c10] space-y-1.5 relative scrollbar-thin"
      >
        {logs.map((line, i) => {
          let timeString = "";
          try {
            timeString = new Date(line.ts).toLocaleTimeString([], { hour12: false });
          } catch {
            timeString = line.ts;
          }
          
          return (
            <div key={i} className="flex items-start gap-4 hover:bg-neutral-900/40 py-0.5 px-1 rounded transition-colors">
              <span className="text-neutral-600 select-none shrink-0 font-medium tracking-tighter w-[65px]">{timeString}</span>
              <span className={`flex-1 break-all whitespace-pre-wrap ${MESSAGE_COLORS[line.level] || "text-neutral-300"}`}>
                {parseAnsi(line.msg)}
              </span>
            </div>
          );
        })}
        {logs.length === 0 && (
          <div className="text-neutral-600 font-mono text-center py-16">
            Waiting for logs to stream...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Floating Jump to Latest Button */}
      {!isAutoScrollEnabled && logs.length > 0 && (
        <button
          onClick={jumpToLatest}
          className="absolute bottom-5 right-5 flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 text-[10px] font-bold uppercase tracking-wider text-white rounded-full shadow-lg transition-all transform hover:translate-y-[-1px] active:translate-y-[1px]"
        >
          <ChevronDown className="w-3.5 h-3.5" />
          Jump to latest
        </button>
      )}
    </div>
  );
}
