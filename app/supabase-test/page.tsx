import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export default async function Page() {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const { data: todos } = await supabase.from("todos").select();

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-4">Supabase Connection Test</h1>
      <ul>
        {todos?.map((todo: { id: string | number; name: string }) => (
          <li key={todo.id}>{todo.name}</li>
        ))}
      </ul>
      {(!todos || todos.length === 0) && (
        <p className="text-muted-foreground text-sm">
          No todos found. If you haven&apos;t created a &apos;todos&apos; table in Supabase, this is expected.
        </p>
      )}
    </div>
  );
}

