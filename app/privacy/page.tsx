export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14 md:py-20">
      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-8">
        <h1 className="text-2xl font-semibold text-zinc-100 sm:text-3xl">Privacy Policy</h1>
        <p className="mt-3 text-sm text-zinc-400">Last updated: June 19, 2026</p>
        <p className="mt-4 text-zinc-300">
          This Privacy Policy explains what information LCB Training collects, how it is stored,
          and how it is used to provide memberships, coaching, and support services.
        </p>
      </section>

      <section className="mt-8 space-y-5">
        <article className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-zinc-100">1. Data We Collect</h2>
          <p className="mt-3 text-zinc-300">LCB Training may collect:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-zinc-300">
            <li>Account details such as name, email address, and encrypted password.</li>
            <li>Membership and billing metadata (tier, subscription status, billing dates).</li>
            <li>Coaching submission content, including notes, form responses, and video links.</li>
            <li>Basic service and security logs needed for troubleshooting and platform safety.</li>
          </ul>
        </article>

        <article className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-zinc-100">2. How Data Is Stored</h2>
          <p className="mt-3 text-zinc-300">
            User account and membership data are stored in a secure database managed by LCB
            Training infrastructure providers. Payment details are processed and stored by Stripe;
            LCB Training does not store full card numbers.
          </p>
          <p className="mt-3 text-zinc-300">
            We use reasonable technical and organizational safeguards to protect user data, but no
            system can guarantee absolute security.
          </p>
        </article>

        <article className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-zinc-100">3. How Data Is Used</h2>
          <p className="mt-3 text-zinc-300">Collected data is used to:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-zinc-300">
            <li>Create and manage your account and membership access.</li>
            <li>Process subscription billing and cancellation workflows.</li>
            <li>Deliver coaching feedback and respond to support submissions.</li>
            <li>Send operational emails such as confirmations and account notifications.</li>
            <li>Maintain, improve, and secure the platform.</li>
          </ul>
        </article>

        <article className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-zinc-100">4. Data Sharing</h2>
          <p className="mt-3 text-zinc-300">
            LCB Training does not sell personal information. Data is shared only with essential
            service providers (for example, payment and email infrastructure) as needed to operate
            the service.
          </p>
        </article>
      </section>
    </div>
  );
}
