/**
 * Global tech catalogue — keyed by lowercase canonical name with aliases.
 * Brand metadata drives the `<TechBadge>` logo + theme. The `slug` matches
 * simple-icons (https://simpleicons.org) so logos render as branded SVGs via
 * `https://cdn.simpleicons.org/<slug>/<hex>`. Hex is the brand colour without
 * the `#` and also drives the chip's tinted bg + border.
 */
export interface TechBrand {
  slug: string;
  hex: string;
  /** Canonical display name. */
  name: string;
}

// One entry per canonical brand — keep keys sorted alphabetically per group.
const CANONICAL: TechBrand[] = [
  // ─── Frontend frameworks / libs ──────────────────────────────────────────
  { name: "React", slug: "react", hex: "61DAFB" },
  { name: "React Native", slug: "react", hex: "61DAFB" },
  { name: "Angular", slug: "angular", hex: "DD0031" },
  { name: "Vue.js", slug: "vuedotjs", hex: "4FC08D" },
  { name: "Nuxt", slug: "nuxtdotjs", hex: "00DC82" },
  { name: "Svelte", slug: "svelte", hex: "FF3E00" },
  { name: "SvelteKit", slug: "svelte", hex: "FF3E00" },
  { name: "Solid", slug: "solid", hex: "2C4F7C" },
  { name: "Qwik", slug: "qwik", hex: "AC7EF4" },
  { name: "Astro", slug: "astro", hex: "BC52EE" },
  { name: "Remix", slug: "remix", hex: "000000" },
  { name: "Next.js", slug: "nextdotjs", hex: "000000" },
  { name: "Gatsby", slug: "gatsby", hex: "663399" },
  { name: "Ember", slug: "emberdotjs", hex: "E04E39" },
  { name: "Alpine.js", slug: "alpinedotjs", hex: "8BC0D0" },
  { name: "Lit", slug: "lit", hex: "324FFF" },
  { name: "Preact", slug: "preact", hex: "673AB8" },
  { name: "Stimulus", slug: "stimulus", hex: "77E8B9" },
  { name: "Storybook", slug: "storybook", hex: "FF4785" },

  // ─── Styling / UI ────────────────────────────────────────────────────────
  { name: "Tailwind CSS", slug: "tailwindcss", hex: "06B6D4" },
  { name: "CSS", slug: "css", hex: "663399" },
  { name: "Sass", slug: "sass", hex: "CC6699" },
  { name: "Less", slug: "less", hex: "1D365D" },
  { name: "Bootstrap", slug: "bootstrap", hex: "7952B3" },
  { name: "Material UI", slug: "mui", hex: "007FFF" },
  { name: "Chakra UI", slug: "chakraui", hex: "319795" },
  { name: "Radix UI", slug: "radixui", hex: "161618" },
  { name: "shadcn/ui", slug: "shadcnui", hex: "000000" },
  { name: "Bulma", slug: "bulma", hex: "00D1B2" },
  { name: "Styled Components", slug: "styledcomponents", hex: "DB7093" },
  { name: "Emotion", slug: "emotion", hex: "DB7093" },

  // ─── Languages ───────────────────────────────────────────────────────────
  { name: "TypeScript", slug: "typescript", hex: "3178C6" },
  { name: "JavaScript", slug: "javascript", hex: "F7DF1E" },
  { name: "HTML", slug: "html5", hex: "E34F26" },
  { name: "Python", slug: "python", hex: "3776AB" },
  { name: "Ruby", slug: "ruby", hex: "CC342D" },
  { name: "Go", slug: "go", hex: "00ADD8" },
  { name: "Rust", slug: "rust", hex: "000000" },
  { name: "Java", slug: "openjdk", hex: "ED8B00" },
  { name: "Kotlin", slug: "kotlin", hex: "7F52FF" },
  { name: "Swift", slug: "swift", hex: "F05138" },
  { name: "C", slug: "c", hex: "A8B9CC" },
  { name: "C++", slug: "cplusplus", hex: "00599C" },
  { name: "C#", slug: "csharp", hex: "239120" },
  { name: ".NET", slug: "dotnet", hex: "512BD4" },
  { name: "PHP", slug: "php", hex: "777BB4" },
  { name: "Scala", slug: "scala", hex: "DC322F" },
  { name: "Dart", slug: "dart", hex: "0175C2" },
  { name: "Elixir", slug: "elixir", hex: "4B275F" },
  { name: "Erlang", slug: "erlang", hex: "A90533" },
  { name: "Haskell", slug: "haskell", hex: "5D4F85" },
  { name: "Clojure", slug: "clojure", hex: "5881D8" },
  { name: "F#", slug: "fsharp", hex: "378BBA" },
  { name: "Lua", slug: "lua", hex: "2C2D72" },
  { name: "R", slug: "r", hex: "276DC3" },
  { name: "Julia", slug: "julia", hex: "9558B2" },
  { name: "Perl", slug: "perl", hex: "39457E" },
  { name: "Bash", slug: "gnubash", hex: "4EAA25" },
  { name: "PowerShell", slug: "powershell", hex: "5391FE" },
  { name: "Solidity", slug: "solidity", hex: "363636" },
  { name: "GraphQL", slug: "graphql", hex: "E10098" },
  { name: "WebAssembly", slug: "webassembly", hex: "654FF0" },

  // ─── Backend frameworks ──────────────────────────────────────────────────
  { name: "Node.js", slug: "nodedotjs", hex: "5FA04E" },
  { name: "Deno", slug: "deno", hex: "000000" },
  { name: "Bun", slug: "bun", hex: "FBF0DF" },
  { name: "Express", slug: "express", hex: "000000" },
  { name: "NestJS", slug: "nestjs", hex: "E0234E" },
  { name: "Fastify", slug: "fastify", hex: "000000" },
  { name: "Django", slug: "django", hex: "092E20" },
  { name: "Flask", slug: "flask", hex: "000000" },
  { name: "FastAPI", slug: "fastapi", hex: "009688" },
  { name: "Spring", slug: "spring", hex: "6DB33F" },
  { name: "Spring Boot", slug: "springboot", hex: "6DB33F" },
  { name: "Quarkus", slug: "quarkus", hex: "4695EB" },
  { name: "Rails", slug: "rubyonrails", hex: "D30001" },
  { name: "Laravel", slug: "laravel", hex: "FF2D20" },
  { name: "Symfony", slug: "symfony", hex: "000000" },
  { name: "Phoenix", slug: "phoenixframework", hex: "FD4F00" },
  { name: "ASP.NET", slug: "dotnet", hex: "512BD4" },
  { name: "Gin", slug: "gin", hex: "00ADD8" },
  { name: "Actix", slug: "actix", hex: "000000" },
  { name: "Rocket", slug: "rust", hex: "000000" },
  { name: "Strapi", slug: "strapi", hex: "4945FF" },
  { name: "tRPC", slug: "trpc", hex: "2596BE" },
  { name: "Hasura", slug: "hasura", hex: "1EB4D4" },
  { name: "Apollo", slug: "apollographql", hex: "311C87" },
  { name: "Prisma", slug: "prisma", hex: "2D3748" },
  { name: "Drizzle", slug: "drizzle", hex: "C5F74F" },
  { name: "Sequelize", slug: "sequelize", hex: "52B0E7" },
  { name: "TypeORM", slug: "typeorm", hex: "FE0902" },

  // ─── Databases ────────────────────────────────────────────────────────────
  { name: "PostgreSQL", slug: "postgresql", hex: "4169E1" },
  { name: "MySQL", slug: "mysql", hex: "4479A1" },
  { name: "MariaDB", slug: "mariadb", hex: "003545" },
  { name: "SQLite", slug: "sqlite", hex: "003B57" },
  { name: "Microsoft SQL Server", slug: "microsoftsqlserver", hex: "CC2927" },
  { name: "Oracle", slug: "oracle", hex: "F80000" },
  { name: "MongoDB", slug: "mongodb", hex: "47A248" },
  { name: "Redis", slug: "redis", hex: "FF4438" },
  { name: "Elasticsearch", slug: "elasticsearch", hex: "005571" },
  { name: "OpenSearch", slug: "opensearch", hex: "005EB8" },
  { name: "Cassandra", slug: "apachecassandra", hex: "1287B1" },
  { name: "DynamoDB", slug: "amazondynamodb", hex: "4053D6" },
  { name: "CockroachDB", slug: "cockroachlabs", hex: "6933FF" },
  { name: "Neo4j", slug: "neo4j", hex: "008CC1" },
  { name: "InfluxDB", slug: "influxdb", hex: "22ADF6" },
  { name: "Snowflake", slug: "snowflake", hex: "29B5E8" },
  { name: "BigQuery", slug: "googlebigquery", hex: "669DF6" },
  { name: "Databricks", slug: "databricks", hex: "FF3621" },
  { name: "Supabase", slug: "supabase", hex: "3FCF8E" },
  { name: "Firebase", slug: "firebase", hex: "DD2C00" },
  { name: "PlanetScale", slug: "planetscale", hex: "000000" },
  { name: "Couchbase", slug: "couchbase", hex: "EA2328" },

  // ─── Mobile ───────────────────────────────────────────────────────────────
  { name: "iOS", slug: "ios", hex: "000000" },
  { name: "Android", slug: "android", hex: "34A853" },
  { name: "Flutter", slug: "flutter", hex: "02569B" },
  { name: "Expo", slug: "expo", hex: "000020" },
  { name: "Ionic", slug: "ionic", hex: "3880FF" },
  { name: "Capacitor", slug: "capacitor", hex: "119EFF" },

  // ─── Cloud / infra ────────────────────────────────────────────────────────
  { name: "AWS", slug: "amazonwebservices", hex: "FF9900" },
  { name: "GCP", slug: "googlecloud", hex: "4285F4" },
  { name: "Azure", slug: "microsoftazure", hex: "0078D4" },
  { name: "DigitalOcean", slug: "digitalocean", hex: "0080FF" },
  { name: "Heroku", slug: "heroku", hex: "430098" },
  { name: "Vercel", slug: "vercel", hex: "000000" },
  { name: "Netlify", slug: "netlify", hex: "00C7B7" },
  { name: "Cloudflare", slug: "cloudflare", hex: "F38020" },
  { name: "Linode", slug: "linode", hex: "00A95C" },
  { name: "Render", slug: "render", hex: "46E3B7" },
  { name: "Fly.io", slug: "flydotio", hex: "24175B" },
  { name: "Railway", slug: "railway", hex: "0B0D0E" },

  // ─── DevOps / CI / IaC ────────────────────────────────────────────────────
  { name: "Docker", slug: "docker", hex: "2496ED" },
  { name: "Kubernetes", slug: "kubernetes", hex: "326CE5" },
  { name: "Helm", slug: "helm", hex: "0F1689" },
  { name: "Terraform", slug: "terraform", hex: "844FBA" },
  { name: "Pulumi", slug: "pulumi", hex: "8A3391" },
  { name: "Ansible", slug: "ansible", hex: "EE0000" },
  { name: "Vagrant", slug: "vagrant", hex: "1868F2" },
  { name: "Packer", slug: "packer", hex: "02A8EF" },
  { name: "Nginx", slug: "nginx", hex: "009639" },
  { name: "Apache", slug: "apache", hex: "D22128" },
  { name: "Caddy", slug: "caddy", hex: "1F88C0" },
  { name: "Traefik", slug: "traefikproxy", hex: "24A1C1" },
  { name: "HAProxy", slug: "haproxy", hex: "106DA9" },
  { name: "Consul", slug: "consul", hex: "F24C53" },
  { name: "Vault", slug: "vault", hex: "FFEC6E" },
  { name: "Nomad", slug: "nomad", hex: "00CA8E" },

  // ─── CI / CD ──────────────────────────────────────────────────────────────
  { name: "GitHub Actions", slug: "githubactions", hex: "2088FF" },
  { name: "GitLab CI", slug: "gitlab", hex: "FC6D26" },
  { name: "CircleCI", slug: "circleci", hex: "343434" },
  { name: "Jenkins", slug: "jenkins", hex: "D24939" },
  { name: "Travis CI", slug: "travisci", hex: "3EAAAF" },
  { name: "Bitbucket Pipelines", slug: "bitbucket", hex: "0052CC" },
  { name: "ArgoCD", slug: "argo", hex: "EF7B4D" },
  { name: "TeamCity", slug: "teamcity", hex: "000000" },
  { name: "Buildkite", slug: "buildkite", hex: "14CC80" },

  // ─── Source control / collab ──────────────────────────────────────────────
  { name: "Git", slug: "git", hex: "F05032" },
  { name: "GitHub", slug: "github", hex: "181717" },
  { name: "GitLab", slug: "gitlab", hex: "FC6D26" },
  { name: "Bitbucket", slug: "bitbucket", hex: "0052CC" },

  // ─── Observability ────────────────────────────────────────────────────────
  { name: "Prometheus", slug: "prometheus", hex: "E6522C" },
  { name: "Grafana", slug: "grafana", hex: "F46800" },
  { name: "Datadog", slug: "datadog", hex: "632CA6" },
  { name: "New Relic", slug: "newrelic", hex: "008C99" },
  { name: "Sentry", slug: "sentry", hex: "362D59" },
  { name: "Splunk", slug: "splunk", hex: "000000" },
  { name: "OpenTelemetry", slug: "opentelemetry", hex: "000000" },
  { name: "Jaeger", slug: "jaeger", hex: "66CFE3" },
  { name: "PagerDuty", slug: "pagerduty", hex: "06AC38" },

  // ─── Messaging / streaming ────────────────────────────────────────────────
  { name: "Kafka", slug: "apachekafka", hex: "231F20" },
  { name: "RabbitMQ", slug: "rabbitmq", hex: "FF6600" },
  { name: "NATS", slug: "natsdotio", hex: "27AAE1" },
  { name: "MQTT", slug: "mqtt", hex: "660066" },
  { name: "Pulsar", slug: "apachepulsar", hex: "188FFF" },
  { name: "ActiveMQ", slug: "apache", hex: "D22128" },

  // ─── Data / ML ────────────────────────────────────────────────────────────
  { name: "Pandas", slug: "pandas", hex: "150458" },
  { name: "NumPy", slug: "numpy", hex: "013243" },
  { name: "SciPy", slug: "scipy", hex: "8CAAE6" },
  { name: "scikit-learn", slug: "scikitlearn", hex: "F7931E" },
  { name: "TensorFlow", slug: "tensorflow", hex: "FF6F00" },
  { name: "PyTorch", slug: "pytorch", hex: "EE4C2C" },
  { name: "Keras", slug: "keras", hex: "D00000" },
  { name: "Hugging Face", slug: "huggingface", hex: "FFD21E" },
  { name: "OpenAI", slug: "openai", hex: "412991" },
  { name: "Anthropic", slug: "anthropic", hex: "191919" },
  { name: "LangChain", slug: "langchain", hex: "1C3C3C" },
  { name: "MLflow", slug: "mlflow", hex: "0194E2" },
  { name: "Apache Spark", slug: "apachespark", hex: "E25A1C" },
  { name: "Apache Airflow", slug: "apacheairflow", hex: "017CEE" },
  { name: "dbt", slug: "dbt", hex: "FF694B" },
  { name: "Looker", slug: "looker", hex: "4285F4" },
  { name: "Tableau", slug: "tableau", hex: "E97627" },
  { name: "Power BI", slug: "powerbi", hex: "F2C811" },
  { name: "Jupyter", slug: "jupyter", hex: "F37626" },
  { name: "Streamlit", slug: "streamlit", hex: "FF4B4B" },

  // ─── Testing ──────────────────────────────────────────────────────────────
  { name: "Jest", slug: "jest", hex: "C21325" },
  { name: "Vitest", slug: "vitest", hex: "6E9F18" },
  { name: "Mocha", slug: "mocha", hex: "8D6748" },
  { name: "Cypress", slug: "cypress", hex: "69D3A7" },
  { name: "Playwright", slug: "playwright", hex: "2EAD33" },
  { name: "Puppeteer", slug: "puppeteer", hex: "40B5A4" },
  { name: "Selenium", slug: "selenium", hex: "43B02A" },
  { name: "Testing Library", slug: "testinglibrary", hex: "E33332" },
  { name: "Pytest", slug: "pytest", hex: "0A9EDC" },

  // ─── Build tools / package managers ───────────────────────────────────────
  { name: "npm", slug: "npm", hex: "CB3837" },
  { name: "Yarn", slug: "yarn", hex: "2C8EBB" },
  { name: "pnpm", slug: "pnpm", hex: "F69220" },
  { name: "Vite", slug: "vite", hex: "646CFF" },
  { name: "Webpack", slug: "webpack", hex: "8DD6F9" },
  { name: "Rollup", slug: "rollupdotjs", hex: "EC4A3F" },
  { name: "esbuild", slug: "esbuild", hex: "FFCF00" },
  { name: "Turborepo", slug: "turborepo", hex: "EF4444" },
  { name: "Nx", slug: "nx", hex: "143055" },
  { name: "Babel", slug: "babel", hex: "F9DC3E" },
  { name: "Gradle", slug: "gradle", hex: "02303A" },
  { name: "Maven", slug: "apachemaven", hex: "C71A36" },
  { name: "Cargo", slug: "rust", hex: "000000" },
  { name: "Poetry", slug: "poetry", hex: "60A5FA" },

  // ─── Design / collab ──────────────────────────────────────────────────────
  { name: "Figma", slug: "figma", hex: "F24E1E" },
  { name: "Sketch", slug: "sketch", hex: "F7B500" },
  { name: "Adobe XD", slug: "adobexd", hex: "FF61F6" },
  { name: "Notion", slug: "notion", hex: "000000" },
  { name: "Jira", slug: "jira", hex: "0052CC" },
  { name: "Linear", slug: "linear", hex: "5E6AD2" },
  { name: "Slack", slug: "slack", hex: "4A154B" },

  // ─── CMS / commerce ───────────────────────────────────────────────────────
  { name: "WordPress", slug: "wordpress", hex: "21759B" },
  { name: "Shopify", slug: "shopify", hex: "7AB55C" },
  { name: "Sanity", slug: "sanity", hex: "F03E2F" },
  { name: "Contentful", slug: "contentful", hex: "2478CC" },
  { name: "Strapi", slug: "strapi", hex: "4945FF" },
  { name: "Ghost", slug: "ghost", hex: "15171A" },

  // ─── Payments ─────────────────────────────────────────────────────────────
  { name: "Stripe", slug: "stripe", hex: "635BFF" },
  { name: "PayPal", slug: "paypal", hex: "00457C" },
  { name: "Square", slug: "square", hex: "000000" },

  // ─── Misc dev tools ───────────────────────────────────────────────────────
  { name: "VS Code", slug: "visualstudiocode", hex: "007ACC" },
  { name: "IntelliJ IDEA", slug: "intellijidea", hex: "000000" },
  { name: "Postman", slug: "postman", hex: "FF6C37" },
  { name: "Insomnia", slug: "insomnia", hex: "4000BF" },
  { name: "Swagger", slug: "swagger", hex: "85EA2D" },
  { name: "OpenAPI", slug: "openapiinitiative", hex: "6BA539" },
  { name: "gRPC", slug: "trpc", hex: "2596BE" },
  { name: "Salesforce", slug: "salesforce", hex: "00A1E0" },
  { name: "MuleSoft", slug: "mulesoft", hex: "00A0DF" },

  // ─── Web3 ─────────────────────────────────────────────────────────────────
  { name: "Ethereum", slug: "ethereum", hex: "3C3C3D" },
  { name: "Bitcoin", slug: "bitcoin", hex: "F7931A" },
  { name: "IPFS", slug: "ipfs", hex: "65C2CB" },
];

/** Aliases → canonical name (lowercase). */
const ALIASES: Record<string, string> = {
  reactjs: "react",
  rn: "react native",
  vue: "vue.js",
  vuejs: "vue.js",
  "nuxt.js": "nuxt",
  nuxtjs: "nuxt",
  nextjs: "next.js",
  next: "next.js",
  nodejs: "node.js",
  node: "node.js",
  ts: "typescript",
  js: "javascript",
  py: "python",
  golang: "go",
  csharp: "c#",
  cpp: "c++",
  cplusplus: "c++",
  dotnet: ".net",
  tailwind: "tailwind css",
  tailwindcss: "tailwind css",
  mui: "material ui",
  styledcomponents: "styled components",
  postgres: "postgresql",
  pg: "postgresql",
  mssql: "microsoft sql server",
  sqlserver: "microsoft sql server",
  dynamo: "dynamodb",
  es: "elasticsearch",
  elastic: "elasticsearch",
  gcs: "gcp",
  "google cloud": "gcp",
  k8s: "kubernetes",
  tf: "terraform",
  gh: "github",
  "github action": "github actions",
  "gitlab ci/cd": "gitlab ci",
  prom: "prometheus",
  ddog: "datadog",
  scikit: "scikit-learn",
  sklearn: "scikit-learn",
  tf2: "tensorflow",
  pytorch2: "pytorch",
  hf: "hugging face",
  spark: "apache spark",
  airflow: "apache airflow",
  pbi: "power bi",
  rtl: "testing library",
  rn0: "react native",
  shadcn: "shadcn/ui",
  rails: "rails",
  ror: "rails",
  laravelphp: "laravel",
  fastapi3: "fastapi",
  springboot: "spring boot",
  yarnpkg: "yarn",
  swc: "esbuild",
  webpack5: "webpack",
};

// Build lookup map (lowercased canonical names → brand).
const BY_KEY: Record<string, TechBrand> = {};
for (const b of CANONICAL) BY_KEY[b.name.toLowerCase()] = b;

export function getTechBrand(name: string): TechBrand | null {
  if (!name) return null;
  const key = name.toLowerCase().trim();
  if (BY_KEY[key]) return BY_KEY[key];
  const aliased = ALIASES[key];
  if (aliased && BY_KEY[aliased]) return BY_KEY[aliased];
  return null;
}

export function techLogoUrl(brand: TechBrand): string {
  return `https://cdn.simpleicons.org/${brand.slug}/${brand.hex}`;
}

/** Stable hash → hue for unknown tags. */
function hashHue(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0;
  }
  return h % 360;
}

export function fallbackTechColor(name: string): {
  bg: string;
  fg: string;
  border: string;
} {
  const hue = hashHue(name);
  return {
    bg: `hsl(${hue}, 80%, 96%)`,
    fg: `hsl(${hue}, 70%, 32%)`,
    border: `hsl(${hue}, 65%, 86%)`,
  };
}

/** Full canonical catalogue — for pickers / search. */
export const TECH_CATALOG: TechBrand[] = CANONICAL;

/** Substring search across name + slug + aliases. */
export function searchTech(query: string, limit = 20): TechBrand[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const out: TechBrand[] = [];
  const seen = new Set<string>();
  for (const b of CANONICAL) {
    if (b.name.toLowerCase().includes(q)) {
      out.push(b);
      seen.add(b.name);
      if (out.length >= limit) return out;
    }
  }
  for (const [alias, canonical] of Object.entries(ALIASES)) {
    if (out.length >= limit) break;
    if (!alias.includes(q)) continue;
    const b = BY_KEY[canonical];
    if (b && !seen.has(b.name)) {
      out.push(b);
      seen.add(b.name);
    }
  }
  return out;
}
