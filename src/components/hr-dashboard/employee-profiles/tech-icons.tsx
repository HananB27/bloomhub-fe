import type { ComponentType } from "react";
import {
  SiReact,
  SiAngular,
  SiVuedotjs,
  SiTypescript,
  SiJavascript,
  SiPython,
  SiDjango,
  SiNodedotjs,
  SiNextdotjs,
  SiPostgresql,
  SiDocker,
  SiTailwindcss,
  SiGraphql,
  SiRedis,
  SiGit,
  SiKotlin,
  SiFlutter,
  SiSwift,
  SiMongodb,
  SiMysql,
  SiRust,
  SiGo,
  SiKubernetes,
  SiDotnet,
} from "react-icons/si";
import { FaJava, FaAws } from "react-icons/fa";
import { TbBrandCSharp } from "react-icons/tb";
import { Code } from "lucide-react";

const DEFAULT_ICON_SIZE = 20;

interface TechIconConfig {
  Icon: ComponentType<{ size?: number; style?: React.CSSProperties }>;
  hex: string;
  bg: string;
  border: string;
}

const TECH_ICON_MAP: Record<string, TechIconConfig> = {
  react: {
    Icon: SiReact,
    hex: "#61dafb",
    bg: "bg-cyan-50",
    border: "border-cyan-200",
  },
  angular: {
    Icon: SiAngular,
    hex: "#dd0031",
    bg: "bg-red-50",
    border: "border-red-200",
  },
  "vue.js": {
    Icon: SiVuedotjs,
    hex: "#4fc08d",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  vue: {
    Icon: SiVuedotjs,
    hex: "#4fc08d",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  typescript: {
    Icon: SiTypescript,
    hex: "#3178c6",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  javascript: {
    Icon: SiJavascript,
    hex: "#f7df1e",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
  },
  python: {
    Icon: SiPython,
    hex: "#3776ab",
    bg: "bg-sky-50",
    border: "border-sky-200",
  },
  django: {
    Icon: SiDjango,
    hex: "#092e20",
    bg: "bg-green-50",
    border: "border-green-200",
  },
  "node.js": {
    Icon: SiNodedotjs,
    hex: "#5fa04e",
    bg: "bg-green-50",
    border: "border-green-200",
  },
  nodejs: {
    Icon: SiNodedotjs,
    hex: "#5fa04e",
    bg: "bg-green-50",
    border: "border-green-200",
  },
  "next.js": {
    Icon: SiNextdotjs,
    hex: "#000000",
    bg: "bg-gray-100",
    border: "border-gray-300",
  },
  nextjs: {
    Icon: SiNextdotjs,
    hex: "#000000",
    bg: "bg-gray-100",
    border: "border-gray-300",
  },
  postgresql: {
    Icon: SiPostgresql,
    hex: "#4169e1",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
  },
  docker: {
    Icon: SiDocker,
    hex: "#2496ed",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  aws: {
    Icon: FaAws,
    hex: "#ff9900",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  "tailwind css": {
    Icon: SiTailwindcss,
    hex: "#06b6d4",
    bg: "bg-cyan-50",
    border: "border-cyan-200",
  },
  tailwind: {
    Icon: SiTailwindcss,
    hex: "#06b6d4",
    bg: "bg-cyan-50",
    border: "border-cyan-200",
  },
  graphql: {
    Icon: SiGraphql,
    hex: "#e10098",
    bg: "bg-pink-50",
    border: "border-pink-200",
  },
  redis: {
    Icon: SiRedis,
    hex: "#dc382d",
    bg: "bg-red-50",
    border: "border-red-200",
  },
  git: {
    Icon: SiGit,
    hex: "#f05032",
    bg: "bg-orange-50",
    border: "border-orange-200",
  },
  java: {
    Icon: FaJava,
    hex: "#e11d48",
    bg: "bg-red-50",
    border: "border-red-200",
  },
  "c#": {
    Icon: TbBrandCSharp,
    hex: "#512bd4",
    bg: "bg-purple-50",
    border: "border-purple-200",
  },
  ".net": {
    Icon: SiDotnet,
    hex: "#512bd4",
    bg: "bg-violet-50",
    border: "border-violet-200",
  },
  rust: {
    Icon: SiRust,
    hex: "#000000",
    bg: "bg-orange-50",
    border: "border-orange-200",
  },
  go: {
    Icon: SiGo,
    hex: "#00add8",
    bg: "bg-cyan-50",
    border: "border-cyan-200",
  },
  kubernetes: {
    Icon: SiKubernetes,
    hex: "#326ce5",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  flutter: {
    Icon: SiFlutter,
    hex: "#02569b",
    bg: "bg-sky-50",
    border: "border-sky-200",
  },
  swift: {
    Icon: SiSwift,
    hex: "#f05138",
    bg: "bg-orange-50",
    border: "border-orange-200",
  },
  kotlin: {
    Icon: SiKotlin,
    hex: "#7f52ff",
    bg: "bg-violet-50",
    border: "border-violet-200",
  },
  mysql: {
    Icon: SiMysql,
    hex: "#4479a1",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  mongodb: {
    Icon: SiMongodb,
    hex: "#47a248",
    bg: "bg-green-50",
    border: "border-green-200",
  },
};

const DEFAULT_CONFIG: TechIconConfig = {
  Icon: Code as ComponentType<{ size?: number; style?: React.CSSProperties }>,
  hex: "#6b7280",
  bg: "bg-gray-50",
  border: "border-gray-200",
};

export function getTechIconConfig(tagName: string): TechIconConfig {
  return TECH_ICON_MAP[tagName.toLowerCase()] ?? DEFAULT_CONFIG;
}

export function TechIcon({
  name,
  size = DEFAULT_ICON_SIZE,
}: {
  name: string;
  size?: number;
}) {
  const config = getTechIconConfig(name);
  return (
    <span
      style={{
        color: config.hex,
        display: "inline-flex",
        alignItems: "center",
        flexShrink: 0,
      }}
    >
      <config.Icon
        size={size}
        style={{ minWidth: size, minHeight: size, flexShrink: 0 }}
      />
    </span>
  );
}
