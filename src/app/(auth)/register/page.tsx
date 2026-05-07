"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Loader2, Camera, ArrowLeft, X } from "lucide-react";
import { signIn } from "next-auth/react";
import { getApiBaseUrl } from "@/lib/config";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [_avatarFile, setAvatarFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    if (!id || !(id in formData)) return;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      let fileToRead = file;

      // Support HEIC photos
      if (
        file.name.toLowerCase().endsWith(".heic") ||
        file.type === "image/heic" ||
        file.type === "image/heif"
      ) {
        setIsConverting(true);
        try {
          const heic2any = (await import("heic2any")).default;
          const result = await heic2any({
            blob: file,
            toType: "image/jpeg",
            quality: 0.7,
          });
          const blob = Array.isArray(result) ? result[0] : result;
          fileToRead = new File([blob], file.name.replace(/\.heic$/i, ".jpg"), {
            type: "image/jpeg",
          });
          setIsConverting(false);
        } catch (err: unknown) {
          // Log conversion error; use unknown instead of any

          console.error("HEIC conversion error:", err);
          setIsConverting(false);
          toast.error("Failed to process HEIC image");
          return;
        }
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
        setAvatarFile(fileToRead);
      };
      reader.readAsDataURL(fileToRead);
    }
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();

    // Manual validation to avoid default browser tooltips
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.username ||
      !formData.email ||
      !formData.password ||
      !formData.passwordConfirm
    ) {
      const errorMsg = "Please fill in all fields";
      toast.error(errorMsg);
      setError(errorMsg);
      return;
    }

    if (formData.password !== formData.passwordConfirm) {
      const errorMsg = "Passwords do not match";
      toast.error(errorMsg);
      setError(errorMsg);
      return;
    }
    setError(null);
    setStep(2);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const baseUrl = getApiBaseUrl();

    try {
      const payload = {
        email: formData.email,
        username: formData.username,
        password: formData.password,
        password_confirm: formData.passwordConfirm,
        first_name: formData.firstName,
        last_name: formData.lastName,
        avatar: avatarPreview, // Sends as base64 string
      };

      const response = await fetch(`${baseUrl}/api/auth/register/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        // Collect all possible errors from DRF response
        const messages = [];
        if (typeof data === "object") {
          for (const key in data) {
            messages.push(`${key}: ${data[key]}`);
          }
        }
        const errorMsg = messages.join(", ") || "Registration failed";
        throw new Error(errorMsg);
      }

      toast.success("Account created! Logging you in...");

      // Auto-login after registration
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error(
          "Registration successful, but auto-login failed. Please sign in manually."
        );
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        router.push("/");
      }
    } catch (err: unknown) {
      // Normalize unknown error to string message

      console.error("Registration error:", err);
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-in-out">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900 leading-tight">
          Create an account
        </h1>
        <p className="text-sm text-gray-500">
          {step === 1
            ? "Enter your details below to get started"
            : "Personalize your profile"}
        </p>
      </div>

      {step === 1 ? (
        <form onSubmit={handleNextStep} className="space-y-4" noValidate>
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
                value={formData.firstName || ""}
                onChange={handleInputChange}
                className={`flex h-[42px] w-full rounded-md border ${error ? "border-red-500" : "border-gray-200"} bg-transparent px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-all disabled:opacity-50`}
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
                value={formData.lastName || ""}
                onChange={handleInputChange}
                className={`flex h-[42px] w-full rounded-md border ${error ? "border-red-500" : "border-gray-200"} bg-transparent px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-all disabled:opacity-50`}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium leading-none text-gray-700"
              htmlFor="username"
            >
              Username
            </label>
            <div
              className={`flex items-center h-[42px] w-full rounded-md border ${error ? "border-red-500" : "border-gray-200"} bg-transparent focus-within:ring-1 focus-within:ring-gray-900 focus-within:border-gray-900 transition-all`}
            >
              <div className="pl-3 pr-2 flex items-center justify-center">
                <User className="h-4 w-4 text-gray-400" />
              </div>
              <input
                id="username"
                type="text"
                placeholder="johndoe"
                value={formData.username || ""}
                onChange={handleInputChange}
                className="flex-1 bg-transparent py-2 pr-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none border-none shadow-none focus:ring-0 disabled:opacity-50"
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
            <div
              className={`flex items-center h-[42px] w-full rounded-md border ${error ? "border-red-500" : "border-gray-200"} bg-transparent focus-within:ring-1 focus-within:ring-gray-900 focus-within:border-gray-900 transition-all`}
            >
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
                value={formData.email || ""}
                onChange={handleInputChange}
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
            <div
              className={`flex items-center h-[42px] w-full rounded-md border ${error ? "border-red-500" : "border-gray-200"} bg-transparent focus-within:ring-1 focus-within:ring-gray-900 focus-within:border-gray-900 transition-all`}
            >
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
                value={formData.password || ""}
                onChange={handleInputChange}
                className="flex-1 bg-transparent py-2 pr-3 text-sm text-gray-800 focus:outline-none border-none shadow-none focus:ring-0 disabled:opacity-50"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium leading-none text-gray-700"
              htmlFor="passwordConfirm"
            >
              Repeat Password
            </label>
            <div
              className={`flex items-center h-[42px] w-full rounded-md border ${error ? "border-red-500" : "border-gray-200"} bg-transparent focus-within:ring-1 focus-within:ring-gray-900 focus-within:border-gray-900 transition-all`}
            >
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
                id="passwordConfirm"
                type="password"
                value={formData.passwordConfirm || ""}
                onChange={handleInputChange}
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
          noValidate
        >
          {/* Avatar Upload */}
          <div className="flex flex-col items-center justify-center space-y-4 py-6">
            <div className="relative group">
              <div
                className={`h-24 w-24 rounded-full flex items-center justify-center border-2 border-dashed ${avatarPreview ? "border-transparent" : "border-gray-300 bg-gray-50 hover:bg-gray-100"} overflow-hidden transition-all duration-200 shadow-sm relative`}
              >
                {isConverting ? (
                  <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
                ) : avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-10 w-10 text-gray-400 group-hover:scale-110 transition-transform" />
                )}

                {!isConverting && (
                  <label
                    htmlFor="avatar-upload"
                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Camera className="h-6 w-6 text-white" />
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                      disabled={isLoading}
                    />
                  </label>
                )}
              </div>

              {/* Remove button */}
              {avatarPreview && !isConverting && (
                <button
                  type="button"
                  onClick={() => setAvatarPreview(null)}
                  className="absolute -top-1 -right-1 bg-white border border-gray-200 text-gray-500 rounded-full p-1 shadow-sm hover:bg-red-50 hover:text-red-500 transition-all z-10"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
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
