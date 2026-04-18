// DeployFlowAnimation.tsx
import { useState, useEffect, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { SiGithub, SiRedis, SiDocker, SiCloudflare } from "react-icons/si";
import { Globe, Database, Check, GitBranch, Clock, ExternalLink, Package } from "lucide-react";

/* ── pipeline ─────────────────────────────────────────────────── */
const STEPS = [
    { id: "source", label: "Source", sub: "Git webhook received", detail: "refs/heads/main · a3f72c4", Icon: SiGithub, color: "#58a6ff", time: "0s" },
    { id: "queue", label: "Queued", sub: "Build scheduler", detail: "Assigned to worker-03 · job #8821", Icon: SiRedis, color: "#e05252", time: "1s" },
    { id: "build", label: "Build", sub: "Docker · isolated", detail: "npm ci · npm run build · 2.4 MB output", Icon: SiDocker, color: "#4d9de0", time: "28s" },
    { id: "store", label: "Upload", sub: "MinIO object store", detail: "142 assets → builds/a3f72c", Icon: Package, color: "#e8a838", time: "36s" },
    { id: "cdn", label: "Distribute", sub: "Edge CDN · 180 PoPs", detail: "Propagated · avg latency 8ms", Icon: SiCloudflare, color: "#f6821f", time: "39s" },
    { id: "live", label: "Live", sub: "Deployment complete", detail: "my-site-a3f7.launchpad.app", Icon: Globe, color: "#3fb950", time: "41s" },
] as const;

type Phase = "idle" | "running" | "done";
const STEP_MS = 980;
const HOLD_MS = 3200;

/* ── typing hook ──────────────────────────────────────────────── */
function useTyping(text: string, active: boolean, speed = 22) {
    const [displayed, setDisplayed] = useState("");
    useEffect(() => {
        if (!active) { setDisplayed(""); return; }
        setDisplayed("");
        let i = 0;
        const id = setInterval(() => {
            i++;
            setDisplayed(text.slice(0, i));
            if (i >= text.length) clearInterval(id);
        }, speed);
        return () => clearInterval(id);
    }, [text, active]);
    return displayed;
}

/* ── step row ─────────────────────────────────────────────────── */
function StepRow({ step, index, isDone, isActive }: {
    step: typeof STEPS[number]; index: number; isDone: boolean; isActive: boolean;
}) {
    const detail = useTyping(step.detail, isActive, 22);

    return (
        <div className="flex items-start gap-0">

            {/* left rail */}
            <div className="flex flex-col items-center" style={{ width: 40, minWidth: 40 }}>

                {/* node */}
                <div className="relative flex-shrink-0">
                    {isActive && (
                        <motion.div className="absolute inset-[-4px] rounded-full pointer-events-none"
                            animate={{ opacity: [0.6, 0.15, 0.6] }}
                            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                            style={{ background: `radial-gradient(circle, ${step.color}55 0%, transparent 70%)` }}
                        />
                    )}

                    <motion.div
                        className="relative w-8 h-8 rounded-full border flex items-center justify-center overflow-hidden"
                        animate={{
                            borderColor: isDone ? `${step.color}90` : isActive ? step.color : "rgba(255,255,255,0.08)",
                            backgroundColor: isDone ? `${step.color}18` : isActive ? `${step.color}12` : "rgba(255,255,255,0.02)",
                        }}
                        transition={{ duration: 0.4 }}
                    >
                        {/* shimmer sweep */}
                        {isActive && (
                            <motion.div className="absolute inset-0 pointer-events-none"
                                style={{ background: `linear-gradient(105deg, transparent 40%, ${step.color}30 50%, transparent 60%)` }}
                                animate={{ x: ["-100%", "200%"] }}
                                transition={{ duration: 1.2, repeat: Infinity, ease: "linear", repeatDelay: 0.3 }}
                            />
                        )}

                        <AnimatePresence mode="wait">
                            {isDone ? (
                                <motion.div key="check" initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: "spring", stiffness: 600, damping: 20 }}>
                                    <Check className="w-3 h-3" style={{ color: step.color }} />
                                </motion.div>
                            ) : (
                                <motion.div key="icon" style={{ color: isActive ? step.color : "rgba(255,255,255,0.15)" }}>
                                    <step.Icon className="w-3 h-3" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>

                {/* connector */}
                {index < STEPS.length - 1 && (
                    <div className="relative w-px my-1" style={{ height: 52 }}>
                        <div className="absolute inset-0 bg-white/[0.05] rounded-full" />
                        <motion.div className="absolute top-0 left-0 right-0 origin-top rounded-full"
                            style={{ backgroundColor: step.color, height: "100%" }}
                            animate={{ scaleY: isDone ? 1 : 0 }}
                            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                        />
                        {isActive && (
                            <motion.div className="absolute left-1/2 -translate-x-1/2 w-[3px] h-[3px] rounded-full"
                                style={{ backgroundColor: STEPS[index + 1]?.color ?? step.color }}
                                initial={{ top: 0, opacity: 0 }}
                                animate={{ top: "100%", opacity: [0, 1, 1, 0] }}
                                transition={{ duration: 0.8, delay: 0.4, repeat: Infinity, ease: "easeIn" }}
                            />
                        )}
                    </div>
                )}
            </div>

            {/* content */}
            <div className="flex-1 ml-3 min-w-0" style={{ marginBottom: index < STEPS.length - 1 ? 16 : 0 }}>
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <span className="text-[13px] font-semibold tracking-tight leading-none transition-colors duration-300"
                                style={{ color: isDone ? "rgba(255,255,255,0.88)" : isActive ? "#fff" : "rgba(255,255,255,0.22)" }}>
                                {step.label}
                            </span>
                            {isActive && (
                                <motion.span className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                                    style={{ backgroundColor: `${step.color}20`, color: step.color }}
                                    animate={{ opacity: [1, 0.5, 1] }}
                                    transition={{ duration: 0.9, repeat: Infinity }}>
                                    running
                                </motion.span>
                            )}
                        </div>

                        <p className="text-[11px] mt-0.5 transition-colors duration-300"
                            style={{ color: isDone || isActive ? "rgba(255,255,255,0.32)" : "rgba(255,255,255,0.10)" }}>
                            {step.sub}
                        </p>

                        <div className="h-4 mt-1">
                            {(isDone || isActive) && (
                                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="text-[10px] font-mono truncate"
                                    style={{ color: isDone ? `${step.color}80` : "rgba(255,255,255,0.28)" }}>
                                    {isActive ? detail : `↳ ${step.detail}`}
                                    {isActive && (
                                        <motion.span className="inline-block w-[5px] h-[10px] ml-[1px] align-middle"
                                            style={{ backgroundColor: step.color }}
                                            animate={{ opacity: [1, 0, 1] }}
                                            transition={{ duration: 0.6, repeat: Infinity }}
                                        />
                                    )}
                                </motion.p>
                            )}
                        </div>
                    </div>

                    {/* time badge */}
                    <AnimatePresence>
                        {(isDone || isActive) && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.7, y: -4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ type: "spring", stiffness: 500, damping: 22 }}
                                className="shrink-0 flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded border"
                                style={{
                                    borderColor: isDone ? `${step.color}35` : `${step.color}55`,
                                    color: isDone ? `${step.color}cc` : step.color,
                                    backgroundColor: `${step.color}0d`,
                                }}>
                                <Clock className="w-2 h-2" />
                                {step.time}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

/* ── main ─────────────────────────────────────────────────────── */
export function DeployFlowAnimation() {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { once: false, margin: "-80px" });
    const [current, setCurrent] = useState(-1);
    const [phase, setPhase] = useState<Phase>("idle");

    useEffect(() => {
        if (!inView) { setCurrent(-1); setPhase("idle"); return; }
        const timers: ReturnType<typeof setTimeout>[] = [];
        const run = () => {
            setCurrent(-1); setPhase("running");
            STEPS.forEach((_, i) => {
                const t = setTimeout(() => setCurrent(i), i * STEP_MS + 300);
                timers.push(t);
            });
            const t = setTimeout(() => {
                setPhase("done");
                const r = setTimeout(run, HOLD_MS);
                timers.push(r);
            }, STEPS.length * STEP_MS + 300);
            timers.push(t);
        };
        run();
        return () => timers.forEach(clearTimeout);
    }, [inView]);

    const progress = phase === "done" ? 1 : current >= 0 ? (current + 0.5) / STEPS.length : 0;

    return (
        <div ref={ref} className="relative overflow-hidden rounded-2xl"
            style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.07)", boxShadow: "0 24px 64px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3)" }}>

            {/* header */}
            <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-1.5 shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                </div>
                <div className="flex-1 min-w-0 flex items-center gap-2">
                    <GitBranch className="w-3 h-3 text-white/25 shrink-0" />
                    <span className="text-[11px] font-mono text-white/35 shrink-0">main</span>
                    <span className="text-white/15 text-[10px] shrink-0">·</span>
                    <span className="text-[11px] font-mono text-white/25 truncate">a3f72c4 — update hero section</span>
                </div>
                <motion.div className="shrink-0 flex items-center gap-1.5 text-[10px] font-mono px-2 py-1 rounded-full border"
                    animate={{
                        borderColor: phase === "done" ? "rgba(63,185,80,0.30)" : phase === "running" ? "rgba(245,166,35,0.25)" : "rgba(255,255,255,0.07)",
                        color: phase === "done" ? "#3fb950" : phase === "running" ? "#f5a623" : "rgba(255,255,255,0.25)",
                    }}>
                    <motion.div className="w-1.5 h-1.5 rounded-full"
                        animate={{
                            backgroundColor: phase === "done" ? "#3fb950" : phase === "running" ? "#f5a623" : "rgba(255,255,255,0.2)",
                            scale: phase === "running" ? [1, 1.6, 1] : 1,
                        }}
                        transition={{ repeat: phase === "running" ? Infinity : 0, duration: 1 }}
                    />
                    {phase === "idle" && "idle"}{phase === "running" && "deploying"}{phase === "done" && "deployed"}
                </motion.div>
            </div>

            {/* pipeline */}
            <div className="px-4 pt-4 pb-2">
                {STEPS.map((step, i) => (
                    <StepRow key={step.id} step={step} index={i}
                        isDone={phase === "done" || current > i}
                        isActive={current === i && phase === "running"}
                    />
                ))}
            </div>

            {/* footer */}
            <div className="px-4 pb-4 pt-3 space-y-2.5" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="relative h-[2px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <motion.div className="absolute inset-y-0 left-0 rounded-full"
                        style={{ background: "linear-gradient(90deg, #4d9de0 0%, #f6821f 60%, #3fb950 100%)" }}
                        animate={{ width: `${progress * 100}%` }}
                        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <AnimatePresence mode="wait">
                        {phase === "done" ? (
                            <motion.span key="url" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-1.5 text-[11px] font-mono" style={{ color: "#3fb950" }}>
                                <Globe className="w-3 h-3 shrink-0" />
                                my-site-a3f7.launchpad.app
                                <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                            </motion.span>
                        ) : (
                            <motion.span key="status" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.18)" }}>
                                {phase === "idle" && "awaiting trigger..."}
                                {phase === "running" && current >= 0 && `running ${STEPS[current].sub.toLowerCase()}...`}
                            </motion.span>
                        )}
                    </AnimatePresence>
                    <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.20)" }}>
                        {phase === "done" ? "41s total" : current >= 0 ? `${STEPS[current].time} elapsed` : "—"}
                    </span>
                </div>
            </div>
        </div>
    );
}