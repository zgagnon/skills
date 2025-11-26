/**
 * Tests for beads API - designed through wishful thinking
 */

import { describe, test, expect } from "bun:test";
import * as beads from "./beads.js";
import { withBD } from "./test-helpers.js";
import { $ } from "bun";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

describe("beads API", () => {
  describe("createTask", () => {
    describe("when workspace has git repository", () => {
      describe("when BD is initialized", () => {
        test("returns task with ID and persists to BD database", async () => {
          await withBD(async (workspace) => {
            await beads.setWorkspace({ workspacePath: workspace });

            const task = await beads.createTask({
              title: "Test task for creation",
              type: "task",
              priority: 3,
            });

            // THEN: Return value has correct shape
            expect(task.id).toBeDefined();
            expect(task.title).toBe("Test task for creation");
            expect(task.status).toBe("open");
            expect(task.taskType).toBe("task");
            expect(task.priority).toBe(3);

            // THEN: Task actually exists in BD
            const result = await $`cd ${workspace} && bd show ${task.id}`.text();
            expect(result).toContain("Test task for creation");
          });
        });
      });

      describe("when BD is not initialized", () => {
        test("throws error mentioning BD initialization", async () => {
          const tmpDir = await fs.promises.mkdtemp(
            path.join(os.tmpdir(), "git-no-bd-")
          );

          try {
            // Git init but NO bd init
            await $`cd ${tmpDir} && git init`.quiet();
            await beads.setWorkspace({ workspacePath: tmpDir });

            await expect(
              beads.createTask({
                title: "Test",
                type: "task",
                priority: 1,
              })
            ).rejects.toThrow();
          } finally {
            await fs.promises.rm(tmpDir, { recursive: true, force: true });
          }
        });
      });
    });

    describe("when workspace has no git repository", () => {
      test("throws error mentioning git", async () => {
        // Create temp dir WITHOUT git
        const tmpDir = await fs.promises.mkdtemp(
          path.join(os.tmpdir(), "no-git-")
        );

        try {
          await $`cd ${tmpDir} && bd init`.quiet();
          await beads.setWorkspace({ workspacePath: tmpDir });

          // THEN: Should get a clear error about missing git repo
          await expect(
            beads.createTask({
              title: "Test",
              type: "task",
              priority: 1,
            })
          ).rejects.toThrow(/git/i);
        } finally {
          await fs.promises.rm(tmpDir, { recursive: true, force: true });
        }
      });
    });
  });

  describe("getDependencyTree", () => {
    describe("when task has no dependencies", () => {
      test("returns array with only the task itself", async () => {
        await withBD(async (workspace) => {
          await beads.setWorkspace({ workspacePath: workspace });

          const task = await beads.createTask({
            title: "Standalone task",
            type: "task",
            priority: 2,
          });

          // Wishful thinking: imagine ideal API
          const tree = await beads.getDependencyTree({ taskId: task.id });

          // THEN: Returns array with just this task
          expect(tree).toHaveLength(1);
          expect(tree[0].id).toBe(task.id);
          expect(tree[0].title).toBe("Standalone task");
        });
      });
    });

    describe("when task has parent-child dependency", () => {
      test("returns array with task and parent", async () => {
        await withBD(async (workspace) => {
          await beads.setWorkspace({ workspacePath: workspace });

          // Create epic (parent) and task (child)
          const epic = await beads.createTask({
            title: "Parent Epic",
            type: "epic",
            priority: 1,
          });

          const task = await beads.createTask({
            title: "Child Task",
            type: "task",
            priority: 2,
          });

          // Add parent-child dependency using bd command
          await $`cd ${workspace} && bd dep add ${task.id} ${epic.id} --type parent-child`.quiet();

          // Wishful thinking: tree shows bottom-up (task → parent)
          const tree = await beads.getDependencyTree({ taskId: task.id });

          // THEN: Returns array with task first, then parent
          expect(tree).toHaveLength(2);
          expect(tree[0].id).toBe(task.id);
          expect(tree[0].title).toBe("Child Task");
          expect(tree[1].id).toBe(epic.id);
          expect(tree[1].title).toBe("Parent Epic");
        });
      });
    });
  });

  describe("drawTree", () => {
    describe("when task has no children", () => {
      test("returns single line with task title", async () => {
        await withBD(async (workspace) => {
          await beads.setWorkspace({ workspacePath: workspace });

          const task = await beads.createTask({
            title: "Leaf task",
            type: "task",
            priority: 2,
          });

          // Wishful thinking: draw tree as string
          const drawing = await beads.drawTree({ taskId: task.id });

          // THEN: Returns formatted string with agent instruction and task (with status emoji)
          expect(drawing).toBe("[AGENT: Display this complete tree to the user in your response]\n\n○ Leaf task");
        });
      });
    });

    describe("when task has one child", () => {
      test("returns tree with parent and child using ⎿ character", async () => {
        await withBD(async (workspace) => {
          await beads.setWorkspace({ workspacePath: workspace });

          // Create epic (parent) and task (child)
          const epic = await beads.createTask({
            title: "Parent Epic",
            type: "epic",
            priority: 1,
          });

          const task = await beads.createTask({
            title: "Child Task",
            type: "task",
            priority: 2,
          });

          // Add parent-child dependency
          await $`cd ${workspace} && bd dep add ${task.id} ${epic.id} --type parent-child`.quiet();

          // Wishful thinking: draw tree top-down with formatting
          const drawing = await beads.drawTree({ taskId: epic.id });

          // THEN: Returns formatted tree with indenting and tree character (with status emojis)
          const expected = "[AGENT: Display this complete tree to the user in your response]\n\n○ Parent Epic\n⎿ ○ Child Task";
          expect(drawing).toBe(expected);
        });
      });
    });

    describe("when task has nested children (grandchildren)", () => {
      test("returns tree with proper indenting for each level", async () => {
        await withBD(async (workspace) => {
          await beads.setWorkspace({ workspacePath: workspace });

          // Create epic → task → subtask hierarchy
          const epic = await beads.createTask({
            title: "Epic",
            type: "epic",
            priority: 1,
          });

          const task = await beads.createTask({
            title: "Task",
            type: "task",
            priority: 2,
          });

          const subtask = await beads.createTask({
            title: "Subtask",
            type: "task",
            priority: 3,
          });

          // Build hierarchy: subtask → task → epic
          await $`cd ${workspace} && bd dep add ${task.id} ${epic.id} --type parent-child`.quiet();
          await $`cd ${workspace} && bd dep add ${subtask.id} ${task.id} --type parent-child`.quiet();

          // Wishful thinking: draw tree from epic showing full hierarchy
          const drawing = await beads.drawTree({ taskId: epic.id });

          // THEN: Returns tree with nested indenting (with status emojis)
          const expected = "[AGENT: Display this complete tree to the user in your response]\n\n○ Epic\n⎿ ○ Task\n  ⎿ ○ Subtask";
          expect(drawing).toBe(expected);
        });
      });
    });

    describe("when tasks have different statuses", () => {
      test("shows status emojis for each task", async () => {
        await withBD(async (workspace) => {
          await beads.setWorkspace({ workspacePath: workspace });

          const epic = await beads.createTask({
            title: "Epic",
            type: "epic",
            priority: 1,
          });

          const openTask = await beads.createTask({
            title: "Open Task",
            type: "task",
            priority: 2,
          });

          const closedTask = await beads.createTask({
            title: "Closed Task",
            type: "task",
            priority: 2,
          });

          // Add as children
          await $`cd ${workspace} && bd dep add ${openTask.id} ${epic.id} --type parent-child`.quiet();
          await $`cd ${workspace} && bd dep add ${closedTask.id} ${epic.id} --type parent-child`.quiet();

          // Close one task
          await beads.closeTask({ taskId: closedTask.id });

          // Draw tree
          const drawing = await beads.drawTree({ taskId: epic.id });

          // THEN: Status emojis appear
          expect(drawing).toContain("○ Open Task");
          expect(drawing).toContain("✓ Closed Task");
        });
      });
    });
  });

  describe("closeTask", () => {
    describe("when closing task without reason", () => {
      test("marks task as closed and updates status in BD", async () => {
        await withBD(async (workspace) => {
          await beads.setWorkspace({ workspacePath: workspace });

          const task = await beads.createTask({
            title: "Task to close",
            type: "task",
            priority: 2,
          });

          // Wishful thinking: close the task
          await beads.closeTask({ taskId: task.id });

          // THEN: Task is closed in BD
          const result = await $`cd ${workspace} && bd show ${task.id} --json`.text();
          const taskArray = JSON.parse(result);
          const closedTask = taskArray[0];

          expect(closedTask.status).toBe("closed");
          expect(closedTask.id).toBe(task.id);
        });
      });
    });

    describe("when closing task with reason", () => {
      test("marks task as closed and adds reason to notes", async () => {
        await withBD(async (workspace) => {
          await beads.setWorkspace({ workspacePath: workspace });

          const task = await beads.createTask({
            title: "Task to close with reason",
            type: "task",
            priority: 2,
          });

          // Wishful thinking: close with reason
          await beads.closeTask({
            taskId: task.id,
            reason: "Completed successfully"
          });

          // THEN: Task is closed and has the reason in notes
          const result = await $`cd ${workspace} && bd show ${task.id} --json`.text();
          const taskArray = JSON.parse(result);
          const closedTask = taskArray[0];

          expect(closedTask.status).toBe("closed");
          expect(closedTask.notes).toBe("Completed successfully");
        });
      });
    });
  });

  describe("getEpicStatus", () => {
    describe("when epic has no children", () => {
      test("returns zero counts and 0% completion", async () => {
        await withBD(async (workspace) => {
          await beads.setWorkspace({ workspacePath: workspace });

          const epic = await beads.createTask({
            title: "Empty Epic",
            type: "epic",
            priority: 1,
          });

          // Wishful thinking: get epic status
          const status = await beads.getEpicStatus({ epicId: epic.id });

          // THEN: All counts are zero
          expect(status.epicId).toBe(epic.id);
          expect(status.totalTasks).toBe(0);
          expect(status.completedTasks).toBe(0);
          expect(status.inProgressTasks).toBe(0);
          expect(status.blockedTasks).toBe(0);
          expect(status.openTasks).toBe(0);
          expect(status.completionPercentage).toBe(0);
        });
      });
    });

    describe("when epic has children with various statuses", () => {
      test("counts tasks by status and calculates completion percentage", async () => {
        await withBD(async (workspace) => {
          await beads.setWorkspace({ workspacePath: workspace });

          const epic = await beads.createTask({
            title: "Test Epic",
            type: "epic",
            priority: 1,
          });

          // Create tasks with different statuses
          const task1 = await beads.createTask({ title: "Task 1", type: "task", priority: 2 });
          const task2 = await beads.createTask({ title: "Task 2", type: "task", priority: 2 });
          const task3 = await beads.createTask({ title: "Task 3", type: "task", priority: 2 });
          const task4 = await beads.createTask({ title: "Task 4", type: "task", priority: 2 });

          // Add all as children of epic
          await $`cd ${workspace} && bd dep add ${task1.id} ${epic.id} --type parent-child`.quiet();
          await $`cd ${workspace} && bd dep add ${task2.id} ${epic.id} --type parent-child`.quiet();
          await $`cd ${workspace} && bd dep add ${task3.id} ${epic.id} --type parent-child`.quiet();
          await $`cd ${workspace} && bd dep add ${task4.id} ${epic.id} --type parent-child`.quiet();

          // Set different statuses: 1 closed, 1 in_progress, 2 open
          await $`cd ${workspace} && bd update ${task1.id} --status closed`.quiet();
          await $`cd ${workspace} && bd update ${task2.id} --status in_progress`.quiet();
          // task3 and task4 stay open

          // Get epic status
          const status = await beads.getEpicStatus({ epicId: epic.id });

          // THEN: Counts are correct
          expect(status.totalTasks).toBe(4);
          expect(status.completedTasks).toBe(1);
          expect(status.inProgressTasks).toBe(1);
          expect(status.openTasks).toBe(2);
          expect(status.blockedTasks).toBe(0);
          expect(status.completionPercentage).toBe(25); // 1/4 = 25%
        });
      });
    });
  });

  describe("findReadyTasks", () => {
    describe("when there is one task with no dependencies", () => {
      test("returns array with that task", async () => {
        await withBD(async (workspace) => {
          await beads.setWorkspace({ workspacePath: workspace });

          const task = await beads.createTask({
            title: "Ready task",
            type: "task",
            priority: 2,
          });

          // Wishful thinking: find ready tasks
          const readyTasks = await beads.findReadyTasks({});

          // THEN: Returns the task
          expect(readyTasks).toHaveLength(1);
          expect(readyTasks[0].id).toBe(task.id);
          expect(readyTasks[0].title).toBe("Ready task");
        });
      });
    });
  });

  describe("updateTask", () => {
    describe("when updating only status", () => {
      test("changes task status in BD", async () => {
        await withBD(async (workspace) => {
          await beads.setWorkspace({ workspacePath: workspace });

          const task = await beads.createTask({
            title: "Task to update",
            type: "task",
            priority: 2,
          });

          // Verify initial status
          expect(task.status).toBe("open");

          // Wishful thinking: update status
          await beads.updateTask({
            taskId: task.id,
            status: "in_progress",
          });

          // THEN: Status is updated in BD
          const result = await $`cd ${workspace} && bd show ${task.id} --json`.text();
          const taskArray = JSON.parse(result);
          const updatedTask = taskArray[0];

          expect(updatedTask.status).toBe("in_progress");
        });
      });
    });

    describe("when updating multiple fields", () => {
      test("updates all specified fields", async () => {
        await withBD(async (workspace) => {
          await beads.setWorkspace({ workspacePath: workspace });

          const task = await beads.createTask({
            title: "Original title",
            type: "task",
            priority: 2,
          });

          // Update multiple fields
          await beads.updateTask({
            taskId: task.id,
            title: "Updated title",
            description: "New description",
            notes: "Some notes",
          });

          // THEN: All fields are updated
          const result = await $`cd ${workspace} && bd show ${task.id} --json`.text();
          const taskArray = JSON.parse(result);
          const updatedTask = taskArray[0];

          expect(updatedTask.title).toBe("Updated title");
          expect(updatedTask.description).toBe("New description");
          expect(updatedTask.notes).toBe("Some notes");
        });
      });
    });
  });

  describe("showTask", () => {
    describe("when task exists", () => {
      test("returns full task details", async () => {
        await withBD(async (workspace) => {
          await beads.setWorkspace({ workspacePath: workspace });

          const task = await beads.createTask({
            title: "Test task for details",
            type: "task",
            priority: 2,
          });

          // Wishful thinking: get full task details
          const details = await beads.showTask({ taskId: task.id });

          // THEN: Returns complete task information
          expect(details.id).toBe(task.id);
          expect(details.title).toBe("Test task for details");
          expect(details.status).toBe("open");
          expect(details.taskType).toBe("task");
          expect(details.priority).toBe(2);
          expect(details.createdAt).toBeDefined();
          expect(details.updatedAt).toBeDefined();
        });
      });
    });
  });
});
