import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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

export default function Features() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()

  const handleNavigation = (href) => {
    navigate(href)
  }

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
    <div className="bg-gray-900 w-full" style={{ minHeight: '100vh' }}>
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
              <button
                key={item.name}
                onClick={() => handleNavigation(item.href)}
                className="text-sm/6 font-semibold text-white hover:text-gray-300 transition-colors"
              >
                {item.name}
              </button>
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
                      <button
                        key={item.name}
                        onClick={() => {
                          handleNavigation(item.href)
                          setMobileMenuOpen(false)
                        }}
                        className="block w-full text-left px-3 py-2 text-base font-medium text-white hover:bg-gray-800 hover:text-white rounded-md"
                      >
                        {item.name}
                      </button>
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
        <div className="bg-gray-900 px-6 pt-32 pb-16 lg:px-16">
          <div className="mx-auto max-w-3xl text-base/7 text-gray-300">
            <p className="text-base/7 font-semibold text-indigo-400">Introducing</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-pretty text-white sm:text-5xl">
              MyMailGram – Features
            </h1>
            <p className="mt-6 text-xl/8">
              Turn Hashtags Into High-Quality Leads. Turn Captions Into High-Impact Emails.
            </p>
            <p className="mt-4 text-lg/8 text-gray-300">
              MyMailGram is designed for businesses, creators, and marketing teams that want smarter outreach—not more manual work.
              Our platform blends intelligent data sourcing with AI-driven personalization to help you identify your ideal audience and craft messages that resonate.
            </p>

            <div className="mt-10 max-w-2xl text-gray-400">
          <h2 className="text-3xl font-semibold tracking-tight text-pretty text-white mb-6">
            Core Features
          </h2>

          <div className="space-y-8">
            <div className="border-b border-gray-700 pb-8">
              <h3 className="text-xl font-semibold text-white mb-4">1. Intelligent Hashtag Lead Discovery</h3>
              <p className="mb-4">
                Stop searching manually for potential customers.
                MyMailGram analyzes Instagram hashtags to surface relevant public profiles that are actively posting within your niche.
              </p>
              <p className="mb-4">This gives you:</p>
              <ul className="space-y-2">
                <li className="flex gap-x-3">
                  <CheckCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-400" />
                  <span>A consistent flow of fresh, targeted leads</span>
                </li>
                <li className="flex gap-x-3">
                  <CheckCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-400" />
                  <span>Audience relevance based on real user activity</span>
                </li>
                <li className="flex gap-x-3">
                  <CheckCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-400" />
                  <span>Higher engagement potential compared to broad or purchased lists</span>
                </li>
              </ul>
              <p className="mt-4">You get meaningful prospects, not generic data.</p>
            </div>

            <div className="border-b border-gray-700 pb-8">
              <h3 className="text-xl font-semibold text-white mb-4">2. Deep Caption Intelligence</h3>
              <p className="mb-4">
                Every great email starts with understanding the recipient.
                MyMailGram reads and interprets publicly available Instagram captions to uncover:
              </p>
              <ul className="space-y-2">
                <li className="flex gap-x-3">
                  <CheckCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-400" />
                  <span>Interests and preferences</span>
                </li>
                <li className="flex gap-x-3">
                  <CheckCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-400" />
                  <span>Pain points and motivations</span>
                </li>
                <li className="flex gap-x-3">
                  <CheckCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-400" />
                  <span>Personality cues</span>
                </li>
                <li className="flex gap-x-3">
                  <CheckCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-400" />
                  <span>Post themes and context</span>
                </li>
              </ul>
              <p className="mt-4">
                This analysis becomes the foundation for highly personalized outreach that feels natural and genuinely relevant.
              </p>
            </div>

            <div className="border-b border-gray-700 pb-8">
              <h3 className="text-xl font-semibold text-white mb-4">3. AI-Powered Personalized Email Generation</h3>
              <p className="mb-4">
                Create compelling outreach messages at scale—without writing from scratch.
                MyMailGram's AI turns each lead's caption into a personalized email body that reflects their tone, interests, and content style.
              </p>
              <p className="mb-4">You can generate messages using:</p>
              <ul className="space-y-2">
                <li className="flex gap-x-3">
                  <CheckCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-400" />
                  <span>Predefined writing prompts</span>
                </li>
                <li className="flex gap-x-3">
                  <CheckCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-400" />
                  <span>Custom prompt templates</span>
                </li>
                <li className="flex gap-x-3">
                  <CheckCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-400" />
                  <span>Different tone and style options</span>
                </li>
              </ul>
              <p className="mt-4">
                The result is emails that feel human, contextual, and aligned with the recipient's real online presence.
              </p>
            </div>

            <div className="border-b border-gray-700 pb-8">
              <h3 className="text-xl font-semibold text-white mb-4">4. Campaign Export for Outreach Workflows</h3>
              <p className="mb-4">
                After generating personalized email content, export your full campaign into a clean, structured file that includes:
              </p>
              <ul className="space-y-2">
                <li className="flex gap-x-3">
                  <CheckCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-400" />
                  <span>Lead profile details</span>
                </li>
                <li className="flex gap-x-3">
                  <CheckCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-400" />
                  <span>Their relevant caption</span>
                </li>
                <li className="flex gap-x-3">
                  <CheckCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-400" />
                  <span>The personalized email copy</span>
                </li>
                <li className="flex gap-x-3">
                  <CheckCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-400" />
                  <span>Any required metadata for your outreach tools</span>
                </li>
              </ul>
              <p className="mt-4">
                This allows you to plug MyMailGram's work into your existing outreach systems, CRMs, or email automation platforms with ease.
              </p>
            </div>

            <div className="border-b border-gray-700 pb-8">
              <h3 className="text-xl font-semibold text-white mb-4">5. Designed for Professional Scale</h3>
              <p className="mb-4">
                From individual creators to enterprise sales teams, MyMailGram is built to support high-volume lead generation and content creation without sacrificing personalization.
              </p>
              <p className="mb-4">Expect:</p>
              <ul className="space-y-2">
                <li className="flex gap-x-3">
                  <CheckCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-400" />
                  <span>Fast processing even with large hashtag pools</span>
                </li>
                <li className="flex gap-x-3">
                  <CheckCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-400" />
                  <span>Reliable exports for high-volume campaigns</span>
                </li>
                <li className="flex gap-x-3">
                  <CheckCircleIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-400" />
                  <span>Consistent quality across thousands of AI-generated emails</span>
                </li>
              </ul>
              <p className="mt-4">Scalability and precision—combined in one platform.</p>
              </div>
              </div>

              <h2 className="mt-16 text-3xl font-semibold tracking-tight text-pretty text-white">
                Upcoming Features (In Development)
              </h2>
              <p className="mt-6">
                These enhancements are planned and will be available in future releases:
              </p>

              <div className="mt-8 space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">1. Direct Email Sending</h3>
              <p>Send your outreach emails directly through MyMailGram using your authenticated business email accounts.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">2. Google Workspace Inbox Integration</h3>
              <p>Read messages, identify replies, and respond directly from the platform.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">3. Automated Follow-Ups</h3>
              <p>AI-generated follow-ups based on lead activity and message context.</p>
            </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">4. Advanced Analytics Dashboard</h3>
                <p>Performance metrics including open rates, reply rates, and engagement insights.</p>
              </div>
              </div>

            <p className="mt-8 text-sm text-gray-400">
              These features are currently under development and not yet available in the live product.
            </p>
          </div>

          <div className="mt-16 max-w-2xl text-gray-400">
            <h2 className="text-3xl font-semibold tracking-tight text-pretty text-white">
              Built for Modern Outreach
            </h2>
            <p className="mt-6">
              MyMailGram bridges the gap between social discovery and personalized communication.
              Instead of generic outreach, you deliver high-quality, context-aware messages—built from real user behavior and crafted with powerful AI.
            </p>
          </div>
          </div>
        </div>
      </main>

      {/* Footer Section */}
      <GetStartedFooter />
    </div>
  )
}
