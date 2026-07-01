import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

export type AdminContext = {
  userId: string;
  email: string | undefined;
  supabaseAdmin: SupabaseClient;
};

export async function requireAdmin(req: Request): Promise<
  | { ok: true; ctx: AdminContext }
  | { ok: false; response: Response }
> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "not_authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "server_misconfigured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "not_authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (profileError || profile?.role !== "admin") {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }

  return {
    ok: true,
    ctx: {
      userId: userData.user.id,
      email: userData.user.email,
      supabaseAdmin,
    },
  };
}

export async function writeAuditLog(
  supabaseAdmin: SupabaseClient,
  entry: {
    adminId: string;
    action: string;
    targetUserId?: string | null;
    metadata?: Record<string, unknown>;
  },
) {
  await supabaseAdmin.from("admin_audit_log").insert({
    admin_id: entry.adminId,
    action: entry.action,
    target_user_id: entry.targetUserId ?? null,
    metadata: entry.metadata ?? {},
  });
}
