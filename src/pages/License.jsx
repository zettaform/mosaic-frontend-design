'use client'

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { Logo } from '../components/Logo'
import { GetStartedFooter } from '../components/GetStartedFooter'

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'About Us', href: '/about' },
  { name: 'Features', href: '/features' },
  { name: 'Pricing', href: '/pricing' },
  { name: 'Contact', href: '/contact' },
]

const licenseFaqs = [
  {
    question: 'What is included in the license grant?',
    answer:
      'MyMailGram grants you a limited, non-exclusive, non-transferable, and revocable license to access and use the platform for lawful business and professional purposes. This license allows you to: generate leads using hashtag-based discovery, access publicly available Instagram profile data, use AI to generate personalised email content based on post captions, download campaign files for your outreach workflows, and use features available under your current plan. This license does not grant ownership of the platform or its technology.',
  },
  {
    question: 'Who owns the MyMailGram platform and its intellectual property?',
    answer:
      'All rights, title, and interest in the MyMailGram platform—including software, algorithms, AI models, branding, design, and documentation—remain the exclusive property of MyMailGram. Using the platform does not transfer any intellectual property rights to you.',
  },
  {
    question: 'How can I use MyMailGram?',
    answer:
      'You agree to use MyMailGram only for legitimate marketing, outreach, and business communication purposes. You are responsible for: ensuring compliance with email marketing and data protection laws, using scraped data ethically and lawfully, managing how generated content is used in your campaigns, and maintaining the security of your account credentials.',
  },
  {
    question: 'What am I not allowed to do with MyMailGram?',
    answer:
      'You may not: copy, modify, sell, resell, or distribute the platform; reverse engineer, decompile, or attempt to extract source code; use the platform to send spam or misleading communications; scrape private or restricted data; or use MyMailGram to build or support a competing service. Any violation may result in suspension or termination of your license.',
  },
  {
    question: 'What are my rights regarding AI-generated content?',
    answer:
      'Content generated using MyMailGram\'s AI tools is licensed to you for commercial and non-commercial use. You may edit, reuse, and distribute AI-generated content as needed. However, MyMailGram does not guarantee accuracy, deliverability, or campaign outcomes. You are solely responsible for how generated content is used.',
  },
  {
    question: 'How does MyMailGram handle third-party services?',
    answer:
      'MyMailGram may rely on third-party platforms such as Instagram and, in future releases, email service providers and Google Workspace integrations. This license does not cover third-party services. You are responsible for complying with their terms and policies.',
  },
  {
    question: 'How are platform updates and changes handled?',
    answer:
      'MyMailGram may update, modify, or improve the platform at any time. New features, limitations, or changes may be introduced without prior notice. Continued use of the platform indicates acceptance of these updates.',
  },
  {
    question: 'When can my license be terminated?',
    answer:
      'This license remains active as long as you comply with this Agreement. MyMailGram may suspend or terminate your license if you: violate these terms, misuse platform features, engage in unlawful or harmful activity, or attempt to bypass system limits. Upon termination, access to the platform will be revoked.',
  },
  {
    question: 'What are the limitations of liability?',
    answer:
      'The platform is provided on an "as is" and "as available" basis. MyMailGram is not responsible for: campaign performance or results, compliance issues arising from outreach activities, data accuracy or completeness, or business losses or missed opportunities. Use of the platform is at your own risk.',
  },
  {
    question: 'How can I contact you regarding this License Agreement?',
    answer:
      'For questions regarding this License Agreement, please contact us at wayne@mymailgram.com or visit https://mymailgram.com.',
  },
]

export default function License() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mobileMenuOpen])

  return (
    <div className="bg-gray-900">
      {/* Header */}
      <header className="absolute inset-x-0 top-0 z-50 relative">
        <nav aria-label="Global" className="flex items-center justify-between p-6 lg:px-8">
          <div className="flex lg:flex-1">
            <Logo className="h-8 w-auto" linkTo="/" />
          </div>
          <div className="flex lg:hidden relative z-50">
            <button
              type="button"
              onClick={() => {
                console.log('Mobile menu button clicked');
                setMobileMenuOpen(true);
              }}
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-200 hover:text-white hover:bg-gray-800/50 transition-colors duration-200 relative z-50"
            >
              <span className="sr-only">Open main menu</span>
              <Bars3Icon aria-hidden="true" className="size-6" />
            </button>
          </div>
          <div className="hidden lg:flex lg:gap-x-12">
            {navigation.map((item) => (
              <Link key={item.name} to={item.href} className="text-sm/6 font-semibold text-white">
                {item.name}
              </Link>
            ))}
          </div>
          <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-6">
            <Link to="/signin" className="text-sm/6 font-semibold text-white">
              Members Login
            </Link>
            <Link to="/signup" className="text-sm/6 font-semibold text-white">
              Sign Up <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </nav>
        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Menu panel */}
            <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-gray-900 shadow-xl">
              <div className="flex flex-col h-full">
                {/* Header with logo and close button */}
                <div className="flex items-center justify-between p-6 border-b border-gray-700">
                  <Logo className="h-8 w-auto" linkTo="/" />
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="-m-2.5 rounded-md p-2.5 text-gray-200 hover:text-white hover:bg-gray-800"
                  >
                    <span className="sr-only">Close menu</span>
                    <XMarkIcon aria-hidden="true" className="size-6" />
                  </button>
                </div>

                {/* Navigation links */}
                <div className="flex-1 px-6 py-6">
                  <nav className="space-y-1">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-3 py-2 text-base font-medium text-white hover:bg-gray-800 hover:text-white rounded-md"
                      >
                        {item.name}
                      </Link>
                    ))}
                  </nav>

                  {/* Login/Signup buttons */}
                  <div className="mt-8 pt-6 border-t border-gray-700">
                    <div className="space-y-3">
                      <Link
                        to="/signin"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block w-full px-4 py-2 text-center text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                      >
                        Members Login
                      </Link>
                      <Link
                        to="/signup"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block w-full px-4 py-2 text-center text-sm font-medium text-indigo-600 bg-transparent border border-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-md"
                      >
                        Sign Up
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="isolate">
        {/* Content section - FAQ Style */}
        <div className="bg-gray-900">
          <div className="mx-auto max-w-7xl px-6 py-24 sm:pt-32 lg:px-8 lg:py-40">
            <div className="lg:grid lg:grid-cols-12 lg:gap-8">
              <div className="lg:col-span-5">
                <h2 className="text-3xl font-semibold tracking-tight text-pretty text-white sm:text-4xl">
                  License Agreement
                </h2>
                <p className="mt-4 text-base/7 text-pretty text-gray-400">
                  Effective Date: 12/13/2025
                </p>
                <p className="mt-4 text-base/7 text-pretty text-gray-400">
                  This License Agreement explains how you are permitted to use the MyMailGram platform. By accessing or using MyMailGram, you agree to the terms outlined below.
                </p>
                <p className="mt-6 text-base/7 text-pretty text-gray-400">
                  Can't find the answer you're looking for? Reach out to our{' '}
                  <a href="mailto:wayne@mymailgram.com" className="font-semibold text-indigo-400 hover:text-indigo-300">
                    customer support
                  </a>{' '}
                  team.
                </p>
              </div>
              <div className="mt-10 lg:col-span-7 lg:mt-0">
                <dl className="space-y-10">
                  {licenseFaqs.map((faq) => (
                    <div key={faq.question}>
                      <dt className="text-base/7 font-semibold text-white">{faq.question}</dt>
                      <dd className="mt-2 text-base/7 text-gray-400">{faq.answer}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        </div>
      </main>

      <GetStartedFooter />
    </div>
  )
}

