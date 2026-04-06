"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:!bg-white group-[.toaster]:!text-zinc-950 group-[.toaster]:!border-zinc-200 group-[.toaster]:shadow-xl group-[.toaster]:rounded-xl font-medium",
          description: "group-[.toast]:!text-zinc-500",
          actionButton:
            "group-[.toast]:!bg-zinc-900 group-[.toast]:!text-zinc-50 group-[.toast]:rounded-lg",
          cancelButton:
            "group-[.toast]:!bg-zinc-100 group-[.toast]:!text-zinc-900 group-[.toast]:rounded-lg",
          success:
            "group-[.toast]:!bg-white group-[.toast]:!text-zinc-950 group-[.toast]:!border-emerald-100",
          error:
            "group-[.toast]:!bg-white group-[.toast]:!text-zinc-950 group-[.toast]:!border-red-100",
          info: "group-[.toast]:!bg-white group-[.toast]:!text-zinc-950 group-[.toast]:!border-blue-100",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
