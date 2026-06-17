import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey || supabaseServiceKey === "your_supabase_service_key_here") {
  console.warn(
    "[WARN] SUPABASE_URL or SUPABASE_SERVICE_KEY not set. Auth middleware will reject all requests. " +
    "Add these to backend/.env to enable auth and DB persistence."
  );
}

export const supabaseAdmin = createClient(
  supabaseUrl ?? "https://placeholder.supabase.co",
  supabaseServiceKey ?? "placeholder",
  {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { transport: WebSocket as unknown as typeof WebSocket },
  }
);

export async function verifyToken(token: string) {
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}
