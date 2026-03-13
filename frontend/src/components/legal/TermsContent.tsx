import Link from 'next/link'

export default function TermsContent() {
  return (
    <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed text-[15px]">
      <p>
        These Terms of Service (&quot;Terms&quot;) are a legally binding agreement between you (&quot;you&quot;,
        &quot;Customer&quot;) and ShipProof (&quot;ShipProof&quot;, &quot;we&quot;, &quot;us&quot;, &quot;our&quot;) governing your access to and use
        of the ShipProof website, dashboard, embeddable widgets, and related services (collectively, the
        &quot;Service&quot;).
      </p>
      <p>If you do not agree to these Terms, you may not use the Service.</p>

      {/* 1 */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Agreement to Terms</h2>
        <p>
          By accessing or using the Service, you acknowledge that you have read, understood, and
          agree to be bound by these Terms and any policies referenced herein, including our{' '}
          <Link href="/privacy" className="text-blue-600 hover:text-blue-800 underline">
            Privacy Policy
          </Link>.
        </p>
        <p className="mt-2">
          We may update these Terms from time to time. We will update the &quot;Last updated&quot; date. Your
          continued use of the Service after changes become effective constitutes acceptance of the
          updated Terms.
        </p>
      </section>

      {/* 2 */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Eligibility</h2>
        <p>
          You must be at least 18 years old and have the legal capacity to enter into these Terms.
          If you use the Service on behalf of an entity, you represent that you have authority to
          bind that entity to these Terms.
        </p>
      </section>

      {/* 3 */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">3. The Service (What ShipProof Does)</h2>
        <p>
          ShipProof is a launch content and social proof platform that helps indie hackers and
          startups generate AI-powered launch copy, collect community feedback, and display
          testimonials on their websites through embeddable widgets and public Wall pages.
        </p>
        <p className="mt-2">Core capabilities include:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>AI-powered launch content generation for Product Hunt, Reddit, Hacker News, Twitter/X, and IndieHackers</li>
          <li>Social proof collection (text, URL, screenshot)</li>
          <li>Embeddable widget for displaying proofs on external websites</li>
          <li>Public Wall of Proof pages</li>
          <li>Tag-based organization and version history</li>
        </ul>
        <p className="mt-2">
          <strong>Important:</strong> ShipProof uses third-party AI services (Anthropic Claude API) to generate
          launch content. AI-generated content is produced by the third-party AI provider and should be
          reviewed and edited by you before publishing. ShipProof does not guarantee the accuracy,
          appropriateness, or effectiveness of AI-generated content.
        </p>
      </section>

      {/* 4 */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Account Registration and Security</h2>
        <p>
          You may be required to create an account (e.g., via our authentication provider Clerk).
          You agree to provide accurate, current, and complete information and to keep it updated.
        </p>
        <p className="mt-2">You are responsible for:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>Maintaining the confidentiality of your credentials</li>
          <li>All activity occurring under your account</li>
          <li>Any content you publish or embed using the Service</li>
        </ul>
        <p className="mt-2">
          You must promptly notify us of any suspected unauthorized access or security breach.
        </p>
      </section>

      {/* 5 */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Subscription Plans, Fees, and Payment</h2>
        <p>
          ShipProof offers Free, Pro, and Business plans. Plan features, limits, and pricing are
          described on our website and may change over time.
        </p>

        <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">5.1 Payment Processor</h3>
        <p>
          Paid subscriptions are billed through Stripe. By subscribing, you authorize ShipProof
          (through Stripe) to charge your selected payment method on a recurring basis until you
          cancel or your subscription ends.
        </p>

        <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">5.2 Taxes</h3>
        <p>
          Prices are listed in U.S. dollars unless otherwise stated. We may collect applicable taxes
          (e.g., sales tax/VAT) when required.
        </p>

        <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">5.3 Upgrades, Downgrades, and Proration</h3>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>
            Upgrades may take effect immediately and may be prorated depending on plan configuration
            and Stripe settings.
          </li>
          <li>
            Downgrades generally take effect at the end of the current billing period unless
            explicitly stated otherwise in the dashboard.
          </li>
          <li>
            If a downgrade reduces your allowed quotas (e.g., number of products, proofs, or wall pages),
            you may be required to remove or disable resources above the new plan limits before the
            downgrade can complete.
          </li>
        </ul>

        <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">5.4 Cancellation</h3>
        <p>
          You may cancel a paid subscription at any time through your account settings (or by
          contacting us). Unless required by law, we do not provide refunds for partial billing
          periods.
        </p>
      </section>

      {/* 6 */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Acceptable Use</h2>
        <p>You agree not to use the Service to:</p>
        <ol className="list-decimal pl-6 mt-2 space-y-1">
          <li>Violate any law, regulation, or third-party rights</li>
          <li>Circumvent, disable, or interfere with security or access controls</li>
          <li>Post or embed false, misleading, or fabricated testimonials or reviews</li>
          <li>
            Reverse engineer, decompile, or attempt to extract source code except where prohibited
            by law
          </li>
          <li>
            Introduce malware, abuse traffic, spam, or automated requests that degrade service
            integrity
          </li>
          <li>
            Evade plan limits, usage restrictions, or billing controls
          </li>
          <li>
            Use AI-generated content to harass, defame, or mislead others
          </li>
          <li>
            Use the Service to compete with ShipProof using non-public information
          </li>
          <li>
            Harvest or scrape the dashboard, widgets, or APIs in a manner that imposes unreasonable load
          </li>
        </ol>
        <p className="mt-2">
          We may suspend or terminate access if we believe you are violating these Terms.
        </p>
      </section>

      {/* 7 */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">7. User Content and Social Proof</h2>

        <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">7.1 Content You Submit</h3>
        <p>
          You may submit text, URLs, screenshots, and other content (&quot;User Content&quot;) to the Service
          as social proof or launch content. You represent that you have the right to use and display
          such content.
        </p>

        <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">7.2 Public Display</h3>
        <p>
          Social proof you approve may be displayed publicly through embeddable widgets and Wall pages.
          You are solely responsible for ensuring that displayed content is accurate, not misleading,
          and does not violate any third-party rights. You should obtain appropriate consent before
          publicly displaying another person&apos;s name, likeness, or testimonial.
        </p>

        <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">7.3 AI-Generated Content</h3>
        <p>
          Launch content generated by the AI feature is produced by third-party AI providers and
          provided as a starting point. You are responsible for reviewing, editing, and verifying
          all AI-generated content before publishing it on any platform. ShipProof does not guarantee
          the accuracy or suitability of AI-generated content.
        </p>
      </section>

      {/* 8 */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Data, Logging, and Privacy</h2>
        <p>
          ShipProof collects and processes data necessary to operate the Service, including:
        </p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>Account information and preferences</li>
          <li>Products, proofs, tags, and launch content you create</li>
          <li>Widget and Wall configuration and usage data</li>
          <li>AI generation metadata (token counts, timestamps)</li>
        </ul>
        <p className="mt-2">
          You retain ownership of your data. We do not claim ownership over your content, proofs,
          or business data.
        </p>
        <p className="mt-2">
          For details on how we collect and process data, see our{' '}
          <Link href="/privacy" className="text-blue-600 hover:text-blue-800 underline">
            Privacy Policy
          </Link>.
        </p>
      </section>

      {/* 9 */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Third-Party Services</h2>
        <p>
          The Service integrates with third-party services (e.g., Clerk for authentication, Stripe
          for payments, Anthropic for AI content generation, Cloudflare for storage). Your use of
          third-party services is subject to their respective terms and privacy policies. ShipProof
          does not control and is not responsible for third-party services&apos; availability, security,
          or practices.
        </p>
      </section>

      {/* 10 */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Intellectual Property</h2>
        <p>
          The Service (including software, design, text, and logos) is owned by ShipProof or its
          licensors and is protected by intellectual property laws. Subject to these Terms, ShipProof
          grants you a limited, non-exclusive, non-transferable license to access and use the Service
          for your internal business purposes.
        </p>
        <p className="mt-2">
          You may not copy, modify, distribute, sell, or lease any part of the Service except as
          expressly permitted by these Terms.
        </p>
      </section>

      {/* 11 */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Feedback</h2>
        <p>
          If you provide feedback, ideas, or suggestions, you grant ShipProof a perpetual, worldwide,
          royalty-free right to use them without restriction or compensation.
        </p>
      </section>

      {/* 12 */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Service Availability; Changes</h2>
        <p>
          We strive to maintain high availability, but the Service is provided on an &quot;as available&quot;
          basis. We may modify, suspend, or discontinue parts of the Service at any time. We are not
          liable for interruptions or downtime.
        </p>
      </section>

      {/* 13 */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">13. Termination</h2>
        <p>
          We may suspend or terminate your access to the Service at any time with or without notice
          if we believe you violated these Terms or pose a risk to the Service.
        </p>
        <p className="mt-2">Upon termination:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>Your right to use the Service stops immediately</li>
          <li>Embedded widgets and Wall pages associated with your account may be deactivated</li>
          <li>
            Some provisions (e.g., fees owed, disclaimers, limitation of liability, indemnity,
            dispute resolution) survive termination
          </li>
        </ul>
      </section>

      {/* 14 */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">14. Disclaimer of Warranties</h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS
          AVAILABLE,&quot; WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY,
          INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
          NON-INFRINGEMENT.
        </p>
        <p className="mt-2">
          We do not warrant that the Service will be uninterrupted, secure, error-free, or that
          AI-generated content will be accurate, complete, or suitable for any particular purpose.
        </p>
      </section>

      {/* 15 */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">15. Limitation of Liability</h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, SHIPPROOF AND ITS OFFICERS, DIRECTORS, EMPLOYEES,
          AND AGENTS WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL,
          EXEMPLARY, OR PUNITIVE DAMAGES, INCLUDING LOST PROFITS, LOST REVENUE, LOSS OF DATA, OR
          GOODWILL, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE.
        </p>
        <p className="mt-2">
          OUR TOTAL LIABILITY FOR ALL CLAIMS ARISING OUT OF OR RELATED TO THE SERVICE OR THESE TERMS
          WILL NOT EXCEED THE AMOUNT YOU PAID TO SHIPPROOF IN THE TWELVE (12) MONTHS BEFORE THE
          EVENT GIVING RISE TO THE CLAIM.
        </p>
        <p className="mt-2">
          Some jurisdictions do not allow certain limitations; in those cases, these limitations
          apply to the fullest extent permitted by law.
        </p>
      </section>

      {/* 16 */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">16. Indemnification</h2>
        <p>
          You agree to defend, indemnify, and hold harmless ShipProof and its affiliates, officers,
          directors, employees, and agents from and against any claims, damages, liabilities, losses,
          and expenses (including reasonable attorneys&apos; fees) arising out of or related to:
        </p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>Your use of the Service</li>
          <li>Your violation of these Terms</li>
          <li>Your violation of third-party rights or laws</li>
          <li>Content you submit, display, or embed through the Service</li>
        </ul>
      </section>

      {/* 17 */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">17. DMCA / Copyright Complaints</h2>
        <p>
          If you believe content available through the Service infringes your copyright, please
          contact us with sufficient detail so we can investigate and respond appropriately.
        </p>
      </section>

      {/* 18 */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">18. Electronic Communications</h2>
        <p>
          By using the Service, you consent to receive communications electronically (e.g., email,
          dashboard notices). You agree that electronic communications satisfy any legal requirement
          for written notice.
        </p>
      </section>

      {/* 19 */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">19. Governing Law; Venue</h2>
        <p>
          These Terms are governed by the laws of the State of California, without regard to conflict
          of laws principles.
        </p>
        <p className="mt-2">
          Any dispute arising out of or relating to these Terms or the Service will be brought in the
          state or federal courts located in San Francisco County, California, and you consent to
          personal jurisdiction and venue in those courts.
        </p>
      </section>

      {/* 20 */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">20. Dispute Resolution; Arbitration; Class Action Waiver</h2>

        <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">
          20.1 Informal Resolution (30-Day Good-Faith Negotiation)
        </h3>
        <p>
          To expedite resolution and reduce the cost of any dispute, controversy, or claim arising
          out of or relating to these Terms or the Service (each, a &quot;Dispute&quot;), you and ShipProof
          agree to first attempt to resolve the Dispute informally and in good faith for at least
          thirty (30) days before initiating arbitration or litigation.
        </p>
        <p className="mt-2">
          Informal negotiations begin upon written notice from one party to the other describing the
          nature of the Dispute and the relief sought. You agree to send such notice to{' '}
          <a href="mailto:support@shipproof.io" className="text-blue-600 hover:text-blue-800 underline">
            support@shipproof.io
          </a>
          , and we will respond using the contact information associated with your account.
        </p>
        <p className="mt-2">
          If the Dispute is not resolved within thirty (30) days after notice is sent, either party
          may proceed to arbitration as set forth below.
        </p>

        <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">20.2 Binding Arbitration</h3>
        <p>
          Except for the excluded disputes described in Section 20.5, all Disputes shall be finally
          and exclusively resolved by binding arbitration, rather than in court.
        </p>
        <p className="mt-2">
          You understand and agree that by accepting these Terms, you and ShipProof are each waiving
          the right to a trial by jury or to participate in a class action.
        </p>
        <p className="mt-2">
          The arbitration shall be administered by the American Arbitration Association (&quot;AAA&quot;) and
          conducted under the AAA Commercial Arbitration Rules, or, if applicable, the AAA Consumer
          Arbitration Rules, as in effect at the time arbitration is initiated. The AAA rules are
          available at{' '}
          <a
            href="https://www.adr.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            https://www.adr.org
          </a>.
        </p>

        <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">
          20.3 Arbitration Procedures and Location
        </h3>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>
            Arbitration may be conducted in person, by submission of documents, by telephone, or by
            video conference, at the arbitrator&apos;s discretion.
          </li>
          <li>
            Unless otherwise required by law or AAA rules, the arbitration shall take place in San
            Francisco, California, or another mutually agreed location.
          </li>
          <li>
            The arbitrator shall issue a written decision stating the essential findings and
            conclusions on which the award is based.
          </li>
          <li>
            The arbitrator must follow applicable law, and the award may be challenged if the
            arbitrator fails to do so.
          </li>
        </ul>
        <p className="mt-2">
          Judgment on the arbitration award may be entered in any court having jurisdiction.
        </p>

        <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">20.4 Fees and Costs</h3>
        <p>
          Each party shall bear its own attorneys&apos; fees and costs, unless the arbitrator determines
          otherwise in accordance with applicable law or AAA rules.
        </p>
        <p className="mt-2">
          AAA filing, administrative, and arbitrator fees shall be allocated according to AAA rules,
          subject to any limits imposed by applicable law.
        </p>

        <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">
          20.5 Exceptions to Arbitration
        </h3>
        <p>The following Disputes are not subject to the above arbitration requirements:</p>
        <ol className="list-decimal pl-6 mt-2 space-y-1">
          <li>
            Claims seeking to enforce or protect a party&apos;s intellectual property rights (including
            trademarks, copyrights, trade secrets)
          </li>
          <li>
            Claims related to unauthorized access, misuse, or abuse of the Service, including
            security breaches or credential misuse
          </li>
          <li>Claims seeking injunctive or equitable relief to prevent imminent harm</li>
          <li>Claims that cannot be arbitrated under applicable law</li>
        </ol>
        <p className="mt-2">
          For these excluded matters, either party may bring claims in the courts specified in
          Section 19 (Governing Law; Venue).
        </p>

        <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">20.6 Class Action Waiver</h3>
        <p>To the fullest extent permitted by law:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>
            All Disputes must be brought on an individual basis only, and not as a plaintiff or class
            member in any purported class, collective, consolidated, or representative action.
          </li>
          <li>
            The arbitrator may not consolidate claims of more than one person or preside over any
            form of representative or class proceeding.
          </li>
        </ul>
        <p className="mt-2">
          If this class action waiver is found to be unenforceable, then the entirety of this
          arbitration provision shall be null and void, and the Dispute shall be resolved in court.
        </p>

        <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">
          20.7 Time Limitation on Claims
        </h3>
        <p>
          Any Dispute must be initiated within one (1) year after the cause of action arises. Claims
          not brought within this period are permanently barred, to the fullest extent permitted by
          law.
        </p>

        <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">20.8 Survival</h3>
        <p>
          This Dispute Resolution section shall survive termination of your account or these Terms.
        </p>
      </section>

      {/* 21 */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">21. Contact</h2>
        <p>
          Questions about these Terms:{' '}
          <a href="mailto:support@shipproof.io" className="text-blue-600 hover:text-blue-800 underline">
            support@shipproof.io
          </a>
        </p>
      </section>
    </div>
  )
}
