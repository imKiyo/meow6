const { spawn } = require("child_process");
const path = require("path");

const AI_SERVICE_PATH = path.join(__dirname, "../../ai-service");
const PYTHON_PATH = path.join(AI_SERVICE_PATH, "venv/bin/python");
const TAGGER_SCRIPT = path.join(AI_SERVICE_PATH, "tagger.py");

async function generateTags(gifPath) {
  console.log("AI Tagger called with:", gifPath);
  console.log("Python path:", PYTHON_PATH);
  console.log("Script path:", TAGGER_SCRIPT);

  return new Promise((resolve, reject) => {
    const process = spawn(PYTHON_PATH, [TAGGER_SCRIPT, gifPath]);

    // ... rest of code

    let stdout = "";
    let stderr = "";

    process.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    process.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    process.on("close", (code) => {
      if (code !== 0) {
        console.error("AI Tagger error:", stderr);
        reject(new Error("AI tagging failed"));
        return;
      }

      try {
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (e) {
        reject(new Error("Failed to parse AI tagger output"));
      }
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      process.kill();
      reject(new Error("AI tagging timeout"));
    }, 30000);
  });
}

module.exports = { generateTags };
