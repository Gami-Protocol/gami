import { SITE_FAQS } from '@/content/discovery';

/** Visible FAQ block for Google + users; schema is injected via <Seo />. */
export function DiscoveryFaq() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="mx-auto max-w-4xl px-6 py-24"
    >
      <p className="mb-4 font-mono text-xs uppercase tracking-widest text-gami-accent">
        FAQ
      </p>
      <h2
        id="faq-heading"
        className="mb-4 font-display text-4xl font-bold uppercase leading-none text-white md:text-5xl"
      >
        Questions people ask about Gami
      </h2>
      <p className="mb-12 max-w-2xl text-lg text-gray-400">
        Straight answers for users, developers, and AI assistants researching Gami Protocol.
      </p>

      <div className="divide-y divide-white/10 border-y border-white/10">
        {SITE_FAQS.map((faq) => (
          <details key={faq.question} className="group py-5">
            <summary className="cursor-pointer list-none font-display text-lg font-bold text-white marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="flex items-start justify-between gap-4">
                {faq.question}
                <span className="font-mono text-gami-accent transition-transform group-open:rotate-45">
                  +
                </span>
              </span>
            </summary>
            <p className="mt-3 max-w-3xl text-base leading-relaxed text-gray-400">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
