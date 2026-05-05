const path = require("node:path");
const os = require("node:os");
const { spawn, spawnSync } = require("node:child_process");

const repoRoot = path.resolve(__dirname, "..", "..");
const openUrl = "http://localhost:5173/";
const logFile = path.join(os.tmpdir(), "site-survey-server.log");

function detectPnpmCmd() {
  const whereResult = spawnSync("where", ["pnpm.cmd"], {
    encoding: "utf8",
    shell: true,
  });

  if (whereResult.status === 0 && whereResult.stdout) {
    const firstPath = whereResult.stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean);
    if (firstPath) return firstPath;
  }

  return path.join(process.env.APPDATA || "", "npm", "pnpm.cmd");
}

const pnpmCmd = detectPnpmCmd();

const installAndRun = [
  `cd /d "${repoRoot}"`,
  `echo [SiteSurvey] Starting server at %DATE% %TIME% > "${logFile}"`,
  `if not exist "${pnpmCmd}" (echo [SiteSurvey] ERROR: pnpm.cmd not found at ${pnpmCmd} >> "${logFile}" & exit /b 1)`,
  'set "CI=true"',
  `echo [SiteSurvey] Running pnpm install... >> "${logFile}"`,
  `"${pnpmCmd}" install >> "${logFile}" 2>&1`,
  'set "PORT=5173"',
  'set "BASE_PATH=/"',
  `echo [SiteSurvey] Starting Vite dev server... >> "${logFile}"`,
  `"${pnpmCmd}" --filter @workspace/site-survey run dev >> "${logFile}" 2>&1`,
].join(" && ");

// Start the Vite server in a detached hidden cmd process.
spawn("cmd.exe", ["/c", installAndRun], {
  cwd: repoRoot,
  detached: true,
  windowsHide: true,
  stdio: "ignore",
}).unref();

// Open the site shortly after startup from a separate process.
spawn("cmd.exe", ["/c", `timeout /t 4 >nul && start "" "${openUrl}"`], {
  cwd: repoRoot,
  detached: true,
  windowsHide: true,
  stdio: "ignore",
}).unref();
