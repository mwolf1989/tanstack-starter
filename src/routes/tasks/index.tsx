import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient } from '~/lib/server/auth'
import { Card, CardContent, CardHeader, CardTitle } from '~/lib/components/ui/card'
import { Button } from '~/lib/components/ui/button'
import { Input } from '~/lib/components/ui/input'
import { useState } from 'react'
import { TodoSchema, CreateTodoSchema, UpdateTodoSchema, type Todo } from '~/schema'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'

const TODOS_QUERY_KEY = ['todos'] as const

const getTodos = createServerFn({ method: 'GET' })
  .validator((data: unknown) => {
    if (data !== undefined) {
      throw new Error('GET request should not have data')
    }
    return undefined
  })
  .handler(async () => {
    const supabase = getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { data: todos, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', user.id)
      .order('inserted_at', { ascending: false })

    if (error) {
      console.error('Error fetching todos:', error)
      throw error
    }

    return TodoSchema.array().parse(todos)
  })

const createTodo = createServerFn({ method: 'POST' })
  .validator((data: unknown) => CreateTodoSchema.parse(data))
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { data: todo, error } = await supabase
      .from('todos')
      .insert([
        {
          task: data.task,
          user_id: user.id,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating todo:', error)
      throw error
    }

    return TodoSchema.parse(todo)
  })

const updateTodo = createServerFn({ method: 'POST' })
  .validator((data: unknown) => UpdateTodoSchema.parse(data))
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { data: todo, error } = await supabase
      .from('todos')
      .update({ is_complete: data.is_complete })
      .eq('id', data.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating todo:', error)
      throw error
    }

    return TodoSchema.parse(todo)
  })

export const Route = createFileRoute('/tasks/')({
  component: RouteComponent,
  loader: async ({ context }) => {
    const todos = await context.queryClient.fetchQuery({
      queryKey: TODOS_QUERY_KEY,
      queryFn: () => getTodos(),
    })
    return { todos }
  },
})

function RouteComponent() {
  const { todos } = Route.useLoaderData()
  const [newTodoTask, setNewTodoTask] = useState('')
  const router = useRouter()

  const createTodoMutation = useMutation({
    mutationFn: (task: string) => createTodo({ data: { task } }),
    onSuccess: () => {
      router.invalidate()
    },
  })

  const updateTodoMutation = useMutation({
    mutationFn: (data: { id: number; is_complete: boolean }) => 
      updateTodo({ data }),
    onSuccess: () => {
      router.invalidate()
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodoTask.trim() || newTodoTask.trim().length <= 3) return

    try {
      await createTodoMutation.mutateAsync(newTodoTask.trim())
      setNewTodoTask('')
    } catch (error) {
      console.error('Error creating todo:', error)
    }
  }

  const handleToggleTodo = async (todo: Todo) => {
    try {
      await updateTodoMutation.mutateAsync({
        id: todo.id,
        is_complete: !todo.is_complete
      })
    } catch (error) {
      console.error('Error updating todo:', error)
    }
  }

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-8">My Tasks</h1>
      
      <form onSubmit={handleSubmit} className="mb-8 flex gap-2">
        <Input
          type="text"
          placeholder="Add a new task (min 4 characters)..."
          value={newTodoTask}
          onChange={(e) => setNewTodoTask(e.target.value)}
          className="flex-1"
        />
        <Button type="submit">Add Task</Button>
      </form>

      <div className="grid gap-4">
        {todos.map((todo) => (
          <Card key={todo.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={todo.is_complete}
                  onChange={() => handleToggleTodo(todo)}
                  className="h-4 w-4 cursor-pointer"
                />
                <span className={todo.is_complete ? 'line-through text-muted-foreground' : ''}>
                  {todo.task}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Created: {new Date(todo.inserted_at).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
