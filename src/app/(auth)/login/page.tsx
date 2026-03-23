"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, AtSign, Lock } from "lucide-react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call to backend
    setTimeout(() => {
      setIsLoading(false);
      // For now, if we assume login succeeds, redirect to dashboard or home
      // In a real flow, if user is not fully verified, redirect to /register
      document.cookie = "token=dummy-session-token; path=/; max-age=86400";
      router.push("/");
    }, 1500);
  };

  const handleOAuthLogin = async (provider: "google") => {
    setIsLoading(true);
    // Use NextAuth to handle the OAuth redirect
    await signIn(provider, { callbackUrl: "/" });
  };

  return (
    <div className="w-full flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-in-out">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
          Welcome back
        </h1>
        <p className="text-sm text-gray-500">
          Enter your email to sign in to your account
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-4 mt-2">
          {/* Email Field */}
          <div className="space-y-2">
            <label
              className="text-sm font-medium leading-none text-gray-700"
              htmlFor="email"
            >
              Email
            </label>
            <div className="flex items-center h-[42px] w-full rounded-md border border-gray-200 bg-gray-50 focus-within:ring-1 focus-within:ring-gray-900 focus-within:border-gray-900 transition-all">
              <div className="pl-3 pr-2 flex items-center justify-center">
                <AtSign className="h-4 w-4 text-gray-400" />
              </div>
              <input
                id="email"
                type="email"
                placeholder="name@example.com"
                className="flex-1 bg-transparent py-2 pr-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-0 border-0 disabled:opacity-50"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                className="text-sm font-medium leading-none text-gray-700"
                htmlFor="password"
              >
                Password
              </label>
              <Link
                href="#"
                className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="flex items-center h-[42px] w-full rounded-md border border-gray-200 bg-gray-50 focus-within:ring-1 focus-within:ring-gray-900 focus-within:border-gray-900 transition-all">
              <div className="pl-3 pr-2 flex items-center justify-center">
                <Lock className="h-4 w-4 text-gray-400" />
              </div>
              <input
                id="password"
                type="password"
                placeholder="password"
                className="flex-1 bg-transparent py-2 pr-3 text-sm text-gray-800 focus:outline-none focus:ring-0 border-0 disabled:opacity-50"
                required
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="inline-flex items-center justify-center w-full h-11 rounded-md bg-gray-900 text-white font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-500">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <button
          onClick={() => handleOAuthLogin("google")}
          disabled={isLoading}
          type="button"
          className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-1 transition-all"
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
            <path d="M1 1h22v22H1z" fill="none" />
          </svg>
          Google
        </button>
      </div>

      <p className="px-8 text-center text-sm text-gray-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-gray-900 hover:underline"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
