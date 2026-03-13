import type { Metadata } from "next";
import Link from "next/link";
import TermsContent from "@/components/legal/TermsContent";

export const metadata: Metadata = {
  title: "Terms of Service — ShipProof",
  description: "ShipProof Terms of Service",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-200">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <Link href="/" className="text-lg font-bold text-gray-900">
            ShipProof
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          Terms of Service
        </h1>
        <p className="mb-10 text-sm text-gray-500">Last updated: March 12, 2026</p>
        <TermsContent />
      </main>

      <footer className="border-t border-gray-200 py-6">
        <div className="mx-auto max-w-4xl px-4 flex items-center justify-between text-sm text-gray-500">
          <span>&copy; 2026 ShipProof</span>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-gray-900">
              Terms of Service
            </Link>
            <Link href="/privacy" className="hover:text-gray-900">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
