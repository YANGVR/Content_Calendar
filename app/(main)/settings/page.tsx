import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signOut } from "@/lib/auth/actions";
import { NicknameForm } from "@/lib/profile/nickname-form";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  // getClaims verifies the token; never authorize from getSession on the server.
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, nickname")
    .eq("id", userId)
    .single();

  return (
    <>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            <h1>설정</h1>
          </CardTitle>
          <CardDescription>
            아이디 <span className="font-medium text-foreground">{profile?.username}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <NicknameForm nickname={profile?.nickname ?? ""} />
          <form action={signOut}>
            <Button type="submit" variant="outline">
              로그아웃
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
