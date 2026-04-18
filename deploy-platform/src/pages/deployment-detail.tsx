import { useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { ArrowLeft, Copy, Check, ExternalLink, RefreshCw, MoreHorizontal, Trash2, Download, GitBranch } from "lucide-react";
import { SiGithub } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Navbar from "@/components/layout/Navbar";
import StatusBadge from "@/components/deployments/StatusBadge";
import LogViewer from "@/components/deployments/LogViewer";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";


const ENV_VARS: any[] = [];

export default function DeploymentDetailPage() {
  const params: any = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [renameInput, setRenameInput] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRedeploying, setIsRedeploying] = useState(false);
  const [shownEnvKeys, setShownEnvKeys] = useState<Set<number>>(new Set());
  
  const queryClient = useQueryClient();

  // Deployment Polling Query
  const { data: deployment, isLoading: isLoadingDep } = useQuery({
    queryKey: ['deployment', params.id],
    queryFn: async () => {
      const res = await api.get(`/deployments/${params.id}`);
      return res.data.data;
    },
    refetchInterval: (q) => {
      const state = q.state.data?.status;
      return state === "READY" || state === "FAILED" ? false : 3000;
    }
  });

  // Logs Polling Query
  const { data: logsData } = useQuery({
    queryKey: ['deployment-logs', params.id],
    queryFn: async () => {
      const res = await api.get(`/deployments/${params.id}/logs`);
      return res.data.data.logs.map((l: any) => ({
        ts: l.timestamp,
        level: l.level,
        msg: l.content
      }));
    },
    refetchInterval: (q) => {
      const state = deployment?.status;
      return state === "READY" || state === "FAILED" ? false : 3000;
    },
    enabled: !!deployment // fetch logs when deploymnt is loaded
  });

  const projectName = deployment?.projectName || "Unknown Project";
  const deploymentUrl = deployment?.deploymentUrl || "";
  const isFinalState = deployment?.status === "READY" || deployment?.status === "FAILED";

  const copyUrl = () => {
    if (!deploymentUrl) return;
    navigator.clipboard.writeText(deploymentUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const saveName = async () => {
    if (!deployment?.projectId) return;
    setIsRenaming(true);
    try {
      await api.patch(`/projects/${deployment.projectId}`, { name: renameInput || projectName });
      toast({ title: "Project renamed successfully" });
      setRenameInput("");
    } catch (err: any) {
      toast({ title: "Renaming failed", description: err.response?.data?.message || err.message, variant: "destructive" });
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/deployments/${params.id}`);
      toast({ title: "Deployment deleted" });
      setLocation('/deployments');
    } catch (err: any) {
      toast({ title: "Deletion failed", description: err.response?.data?.message || err.message, variant: "destructive" });
      setIsDeleting(false);
    }
  };

  const handleRedeploy = async () => {
    setIsRedeploying(true);
    try {
      await api.post(`/deployments/${params.id}/redeploy`);
      toast({ title: "Redeployment initiated", description: "Your project is being re-built." });
      // Invalidate queries to start polling
      queryClient.invalidateQueries({ queryKey: ['deployment', params.id] });
      queryClient.invalidateQueries({ queryKey: ['deployment-logs', params.id] });
    } catch (err: any) {
      toast({ 
        title: "Redeploy failed", 
        description: err.response?.data?.message || err.message, 
        variant: "destructive" 
      });
    } finally {
      setIsRedeploying(false);
    }
  };


  const toggleEnv = (i: number) => {
    setShownEnvKeys((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar projectName={projectName} />
      <div className="pt-14">
        <div className="max-w-5xl mx-auto px-6 py-10">
            {/* Back */}
            <Button
              variant="ghost"
              asChild
              size="sm"
              className="text-muted-foreground mb-6 gap-1.5 -ml-2"
              data-testid="button-back-all"
            >
              <Link href="/deployments">
                <ArrowLeft className="w-3.5 h-3.5" />
                All Projects
              </Link>
            </Button>

          {/* Header */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                {isLoadingDep ? (
                  <Skeleton className="h-8 w-48" />
                ) : (
                  <h1 className="text-2xl font-bold tracking-tight text-foreground truncate" data-testid="text-project-name">{projectName}</h1>
                )}
                {isLoadingDep ? (
                  <Skeleton className="h-6 w-20 rounded-md" />
                ) : (
                  <StatusBadge status={deployment?.status || "QUEUED"} size="md" />
                )}
              </div>
              <div className="flex items-center gap-2">
                {isLoadingDep ? (
                  <Skeleton className="h-9 w-20 rounded-md" />
                ) : (
                  <Button
                    size="sm"
                    asChild
                    className="gap-1.5 text-xs font-semibold h-9"
                    data-testid="button-visit"
                  >
                    <a href={deploymentUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3.5 h-3.5" />
                      Visit
                    </a>
                  </Button>
                )}
                {isLoadingDep ? (
                  <Skeleton className="h-9 w-24 rounded-md" />
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs font-semibold h-9"
                    onClick={handleRedeploy}
                    disabled={isRedeploying || !isFinalState}
                    data-testid="button-redeploy"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRedeploying ? "animate-spin" : ""}`} />
                    {isRedeploying ? "Retrying..." : "Redeploy"}
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-8 px-0"
                      data-testid="button-kebab"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={copyUrl} className="cursor-pointer text-sm">
                      <Copy className="w-3.5 h-3.5 mr-2" />
                      Copy URL
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer text-sm">
                      <Download className="w-3.5 h-3.5 mr-2" />
                      Download Logs
                    </DropdownMenuItem>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer text-sm text-destructive">
                          <Trash2 className="w-3.5 h-3.5 mr-2" />
                          Delete Deployment
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your deployment and remove all associated files from our servers.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {isDeleting ? "Deleting..." : "Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* URL row */}
            <div className="flex items-center gap-2 mb-3">
              {isLoadingDep ? (
                <Skeleton className="h-5 w-64" />
              ) : deploymentUrl ? (
                <>
                  <a
                    href={deploymentUrl.startsWith('http') ? deploymentUrl : `https://${deploymentUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors"
                    data-testid="link-deployment-url"
                  >
                    {deploymentUrl}
                  </a>
                  <button
                    onClick={copyUrl}
                    className="text-muted-foreground/50 hover:text-foreground transition-colors"
                    data-testid="button-copy-url"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5 text-[#00c951]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </>
              ) : (
                <span className="font-mono text-sm text-muted-foreground italic">Deployment Pending / Failed</span>
              )}
            </div>

            {/* Meta */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {isLoadingDep ? (
                <>
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1.5">
                    <GitBranch className="w-3 h-3" />
                    <span className="font-mono">main</span>
                  </div>
                  <span className="font-mono">{deployment?.id?.substring(0,7)}</span>
                  <span>{deployment?.createdAt ? new Date(deployment.createdAt).toLocaleDateString() : 'Just now'}</span>
                </>
              )}
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="logs">
            <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start gap-0 h-auto p-0 mb-6">
              {["logs", "build"].map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground text-muted-foreground hover:text-foreground/70 text-sm py-2.5 px-4 capitalize transition-all"
                  data-testid={`tab-${tab}`}
                >
                  {tab === "build" ? "Build Info" : "Logs"}
                </TabsTrigger>
              ))}
            </TabsList>

          <TabsContent value="logs">
            <LogViewer logs={logsData || []} />
          </TabsContent>

            <TabsContent value="build">
              <div className="bg-card border border-border rounded-lg p-5 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: "Framework", value: deployment?.framework?.toUpperCase() || "VITE" },
                    { label: "Deployment ID", value: deployment?.id },
                    { label: "Build Duration", value: deployment?.completedAt && deployment?.startedAt ? `${Math.round((new Date(deployment.completedAt).getTime() - new Date(deployment.startedAt).getTime()) / 1000)}s` : isFinalState ? "Failed" : "Pending" },
                    { label: "Node Version", value: "20.x" },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1.5">{label}</p>
                      <span className="font-mono text-sm text-foreground break-all">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-6">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-3">Environment Variables</p>
                  <div className="space-y-2.5">
                    {ENV_VARS.map(({ key, value }, i) => (
                      <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 font-mono text-xs">
                        <span className="text-foreground/70 w-32 shrink-0">{key}</span>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-muted-foreground truncate">
                            {shownEnvKeys.has(i) ? value : "•".repeat(12)}
                          </span>
                          <button
                            onClick={() => toggleEnv(i)}
                            className="text-muted-foreground/40 hover:text-foreground transition-colors text-[10px] uppercase font-bold"
                            data-testid={`button-toggle-env-${i}`}
                          >
                            [{shownEnvKeys.has(i) ? "hide" : "show"}]
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
