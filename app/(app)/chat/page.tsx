import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { ChatShell } from "@/components/chat/chat-shell";

export default async function ChatPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const db = getDb();
  const tenantDocuments = await db
    .select({
      id: documents.id,
      title: documents.title,
      sectionRef: documents.sectionRef,
      status: documents.status,
      allowedRoles: documents.allowedRoles,
    })
    .from(documents)
    .where(eq(documents.tenantId, session.tenantId));

  const visibleDocuments = tenantDocuments.filter((doc) =>
    doc.allowedRoles.includes(session.role),
  );

  return <ChatShell session={session} documents={visibleDocuments} />;
}
