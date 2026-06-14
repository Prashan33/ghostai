import { SignIn } from "@clerk/nextjs";
import { Cpu, ArrowLeftRight, FileText } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen bg-base">
      {/* Left panel */}
      <div className="hidden lg:flex lg:flex-col lg:w-[45%] px-16 py-12">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-brand shrink-0" />
          <span className="text-copy-primary text-sm font-medium">Ghost AI</span>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col justify-center">
          <h1 className="text-4xl font-bold text-copy-primary leading-tight mb-4">
            Design systems at the<br />speed of thought.
          </h1>
          <p className="text-copy-secondary text-sm leading-relaxed mb-10">
            Describe your architecture in plain English. Ghost AI maps it to a shared
            canvas your whole team can refine in real time.
          </p>

          <div className="space-y-6">
            <div className="flex items-start gap-3">
              <div className="shrink-0 h-8 w-8 rounded-lg bg-accent-dim flex items-center justify-center">
                <Cpu className="h-4 w-4 text-brand" />
              </div>
              <div>
                <p className="text-copy-primary text-sm font-medium">AI Architecture Generation</p>
                <p className="text-copy-muted text-xs mt-0.5 leading-relaxed">
                  Describe your system, AI maps it to nodes and edges on a live canvas.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="shrink-0 h-8 w-8 rounded-lg bg-ai/15 flex items-center justify-center">
                <ArrowLeftRight className="h-4 w-4 text-ai-text" />
              </div>
              <div>
                <p className="text-copy-primary text-sm font-medium">Real-time Collaboration</p>
                <p className="text-copy-muted text-xs mt-0.5 leading-relaxed">
                  Live cursors, presence indicators, and shared node editing across your team.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="shrink-0 h-8 w-8 rounded-lg bg-ai/15 flex items-center justify-center">
                <FileText className="h-4 w-4 text-ai-text" />
              </div>
              <div>
                <p className="text-copy-primary text-sm font-medium">Instant Spec Generation</p>
                <p className="text-copy-muted text-xs mt-0.5 leading-relaxed">
                  Export a complete Markdown technical spec directly from the canvas graph.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <p className="text-copy-faint text-xs">© 2026 Ghost AI. All rights reserved.</p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center">
        <SignIn />
      </div>
    </div>
  );
}
