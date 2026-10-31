import { loadEnvConfig } from "@next/env";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMcpServer } from "./server";

// Load environment variables (.env, .env.local) matching the Next.js environment
loadEnvConfig(process.cwd());

async function main() {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("TaskPit MCP Server running on stdio transport.");
}

main().catch((err) => {
  console.error("Fatal error starting TaskPit MCP Server:", err);
  process.exit(1);
});

