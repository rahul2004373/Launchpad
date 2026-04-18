import { SiGithub } from "react-icons/si";

export default function Footer() {
  return (
    <footer className="border-t border-border mt-auto bg-background">
      <div className="max-w-[1400px] mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <rect x="0" y="0" width="9" height="9" rx="2" fill="currentColor"/>
            <rect x="11" y="0" width="9" height="9" rx="2" fill="currentColor" opacity="0.5"/>
            <rect x="0" y="11" width="9" height="9" rx="2" fill="currentColor" opacity="0.5"/>
            <rect x="11" y="11" width="9" height="9" rx="2" fill="currentColor" opacity="0.25"/>
          </svg>
          <span className="text-xs text-muted-foreground">© 2026 Launchpad</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Status</a>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
            <SiGithub className="w-4 h-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}
