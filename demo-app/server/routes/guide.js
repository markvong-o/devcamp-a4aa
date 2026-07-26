import { Router } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// `id` must match the real filename (minus .md) in lab-guide/ exactly --
// this is what resolves the file on disk below. `module` is the internal
// checkable-step id consumed by ModuleChecks.jsx / ProgressTracker.jsx and
// is intentionally one behind the file's own number prefix, since
// "00-introduction" has no automated check. `title` shows the file's own
// number prefix so what's displayed here matches what the lab guide file
// itself is called.
export const LABS = [
  { id: "overview",                                                    title: "Overview",                        module: null },
  { id: "00-introduction",                                             title: "Introduction",                    module: null },
  { id: "01-prerequisites",                                            title: "Module 01: Prerequisites",        module: "00" },
  { id: "02-one-trust-boundary-for-every-agent",                       title: "Module 02: Auth for MCP",         module: "01" },
  { id: "03-every-agent-action-has-an-owner",                         title: "Module 03: User Authentication",  module: "02" },
  { id: "04-the-agent-acts-as-the-employee,-not-a-shared-bot",        title: "Module 04: Token Vault",          module: "03" },
  { id: "05-humans-approve-what-can't-be-undone",                     title: "Module 05: CIBA",                 module: "04" },
  { id: "06-access-that-knows-where-it-ends",                         title: "Module 06: FGA",                  module: "05" },
  { id: "07-putting-it-all-together",                                 title: "Module 07: End-to-End",           module: "06" },
  { id: "99-conclusion",                                               title: "Conclusion",                      module: null },
];

function getLabGuidePath() {
  const candidates = [
    path.resolve(process.cwd(), "lab-guide"),
    path.resolve(process.cwd(), "../lab-guide"),
    path.resolve(__dirname, "../../lab-guide"),
    path.resolve(__dirname, "../../../lab-guide"),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(dir)) return dir;
  }
  return candidates[1];
}

router.get("/api/guide", (_req, res) => {
  res.json({ labs: LABS });
});

router.get("/api/guide/:labId", (req, res) => {
  const { labId } = req.params;
  const lab = LABS.find((l) => l.id === labId);
  if (!lab) return res.status(404).json({ error: "Lab not found" });

  const guideDir = getLabGuidePath();
  const filePath = path.join(guideDir, `${labId}.md`);

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    res.json({ id: lab.id, title: lab.title, module: lab.module, content });
  } catch {
    res.status(404).json({ error: `Lab guide file not found: ${labId}.md` });
  }
});

export default router;
