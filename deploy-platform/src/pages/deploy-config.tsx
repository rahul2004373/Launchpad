import { useState } from "react";
import { useLocation, Link } from "wouter";
import { ArrowLeft, Rocket, GitBranch, ChevronDown, Plus, Trash2, X, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Navbar from "@/components/layout/Navbar";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

type EnvVar = {
  key: string;
  value: string;
};

export default function DeployConfigPage() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialRepoUrl = searchParams.get('repoUrl') || "";
  const initialName = searchParams.get('name') || "my-project";

  const [projectName, setProjectName] = useState(initialName);
  const [branch, setBranch] = useState("main");
  const [buildCommand, setBuildCommand] = useState("npm run build");
  const [outputDir, setOutputDir] = useState("dist");
  const [installCmd, setInstallCmd] = useState("npm install");
  const [rootDir, setRootDir] = useState("./");
  const [envVars, setEnvVars] = useState<EnvVar[]>([{ key: "", value: "" }]);
  const [framework, setFramework] = useState<"vite" | "cra" | "static">("vite");
  const [isDeploying, setIsDeploying] = useState(false);
  const { toast } = useToast();

  const addEnvVar = () => {
    setEnvVars([...envVars, { key: "", value: "" }]);
  };

  const removeEnvVar = (index: number) => {
    setEnvVars(envVars.filter((_, i) => i !== index));
  };

  const updateEnvVar = (index: number, field: keyof EnvVar, value: string) => {
    const next = [...envVars];
    next[index][field] = value;
    setEnvVars(next);
  };

  const handleDeploy = async () => {
    if (!initialRepoUrl) {
      toast({ title: "Error", description: "Missing repository URL", variant: "destructive" });
      return;
    }

    // Convert array to object
    const envObject = envVars.reduce((acc, curr) => {
      if (curr.key.trim()) {
        acc[curr.key.trim()] = curr.value.trim();
      }
      return acc;
    }, {} as Record<string, string>);

    setIsDeploying(true);
    try {
      // 1. Create or get Project
      let projectId;
      try {
        const projRes = await api.post('/projects', { name: projectName, repoUrl: initialRepoUrl });
        projectId = projRes.data.data.id;
      } catch (err: any) {
        // If conflict (409), fetch existing project
        if (err.response?.status === 409) {
          const allRes = await api.get('/projects');
          const existing = allRes.data.data.find((p: any) => p.name === projectName);
          if (existing) {
            projectId = existing.id;
          } else {
            throw new Error("Project exists but could not be resolved");
          }
        } else {
          throw err;
        }
      }

      // 2. Initiate Deployment
      const depRes = await api.post(`/projects/${projectId}/deployments`, {
        rootDirectory: rootDir,
        buildCommand: buildCommand,
        installCommand: installCmd,
        outputDir: outputDir,
        framework: framework,
        env: envObject
      });

      setLocation(`/deployments/${depRes.data.data.deploymentId}`);
    } catch (err: any) {
      toast({ title: "Deployment failed", description: err.response?.data?.message || err.message, variant: "destructive" });
      setIsDeploying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      <Navbar />
      <div className="pt-14">
        <div className="max-w-3xl mx-auto px-6 py-12">
          {/* Step indicator */}
          <div className="flex items-center gap-4 mb-12">
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-md bg-muted text-foreground text-[10px] font-bold flex items-center justify-center">✓</div>
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Select Repository</span>
            </div>
            <div className="h-px flex-1 bg-border/50" />
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-md bg-foreground text-background text-[10px] font-bold flex items-center justify-center">2</div>
              <span className="text-xs text-foreground font-bold uppercase tracking-wider">Configure</span>
            </div>
          </div>

          {/* Repo header */}
          <div className="bg-card border border-border rounded-lg p-5 mb-6">
            <div className="min-w-0">
              <p className="text-sm font-mono text-foreground truncate">{initialRepoUrl || "No repository selected"}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Branch</span>
                <span className="text-[10px] text-foreground font-mono bg-muted px-1.5 py-0.5 rounded">main</span>
              </div>
            </div>
          </div>

          {/* Accordion sections */}
          <Accordion type="multiple" defaultValue={["project", "build", "env"]} className="space-y-4">
            <AccordionItem value="project" className="bg-card border border-border rounded-lg overflow-hidden border-b-0">
              <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/20 text-xs font-black uppercase tracking-widest text-muted-foreground [&[data-state=open]>svg]:rotate-180 border-b border-transparent data-[state=open]:border-border transition-all">
                Project Settings
              </AccordionTrigger>
              <AccordionContent className="px-5 pt-6 pb-6">
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-2 block">Project Name</label>
                    <Input
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="text-sm h-10 bg-background border-border"
                      autoComplete="off"
                      data-testid="input-project-name"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-2 block">Framework</label>
                    <Select value={framework} onValueChange={(val: "vite" | "cra" | "static") => {
                      setFramework(val);
                      if (val === "vite") {
                        setBuildCommand("npm run build");
                        setOutputDir("dist");
                        setInstallCmd("npm install");
                      } else if (val === "cra") {
                        setBuildCommand("npm run build");
                        setOutputDir("build");
                        setInstallCmd("npm install");
                      } else if (val === "static") {
                        setBuildCommand("");
                        setOutputDir(".");
                        setInstallCmd("");
                      }
                    }}>
                      <SelectTrigger className="w-56 h-10 text-xs bg-background border-border" data-testid="select-framework">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vite" className="text-xs">Vite</SelectItem>
                        <SelectItem value="cra" className="text-xs">Create React App</SelectItem>
                        <SelectItem value="static" className="text-xs">Static HTML/JS/CSS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="build" className="bg-card border border-border rounded-lg overflow-hidden border-b-0">
              <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/20 text-xs font-black uppercase tracking-widest text-muted-foreground [&[data-state=open]>svg]:rotate-180 border-b border-transparent data-[state=open]:border-border transition-all">
                Build & Development Settings
              </AccordionTrigger>
              <AccordionContent className="px-5 pt-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                  {[
                    { label: "Build Command", value: buildCommand, set: setBuildCommand, id: "build-command" },
                    { label: "Output Directory", value: outputDir, set: setOutputDir, id: "output-dir" },
                    { label: "Install Command", value: installCmd, set: setInstallCmd, id: "install-command" },
                    { label: "Root Directory", value: rootDir, set: setRootDir, id: "root-dir" },
                  ].map(({ label, value, set, id }) => (
                    <div key={id}>
                      <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-2 block">{label}</label>
                      <Input
                        value={value}
                        onChange={(e) => set(e.target.value)}
                        className="font-mono text-xs h-10 bg-background border-border"
                        autoComplete="off"
                        data-testid={`input-${id}`}
                      />
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="env" className="bg-card border border-border rounded-lg overflow-hidden border-b-0">
              <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/20 text-xs font-black uppercase tracking-widest text-muted-foreground [&[data-state=open]>svg]:rotate-180 border-b border-transparent data-[state=open]:border-border transition-all">
                Environment Variables
              </AccordionTrigger>
              <AccordionContent className="px-5 pt-6 pb-6">
                <div className="space-y-4">
                  <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                    Configure the environment variables that your application needs at build time (e.g. VITE_API_URL).
                  </p>
                  
                  <div className="space-y-3">
                    {envVars.map((v, i) => (
                      <div key={i} className="flex items-center gap-2 group">
                        <Input
                          placeholder="VARIABLE_NAME"
                          value={v.key}
                          onChange={(e) => updateEnvVar(i, "key", e.target.value)}
                          className="font-mono text-xs h-9 bg-background border-border uppercase"
                          data-testid={`input-env-key-${i}`}
                        />
                        <Input
                          placeholder="value"
                          value={v.value}
                          onChange={(e) => updateEnvVar(i, "value", e.target.value)}
                          className="font-mono text-xs h-9 bg-background border-border"
                          data-testid={`input-env-val-${i}`}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEnvVar(i)}
                          className="w-9 h-9 p-0 text-muted-foreground/30 hover:text-destructive transition-colors"
                          disabled={envVars.length === 1 && !v.key && !v.value}
                          data-testid={`button-remove-env-${i}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addEnvVar}
                    className="w-full border-dashed border-border hover:border-foreground/50 hover:bg-muted/30 text-[10px] font-black uppercase tracking-widest gap-2 h-9"
                    data-testid="button-add-env"
                  >
                    <Plus className="w-3 h-3" />
                    Add Variable
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur-md px-6 py-4 z-40">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            asChild
            className="gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
            data-testid="button-back"
          >
            <Link href="/deploy/new">
              <ArrowLeft className="w-4 h-4" />
              Edit Selection
            </Link>
          </Button>
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[10px] text-muted-foreground uppercase font-black">Estimation</span>
              <span className="text-[11px] text-foreground font-mono">Build: ~45s</span>
            </div>
            <Button
              onClick={handleDeploy}
              disabled={isDeploying}
              className="gap-2 h-10 px-6 text-xs font-black uppercase tracking-widest bg-foreground text-background hover:bg-foreground/90 transition-all"
              data-testid="button-deploy-now"
            >
              {isDeploying ? (
                <>Deploying...</>
              ) : (
                <>
                  <Rocket className="w-3.5 h-3.5" />
                  Deploy Now
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
