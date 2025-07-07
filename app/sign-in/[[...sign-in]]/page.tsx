import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950">
      <SignIn path="/sign-up" routing="path" signInUrl="/sign-in" />
    </div>
  );
}
