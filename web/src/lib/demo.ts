export function isDemoSession(session: any): boolean {
  if (!session?.user) return false;
  const email = (session.user.email || "").toLowerCase();
  const name = (session.user.name || "").toLowerCase();
  return email.includes("demo") || name.includes("demo");
}
