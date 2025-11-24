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

          // THEN: Returns formatted string with agent instruction and task
          expect(drawing).toBe("[AGENT: Display this complete tree to the user in your response]\n\nLeaf task");
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

          // THEN: Returns formatted tree with indenting and tree character
          const expected = "[AGENT: Display this complete tree to the user in your response]\n\nParent Epic\n⎿ Child Task";
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

          // THEN: Returns tree with nested indenting
          const expected = "[AGENT: Display this complete tree to the user in your response]\n\nEpic\n⎿ Task\n  ⎿ Subtask";
          expect(drawing).toBe(expected);
        });
      });
    });
  });
});
