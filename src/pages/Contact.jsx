'use client'

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { ChatBubbleLeftRightIcon, ComputerDesktopIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import { Logo } from '../components/Logo'
import { GetStartedFooter } from '../components/GetStartedFooter'

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'About Us', href: '/about' },
  { name: 'Features', href: '/features' },
  { name: 'Pricing', href: '/pricing' },
  { name: 'Contact', href: '/contact' },
]

export default function Contact() {
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

      {/* Contact Component */}
      <div className="isolate bg-gray-900 px-6 py-12 sm:py-16 lg:px-16">
        <div className="mx-auto max-w-4xl">
          {/* Header Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl mb-4">
              Contact Us - MyMailGram
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              At MyMailGram, we're here to help you make the most out of your email outreach and automation experience. Whether you have a question, need technical assistance, or want to explore partnership opportunities — we're always happy to hear from you.
            </p>
          </div>

          {/* How Can We Help Section */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-12 text-center">How Can We Help?</h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {/* General inquiries */}
              <div className="flex gap-x-6">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-indigo-500">
                  <ChatBubbleLeftRightIcon aria-hidden="true" className="size-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">General inquiries & support</h3>
                  <p className="text-gray-400 mb-4">
                    Have a question about features, plans, or how MyMailGram works?
                    Reach out to our support team and we'll get back to you as soon as possible.
                  </p>
                  <p className="text-sm font-semibold text-indigo-400">
                    Email: support@mymailgram.com
                  </p>
                </div>
              </div>

              {/* Onboarding support */}
              <div className="flex gap-x-6">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-indigo-500">
                  <UserGroupIcon aria-hidden="true" className="size-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">Need Help Getting Started?</h3>
                  <p className="text-gray-400 mb-4">
                    If you're just getting started with MyMailGram or need help setting up your account, we'd be glad to assist.
                    Whether it's connecting your Gmail account, learning our tools, or understanding best practices — we're here to guide you.
                  </p>
                  <p className="text-sm font-semibold text-indigo-400">
                    Onboarding & setup support: onboarding@mymailgram.com
                  </p>
                </div>
              </div>

              {/* Sales & Partnership */}
              <div className="flex gap-x-6">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-indigo-500">
                  <ComputerDesktopIcon aria-hidden="true" className="size-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">Sales & Partnership Inquiries</h3>
                  <p className="text-gray-400 mb-4">
                    Interested in enterprise features, agency partnerships, or custom integrations?
                    Our sales team is ready to help find the right solution for your business.
                  </p>
                  <p className="text-sm font-semibold text-indigo-400">
                    Sales: sales@mymailgram.com
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Quick Contact Form */}
          <div className="bg-gray-800 rounded-lg p-8 mt-16">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Quick Contact Form</h2>
            <p className="text-gray-400 mb-8 text-center max-w-2xl mx-auto">
              Contact Form:
            </p>
            <form className="max-w-md mx-auto space-y-6">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter your email address"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter subject"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-vertical"
                  placeholder="Enter your message"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800"
              >
                Send Message
              </button>
            </form>
            <p className="text-gray-400 text-center mt-6 text-sm">
              Your message goes directly to our support inbox — and we aim to reply within 24 hours.
            </p>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <GetStartedFooter />
    </div>
  )
}