import React from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { GetStartedFooter } from '../components/GetStartedFooter'

const termsSections = [
  {
    name: 'Introduction',
    description: 'Welcome to MyMailGram. We provide a SaaS platform for lead discovery using hashtags, Instagram data analysis, and AI-powered email content generation. By using our service, you agree to these Terms of Service.',
  },
  {
    name: 'Eligibility',
    description: 'Users must be at least 18 years old and use the service for lawful business purposes. Accounts created on behalf of companies require proper authorization and compliance with all applicable regulations.',
  },
  {
    name: 'Service Description',
    description: 'MyMailGram offers hashtag-based lead generation, AI-powered email personalization, downloadable campaign files, and upcoming features like direct email sending and inbox management.',
  },
  {
    name: 'User Responsibilities',
    description: 'Users must use the platform lawfully, comply with anti-spam laws, ensure ethical content generation, and maintain account security. Misuse may result in account termination.',
  },
  {
    name: 'Account Registration',
    description: 'Provide accurate information when creating accounts. Users are responsible for maintaining login security and all actions performed under their account credentials.',
  },
  {
    name: 'Acceptable Use Policy',
    description: 'Prohibits spam sending, harassment, private data scraping, harmful content creation, and illegal marketing practices. Violations result in immediate account suspension.',
  },
  {
    name: 'Data Usage & Privacy',
    description: 'We handle only necessary user data and access only publicly available Instagram information. Users are responsible for lawful use of third-party data and AI-generated content.',
  },
  {
    name: 'Payment & Subscriptions',
    description: 'Paid plans display fees before purchase with automatic renewals. Prices may change with notice, and refunds are handled case-by-case. Non-payment results in service suspension.',
  },
  {
    name: 'Feature Availability',
    description: 'Service features and availability may change. We reserve the right to modify, suspend, or discontinue features with reasonable notice to maintain service quality.',
  },
]

export default function TermsOfService() {
  return (
    <div className="bg-gray-900">
      {/* Header */}
      <header className="absolute inset-x-0 top-0 z-50 relative">
        <nav aria-label="Global" className="flex items-center justify-between p-6 lg:px-8">
          <div className="flex lg:flex-1">
            <Logo className="h-8 w-auto" linkTo="/" />
          </div>
          <div className="flex lg:hidden">
            <button
              type="button"
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Open main menu</span>
              <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
          </div>
          <div className="hidden lg:flex lg:gap-x-12">
            <a href="/" className="text-sm/6 font-semibold text-white">
              Home
            </a>
            <a href="/about" className="text-sm/6 font-semibold text-white">
              About Us
            </a>
            <a href="#" className="text-sm/6 font-semibold text-white">
              Features
            </a>
            <a href="/pricing" className="text-sm/6 font-semibold text-white">
              Pricing
            </a>
            <a href="/contact" className="text-sm/6 font-semibold text-white">
              Contact
            </a>
          </div>
          <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-6">
            <a href="/signin" className="text-sm/6 font-semibold text-white">
              Members Login
            </a>
            <a href="/signup" className="text-sm/6 font-semibold text-white">
              Sign Up <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </nav>
      </header>

      <main className="isolate">
        {/* Hero section */}
        <div className="bg-gray-900 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-16">
            <div className="mx-auto max-w-2xl lg:mx-0">
              <h1 className="text-4xl font-semibold tracking-tight text-pretty text-white sm:text-5xl">
                Terms of Service
              </h1>
              <div className="mt-6 text-lg/8 text-gray-300">
                <p><strong>Effective Date:</strong> 13/12/2025</p>
                <p><strong>Website:</strong> https://mymailgram.com</p>
                <p><strong>Owner Contact:</strong> wayne@mymailgram.com</p>
                <p className="mt-4">
                  These Terms of Service govern your use of MyMailGram, including our website, web application, data scraping features, AI-powered content generation, and downloadable campaign files.
                </p>
              </div>
            </div>
            <dl className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 text-base/7 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3">
              {termsSections.map((section) => (
                <div key={section.name}>
                  <dt className="font-semibold text-white">{section.name}</dt>
                  <dd className="mt-1 text-gray-400">{section.description}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Additional content section */}
        <div className="bg-gray-900 py-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-16">
            <div className="mx-auto max-w-4xl">
              <div className="prose prose-invert max-w-none">
                <h2 className="text-2xl font-semibold text-white mb-6">Important Notes</h2>
                <div className="space-y-6 text-gray-300">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Service Modifications</h3>
                    <p>We reserve the right to modify, suspend, or discontinue any feature or service with reasonable notice. This includes upcoming features currently under development.</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Compliance & Legal Responsibility</h3>
                    <p>Users are solely responsible for ensuring their use of MyMailGram complies with all applicable laws, regulations, and platform policies. This includes anti-spam laws, data protection regulations, and ethical marketing practices.</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Limitation of Liability</h3>
                    <p>MyMailGram is provided "as is" without warranties. We are not liable for any damages arising from your use of the service, including but not limited to business losses, data breaches, or legal issues.</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Contact Information</h3>
                    <p>For questions about these Terms of Service, please contact us at wayne@mymailgram.com.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Section */}
      <GetStartedFooter />
    </div>
  )
}
