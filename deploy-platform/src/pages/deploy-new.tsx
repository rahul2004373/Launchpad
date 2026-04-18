import { useState } from "react";
import { useLocation } from "wouter";
import { GitBranch, Search, Link2, ArrowRight, AlertCircle } from "lucide-react";
import { SiGithub } from "react-icons/si";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import Navbar from "@/components/layout/Navbar";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

// Type for Github Repo
interface GithubRepo {
  id: number;
  name: string;
  fullName: string;
  cloneUrl: string;
  updatedAt: string;
}

const urlSchema = z.object({
  url: z
    .string()
    .url("Please enter a valid URL")
    .refine((u) => u.startsWith("https://github.com/"), "Must be a valid GitHub URL"),
});

export default function DeployNewPage() {
  const [, setLocation] = useLocation();
  const [repoSearch, setRepoSearch] = useState("");

  const { toast } = useToast();
  const { session } = useAuth();

  const form = useForm({
    resolver: zodResolver(urlSchema),
    defaultValues: { url: "" },
  });

  // If user just returned from GitHub connect, send provider token
  useEffect(() => {
    if (session?.provider_token) {
      api.post('/github/connect', { providerToken: session.provider_token })
        .then(() => toast({ title: "GitHub Connected!" }))
        .catch(() => {});
    }
  }, [session, toast]);

  const { data: repos = [], isLoading } = useQuery<GithubRepo[]>({
    queryKey: ['github-repos'],
    queryFn: async () => {
      const res = await api.get('/github/repos');
      return res.data.data;
    },
    retry: false, // Don't retry if not connected
  });

  const filteredRepos = repos.filter((r) =>
    r.name.toLowerCase().includes(repoSearch.toLowerCase())
  );

  const handleConnect = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        scopes: 'public_repo',
        redirectTo: window.location.href,
      }
    });
  };

  const handleImport = (repo: GithubRepo) => {
    setLocation(`/deploy/config?repoUrl=${encodeURIComponent(repo.cloneUrl)}&name=${encodeURIComponent(repo.name)}`);
  };

  const onUrlSubmit = (data: typeof form.getValues extends () => infer R ? R : any) => {
    setLocation(`/deploy/config?repoUrl=${encodeURIComponent(data.url as string)}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="pt-14">
        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* Step indicator */}
          <div className="flex items-center gap-4 mb-12">
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-md bg-foreground text-background text-[10px] font-bold flex items-center justify-center">1</div>
              <span className="text-xs text-foreground font-bold uppercase tracking-wider">Select Repository</span>
            </div>
            <div className="h-px flex-1 bg-border/50" />
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-md bg-muted text-muted-foreground text-[10px] font-bold flex items-center justify-center">2</div>
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Configure</span>
            </div>
          </div>

          {/* GitHub connect banner - hide if session exists */}
          {!session?.provider_token && (
            <div className="bg-card border border-border rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div className="flex items-start gap-3">
                <SiGithub className="w-5 h-5 text-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Import from GitHub</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">Connect your account to browse and import your private repositories with one click.</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleConnect}
                className="gap-2 shrink-0 h-9 font-bold text-[11px] px-4"
                data-testid="button-connect-github-import"
              >
                CONNECT GITHUB
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Panel A: GitHub repos */}
            <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col">
              <div className="p-4 border-b border-border bg-muted/20">
                <h2 className="text-[10px] uppercase tracking-widest font-black mb-3 text-muted-foreground">Select Repository</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
                  <Input
                    placeholder="Search projects..."
                    value={repoSearch}
                    onChange={(e) => setRepoSearch(e.target.value)}
                    className="pl-9 text-xs h-9 bg-background border-border"
                    autoComplete="off"
                    data-testid="input-repo-search"
                  />
                </div>
              </div>
              <ScrollArea className="h-80">
                <div>
                  {isLoading ? (
                    <div className="space-y-1 p-2">
                       {[1, 2, 3, 4, 5, 6].map((i) => (
                         <div key={i} className="flex items-center justify-between px-2 py-3">
                           <div className="flex items-center gap-3">
                             <Skeleton className="h-4 w-4 w-4" />
                             <div className="space-y-1">
                               <Skeleton className="h-4 w-32" />
                               <Skeleton className="h-3 w-20" />
                             </div>
                           </div>
                           <Skeleton className="h-7 w-16" />
                         </div>
                       ))}
                    </div>
                  ) : filteredRepos.length > 0 ? (
                    filteredRepos.map((repo, i) => (
                      <div key={repo.id}>
                        <div className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <GitBranch className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-mono text-foreground truncate">{repo.fullName}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">Updated {new Date(repo.updatedAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleImport(repo)}
                            className="text-xs shrink-0 gap-1"
                            data-testid={`button-import-${i}`}
                          >
                            Import
                            <ArrowRight className="w-3 h-3" />
                          </Button>
                        </div>
                        {i < filteredRepos.length - 1 && <Separator className="bg-border" />}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-muted-foreground text-sm">
                      {repos.length === 0 ? "No GitHub account connected." : "No repos found."}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Panel B: URL */}
            <div className="bg-card border border-border rounded-lg p-5 flex flex-col">
              <h2 className="text-[10px] uppercase tracking-widest font-black mb-1 text-muted-foreground">Manual Import</h2>
              <p className="text-[11px] text-muted-foreground/60 mb-6 leading-relaxed">Paste any public GitHub repository URL to begin deployment configuration.</p>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onUrlSubmit)} className="space-y-3">
                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="https://github.com/username/repo"
                            className="font-mono text-sm"
                            autoComplete="off"
                            data-testid="input-github-url"
                          />
                        </FormControl>
                        <FormMessage className="text-xs text-destructive" />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full h-10 text-xs font-bold uppercase tracking-wider bg-foreground text-background hover:bg-foreground/90"
                    data-testid="button-continue-url"
                  >
                    Continue
                    <ArrowRight className="w-3.5 h-3.5 ml-2" />
                  </Button>
                </form>
              </Form>

              <div className="mt-auto pt-8">
                <div className="flex items-start gap-2.5 p-3 rounded-md bg-muted/30 border border-border/50">
                  <AlertCircle className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-[10px] text-muted-foreground/80 leading-relaxed font-medium">
                    Note: Direct URL imports only support public repositories. For private repository access, please use the GitHub integration.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
