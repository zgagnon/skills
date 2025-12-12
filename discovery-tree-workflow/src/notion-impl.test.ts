/**
 * Tests for Notion implementation
 *
 * Using wishful-thinking programming: write ONE test at a time with mocked collaborators
 * Using incremental-tdd: ONE failing test → implement → make it pass → NEXT test
 */

import { describe, test, expect, beforeEach } from "bun:test";
import type { NotionClient } from "./discovery-tree.js";

// Import the implementation functions we'll create
import { setNotionClientImpl, getNotionPageImpl } from "./notion-impl.js";

describe("getNotionPageImpl", () => {
  describe("when no client is configured", () => {
    test("throws error with helpful message", async () => {
      // Reset client to null
      setNotionClientImpl(null as any);

      await expect(getNotionPageImpl({ pageId: "abc123" })).rejects.toThrow(
        "Notion client not configured. Call setNotionClient() first."
      );
    });
  });

  describe("when Notion client is configured", () => {
    let mockNotionClient: NotionClient;

    beforeEach(() => {
      // Wishful thinking: Mock the ideal Notion client we wish existed
      // This defines what the real Notion client API should look like
      mockNotionClient = {
        pages: {
          retrieve: async (params: { page_id: string }) => ({
            id: params.page_id,
            properties: {
              title: {
                type: "title",
                title: [{ plain_text: "Architecture Decision Record" }],
              },
            },
          }),
        },
        blocks: {
          children: {
            list: async (params: { block_id: string }) => ({
              results: [
                {
                  type: "paragraph",
                  paragraph: {
                    rich_text: [
                      { plain_text: "Use TypeScript for all new code." },
                    ],
                  },
                },
                {
                  type: "paragraph",
                  paragraph: {
                    rich_text: [{ plain_text: "Follow existing ADRs." }],
                  },
                },
              ],
            }),
          },
        },
      };

      setNotionClientImpl(mockNotionClient);
    });

    test("reads page and returns title and content", async () => {
      const page = await getNotionPageImpl({ pageId: "abc123" });

      expect(page.id).toBe("abc123");
      expect(page.title).toBe("Architecture Decision Record");
      expect(page.content).toContain("Use TypeScript for all new code");
      expect(page.content).toContain("Follow existing ADRs");
    });
  });

  describe("when page is not found", () => {
    test("throws error with page ID", async () => {
      // Mock Notion client that simulates page not found
      const mockNotionClient: NotionClient = {
        pages: {
          retrieve: async (params: { page_id: string }) => {
            throw new Error("Could not find page with ID: " + params.page_id);
          },
        },
        blocks: {
          children: {
            list: async () => ({ results: [] }),
          },
        },
      };

      setNotionClientImpl(mockNotionClient);

      await expect(getNotionPageImpl({ pageId: "nonexistent" })).rejects.toThrow(
        "Could not find page with ID: nonexistent"
      );
    });
  });

  describe("when page has no content blocks", () => {
    test("returns page with empty content string", async () => {
      // Mock Notion client for empty page
      const mockNotionClient: NotionClient = {
        pages: {
          retrieve: async (params: { page_id: string }) => ({
            id: params.page_id,
            properties: {
              title: {
                type: "title",
                title: [{ plain_text: "Empty Page" }],
              },
            },
          }),
        },
        blocks: {
          children: {
            list: async () => ({
              results: [], // No content blocks
            }),
          },
        },
      };

      setNotionClientImpl(mockNotionClient);

      const page = await getNotionPageImpl({ pageId: "empty123" });

      expect(page.id).toBe("empty123");
      expect(page.title).toBe("Empty Page");
      expect(page.content).toBe(""); // Empty string for no content
    });
  });

  describe("when page has no title", () => {
    test("returns page with empty title string", async () => {
      // Mock Notion client for untitled page
      const mockNotionClient: NotionClient = {
        pages: {
          retrieve: async (params: { page_id: string }) => ({
            id: params.page_id,
            properties: {
              title: {
                type: "title",
                title: [], // No title text
              },
            },
          }),
        },
        blocks: {
          children: {
            list: async () => ({
              results: [
                {
                  type: "paragraph",
                  paragraph: {
                    rich_text: [{ plain_text: "Some content here." }],
                  },
                },
              ],
            }),
          },
        },
      };

      setNotionClientImpl(mockNotionClient);

      const page = await getNotionPageImpl({ pageId: "untitled123" });

      expect(page.id).toBe("untitled123");
      expect(page.title).toBe(""); // Empty string for no title
      expect(page.content).toContain("Some content here.");
    });
  });

  describe("when page has non-paragraph blocks", () => {
    test("only extracts text from paragraph blocks", async () => {
      // Mock Notion client with mixed block types
      const mockNotionClient: NotionClient = {
        pages: {
          retrieve: async (params: { page_id: string }) => ({
            id: params.page_id,
            properties: {
              title: {
                type: "title",
                title: [{ plain_text: "Mixed Content Page" }],
              },
            },
          }),
        },
        blocks: {
          children: {
            list: async () => ({
              results: [
                {
                  type: "heading_1",
                  heading_1: {
                    rich_text: [{ plain_text: "This is a heading" }],
                  },
                },
                {
                  type: "paragraph",
                  paragraph: {
                    rich_text: [{ plain_text: "This is a paragraph." }],
                  },
                },
                {
                  type: "bulleted_list_item",
                  bulleted_list_item: {
                    rich_text: [{ plain_text: "This is a list item" }],
                  },
                },
              ],
            }),
          },
        },
      };

      setNotionClientImpl(mockNotionClient);

      const page = await getNotionPageImpl({ pageId: "mixed123" });

      expect(page.id).toBe("mixed123");
      expect(page.title).toBe("Mixed Content Page");
      // Currently only extracts paragraph blocks
      expect(page.content).toBe("This is a paragraph.");
      expect(page.content).not.toContain("This is a heading");
      expect(page.content).not.toContain("This is a list item");
    });
  });
});
