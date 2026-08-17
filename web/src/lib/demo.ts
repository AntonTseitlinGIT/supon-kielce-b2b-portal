export function isDemoSession(session: any): boolean {
  if (!session?.user) return false;
  const email = (session.user.email || "").toLowerCase();
  const name = (session.user.name || "").toLowerCase();
  const clientName = (session.user.clientName || "").toLowerCase();
  return (
    email.includes("demo") ||
    name.includes("demo") ||
    clientName.includes("demo") ||
    clientName.includes("prezentacyjna")
  );
}
