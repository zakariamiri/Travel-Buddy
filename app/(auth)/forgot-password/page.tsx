"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import logo from "@/public/logoWhite.png";
import italy from "@/public/italy.jpg";
import { ArrowLeft, MailCheck } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/send-reset-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "An error occurred.");
      } else {
        setSent(true);
      }
    } catch (err) {
      setError("An error occurred.");
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
          alt="Forgot Password Illustration"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-6 left-6 text-white max-w-sm">
          <p className="text-lg sm:text-2xl font-semibold leading-relaxed">
            "Every great journey begins with a single step — even the one back
            to your account."
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
            Forgot Password
          </h1>
          <p className="text-sm text-neutral-500">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        <Card className="w-full max-w-md shadow-xl">
          <CardContent>
            {sent ? (
              /* ── SUCCESS STATE ── */
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <div className="w-14 h-14 rounded-full bg-[#9f411d]/10 flex items-center justify-center">
                  <MailCheck className="text-[#9f411d]" size={28} />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">
                    Check your inbox!
                  </p>
                  <p className="text-sm text-neutral-500 mt-1">
                    We sent a reset link to{" "}
                    <span className="font-medium text-gray-700">{email}</span>.
                    <br />
                    Don't forget to check your spam folder.
                  </p>
                </div>
              </div>
            ) : (
              /* ── FORM STATE ── */
              <form onSubmit={handleSubmit}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      required
                      className="p-5"
                    />
                  </div>
                  {error && <p className="text-red-500 text-sm">{error}</p>}
                </div>
              </form>
            )}
          </CardContent>

          <CardFooter className="flex-col gap-3">
            {!sent && (
              <Button
                className="w-full bg-[#9f411d] hover:bg-[#7f3417] text-white p-5"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Reset Link"}
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
