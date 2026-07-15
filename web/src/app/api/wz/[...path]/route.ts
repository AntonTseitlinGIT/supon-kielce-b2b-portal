import { auth } from "@/lib/auth";
import { isSuponRole } from "@/config/permissions.config";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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

  const { path } = await params;
  const storagePath = path.join("/");

  // Ownership validation for client-portal users to prevent BOLA (Broken Object Level Authorization)
  if (!isSuponRole(session.user.role)) {
    const pdfUrl = `/api/wz/${storagePath}`;
    const wzDoc = await prisma.wzDocument.findFirst({
      where: { pdfUrl },
      select: { clientId: true, branchId: true }
    });

    if (!wzDoc) {
      return NextResponse.json({ error: "Nie znaleziono dokumentu." }, { status: 404 });
    }

    if (wzDoc.clientId !== session.user.clientId) {
      return NextResponse.json({ error: "Brak dostępu do tego dokumentu." }, { status: 403 });
    }

    if (session.user.role === "BRANCH_HEAD" && wzDoc.branchId !== session.user.branchId) {
      return NextResponse.json({ error: "Brak dostępu do dokumentów tego oddziału." }, { status: 403 });
    }
  }


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
