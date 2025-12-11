/**
 * Tests for Shortcut integration
 *
 * Using wishful-thinking programming: write tests as if the perfect API exists
 */

import { describe, test, expect } from "bun:test";
import { getShortcutStory, setShortcutClient } from "./shortcut.js";

describe("getShortcutStory", () => {
  describe("when no client is configured", () => {
    test("throws error with helpful message", async () => {
      // Reset client to null to test error case
      setShortcutClient(null as any);

      await expect(getShortcutStory(93114)).rejects.toThrow(
        "Shortcut MCP client not configured. Call setShortcutClient() first."
      );
    });
  });

  describe("when MCP client call fails", () => {
    test("throws error from MCP client", async () => {
      const fakeClient = {
        callTool: async (toolName: string) => {
          throw new Error("MCP connection failed");
        }
      };

      setShortcutClient(fakeClient);

      await expect(getShortcutStory(93114)).rejects.toThrow("MCP connection failed");
    });
  });

  describe("when MCP returns malformed data", () => {
    test("throws error with helpful message", async () => {
      const fakeClient = {
        callTool: async (toolName: string) => {
          // Return malformed structure (missing content array)
          return { invalid: "structure" };
        }
      };

      setShortcutClient(fakeClient);

      await expect(getShortcutStory(93114)).rejects.toThrow(
        "Invalid response from Shortcut MCP"
      );
    });
  });

  describe("when MCP client is configured", () => {
    test("handles branch name as plain text (not JSON)", async () => {
      // GIVEN: Fake client where branch name is returned as plain text
      const fakeClient = {
        callTool: async (toolName: string, params: any) => {
          if (toolName === "stories-get-by-id") {
            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  id: 93114,
                  name: "Test Story",
                  description: "Test",
                  app_url: "https://app.shortcut.com/org/story/93114"
                })
              }]
            };
          }
          if (toolName === "stories-get-branch-name") {
            return {
              content: [{
                type: "text",
                text: "Branch name for story sc-93114: test-branch/sc-93114"
              }]
            };
          }
        }
      };

      setShortcutClient(fakeClient);

      const story = await getShortcutStory(93114);

      // THEN: Should extract branch name from plain text
      expect(story.branch_name).toBe("test-branch/sc-93114");
    });

    test("handles MCP responses with <json> tags", async () => {
      // GIVEN: Fake client that returns response with <json> tags (like real Shortcut MCP)
      const fakeClient = {
        callTool: async (toolName: string, params: any) => {
          if (toolName === "stories-get-by-id") {
            return {
              content: [{
                type: "text",
                text: `Story: sc-93114

<json>
${JSON.stringify({
  id: 93114,
  name: "Story With JSON Tags",
  description: "Test description",
  app_url: "https://app.shortcut.com/org/story/93114"
})}
</json>`
              }]
            };
          }
          if (toolName === "stories-get-branch-name") {
            return {
              content: [{
                type: "text",
                text: JSON.stringify("branch-with-json-tags/sc-93114")
              }]
            };
          }
        }
      };

      setShortcutClient(fakeClient);

      const story = await getShortcutStory(93114);

      // THEN: Should extract JSON from tags
      expect(story.name).toBe("Story With JSON Tags");
      expect(story.branch_name).toBe("branch-with-json-tags/sc-93114");
    });

    test("returns story data merged with branch name from MCP tools", async () => {
      // Stub returns unique data that can ONLY come from MCP calls
      const fakeClient = {
        callTool: async (toolName: string, params: any) => {
          if (toolName === "stories-get-by-id") {
            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  id: 93114,
                  name: "Distinctive Story Name From MCP",
                  description: "Story description from MCP",
                  app_url: "https://app.shortcut.com/org/story/93114"
                })
              }]
            };
          }
          if (toolName === "stories-get-branch-name") {
            return {
              content: [{
                type: "text",
                text: JSON.stringify("distinctive-branch-from-mcp/sc-93114")
              }]
            };
          }
        }
      };

      // Inject the fake (dependency injection)
      setShortcutClient(fakeClient);

      const story = await getShortcutStory(93114);

      // Verify behavior: unique stub data appears in result
      // If these pass, the MCP client MUST have been called correctly
      expect(story.name).toBe("Distinctive Story Name From MCP");
      expect(story.branch_name).toBe("distinctive-branch-from-mcp/sc-93114");
      expect(story.description).toBe("Story description from MCP");
    });
  });
});
