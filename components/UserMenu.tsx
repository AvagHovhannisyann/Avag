"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function UserMenu({ email }: { email: string | null }) {
  const router = useRouter();

  if (!email) return null;

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2 border-l pl-3">
      <span className="hidden max-w-[160px] truncate text-xs text-muted-foreground md:inline">
        {email}
      </span>
      <Button variant="ghost" size="sm" onClick={signOut} aria-label="Sign out">
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}
