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
import logo from '@/public/logoWhite.png';
import greece from '@/public/greece2.jpg';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
        console.error('Signup error:', error);
      } else if (data?.user) {
        console.log('Signup successful, redirecting...');
        // Wait a moment for session to be set in cookies
        await new Promise(resolve => setTimeout(resolve, 500));
        router.refresh();
        router.push('/dashboard');
      } else {
        setError('Signup failed. Please try again.');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred. Please try again.';
      setError(errorMsg);
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
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
        console.error('Google signup error:', error);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred with Google signup.';
      setError(errorMsg);
      console.error('Google signup error:', err);
    } finally {
      setLoading(false);
    }
    setLoading(false);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">

      {/* IMAGE */}
      <div className="relative h-64 sm:h-80 lg:h-full lg:block hidden">
        <Image
          src={greece}
          alt="Signup Illustration"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

        <div className="absolute bottom-6 left-6 text-white max-w-sm">
          <p className="text-lg sm:text-2xl font-semibold leading-relaxed italic">
            "The world is a book and those who do not travel read only one page."
          </p>
        </div>
      </div>

      {/* FORM */}
      <div className="bg-white flex flex-col items-center justify-center px-6 py-10 lg:px-12 gap-4">
        <div className="text-center flex flex-col items-center gap-3">
            {/* LOGO */}
                    <Image
                      src={logo}
                      alt="Travel Buddy Logo"
                      className="object-contain w-15 h-15"
                      priority
                    />
          <h1 className="font-heading text-3xl sm:text-4xl font-bold">
            Create an Account
          </h1>
          <p className="text-sm text-neutral-500">
            Join our community and start planning your next adventure.
          </p>
        </div>

        <Card className="w-full max-w-md shadow-xl">
          <CardContent>
            <form onSubmit={handleSignup}>
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
                    className="p-5"

                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="p-5"

                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    className="p-5"

                  />
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}
              </div>
            </form>
          </CardContent>

          <CardFooter className="flex-col gap-3">
            <Button className="w-full bg-[#9f411d] hover:bg-[#7f3417] text-white p-5" onClick={handleSignup} disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
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
              className="w-full flex items-center justify-center gap-2 p-5"
              onClick={handleGoogleSignup}
              disabled={loading}
            >
              <FcGoogle size={20} />
              Google
            </Button>
          </CardFooter>
        </Card>

        <p className="text-sm text-center">
          Already have an account?
          <a href="/login" className="text-primary font-semibold hover:underline">
            Log in
          </a>
        </p>

      </div>
    </div>
  );
}