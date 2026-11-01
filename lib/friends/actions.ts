"use server";

import { revalidatePath } from "next/cache";

import { normalizeUsername } from "@/lib/auth/username";
import { createClient } from "@/lib/supabase/server";
import { currentUserId } from "@/lib/supabase/user";

export type FriendRequestState = { error?: string; sentTo?: string };

export async function sendFriendRequest(
  _prev: FriendRequestState,
  formData: FormData,
): Promise<FriendRequestState> {
  const username = normalizeUsername(String(formData.get("username") ?? ""));
  if (!username) return { error: "친구의 아이디를 입력해 주세요." };

  const me = await currentUserId();
  const supabase = await createClient();
  const { data: found, error: findError } = await supabase.rpc(
    "find_profile_by_username",
    { target: username },
  );
  if (findError) return { error: `찾지 못했습니다. (${findError.message})` };
  const target = (found as { id: string; nickname: string }[] | null)?.[0];
  if (!target) return { error: "그 아이디를 쓰는 사용자가 없어요." };
  if (target.id === me) return { error: "자기 자신에게는 요청할 수 없어요." };

  const { error } = await supabase
    .from("friendships")
    .insert({ addressee_id: target.id });
  if (error?.code === "23505") {
    return { error: "이미 친구이거나 요청이 오가는 중이에요. 아래 목록을 확인해 주세요." };
  }
  if (error) return { error: `요청하지 못했습니다. (${error.message})` };

  revalidatePath("/friends");
  return { sentTo: target.nickname };
}

export async function acceptFriendRequest(friendshipId: string) {
  const supabase = await createClient();
  await supabase.from("friendships").update({ status: "accepted" }).eq("id", friendshipId);
  revalidatePath("/friends");
}

// Rejects or cancels a request, or removes a friend: all delete the row.
export async function removeFriendship(friendshipId: string) {
  const supabase = await createClient();
  await supabase.from("friendships").delete().eq("id", friendshipId);
  revalidatePath("/friends");
}
