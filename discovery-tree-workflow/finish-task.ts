import * as jj from "../using-jj/src/jj.js";
import * as beads from "./src/beads.js";

await jj.setRepository({ repositoryPath: "/Users/zell/.claude/skills" });
await beads.setWorkspace({ workspacePath: "/Users/zell/.claude/skills" });

// Checkpoint the jj task
console.log("Checkpointing jj task...");
await jj.checkpoint({ summary: "Implemented showTask API with tests" });

// Close the beads task
console.log("Closing beads task skills-m6y...");
await beads.closeTask({
  taskId: "skills-m6y",
  reason: "Completed - added showTask API that returns full task details via bd show --json"
});

// Update parent epic with what was accomplished
console.log("Updating parent epic skills-u7w...");
await beads.updateTask({
  taskId: "skills-u7w",
  notes: "Completed showTask API: returns full task details (id, title, status, type, priority, description, timestamps) via bd show --json. All 17 tests passing."
});

// Finish the jj task
console.log("Finishing jj task...");
await jj.finishTask();

console.log("✓ Task complete!");
