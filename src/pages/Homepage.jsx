import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bars3Icon, XMarkIcon, MinusSmallIcon, PlusSmallIcon } from '@heroicons/react/24/outline'
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import { Pricing } from '../components/Pricing';
import { Logo } from '../components/Logo';
import { GetStartedFooter } from '../components/GetStartedFooter';
import Newsletter from '../components/Newsletter';

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'About Us', href: '/about' },
  { name: 'Features', href: '/features' },
  { name: 'Pricing', href: '/pricing' },
  { name: 'Contact', href: '/contact' },
]

export default function Homepage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [shouldAutoplayVideo, setShouldAutoplayVideo] = useState(false)
  const videoRef = useRef(null)
  const howItWorksRef = useRef(null)
  const navigate = useNavigate()

  // Prevent any "white edge" peeking through on mobile by forcing the root/page
  // background to black while the homepage is mounted.
  useEffect(() => {
    const prevBodyBg = document.body.style.backgroundColor
    const prevHtmlBg = document.documentElement.style.backgroundColor

    document.body.style.backgroundColor = '#000'
    document.documentElement.style.backgroundColor = '#000'

    return () => {
      document.body.style.backgroundColor = prevBodyBg
      document.documentElement.style.backgroundColor = prevHtmlBg
    }
  }, [])

  // Ensure homepage text styles are reset when component mounts
  useEffect(() => {
    // Remove any lingering text size adjustment styles from admin pages
    const existingStyle = document.getElementById('text-size-style');
    if (existingStyle) {
      existingStyle.remove();
    }

    const resetStyle = document.getElementById('text-size-reset');
    if (resetStyle) {
      resetStyle.remove();
    }

    // Reset CSS variables
    const root = document.documentElement;
    root.style.removeProperty('--base-font-size');
    root.style.removeProperty('--base-font-weight');

    // Force a complete reset by creating a temporary reset style
    const homepageResetStyle = document.createElement('style');
    homepageResetStyle.id = 'homepage-text-reset';
    homepageResetStyle.textContent = `
      .text-3xl { font-size: 1.875rem !important; }
      .text-6xl { font-size: 3.75rem !important; }
      .text-4xl { font-size: 2.25rem !important; }
      .text-5xl { font-size: 3rem !important; }
      .text-7xl { font-size: 4.5rem !important; }
      .text-xs { font-size: 0.75rem !important; }
      .text-sm { font-size: 0.875rem !important; }
      .text-base { font-size: 1rem !important; }
      .text-lg { font-size: 1.125rem !important; }
      .text-xl { font-size: 1.25rem !important; }
      .text-2xl { font-size: 1.5rem !important; }
      .text-8xl { font-size: 6rem !important; }
      .text-9xl { font-size: 8rem !important; }
    `;
    document.head.appendChild(homepageResetStyle);

    // Remove the reset style after a short delay to allow re-rendering
    setTimeout(() => {
      const resetElement = document.getElementById('homepage-text-reset');
      if (resetElement) {
        resetElement.remove();
      }
    }, 50);

    // Cleanup function
    return () => {
      const resetElement = document.getElementById('homepage-text-reset');
      if (resetElement) {
        resetElement.remove();
      }
    };
  }, [])

  const handleNavigation = (href) => {
    navigate(href)
  }

  const handleGetStartedClick = (e) => {
    e.preventDefault()
    // Scroll to video section
    if (videoRef.current) {
      videoRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // Enable autoplay after a short delay to ensure scroll has started
      setTimeout(() => {
        setShouldAutoplayVideo(true)
      }, 500)
    }
  }

  const handleSeeHowItWorksClick = (e) => {
    e.preventDefault()
    if (howItWorksRef.current) {
      howItWorksRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
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
    <div className="bg-gray-900 w-full overflow-x-hidden" style={{ minHeight: '100vh' }}>
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

      <div className="relative isolate px-6 pt-14 lg:px-16 overflow-x-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
        >
          <div
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
            className="relative left-[calc(50%-11rem)] aspect-1155/678 w-144.5 -translate-x-1/2 rotate-30 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-288.75"
          />
        </div>
        <div className="mx-auto max-w-2xl py-8 sm:py-12 lg:py-14">
          <div className="text-center">
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-6xl leading-tight">
              <span className="block whitespace-nowrap">Turn Instagram hashtags</span>
              <span className="block whitespace-nowrap">into email leads</span>
            </h1>
            <p className="mt-8 text-lg font-medium text-pretty text-gray-400 sm:text-xl/8">
              Find niche Instagram profiles and reach them with personalized email outreach that feels relevant, not generic.
            </p>
            <div className="mt-10 overflow-hidden py-8 px-16 sm:px-20">
              <div className="flex items-center justify-center gap-x-6 relative">
                {/* Animated arrows pointing to Get Started button */}
              <div className="hidden sm:block absolute -left-16 top-1/2 transform -translate-y-1/2 arrow-bounce">
                <svg className="w-8 h-8 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13.025 1l-2.847 2.828 6.176 6.176h-16.354v3.992h16.354l-6.176 6.176 2.847 2.828 10.975-11z"/>
                </svg>
              </div>
              <div className="hidden sm:block absolute -right-16 top-1/2 transform -translate-y-1/2 arrow-bounce" style={{animationDelay: '0.5s'}}>
                <svg className="w-8 h-8 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13.025 1l-2.847 2.828 6.176 6.176h-16.354v3.992h16.354l-6.176 6.176 2.847 2.828 10.975-11z"/>
                </svg>
              </div>
              
              {/* Animated particles around Get Started button */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 w-2 h-2 bg-indigo-400 rounded-full particle-float" style={{animationDelay: '0s'}}></div>
                <div className="absolute top-2 right-1/4 w-1 h-1 bg-indigo-300 rounded-full particle-float" style={{animationDelay: '1s'}}></div>
                <div className="absolute bottom-2 left-1/4 w-1.5 h-1.5 bg-indigo-500 rounded-full particle-float" style={{animationDelay: '2s'}}></div>
                <div className="absolute top-1/2 left-0 w-1 h-1 bg-indigo-400 rounded-full particle-float" style={{animationDelay: '0.5s'}}></div>
                <div className="absolute top-1/2 right-0 w-1 h-1 bg-indigo-300 rounded-full particle-float" style={{animationDelay: '1.5s'}}></div>
                <div className="absolute top-1/4 left-1/3 w-1 h-1 bg-indigo-200 rounded-full particle-float" style={{animationDelay: '2.5s'}}></div>
                <div className="absolute bottom-1/4 right-1/3 w-1 h-1 bg-indigo-600 rounded-full particle-float" style={{animationDelay: '3s'}}></div>
              </div>

              {/* Lightning bolt effects */}
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 lightning-effect">
                <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 24 24" style={{animationDelay: '0.3s'}}>
                  <path d="M7 2v11h3v9l7-12h-4l4-8z"/>
                </svg>
              </div>
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 lightning-effect" style={{animationDelay: '0.7s'}}>
                <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 2v11h3v9l7-12h-4l4-8z"/>
                </svg>
              </div>

              {/* Tech-savvy data stream effect */}
              <div className="hidden sm:block absolute -left-8 top-1/2 transform -translate-y-1/2 opacity-60">
                <div className="flex flex-col space-y-1">
                  <div className="w-1 h-1 bg-green-400 rounded-full animate-ping" style={{animationDelay: '0s'}}></div>
                  <div className="w-1 h-1 bg-green-400 rounded-full animate-ping" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-1 h-1 bg-green-400 rounded-full animate-ping" style={{animationDelay: '0.4s'}}></div>
                </div>
              </div>
              <div className="hidden sm:block absolute -right-8 top-1/2 transform -translate-y-1/2 opacity-60">
                <div className="flex flex-col space-y-1">
                  <div className="w-1 h-1 bg-green-400 rounded-full animate-ping" style={{animationDelay: '0.6s'}}></div>
                  <div className="w-1 h-1 bg-green-400 rounded-full animate-ping" style={{animationDelay: '0.8s'}}></div>
                  <div className="w-1 h-1 bg-green-400 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
                </div>
              </div>

              <button
                onClick={handleSeeHowItWorksClick}
                className="relative rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 tech-glow tech-pulse hover:animate-none transform hover:scale-110 transition-all duration-300"
              >
                <span className="relative z-10">See how it works</span>
                {/* Glowing ring effect */}
                <div className="absolute inset-0 rounded-md bg-indigo-400 opacity-0 animate-ping" style={{animationDuration: '2s'}}></div>
                <div className="absolute inset-0 rounded-md bg-indigo-300 opacity-0 animate-ping" style={{animationDuration: '2s', animationDelay: '1s'}}></div>
                <div className="absolute inset-0 rounded-md bg-indigo-200 opacity-0 animate-ping" style={{animationDuration: '2s', animationDelay: '2s'}}></div>
              </button>
              <a 
                href="#" 
                onClick={handleGetStartedClick}
                className="text-sm/6 font-semibold text-white hover:text-indigo-300 transition-colors duration-300"
              >
                Watch demo <span aria-hidden="true">→</span>
              </a>
              </div>
            </div>
            
            {/* Demo Video Section */}
            <div id="demo-video" ref={videoRef} className="mt-16 sm:mt-20">
              <div className="mx-auto max-w-4xl">
                <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                  {/* Sample video embed - replace with your actual video URL */}
                  <iframe
                    key={shouldAutoplayVideo ? 'autoplay' : 'normal'}
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube.com/embed/yfE09Vv1m3g${shouldAutoplayVideo ? '?autoplay=1' : ''}`}
                    title="From Hashtag to Personalized Emails | MyMailGram Full Walkthrough"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  ></iframe>
                </div>
                
                {/* Video title and description */}
                <div className="mt-4 text-center">
                  <p className="text-sm font-semibold text-white">Watch Demo</p>
                  <p className="mt-1 text-xs text-gray-400">See how MyMailGram works in action</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
        >
          <div
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
            className="relative left-[calc(50%+3rem)] aspect-1155/678 w-144.5 -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-288.75"
          />
        </div>
      </div>

      {/* Business value section */}
      <section className="bg-gray-900">
        <div className="mx-auto max-w-7xl px-6 py-12 sm:py-16 lg:px-16 lg:py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              What this does for your business
            </h2>
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {[
                'Turn Instagram interest into predictable outbound lead generation',
                'Reach prospects already talking about topics related to your service',
                'Reduce time spent on manual research and list building',
                'Send outreach that feels relevant instead of generic or spammy',
              ].map((point, idx) => (
                <div
                  key={point}
                  className="rounded-2xl bg-white/2.5 p-6 ring-1 ring-white/10"
                >
                  <div className="flex items-start gap-4">
                    <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-900/40 ring-1 ring-white/10">
                      <span className="text-xs font-semibold text-indigo-300 tabular-nums">{idx + 1}</span>
                    </span>
                    <p className="text-base text-gray-300">{point}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Problem awareness */}
      <section className="bg-gray-900">
        <div className="mx-auto max-w-7xl px-6 py-12 sm:py-16 lg:px-16 lg:py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Instagram has attention, not conversations
            </h2>
            <ul className="mt-8 space-y-4 text-base text-gray-300">
              {[
                'Likes and followers don’t automatically become leads',
                'DMs are inconsistent and hard to scale',
                'Manual prospect research doesn’t grow with your business',
                'Generic cold emails get ignored',
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-8 text-base text-gray-400">
              MyMailGram bridges the gap between Instagram attention and real sales conversations by turning Instagram hashtags into targeted, context-driven email outreach.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section ref={howItWorksRef} className="bg-gray-900">
        <div className="mx-auto max-w-7xl px-6 py-12 sm:py-16 lg:px-16 lg:py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              How MyMailGram works
            </h2>
            <div className="mt-10">
              <div className="rounded-2xl bg-white/2.5 px-6 py-8 ring-1 ring-white/10 sm:px-8">
                <ol className="space-y-10">
                  {[
                    {
                      number: '01',
                      title: 'Find prospects by hashtag',
                      body: 'Search Instagram hashtags to discover niche‑relevant profiles.',
                    },
                    {
                      number: '02',
                      title: 'Collect enriched profile data',
                      body: 'Automatically gather usernames, captions, follower count, post activity, and available emails.',
                    },
                    {
                      number: '03',
                      title: 'Create personal broadcast emails',
                      body: 'Use real Instagram context to write outreach emails that feel human and relevant.',
                    },
                    {
                      number: '04',
                      title: 'Export and run your campaign',
                      body: 'Download the campaign file and send outreach using your preferred email tool.',
                    },
                  ].map((step, idx, arr) => {
                    const isLast = idx === arr.length - 1
                    return (
                      <li key={step.number} className={`relative pl-16 ${isLast ? '' : 'pb-2'}`}>
                        {/* Step number */}
                        <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full bg-gray-900/40 ring-1 ring-white/10">
                          <span className="text-xs font-semibold text-indigo-300 tabular-nums">
                            {step.number}
                          </span>
                        </div>

                        {/* Connector + arrow */}
                        {!isLast && (
                          <>
                            <span
                              aria-hidden="true"
                              className="absolute left-5 top-10 h-[calc(100%+1.75rem)] w-px bg-white/10"
                            />
                            <span
                              aria-hidden="true"
                              className="absolute left-5 bottom-0 h-5 w-5 -translate-x-1/2 translate-y-3 text-white/40"
                            >
                              <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                                <path
                                  fillRule="evenodd"
                                  d="M10 16a.75.75 0 0 1-.53-.22l-5-5a.75.75 0 1 1 1.06-1.06l3.72 3.72V4.75a.75.75 0 0 1 1.5 0v8.69l3.72-3.72a.75.75 0 1 1 1.06 1.06l-5 5A.75.75 0 0 1 10 16Z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </span>
                          </>
                        )}

                        {/* Copy */}
                        <h3 className="text-base font-semibold text-white">{step.title}</h3>
                        <p className="mt-2 max-w-prose text-sm leading-6 text-gray-300">{step.body}</p>
                      </li>
                    )
                  })}
                </ol>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Expected outcomes */}
      <section className="bg-gray-900">
        <div className="mx-auto max-w-7xl px-6 py-12 sm:py-16 lg:px-16 lg:py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              What you can expect after using MyMailGram
            </h2>
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {[
                'More relevant outbound conversations',
                'Higher reply rates compared to generic cold emails',
                'A repeatable process to generate leads from Instagram',
                'Less guessing, more consistency in outreach results',
              ].map((item, idx) => (
                <div key={item} className="rounded-2xl bg-white/2.5 p-6 ring-1 ring-white/10">
                  <div className="flex items-start gap-4">
                    <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-900/40 ring-1 ring-white/10">
                      <span className="text-xs font-semibold text-indigo-300 tabular-nums">{idx + 1}</span>
                    </span>
                    <p className="text-base text-gray-300">{item}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Personal broadcast clarification */}
      <section className="bg-gray-900">
        <div className="mx-auto max-w-7xl px-6 py-12 sm:py-16 lg:px-16 lg:py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              What we mean by personal broadcasts
            </h2>
            <p className="mt-6 text-base text-gray-300">
              A personal broadcast is one thoughtfully written email, personalized using Instagram profile context, and sent to a targeted list — without sounding automated or spammy.
            </p>
            <ul className="mt-8 space-y-4 text-base text-gray-300">
              {['Not mass blasting', 'Not DM automation', 'Context-driven email outreach'].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="bg-gray-900">
        <div className="mx-auto max-w-7xl px-6 py-12 sm:py-16 lg:px-16 lg:py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Who uses MyMailGram
            </h2>
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {[
                'Agencies finding brands through niche hashtags',
                'Consultants identifying prospects discussing specific problems',
                'Service businesses reaching relevant local or industry audiences',
                'Creators and ecommerce teams converting Instagram interest into email conversations',
              ].map((item, idx) => (
                <div key={item} className="rounded-2xl bg-gray-800/50 p-6 ring-1 ring-white/10">
                  <div className="flex items-start gap-4">
                    <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-900/40 ring-1 ring-white/10">
                      <span className="text-xs font-semibold text-indigo-300 tabular-nums">{idx + 1}</span>
                    </span>
                    <p className="text-base text-gray-300">{item}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing (lower on page) */}
      <Pricing />
      
      {/* FAQ Section */}
      <div className="bg-gray-900">
        <div className="mx-auto max-w-7xl px-6 py-12 sm:py-16 lg:px-16 lg:py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">Frequently asked questions</h2>
            <p className="mt-6 text-base/7 text-gray-400">
              Have a different question and can't find the answer you're looking for? Reach out to our support team by{' '}
              <Link to="/contact" className="font-semibold text-indigo-400 hover:text-indigo-300">
                contacting us
              </Link>{' '}
              and we'll get back to you as soon as we can.
            </p>
            <dl className="mt-16 divide-y divide-white/10">
              {[
                {
                  question: 'Where does the Instagram data come from?',
                  answer:
                    'MyMailGram uses publicly available Instagram profile data (like usernames, bios, and captions) to help you build a targeted prospect list from Instagram hashtags.',
                },
                {
                  question: 'Can I edit the outreach emails before sending?',
                  answer:
                    'Yes. You can edit the personal broadcast email copy before you export and run your campaign.',
                },
                {
                  question: 'How does this fit within email marketing compliance?',
                  answer:
                    'You run outreach using your own email tool, and you should follow the compliance rules and best practices that apply to your business (for example, consent, identification, and unsubscribes where required).',
                },
                {
                  question: 'Is this spam or mass emailing?',
                  answer:
                    'No. MyMailGram is designed for targeted, context-driven personal broadcast emails — not mass blasting or automated DMs.',
                },
              ].map((faq) => (
                <Disclosure key={faq.question} as="div" className="py-6 first:pt-0 last:pb-0">
                  <dt>
                    <DisclosureButton className="group flex w-full items-start justify-between text-left text-white">
                      <span className="text-base/7 font-semibold">{faq.question}</span>
                      <span className="ml-6 flex h-7 items-center">
                        <PlusSmallIcon aria-hidden="true" className="size-6 group-data-open:hidden" />
                        <MinusSmallIcon aria-hidden="true" className="size-6 group-not-data-open:hidden" />
                      </span>
                    </DisclosureButton>
                  </dt>
                  <DisclosurePanel as="dd" className="mt-2 pr-12">
                    <p className="text-base/7 text-gray-400">{faq.answer}</p>
                  </DisclosurePanel>
                </Disclosure>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* Footer */}
      <GetStartedFooter />

      {/* Newsletter Section */}
      <Newsletter />
    </div>
  )
}