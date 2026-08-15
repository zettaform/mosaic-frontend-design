'use client'

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { Logo } from '../components/Logo'
import { CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/20/solid'
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

export default function AnalyticsPage() {
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
        {/* Hero section */}
        <div className="relative isolate -z-10">
          <svg
            aria-hidden="true"
            className="absolute inset-x-0 top-0 -z-10 h-256 w-full mask-[radial-gradient(32rem_32rem_at_center,white,transparent)] stroke-white/10"
          >
            <defs>
              <pattern
                x="50%"
                y={-1}
                id="analytics-pattern"
                width={200}
                height={200}
                patternUnits="userSpaceOnUse"
              >
                <path d="M.5 200V.5H200" fill="none" />
              </pattern>
            </defs>
            <svg x="50%" y={-1} className="overflow-visible fill-gray-800">
              <path
                d="M-200 0h201v201h-201Z M600 0h201v201h-201Z M-400 600h201v201h-201Z M200 800h201v201h-201Z"
                strokeWidth={0}
              />
            </svg>
            <rect fill="url(#analytics-pattern)" width="100%" height="100%" strokeWidth={0} />
          </svg>
          <div className="overflow-hidden">
            <div className="mx-auto max-w-7xl px-6 pt-36 pb-32 sm:pt-60 lg:px-16 lg:pt-32">
              <div className="mx-auto max-w-2xl gap-x-14 lg:mx-0 lg:flex lg:max-w-none lg:items-center">
                <div className="relative w-full lg:max-w-xl lg:shrink-0 xl:max-w-2xl">
                  <h1 className="text-5xl font-semibold tracking-tight text-pretty text-white sm:text-7xl">
                    Analytics
                  </h1>
                  <p className="mt-8 text-lg font-medium text-pretty text-gray-400 sm:max-w-md sm:text-xl/8 lg:max-w-none">
                    Understand your outreach performance and optimize your communication strategy
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content section */}
        <div className="mx-auto -mt-12 max-w-7xl px-6 sm:mt-0 lg:px-16 xl:-mt-8">
          <div className="max-w-3xl ml-6 sm:ml-8 lg:ml-12 xl:ml-16 text-base/7 text-gray-300 text-left">
            <div className="max-w-2xl">
              <p className="mt-6 text-xl/8">
                Understand your outreach performance, measure engagement, and optimise your communication strategy with MyMailGram's built-in analytics. Designed for businesses that rely on email outreach and lead handling, our analytics give you a clear view of how your communication workflows are performing in real time.
              </p>
            </div>

            <h2 className="mt-16 text-3xl font-semibold tracking-tight text-pretty text-white">
              Why Analytics Matter for Email Outreach
            </h2>
            <p className="mt-6">
              In lead generation and inbound communication workflows, understanding how emails perform is just as important as sending them.
              MyMailGram provides visibility into the quality of interactions, helping your team refine responses, speed up follow-ups, and identify opportunities for improvement.
            </p>

            <h3 className="mt-8 text-xl font-semibold text-white">Analytics for:</h3>
            <ul role="list" className="mt-4 space-y-4 text-gray-400">
              <li className="flex gap-x-3">
                <CheckCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-400" />
                <span>Outreach teams</span>
              </li>
              <li className="flex gap-x-3">
                <CheckCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-400" />
                <span>B2B SaaS sales pipelines</span>
              </li>
              <li className="flex gap-x-3">
                <CheckCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-400" />
                <span>Agencies managing multiple inboxes</span>
              </li>
              <li className="flex gap-x-3">
                <CheckCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-400" />
                <span>Customer onboarding and trial activation workflows</span>
              </li>
              <li className="flex gap-x-3">
                <CheckCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-400" />
                <span>Automated AI-assisted communication</span>
              </li>
            </ul>

            <h2 className="mt-16 text-3xl font-semibold tracking-tight text-pretty text-white">
              Email Performance Metrics
            </h2>
            <p className="mt-6">
              Track how efficiently your messages are being managed with insights such as:
            </p>

            <ul role="list" className="mt-8 space-y-4 text-gray-400">
              <li className="flex gap-x-3">
                <CheckCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-400" />
                <span>Response Time Overview: Average and fastest auto-response times</span>
              </li>
              <li className="flex gap-x-3">
                <CheckCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-400" />
                <span>Inbound Email Volume: Daily and monthly trends of emails received</span>
              </li>
              <li className="flex gap-x-3">
                <CheckCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-400" />
                <span>Lead Categories: Distribution of message types (trial requests, pricing questions, onboarding, general queries)</span>
              </li>
              <li className="flex gap-x-3">
                <CheckCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-400" />
                <span>Automation Effectiveness: How many replies were AI-generated vs. human-generated</span>
              </li>
            </ul>

            <p className="mt-6">
              This helps teams understand workload, performance, and bottlenecks.
            </p>

            <h2 className="mt-16 text-3xl font-semibold tracking-tight text-pretty text-white">
              Lead Quality Insights
            </h2>
            <p className="mt-6">
              Not all inbound messages carry equal value.
              MyMailGram helps you identify high-intent leads through:
            </p>

            <ul role="list" className="mt-8 space-y-4 text-gray-400">
              <li className="flex gap-x-3">
                <CheckCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-400" />
                <span>Keyword and intent detection</span>
              </li>
              <li className="flex gap-x-3">
                <CheckCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-400" />
                <span>Sentiment classification</span>
              </li>
              <li className="flex gap-x-3">
                <CheckCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-400" />
                <span>Trial-request identification</span>
              </li>
              <li className="flex gap-x-3">
                <CheckCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-400" />
                <span>Engagement scoring</span>
              </li>
              <li className="flex gap-x-3">
                <CheckCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-400" />
                <span>Tracking repeat senders or returning leads</span>
              </li>
            </ul>

            <p className="mt-6">
              These insights allow you to prioritise leads that are more likely to convert.
            </p>

            <h2 className="mt-16 text-3xl font-semibold tracking-tight text-pretty text-white">
              Conversation History Insights
            </h2>
            <p className="mt-6">
              MyMailGram maintains and analyzes message threads so teams can see:
            </p>

            <ul role="list" className="mt-8 space-y-4 text-gray-400">
              <li className="flex gap-x-3">
                <CheckCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-400" />
                <span>How often a lead has contacted you</span>
              </li>
              <li className="flex gap-x-3">
                <CheckCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-400" />
                <span>What the previous conversation contained</span>
              </li>
              <li className="flex gap-x-3">
                <CheckCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-400" />
                <span>Whether the AI's replies resolved the issue</span>
              </li>
              <li className="flex gap-x-3">
                <CheckCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-400" />
                <span>Recurring topics or pain points</span>
              </li>
            </ul>

            <p className="mt-6">
              This improves clarity and continuity for marketing and support teams.
            </p>

            <h2 className="mt-16 text-3xl font-semibold tracking-tight text-pretty text-white">
              AI Reply Performance
            </h2>
            <p className="mt-6">
              Since MyMailGram uses AI to generate context-aware responses, we track how well the system supports your communication workflows:
            </p>

            <ul role="list" className="mt-8 space-y-4 text-gray-400">
              <li className="flex gap-x-3">
                <CheckCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-400" />
                <span>Accuracy of AI-generated responses</span>
              </li>
              <li className="flex gap-x-3">
                <CheckCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-400" />
                <span>How many replies were sent with context/history</span>
              </li>
              <li className="flex gap-x-3">
                <CheckCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-400" />
                <span>Frequency of insertions such as trial credentials</span>
              </li>
              <li className="flex gap-x-3">
                <CheckCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-400" />
                <span>When human intervention was required</span>
              </li>
            </ul>

            <p className="mt-6">
              These insights help improve templates, workflows, and automation accuracy.
            </p>

            <h2 className="mt-16 text-3xl font-semibold tracking-tight text-pretty text-white">
              Operational Efficiency Metrics
            </h2>
            <p className="mt-6">
              Understand how automation impacts your team's workload:
            </p>

            <ul role="list" className="mt-8 space-y-4 text-gray-400">
              <li className="flex gap-x-3">
                <CheckCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-400" />
                <span>Time saved per day</span>
              </li>
              <li className="flex gap-x-3">
                <CheckCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-400" />
                <span>Manual vs automated replies over time</span>
              </li>
              <li className="flex gap-x-3">
                <CheckCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-400" />
                <span>Error detections and corrections</span>
              </li>
              <li className="flex gap-x-3">
                <CheckCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-400" />
                <span>Growth in lead handling capacity</span>
              </li>
            </ul>

            <p className="mt-6">
              These metrics demonstrate how MyMailGram improves productivity.
            </p>

            <h2 className="mt-16 text-3xl font-semibold tracking-tight text-pretty text-white">
              Pipeline Monitoring
            </h2>
            <p className="mt-6">
              Monitor the health of your communication funnel with:
            </p>

            <ul role="list" className="mt-8 space-y-4 text-gray-400">
              <li className="flex gap-x-3">
                <CheckCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-400" />
                <span>Daily inbound lead rates</span>
              </li>
              <li className="flex gap-x-3">
                <CheckCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-400" />
                <span>Successful follow-up completions</span>
              </li>
              <li className="flex gap-x-3">
                <CheckCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-400" />
                <span>Lead stages (new, pending, engaged, converted)</span>
              </li>
              <li className="flex gap-x-3">
                <CheckCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-400" />
                <span>Drop-off patterns</span>
              </li>
            </ul>

            <p className="mt-6">
              This helps your business optimise its outreach strategy.
            </p>

            <h2 className="mt-16 text-3xl font-semibold tracking-tight text-pretty text-white">
              Custom Data Export
            </h2>
            <p className="mt-6">
              Analytics data can be exported securely to your preferred systems, such as:
            </p>

            <ul role="list" className="mt-8 space-y-4 text-gray-400">
              <li className="flex gap-x-3">
                <CheckCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-400" />
                <span>CRMs</span>
              </li>
              <li className="flex gap-x-3">
                <CheckCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-400" />
                <span>DynamoDB</span>
              </li>
              <li className="flex gap-x-3">
                <CheckCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-400" />
                <span>Reporting dashboards</span>
              </li>
              <li className="flex gap-x-3">
                <CheckCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-400" />
                <span>Internal BI tools</span>
              </li>
            </ul>

            <p className="mt-6">
              Providing flexibility for teams that need deeper, customised insights.
            </p>

            <figure className="mt-10 border-l border-indigo-400 pl-9">
              <blockquote className="font-semibold text-white">
                <p>
                  "Data-driven insights transform how teams communicate and convert leads."
                </p>
              </blockquote>
              <figcaption className="mt-6 flex gap-x-4">
                <InformationCircleIcon aria-hidden="true" className="mt-0.5 size-5 flex-none text-gray-600" />
                <div className="text-sm/6">
                  <strong className="font-semibold text-white">MyMailGram Analytics</strong> – Performance Intelligence
                </div>
              </figcaption>
            </figure>

            <h2 className="mt-16 text-3xl font-semibold tracking-tight text-pretty text-white">
              Privacy and Data Security
            </h2>
            <p className="mt-6 text-gray-400">
              All analytics are built with secure handling of email and lead data.
              We never sell or share your analytics data, and it remains fully private and encrypted.
            </p>

            <h2 className="mt-16 text-3xl font-semibold tracking-tight text-pretty text-white">
              Make Smarter Decisions With Data
            </h2>
            <p className="mt-6">
              MyMailGram Analytics empowers your team to make informed decisions, refine your workflows, and continually improve lead handling performance. Real data leads to real improvement—and a more efficient communication process.
            </p>
          </div>
        </div>
      </main>

      {/* Footer Section */}
      <GetStartedFooter />
    </div>
  )
}
