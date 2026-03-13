export default function PrivacyContent() {
  return (
    <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed text-[15px]">
      <p>
        This Privacy Policy explains how ShipProof (&quot;ShipProof,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) collects,
        uses, discloses, and safeguards information when you access or use the ShipProof platform,
        website, embeddable widgets, and related services (collectively, the &quot;Service&quot;).
      </p>
      <p>
        If you do not agree with the practices described in this Privacy Policy, please do not use
        the Service.
      </p>

      {/* Summary */}
      <section className="bg-gray-50 border border-gray-200 rounded-lg p-5">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Summary of Key Points</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>We collect only the data necessary to operate a launch content and social proof platform.</li>
          <li>AI-generated content is processed by Anthropic&apos;s Claude API; we store the generated output for your use.</li>
          <li>Social proof content you submit (text, URLs, screenshots) is stored and may be displayed publicly through widgets and Wall pages.</li>
          <li>Payment information is handled entirely by Stripe.</li>
          <li>We do not sell personal data and do not use advertising trackers.</li>
          <li>The Service is intended for U.S.-based users only at this time.</li>
        </ul>
      </section>

      {/* 1 */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Information We Collect</h2>

        <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">
          1.1 Information You Provide to Us
        </h3>
        <p>When you register for or use the Service, we may collect:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>Name</li>
          <li>Email address</li>
          <li>Account preferences and settings</li>
          <li>Communications you send to us (e.g., support emails)</li>
        </ul>
        <p className="mt-2">
          Authentication is provided via Clerk, which acts as our identity provider.
        </p>

        <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">
          1.2 Content You Create and Submit
        </h3>
        <p>
          When you use ShipProof, you create and submit content that we store to provide the Service:
        </p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>Product information (name, URL, description, target audience)</li>
          <li>Launch content drafts and confirmed versions (AI-generated and user-edited text)</li>
          <li>Social proof content (testimonial text, source URLs, screenshots)</li>
          <li>Author information for proofs (name, title, avatar URL)</li>
          <li>Tags, widget configurations, and Wall settings</li>
        </ul>
        <p className="mt-2">
          Social proof that you approve may be displayed publicly through embeddable widgets and
          Wall pages. You control which proofs are displayed.
        </p>

        <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">
          1.3 Usage and Technical Data
        </h3>
        <p>
          We collect usage metadata to operate and improve the Service, including:
        </p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>AI generation counts and timestamps</li>
          <li>Widget and Wall page view counts</li>
          <li>Feature usage patterns</li>
          <li>IP address and user agent (for security and auditing)</li>
        </ul>

        <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">
          1.4 AI-Generated Content
        </h3>
        <p>
          When you use the launch content generator, your product information and launch notes are
          sent to Anthropic&apos;s Claude API to generate platform-specific content. The generated
          content is stored in your account as drafts and versions. Anthropic&apos;s use of data is
          governed by their privacy policy.
        </p>

        <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">
          1.5 Image Storage
        </h3>
        <p>
          Screenshots uploaded as social proof are stored on Cloudflare R2. Images are associated
          with your account and product, and may be displayed publicly through widgets and Wall pages
          if you approve the associated proof.
        </p>

        <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">1.6 Billing Information</h3>
        <p>All payment processing is handled by Stripe.</p>
        <p className="mt-2">We store only:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>Stripe customer ID</li>
          <li>Subscription plan</li>
          <li>Billing status</li>
        </ul>
        <p className="mt-2">We do not store credit card numbers or payment instrument details.</p>
        <p className="mt-2">
          Stripe&apos;s Privacy Policy:{' '}
          <a
            href="https://stripe.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            https://stripe.com/privacy
          </a>
        </p>
      </section>

      {/* 2 */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">2. How We Use Your Information</h2>
        <p>We use collected information to:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>Provide, operate, and maintain the Service</li>
          <li>Authenticate users and manage accounts</li>
          <li>Generate AI-powered launch content on your behalf</li>
          <li>Store and display social proof through widgets and Wall pages</li>
          <li>Process subscriptions and billing</li>
          <li>Enforce plan limits and usage restrictions</li>
          <li>Send service-related notifications</li>
          <li>Improve Service reliability and features</li>
          <li>Detect and prevent fraud, abuse, or security incidents</li>
          <li>Comply with legal obligations</li>
        </ul>
      </section>

      {/* 3 */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          3. Legal Basis for Processing (U.S. Users)
        </h2>
        <p>We process personal information based on:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>Performance of a contract (providing the Service)</li>
          <li>Legitimate business interests (security, billing, analytics)</li>
          <li>Legal compliance obligations</li>
        </ul>
        <p className="mt-2">
          ShipProof does not currently market or target users in the European Union.
        </p>
      </section>

      {/* 4 */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Sharing of Information</h2>
        <p>We share information only in the following limited circumstances:</p>

        <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">Service Providers</h3>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li><strong>Clerk</strong> — authentication and user identity</li>
          <li><strong>Stripe</strong> — subscription billing and payments</li>
          <li><strong>Anthropic</strong> — AI content generation (Claude API)</li>
          <li><strong>Cloudflare</strong> — image storage (R2) and CDN</li>
          <li><strong>Railway / Vercel</strong> — hosting and infrastructure</li>
        </ul>

        <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">Public Display</h3>
        <p>
          Social proof content you approve is displayed publicly through widgets and Wall pages.
          This is a core feature of the Service and is under your control — you choose which proofs
          to approve and display.
        </p>

        <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">Legal Requirements</h3>
        <p>
          We may disclose information if required by law, subpoena, court order, or governmental
          request.
        </p>

        <p className="mt-4 font-medium">
          We do not sell personal information and do not share data with advertisers.
        </p>
      </section>

      {/* 5 */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          5. Cookies and Tracking Technologies
        </h2>
        <p>
          We use essential cookies only, primarily for authentication and session management via
          Clerk.
        </p>
        <p className="mt-2">We do not use:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>Advertising cookies</li>
          <li>Cross-site tracking</li>
          <li>Behavioral profiling</li>
        </ul>
        <p className="mt-2">
          We do not respond to &quot;Do Not Track&quot; signals, as there is no consistent industry standard.
        </p>
      </section>

      {/* 6 */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Data Retention</h2>
        <p>We retain information only as long as necessary to provide the Service:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>Product, proof, and launch content data: retained while your account is active</li>
          <li>Uploaded images: retained while the associated proof exists</li>
          <li>Account data: retained while your account is active</li>
        </ul>
        <p className="mt-2">
          Upon account deletion, personal data and content are removed within 30 days, unless
          retention is required by law or legitimate business purposes.
        </p>
      </section>

      {/* 7 */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Your Rights</h2>
        <p>Depending on your jurisdiction, you may have the right to:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>Access your personal information</li>
          <li>Correct inaccurate information</li>
          <li>Request deletion of your personal data</li>
          <li>Export your content data</li>
          <li>Restrict certain processing activities</li>
        </ul>
        <p className="mt-2">
          Requests may be submitted to{' '}
          <a
            href="mailto:support@shipproof.io"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            support@shipproof.io
          </a>.
          We may require identity verification before fulfilling requests.
        </p>
      </section>

      {/* 8 */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Children&apos;s Privacy</h2>
        <p>The Service is not intended for individuals under 16 years of age.</p>
        <p className="mt-2">
          We do not knowingly collect personal information from children. If such data is discovered,
          it will be deleted promptly.
        </p>
      </section>

      {/* 9 */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">9. International Data Transfers</h2>
        <p>ShipProof is hosted in the United States.</p>
        <p className="mt-2">
          By using the Service, you acknowledge that your data will be processed and stored in the
          United States.
        </p>
      </section>

      {/* 10 */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Security Measures</h2>
        <p>We implement industry-standard safeguards, including:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>Encrypted data transmission (HTTPS)</li>
          <li>Secure authentication via Clerk</li>
          <li>Payment data handled exclusively by Stripe (PCI-compliant)</li>
          <li>Image storage on Cloudflare R2 with access controls</li>
          <li>Structured logging for security monitoring</li>
        </ul>
        <p className="mt-2">
          No system is 100% secure, but we continuously improve our security posture.
        </p>
      </section>

      {/* 11 */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          11. Changes to This Privacy Policy
        </h2>
        <p>We may update this Privacy Policy periodically.</p>
        <p className="mt-2">
          Material changes will be posted on this page with an updated &quot;Last updated&quot; date.
        </p>
        <p className="mt-2">
          Continued use of the Service constitutes acceptance of the updated policy.
        </p>
      </section>

      {/* 12 */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Contact Information</h2>
        <p>
          If you have questions or concerns regarding this Privacy Policy, please contact:
        </p>
        <p className="mt-2">
          Email:{' '}
          <a
            href="mailto:support@shipproof.io"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            support@shipproof.io
          </a>
        </p>
        <p>
          Website:{' '}
          <a
            href="https://shipproof.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            https://shipproof.io
          </a>
        </p>
      </section>
    </div>
  )
}
