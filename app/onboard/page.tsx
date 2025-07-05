"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OnboardPage() {
  const router = useRouter();

  useEffect(() => {
    const onboard = async () => {
      try {
        const res = await fetch("/api/onboard-user", { method: "POST" });
        const data = await res.json();

        console.log("Onboard response:", data);

        // Optional: redirect to the board if available
        if (data.boardId) {
          router.push(`/boards/${data.boardId}/collections`);
        } else {
          router.push("/boards");
        }
      } catch (err) {
        console.error("Onboarding failed:", err);
        router.push("/boards"); // fallback
      }
    };

    onboard();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-600 text-sm">Setting things up for you...</p>
    </div>
  );
}
