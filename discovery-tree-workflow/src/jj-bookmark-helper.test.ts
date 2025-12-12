/**
 * Tests for jj bookmark helper
 */

import { describe, test, expect } from "bun:test";
import { createJjBookmark } from "./jj-bookmark-helper.js";
import { withJJ } from "../../using-jj/src/test-helpers.js";
import { execSync } from "child_process";

describe("createJjBookmark", () => {
  describe("when given branch name and repository path", () => {
    test("creates bookmark that appears in jj bookmark list", async () => {
      await withJJ(async (repoPath) => {
        // GIVEN: A branch name and repository path
        const input = {
          branchName: "test-feature",
          repositoryPath: repoPath
        };

        // WHEN: Create bookmark
        await createJjBookmark(input);

        // THEN: Bookmark appears in list
        const bookmarks = execSync(
          `jj bookmark list --repository "${repoPath}"`,
          { encoding: "utf8" }
        );
        expect(bookmarks).toContain("test-feature");
      });
    });
  });
});
