-- Seed data for todos table
INSERT INTO public.todos (task, user_id, is_complete) -- user_id is the id of the user who created the todo, you can get it from the auth.users table or the supabase studio ui
VALUES 
  ('Complete project documentation', '00000000-0000-0000-0000-000000000000', false), --change the use_id!!
  ('Review pull requests', '00000000-0000-0000-0000-000000000000', true), --change the use_id!!
  ('Update dependencies', '00000000-0000-0000-0000-000000000000', false), --change the use_id!!
  ('Write unit tests', '00000000-0000-0000-0000-000000000000', false), --change the use_id!!
  ('Deploy to production', '00000000-0000-0000-0000-000000000000', false); --change the use_id!!