import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerMcpTools } from "./tools";
import { resolveMcpActor } from "./auth";
import { getDb } from "@/lib/db";
import { ActorContext } from "@/lib/types/auth";

export interface CreateMcpServerOptions {
  apiKey?: string;
  dbInstance?: Awaited<ReturnType<typeof getDb>>;
  actorOverride?: ActorContext;
}

/**
 * Creates and configures the TaskPit MCP server.
 */
export function createMcpServer(options: CreateMcpServerOptions = {}) {
  const server = new McpServer({
    name: "taskpit-mcp",
    version: "0.1.0",
  });

  const getActor = async () => {
    if (options.actorOverride) {
      return options.actorOverride;
    }
    const key = options.apiKey ?? process.env.TASKPIT_API_KEY;
    return await resolveMcpActor(key, options.dbInstance);
  };

  const getDbInstance = options.dbInstance ? async () => options.dbInstance! : undefined;

  registerMcpTools(server, getActor, getDbInstance);

  return server;
}

