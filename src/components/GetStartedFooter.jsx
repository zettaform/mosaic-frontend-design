import { Link } from 'react-router-dom'

export function GetStartedFooter() {
  return (
    <footer className="bg-gray-900">
      <div className="mx-auto max-w-7xl px-6 pt-12 pb-4 sm:pt-16 sm:pb-6 lg:px-8 lg:pt-20 lg:pb-8">
        <div className="mx-auto max-w-2xl text-center">
          <hgroup>
            <h2 className="text-base/7 font-semibold text-indigo-400">Get started</h2>
            <p className="mt-2 text-4xl font-semibold tracking-tight text-balance text-white sm:text-5xl">
              Boost your productivity. Start using our app today.
            </p>
          </hgroup>
          <p className="mx-auto mt-6 max-w-xl text-lg/8 text-pretty text-gray-400">
            Generate high-intent leads and personalised email campaigns using intelligent hashtag analysis.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              to="/signup"
              className="rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            >
              Get started
            </Link>
          </div>
        </div>
        <div className="mt-24 border-t border-white/10 pt-12 xl:grid xl:grid-cols-3 xl:gap-8">
          <Link to="/">
            <img
              src="/fav3-logo-512x512.png"
              alt="MLG"
              className="h-8 w-auto hover:scale-105 transition-all duration-300 drop-shadow-2xl cursor-pointer"
            />
          </Link>
          <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm/6 font-semibold text-white">Solutions</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {[
                    { name: 'Marketing', href: '/marketing' },
                    { name: 'Analytics', href: '/analytics' },
                    { name: 'Automation', href: '/automation' },
                    { name: 'Insights', href: '/insights' },
                  ].map((item) => (
                    <li key={item.name}>
                      <Link to={item.href} className="text-sm/6 text-gray-400 hover:text-white">
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm/6 font-semibold text-white">Support</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {[
                    { name: 'Submit ticket', href: '/submit-ticket' },
                    { name: 'Documentation', href: '/documentation' },
                    { name: 'Guides', href: '/guides' },
                  ].map((item) => (
                    <li key={item.name}>
                      <Link to={item.href} className="text-sm/6 text-gray-400 hover:text-white">
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm/6 font-semibold text-white">Company</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {[
                    { name: 'About', href: '/about' },
                    { name: 'Blog', href: '/blog' },
                    { name: 'Jobs', href: '/jobs' },
                  ].map((item) => (
                    <li key={item.name}>
                      <Link to={item.href} className="text-sm/6 text-gray-400 hover:text-white">
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm/6 font-semibold text-white">Legal</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {[
                    { name: 'Terms of service', href: '/terms-of-service' },
                    { name: 'Privacy policy', href: '/privacy-policy' },
                    { name: 'License', href: '/license' },
                  ].map((item) => (
                    <li key={item.name}>
                      <Link to={item.href} className="text-sm/6 text-gray-400 hover:text-white">
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
