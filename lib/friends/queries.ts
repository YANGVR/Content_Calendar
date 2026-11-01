import { createClient } from "@/lib/supabase/server";
import { currentUserId } from "@/lib/supabase/user";

export type FriendProfile = {
  id: string;
  username: string;
  nickname: string;
  is_public: boolean;
};

export type Friendship = {
  id: string;
  status: "pending" | "accepted";
  // "incoming" when the other person sent the request.
  direction: "incoming" | "outgoing";
  other: FriendProfile;
};

// The signed-in user's friendships and requests, with the other person's profile.
export async function listFriendships() {
  const me = await currentUserId();
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("friendships")
    .select("id, requester_id, addressee_id, status")
    .order("created_at", { ascending: false })
    .returns<{ id: string; requester_id: string; addressee_id: string; status: Friendship["status"] }[]>();
  if (error) throw error;

  const otherIds = rows.map((r) => (r.requester_id === me ? r.addressee_id : r.requester_id));
  const { data: profiles, error: profileError } = otherIds.length
    ? await supabase
        .from("profiles")
        .select("id, username, nickname, is_public")
        .in("id", otherIds)
        .returns<FriendProfile[]>()
    : { data: [] as FriendProfile[], error: null };
  if (profileError) throw profileError;
  const byId = new Map(profiles.map((p) => [p.id, p]));

  const friendships: Friendship[] = [];
  for (const row of rows) {
    const otherId = row.requester_id === me ? row.addressee_id : row.requester_id;
    const other = byId.get(otherId);
    if (!other) continue;
    friendships.push({
      id: row.id,
      status: row.status,
      direction: row.requester_id === me ? "outgoing" : "incoming",
      other,
    });
  }
  return {
    friends: friendships.filter((f) => f.status === "accepted"),
    incoming: friendships.filter((f) => f.status === "pending" && f.direction === "incoming"),
    outgoing: friendships.filter((f) => f.status === "pending" && f.direction === "outgoing"),
  };
}

// An accepted friend by login ID, or null when there is no such friendship.
export async function getFriend(username: string) {
  const { friends } = await listFriendships();
  return friends.find((f) => f.other.username === username)?.other ?? null;
}
