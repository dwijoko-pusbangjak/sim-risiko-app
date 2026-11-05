import { NextResponse } from "next/server";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Berkas tidak ditemukan" }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Target directory: public/uploads/peraturan
    const uploadDir = path.join(process.cwd(), "public", "uploads", "peraturan");
    await mkdir(uploadDir, { recursive: true });

    // Clean filename
    const timestamp = Date.now();
    const cleanOriginalName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniqueFileName = `${timestamp}_${cleanOriginalName}`;
    const filePath = path.join(uploadDir, uniqueFileName);

    // Write file to server
    await writeFile(filePath, buffer);

    // File URL accessible by client
    const fileUrl = `/uploads/peraturan/${uniqueFileName}`;

    return NextResponse.json({
      success: true,
      fileUrl,
      fileName: file.name,
      fileSize: file.size
    });
  } catch (error: any) {
    console.error("Local document upload error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal menyimpan berkas ke server" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { fileUrl } = body;

    if (fileUrl && typeof fileUrl === "string" && fileUrl.startsWith("/uploads/peraturan/")) {
      const fileName = fileUrl.replace("/uploads/peraturan/", "");
      const safeFileName = path.basename(fileName);
      const filePath = path.join(process.cwd(), "public", "uploads", "peraturan", safeFileName);
      
      try {
        await unlink(filePath);
      } catch (err) {
        console.warn("File already removed or not found:", err);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
