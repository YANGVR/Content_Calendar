import Link from "next/link";
import { UsersIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { acceptFriendRequest, removeFriendship } from "@/lib/friends/actions";
import { listFriendships, type Friendship } from "@/lib/friends/queries";
import { FriendRequestForm } from "@/lib/friends/request-form";

export default async function FriendsPage() {
  const { friends, incoming, outgoing } = await listFriendships();

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">친구</h1>
        <p className="text-sm text-muted-foreground">
          아이디로 친구 요청을 보내고, 수락하면 서로의 시청 기록을 볼 수 있어요.
        </p>
      </div>

      <FriendRequestForm />

      {incoming.length > 0 && (
        <Section title={`받은 요청 ${incoming.length}`}>
          {incoming.map((f) => (
            <FriendRow key={f.id} friendship={f}>
              <form action={acceptFriendRequest.bind(null, f.id)}>
                <Button type="submit" size="sm">수락</Button>
              </form>
              <form action={removeFriendship.bind(null, f.id)}>
                <Button type="submit" size="sm" variant="outline">거절</Button>
              </form>
            </FriendRow>
          ))}
        </Section>
      )}

      {outgoing.length > 0 && (
        <Section title={`보낸 요청 ${outgoing.length}`}>
          {outgoing.map((f) => (
            <FriendRow key={f.id} friendship={f} note="수락을 기다리는 중">
              <form action={removeFriendship.bind(null, f.id)}>
                <Button type="submit" size="sm" variant="outline">취소</Button>
              </form>
            </FriendRow>
          ))}
        </Section>
      )}

      <Section title={`친구 ${friends.length}`}>
        {friends.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <UsersIcon />
              </EmptyMedia>
              <EmptyTitle>아직 친구가 없어요</EmptyTitle>
              <EmptyDescription>위에서 친구의 아이디로 요청을 보내 보세요.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          friends.map((f) => (
            <FriendRow key={f.id} friendship={f} href={`/friends/${f.other.username}`}>
              <form action={removeFriendship.bind(null, f.id)}>
                <Button type="submit" size="sm" variant="outline">친구 삭제</Button>
              </form>
            </FriendRow>
          ))
        )}
      </Section>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      <ul className="flex flex-col divide-y">{children}</ul>
    </section>
  );
}

function FriendRow({
  friendship,
  href,
  note,
  children,
}: {
  friendship: Friendship;
  href?: string;
  note?: string;
  children: React.ReactNode;
}) {
  const { other } = friendship;
  const name = (
    <div className="flex min-w-0 flex-col">
      <span className="truncate font-medium">{other.nickname}</span>
      <span className="text-sm text-muted-foreground">
        @{other.username}
        {note && ` · ${note}`}
      </span>
    </div>
  );
  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div className="flex min-w-0 items-center gap-2">
        {href ? (
          <Link href={href} className="min-w-0 hover:underline">
            {name}
          </Link>
        ) : (
          name
        )}
        {friendship.status === "accepted" && !other.is_public && (
          <Badge variant="secondary">비공개</Badge>
        )}
      </div>
      <div className="flex shrink-0 gap-2">{children}</div>
    </li>
  );
}
