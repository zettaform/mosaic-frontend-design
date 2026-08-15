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

export default function FundingAnnouncement() {
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
        <div className="relative bg-gray-900 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-16">
            <div className="mx-auto max-w-4xl text-center">
              <div className="mb-8">
                <Link to="/blog" className="text-sm font-semibold text-indigo-400 hover:text-indigo-300">
                  ← Back to Blog
                </Link>
              </div>
              <p className="text-base font-semibold text-indigo-400">Company News</p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-6xl">
                Announcing Our Next Round of Funding
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                MyMailGram secures strategic investment to revolutionize AI-powered outreach and scale intelligent lead generation worldwide
              </p>
              <div className="mt-6 flex items-center justify-center gap-x-4 text-sm text-gray-400">
                <time dateTime="2025-12-15">December 15, 2025</time>
                <span>•</span>
                <span>8 min read</span>
              </div>
            </div>
          </div>
        </div>

        {/* Article Content */}
        <div className="bg-gray-900 pb-24 sm:pb-32">
          <div className="mx-auto max-w-4xl px-6 lg:px-16">
            <article className="prose prose-lg prose-invert max-w-none">
              {/* Featured Image */}
              <div className="mb-12 rounded-2xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1559136555-9303baea8ebd?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80"
                  alt="Team celebrating funding round"
                  className="w-full h-96 object-cover"
                />
              </div>

              {/* Introduction */}
              <div className="text-gray-300 space-y-6">
                <p className="text-xl leading-relaxed">
                  Today marks a pivotal moment in MyMailGram's journey. We're thrilled to announce that we've secured our next round of funding, led by prominent venture capital firms specializing in AI, SaaS, and marketing technology. This investment will accelerate our mission to transform how businesses discover, engage, and convert prospects through intelligent, personalized outreach.
                </p>

                <p>
                  Since launching MyMailGram, we've witnessed firsthand how businesses struggle with cold outreach that feels generic, impersonal, and ineffective. Our platform was built to solve this exact problem—by combining Instagram hashtag intelligence with AI-powered personalization to help companies connect authentically with their ideal customers.
                </p>

                <p>
                  This funding round validates our vision and empowers us to scale our technology, expand our team, and deliver even more value to the thousands of businesses that rely on MyMailGram every day.
                </p>
              </div>

              {/* Section: Why This Matters */}
              <div className="mt-16">
                <h2 className="text-3xl font-bold text-white mb-6">Why This Funding Round Matters</h2>
                <div className="text-gray-300 space-y-6">
                  <p>
                    The outreach landscape is broken. Businesses send thousands of generic emails hoping for a response, while recipients delete them without a second thought. Traditional lead generation tools focus on quantity over quality, and personalization—when it exists—is superficial at best.
                  </p>

                  <p>
                    MyMailGram takes a fundamentally different approach. We believe that meaningful connections start with understanding your audience. By analyzing publicly available Instagram data—captions, hashtags, engagement patterns—we help businesses identify high-intent prospects and craft emails that resonate on a personal level.
                  </p>

                  <p>
                    This funding allows us to:
                  </p>

                  <ul className="list-disc pl-6 space-y-3 text-gray-300">
                    <li><strong className="text-white">Enhance our AI personalization engine</strong> to generate even more contextually relevant, human-like outreach messages</li>
                    <li><strong className="text-white">Expand data sources beyond Instagram</strong> to include LinkedIn, Twitter/X, and other social platforms</li>
                    <li><strong className="text-white">Build native email sending capabilities</strong> so users can launch campaigns directly from MyMailGram</li>
                    <li><strong className="text-white">Develop advanced analytics and reply tracking</strong> to measure campaign performance and optimize over time</li>
                    <li><strong className="text-white">Scale our infrastructure</strong> to support enterprise customers processing millions of leads monthly</li>
                    <li><strong className="text-white">Grow our team</strong> with world-class engineers, data scientists, and customer success professionals</li>
                  </ul>
                </div>
              </div>

              {/* Section: Our Journey So Far */}
              <div className="mt-16">
                <h2 className="text-3xl font-bold text-white mb-6">Our Journey So Far</h2>
                <div className="text-gray-300 space-y-6">
                  <p>
                    MyMailGram began with a simple observation: Instagram is one of the most powerful discovery platforms in the world, yet businesses had no systematic way to convert that discovery into meaningful business relationships.
                  </p>

                  <p>
                    We launched with a core hypothesis: if we could combine Instagram's rich behavioral data with AI-driven personalization, we could help businesses generate leads that actually convert. The results exceeded our expectations.
                  </p>

                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 my-8">
                    <h3 className="text-2xl font-semibold text-white mb-6">Key Milestones</h3>
                    <ul className="space-y-4 text-gray-300">
                      <li className="flex items-start">
                        <span className="text-indigo-400 font-bold mr-3">Q1 2024:</span>
                        <span>Launched beta with 50 early adopters from agencies and SaaS companies</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-indigo-400 font-bold mr-3">Q2 2024:</span>
                        <span>Processed 1 million Instagram profiles and generated 500K personalized emails</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-indigo-400 font-bold mr-3">Q3 2024:</span>
                        <span>Reached 1,000+ active users across 30+ countries</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-indigo-400 font-bold mr-3">Q4 2024:</span>
                        <span>Achieved 40% average reply rate for customers (vs. 2-5% industry average)</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-indigo-400 font-bold mr-3">Q1 2025:</span>
                        <span>Launched advanced AI personalization with custom prompt engineering</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-indigo-400 font-bold mr-3">Q4 2025:</span>
                        <span>Secured strategic funding to accelerate growth and product development</span>
                      </li>
                    </ul>
                  </div>

                  <p>
                    These milestones reflect not just our growth, but the trust our customers place in us to help them build genuine relationships with their prospects.
                  </p>
                </div>
              </div>

              {/* Section: What's Next */}
              <div className="mt-16">
                <h2 className="text-3xl font-bold text-white mb-6">What's Next: Our Product Roadmap</h2>
                <div className="text-gray-300 space-y-6">
                  <p>
                    This funding enables us to execute on an ambitious product roadmap designed to make MyMailGram the most powerful outreach platform in the market.
                  </p>

                  <h3 className="text-2xl font-semibold text-white mt-8 mb-4">1. Multi-Platform Lead Discovery</h3>
                  <p>
                    While Instagram remains our core strength, we're expanding to LinkedIn, Twitter/X, TikTok, and YouTube. Imagine discovering prospects across every major social platform and unifying that data into a single, actionable lead database.
                  </p>

                  <h3 className="text-2xl font-semibold text-white mt-8 mb-4">2. Native Email Sending & Automation</h3>
                  <p>
                    Currently, users export AI-generated emails and send them through their own email clients. Soon, you'll be able to send campaigns directly from MyMailGram with built-in deliverability optimization, A/B testing, and automated follow-ups.
                  </p>

                  <h3 className="text-2xl font-semibold text-white mt-8 mb-4">3. Advanced Reply Intelligence</h3>
                  <p>
                    We're building AI-powered reply detection and sentiment analysis to help you understand which messages resonate, automatically categorize responses, and suggest optimal follow-up strategies.
                  </p>

                  <h3 className="text-2xl font-semibold text-white mt-8 mb-4">4. Team Collaboration & Workspace Features</h3>
                  <p>
                    Agencies and growth teams need to collaborate seamlessly. We're introducing shared workspaces, role-based permissions, campaign templates, and real-time collaboration tools.
                  </p>

                  <h3 className="text-2xl font-semibold text-white mt-8 mb-4">5. Enterprise-Grade Infrastructure</h3>
                  <p>
                    As we scale to serve enterprise customers, we're investing heavily in infrastructure: enhanced security, SOC 2 compliance, dedicated support, custom integrations, and white-label options.
                  </p>

                  <h3 className="text-2xl font-semibold text-white mt-8 mb-4">6. Deeper AI Personalization</h3>
                  <p>
                    Our AI models will get smarter with every campaign. We're developing adaptive learning systems that understand your brand voice, learn from successful campaigns, and continuously improve personalization quality.
                  </p>
                </div>
              </div>

              {/* Section: Our Investors */}
              <div className="mt-16">
                <h2 className="text-3xl font-bold text-white mb-6">Our Investors & Strategic Partners</h2>
                <div className="text-gray-300 space-y-6">
                  <p>
                    This funding round was led by top-tier venture capital firms with deep expertise in AI, SaaS, and marketing technology. Our investors share our vision for transforming outreach and bring invaluable strategic guidance, industry connections, and operational expertise.
                  </p>

                  <p>
                    Beyond capital, our investors are active partners who understand the challenges of building category-defining companies. They've backed successful startups in adjacent spaces and bring proven playbooks for scaling product, go-to-market, and customer success.
                  </p>

                  <p>
                    We're also grateful for the continued support of our angel investors—many of whom are successful founders, marketing executives, and industry thought leaders who use MyMailGram themselves and provide ongoing product feedback.
                  </p>
                </div>
              </div>

              {/* Section: Thank You */}
              <div className="mt-16">
                <h2 className="text-3xl font-bold text-white mb-6">Thank You to Our Community</h2>
                <div className="text-gray-300 space-y-6">
                  <p>
                    None of this would be possible without our incredible community of users, partners, and supporters. You've trusted us with your outreach, provided invaluable feedback, and championed MyMailGram within your networks.
                  </p>

                  <p>
                    To our early adopters: thank you for believing in us when we were just getting started. Your feedback shaped our product, and your success stories inspire us every day.
                  </p>

                  <p>
                    To our team: thank you for your relentless dedication, creativity, and commitment to building something truly transformative. This is just the beginning.
                  </p>

                  <p>
                    To our investors and advisors: thank you for believing in our vision and supporting us on this journey.
                  </p>
                </div>
              </div>

              {/* Section: Join Us */}
              <div className="mt-16">
                <h2 className="text-3xl font-bold text-white mb-6">Join Us on This Journey</h2>
                <div className="text-gray-300 space-y-6">
                  <p>
                    We're just getting started. If you're a business looking to transform your outreach, a talented professional interested in joining our team, or an investor excited about the future of AI-powered marketing—we'd love to hear from you.
                  </p>

                  <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-8 my-8">
                    <h3 className="text-2xl font-semibold text-white mb-4">Get Involved</h3>
                    <ul className="space-y-3 text-gray-300">
                      <li>
                        <strong className="text-white">Try MyMailGram:</strong> Sign up for a free trial and experience intelligent outreach firsthand
                      </li>
                      <li>
                        <strong className="text-white">Join Our Team:</strong> We're hiring across engineering, product, sales, and customer success
                      </li>
                      <li>
                        <strong className="text-white">Partner With Us:</strong> Interested in integrations, reselling, or strategic partnerships? Let's talk
                      </li>
                      <li>
                        <strong className="text-white">Stay Updated:</strong> Follow our blog for product updates, outreach strategies, and industry insights
                      </li>
                    </ul>
                  </div>

                  <p className="text-xl font-semibold text-white">
                    The future of outreach is personal, intelligent, and human. We're building it—and we'd love for you to be part of it.
                  </p>
                </div>
              </div>

              {/* Call to Action */}
              <div className="mt-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-center">
                <h3 className="text-2xl font-bold text-white mb-4">Ready to Transform Your Outreach?</h3>
                <p className="text-lg text-gray-100 mb-6">
                  Join thousands of businesses using MyMailGram to generate high-quality leads and personalized campaigns.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    to="/signup"
                    className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 transition-colors duration-200"
                  >
                    Start Free Trial
                  </Link>
                  <Link
                    to="/contact"
                    className="inline-flex items-center justify-center px-6 py-3 border-2 border-white text-base font-medium rounded-md text-white hover:bg-white/10 transition-colors duration-200"
                  >
                    Contact Sales
                  </Link>
                </div>
              </div>

              {/* Share & Related */}
              <div className="mt-16 pt-8 border-t border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-400 mb-2">Share this article</p>
                    <div className="flex gap-4">
                      <a href="#" className="text-gray-400 hover:text-white transition-colors">
                        <span className="sr-only">Share on Twitter</span>
                        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M13.6823 10.6218L20.2391 3H18.6854L12.9921 9.61788L8.44486 3H3.2002L10.0765 13.0074L3.2002 21H4.75404L10.7663 14.0113L15.5685 21H20.8131L13.6819 10.6218H13.6823ZM11.5541 13.0956L10.8574 12.0991L5.31391 4.16971H7.70053L12.1742 10.5689L12.8709 11.5655L18.6861 19.8835H16.2995L11.5541 13.096V13.0956Z" />
                        </svg>
                      </a>
                      <a href="#" className="text-gray-400 hover:text-white transition-colors">
                        <span className="sr-only">Share on LinkedIn</span>
                        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                      </a>
                      <a href="#" className="text-gray-400 hover:text-white transition-colors">
                        <span className="sr-only">Share on Facebook</span>
                        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                          <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                        </svg>
                      </a>
                    </div>
                  </div>
                  <Link
                    to="/blog"
                    className="text-sm font-semibold text-indigo-400 hover:text-indigo-300"
                  >
                    View all articles →
                  </Link>
                </div>
              </div>
            </article>
          </div>
        </div>
      </main>

      {/* Footer Section */}
      <GetStartedFooter />
    </div>
  )
}
