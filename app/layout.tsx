// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      // Configure Clerk to redirect to onboard after sign-up/sign-in
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/onboard"
      afterSignUpUrl="/onboard"
    >
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}