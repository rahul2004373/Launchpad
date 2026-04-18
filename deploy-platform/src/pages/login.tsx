import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff } from "lucide-react";
import { SiGithub, SiGoogle } from "react-icons/si";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import Navbar from "@/components/layout/Navbar";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginValues) => {
    setIsLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
        });
        if (error) throw error;
        toast({ title: "Account created", description: "You can now sign in." });
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
        if (error) throw error;
        setLocation("/deployments");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async (provider: 'github' | 'google') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/deployments`
      }
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <div className="flex-1 flex pt-14">
        {/* Left panel — always dark decorative terminal */}
        <div className="hidden lg:flex flex-col flex-1 bg-[#050505] border-r border-white/8 relative overflow-hidden p-12 items-start justify-end">
          <div className="absolute inset-0 grid-bg opacity-40" style={{ "--grid-line": "rgba(255,255,255,0.04)" } as React.CSSProperties} />
          <div className="relative z-10">
            <pre className="text-[#00c951] font-mono text-xs leading-5 opacity-80 select-none">
{`$ launchpad deploy
  Connecting to GitHub...     ✓
  Cloning repository...       ✓
  Detecting framework...      Vite
  Installing dependencies...  ✓
  Running build...            npm run build
  Uploading artifacts...      ✓
  Deploying to edge...        ✓

  ✓ Deployed in 43s
  → https://my-app-3f7a2.launchpad.app`}
            </pre>
            <div className="mt-8">
              <p className="text-sm font-semibold text-white mb-1">Zero config deployments</p>
              <p className="text-xs text-white/40 max-w-xs">Push to GitHub and your site is live in under a minute. Every commit gets its own URL.</p>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 lg:max-w-sm flex items-center justify-center p-6">
          <div className="w-full max-w-sm">
            <div className="flex flex-col items-center mb-8">
              <div className="flex items-center gap-2 mb-6">
                <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
                  <rect x="0" y="0" width="9" height="9" rx="2" fill="currentColor"/>
                  <rect x="11" y="0" width="9" height="9" rx="2" fill="currentColor" opacity="0.6"/>
                  <rect x="0" y="11" width="9" height="9" rx="2" fill="currentColor" opacity="0.6"/>
                  <rect x="11" y="11" width="9" height="9" rx="2" fill="currentColor" opacity="0.3"/>
                </svg>
                <span className="font-semibold text-foreground">Launchpad</span>
              </div>
              <h1 className="text-xl font-semibold text-foreground">{isSignUp ? "Create an account" : "Welcome back"}</h1>
              <p className="text-sm text-muted-foreground mt-1">{isSignUp ? "Sign up to start deploying" : "Sign in to continue deploying"}</p>
            </div>

            <div className="space-y-2 mb-6">
              <button
                type="button"
                onClick={() => handleOAuth('github')}
                data-testid="button-github-login"
                className="w-full flex items-center justify-center gap-2.5 bg-muted/50 hover:bg-muted border border-border rounded-lg px-4 py-2.5 text-sm text-foreground transition-all"
              >
                <SiGithub className="w-4 h-4" />
                Continue with GitHub
              </button>
              <button
                type="button"
                onClick={() => handleOAuth('google')}
                data-testid="button-google-login"
                className="w-full flex items-center justify-center gap-2.5 bg-muted/50 hover:bg-muted border border-border rounded-lg px-4 py-2.5 text-sm text-foreground transition-all"
              >
                <SiGoogle className="w-4 h-4 text-[#4285f4]" />
                Continue with Google
              </button>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-3 text-xs text-muted-foreground">or</span>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">Email address</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="you@example.com" autoComplete="email" data-testid="input-email" />
                      </FormControl>
                      <FormMessage className="text-xs text-destructive" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-xs text-muted-foreground">Password</FormLabel>
                        <button type="button" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                          Forgot password?
                        </button>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="pr-10"
                            autoComplete={isSignUp ? "new-password" : "current-password"}
                            data-testid="input-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            data-testid="button-toggle-password"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs text-destructive" />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading} className="w-full font-medium" data-testid="button-signin">
                  {isLoading ? "Please wait..." : (isSignUp ? "Sign up" : "Sign in")}
                </Button>
              </form>
            </Form>

            <p className="text-center text-xs text-muted-foreground mt-6">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button onClick={() => setIsSignUp(!isSignUp)} className="text-foreground hover:underline transition-colors font-medium">
                {isSignUp ? "Sign in" : "Sign up"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
