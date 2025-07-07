// app/layout.tsx
import { type Metadata } from 'next'
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'LinkCollab',
  description: 'Modern collaborative board management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/onboard"
      afterSignUpUrl="/onboard"
    >
      <html lang="en" className="dark">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-950 text-white`}
        >
          {/* Navbar */}
          <nav className="w-full bg-gray-900 border-b border-gray-800 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-violet-400">
                  LinkCollab
                </span>
              </div>
              <div className="flex items-center gap-4">
                <SignedOut>
                  <SignInButton>
                    <button className="text-sm text-violet-400 font-medium hover:text-violet-300 transition-colors">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton>
                    <button className="bg-violet-600 text-white rounded-md font-medium text-sm h-9 px-4 hover:bg-violet-700 transition-colors">
                      Sign Up
                    </button>
                  </SignUpButton>
                </SignedOut>

                <SignedIn>
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
              </div>
            </div>
          </nav>

          {/* Page Content */}
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
