import Link from "next/link";
import { Lock } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center">
      <Lock className="h-8 w-8 text-copy-muted" />
      <p className="text-sm text-copy-secondary">
        You don&apos;t have access to this project.
      </p>
      <Link
        href="/editor"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
      >
        Back to projects
      </Link>
    </div>
  );
}
