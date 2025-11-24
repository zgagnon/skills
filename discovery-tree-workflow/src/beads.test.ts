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
  describe("createIssue", () => {
    describe("when workspace has git repository", () => {
      describe("when BD is initialized", () => {
        test("returns issue with ID and persists to BD database", async () => {
          await withBD(async (workspace) => {
            await beads.setWorkspace({ workspacePath: workspace });

            const issue = await beads.createIssue({
              title: "Test task for creation",
              type: "task",
              priority: 3,
            });

            // THEN: Return value has correct shape
            expect(issue.id).toBeDefined();
            expect(issue.title).toBe("Test task for creation");
            expect(issue.status).toBe("open");
            expect(issue.issueType).toBe("task");
            expect(issue.priority).toBe(3);

            // THEN: Issue actually exists in BD
            const result = await $`cd ${workspace} && bd show ${issue.id}`.text();
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
              beads.createIssue({
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
            beads.createIssue({
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
});
