/**
 * Shortcut integration for discovery-tree-workflow
 *
 * Public API for fetching Shortcut story data via MCP client.
 */

import { setShortcutClientImpl, getShortcutStoryImpl } from "./shortcut-impl.js";

export interface ShortcutStory {
  id: number;
  name: string;
  description: string;
  app_url: string;
  branch_name: string;
  state?: string;
  story_type?: string;
  [key: string]: any; // Allow other fields
}

// Wishful thinking: imagine perfect MCP client interface
export interface ShortcutClient {
  callTool(toolName: string, params: any): Promise<any>;
}

/**
 * Set the Shortcut MCP client (for dependency injection)
 *
 * @param mcpClient - MCP client instance to use for Shortcut operations
 */
export const setShortcutClient = (mcpClient: ShortcutClient): void => {
  return setShortcutClientImpl(mcpClient);
};

/**
 * Get Shortcut story details with branch name
 *
 * Fetches story data from Shortcut and includes the git branch name.
 * Returns structured data that can be used for creating tasks, bookmarks, or reports.
 *
 * @param storyId - Shortcut story public ID
 * @returns Story details including branch name
 * @throws Error if client not configured or MCP returns invalid data
 *
 * @example
 * ```typescript
 * const story = await getShortcutStory(93114);
 * console.log(story.name); // "Add feature X"
 * console.log(story.branch_name); // "add-feature-x/sc-93114"
 * ```
 */
export const getShortcutStory = async (storyId: number): Promise<ShortcutStory> => {
  return getShortcutStoryImpl(storyId);
};
