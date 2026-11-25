import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic';

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: todos } = await supabase.from('todos').select()

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Supabase Todos Test</h1>
      <ul className="list-disc pl-5 space-y-1">
        {todos?.map((todo: any) => (
          <li key={todo.id}>{todo.name}</li>
        ))}
      </ul>
      {(!todos || todos.length === 0) && (
        <p className="text-gray-500 mt-2">No todos found or &apos;todos&apos; table not created yet.</p>
      )}
    </div>
  )
}
