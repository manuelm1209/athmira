alter table public.admin_audit_logs
drop constraint if exists admin_audit_logs_action_check;

alter table public.admin_audit_logs
add constraint admin_audit_logs_action_check
check (
  action in (
    'create_user',
    'grant_admin',
    'revoke_admin',
    'set_temporary_password',
    'update_user_profile'
  )
);
