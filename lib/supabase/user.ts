import { createClient } from "./server";

// The signed-in user's id from the verified token. Friends can read some of
// each other's rows, so "my" queries filter by this id explicitly instead of
// relying on row-level security alone.
export async function currentUserId() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) throw new Error("Not signed in");
  return userId;
}
