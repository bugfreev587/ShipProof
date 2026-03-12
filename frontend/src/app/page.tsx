import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0F0F10] p-8 text-center">
      <h1 className="mb-2 text-4xl font-bold text-[#F1F1F3]">
        <span>Ship</span>
        <span className="text-[#6366F1]">Proof</span>
      </h1>
      <p className="mb-8 text-lg text-[#9CA3AF]">
        Turn every launch into lasting social proof
      </p>
      <div className="flex gap-4">
        <a
          href="/sign-up"
          className="rounded-lg bg-[#6366F1] px-6 py-3 font-medium text-white hover:bg-[#818CF8] transition-colors"
        >
          Get Started Free
        </a>
        <a
          href="/sign-in"
          className="rounded-lg border border-[#2A2A30] px-6 py-3 font-medium text-[#F1F1F3] hover:bg-[#2A2A30] transition-colors"
        >
          Sign In
        </a>
      </div>
    </div>
  );
}
