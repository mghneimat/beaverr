-- Allow users to delete their own coach chat threads (messages/runs cascade).

create policy advice_threads_delete_own on public.advice_threads
  for delete to authenticated
  using (auth.uid() = user_id);
