import { Link, useLocation } from "wouter";
import { Moon, Sun, ChevronRight, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


interface NavbarProps {
  projectName?: string;
}


export default function Navbar({ projectName }: NavbarProps) {
  const [location, setLocation] = useLocation();
  const { theme, toggle } = useTheme();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await api.get('/auth/me');
      return res.data.data;
    },
    enabled: !!user
  });

  const [nameInput, setNameInput] = useState("");
  const [avatarInput, setAvatarInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Initialize inputs when profile loads
  const [hasInitialized, setHasInitialized] = useState(false);
  if (profile && !hasInitialized) {
    setNameInput(profile.name || "");
    setAvatarInput(profile.avatarUrl || "");
    setHasInitialized(true);
  }
  const isLanding = location === "/";
  const isLogin = location === "/login";
  const isDashboard = location.startsWith("/deployments") || location.startsWith("/deploy");




  const handleSignOut = async () => {
    await signOut();
    setLocation("/login");
  };

  const saveProfile = async () => {
    setIsSaving(true);
    try {
      await api.patch('/auth/me', { name: nameInput, avatarUrl: avatarInput });
      toast({ title: "Profile updated" });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setIsSettingsOpen(false);
    } catch (err: any) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed top-3 left-0 right-0 z-50 px-4 sm:px-6 md:px-10">

      <nav className="
        max-w-[1400px] mx-auto
        rounded-lg
        border border-border
        bg-background/80
        supports-[backdrop-filter]:bg-background/60
        backdrop-blur-md
        shadow-sm
      ">

        {/* ── Main row ─────────────────────────── */}
        <div className="h-14 px-4 sm:px-5 flex items-center justify-between gap-3">

          {/* LEFT */}
          <div className="flex items-center gap-2 min-w-0 shrink-0">
            <Link href="/" className="flex items-center gap-2 hover:opacity-75 transition-opacity">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                <rect x="0" y="0" width="9" height="9" rx="2" fill="currentColor" />
                <rect x="11" y="0" width="9" height="9" rx="2" fill="currentColor" opacity="0.6" />
                <rect x="0" y="11" width="9" height="9" rx="2" fill="currentColor" opacity="0.6" />
                <rect x="11" y="11" width="9" height="9" rx="2" fill="currentColor" opacity="0.3" />
              </svg>
              <span className="font-semibold text-sm tracking-tight text-foreground">Launchpad</span>
            </Link>

            {isDashboard && projectName && (
              <div className="flex items-center gap-1.5 text-sm min-w-0 overflow-hidden">
                <ChevronRight className="w-3.5 h-3.5 text-foreground/30 shrink-0" />
                <span className="text-foreground/40 shrink-0 hidden xs:inline">Projects</span>
                <ChevronRight className="w-3.5 h-3.5 text-foreground/30 shrink-0 hidden xs:inline" />
                <span className="text-foreground/70 font-mono text-xs truncate font-bold">{projectName}</span>
              </div>
            )}
          </div>

          {/* CENTER */}
          {isLanding && (
            <div className="hidden md:flex items-center gap-0.5">
              {["Product", "Pricing", "Changelog", "Docs"].map((item) => (
                <Link
                  key={item}
                  href={item === "Docs" ? "/docs" : "#"}
                  className="px-3 py-1.5 text-sm text-muted-foreground
                    hover:text-foreground hover:bg-foreground/[0.06]
                    active:bg-foreground/[0.1]
                    rounded-lg transition-all duration-150 relative group"
                >
                  {item}
                  <span className="absolute bottom-1 left-3 right-3 h-px
                    bg-foreground/30 scale-x-0 group-hover:scale-x-100
                    transition-transform duration-200 origin-left" />
                </Link>
              ))}
            </div>
          )}

          {/* RIGHT */}
          <div className="flex items-center gap-1 shrink-0">

            <button
              onClick={toggle}
              className="p-2 rounded-lg text-muted-foreground
                hover:text-foreground hover:bg-foreground/[0.06]
                active:bg-foreground/[0.1] transition-all duration-150"
              data-testid="button-theme-toggle"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {user && (
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="hidden sm:inline-flex text-sm text-muted-foreground
                  hover:text-foreground hover:bg-foreground/[0.06]
                  font-medium transition-all duration-150 mr-1"
              >
                <Link href="/deployments">Dashboard</Link>
              </Button>
            )}

            {!isLogin && (
              <>
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="flex items-center gap-2 p-1 rounded-lg
                          hover:bg-foreground/[0.06] active:bg-foreground/[0.1]
                          transition-all duration-150
                          focus-visible:ring-2 focus-visible:ring-foreground/20
                          focus-visible:outline-none"
                        data-testid="button-user-menu"
                      >
                        <Avatar className="w-7 h-7">
                          <AvatarImage src={profile?.avatarUrl} />
                          <AvatarFallback className="bg-foreground/10 text-foreground text-xs font-medium">
                            {(profile?.name || user?.email)?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-52 backdrop-blur-md bg-background/75
                        border border-border/40
                        shadow-[0_8px_32px_hsl(var(--foreground)/0.08)]
                        rounded-xl"
                    >
                      <DropdownMenuLabel className="text-muted-foreground font-normal text-xs">
                        {user?.email}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild className="cursor-pointer text-sm">
                        <Link href="/deployments">Dashboard</Link>
                      </DropdownMenuItem>
                      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                        <DialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">Settings</DropdownMenuItem>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>Edit profile</DialogTitle>
                            <DialogDescription>
                              Make changes to your profile here. Click save when you're done.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="name" className="text-right text-xs">Name</Label>
                              <Input id="name" value={nameInput} onChange={e => setNameInput(e.target.value)} className="col-span-3 text-sm" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="avatar" className="text-right text-xs">Avatar URL</Label>
                              <Input id="avatar" value={avatarInput} onChange={e => setAvatarInput(e.target.value)} className="col-span-3 text-sm" />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="button" disabled={isSaving} onClick={saveProfile}>
                              {isSaving ? "Saving..." : "Save changes"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <DropdownMenuItem className="cursor-pointer text-sm">Changelog</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-muted-foreground">
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="hidden sm:inline-flex text-sm text-muted-foreground
                        hover:text-foreground hover:bg-foreground/[0.06]
                        font-medium transition-all duration-150"
                    >
                      <Link href="/login" data-testid="link-login">Log in</Link>
                    </Button>

                    <Button
                      size="sm"
                      asChild
                      className="text-xs font-semibold
                        bg-orange-500 hover:bg-orange-600 active:bg-orange-700
                        text-white border-0 rounded-full px-3.5 sm:px-4
                        shadow-[0_2px_12px_hsl(24_95%_53%/0.40)]
                        hover:shadow-[0_4px_20px_hsl(24_95%_53%/0.50)]
                        active:shadow-none transition-all duration-150"
                    >
                      <Link href="/login" data-testid="link-signup" className="flex items-center gap-1">
                        Sign Up
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </Button>
                  </>
                )}
              </>
            )}

            {/* Mobile hamburger */}
            {isLanding && (
              <button
                onClick={() => setMobileOpen((o) => !o)}
                className="md:hidden ml-1 p-2 rounded-lg text-muted-foreground
                  hover:text-foreground hover:bg-foreground/[0.06]
                  active:bg-foreground/[0.1] transition-all duration-150"
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
              >
                {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        {/* ── Mobile drawer ────────────────────── */}
        {isLanding && mobileOpen && (
          <div className="md:hidden border-t border-border/30 px-3 pb-3 pt-2 flex flex-col gap-0.5">
            {["Product", "Pricing", "Changelog", "Docs"].map((item) => (
              <Link
                key={item}
                href={item === "Docs" ? "/docs" : "#"}
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2.5 text-sm text-muted-foreground
                  hover:text-foreground hover:bg-foreground/[0.06]
                  rounded-lg transition-all duration-150"
              >
                {item}
              </Link>
            ))}
            {!isLogin && !user && (
              <>
                <div className="h-px bg-border/40 my-1" />
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2.5 text-sm text-muted-foreground
                    hover:text-foreground hover:bg-foreground/[0.06]
                    rounded-lg transition-all duration-150"
                >
                  Log in
                </Link>
              </>
            )}
            {user && (
              <>
                <div className="h-px bg-border/40 my-1" />
                <Link
                  href="/deployments"
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2.5 text-sm text-muted-foreground
                    hover:text-foreground hover:bg-foreground/[0.06]
                    rounded-lg transition-all duration-150"
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    setIsSettingsOpen(true);
                    setMobileOpen(false);
                  }}
                  className="px-3 py-2.5 text-left text-sm text-muted-foreground
                    hover:text-foreground hover:bg-foreground/[0.06]
                    rounded-lg transition-all duration-150"
                >
                  Settings
                </button>
              </>
            )}
          </div>
        )}
      </nav>
    </div>
  );
}