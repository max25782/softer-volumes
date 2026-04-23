import { createClient } from '@/utils/supabase/server'
import { isSupabaseConfigured } from '@/utils/supabase/env'

export default async function SupabaseExamplePage() {
  if (!isSupabaseConfigured()) {
    return (
      <main className="mx-auto max-w-lg p-8">
        <h1 className="text-lg font-medium">Supabase example</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Add <code className="text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
          <code className="text-xs">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> to{' '}
          <code className="text-xs">.env</code> (see <code className="text-xs">.env.example</code>).
        </p>
      </main>
    )
  }

  const supabase = await createClient()
  const { data: todos, error } = await supabase.from('todos').select()

  if (error) {
    return (
      <main className="mx-auto max-w-lg p-8">
        <h1 className="text-lg font-medium">Supabase example</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Could not load <code className="text-xs">todos</code>: {error.message}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Create a <code className="text-xs">todos</code> table in Supabase (with{' '}
          <code className="text-xs">id</code> and <code className="text-xs">name</code>) or
          adjust this page to query an existing table.
        </p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-lg p-8">
      <h1 className="text-lg font-medium">Supabase example</h1>
      <ul className="mt-4 list-disc pl-5">
        {todos?.map((todo: { id: string; name?: string | null }) => (
          <li key={todo.id}>{todo.name ?? '(no name)'}</li>
        ))}
      </ul>
      {todos?.length === 0 && (
        <p className="mt-2 text-sm text-muted-foreground">No rows yet.</p>
      )}
    </main>
  )
}
