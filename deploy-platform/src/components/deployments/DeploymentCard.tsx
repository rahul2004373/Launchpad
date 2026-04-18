import { Link } from "wouter";
import { GitBranch, ExternalLink } from "lucide-react";
import { SiReact, SiVite, SiNextdotjs, SiVuedotjs } from "react-icons/si";
import StatusBadge from "./StatusBadge";
import { Button } from "@/components/ui/button";

type Status = "QUEUED" | "BUILDING" | "READY" | "FAILED";

interface DeploymentCardProps {
  id: string;
  name: string;
  status: Status;
  repoUrl: string;
  deploymentUrl: string;
  createdAt: string;
  branch: string;
  commitHash: string;
  framework?: "react" | "vite" | "next" | "vue";
}

const frameworkIcons: Record<string, React.ReactNode> = {
  react: <SiReact className="w-3 h-3 text-[#61dafb]" />,
  vite: <SiVite className="w-3 h-3 text-[#646cff]" />,
  next: <SiNextdotjs className="w-3 h-3 text-foreground" />,
  vue: <SiVuedotjs className="w-3 h-3 text-[#4fc08d]" />,
};

export default function DeploymentCard({
  id,
  name,
  status,
  repoUrl,
  deploymentUrl,
  createdAt,
  branch,
  commitHash,
  framework = "vite",
}: DeploymentCardProps) {
  return (
    <Link href={`/deployments/${id}`}>
      <div
        data-testid={`card-deployment-${id}`}
        className="bg-card border border-border rounded-lg p-5 hover:border-foreground/20 hover:bg-muted/30 transition-all duration-150 cursor-pointer group"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <span className="font-medium text-sm text-foreground tracking-tight truncate max-w-[65%]">{name}</span>
          <StatusBadge status={status} />
        </div>

        {/* URL */}
        <div className="flex items-center gap-1.5 mb-4 min-w-0">
          <ExternalLink className="w-3 h-3 text-muted-foreground/40 shrink-0" />
          <p className="font-mono text-[11px] text-muted-foreground truncate" data-testid={`text-url-${id}`}>
            {deploymentUrl || "Pending..."}
          </p>
        </div>

        {/* Meta & Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium">
             <div className="flex items-center gap-1">
                <GitBranch className="w-2.5 h-2.5" />
                <span>{branch}</span>
             </div>
             <span className="font-mono">{commitHash.slice(0, 7)}</span>
             <span>{createdAt}</span>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border/50">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
              {frameworkIcons[framework]}
              <span className="font-mono truncate max-w-[140px] lowercase">{repoUrl.replace("https://github.com/", "")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[10px] font-semibold text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.open(deploymentUrl, "_blank");
                }}
                data-testid={`button-visit-${id}`}
              >
                VISIT
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
