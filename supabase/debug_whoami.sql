create or replace function public.debug_whoami()
returns table(cur_role text, sess_role text, jwt_claims text)
language sql security invoker as $$
  select current_user::text, session_user::text,
         coalesce(current_setting('request.jwt.claims', true), 'none');
$$;

grant execute on function public.debug_whoami() to public;
