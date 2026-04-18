import { useState, useRef, useEffect } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LogLine {
  ts: string;
  level: "INFO" | "ERROR" | "WARN";
  msg: string;
}

interface LogViewerProps {
  logs: LogLine[];
}

const LEVEL_COLORS: Record<string, string> = {
  INFO: "text-[#00c951]",
  ERROR: "text-[#ff4444]",
  WARN: "text-[#f5a623]",
};

export default function LogViewer({ logs }: LogViewerProps) {
  const [filter, setFilter] = useState<"ALL" | "INFO" | "ERROR">("ALL");
  const [copied, setCopied] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const filtered = filter === "ALL" ? logs : logs.filter((l) => l.level === filter);

  const copyAll = () => {
    const text = filtered.map((l) => `[${l.ts}] [${l.level}] ${l.msg}`).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#050505] dark:bg-[#050505] border border-border rounded-lg overflow-hidden shadow-2xl">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <div className="flex items-center gap-1">
          {(["ALL", "INFO", "ERROR"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              data-testid={`button-log-filter-${f.toLowerCase()}`}
              className={`text-xs px-2.5 py-1 rounded-md transition-all ${
                filter === f
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={copyAll}
          className="h-6 text-xs text-white/40 hover:text-white gap-1"
          data-testid="button-copy-logs"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>

      {/* Log output */}
      <div className="h-80 overflow-y-auto p-4 font-mono text-xs space-y-1">
        {filtered.map((line, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="text-white/20 shrink-0 w-16">{line.ts}</span>
            <span className={`shrink-0 w-10 font-medium ${LEVEL_COLORS[line.level]}`}>{line.level}</span>
            <span className="text-white/70">{line.msg}</span>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-white/20 text-center py-8">No logs match this filter</div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
