# 기록 삭제 실패 시 알림 없음

- 증상: `lib/records/actions.ts`의 `deleteRecord`가 Supabase 삭제 결과를 확인하지 않는다. 세션 만료나 네트워크 오류로 삭제가 실패해도 화면에 아무 안내 없이 기록이 그대로 남는다.
- 근거: 작업 01 코드 리뷰(`code-review low`) 지적. 정상 경로의 삭제는 실행 중인 앱에서 동작을 확인했다.
- 다음 단계: 삭제 결과의 `error`를 확인해 사용자에게 실패를 알린다(삭제 폼을 `useActionState`로 바꾸는 등).
