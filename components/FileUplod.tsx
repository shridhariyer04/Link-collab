"use client";

import { useState } from "react";

export default function FileUpload({ onUpload }: { onUpload: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);

    const res = await fetch("/api/upload/cloudinary", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setUploading(false);

    if (data.url) {
      onUpload(data.url);
    } else {
      alert("Upload failed");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input type="file" onChange={handleFileChange} />
      {uploading && <p>Uploading...</p>}
    </div>
  );
}
