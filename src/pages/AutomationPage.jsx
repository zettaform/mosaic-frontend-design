'use client'

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Bars3Icon, XMarkIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import { Logo } from '../components/Logo'
import { CloudArrowUpIcon, LockClosedIcon, ServerIcon } from '@heroicons/react/20/solid'
import { GetStartedFooter } from '../components/GetStartedFooter'

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'About Us', href: '/about' },
  { name: 'Features', href: '/features' },
  { name: 'Pricing', href: '/pricing' },
  { name: 'Contact', href: '/contact' },
]

const footerNavigation = {
  main: [
    { name: 'About', href: '#' },
    { name: 'Blog', href: '/blog' },
    { name: 'Jobs', href: '/jobs' },
    { name: 'Press', href: '#' },
    { name: 'Marketing', href: '/marketing' },
    { name: 'Analytics', href: '/analytics' },
    { name: 'Privacy Policy', href: '/privacy-policy' },
    { name: 'Terms of Service', href: '/terms-of-service' },
    { name: 'Accessibility', href: '#' },
    { name: 'Partners', href: '#' },
  ],
  social: [
    {
      name: 'Facebook',
      href: '#',
      icon: (props) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path
            fillRule="evenodd"
            d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    {
      name: 'Instagram',
      href: '#',
      icon: (props) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path
            fillRule="evenodd"
            d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    {
      name: 'X',
      href: '#',
      icon: (props) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path d="M13.6823 10.6218L20.2391 3H18.6854L12.9921 9.61788L8.66193 4H4L10.0765 13.0074L3.2002 21H4.75404L10.7663 14.0113L15.5685 21H20.8131L13.6819 10.6218H13.6823ZM11.5541 13.0956L10.8574 12.0991L5.31391 4.16971H7.70053L12.1742 10.5689L12.8709 11.5655L18.6861 19.8835H16.2995L11.5541 13.096V13.0956Z" />
        </svg>
      ),
    },
    {
      name: 'GitHub',
      href: '#',
      icon: (props) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path
            fillRule="evenodd"
            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844a9.59 9.59 0 011.504.337 9.564 9.564 0 012.504-.337c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    {
      name: 'YouTube',
      href: '#',
      icon: (props) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path
            fillRule="evenodd"
            d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
  ],
}

export default function AutomationPage() {
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

      <main>
        {/* Hero section with automation content */}
        <div className="relative isolate overflow-hidden bg-gray-900 py-24 sm:py-32">
          <div
            aria-hidden="true"
            className="absolute -top-80 left-[max(6rem,33%)] -z-10 transform-gpu blur-3xl sm:left-1/2 md:top-20 lg:ml-20 xl:top-3 xl:ml-56"
          >
            <div
              style={{
                clipPath:
                  'polygon(63.1% 29.6%, 100% 17.2%, 76.7% 3.1%, 48.4% 0.1%, 44.6% 4.8%, 54.5% 25.4%, 59.8% 49.1%, 55.3% 57.9%, 44.5% 57.3%, 27.8% 48%, 35.1% 81.6%, 0% 97.8%, 39.3% 100%, 35.3% 81.5%, 97.2% 52.8%, 63.1% 29.6%)',
              }}
              className="aspect-801/1036 w-200.25 bg-linear-to-tr from-[#ff80b5] to-[#9089fc] opacity-20"
            />
          </div>
          <div className="mx-auto max-w-7xl px-6 lg:px-16">
            <div className="mx-auto max-w-2xl lg:mx-0">
              <p className="text-base/7 font-semibold text-indigo-400">Work smarter. Scale faster.</p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight text-pretty text-white sm:text-5xl">
                Automation – Work Smarter. Scale Faster.
              </h1>
              <p className="mt-6 text-xl/8 text-gray-300">
                MyMailGram helps businesses automate the most time-consuming parts of audience research and email preparation—so you can focus on strategy, relationships, and growth. Our automation tools streamline the process of finding leads, understanding them, and creating personalized email content at scale.
              </p>
            </div>
            <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 lg:mx-0 lg:mt-10 lg:max-w-none lg:grid-cols-12">
              <div className="relative lg:order-last lg:col-span-5">
                <svg
                  aria-hidden="true"
                  className="absolute -top-160 left-1 -z-10 h-256 w-702 -translate-x-1/2 mask-[radial-gradient(64rem_64rem_at_111.5rem_0%,white,transparent)] stroke-white/10"
                >
                  <defs>
                    <pattern
                      id="automation-pattern"
                      width={200}
                      height={200}
                      patternUnits="userSpaceOnUse"
                    >
                      <path d="M0.5 0V200M200 0.5L0 0.499983" />
                    </pattern>
                  </defs>
                  <rect fill="url(#automation-pattern)" width="100%" height="100%" strokeWidth={0} />
                </svg>
                <figure className="border-l border-indigo-400 pl-8">
                  <blockquote className="text-xl/8 font-semibold tracking-tight text-white">
                    <p>
                      "Automation that actually works - turning manual processes into scalable workflows."
                    </p>
                  </blockquote>
                  <figcaption className="mt-8 flex gap-x-4">
                    <UserCircleIcon className="mt-1 size-10 flex-none text-gray-400" />
                    <div className="text-sm/6">
                      <div className="font-semibold text-white">MyMailGram Team</div>
                      <div className="text-gray-400">Automation Experts</div>
                    </div>
                  </figcaption>
                </figure>
              </div>
              <div className="max-w-xl text-base/7 text-gray-400 lg:col-span-7">
                <ul role="list" className="max-w-xl space-y-8 text-gray-400">
                  <li className="flex gap-x-3">
                    <CloudArrowUpIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-400" />
                    <span>
                      <strong className="font-semibold text-white">Automated Lead Generation.</strong> Through hashtag analysis and profile filtering, we automatically discover and organize relevant leads from Instagram.
                    </span>
                  </li>
                  <li className="flex gap-x-3">
                    <LockClosedIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-400" />
                    <span>
                      <strong className="font-semibold text-white">AI Caption Intelligence.</strong> Automatically analyzes writing styles, interests, and context to create personalized outreach insights.
                    </span>
                  </li>
                  <li className="flex gap-x-3">
                    <ServerIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-400" />
                    <span>
                      <strong className="font-semibold text-white">Email Content Automation.</strong> Generates personalized email bodies using AI, with unlimited variations and campaign-ready content.
                    </span>
                  </li>
                </ul>
                <p className="mt-8">
                  Et vitae blandit facilisi magna lacus commodo. Vitae sapien duis odio id et. Id blandit molestie auctor
                  fermentum dignissim. Lacus diam tincidunt ac cursus in vel. Mauris varius vulputate et ultrices hac
                  adipiscing egestas. Iaculis convallis ac tempor et ut. Ac lorem vel integer orci.
                </p>
                <h2 className="mt-16 text-2xl font-bold tracking-tight text-white">What's Coming Next</h2>
                <p className="mt-6">
                  We're building deeper automation layers that will transform MyMailGram from a content engine to a fully integrated outreach system. Features in development include inbox automation, direct email sending, follow-up workflows, and performance-driven optimization.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional content sections */}
        <div className="bg-gray-900 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-16">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Automation Features
              </h2>
              <p className="mt-6 text-lg leading-8 text-gray-400">
                Discover how our automation tools streamline your workflow from lead discovery to campaign execution.
              </p>
            </div>

            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                    <CloudArrowUpIcon aria-hidden="true" className="h-5 w-5 flex-none text-indigo-400" />
                    Automated Lead Generation
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-400">
                    <p className="flex-auto">
                      Identifies active users posting under selected hashtags, filters profiles based on relevance and content, extracts publicly available captions for personalization, and organizes leads into a clean, structured dataset.
                    </p>
                  </dd>
                </div>

                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                    <LockClosedIcon aria-hidden="true" className="h-5 w-5 flex-none text-indigo-400" />
                    Caption Intelligence
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-400">
                    <p className="flex-auto">
                      Reads and interprets writing styles, detects interests, themes, and context, highlights meaningful details for messaging, and prepares each lead with complete personalization data.
                    </p>
                  </dd>
                </div>

                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                    <ServerIcon aria-hidden="true" className="h-5 w-5 flex-none text-indigo-400" />
                    AI Email Generation
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-400">
                    <p className="flex-auto">
                      Use predefined prompt templates or create custom instructions, generate unlimited variations, and produce campaign-ready content instantly for every personalized email.
                    </p>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Campaign Automation Section */}
        <div className="bg-gray-800 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-16">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Campaign Automation
              </h2>
              <p className="mt-6 text-lg leading-8 text-gray-400">
                When your personalized emails are ready, MyMailGram automatically compiles your entire campaign into downloadable files.
              </p>
            </div>

            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24">
              <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <h3 className="text-lg font-semibold text-white">Export Includes:</h3>
                  <ul className="mt-4 space-y-3 text-gray-400">
                    <li className="flex items-start">
                      <span className="mr-2 text-indigo-400">•</span>
                      Lead information and contact details
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-indigo-400">•</span>
                      Caption context and personalization data
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-indigo-400">•</span>
                      AI-generated email body content
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-indigo-400">•</span>
                      Metadata and campaign tracking information
                    </li>
                  </ul>
                </div>

                <div className="sm:col-span-1">
                  <h3 className="text-lg font-semibold text-white">Integration Ready:</h3>
                  <ul className="mt-4 space-y-3 text-gray-400">
                    <li className="flex items-start">
                      <span className="mr-2 text-indigo-400">•</span>
                      Compatible with popular email tools
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-indigo-400">•</span>
                      CRM and marketing automation platforms
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-indigo-400">•</span>
                      Custom workflow integrations
                    </li>
                  </ul>
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
