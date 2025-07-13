import cloudinary from "@/lib/cloudinary";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Log request start
    console.log('Upload request received');
    
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      console.log('No file provided in request');
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    console.log('File received:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      console.log('File too large:', file.size);
      return NextResponse.json({ error: "File size must be less than 10MB" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log('Buffer created, size:', buffer.length);

    // Upload to Cloudinary
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { 
            resource_type: "auto",
            folder: "uploads", // Optional: organize uploads in folders
            unique_filename: true,
            use_filename: true
          }, 
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              reject(error);
            } else {
              console.log('Cloudinary upload success:', result?.public_id);
              resolve(result);
            }
          }
        )
        .end(buffer);
    });

    console.log('Upload completed successfully');
    return NextResponse.json({ 
      url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      resource_type: result.resource_type
    });

  } catch (error) {
    console.error("Upload Error:", error);
    
    // Return more specific error messages
    if (error instanceof Error) {
      return NextResponse.json({ 
        error: `Upload failed: ${error.message}` 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: "Upload failed due to an unexpected error" 
    }, { status: 500 });
  }
}