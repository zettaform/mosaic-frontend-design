// Using regular img tags instead of Next.js Image

import { Container } from '@/components/Container'
import backgroundImage from '@/images/background-faqs.jpg'

const faqs = [
  [
    {
      question: 'What does your platform do?',
      answer:
        'We help businesses generate high-quality leads and automatically create personalised outreach emails using AI. Emails are crafted from insights taken directly from each prospect\'s Instagram profile.',
    },
    {
      question: 'How do you collect leads from Instagram?',
      answer: 'We extract publicly available profile data—such as captions, bios, and engagement signals—to identify relevant prospects that match your target audience.',
    },
    {
      question: 'How does the personalised email generation work?',
      answer: 'Our AI analyses the prospect\'s Instagram content and combines it with your preferred tone, style, and prompts to create a unique outreach email for each lead.',
    },
    {
      question: 'Are the emails unique for each prospect?',
      answer: 'Yes. Every email is custom-generated using the user\'s prompt preferences + the prospect\'s actual Instagram content, making it highly relevant and personal.',
    },
  ],
  [
    {
      question: 'Can I edit the AI-generated emails?',
      answer: 'Absolutely. You can fully edit, rewrite, or refine the email before sending it to the prospect.',
    },
    {
      question: 'Do I need any technical skills to use the platform?',
      answer: 'No. Just select your target audience, choose your email style, and the platform does the rest automatically.',
    },
    {
      question: 'How accurate are the leads?',
      answer: 'We curate leads using filters like niche, location, follower count, interests, and engagement patterns to ensure they\'re relevant to your business.',
    },
    {
      question: 'Can I download or export the leads and emails?',
      answer: 'Yes. You can export all leads and AI-generated emails as CSV or copy them directly from your dashboard.',
    },
    {
      question: 'Can I integrate this with my CRM or email tools?',
      answer: 'We support integrations via API, Zapier, and webhooks, allowing you to push leads and emails into your workflow tools.',
    },
  ],
  [
    {
      question: 'What data do you store? Is it safe?',
      answer: 'All data is securely stored. We only use publicly available Instagram information and never collect passwords or sensitive private data.',
    },
    {
      question: 'Do you comply with GDPR & privacy guidelines?',
      answer: 'Yes. We follow data-privacy best practices and only process public data for legitimate outreach purposes.',
    },
    {
      question: 'How much does it cost?',
      answer: 'We offer flexible plans based on the number of leads and AI-generated emails you need per month.',
    },
    {
      question: 'Can I try it for free?',
      answer: 'Yes. You can generate a limited number of leads and sample personalised emails before upgrading.',
    },
  ],
]

export function Faqs() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="relative overflow-hidden bg-slate-50 py-20 sm:py-32"
    >
      <img
        className="absolute left-1/2 top-0 max-w-none -translate-y-1/4 translate-x-[-30%]"
        src={backgroundImage}
        alt=""
      />
      <Container className="relative">
        <div className="mx-auto max-w-2xl lg:mx-0">
          <h2
            id="faq-title"
            className="font-display text-3xl tracking-tight text-slate-900 sm:text-4xl"
          >
            Frequently asked questions
          </h2>
          <p className="mt-4 text-lg tracking-tight text-slate-700">
            If you can't find what you're looking for, email our support team
            and if you're lucky someone will get back to you.
          </p>
        </div>
        <ul
          role="list"
          className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3"
        >
          {faqs.map((column, columnIndex) => (
            <li key={columnIndex}>
              <ul role="list" className="flex flex-col gap-y-8">
                {column.map((faq, faqIndex) => (
                  <li key={faqIndex}>
                    <h3 className="font-display text-lg leading-7 text-slate-900">
                      {faq.question}
                    </h3>
                    <p className="mt-4 text-sm text-slate-700">{faq.answer}</p>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}