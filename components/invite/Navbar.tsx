"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

export default function Navbar() {
  const pathname = usePathname();
  const isDashboard = pathname?.includes("/boards");

  return (
    <nav className="w-full bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-bold text-violet-600">LinkCollab</span>
        </Link>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {/* Show search only in dashboard context */}
          {isDashboard && (
            <input
              type="text"
              placeholder="Search collections..."
              className="px-3 py-2 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          )}

          {/* Clerk Auth Controls */}
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>

          <SignedOut>
            <SignInButton>
              <button className="text-sm font-medium text-violet-600 hover:underline">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton>
              <button className="text-sm font-medium text-white bg-violet-600 px-3 py-1.5 rounded hover:bg-violet-700">
                Sign Up
              </button>
            </SignUpButton>
          </SignedOut>
        </div>
      </div>
    </nav>
  );
}
