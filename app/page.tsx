'use client';
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from '@/utils/supabase/client';

export default function Home() {
  const supabase = createClient();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      setEmail(data.user?.email ?? null);
    };

    loadUser();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };
  return (
    <div>
      <Button  className="bg-primary text-primary-foreground" onClick={handleSignOut}>
        Signout
      </Button>
      <h1>Welcome, {email}!</h1>
    </div>
  );
}
