'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";
import Image from "next/image";
import { createClient } from '@/utils/supabase/client';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        console.error('Login error:', error);
      } else if (data?.session) {
        console.log('Login successful, redirecting...');
        // Wait a moment for session to be set in cookies
        await new Promise(resolve => setTimeout(resolve, 500));
        router.refresh();
        router.push('/');
      } else {
        setError('Login failed. Please try again.');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred. Please try again.';
      setError(errorMsg);
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setError(error.message);
        console.error('Google login error:', error);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred with Google login.';
      setError(errorMsg);
      console.error('Google login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* IMAGE */}
      <div className="relative h-64 sm:h-80 lg:h-full lg:block hidden">
        <Image
          src="/login_side_image.png"
          alt="Login Illustration"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

        <div className="absolute bottom-6 left-6 text-white max-w-sm">
          <p className="text-lg sm:text-2xl font-semibold leading-relaxed">
            "The best way to plan your next escape is with a companion who knows the way."
          </p>
        </div>
      </div>

      {/* FORM */}
      <div className="bg-orange-50 flex flex-col items-center justify-center px-6 py-10 lg:px-12 gap-8">
        <div className="text-center">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold">
            Welcome Back
          </h1>
          <p className="text-sm text-neutral-500">
            Access your curated itineraries and travel boards.
          </p>
        </div>

        <Card className="w-full max-w-md">
          <CardContent>
            <form onSubmit={handleLogin}>
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
                  />
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    <a href="/forgot-password" className="ml-auto text-sm hover:underline text-primary">
                      Forgot password?
                    </a>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}
              </div>
            </form>
          </CardContent>

          <CardFooter className="flex-col gap-3">
            <Button className="w-full" onClick={handleLogin} disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>

            <div className="flex items-center gap-3 w-full">
              <div className="flex-1 h-px bg-gray-300"></div>
              <span className="text-xs text-neutral-500 uppercase">
                Or continue with
              </span>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>

            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <FcGoogle size={20} />
              Google
            </Button>
          </CardFooter>
        </Card>

        <p className="text-sm text-center">
          New to Travel-Buddy?{" "}
          <a href="/signup" className="text-primary font-semibold hover:underline">
            Create an account
          </a>
        </p>
      </div>
    </div>
  );
}