import { z } from 'zod'

export const TodoSchema = z.object({
  id: z.number(),
  task: z.string(),
  is_complete: z.boolean(),
  user_id: z.string(),
  inserted_at: z.string(),
})

export const CreateTodoSchema = z.object({
  task: z.string().min(4, 'Task must be at least 4 characters long'),
})

export const UpdateTodoSchema = z.object({
  id: z.number(),
  is_complete: z.boolean(),
})

export type Todo = z.infer<typeof TodoSchema>
export type CreateTodoData = z.infer<typeof CreateTodoSchema>
export type UpdateTodoData = z.infer<typeof UpdateTodoSchema> 