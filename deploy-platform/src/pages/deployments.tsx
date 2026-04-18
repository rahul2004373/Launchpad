import { useState } from "react";
import { Link } from "wouter";
import { Search, Plus, Menu, PackageOpen, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/layout/Navbar";
import DeploymentCard from "@/components/deployments/DeploymentCard";
import { Skeleton } from "@/components/ui/skeleton";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export default function DeploymentsPage() {
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const { session } = useAuth();
  
  const { data: deployments = [], isLoading } = useQuery({
    queryKey: ['deployments'],
    queryFn: async () => {
      const res = await api.get('/deployments');
      return res.data.data.map((d: any) => ({
        id: d.id,
        name: d.projectName || "Unknown Project", 
        status: d.status,
        repoUrl: d.repoUrl || "",
        deploymentUrl: d.deploymentUrl || "",
        createdAt: new Date(d.createdAt).toLocaleDateString(),
        branch: "main",
        commitHash: d.id.substring(0, 7),
        framework: d.framework?.toLowerCase() || "vite",
      }));
    }
  });

  const filtered = deployments.filter((d: any) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleConnect = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { scopes: 'public_repo', redirectTo: window.location.href }
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="pt-14">
        <main className="max-w-[1400px] mx-auto min-h-[calc(100vh-56px)] p-6 lg:p-8 shrink-0">


          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                className="md:hidden text-muted-foreground hover:text-foreground p-1"
                onClick={() => setMobileOpen(true)}
                data-testid="button-mobile-menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-semibold text-foreground">Projects</h1>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">{deployments.length}</span>
            </div>
            <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search your projects..."
                    className="pl-10 h-10 text-sm bg-card border-border pr-20"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    data-testid="input-deployment-search"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded border border-border bg-muted/50 text-[10px] text-muted-foreground font-medium pointer-events-none">
                    <span className="text-[11px]">⌘</span>K
                  </div>
                </div>
              </div>
            </div>

          {/* Mobile search */}
          <div className="relative sm:hidden mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-sm w-full"
              data-testid="input-search-projects-mobile"
            />
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="bg-card border border-border rounded-lg p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-16 rounded-md" />
                  </div>
                  <Skeleton className="h-4 w-48" />
                  <div className="flex gap-3 pt-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-7 w-16 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((d: any) => (
                <DeploymentCard key={d.id} {...d} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center" data-testid="empty-state">
              <PackageOpen className="w-10 h-10 text-muted-foreground/30 mb-4" />
              <p className="text-sm text-muted-foreground mb-1">No deployments found</p>
              <p className="text-xs text-muted-foreground/60 mb-6">Try a different search or deploy something new</p>
              <Button asChild size="sm">
                <Link href="/deploy/new">Deploy your first project</Link>
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
