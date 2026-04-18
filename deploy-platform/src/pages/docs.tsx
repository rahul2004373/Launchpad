import React from 'react';
import {
    Rocket,
    Cpu,
    Terminal,
    RefreshCcw,
    CheckCircle2,
    ArrowLeft
} from 'lucide-react';

const DocsPage = () => {
    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 md:py-16">

                {/* Navigation */}
                <nav className="mb-10 md:mb-12">
                    <a
                        href="/"
                        className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors text-xs md:text-sm font-medium group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform duration-300" />
                        Back to Homepage
                    </a>
                </nav>

                {/* Header */}
                <header className="mb-10 md:mb-16 border-b border-white/10 pb-8 md:pb-10">
                    <div className="flex items-center gap-2 mb-4 md:mb-6 text-white/50 uppercase tracking-widest text-[10px] md:text-[11px] font-bold">
                        <Rocket size={14} />
                        <span>Deployment Guide</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4 md:mb-6 leading-tight">
                        Deploying on Launchpad
                    </h1>
                    <p className="text-white/60 text-base md:text-lg leading-relaxed max-w-2xl">
                        From repository to global edge in seconds. Launchpad automates the containerization
                        and hosting of your Vite and CRA projects.
                    </p>
                </header>

                {/* Section: Architecture Diagram */}
                <section className="mb-12 md:mb-20">
                    <h2 className="text-lg md:text-xl font-medium mb-4 md:mb-6 flex items-center gap-3">
                        <Cpu size={20} className="text-white/70" />
                        System Architecture
                    </h2>
                    <div className="border border-white/10 rounded-xl overflow-hidden bg-[#050505] p-2 hover:border-white/20 transition-colors duration-300">
                        <img
                            src="/arch_diagram.png"
                            alt="Launchpad Architecture Diagram"
                            className="w-full h-auto rounded-lg opacity-90 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500"
                        />
                    </div>
                </section>

                {/* Section: How to Deploy */}
                <section className="mb-12 md:mb-20 grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-12">

                    <div className="lg:col-span-5 space-y-8 md:space-y-10">
                        <h2 className="text-lg md:text-xl font-medium mb-6 md:mb-8 border-l-2 border-white pl-4">Deployment Steps</h2>

                        <div className="space-y-8">
                            <div className="flex gap-4 md:gap-5 group">
                                <div className="flex-none w-7 h-7 rounded-full border border-white/20 flex items-center justify-center text-xs font-mono bg-white/5 group-hover:bg-white group-hover:text-black transition-colors">1</div>
                                <div>
                                    <h3 className="text-sm md:text-base font-semibold mb-1">Import Repository</h3>
                                    <p className="text-white/50 text-xs md:text-sm leading-relaxed">
                                        Connect GitHub via OAuth or paste a public URL. We'll pull the latest code and prepare the isolated environment.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4 md:gap-5 group">
                                <div className="flex-none w-7 h-7 rounded-full border border-white/20 flex items-center justify-center text-xs font-mono bg-white/5 group-hover:bg-white group-hover:text-black transition-colors">2</div>
                                <div>
                                    <h3 className="text-sm md:text-base font-semibold mb-1">Configure & Build</h3>
                                    <p className="text-white/50 text-xs md:text-sm leading-relaxed">
                                        Our system detects your framework automatically. Review the generated build commands and inject environment variables.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4 md:gap-5 group">
                                <div className="flex-none w-7 h-7 rounded-full border border-white/20 flex items-center justify-center text-xs font-mono bg-white/5 group-hover:bg-white group-hover:text-black transition-colors">3</div>
                                <div>
                                    <h3 className="text-sm md:text-base font-semibold mb-1">Go Live</h3>
                                    <p className="text-white/50 text-xs md:text-sm leading-relaxed">
                                        Watch the build execute in real-time. Once the container finishes, production assets are synced globally.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Terminal Component UI */}
                    <div className="lg:col-span-7">
                        <div className="bg-[#050505] border border-white/10 rounded-xl overflow-hidden font-mono text-xs md:text-sm shadow-2xl">
                            {/* Terminal Header */}
                            <div className="flex items-center px-4 py-3 border-b border-white/5 bg-white/[0.02]">
                                <div className="flex gap-1.5 md:gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-white/20"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-white/20"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-white/20"></div>
                                </div>
                                <div className="mx-auto text-[10px] md:text-[11px] text-white/40 tracking-widest flex items-center gap-2">
                                    <Terminal size={12} />
                                    <span>build-log.sh</span>
                                </div>
                            </div>

                            {/* Terminal Body */}
                            <div className="p-4 md:p-5 text-[12px] md:text-[13px] leading-loose overflow-x-auto whitespace-nowrap md:whitespace-normal">
                                <div className="flex items-center gap-2 md:gap-3 text-white/80">
                                    <CheckCircle2 size={14} className="text-white flex-shrink-0" />
                                    <span>Cloning repository <span className="text-white/50">username/project...</span></span>
                                </div>
                                <div className="flex items-center gap-2 md:gap-3 text-white/80">
                                    <CheckCircle2 size={14} className="text-white flex-shrink-0" />
                                    <span>Analyzing framework... <span className="text-white/50 text-[10px] md:text-xs px-1.5 py-0.5 border border-white/20 rounded ml-1">Vite detected</span></span>
                                </div>
                                <div className="flex items-center gap-2 md:gap-3 text-white/80">
                                    <CheckCircle2 size={14} className="text-white flex-shrink-0" />
                                    <span>Provisioning isolated Docker container...</span>
                                </div>
                                <div className="flex items-center gap-2 md:gap-3 text-white/80">
                                    <CheckCircle2 size={14} className="text-white flex-shrink-0" />
                                    <span>Installing dependencies <span className="text-white/50">(npm install)</span></span>
                                </div>

                                {/* Active Step */}
                                <div className="flex items-center gap-2 md:gap-3 text-white mt-2 md:mt-1">
                                    <div className="relative flex h-3 w-3 items-center justify-center ml-0.5 flex-shrink-0">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                                    </div>
                                    <span className="ml-0.5">Executing build command <span className="text-white/50">(npm run build)</span></span>
                                </div>

                                {/* Terminal Output snippet */}
                                <div className="mt-4 pl-6 md:pl-7 text-white/40 text-[11px] md:text-xs font-mono space-y-1">
                                    <p>&gt; vite build</p>
                                    <p>✓ 34 modules transformed.</p>
                                    <p>dist/index.html &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0.45 kB</p>
                                    <p>dist/assets/index.js &nbsp;&nbsp;&nbsp;&nbsp;142.12 kB</p>
                                    <p className="text-white/60 pt-1 animate-pulse">syncing to s3 bucket...</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </section>

                {/* Footer / Meta */}
                <footer className="pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0 text-[10px] text-white/40 uppercase tracking-widest">
                    <div className="flex flex-wrap justify-center sm:justify-start gap-4 sm:gap-6">
                        <span className="flex items-center gap-1.5 hover:text-white/70 transition-colors cursor-default"><CheckCircle2 size={12} /> Secure builds</span>
                        <span className="flex items-center gap-1.5 hover:text-white/70 transition-colors cursor-default"><RefreshCcw size={12} /> Auto-redeploy</span>
                    </div>
                    <span className="font-mono">Launchpad v1.0.0</span>
                </footer>
            </div>
        </div>
    );
};

export default DocsPage;