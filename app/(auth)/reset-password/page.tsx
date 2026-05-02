"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import logo from "@/public/logoWhite.png";
import italy from "@/public/italy.jpg";
import { ArrowLeft, Eye, EyeOff, ShieldCheck } from "lucide-react";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false); // ← session prête ?
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setReady(true); // session active → affiche le formulaire
      } else {
        router.push("/login"); // pas de session → retour login
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(error.message);
      } else {
        setDone(true);
        setTimeout(() => router.push("/login"), 2500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* IMAGE */}
      <div className="relative h-64 sm:h-80 lg:h-full lg:block hidden">
        <Image
          src={italy}
          alt="Reset Password"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-6 left-6 text-white max-w-sm">
          <p className="text-lg sm:text-2xl font-semibold leading-relaxed">
            "A fresh start is the most powerful journey of all."
          </p>
        </div>
      </div>

      {/* FORM */}
      <div className="bg-white flex flex-col items-center justify-center px-6 py-10 lg:px-12 gap-8">
        <div className="text-center flex flex-col items-center gap-3">
          <Image
            src={logo}
            alt="Travel Buddy Logo"
            className="object-contain w-15 h-15"
            priority
          />
          <h1 className="font-heading text-3xl sm:text-4xl font-bold">
            New Password
          </h1>
          <p className="text-sm text-neutral-500">
            Choose a strong password for your account.
          </p>
        </div>

        <Card className="w-full max-w-md shadow-xl">
          <CardContent>
            {done ? (
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <div className="w-14 h-14 rounded-full bg-[#9f411d]/10 flex items-center justify-center">
                  <ShieldCheck className="text-[#9f411d]" size={28} />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">
                    Password updated!
                  </p>
                  <p className="text-sm text-neutral-500 mt-1">
                    Redirecting you to login…
                  </p>
                </div>
              </div>
            ) : !ready ? (
              // ← Token pas encore lu, on attend
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div className="w-8 h-8 border-2 border-[#9f411d] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-neutral-500">Verifying your link…</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Min. 8 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        required
                        className="p-5 pr-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                      >
                        {showPassword ? (
                          <EyeOff size={17} />
                        ) : (
                          <Eye size={17} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="confirm">Confirm Password</Label>
                    <Input
                      id="confirm"
                      type={showPassword ? "text" : "password"}
                      placeholder="Repeat your password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      disabled={loading}
                      required
                      className="p-5"
                    />
                  </div>

                  {password.length > 0 && (
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-all ${
                            password.length >= level * 3
                              ? level <= 1
                                ? "bg-red-400"
                                : level <= 2
                                  ? "bg-orange-400"
                                  : level <= 3
                                    ? "bg-yellow-400"
                                    : "bg-green-500"
                              : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {error && <p className="text-red-500 text-sm">{error}</p>}
                </div>
              </form>
            )}
          </CardContent>

          <CardFooter className="flex-col gap-3">
            {!done && ready && (
              <Button
                className="w-full bg-[#9f411d] hover:bg-[#7f3417] text-white p-5"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Updating..." : "Update Password"}
              </Button>
            )}
            <a
              href="/login"
              className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-[#9f411d] transition-colors"
            >
              <ArrowLeft size={14} />
              Back to login
            </a>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
