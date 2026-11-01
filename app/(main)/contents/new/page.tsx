import { ContentForm } from "@/lib/contents/content-form";

export default function NewContentPage() {
  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">콘텐츠 직접 추가</h1>
        <p className="text-sm text-muted-foreground">
          추가한 콘텐츠는 나만 찾고 기록할 수 있어요.
        </p>
      </div>
      <ContentForm />
    </>
  );
}
