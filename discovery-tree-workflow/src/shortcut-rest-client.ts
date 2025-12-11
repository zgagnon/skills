/**
 * Shortcut REST API client (bypasses MCP subprocess issues)
 */

import type { ShortcutClient } from "./shortcut.js";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

export const createShortcutRestClient = async (): Promise<ShortcutClient> => {
  // Read API token from Claude config
  const configPath = path.join(os.homedir(), ".claude.json");
  const configContent = await fs.promises.readFile(configPath, "utf-8");
  const config = JSON.parse(configContent);

  const apiToken = config.mcpServers?.shortcut?.env?.SHORTCUT_API_TOKEN;
  if (!apiToken) {
    throw new Error("SHORTCUT_API_TOKEN not found in ~/.claude.json");
  }

  const baseUrl = "https://api.app.shortcut.com/api/v3";

  // Return ShortcutClient interface that calls REST API
  return {
    callTool: async (toolName: string, params: any) => {
      // Map MCP tool names to REST endpoints
      if (toolName === "stories-get-by-id") {
        const response = await fetch(`${baseUrl}/stories/${params.storyPublicId}`, {
          headers: {
            "Shortcut-Token": apiToken,
            "Content-Type": "application/json"
          }
        });

        if (!response.ok) {
          throw new Error(`Shortcut API error: ${response.status} ${response.statusText}`);
        }

        const story = await response.json();

        // Return in MCP response format
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify(story)
          }]
        };
      }

      if (toolName === "stories-get-branch-name") {
        // Branch name is derived from story data
        const response = await fetch(`${baseUrl}/stories/${params.storyPublicId}`, {
          headers: {
            "Shortcut-Token": apiToken,
            "Content-Type": "application/json"
          }
        });

        if (!response.ok) {
          throw new Error(`Shortcut API error: ${response.status} ${response.statusText}`);
        }

        const story = await response.json();
        const branchName = story.suggested_branch_name || `story-${params.storyPublicId}`;

        // Return as plain JSON string (matches real MCP behavior)
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify(branchName)
          }]
        };
      }

      throw new Error(`Unsupported tool: ${toolName}`);
    }
  };
};
