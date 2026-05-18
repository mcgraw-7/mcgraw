import Link from 'next/link';
import React from 'react';

export default function HowItWorks() {
  return (
    <main className="min-h-screen bg-white text-gray-900">

      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/automate" className="text-sm font-semibold text-gray-600 hover:text-green-600 transition-colors flex items-center gap-2">
            <i className="fas fa-arrow-left text-xs"></i>
            Back to automate
          </Link>
          <a
            href="mailto:michael@mcgraw.io?subject=automate"
            className="text-sm font-semibold text-green-600 hover:text-green-700 transition-colors"
          >
            Contact
          </a>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          How the technology actually works
        </h1>
        <p className="text-xl text-gray-500 mb-16 leading-relaxed">
          No jargon. Just a plain explanation of what happens behind the scenes when you run your business with mcgraw.io.
        </p>

        {/* Section 1 */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">You keep using email and text. Nothing changes on your end.</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Your customers contact you the way they always have — a text message, an email, a contact form on your website. You do not need to tell them to do anything differently. That part stays exactly the same.
          </p>
          <p className="text-gray-600 leading-relaxed">
            What changes is what happens <em>after</em> that message arrives. Instead of it sitting in your inbox waiting for you to read it, copy the details somewhere, and remember to follow up — the system handles that automatically.
          </p>
        </section>

        {/* Section 2 */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">The AI part: reading messages so you don&apos;t have to dig through them.</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            When a message comes in, an AI reads it — the same kind of AI that powers ChatGPT, built by companies like OpenAI or Anthropic. It pulls out the important details automatically.
          </p>

          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mb-4">
            <div className="text-sm font-semibold text-gray-500 uppercase mb-3">Customer sends this:</div>
            <p className="text-gray-800 italic mb-6">&quot;Hey, need a quote for a backyard cleanup — maybe 2000 sq ft, nothing urgent.&quot;</p>
            <div className="text-sm font-semibold text-gray-500 uppercase mb-3">The system reads and records this:</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Service', value: 'Backyard cleanup' },
                { label: 'Size', value: '2,000 sq ft' },
                { label: 'Urgency', value: 'Low' },
                { label: 'Next step', value: 'Send quote' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="text-xs text-gray-500 uppercase font-semibold mb-1">{label}</div>
                  <div className="font-semibold text-gray-900">{value}</div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-gray-600 leading-relaxed">
            That information goes straight into a dashboard you can check anytime — organized, labeled, and ready to act on. No inbox archaeology.
          </p>
        </section>

        {/* Section 3 */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">It drafts your reply. You approve it.</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Based on what the customer asked, the system writes a first draft of your reply. Something like:
          </p>
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-4">
            <div className="text-sm font-semibold text-green-700 uppercase mb-3">Draft reply ready for review:</div>
            <p className="text-gray-800 italic">
              &quot;Hi — thanks for reaching out. We can put together a quote for the backyard cleanup. What days work best for a quick walkthrough?&quot;
            </p>
          </div>
          <p className="text-gray-600 leading-relaxed">
            You read it, hit send, or change one word. The whole thing takes 30 seconds instead of 10 minutes. You stay in control of every conversation — the AI just does the first draft.
          </p>
        </section>

        {/* Section 4 */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Automatic follow-ups, reminders, and status updates.</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            The system can be set up to send follow-ups if a customer goes quiet, remind someone about a deposit, or notify your crew about a schedule change — all without you having to remember to do it.
          </p>
          <div className="space-y-3">
            {[
              { icon: 'fa-clock', text: 'No response in 48 hours — send a check-in automatically' },
              { icon: 'fa-dollar-sign', text: 'Deposit not received — send a polite reminder with a payment link' },
              { icon: 'fa-cloud-rain', text: 'Rain delay detected — notify the customer and reschedule the job' },
              { icon: 'fa-check', text: 'Job completed — request a review or offer to rebook' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 bg-gray-50">
                <div className="text-green-600 w-5 text-center mt-0.5"><i className={`fas ${icon}`}></i></div>
                <p className="text-gray-700">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 5 */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">What the AI is not doing.</h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            This is worth being direct about, because there is a lot of hype around AI right now.
          </p>
          <div className="space-y-3">
            {[
              'It is not talking to your customers on its own. Every message that goes out to a customer has you behind it.',
              'It is not making business decisions. It extracts information and drafts responses — you decide what happens next.',
              'It is not storing your customers\' data and selling it. Your data stays in your system.',
              'It is not replacing your judgment. It handles the repetitive parts so your judgment goes further.',
            ].map((text) => (
              <div key={text} className="flex items-start gap-4 p-4 rounded-lg border border-gray-200">
                <div className="text-gray-400 w-5 text-center mt-0.5"><i className="fas fa-minus"></i></div>
                <p className="text-gray-700">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 6 */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">The short version.</h2>
          <div className="bg-gray-900 text-white rounded-xl p-8">
            <p className="text-lg leading-relaxed text-gray-200">
              It is autocomplete for your business operations. The same way your phone suggests the next word when you type a text, this system suggests the next step in your workflow. You stay in control. You just spend 30 seconds instead of 10 minutes on each customer interaction.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center pt-8 border-t border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to see what this looks like for your business?</h2>
          <p className="text-gray-500 mb-8">Every business is different. A 20-minute conversation is usually enough to identify the highest-value automation opportunity.</p>
          <a
            href="mailto:michael@mcgraw.io?subject=automate"
            className="inline-flex items-center justify-center rounded-lg bg-green-600 px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-green-700"
          >
            <i className="fas fa-calendar-check mr-2"></i>
            Book a Free Tech Audit
          </a>
        </section>

      </div>
    </main>
  );
}
