import { SignIn } from "@clerk/nextjs";
import { LogoFull } from "@/components/Logo";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0F0F10]">
      <div className="mb-8">
        <LogoFull size={36} />
      </div>
      <SignIn />
    </div>
  );
}
