/**
 * Categorize a GeekNews upvoted article into a top-level bucket.
 *
 * Two-tier system:
 *  - `category`: one of a small fixed set (used for top-nav chips)
 *  - `tags[]`:   zero or more fine-grained keyword tags (used for filtering / display)
 *
 * Strategy: regex over (title + description). Rules are ordered — first match wins.
 *
 * KEY GOTCHA: JavaScript regex `\b` (word boundary) only matches transitions
 * between ASCII word chars `[A-Za-z0-9_]` and non-word chars. Korean characters
 * are non-word in JS regex, so `\b승진\b` will NEVER match a pure-Korean string.
 *
 * Solution: each rule combines two sub-patterns:
 *   - ASCII keywords with `\b` boundaries
 *   - Korean keywords WITHOUT `\b` (plain substring with multi-char specificity)
 *
 * Tuning approach: rules currently cover ~86% of the ~2700 article corpus.
 * The remaining 14% genuinely need an LLM (mixed-topic essays, health, media,
 * etc) — see categorize_llm.py.
 */

export type Category =
  | "Show GN"
  | "AI · LLM"
  | "개발도구 · OSS"
  | "웹 · 인프라"
  | "데이터베이스"
  | "보안"
  | "에세이 · 의견"
  | "산업 · 커리어"
  | "기타";

interface Rule {
  re: RegExp;
  cat: Category;
}

// Order matters: more specific / higher-priority first.
const RULES: Rule[] = [
  // 1. Show GN — explicit prefix wins regardless of content
  { re: /^Show\s*GN\b/i, cat: "Show GN" },

  // 2. AI · LLM
  {
    re: new RegExp(
      [
        // ASCII (with \b)
        "\\b(AI|LLM|GPT|Claude|Codex|Gemini|Sonnet|Opus|Haiku|Anthropic|OpenAI|DeepMind|Mistral|Karpathy|MCP|RAG|agentic|prompt|inference|LangChain|LlamaIndex|Ollama|Hugging\\s*Face|nanochat|embedding|tokenizer|AGI|GenAI)\\b",
        // Korean (no \b)
        "(에이전트|프롬프트|모델|파인튜닝|바이브\\s*코딩|토크나이저|임베딩|추론|챗봇|언어\\s*모델|초거대|딥러닝|머신러닝|뉴럴넷|신경망|생성형)",
      ].join("|"),
      "i"
    ),
    cat: "AI · LLM",
  },

  // 3. Security
  {
    re: new RegExp(
      [
        "\\b(CVE|exploit|hacker|DRM|TLS|SSL|OAuth|JWT|XSS|CSRF|SQL\\s*injection|sandbox|anti.?bot|OSINT|malware|ransomware|phishing|0day|backdoor)\\b",
        "(보안|취약점|해킹|해커|암호화|패스워드|인증|샌드박스|봇\\s*차단|악성|랜섬웨어|피싱|뒷문|개인정보|프라이버시|유출)",
      ].join("|"),
      "i"
    ),
    cat: "보안",
  },

  // 4. Database
  {
    re: new RegExp(
      [
        "\\b(Postgres|PostgreSQL|MySQL|MariaDB|SQLite|MongoDB|Redis|Cassandra|DynamoDB|Snowflake|BigQuery|ClickHouse|DuckDB|SQL)\\b",
        "(데이터베이스|벡터\\s*DB|쿼리|인덱스|트랜잭션)",
      ].join("|"),
      "i"
    ),
    cat: "데이터베이스",
  },

  // 5. Web · Infra
  {
    re: new RegExp(
      [
        "\\b(Cloudflare|Vercel|AWS|GCP|Azure|Kubernetes|k8s|Docker|nginx|HTTP|HTTPS|WebSocket|Chrome|Firefox|Safari|Edge|CDN|Next\\.?js|React|Vue|Svelte|Astro|Vite|Webpack|Rust|Wasm|WebAssembly|Linux|macOS|Windows|iOS|Android|TypeScript|JavaScript|Node\\.?js|Deno|Bun|HTML|CSS|REST|GraphQL|API|gRPC|crawler|scraping|browser|serverless)\\b",
        "(컨테이너|크롤링|크롤러|브라우저|서버리스|네트워크|배포|클라우드|호스팅|웹\\s*개발|프론트엔드|백엔드|운영체제)",
      ].join("|"),
      "i"
    ),
    cat: "웹 · 인프라",
  },

  // 6. Dev tools / OSS
  {
    re: new RegExp(
      [
        "\\b(VS\\s*Code|JetBrains|Vim|Neovim|Emacs|tmux|git|GitHub|GitLab|CLI|compiler|debugger|framework|OSS|library|npm|yarn|pnpm|cargo|pip|homebrew|monorepo|linter|formatter)\\b",
        "(툴체인|컴파일러|디버거|프레임워크|오픈\\s*소스|라이브러리|패키지|개발도구|에디터|터미널|쉘)",
      ].join("|"),
      "i"
    ),
    cat: "개발도구 · OSS",
  },

  // 7. Industry / career
  {
    re: new RegExp(
      [
        "\\b(layoff|hiring|salary|promotion|IPO|acquisition|CEO|CTO|CFO|antitrust|lawsuit|Apple|Google|Meta|Amazon|Microsoft|Samsung|Nvidia|Tesla|Netflix)\\b",
        "(해고|채용|연봉|승진|이직|스톡옵션|투자|유치|상장|인수|매출|손익|규제|독점|소송|카카오|네이버|쿠팡|토스|당근|업무|취업|면접|커리어|일자리|고용|퇴사|이력서)",
      ].join("|"),
      "i"
    ),
    cat: "산업 · 커리어",
  },

  // 8. Essay / opinion — soft signal, last so other rules win for technical posts
  {
    re: new RegExp(
      [
        "\\b(why|how|lessons?|opinion|essay|reflection|thoughts|story|notes|history)\\b",
        "(시대|미래|준비|회고|단상|생각|에세이|철학|반성|성장|부채|성공|실패|이유|관점|의견|배움|배운|경험|이야기|문화|사회|역사|관찰|변화|끝났다|아닐까|마음|느낀|느낌)",
      ].join("|"),
      "i"
    ),
    cat: "에세이 · 의견",
  },
];

export interface CategorizeResult {
  category: Category;
  /** True if a rule matched — false means it fell through to "기타". */
  matched: boolean;
  /** Which rule index hit, for debugging. -1 if fell through. */
  ruleIndex: number;
}

/** Type guard for the persisted category field (set by categorize_llm.py). */
function hasPersistedCategory(a: any): a is { category: Category } {
  return typeof a?.category === "string" && (CATEGORIES as string[]).includes(a.category);
}

export function categorize(article: {
  title: string;
  description?: string | null;
  category?: string | null;
}): CategorizeResult {
  // 1. Trust persisted LLM-assigned category if present
  if (hasPersistedCategory(article)) {
    return { category: article.category, matched: true, ruleIndex: -2 };
  }
  // 2. Otherwise apply rules
  const haystack = `${article.title}\n${article.description ?? ""}`;
  for (let i = 0; i < RULES.length; i++) {
    if (RULES[i].re.test(haystack)) {
      return { category: RULES[i].cat, matched: true, ruleIndex: i };
    }
  }
  return { category: "기타", matched: false, ruleIndex: -1 };
}

/** All categories, in display order. */
export const CATEGORIES: Category[] = [
  "AI · LLM",
  "웹 · 인프라",
  "개발도구 · OSS",
  "에세이 · 의견",
  "산업 · 커리어",
  "보안",
  "데이터베이스",
  "Show GN",
  "기타",
];

/** Bulk-categorize and return counts. */
export function categorizeAll<T extends { title: string; description?: string | null }>(
  articles: T[]
): { items: (T & CategorizeResult)[]; counts: Record<Category, number> } {
  const counts = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<Category, number>;
  const items = articles.map((a) => {
    const r = categorize(a);
    counts[r.category]++;
    return { ...a, ...r };
  });
  return { items, counts };
}
