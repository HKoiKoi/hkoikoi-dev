import { PostEditor } from "@/app/admin/posts/edit/_components/post-editor";

export default function AdminPostEditPage() {
  return (
    <main className="grid gap-6">
      <h1 className="text-2xl font-semibold">글 작성</h1>
      <PostEditor />
    </main>
  );
}
