import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import type { UploadApiResponse } from "cloudinary";
import sharp from "sharp";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as "before" | "after" | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Determine target folder based on type
    const folder = type === "after" ? "robocool/after" : "robocool/before";

    // Read the file buffer
    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    // Compress & convert image to WebP using sharp
    // Also auto-rotate based on EXIF and cap max resolution to 1920px
    const webpBuffer = await sharp(inputBuffer)
      .rotate()
      .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const base64Data = `data:image/webp;base64,${webpBuffer.toString("base64")}`;

    // Upload to Cloudinary with format: "webp"
    const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader.upload(
        base64Data,
        {
          folder: folder,
          format: "webp",
          resource_type: "image",
        },
        (error, result) => {
          if (error || !result) reject(error);
          else resolve(result);
        }
      );
    });

    return NextResponse.json({
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      folder: uploadResult.folder,
      format: uploadResult.format,
      bytes: uploadResult.bytes,
    });
  } catch (error: any) {
    console.error("Cloudinary upload failed:", error);
    return NextResponse.json(
      { error: error?.message || "Upload failed" },
      { status: 500 }
    );
  }
}
