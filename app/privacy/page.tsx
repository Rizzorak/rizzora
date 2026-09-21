
export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-16 text-white">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-3 text-4xl font-bold">Privacy Policy</h1>
        <p className="mb-10 text-sm text-white/50">
          Last updated: September 21, 2026
        </p>

        <div className="space-y-8 text-white/80 leading-7">
          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">
              1. Information You Provide
            </h2>
            <p>
              When you use RIZZORA, you may provide text, conversation content,
              photos or screenshots, and your selected conversation vibe and
              goal.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">
              2. How We Use Your Information
            </h2>
            <p>
              RIZZORA uses the information you submit to generate AI-assisted
              conversation suggestions based on the context, vibe, and goal
              you select.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">
              3. Photos and Images
            </h2>
            <p>
              If you use the Photo / Story feature, your selected image is
              processed in your browser, resized, and converted to a compressed
              format before being submitted for AI processing.
            </p>
            <p className="mt-3">
              RIZZORA does not provide a user-facing permanent photo storage
              system or maintain a database of uploaded photos. Images are
              transmitted to the AI infrastructure used to generate your
              requested response.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">
              4. AI Processing
            </h2>
            <p>
              RIZZORA uses OpenRouter to route AI requests to the AI model used
              by the service. Your submitted text and, when applicable, images
              are transmitted to this service for processing.
            </p>
            <p className="mt-3">
              Third-party AI providers may have their own data-handling
              practices and policies.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">
              5. Data Storage
            </h2>
            <p>
              RIZZORA currently does not provide user accounts, conversation
              history, or a database for storing generated conversations.
            </p>
            <p className="mt-3">
              RIZZORA does not use browser local storage, session storage, or
              cookies to store your conversations or generated results.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">
              6. Analytics and Advertising
            </h2>
            <p>
              RIZZORA does not currently use third-party analytics platforms
              for tracking user behavior and does not use your conversations or
              uploaded content for personalized advertising.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">
              7. Third-Party Services
            </h2>
            <p>
              RIZZORA uses third-party infrastructure to operate the service,
              including Vercel for hosting and OpenRouter for AI request
              processing.
            </p>
            <p className="mt-3">
              These providers may process technical information and request
              data as necessary to provide their services.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">
              8. Security
            </h2>
            <p>
              We take reasonable measures to protect information transmitted
              through RIZZORA. However, no internet transmission or electronic
              storage system can be guaranteed to be completely secure.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">
              9. Children&apos;s Privacy
            </h2>
            <p>
              RIZZORA is not intended for children. If you are under the
              minimum age required to use the service in your jurisdiction,
              please do not use RIZZORA where prohibited by applicable law.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">
              10. Your Choices
            </h2>
            <p>
              You choose what text and images you submit to RIZZORA. We
              recommend that you do not submit highly sensitive personal
              information or information about another person that you do not
              have permission to share.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">
              11. International Processing
            </h2>
            <p>
              RIZZORA and its service providers may process information on
              servers located in countries other than your own. Where
              applicable, such transfers will be handled using legally
              recognized safeguards.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">
              12. Changes to This Privacy Policy
            </h2>
            <p>
              We may update this Privacy Policy as RIZZORA&apos;s features,
              infrastructure, or legal requirements change. When we make
              changes, we will update the date shown at the top of this page.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">
              13. Contact
            </h2>
            <p>
              If you have privacy questions or requests, contact us at:
            </p>
            <p className="mt-3">
              <a
                href="mailto:rizzora.app@outlook.com"
                className="text-white underline underline-offset-4"
              >
                rizzora.app@outlook.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
