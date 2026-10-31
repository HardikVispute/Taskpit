# TaskPit

TaskPit is an AI-native team execution platform designed to explore whether student-organization leaders prefer delegating work through their preferred AI assistant connected to TaskPit over manually preparing and distributing task documents.

## Core Documentation

- **[architecture.md](architecture.md)**: Product definition, core domain model, security, and prototype blueprint.
- **[AGENTS.md](AGENTS.md)**: Engineering rules, security policies, and session continuity guidelines.
- **[CURRENT_STATE.md](CURRENT_STATE.md)**: Current development state, verified test results, and next actionable steps.
- **`vault/Taskpit/`**: Conceptual second-brain notes and product registers.

## Technology Stack

- **Framework**: Next.js 16 (App Router, React 19)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS v4 with custom design tokens
- **UI Primitives**: shadcn/ui and Base UI
- **Icons & Motion**: Lucide React and Motion
- **ORM & Database**: Drizzle ORM with PostgreSQL (Supabase)
- **Validation**: Zod
- **Testing**: Vitest
- **AI Integration**: Model Context Protocol (MCP) TypeScript SDK

## Local Development Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   Copy `.env.example` to `.env.local` and provide your development credentials:
   ```bash
   cp .env.example .env.local
   ```

3. **Run checks:**
   ```bash
   npm run typecheck   # TypeScript validation
   npm run lint        # ESLint
   npm test            # Vitest test suite
   npm run build       # Next.js production build
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

## Model Context Protocol (MCP) Integration

TaskPit provides a standards-compliant Model Context Protocol server over `stdio` transport using the official `@modelcontextprotocol/sdk`. This allows external AI assistants (such as Claude Desktop or Cursor) to act directly on behalf of authenticated organization leaders.

### Connecting Claude Desktop or Cursor

Add the TaskPit MCP server to your MCP client configuration (e.g., `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "taskpit": {
      "command": "npx",
      "args": [
        "-y",
        "tsx",
        "C:\\PC\\Hardik\\Projects\\taskpit\\mcp\\index.ts"
      ],
      "env": {
        "TASKPIT_API_KEY": "tp_dev_test_placeholder_key"
      }
    }
  }
}
```

*Note for local standalone testing:* You can also launch the MCP server directly via:
```bash
npm run mcp
```

### Available MCP Tools

All MCP tool operations execute real database mutations via the shared domain `TaskService` and write atomic audit entries to `task_events`:

1. **`list_organization_members`**
   - Lists all active members of the authenticated leader's organization.
   - Provides membership IDs, display names, and roles so the assistant can pick the right assignee.
2. **`list_tasks`**
   - Retrieves tasks in the organization, with optional status and assignee filtering.
3. **`get_task`**
   - Retrieves full details for a task, including its complete chronological audit history.
4. **`create_task`**
   - Creates a persistent task with `createdVia: "mcp"`.
   - Validates that the assignee belongs to the leader's organization.
   - Appends an atomic `task_created` audit event.
5. **`update_task`**
   - Updates task attributes (title, description, status, due date, assignee).
   - Records an immutable `task_updated` audit event with updated fields.

### Security & Authorization Guarantees

- **No Identity Spoofing:** MCP clients cannot pass arbitrary `userId`, `actorId`, or `organizationId` arguments. The server strictly derives the actor and organization context from the verified `TASKPIT_API_KEY`.
- **Role Enforcement:** Only accounts with the `leader` role in the organization can create or update tasks.
- **Tenant Isolation:** Cross-organization access is strictly rejected at the service layer (`TASK_NOT_FOUND` / `INVALID_ASSIGNEE`).
- **No Secret Leakage:** Database credentials and service keys are never exposed to the MCP client or transport.

