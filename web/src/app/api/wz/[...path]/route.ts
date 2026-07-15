import { auth } from "@/lib/auth";
import { isSuponRole } from "@/config/permissions.config";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getStorageClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Supabase storage not configured");
  return createClient(url, serviceKey);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSuponRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { path } = await params;
  // path[0] is "wz", rest is the filename — reconstruct storage path
  const storagePath = path.join("/");

  try {
    const supabase = getStorageClient();

    // Generate a short-lived signed URL (60 seconds — enough for browser to start download)
    const { data, error } = await supabase.storage
      .from("wz-documents")
      .createSignedUrl(storagePath, 60);

    if (error || !data?.signedUrl) {
      console.error("Failed to generate signed URL:", error);
      return NextResponse.json({ error: "Nie można otworzyć pliku." }, { status: 404 });
    }

    return NextResponse.redirect(data.signedUrl);
  } catch (err) {
    console.error("WZ download error:", err);
    return NextResponse.json({ error: "Błąd serwera." }, { status: 500 });
  }
}
