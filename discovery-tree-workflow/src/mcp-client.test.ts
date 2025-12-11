/**
 * Tests for MCP client connection to Shortcut
 */

import { describe, test, expect } from "bun:test";
import { createShortcutClient } from "./mcp-client.js";

describe("createShortcutClient", () => {
  describe("when creating client", () => {
    test("returns client that can call MCP tools and get data back", async () => {
      // WHEN: Create client and call an MCP tool
      const client = await createShortcutClient();

      // Call stories-get-by-id tool with a test story ID
      const result = await client.callTool("stories-get-by-id", {
        storyPublicId: 93114
      });

      // THEN: Should return MCP response with story data
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.content[0]).toBeDefined();
      expect(result.content[0].text).toBeDefined();

      // Verify the response contains story data (behavior verification)
      const responseText = result.content[0].text;
      expect(responseText).toContain("93114"); // Story ID should appear
      expect(responseText.length).toBeGreaterThan(0); // Should have content
    }, 30000); // Integration test may take longer
  });
});
