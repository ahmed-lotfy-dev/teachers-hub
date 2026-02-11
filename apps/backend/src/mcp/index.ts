import { Elysia } from "elysia";
import { mcp } from "elysia-mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export const mcpPlugin = new Elysia({ name: "mcp-server" })
  .onRequest(({ request }) => {
    const acceptHeader = request.headers.get("Accept") ?? "";
    const hasJson = acceptHeader.includes("application/json");
    const hasSse = acceptHeader.includes("text/event-stream");
    if (!hasJson || !hasSse) {
      const newHeaders = new Headers(request.headers);
      newHeaders.set("Accept", "application/json, text/event-stream");
      Object.defineProperty(request, "headers", {
        value: newHeaders,
        writable: false,
      });
    }
  })
  .use(
    mcp({
      stateless: true,
      enableJsonResponse: true,
      serverInfo: {
        name: "Teachers Hub MCP",
        version: "1.0.0",
      },
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
        logging: {},
      },
      setupServer: async (server: McpServer) => {
        server.registerTool(
          "health",
          {
            description: "Returns API health status",
            inputSchema: z.object({}),
          },
          async () => ({
            content: [{ type: "text", text: "ok" }],
          }),
        );
      },
    }),
  );
