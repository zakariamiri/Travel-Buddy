import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/reset-password";

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "recovery",
    });
    if (!error) {
      return NextResponse.redirect(new URL("/reset-password", request.url));
    }
  }

  return NextResponse.redirect(
    new URL("/login?error=invalid_link", request.url),
  );
}
