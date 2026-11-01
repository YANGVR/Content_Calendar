"use client";

import { useActionState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

import { deleteContent, type DeleteContentState } from "./actions";

// Delete button for a hand-added content, with a confirmation dialog since
// its records and thumbnail are deleted too.
export function DeleteContentButton({
  contentId,
  title,
}: {
  contentId: string;
  title: string;
}) {
  const [state, formAction, pending] = useActionState<DeleteContentState>(
    deleteContent.bind(null, contentId),
    {},
  );
  const formId = `delete-content-${contentId}`;

  return (
    <>
      <form id={formId} action={formAction} hidden />
      <AlertDialog>
        <AlertDialogTrigger
          render={<Button variant="outline" size="sm" />}
        >
          삭제
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{`'${title}'을(를) 삭제할까요?`}</AlertDialogTitle>
            <AlertDialogDescription>
              이 콘텐츠의 시청 기록과 섬네일도 함께 삭제되고, 되돌릴 수 없어요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              type="submit"
              form={formId}
              variant="destructive"
              disabled={pending}
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
