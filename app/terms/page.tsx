export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14 md:py-20">
      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-8">
        <h1 className="text-2xl font-semibold text-zinc-100 sm:text-3xl">Terms of Service</h1>
        <p className="mt-3 text-sm text-zinc-400">Last updated: June 19, 2026</p>
        <p className="mt-4 text-zinc-300">
          These Terms of Service govern your use of LCB Training memberships, content, and coaching
          tools. By creating an account or using this site, you agree to these terms.
        </p>
      </section>

      <section className="mt-8 space-y-5">
        <article className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-zinc-100">1. Membership Subscriptions</h2>
          <p className="mt-3 text-zinc-300">
            Paid memberships are billed on a recurring basis through Stripe. Your access level
            (Basic, Memorable, or Elite) is based on your current subscription tier and may change if
            your subscription is upgraded, downgraded, or canceled.
          </p>
          <p className="mt-3 text-zinc-300">
            You are responsible for maintaining accurate billing information and ensuring your
            payment method remains valid.
          </p>
        </article>

        <article className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-zinc-100">2. Refund Policy</h2>
          <p className="mt-3 text-zinc-300">
            Membership fees are generally non-refundable once billed. If you cancel your
            subscription, cancellation takes effect at the end of your current billing period and
            you keep access through that date.
          </p>
          <p className="mt-3 text-zinc-300">
            If you believe you were charged in error, contact LCB Training support and we will
            review the charge case-by-case.
          </p>
        </article>

        <article className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-zinc-100">3. Content Ownership</h2>
          <p className="mt-3 text-zinc-300">
            All training videos, coaching materials, branding, and website content are owned by
            LCB Training and protected by intellectual property laws.
          </p>
          <p className="mt-3 text-zinc-300">
            You may use this content for personal training purposes only. You may not copy,
            redistribute, resell, record, or publicly share paid content without written
            permission.
          </p>
        </article>

        <article className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-zinc-100">4. Acceptable Use</h2>
          <p className="mt-3 text-zinc-300">You agree not to use LCB Training to:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-zinc-300">
            <li>Upload unlawful, abusive, or harmful content.</li>
            <li>Attempt unauthorized access to accounts, services, or data.</li>
            <li>Disrupt platform functionality or interfere with other users.</li>
            <li>Impersonate another person or submit false account information.</li>
          </ul>
          <p className="mt-3 text-zinc-300">
            LCB Training may suspend or terminate accounts that violate these terms.
          </p>
        </article>
      </section>
    </div>
  );
}
