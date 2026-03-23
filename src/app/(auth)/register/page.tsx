"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Loader2, Camera, ArrowLeft } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call to Django backend for registration
    setTimeout(() => {
      setIsLoading(false);
      // Redirect to dashboard on success
      router.push("/");
    }, 1500);
  };

  return (
    <div className="w-full flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-in-out">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
          Create an account
        </h1>
        <p className="text-sm text-gray-500">
          {step === 1
            ? "Enter your details below to get started"
            : "Personalize your profile"}
        </p>
      </div>

      {step === 1 ? (
        <form onSubmit={handleNextStep} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label
                className="text-sm font-medium leading-none text-gray-700"
                htmlFor="firstName"
              >
                First name
              </label>
              <input
                id="firstName"
                type="text"
                placeholder="John"
                className="flex h-[42px] w-full rounded-md border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-all disabled:opacity-50"
                required
              />
            </div>
            <div className="space-y-2">
              <label
                className="text-sm font-medium leading-none text-gray-700"
                htmlFor="lastName"
              >
                Last name
              </label>
              <input
                id="lastName"
                type="text"
                placeholder="Doe"
                className="flex h-[42px] w-full rounded-md border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-all disabled:opacity-50"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium leading-none text-gray-700"
              htmlFor="email"
            >
              Email address
            </label>
            <div className="flex items-center h-[42px] w-full rounded-md border border-gray-200 bg-transparent focus-within:ring-1 focus-within:ring-gray-900 focus-within:border-gray-900 transition-all">
              <div className="pl-3 pr-2 flex items-center justify-center">
                <svg
                  className="h-4 w-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                  />
                </svg>
              </div>
              <input
                id="email"
                type="email"
                placeholder="name@example.com"
                className="flex-1 bg-transparent py-2 pr-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none border-none shadow-none focus:ring-0 disabled:opacity-50"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium leading-none text-gray-700"
              htmlFor="password"
            >
              Password
            </label>
            <div className="flex items-center h-[42px] w-full rounded-md border border-gray-200 bg-transparent focus-within:ring-1 focus-within:ring-gray-900 focus-within:border-gray-900 transition-all">
              <div className="pl-3 pr-2 flex items-center justify-center">
                <svg
                  className="h-4 w-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <input
                id="password"
                type="password"
                className="flex-1 bg-transparent py-2 pr-3 text-sm text-gray-800 focus:outline-none border-none shadow-none focus:ring-0 disabled:opacity-50"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium leading-none text-gray-700"
              htmlFor="confirmPassword"
            >
              Repeat Password
            </label>
            <div className="flex items-center h-[42px] w-full rounded-md border border-gray-200 bg-transparent focus-within:ring-1 focus-within:ring-gray-900 focus-within:border-gray-900 transition-all">
              <div className="pl-3 pr-2 flex items-center justify-center">
                <svg
                  className="h-4 w-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <input
                id="confirmPassword"
                type="password"
                className="flex-1 bg-transparent py-2 pr-3 text-sm text-gray-800 focus:outline-none border-none shadow-none focus:ring-0 disabled:opacity-50"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="inline-flex items-center justify-center w-full h-[42px] rounded-md bg-[#111827] text-white font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 mt-2 transition-all"
          >
            Next Step
          </button>
        </form>
      ) : (
        <form
          onSubmit={onSubmit}
          className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300"
        >
          {/* Avatar Upload */}
          <div className="flex flex-col items-center justify-center space-y-4 py-6">
            <div className="relative group cursor-pointer">
              <div
                className={`h-24 w-24 rounded-full flex items-center justify-center border-2 border-dashed ${avatarPreview ? "border-transparent" : "border-gray-300 bg-gray-50 group-hover:bg-gray-100"} overflow-hidden transition-all duration-200 shadow-sm relative`}
              >
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-10 w-10 text-gray-400 group-hover:scale-110 transition-transform" />
                )}
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              </div>
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleAvatarChange}
                disabled={isLoading}
              />
            </div>
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-900">
                Profile Photo
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Upload an image to personalize your account.
              </p>
            </div>
          </div>

          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center justify-center h-[42px] rounded-md border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all disabled:opacity-50"
              disabled={isLoading}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </button>
            <button
              type="submit"
              className="flex-1 inline-flex items-center justify-center h-[42px] rounded-md bg-[#111827] text-white font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                "Complete Registration"
              )}
            </button>
          </div>
        </form>
      )}

      <p className="px-8 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-gray-900 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
