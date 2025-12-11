/**
 * Implementation details for Shortcut integration
 *
 * Private implementation - use the public API in shortcut.ts instead
 */

import type { ShortcutStory, ShortcutClient } from "./shortcut.js";

// Injected client (dependency injection pattern)
let client: ShortcutClient | null = null;

/**
 * Set the Shortcut MCP client (for dependency injection)
 */
export const setShortcutClientImpl = (mcpClient: ShortcutClient): void => {
  client = mcpClient;
};

/**
 * Get Shortcut story details with branch name (implementation)
 */
export const getShortcutStoryImpl = async (storyId: number): Promise<ShortcutStory> => {
  if (!client) {
    throw new Error("Shortcut MCP client not configured. Call setShortcutClient() first.");
  }

  // Call MCP tools via injected client
  const storyResult = await client.callTool("stories-get-by-id", {
    storyPublicId: storyId
  });

  const branchResult = await client.callTool("stories-get-branch-name", {
    storyPublicId: storyId
  });

  // Parse responses with error handling for malformed data
  try {
    // Extract JSON from <json> tags if present, otherwise use raw text
    const extractJson = (text: string): string => {
      const jsonMatch = text.match(/<json>([\s\S]*?)<\/json>/);
      return jsonMatch ? jsonMatch[1].trim() : text;
    };

    const story = JSON.parse(extractJson(storyResult.content[0].text));

    // Branch name may be plain text like "Branch name for story sc-93114: actual-branch"
    let branch_name: string;
    const branchText = extractJson(branchResult.content[0].text);
    try {
      // Try parsing as JSON first
      branch_name = JSON.parse(branchText);
    } catch {
      // If not JSON, extract from plain text format
      const branchMatch = branchText.match(/:\s*(.+)$/);
      branch_name = branchMatch ? branchMatch[1].trim() : branchText;
    }

    return {
      ...story,
      branch_name,
    };
  } catch (error) {
    throw new Error(
      `Invalid response from Shortcut MCP: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
