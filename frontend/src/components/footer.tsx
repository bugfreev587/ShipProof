import { LogoIcon } from "@/components/Logo";

export function Footer() {
  return (
    <footer className="border-t border-[#2A2A30] pt-12 pb-8">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <LogoIcon className="w-6 h-6" />
              <span className="text-[#F1F1F3] font-semibold text-sm">ShipProof</span>
            </div>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              Turn every launch into lasting social proof.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-[#6B7280]">
              <li><a href="/#features" className="hover:text-[#F1F1F3] transition-colors">Features</a></li>
              <li><a href="/#pricing" className="hover:text-[#F1F1F3] transition-colors">Pricing</a></li>
              <li><a href="/#faq" className="hover:text-[#F1F1F3] transition-colors">FAQ</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3">Legal</h4>
            <ul className="space-y-2 text-sm text-[#6B7280]">
              <li><a href="/terms" className="hover:text-[#F1F1F3] transition-colors">Terms of Service</a></li>
              <li><a href="/privacy" className="hover:text-[#F1F1F3] transition-colors">Privacy Policy</a></li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3">Connect</h4>
            <ul className="space-y-2 text-sm text-[#6B7280]">
              <li><a href="https://x.com/AlexW0730" target="_blank" rel="noopener noreferrer" className="hover:text-[#F1F1F3] transition-colors">Twitter / X</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#2A2A30] pt-6 text-center text-xs text-[#6B7280]">
          &copy; {new Date().getFullYear()} ShipProof. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
