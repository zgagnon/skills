/**
 * Helper functions for creating jj bookmarks with branch names
 */

import * as jj from '../../using-jj/src/jj.js';

export interface CreateJjBookmarkInput {
  branchName: string;
  repositoryPath: string;
  description?: string;
}

/**
 * Create a jj bookmark with a branch name
 *
 * Sets the jj repository, creates a bookmark at the current revision,
 * and optionally describes the current change.
 *
 * @param input - Configuration with branch name, repository path, and optional description
 * @returns void
 * @throws Error if jj operation fails
 *
 * @example
 * ```typescript
 * await createJjBookmark({
 *   branchName: 'feature/sc-12345',
 *   repositoryPath: '/path/to/repo',
 *   description: 'Working on feature X'
 * });
 * ```
 */
export const createJjBookmark = async (
  input: CreateJjBookmarkInput
): Promise<void> => {
  // Set repository
  await jj.setRepository({ repositoryPath: input.repositoryPath });

  // Create bookmark
  await jj.createBookmark({ name: input.branchName });

  // Optionally describe the change
  if (input.description) {
    await jj.describe({ description: input.description });
  }
};
