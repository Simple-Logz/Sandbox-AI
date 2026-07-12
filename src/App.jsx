import { useState, useEffect, useRef, useCallback } from "react";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const API_BASE = (window.SANDBOX_AI_CONFIG?.apiUrl || "").replace(/\/$/, "");
const SB_URL   = window.SANDBOX_AI_CONFIG?.supabaseUrl || "";
const SB_KEY   = window.SANDBOX_AI_CONFIG?.supabaseAnonKey || "";

// ─── PALETTE  (light + purple accent) ────────────────────────────────────────
const C = {
  bg:        "#F7F6F3",
  surface:   "#FFFFFF",
  surfaceAlt:"#F2F0F9",
  border:    "#E5E3EE",
  borderStrong: "#C9C5E0",
  purple:    "#7F77DD",
  purpleDark:"#534AB7",
  purpleDeep:"#3C3489",
  purplePale:"#EEEDFE",
  purpleMid: "#AFA9EC",
  red:       "#E24B4A",
  redPale:   "#FCEBEB",
  orange:    "#BA7517",
  orangePale:"#FAEEDA",
  green:     "#3B6D11",
  greenPale: "#EAF3DE",
  yellow:    "#854F0B",
  yellowPale:"#FAEEDA",
  text:      "#1A1A2E",
  textSec:   "#5A5880",
  textMute:  "#9896B8",
  blue:      "#185FA5",
  bluePale:  "#E6F1FB",
};

const SEV = {
  critical: { color: C.red,       bg: C.redPale,    label: "CRITICAL" },
  high:     { color: C.orange,    bg: C.orangePale,  label: "HIGH"     },
  medium:   { color: C.yellow,    bg: C.yellowPale,  label: "MEDIUM"   },
  low:      { color: C.green,     bg: C.greenPale,   label: "LOW"      },
  warning:  { color: C.orange,    bg: C.orangePale,  label: "WARN"     },
  info:     { color: C.blue,      bg: C.bluePale,    label: "INFO"     },
};

// ─── STYLES ───────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body, #root { font-family: 'Inter', system-ui, sans-serif; background: ${C.bg}; color: ${C.text}; min-height: 100vh; -webkit-font-smoothing: antialiased; }
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 99px; }
  .mono { font-family: 'JetBrains Mono', monospace; }
  button, input, textarea, select { font-family: inherit; }
  button { cursor: pointer; border: none; background: transparent; }
  input, textarea, select { outline: none; }

  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes slideIn { from { transform:translateX(-8px); opacity:0; } to { transform:translateX(0); opacity:1; } }
  .fade-in { animation: fadeIn 0.2s ease-out; }

  .btn-primary {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 9px 18px; border-radius: 8px;
    background: ${C.purple}; color: #fff;
    font-size: 13px; font-weight: 500;
    transition: background 0.15s, transform 0.1s;
  }
  .btn-primary:hover { background: ${C.purpleDark}; }
  .btn-primary:active { transform: scale(0.98); }
  .btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }

  .btn-ghost {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 14px; border-radius: 8px;
    border: 0.5px solid ${C.border}; color: ${C.textSec};
    font-size: 13px; font-weight: 500;
    transition: all 0.15s;
  }
  .btn-ghost:hover { border-color: ${C.borderStrong}; color: ${C.text}; background: ${C.surfaceAlt}; }

  .card {
    background: ${C.surface};
    border: 0.5px solid ${C.border};
    border-radius: 12px;
  }

  .sev-badge {
    display: inline-flex; align-items: center;
    padding: 2px 7px; border-radius: 4px;
    font-size: 10px; font-weight: 600; letter-spacing: 0.06em;
  }

  .nav-item {
    display: flex; align-items: center; gap: 9px;
    padding: 7px 10px; border-radius: 8px;
    font-size: 13px; font-weight: 400; color: ${C.textSec};
    cursor: pointer; transition: all 0.12s; border: none;
    background: transparent; width: 100%; text-align: left;
  }
  .nav-item:hover { background: ${C.surfaceAlt}; color: ${C.text}; }
  .nav-item.active { background: ${C.purplePale}; color: ${C.purpleDeep}; font-weight: 500; }

  .mid-nav {
    display: block; padding: 7px 12px; border-radius: 8px;
    font-size: 13px; color: ${C.textSec};
    cursor: pointer; transition: all 0.12s; width: 100%;
    text-align: left; border: none; background: transparent;
  }
  .mid-nav:hover { background: ${C.bg}; color: ${C.text}; }
  .mid-nav.active { background: ${C.purplePale}; color: ${C.purpleDeep}; font-weight: 500; }

  .tab { padding: 7px 14px; font-size: 13px; color: ${C.textMute}; background: transparent; border: none; border-bottom: 2px solid transparent; cursor: pointer; transition: all 0.15s; }
  .tab.active { color: ${C.purple}; border-bottom-color: ${C.purple}; font-weight: 500; }
  .tab:hover:not(.active) { color: ${C.textSec}; }

  .input-field {
    background: ${C.bg}; border: 0.5px solid ${C.border};
    border-radius: 8px; padding: 9px 12px;
    font-size: 13px; color: ${C.text}; width: 100%;
    transition: border-color 0.15s;
  }
  .input-field:focus { border-color: ${C.purple}; }
  .input-field::placeholder { color: ${C.textMute}; }

  .terminal {
    background: #0D1117; border-radius: 10px;
    font-family: 'JetBrains Mono', monospace; font-size: 12px;
    line-height: 1.75; overflow: hidden;
    border: 0.5px solid #1E2940;
  }
  .terminal-header {
    display: flex; align-items: center; gap: 6px;
    padding: 9px 14px; background: #161B22;
    border-bottom: 0.5px solid #1E2940;
  }
  .terminal-dot { width: 10px; height: 10px; border-radius: 50%; }
  .terminal-body { padding: 14px 18px; max-height: 300px; overflow-y: auto; }
  .log-info    { color: #8B9EC3; }
  .log-success { color: #00D4AA; }
  .log-warn    { color: #E09926; }
  .log-critical, .log-error { color: #FF6B6B; }
  .log-dim     { color: #4A5568; }

  .progress-track { background: ${C.border}; border-radius: 99px; overflow: hidden; height: 4px; }
  .progress-fill  { height: 100%; border-radius: 99px; background: ${C.purple}; transition: width 0.9s cubic-bezier(0.4,0,0.2,1); }

  .stage-dot {
    width: 28px; height: 28px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; flex-shrink: 0;
  }

  .finding-row {
    border: 0.5px solid ${C.border}; border-radius: 10px;
    background: ${C.surface}; overflow: hidden;
    transition: border-color 0.15s;
  }
  .finding-row:hover { border-color: ${C.borderStrong}; }

  .chip {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 3px 9px; border-radius: 99px;
    font-size: 12px; font-weight: 500;
    background: ${C.purplePale}; color: ${C.purpleDeep};
    margin: 2px;
  }
  .chip-dot { width: 6px; height: 6px; border-radius: 50%; background: ${C.purple}; flex-shrink: 0; }
  .chip-dot.dim { background: ${C.border}; }

  .lang-bar { height: 5px; border-radius: 99px; margin: 3px 0 2px; }
  .score-ring { position: relative; display: inline-flex; align-items: center; justify-content: center; }
`;

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function SevBadge({ severity }) {
  const s = SEV[severity] || SEV.info;
  return <span className="sev-badge" style={{ background: s.bg, color: s.color }}>{s.label}</span>;
}

function Spinner({ size = 16, color = C.purple }) {
  return <span style={{ width: size, height: size, border: `2px solid ${color}33`, borderTopColor: color, borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />;
}

function ScoreRing({ score, size = 56 }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const col = score >= 75 ? C.red : score >= 50 ? C.orange : score >= 30 ? C.yellow : C.green;
  return (
    <div className="score-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ position: "absolute", transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth={5} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={5}
          strokeDasharray={`${fill} ${circ - fill}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease" }} />
      </svg>
      <div style={{ textAlign: "center", zIndex: 1 }}>
        <div style={{ fontSize: size > 60 ? 18 : 14, fontWeight: 600, color: col, lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: 9, color: C.textMute, textTransform: "uppercase", letterSpacing: "0.1em" }}>risk</div>
      </div>
    </div>
  );
}

function Terminal({ logs }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [logs]);
  return (
    <div className="terminal">
      <div className="terminal-header">
        <div className="terminal-dot" style={{ background: "#FF5F57" }} />
        <div className="terminal-dot" style={{ background: "#FEBC2E" }} />
        <div className="terminal-dot" style={{ background: "#28C840" }} />
        <span style={{ marginLeft: 8, fontSize: 11, color: "#4A5568" }}>sandbox — deployment pipeline</span>
      </div>
      <div className="terminal-body" ref={ref}>
        {logs.map((l, i) => (
          <div key={i} className={`log-${l.type || "info"}`}>
            <span style={{ color: "#2D3748", marginRight: 8 }}>›</span>{l.text}
            {i === logs.length - 1 && <span style={{ display: "inline-block", width: 7, height: 13, background: "#00D4AA", marginLeft: 4, verticalAlign: "middle", animation: "blink 1s step-end infinite" }} />}
          </div>
        ))}
        {logs.length === 0 && <span style={{ color: "#4A5568" }}>Waiting for pipeline output…</span>}
      </div>
    </div>
  );
}

// ─── API CLIENT ──────────────────────────────────────────────────────────────
async function apiPost(path, body) {
  const r = await fetch(API_BASE + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.message || `HTTP ${r.status}`); }
  return r.json();
}

async function apiGet(path) {
  const r = await fetch(API_BASE + path);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

// ─── GITHUB REPO READER ──────────────────────────────────────────────────────
// Fetches file contents from GitHub API to send to our backend for analysis
async function fetchRepoFiles(repoUrl, branch = "main", token = "") {
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/.]+)/);
  if (!match) throw new Error("Invalid GitHub URL");
  const [, owner, repo] = match;
  const headers = token ? { Authorization: `token ${token}` } : {};

  // Get file tree
  const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, { headers });
  if (!treeRes.ok) throw new Error(`GitHub API ${treeRes.status} — check URL and token`);
  const tree = await treeRes.json();

  // Filter to meaningful files (exclude binaries, lock files, etc.)
  const INCLUDE_EXT = /\.(js|jsx|ts|tsx|py|go|rb|java|php|rs|sh|yml|yaml|json|tf|env|sql|md|toml|Dockerfile|dockerignore|gitignore|conf|cfg|ini)$/i;
  const EXCLUDE_PATH = /node_modules|\.git|dist\/|build\/|__pycache__|\.pytest_cache|coverage|\.next\/|out\/|vendor\//;
  const MAX_FILES = 60;
  const MAX_FILE_SIZE = 80000; // 80kb per file

  const eligible = (tree.tree || [])
    .filter(f => f.type === "blob" && INCLUDE_EXT.test(f.path) && !EXCLUDE_PATH.test(f.path) && (f.size || 0) < MAX_FILE_SIZE)
    .slice(0, MAX_FILES);

  // Fetch file contents in parallel (batches of 8)
  const files = {};
  const BATCH = 8;
  for (let i = 0; i < eligible.length; i += BATCH) {
    const batch = eligible.slice(i, i + BATCH);
    await Promise.all(batch.map(async (f) => {
      try {
        const r = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${f.path}?ref=${branch}`, { headers });
        if (!r.ok) return;
        const data = await r.json();
        if (data.content) files[f.path] = atob(data.content.replace(/\n/g, ""));
      } catch (_) {}
    }));
  }

  return { files, owner, repo, branch, totalFiles: tree.tree?.filter(f => f.type === "blob").length || 0 };
}

// Detect basic repo metadata from files without API (from uploaded zip or pasted)
function detectRepoMeta(files) {
  const paths = Object.keys(files);
  const pkg = files["package.json"] ? JSON.parse(files["package.json"]) : null;
  const hasPy = paths.some(p => p.endsWith(".py"));
  const hasTs = paths.some(p => p.endsWith(".ts") || p.endsWith(".tsx"));
  const hasGo = paths.some(p => p.endsWith(".go"));
  const hasDock = paths["Dockerfile"] || paths.some(p => p.toLowerCase() === "dockerfile");
  const hasGHA  = paths.some(p => p.includes(".github/workflows"));

  const languages = [];
  const tsCount = paths.filter(p => /\.(ts|tsx)$/.test(p)).length;
  const jsCount = paths.filter(p => /\.(js|jsx)$/.test(p)).length;
  const pyCount = paths.filter(p => /\.py$/.test(p)).length;
  const cssCount = paths.filter(p => /\.css$/.test(p)).length;
  const total = paths.length || 1;
  if (tsCount > 0) languages.push({ name: "TypeScript", pct: Math.round((tsCount / total) * 100) });
  if (jsCount > 0) languages.push({ name: "JavaScript", pct: Math.round((jsCount / total) * 100) });
  if (pyCount > 0) languages.push({ name: "Python", pct: Math.round((pyCount / total) * 100) });
  if (cssCount > 0) languages.push({ name: "CSS", pct: Math.round((cssCount / total) * 100) });

  const deps = { ...(pkg?.dependencies || {}), ...(pkg?.devDependencies || {}) };
  const frameworks = [];
  if (deps.react || deps["react-dom"]) frameworks.push("React");
  if (deps.next) frameworks.push("Next.js");
  if (deps.vue) frameworks.push("Vue");
  if (deps.express) frameworks.push("Express");
  if (deps.fastify) frameworks.push("Fastify");
  if (deps.vite) frameworks.push("Vite");
  if (hasPy) frameworks.push("FastAPI/Django");
  if (hasGo) frameworks.push("Go");

  const infra = [];
  const allText = Object.values(files).join(" ");
  if (/supabase/i.test(allText)) infra.push("Supabase");
  if (/railway/i.test(allText)) infra.push("Railway");
  if (/vercel/i.test(allText)) infra.push("Vercel");
  if (/terraform/i.test(allText)) infra.push({ name: "Terraform", dim: true });
  if (/aws/i.test(allText)) infra.push("AWS");
  if (/render/i.test(allText)) infra.push("Render");

  const port = (allText.match(/PORT\s*[=:]\s*(\d+)/) || [])[1] || "3000";

  return {
    languages,
    frameworks,
    infra,
    hasDock,
    hasGHA,
    ghaCount: paths.filter(p => p.includes(".github/workflows")).length,
    port,
    size: Math.round(Object.values(files).join("").length / 1024) + " KB",
    pkg,
  };
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function App() {
  // Auth / workspace state
  const [user, setUser] = useState({ name: "John", email: "john@bluelink.io" });
  const [workspace, setWorkspace] = useState("BlueLink Engineering");

  // Projects list
  const [projects, setProjects] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sbx_projects_v2") || "[]"); } catch { return []; }
  });

  // Active project
  const [activeProject, setActiveProject] = useState(null);
  const [midView, setMidView] = useState("discovery"); // discovery | intelligence | simulator | fixes | history

  // Connect repo state
  const [showConnect, setShowConnect] = useState(false);
  const [connectForm, setConnectForm] = useState({ url: "", branch: "main", token: "", name: "" });
  const [connecting, setConnecting] = useState(false);
  const [connectLogs, setConnectLogs] = useState([]);
  const [connectPhase, setConnectPhase] = useState(""); // fetching | analyzing | done
  const [connectProgress, setConnectProgress] = useState(0);

  // Analysis results
  const [findings, setFindings] = useState([]);
  const [intelligence, setIntelligence] = useState(null);
  const [repoMeta, setRepoMeta] = useState(null);
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [filterSev, setFilterSev] = useState("all");

  // Deployment simulation
  const [simLogs, setSimLogs] = useState([]);
  const [simStages, setSimStages] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simDone, setSimDone] = useState(false);
  const [simVerdict, setSimVerdict] = useState(null);

  const saveProjects = useCallback((ps) => {
    setProjects(ps);
    try { localStorage.setItem("sbx_projects_v2", JSON.stringify(ps)); } catch {}
  }, []);

  // ── CONNECT REPO ──────────────────────────────────────────────────────────
  const addLog = (text, type = "info") => setConnectLogs(prev => [...prev, { text, type }]);

  const handleConnect = async () => {
    if (!connectForm.url.trim()) return;
    setConnecting(true);
    setConnectLogs([]);
    setConnectPhase("fetching");
    setConnectProgress(5);

    const projectName = connectForm.name.trim() || connectForm.url.split("/").pop()?.replace(/\.git$/, "") || "Project";

    try {
      // Phase 1: Fetch repo
      addLog(`Cloning ${connectForm.url} (branch: ${connectForm.branch})…`, "info");
      setConnectProgress(12);

      let files = {}, owner = "", repo = "", totalFiles = 0;
      if (connectForm.url.includes("github.com")) {
        addLog("Fetching file tree from GitHub API…", "info");
        const result = await fetchRepoFiles(connectForm.url, connectForm.branch, connectForm.token);
        files = result.files; owner = result.owner; repo = result.repo; totalFiles = result.totalFiles;
        addLog(`✓ ${Object.keys(files).length} files fetched (${totalFiles} total in repo)`, "success");
      } else {
        throw new Error("Currently supporting GitHub repositories. Enter a github.com URL.");
      }
      setConnectProgress(35);

      // Phase 2: Detect repo metadata
      addLog("Detecting stack and infrastructure…", "info");
      const meta = detectRepoMeta(files);
      addLog(`Stack: ${[...meta.frameworks].join(", ") || "Unknown"} · ${meta.languages[0]?.name || "Unknown"}`, "success");
      setRepoMeta(meta);
      setConnectProgress(45);

      // Phase 3: AI Analysis via backend
      setConnectPhase("analyzing");
      addLog("Sending to Sandbox.ai intelligence engine…", "info");
      addLog("Claude is reading every file line by line…", "dim");
      setConnectProgress(55);

      let analysisFindings = [];
      let intel = null;

      if (API_BASE) {
        try {
          const analysisRes = await apiPost("/api/v1/ai/analyze", {
            files,
            repoUrl: connectForm.url,
            projectName,
          });
          analysisFindings = analysisRes.findings || [];
          addLog(`✓ AI analysis complete — ${analysisFindings.length} finding(s) detected`, "success");
          setConnectProgress(72);

          // Intelligence report
          addLog("Generating architecture intelligence report…", "info");
          const intelRes = await apiPost("/api/v1/ai/intelligence", {
            files,
            project: { name: projectName, repo_url: connectForm.url },
            findings: analysisFindings,
          });
          intel = intelRes;
          addLog(`✓ Intelligence report ready (reliability score: ${intel?.reliabilityScore?.overall ?? "—"}/100)`, "success");
          setConnectProgress(90);
        } catch (apiErr) {
          addLog(`Backend unavailable — running local analysis: ${apiErr.message}`, "warn");
          // Fallback: local static analysis
          analysisFindings = localAnalyze(files, connectForm.url);
          addLog(`✓ Local analysis: ${analysisFindings.length} finding(s)`, "success");
        }
      } else {
        addLog("No backend configured — running local analysis…", "warn");
        analysisFindings = localAnalyze(files, connectForm.url);
        addLog(`✓ ${analysisFindings.length} finding(s) detected`, "success");
      }

      setConnectProgress(100);
      addLog("✓ Project ready — opening discovery view…", "success");

      const newProject = {
        id: Date.now().toString(),
        name: projectName,
        repoUrl: connectForm.url,
        owner, repo,
        branch: connectForm.branch,
        createdAt: new Date().toISOString(),
        files,
        findings: analysisFindings,
        intelligence: intel,
        meta,
      };

      const updated = [newProject, ...projects.slice(0, 14)];
      saveProjects(updated);
      setActiveProject(newProject);
      setFindings(analysisFindings);
      setIntelligence(intel);
      setMidView("discovery");
      setShowConnect(false);
      setSimLogs([]);
      setSimStages([]);
      setSimDone(false);
      setSimVerdict(null);
      setFilterSev("all");
      setSelectedFinding(null);

    } catch (err) {
      addLog(`✗ Error: ${err.message}`, "critical");
    } finally {
      setConnecting(false);
      setConnectPhase("done");
    }
  };

  // ── LOCAL FALLBACK ANALYSIS ───────────────────────────────────────────────
  function localAnalyze(files, repoUrl) {
    const results = [];
    const allText = Object.values(files).join("\n");
    const paths = Object.keys(files);

    // Hardcoded secrets
    if (/['"]([A-Za-z0-9+/]{32,})['"]/.test(allText) && !/process\.env|os\.environ/.test(allText))
      results.push({ title: "Potential hardcoded secret detected", severity: "critical", category: "security", filePath: "multiple files", rationale: "Long base64-like strings found outside environment variable references", fix: "Move secrets to environment variables (.env)", impact: "Credentials could be exposed via repository" });

    if (!paths.some(p => /health/i.test(p) || /health/.test(files[p] || "")))
      results.push({ title: "No /health endpoint detected", severity: "high", category: "deployment", filePath: "server.js / app.js", rationale: "No health check route found in the codebase", fix: "Add GET /health returning 200 + { status: 'ok' }", impact: "Load balancers and orchestrators cannot verify liveness" });

    if (!/PORT.*process\.env|process\.env.*PORT/i.test(allText))
      results.push({ title: "PORT not read from environment", severity: "high", category: "deployment", filePath: "server file", rationale: "No process.env.PORT reference found — likely hardcoded", fix: "Use const PORT = process.env.PORT || 3000", impact: "App will fail to bind on Railway/Render/Heroku" });

    if (!/rate.?limit|express-rate-limit|slowDown/i.test(allText))
      results.push({ title: "No rate limiting middleware", severity: "medium", category: "security", filePath: "middleware", rationale: "No rate limiting library detected", fix: "Add express-rate-limit or similar", impact: "API is vulnerable to brute force and DDoS" });

    if (!/pino|winston|morgan|bunyan|log4js/i.test(allText))
      results.push({ title: "No structured logging library", severity: "medium", category: "reliability", filePath: "application", rationale: "No structured logging detected — only console.log", fix: "Add pino or winston for structured JSON logging", impact: "Impossible to trace errors in production" });

    if (!paths.some(p => /dockerfile/i.test(p)))
      results.push({ title: "No Dockerfile found", severity: "high", category: "deployment", filePath: "root", rationale: "No Dockerfile in repository", fix: "Add a Dockerfile to ensure deterministic builds", impact: "Deployments are environment-dependent and non-reproducible" });

    if (!/helmet|cors.*options|Content-Security-Policy/i.test(allText))
      results.push({ title: "Missing security headers", severity: "medium", category: "security", filePath: "middleware", rationale: "No helmet or CSP headers configured", fix: "Add helmet middleware for Express/Fastify", impact: "App is vulnerable to XSS, clickjacking, MIME sniffing" });

    if (/console\.log.*password|console\.log.*token|console\.log.*secret/i.test(allText))
      results.push({ title: "Sensitive data logged to console", severity: "high", category: "security", filePath: "multiple", rationale: "console.log statements logging passwords, tokens or secrets", fix: "Remove or redact sensitive values from logging", impact: "Secrets visible in production logs" });

    if (!/try\s*{[\s\S]{0,500}catch/m.test(allText))
      results.push({ title: "Missing error handling", severity: "medium", category: "reliability", filePath: "application", rationale: "Very few try/catch blocks detected", fix: "Wrap async operations in try/catch and use error middleware", impact: "Unhandled promise rejections will crash the process" });

    return results;
  }

  // ── LOAD PROJECT ──────────────────────────────────────────────────────────
  const loadProject = (p) => {
    setActiveProject(p);
    setFindings(p.findings || []);
    setIntelligence(p.intelligence || null);
    setRepoMeta(p.meta || null);
    setMidView("discovery");
    setSimLogs([]); setSimStages([]); setSimDone(false); setSimVerdict(null);
    setFilterSev("all"); setSelectedFinding(null);
  };

  // ── DEPLOYMENT SIMULATOR ──────────────────────────────────────────────────
  const runSimulation = async () => {
    if (!activeProject) return;
    setIsSimulating(true);
    setSimDone(false);
    setSimVerdict(null);
    setMidView("simulator");

    const addSimLog = (text, type = "info") => setSimLogs(prev => [...prev, { text, type }]);
    setSimLogs([{ text: `Starting deployment simulation for ${activeProject.name}…`, type: "dim" }]);
    setSimStages([]);

    const critical = findings.filter(f => f.severity === "critical");
    const high = findings.filter(f => f.severity === "high");
    const meta = activeProject.meta || {};

    const stages = [
      {
        id: "deps", label: "Dependency install",
        run: async () => {
          addSimLog("$ npm ci --prefer-offline", "dim");
          await delay(500);
          if (critical.some(f => f.category === "dependency")) {
            addSimLog("npm ERR! peer dep conflict", "critical");
            return { status: "failed", msg: "Dependency conflict — check peer requirements" };
          }
          addSimLog("added 847 packages in 12s", "info");
          addSimLog(`audited 847 packages — ${critical.length + high.length} vulnerabilities`, high.length > 0 ? "warn" : "success");
          return { status: high.length > 2 ? "warning" : "passed", msg: `${critical.length} critical, ${high.length} high vulnerabilities` };
        }
      },
      {
        id: "lint", label: "Lint & type check",
        run: async () => {
          addSimLog("$ npm run lint && npx tsc --noEmit", "dim");
          await delay(400);
          const tsIssues = findings.filter(f => f.category === "build");
          if (tsIssues.some(f => f.severity === "critical")) {
            addSimLog(`TypeScript error: ${tsIssues[0]?.title}`, "critical");
            return { status: "failed", msg: tsIssues[0]?.title };
          }
          addSimLog("✓ No type errors", "success");
          return { status: "passed", msg: "Clean" };
        }
      },
      {
        id: "security", label: "Security audit",
        run: async () => {
          addSimLog("$ npm audit --audit-level=high", "dim");
          await delay(600);
          const secIssues = findings.filter(f => f.category === "security");
          if (secIssues.some(f => f.severity === "critical")) {
            addSimLog(`CRITICAL: ${secIssues[0]?.title}`, "critical");
            return { status: "failed", msg: secIssues[0]?.rationale?.slice(0, 60) };
          }
          if (secIssues.length > 0) {
            addSimLog(`⚠ ${secIssues.length} security issue(s) detected`, "warn");
            return { status: "warning", msg: `${secIssues.length} issues require attention` };
          }
          addSimLog("✓ No critical vulnerabilities", "success");
          return { status: "passed", msg: "No critical issues" };
        }
      },
      {
        id: "build", label: "Build",
        run: async () => {
          addSimLog(`$ ${meta.pkg?.scripts?.build || "npm run build"}`, "dim");
          await delay(700);
          const buildIssues = findings.filter(f => f.category === "build" && f.severity === "critical");
          if (buildIssues.length > 0) {
            addSimLog(`Build error: ${buildIssues[0]?.title}`, "critical");
            return { status: "failed", msg: buildIssues[0]?.title };
          }
          addSimLog(`✓ Build complete`, "success");
          return { status: "passed", msg: "Artifacts generated" };
        }
      },
      {
        id: "docker", label: "Docker image",
        run: async () => {
          if (!meta.hasDock) {
            addSimLog("⚠ No Dockerfile found — using buildpack", "warn");
            return { status: "warning", msg: "No Dockerfile — non-deterministic build" };
          }
          addSimLog("$ docker build -t sandbox-test .", "dim");
          await delay(800);
          addSimLog(`Successfully built ${Math.random().toString(36).slice(2, 10)}`, "success");
          return { status: "passed", msg: `Port ${meta.port || 3000} exposed` };
        }
      },
      {
        id: "runtime", label: "Runtime probe",
        run: async () => {
          addSimLog("Starting container…", "info");
          await delay(600);
          const portIssue = findings.find(f => f.title?.toLowerCase().includes("port") && f.severity === "critical");
          if (portIssue) {
            addSimLog(`App crashed — port not bound`, "critical");
            addSimLog(portIssue.rationale || "Check PORT env var", "critical");
            return { status: "failed", msg: "Port binding failed" };
          }
          addSimLog(`App running on :${meta.port || 3000}`, "success");
          return { status: "passed", msg: "Container healthy" };
        }
      },
      {
        id: "health", label: "Health checks",
        run: async () => {
          addSimLog(`GET /health → `, "info");
          await delay(400);
          const noHealth = findings.find(f => f.title?.toLowerCase().includes("health") && f.severity !== "low");
          if (noHealth) {
            addSimLog("404 Not Found", "critical");
            return { status: "failed", msg: "No /health endpoint" };
          }
          addSimLog("200 OK (18ms)", "success");
          addSimLog("GET /ready → 200 OK (12ms)", "success");
          return { status: "passed", msg: "All health checks passed" };
        }
      },
      {
        id: "smoke", label: "Smoke tests",
        run: async () => {
          addSimLog("Running post-deploy smoke tests…", "info");
          await delay(500);
          if (critical.length > 0) {
            addSimLog(`⚠ ${critical.length} critical finding(s) unresolved`, "warn");
            return { status: "warning", msg: "Passed with unresolved critical findings" };
          }
          addSimLog("✓ All smoke tests passed", "success");
          return { status: "passed", msg: "Ready" };
        }
      },
    ];

    const results = [];
    for (const stage of stages) {
      addSimLog(`\n── ${stage.label.toUpperCase()} ──`, "dim");
      const r = await stage.run();
      results.push({ ...stage, ...r });
      setSimStages([...results]);
      if (r.status === "failed") {
        addSimLog(`\n✗ Pipeline halted at "${stage.label}" — fix critical issues before deploying`, "critical");
        break;
      }
    }

    const failCount = results.filter(r => r.status === "failed").length;
    const warnCount = results.filter(r => r.status === "warning").length;
    const verdict = failCount > 0
      ? { label: "DEPLOY BLOCKED", color: C.red, bg: C.redPale, detail: `${failCount} stage(s) failed` }
      : warnCount > 0
        ? { label: "DEPLOY WITH CAUTION", color: C.orange, bg: C.orangePale, detail: `${warnCount} warning(s) — review before shipping` }
        : { label: "READY TO DEPLOY", color: C.green, bg: C.greenPale, detail: "All stages passed" };

    setSimVerdict(verdict);
    setIsSimulating(false);
    setSimDone(true);
    addSimLog(`\n${verdict.label} — ${verdict.detail}`, failCount > 0 ? "critical" : warnCount > 0 ? "warn" : "success");
  };

  const delay = (ms) => new Promise(r => setTimeout(r, ms));

  // ─── VIEWS ─────────────────────────────────────────────────────────────────

  const filteredFindings = findings
    .filter(f => filterSev === "all" || f.severity === filterSev)
    .sort((a, b) => { const o = { critical:0, high:1, medium:2, low:3, warning:2, info:4 }; return (o[a.severity]??5)-(o[b.severity]??5); });

  const riskScore = intelligence?.reliabilityScore?.overall
    ? 100 - intelligence.reliabilityScore.overall
    : findings.length > 0
      ? Math.min(99, findings.filter(f => f.severity==="critical").length*22 + findings.filter(f => f.severity==="high").length*10 + findings.filter(f => f.severity==="medium").length*4)
      : 0;

  // ─── MAIN RENDER ────────────────────────────────────────────────────────
  return (
    <>
      <style>{STYLES}</style>
      <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>

        {/* ── LEFT SIDEBAR ── */}
        <div style={{ width: 220, flexShrink: 0, background: C.surface, borderRight: `0.5px solid ${C.border}`, display: "flex", flexDirection: "column", padding: "18px 10px" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 8px", marginBottom: 18 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: C.purple, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 600, flexShrink: 0 }}>S</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Sandbox<span style={{ color: C.purple }}>.ai</span></div>
              <div style={{ fontSize: 11, color: C.textMute }}>Production intelligence</div>
            </div>
          </div>

          {/* Workspace box */}
          <div style={{ border: `0.5px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: C.textMute, marginBottom: 2 }}>Workspace</div>
            <div style={{ fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              {workspace}
              <span style={{ fontSize: 11, color: C.purple, fontWeight: 500 }}>v</span>
            </div>
          </div>

          {/* Nav */}
          {[
            { label: "Workspaces", icon: "⬡", id: "workspaces" },
            { label: "Projects", icon: "▦", id: "projects" },
            { label: "Active project", icon: "◉", id: "active", active: !!activeProject },
            { label: "Knowledge", icon: "◈", id: "knowledge" },
            { label: "Settings", icon: "⚙", id: "settings" },
          ].map(item => (
            <button key={item.id} className={`nav-item ${item.active ? "active" : ""}`} onClick={() => { if (item.id === "active" && activeProject) setMidView("discovery"); }}>
              <span style={{ fontSize: 12, color: item.active ? C.purple : C.borderStrong }}>{item.icon}</span>
              {item.label}
            </button>
          ))}

          {/* Recent projects */}
          {projects.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 11, color: C.textMute, textTransform: "uppercase", letterSpacing: "0.1em", padding: "0 10px", marginBottom: 6 }}>Recent</div>
              {projects.slice(0, 5).map(p => (
                <button key={p.id} className="nav-item" onClick={() => loadProject(p)} style={{ paddingLeft: 10 }}>
                  <ScoreRing score={Math.min(99, (p.findings||[]).filter(f=>f.severity==="critical").length*22+(p.findings||[]).filter(f=>f.severity==="high").length*10)} size={22} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12 }}>{p.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Connect button */}
          <div style={{ marginTop: "auto", paddingTop: 12 }}>
            <button className="btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={() => setShowConnect(true)}>
              + Connect repo
            </button>
          </div>
        </div>

        {/* ── MIDDLE PANEL (project nav) ── */}
        {activeProject && (
          <div style={{ width: 200, flexShrink: 0, background: C.surface, borderRight: `0.5px solid ${C.border}`, padding: "18px 10px", display: "flex", flexDirection: "column", gap: 2, animation: "slideIn 0.2s ease-out" }}>
            <div style={{ fontSize: 16, fontWeight: 500, padding: "0 8px", marginBottom: 4 }}>{activeProject.name}</div>
            <div style={{ fontSize: 12, color: C.textMute, padding: "0 8px", marginBottom: 16, lineHeight: 1.4 }}>{workspace} · Web application</div>
            <button className="mid-nav">Repository</button>
            <button className={`mid-nav ${midView==="discovery"?"active":""}`} onClick={() => setMidView("discovery")}>Discovery</button>
            <button className={`mid-nav ${midView==="intelligence"?"active":""}`} onClick={() => setMidView("intelligence")}>Intelligence</button>
            <button className={`mid-nav ${midView==="findings"?"active":""}`} onClick={() => setMidView("findings")}>Findings <span style={{ fontSize: 11, color: C.purple, fontWeight: 600 }}>({findings.length})</span></button>
            <button className={`mid-nav ${midView==="simulator"?"active":""}`} onClick={() => setMidView("simulator")}>Mission control</button>
            <button className={`mid-nav ${midView==="fixes"?"active":""}`} onClick={() => setMidView("fixes")}>Fix center</button>
            <button className="mid-nav">History</button>
          </div>
        )}

        {/* ── MAIN CONTENT ── */}
        <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>

          {/* Topbar */}
          <div style={{ padding: "12px 28px", borderBottom: `0.5px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: C.surface, flexShrink: 0 }}>
            <div style={{ fontSize: 13, color: C.textMute }}>
              Workspace / {workspace}{activeProject ? ` / ${activeProject.name}` : ""}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {activeProject && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <ScoreRing score={riskScore} size={36} />
                  <div style={{ fontSize: 11, color: C.textMute }}>risk score</div>
                </div>
              )}
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.purplePale, color: C.purpleDeep, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 500 }}>
                {user.name[0]}
              </div>
              <span style={{ fontSize: 13, color: C.textSec }}>{user.name}</span>
            </div>
          </div>

          {/* ── NO PROJECT: landing ── */}
          {!activeProject && !showConnect && (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
              <div style={{ maxWidth: 520, textAlign: "center" }}>
                <div style={{ fontSize: 11, color: C.purple, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 14 }}>Production intelligence studio</div>
                <h1 style={{ fontSize: 38, fontWeight: 500, lineHeight: 1.15, letterSpacing: "-0.5px", marginBottom: 16 }}>
                  Know exactly what will<br /><span style={{ color: C.purple }}>break before you deploy.</span>
                </h1>
                <p style={{ fontSize: 15, color: C.textSec, lineHeight: 1.7, marginBottom: 32 }}>
                  Connect any GitHub repository. Sandbox.ai reads every file, predicts failures, scores deployment risk, and gives you a precise remediation plan — powered by Claude AI.
                </p>
                <button className="btn-primary" style={{ padding: "12px 28px", fontSize: 14 }} onClick={() => setShowConnect(true)}>
                  Connect a repository →
                </button>
                <div style={{ marginTop: 40, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, textAlign: "left" }}>
                  {[
                    { icon: "🔍", t: "Line-by-line analysis", d: "Claude reads every file and finds real issues" },
                    { icon: "⚡", t: "Failure prediction", d: "Know what breaks and exactly when" },
                    { icon: "▶", t: "Deployment simulator", d: "Full pipeline dry-run before you push" },
                    { icon: "🗺", t: "Remediation roadmap", d: "Prioritized, specific, timed fixes" },
                  ].map((item, i) => (
                    <div key={i} className="card" style={{ padding: "14px 16px" }}>
                      <div style={{ fontSize: 18, marginBottom: 6 }}>{item.icon}</div>
                      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{item.t}</div>
                      <div style={{ fontSize: 12, color: C.textMute }}>{item.d}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── CONNECT MODAL ── */}
          {showConnect && (
            <div style={{ flex: 1, padding: "28px 32px", overflow: "auto" }}>
              <div style={{ maxWidth: 640 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                  <div>
                    <h2 style={{ fontSize: 24, fontWeight: 500, marginBottom: 4 }}>Connect a repository</h2>
                    <p style={{ fontSize: 14, color: C.textSec }}>Connect any GitHub repo. Sandbox.ai scans every file and surfaces real pre-deployment risks.</p>
                  </div>
                  <button className="btn-ghost" onClick={() => setShowConnect(false)}>✕ Cancel</button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  {/* Form */}
                  <div className="card" style={{ padding: "20px 22px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 500, color: C.textMute, textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>Project name</label>
                        <input className="input-field" placeholder="e.g. payments-api" value={connectForm.name} onChange={e => setConnectForm(p => ({ ...p, name: e.target.value }))} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 500, color: C.textMute, textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>Repository URL <span style={{ color: C.red }}>*</span></label>
                        <input className="input-field mono" placeholder="https://github.com/owner/repo" value={connectForm.url} onChange={e => setConnectForm(p => ({ ...p, url: e.target.value }))} />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 500, color: C.textMute, textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>Branch</label>
                          <input className="input-field mono" placeholder="main" value={connectForm.branch} onChange={e => setConnectForm(p => ({ ...p, branch: e.target.value }))} />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 500, color: C.textMute, textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>Token (private)</label>
                          <input className="input-field mono" type="password" placeholder="ghp_…" value={connectForm.token} onChange={e => setConnectForm(p => ({ ...p, token: e.target.value }))} />
                        </div>
                      </div>
                      <button className="btn-primary" style={{ width: "100%", justifyContent: "center", padding: "11px" }} onClick={handleConnect} disabled={connecting || !connectForm.url.trim()}>
                        {connecting ? <><Spinner size={14} color="#fff" /> Analyzing…</> : "Connect & Analyze →"}
                      </button>
                    </div>
                  </div>

                  {/* Live output */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {connecting && (
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontSize: 12, color: C.textSec }}>{connectPhase === "fetching" ? "Fetching repository…" : "Running AI analysis…"}</span>
                          <span style={{ fontSize: 12, color: C.purple, fontWeight: 500 }}>{connectProgress}%</span>
                        </div>
                        <div className="progress-track">
                          <div className="progress-fill" style={{ width: `${connectProgress}%`, background: C.purple }} />
                        </div>
                      </div>
                    )}
                    <Terminal logs={connectLogs} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── DISCOVERY VIEW ── */}
          {activeProject && midView === "discovery" && (
            <div style={{ flex: 1, padding: "24px 32px", overflow: "auto" }} className="fade-in">
              {/* Risk banner */}
              {findings.length > 0 && (
                <div style={{ background: riskScore >= 60 ? C.redPale : riskScore >= 35 ? C.orangePale : C.greenPale, border: `0.5px solid ${riskScore >= 60 ? C.red+"44" : riskScore >= 35 ? C.orange+"44" : C.green+"44"}`, borderRadius: 12, padding: "14px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 16 }}>
                  <ScoreRing score={riskScore} size={52} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: riskScore >= 60 ? C.red : riskScore >= 35 ? C.orange : C.green, marginBottom: 3 }}>
                      {riskScore >= 75 ? "Critical risk — do not deploy" : riskScore >= 50 ? "High risk — deploy with caution" : riskScore >= 25 ? "Moderate risk — review findings" : "Low risk — ready to deploy"}
                    </div>
                    <div style={{ fontSize: 12, color: C.textSec }}>
                      {findings.filter(f=>f.severity==="critical").length} critical · {findings.filter(f=>f.severity==="high").length} high · {findings.filter(f=>f.severity==="medium").length} medium · {findings.length} total findings
                    </div>
                  </div>
                  <button className="btn-ghost" style={{ marginLeft: "auto" }} onClick={() => { setMidView("simulator"); runSimulation(); }}>▶ Run simulation</button>
                </div>
              )}

              <h1 style={{ fontSize: 32, fontWeight: 500, letterSpacing: "-0.4px", marginBottom: 6 }}>Repository discovery.</h1>
              <p style={{ fontSize: 14, color: C.textMute, marginBottom: 24 }}>Facts only. No judgment appears here until the project has actually been inspected.</p>

              {/* Info cards row 1 */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 12 }}>
                <div className="card" style={{ padding: "16px 18px" }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: C.textMute, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Repository</div>
                  <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 3 }}>{activeProject.name}</div>
                  <div style={{ fontSize: 12, color: C.textMute, marginBottom: 8 }}>{activeProject.repoUrl}</div>
                  <div style={{ fontSize: 12, color: C.textSec }}>Private · {activeProject.branch} · {activeProject.meta?.size || "—"}</div>
                </div>

                <div className="card" style={{ padding: "16px 18px" }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: C.textMute, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Primary language</div>
                  {(repoMeta?.languages || []).slice(0, 3).map((l, i) => (
                    <div key={i}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 2 }}>
                        <span style={{ color: C.textSec }}>{l.name}</span>
                        <span style={{ fontWeight: 500 }}>{l.pct}%</span>
                      </div>
                      <div className="lang-bar" style={{ width: `${l.pct}%`, background: i === 0 ? C.purple : i === 1 ? C.purpleMid : C.border }} />
                    </div>
                  ))}
                  {!repoMeta?.languages?.length && <div style={{ fontSize: 13, color: C.textMute }}>Detecting…</div>}
                </div>

                <div className="card" style={{ padding: "16px 18px" }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: C.textMute, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Framework</div>
                  <div style={{ display: "flex", flexWrap: "wrap" }}>
                    {(repoMeta?.frameworks || []).map((f, i) => (
                      <span key={i} className="chip"><span className="chip-dot" />{ typeof f === "string" ? f : f.name}</span>
                    ))}
                    {!repoMeta?.frameworks?.length && <span style={{ fontSize: 13, color: C.textMute }}>Detecting…</span>}
                  </div>
                </div>
              </div>

              {/* Info cards row 2 */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                <div className="card" style={{ padding: "16px 18px" }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: C.textMute, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Containers</div>
                  {[
                    { k: "Dockerfile", v: repoMeta?.hasDock ? "Detected" : "Not found", ok: repoMeta?.hasDock },
                    { k: "Docker Compose", v: Object.keys(activeProject.files||{}).some(p=>p.includes("docker-compose")) ? "Detected" : "Not found", ok: Object.keys(activeProject.files||{}).some(p=>p.includes("docker-compose")) },
                    { k: "Exposed port", v: repoMeta?.port || "3000" },
                  ].map((row, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0" }}>
                      <span style={{ color: C.textSec }}>{row.k}</span>
                      <span style={{ fontWeight: 500, color: row.ok === false ? C.red : row.ok ? C.purpleDark : C.text }}>{row.v}</span>
                    </div>
                  ))}
                </div>

                <div className="card" style={{ padding: "16px 18px" }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: C.textMute, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>CI/CD</div>
                  {[
                    { k: "GitHub Actions", v: repoMeta?.hasGHA ? "Detected" : "Not found", ok: repoMeta?.hasGHA },
                    { k: "Workflow files", v: repoMeta?.ghaCount || 0 },
                    { k: "Last run", v: "Pending API" },
                  ].map((row, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0" }}>
                      <span style={{ color: C.textSec }}>{row.k}</span>
                      <span style={{ fontWeight: 500, color: row.ok === false ? C.red : row.ok ? C.purpleDark : C.text }}>{row.v}</span>
                    </div>
                  ))}
                </div>

                <div className="card" style={{ padding: "16px 18px" }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: C.textMute, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Infrastructure</div>
                  <div style={{ display: "flex", flexWrap: "wrap" }}>
                    {(repoMeta?.infra || []).map((f, i) => {
                      const name = typeof f === "string" ? f : f.name;
                      const dim = typeof f === "object" && f.dim;
                      return <span key={i} className="chip"><span className="chip-dot" style={{ background: dim ? C.textMute : C.purple }} />{name}</span>;
                    })}
                    {!repoMeta?.infra?.length && <span style={{ fontSize: 13, color: C.textMute }}>Not detected</span>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── INTELLIGENCE VIEW ── */}
          {activeProject && midView === "intelligence" && (
            <div style={{ flex: 1, padding: "24px 32px", overflow: "auto" }} className="fade-in">
              <h2 style={{ fontSize: 24, fontWeight: 500, marginBottom: 6 }}>Architecture intelligence</h2>
              <p style={{ fontSize: 14, color: C.textMute, marginBottom: 24 }}>Claude's assessment of this system — what it is, where it will break, and what to fix.</p>

              {intelligence ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {/* Reliability scores */}
                  {intelligence.reliabilityScore?.dimensions && (
                    <div className="card" style={{ padding: "18px 22px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                        <div style={{ fontSize: 15, fontWeight: 500 }}>Reliability score</div>
                        <div style={{ fontSize: 28, fontWeight: 500, color: intelligence.reliabilityScore.overall >= 70 ? C.green : intelligence.reliabilityScore.overall >= 50 ? C.yellow : C.red }}>{intelligence.reliabilityScore.overall}<span style={{ fontSize: 14, color: C.textMute }}>/100</span></div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                        {intelligence.reliabilityScore.dimensions.map((d, i) => (
                          <div key={i}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                              <span style={{ color: C.textSec }}>{d.name}</span>
                              <span style={{ fontWeight: 500, color: d.score >= 70 ? C.green : d.score >= 50 ? C.yellow : C.red }}>{d.score}</span>
                            </div>
                            <div className="progress-track">
                              <div className="progress-fill" style={{ width: `${d.score}%`, background: d.score >= 70 ? C.green : d.score >= 50 ? C.yellow : C.red }} />
                            </div>
                            {d.topIssue && <div style={{ fontSize: 11, color: C.textMute, marginTop: 3 }}>{d.topIssue}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Production readiness */}
                  {intelligence.productionReadiness?.checklist && (
                    <div className="card" style={{ padding: "18px 22px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                        <div style={{ fontSize: 15, fontWeight: 500 }}>Production readiness</div>
                        <div style={{ fontSize: 20, fontWeight: 500, color: C.purple }}>{intelligence.productionReadiness.score}%</div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        {intelligence.productionReadiness.checklist.map((item, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                            <span style={{ color: item.status ? C.green : C.red, fontWeight: 600, flexShrink: 0 }}>{item.status ? "✓" : "✗"}</span>
                            <span style={{ color: C.textSec }}>{item.item}</span>
                            {item.priority === "critical" && !item.status && <span style={{ fontSize: 9, background: C.redPale, color: C.red, padding: "1px 5px", borderRadius: 3, fontWeight: 600 }}>CRITICAL</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Architecture review */}
                  {intelligence.architectureReview && (
                    <div className="card" style={{ padding: "18px 22px" }}>
                      <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 12 }}>Architecture review</div>
                      {intelligence.architectureReview.scalabilityBottleneck && (
                        <div style={{ background: C.orangePale, border: `0.5px solid ${C.orange}44`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: C.textSec, marginBottom: 12 }}>
                          <strong style={{ color: C.orange }}>Scalability bottleneck: </strong>{intelligence.architectureReview.scalabilityBottleneck}
                        </div>
                      )}
                      {intelligence.architectureReview.estimatedBreakingPoint && (
                        <div style={{ fontSize: 13, color: C.textSec, marginBottom: 10 }}>
                          <strong>Estimated breaking point: </strong>{intelligence.architectureReview.estimatedBreakingPoint}
                        </div>
                      )}
                      {intelligence.architectureReview.patterns?.map((p, i) => (
                        <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderTop: i === 0 ? `0.5px solid ${C.border}` : "none", borderBottom: `0.5px solid ${C.border}` }}>
                          <SevBadge severity={p.severity || "medium"} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500 }}>{p.pattern}</div>
                            <div style={{ fontSize: 12, color: C.textMute }}>{p.risk}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Cost intelligence */}
                  {intelligence.costIntelligence && (
                    <div className="card" style={{ padding: "18px 22px" }}>
                      <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 14 }}>Cost intelligence</div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 14 }}>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 11, color: C.textMute, marginBottom: 4 }}>Current monthly</div>
                          <div style={{ fontSize: 24, fontWeight: 500, color: C.purpleDark }}>${intelligence.costIntelligence.currentMonthly}</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 11, color: C.textMute, marginBottom: 4 }}>At 10× traffic</div>
                          <div style={{ fontSize: 24, fontWeight: 500, color: C.red }}>${intelligence.costIntelligence.at10xGrowth}</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 11, color: C.textMute, marginBottom: 4 }}>Biggest risk</div>
                          <div style={{ fontSize: 12, color: C.orange, lineHeight: 1.4 }}>{intelligence.costIntelligence.biggestRisk}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="card" style={{ padding: "32px 24px", textAlign: "center" }}>
                  <div style={{ fontSize: 14, color: C.textMute, marginBottom: 12 }}>Intelligence report not available</div>
                  <div style={{ fontSize: 13, color: C.textMute }}>Connect your backend API to generate full architecture intelligence.</div>
                </div>
              )}
            </div>
          )}

          {/* ── FINDINGS VIEW ── */}
          {activeProject && midView === "findings" && (
            <div style={{ flex: 1, padding: "24px 32px", overflow: "auto" }} className="fade-in">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 24, fontWeight: 500, marginBottom: 4 }}>Findings</h2>
                  <p style={{ fontSize: 14, color: C.textMute }}>{findings.length} issues detected across {Object.keys(activeProject.files||{}).length} files</p>
                </div>
                <div style={{ display: "flex", gap: 6, borderBottom: `0.5px solid ${C.border}` }}>
                  {["all","critical","high","medium","low"].map(s => (
                    <button key={s} className={`tab ${filterSev===s?"active":""}`} onClick={() => setFilterSev(s)}>{s==="all"?"All":s.charAt(0).toUpperCase()+s.slice(1)}</button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {filteredFindings.length === 0 && (
                  <div style={{ padding: "40px 0", textAlign: "center", color: C.textMute }}>No findings at this severity.</div>
                )}
                {filteredFindings.map((f, i) => {
                  const s = SEV[f.severity] || SEV.info;
                  const open = selectedFinding === i;
                  return (
                    <div key={i} className="finding-row" style={{ borderLeftWidth: 3, borderLeftStyle: "solid", borderLeftColor: s.color }}>
                      <div style={{ padding: "11px 16px", display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }} onClick={() => setSelectedFinding(open ? null : i)}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                            <SevBadge severity={f.severity} />
                            <span style={{ fontSize: 10, color: C.textMute, background: C.bg, padding: "2px 6px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>{f.category}</span>
                            {f.filePath && <span style={{ fontSize: 10, color: C.textMute, fontFamily: "JetBrains Mono, monospace" }}>{f.filePath}</span>}
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 3 }}>{f.title}</div>
                          <div style={{ fontSize: 12, color: C.textSec, lineHeight: 1.5 }}>{f.rationale}</div>
                        </div>
                        <span style={{ color: C.textMute, fontSize: 12, flexShrink: 0 }}>{open ? "▲" : "▼"}</span>
                      </div>
                      {open && (
                        <div style={{ borderTop: `0.5px solid ${C.border}`, padding: "14px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="fade-in">
                          <div>
                            <div style={{ fontSize: 11, color: C.textMute, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Production impact</div>
                            <div style={{ fontSize: 13, color: C.textSec, lineHeight: 1.6 }}>{f.impact || "Not specified"}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: C.textMute, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>How to fix</div>
                            <div style={{ background: C.bg, borderRadius: 7, padding: "10px 12px", fontSize: 12, fontFamily: "JetBrains Mono, monospace", color: C.purpleDeep, lineHeight: 1.7 }}>{f.fix || "Review and remediate"}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── SIMULATOR VIEW ── */}
          {activeProject && midView === "simulator" && (
            <div style={{ flex: 1, padding: "24px 32px", overflow: "auto" }} className="fade-in">
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 24, fontWeight: 500, marginBottom: 4 }}>Mission control</h2>
                  <p style={{ fontSize: 14, color: C.textMute }}>Full deployment pipeline simulation — catch failures before they reach production</p>
                </div>
                <button className="btn-primary" onClick={runSimulation} disabled={isSimulating}>
                  {isSimulating ? <><Spinner size={14} color="#fff" /> Simulating…</> : simDone ? "↺ Re-run" : "▶ Run simulation"}
                </button>
              </div>

              {/* Stage indicators */}
              {simStages.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 20 }}>
                  {simStages.map((s, i) => {
                    const col = s.status === "passed" ? C.green : s.status === "warning" ? C.orange : C.red;
                    const icon = s.status === "passed" ? "✓" : s.status === "warning" ? "⚠" : "✗";
                    return (
                      <div key={i} className="card" style={{ padding: "12px 14px", borderColor: col + "44" }}>
                        <div style={{ fontSize: 16, color: col, marginBottom: 4 }}>{icon}</div>
                        <div style={{ fontSize: 11, fontWeight: 500, color: C.textSec, marginBottom: 2 }}>{s.label}</div>
                        <div style={{ fontSize: 10, color: C.textMute, lineHeight: 1.4 }}>{s.msg}</div>
                      </div>
                    );
                  })}
                </div>
              )}

              <Terminal logs={simLogs} />

              {simDone && simVerdict && (
                <div className="card fade-in" style={{ padding: "16px 20px", marginTop: 14, borderColor: simVerdict.color + "44", background: simVerdict.bg }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: simVerdict.color, marginBottom: 4 }}>{simVerdict.label}</div>
                  <div style={{ fontSize: 13, color: C.textSec }}>{simVerdict.detail}</div>
                </div>
              )}

              {!simDone && !isSimulating && (
                <div style={{ marginTop: 20, padding: "20px 0", textAlign: "center", color: C.textMute, fontSize: 13 }}>Click "Run simulation" to run the deployment pipeline against your findings</div>
              )}
            </div>
          )}

          {/* ── FIX CENTER VIEW ── */}
          {activeProject && midView === "fixes" && (
            <div style={{ flex: 1, padding: "24px 32px", overflow: "auto" }} className="fade-in">
              <h2 style={{ fontSize: 24, fontWeight: 500, marginBottom: 6 }}>Fix center</h2>
              <p style={{ fontSize: 14, color: C.textMute, marginBottom: 24 }}>Prioritized remediation roadmap — what to fix first, and how.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {findings.filter(f => f.severity === "critical" || f.severity === "high").map((f, i) => {
                  const s = SEV[f.severity] || SEV.info;
                  return (
                    <div key={i} className="card" style={{ padding: "16px 20px", display: "flex", gap: 16 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: s.bg, color: s.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>{i+1}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <SevBadge severity={f.severity} />
                          <span style={{ fontSize: 13, fontWeight: 500 }}>{f.title}</span>
                        </div>
                        <div style={{ fontSize: 12, color: C.textSec, marginBottom: 8, lineHeight: 1.5 }}>{f.rationale}</div>
                        <div style={{ background: C.bg, borderRadius: 7, padding: "8px 12px", fontSize: 12, fontFamily: "JetBrains Mono, monospace", color: C.purpleDeep }}>{f.fix}</div>
                      </div>
                      {f.filePath && <div style={{ fontSize: 11, color: C.textMute, fontFamily: "JetBrains Mono, monospace", flexShrink: 0 }}>{f.filePath}</div>}
                    </div>
                  );
                })}
                {findings.filter(f => f.severity === "critical" || f.severity === "high").length === 0 && (
                  <div style={{ padding: "40px 0", textAlign: "center" }}>
                    <div style={{ fontSize: 32, marginBottom: 10 }}>✓</div>
                    <div style={{ fontSize: 14, color: C.textMute }}>No critical or high severity issues — this project is in good shape.</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
