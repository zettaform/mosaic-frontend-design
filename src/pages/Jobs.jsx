import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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

export default function Jobs() {
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

      <div className="overflow-hidden bg-gray-900 py-24 sm:py-32 pt-32">
        <div className="relative isolate">
          <div className="mx-auto max-w-7xl sm:px-6 lg:px-16">
            <div className="mx-auto flex max-w-2xl flex-col gap-16 bg-white/3 px-6 py-16 ring-1 ring-white/10 sm:rounded-3xl sm:p-8 lg:mx-0 lg:max-w-none lg:flex-row lg:items-center lg:py-20 xl:gap-x-20 xl:px-20">
              <img
                alt="Team collaboration"
                src="https://images.unsplash.com/photo-1519338381761-c7523edc1f46?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
                className="h-96 w-full flex-none rounded-2xl object-cover shadow-xl lg:aspect-square lg:h-auto lg:max-w-sm"
              />
              <div className="w-full flex-auto">
                <h1 className="text-4xl font-semibold tracking-tight text-pretty text-white sm:text-5xl">
                  Careers at MyMailGram
                </h1>
                <h2 className="mt-4 text-xl font-medium text-indigo-400">
                  Join Us in Redefining AI-Powered Outreach
                </h2>
                <p className="mt-6 text-lg/8 text-pretty text-gray-400">
                  At MyMailGram, we're building tools that help businesses connect with the right audience through intelligent lead discovery and personalised email generation. If you're passionate about modern AI, clean design, meaningful communication, and building products people love, you'll feel right at home here.
                </p>

                <h3 className="mt-10 text-lg font-semibold text-white">Why Work With Us</h3>
                <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-3 text-base/7 text-gray-200 sm:grid-cols-2">
                  <div className="flex gap-x-3">
                    <span className="text-indigo-400">✓</span>
                    Build impactful technology
                  </div>
                  <div className="flex gap-x-3">
                    <span className="text-indigo-400">✓</span>
                    Remote-first team
                  </div>
                  <div className="flex gap-x-3">
                    <span className="text-indigo-400">✓</span>
                    Ownership & growth
                  </div>
                  <div className="flex gap-x-3">
                    <span className="text-indigo-400">✓</span>
                    Competitive compensation
                  </div>
                </div>

                <div className="mt-10">
                  <a href="mailto:careers@mymailgram.com" className="text-sm/6 font-semibold text-indigo-400 hover:text-indigo-300">
                    Apply for a position
                    <span aria-hidden="true">&rarr;</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div
            aria-hidden="true"
            className="absolute inset-x-0 -top-16 -z-10 flex transform-gpu justify-center overflow-hidden blur-3xl"
          >
            <div
              style={{
                clipPath:
                  'polygon(73.6% 51.7%, 91.7% 11.8%, 100% 46.4%, 97.4% 82.2%, 92.5% 84.9%, 75.7% 64%, 55.3% 47.5%, 46.5% 49.4%, 45% 62.9%, 50.3% 87.2%, 21.3% 64.1%, 0.1% 100%, 5.4% 51.1%, 21.4% 63.9%, 58.9% 0.2%, 73.6% 51.7%)',
              }}
              className="aspect-1318/752 w-329.5 flex-none bg-linear-to-r from-[#80caff] to-[#4f46e5] opacity-20"
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-900 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-16">
          <div className="mx-auto max-w-4xl">
            <section className="mb-16">
              <h2 className="text-3xl font-semibold tracking-tight text-pretty text-white mb-8">
                Current Openings
              </h2>
              <p className="text-lg text-gray-400 mb-8">
                We're a fast-growing team and always open to meeting talented people. Right now, we're looking for individuals who are excited about:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-x-3 p-4 bg-gray-800 rounded-lg">
                  <span className="text-indigo-400">✓</span>
                  <span className="text-gray-200">Frontend Development (React + Tailwind)</span>
                </div>
                <div className="flex items-center gap-x-3 p-4 bg-gray-800 rounded-lg">
                  <span className="text-indigo-400">✓</span>
                  <span className="text-gray-200">Backend Development (Node.js / Python)</span>
                </div>
                <div className="flex items-center gap-x-3 p-4 bg-gray-800 rounded-lg">
                  <span className="text-indigo-400">✓</span>
                  <span className="text-gray-200">AI & Prompt Engineering</span>
                </div>
                <div className="flex items-center gap-x-3 p-4 bg-gray-800 rounded-lg">
                  <span className="text-indigo-400">✓</span>
                  <span className="text-gray-200">UI/UX Design</span>
                </div>
              </div>
              <p className="mt-8 text-gray-400">
                If you believe you can bring value—even if your role isn't listed—feel free to reach out.
              </p>
            </section>

            <section className="mb-16">
              <h2 className="text-3xl font-semibold tracking-tight text-pretty text-white mb-8">
                How to Apply
              </h2>
              <p className="text-lg text-gray-400 mb-6">Send us:</p>
              <ul className="list-disc pl-6 text-gray-400 space-y-2 mb-8">
                <li>Your resume</li>
                <li>Your portfolio (if applicable)</li>
                <li>A short note about why you'd like to join</li>
              </ul>
              <p className="text-gray-400">
                Email: <a href="mailto:careers@mymailgram.com" className="text-indigo-400 hover:text-indigo-300">careers@mymailgram.com</a>
              </p>
              <p className="mt-4 text-gray-400">
                We review every application and get back to all serious candidates.
              </p>
            </section>

            <section className="text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-pretty text-white mb-6">
                Let's Build the Future of Outreach Together
              </h2>
              <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
                If you're excited about AI, automation, and helping businesses connect more authentically at scale, MyMailGram is the place for you.
              </p>
              <a
                href="mailto:careers@mymailgram.com"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200"
              >
                Get in Touch
              </a>
            </section>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <GetStartedFooter />
    </div>
  )
}
