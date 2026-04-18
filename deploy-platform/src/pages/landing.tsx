import { useRef } from "react";
import { Link } from "wouter";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle, Zap, Shield, Globe, GitMerge, Clock, BarChart3, ChevronRight } from "lucide-react";
import { SiVite, SiReact, SiNextdotjs, SiVuedotjs, SiNodedotjs, SiDocker, SiRedis, SiPostgresql, SiSupabase, SiCloudflare, SiGithub, SiNpm } from "react-icons/si";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

/* ── animation helpers ─────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.55, ease: [0.25, 0.1, 0.25, 1] },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: (i: number = 0) => ({
    opacity: 1,
    transition: { delay: i * 0.08, duration: 0.45 },
  }),
};

function ScrollReveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ── data ───────────────────────────────────────────────────────── */
const archSteps = [
  { label: "Git Repo", desc: "Push to GitHub", icon: <SiGithub className="w-4 h-4" /> },
  { label: "Build Queue", desc: "Redis scheduling", icon: <SiRedis className="w-4 h-4 text-[#dc382d]" /> },
  { label: "Docker Build", desc: "Isolated container", icon: <SiDocker className="w-4 h-4 text-[#2496ed]" /> },
  { label: "S3 Storage", desc: "S3-compatible store", icon: <SiNodedotjs className="w-4 h-4 text-[#339933]" /> },
  { label: "CDN Edge", desc: "Global distribution", icon: <SiCloudflare className="w-4 h-4 text-[#f38020]" /> },
  { label: "Live URL", desc: "Unique immutable URL", icon: <Globe className="w-4 h-4 text-[#00c951]" /> },
];

const features = [
  {
    Icon: Zap,
    title: "Sub-60s Deploys",
    desc: "From git push to live URL in under a minute. Parallel build steps and smart caching keep every deploy fast.",
    color: "text-[#f5a623]",
  },
  {
    Icon: Shield,
    title: "Immutable Builds",
    desc: "Every deployment gets a unique, permanent URL. Roll back to any previous version with a single click.",
    color: "text-[#00c951]",
  },
  {
    Icon: Globe,
    title: "Edge-First CDN",
    desc: "Static assets served from the nearest edge node. Sub-10ms TTFB for users anywhere on the planet.",
    color: "text-[#61dafb]",
  },
  {
    Icon: GitMerge,
    title: "Preview Deploys",
    desc: "Every pull request gets its own preview URL automatically. Share work-in-progress before it ships.",
    color: "text-[#646cff]",
  },
  {
    Icon: Shield,
    title: "Build Isolation",
    desc: "Each build runs in a fresh Docker container. Zero dependency contamination between projects.",
    color: "text-[#ff4444]",
  },
  {
    Icon: BarChart3,
    title: "Real-time Logs",
    desc: "Streaming build logs with error detection. Know exactly why a build failed in seconds, not minutes.",
    color: "text-[#f5a623]",
  },
];

const frameworks = [
  { name: "Vite", Icon: SiVite, color: "#646cff" },
  { name: "React", Icon: SiReact, color: "#61dafb" },

  { name: "npm", Icon: SiNpm, color: "#cb3837" },
];

const techStack = [
  { name: "Node.js", Icon: SiNodedotjs, color: "#339933" },
  { name: "Docker", Icon: SiDocker, color: "#2496ed" },
  { name: "Redis", Icon: SiRedis, color: "#dc382d" },
  { name: "PostgreSQL", Icon: SiPostgresql, color: "#336791" },
  { name: "Supabase", Icon: SiSupabase, color: "#3ecf8e" },
  { name: "Cloudflare", Icon: SiCloudflare, color: "#f38020" },
];

const stats = [
  { value: "< 60s", label: "Average build time", sub: "p95" },
  { value: "99.9%", label: "Uptime SLA", sub: "guaranteed" },
  { value: "180+", label: "Edge locations", sub: "worldwide" },
  { value: "10k+", label: "Deploys per day", sub: "and growing" },
];

const testimonials = [
  {
    quote: "Launchpad cut our deploy time from 8 minutes to under 40 seconds. The preview URLs alone changed how our whole team reviews work.",
    name: "Priya Sharma",
    role: "Lead Engineer, Fintech startup",
  },
  {
    quote: "We migrated 60 projects from a legacy platform in a single afternoon. The GitHub import flow is genuinely seamless.",
    name: "Marcos Oliveira",
    role: "Platform Engineer",
  },
  {
    quote: "The immutable deploy URLs are a game changer for QA. We link directly to the exact build that caused the regression.",
    name: "Sara Chen",
    role: "Head of Engineering",
  },
];



/* ── stat card ──────────────────────────────────────────────────── */
function StatCard({ value, label, sub, delay }: { value: string; label: string; sub: string; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} className="text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.5, delay }}
        className="text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-1"
      >
        {value}
      </motion.div>
      <p className="text-sm font-medium text-foreground/70 mb-0.5">{label}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

/* ── terminal mockup ─────────────────────────────────────────────── */
const LOG_LINES = [
  { color: "text-muted-foreground", text: "$ launchpad deploy --branch main" },
  { color: "text-[#888]", text: "  Connecting to GitHub...     " },
  { color: "text-[#00c951]", text: "✓" },
  { color: "text-[#888]", text: "  Installing dependencies...  " },
  { color: "text-[#00c951]", text: "✓" },
  { color: "text-[#888]", text: "  Running build (npm run build)..." },
  { color: "text-[#888]", text: "  Uploading to edge...        " },
  { color: "text-[#00c951]", text: "✓" },
  { color: "text-[#00c951] font-semibold", text: "\n  ✓ Deployed in 41s" },
  { color: "text-foreground/60", text: "  → https://my-site-3f7a2.launchpad.app" },
];

function TerminalCard() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65 }}
      className="bg-[#0a0a0a] border border-white/8 rounded-2xl overflow-hidden shadow-2xl"
    >
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/8">
        <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-2 text-xs text-white/20 font-mono">terminal</span>
      </div>
      <div className="p-5 font-mono text-xs space-y-1.5">
        {LOG_LINES.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.1 + i * 0.12, duration: 0.3 }}
            className={`${line.color} leading-relaxed whitespace-pre`}
          >
            {line.text}
          </motion.div>
        ))}
        <motion.span
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: [0, 1, 0] } : {}}
          transition={{ delay: 1.8, duration: 1, repeat: Infinity }}
          className="inline-block w-1.5 h-3.5 bg-white/50 align-middle"
        />
      </div>
    </motion.div>
  );
}

/* ── main page ──────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-x-hidden">
      <Navbar />

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center pt-14 grid-bg">
        <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/20 to-background pointer-events-none" />
        <div className="relative z-10 max-w-[1280px] mx-auto px-6 w-full py-24">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left copy */}
            <div>
              <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible" className="mb-6">
                <span className="inline-flex items-center gap-2 bg-foreground/5 border border-border rounded-full text-xs px-3 py-1 text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00c951] inline-block" />
                  Now in Beta — free for all projects
                </span>
              </motion.div>

              <motion.h1
                custom={1} variants={fadeUp} initial="hidden" animate="visible"
                className="font-bold tracking-tight text-foreground leading-[1.07] mb-6"
                style={{ fontSize: "clamp(2.6rem, 5vw, 4.5rem)" }}
              >
                Ship faster.<br />
                <span className="text-muted-foreground">Every commit.</span>
              </motion.h1>

              <motion.p
                custom={2} variants={fadeUp} initial="hidden" animate="visible"
                className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-md"
              >
                Launchpad deploys your static sites from GitHub in under 60 seconds — with immutable URLs, global CDN, and zero configuration.
              </motion.p>

              <motion.div
                custom={3} variants={fadeUp} initial="hidden" animate="visible"
                className="flex flex-wrap items-center gap-3 mb-6"
              >
                <Button asChild size="lg" className="gap-2 font-medium w-full sm:w-auto justify-center">
                  <Link href="/deploy/new" data-testid="button-cta-deploy">
                    Start deploying free
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </motion.div>

              <motion.p custom={4} variants={fadeUp} initial="hidden" animate="visible" className="text-xs text-muted-foreground">
                No credit card required · Free forever · Open source
              </motion.p>

              {/* social proof */}
              <motion.div
                custom={5} variants={fadeUp} initial="hidden" animate="visible"
                className="flex items-center gap-3 mt-8 pt-8 border-t border-border"
              >
                <div className="flex -space-x-2">
                  {["AK", "MR", "SC", "LP"].map((initials) => (
                    <div key={initials} className="w-7 h-7 rounded-full bg-foreground/10 border-2 border-background flex items-center justify-center text-xs font-medium text-foreground/60">
                      {initials}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Trusted by <span className="text-foreground font-medium">2,000+</span> developers
                </p>
              </motion.div>
            </div>

            {/* Right: terminal mockup */}
            <div className="hidden lg:block">
              <TerminalCard />
            </div>
          </div>
        </div>
      </section>

      {/* ── Logos / trusted-by strip ───────────────────────────── */}
      <section className="py-10 border-y border-border bg-muted/20">
        <div className="max-w-[1280px] mx-auto px-6">
          <p className="text-xs text-muted-foreground text-center mb-6 uppercase tracking-widest">Built on open standards</p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {techStack.map(({ name, Icon, color }) => (
              <div key={name} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-default">
                <Icon style={{ color }} className="w-4 h-4" />
                <span className="text-sm font-medium">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────── */}
      <section className="py-28 px-6">
        <div className="max-w-[1280px] mx-auto">
          <ScrollReveal className="text-center mb-16">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Pipeline</p>
            <h2 className="text-3xl font-bold tracking-tight mb-3">Six steps. One command.</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">From commit to globally distributed URL — fully automated, every time.</p>
          </ScrollReveal>

          <div className="overflow-x-auto pb-4">
            <div className="flex items-start gap-0 min-w-max mx-auto w-fit">
              {archSteps.map((step, i) => (
                <div key={step.label} className="flex items-center gap-0">
                  <ScrollReveal delay={i * 0.07} className="flex flex-col items-center gap-3 w-36">
                    <div className="bg-card border border-border rounded-xl p-4 flex flex-col items-center gap-2 w-full hover:border-foreground/25 hover:shadow-sm transition-all duration-200">
                      <div className="text-muted-foreground">{step.icon}</div>
                      <span className="text-sm font-mono font-medium text-foreground">{step.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground text-center leading-tight">{step.desc}</p>
                  </ScrollReveal>
                  {i < archSteps.length - 1 && (
                    <div className="flex items-center mb-6 mx-1">
                      <ChevronRight className="w-4 h-4 text-border" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features grid ──────────────────────────────────────── */}
      <section className="py-28 px-6 bg-muted/20 border-y border-border">
        <div className="max-w-[1280px] mx-auto">
          <ScrollReveal className="text-center mb-16">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-3xl font-bold tracking-tight mb-3">Everything you need. Nothing you don't.</h2>
            <p className="text-muted-foreground max-w-md mx-auto">A tightly focused toolset for deploying static sites — fast, reliable, observable.</p>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <ScrollReveal key={f.title} delay={i * 0.06}>
                <div className="bg-card border border-border rounded-xl p-6 h-full hover:border-foreground/20 hover:shadow-md transition-all duration-200 group">
                  <div className={`${f.color} mb-4`}>
                    <f.Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-sm mb-2 text-foreground">{f.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────────── */}
      <section className="py-28 px-6">
        <div className="max-w-[1280px] mx-auto">
          <ScrollReveal className="text-center mb-16">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Scale</p>
            <h2 className="text-3xl font-bold tracking-tight">Numbers that matter</h2>
          </ScrollReveal>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-10">
            {stats.map((s, i) => (
              <StatCard key={s.value} {...s} delay={i * 0.1} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Frameworks ─────────────────────────────────────────── */}
      <section className="py-20 px-6 border-y border-border bg-muted/20">
        <div className="max-w-[1280px] mx-auto">
          <ScrollReveal className="text-center mb-10">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Compatibility</p>
            <h2 className="text-3xl font-bold tracking-tight mb-3">Works with your stack</h2>
            <p className="text-muted-foreground">Any static output works. If it builds, we deploy it.</p>
          </ScrollReveal>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {frameworks.map(({ name, Icon, color }) => (
              <ScrollReveal key={name}>
                <div className="flex items-center gap-2.5 bg-card border border-border rounded-xl px-5 py-3 text-sm text-foreground/70 hover:text-foreground hover:border-foreground/25 hover:shadow-sm transition-all duration-200 cursor-default">
                  <Icon style={{ color }} className="w-4 h-4" />
                  {name}
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────
      <section className="py-28 px-6">
        <div className="max-w-[1280px] mx-auto">
          <ScrollReveal className="text-center mb-16">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Stories</p>
            <h2 className="text-3xl font-bold tracking-tight">What teams are saying</h2>
          </ScrollReveal>
          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <ScrollReveal key={t.name} delay={i * 0.08}>
                <div className="bg-card border border-border rounded-xl p-6 h-full">
                  <p className="text-sm text-foreground/80 leading-relaxed mb-5">"{t.quote}"</p>
                  <div className="border-t border-border pt-4">
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.role}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section> */}



      {/* ── Final CTA ──────────────────────────────────────────── */}
      <section className="py-32 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <ScrollReveal>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-5">
              Ready to deploy?
            </h2>
            <p className="text-muted-foreground text-lg mb-10">
              Connect your GitHub repository and go live in under 60 seconds. No configuration needed.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" asChild className="gap-2">
                <Link href="/deploy/new">
                  Start for free
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
