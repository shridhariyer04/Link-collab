// app/onboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

interface OnboardResponse {
  onboard: boolean;
  message: string;
  boardId?: string;
  userCreated: boolean;
  hasInvite: boolean;
  invitesProcessed?: number;
}

export default function OnboardPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [status, setStatus] = useState("Setting things up for you...");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Wait for Clerk to load user data
    if (!isLoaded) return;

    const onboard = async () => {
      try {
        setStatus("Creating your account...");
        
        const res = await fetch("/api/onboard-user", { 
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Onboarding failed");
        }

        const data: OnboardResponse = await res.json();
        console.log("Onboard response:", data);

        // Update status based on response
        if (data.userCreated) {
          setStatus("Account created successfully!");
        } else if (data.hasInvite) {
          if (data.invitesProcessed && data.invitesProcessed > 1) {
            setStatus(`Great! You've been added to ${data.invitesProcessed} boards. Redirecting...`);
          } else {
            setStatus("Welcome! Redirecting to your board...");
          }
        } else {
          setStatus("Account setup complete!");
        }

        // Small delay to show success message
        setTimeout(() => {
          if (data.boardId) {
            // Redirect to the specific board they were invited to
            router.push(`/boards/${data.boardId}/collections`);
          } else {
            // Redirect to boards list
            router.push("/boards");
          }
        }, 2000);

      } catch (err) {
        console.error("Onboarding failed:", err);
        setError(err instanceof Error ? err.message : "Something went wrong");
        setIsLoading(false);
        
        // Still redirect to boards page after showing error
        setTimeout(() => {
          router.push("/boards");
        }, 3000);
      }
    };

    onboard();
  }, [router, isLoaded]);

  // Show loading while Clerk loads
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Loading...</h2>
          <p className="text-gray-600 text-sm">Please wait while we load your account...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Setup Issue</h2>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <p className="text-gray-500 text-xs">Redirecting to boards page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Getting Ready</h2>
          <p className="text-gray-600 text-sm">{status}</p>
        </div>
        
        {isLoading && (
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
            </div>
            <p className="text-xs text-gray-500">Please wait while we set up your account...</p>
          </div>
        )}
      </div>
    </div>
  );
}