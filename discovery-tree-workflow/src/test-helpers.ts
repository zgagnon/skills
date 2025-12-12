/**
 * Test helpers for database API tests
 */

import { $ } from "bun";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

/**
 * Loan pattern: Creates a temporary workspace with BD initialized,
 * runs the test function, then cleans up.
 *
 * Usage:
 *   await withBD(async (workspace) => {
 *     await beads.setWorkspace({ workspacePath: workspace });
 *     // ... test code ...
 *   });
 */
export const withBD = async (
  testFn: (workspacePath: string) => Promise<void>
): Promise<void> => {
  // Setup: create temp directory
  const tmpDir = await fs.promises.mkdtemp(
    path.join(os.tmpdir(), "beads-test-")
  );

  try {
    // Initialize git (required by BD)
    await $`cd ${tmpDir} && git init`.quiet();

    // Initialize BD in temp directory
    await $`cd ${tmpDir} && bd init`.quiet();

    // Loan the workspace to the test
    await testFn(tmpDir);
  } finally {
    // Cleanup: remove temp directory
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  }
};
