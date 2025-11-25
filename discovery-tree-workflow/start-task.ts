import * as jj from "../using-jj/src/jj.js";
import * as beads from "./src/beads.js";

// Set jj repository context
await jj.setRepository({ repositoryPath: "/Users/zell/.claude/skills" });

// Start jj task FIRST (before any file modifications)
console.log("Starting jj task...");
await jj.startTask({ description: "Implement showTask API for beads" });

// Now set beads workspace and claim the task
await beads.setWorkspace({ workspacePath: "/Users/zell/.claude/skills" });

console.log("Claiming beads task skills-m6y...");
await beads.updateTask({
  taskId: "skills-m6y",
  status: "in_progress"
});

console.log("✓ Task claimed, ready to implement showTask API");
