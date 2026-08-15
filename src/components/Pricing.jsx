import { Fragment, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckIcon, MinusIcon, PlusIcon } from '@heroicons/react/16/solid'
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react'

const tiers = [
  {
    name: 'Starter',
    planKey: 'starter',
    description: 'For individuals starting Instagram-based outreach.',
    priceMonthly: '$149',
    emails: '25k emails',
    writes: '50k writes',
    additionalEmails: '$4/k',
    additionalWrites: '$2/k',
    highlights: [
      { description: '25,000 emails included' },
      { description: '50,000 writes included' },
      { description: 'Additional emails: $4 per 1,000' },
      { description: 'Additional writes: $2 per 1,000' },
      { description: 'Dashboard access' },
      { description: 'Basic tasks management' },
      { description: 'Email features (Prompt Tags, Reply Simulator)' },
      { description: 'Basic settings & account management' },
    ],
  },
  {
    name: 'Growth',
    planKey: 'growth',
    description: 'For teams running consistent hashtag-driven campaigns.',
    priceMonthly: '$499',
    emails: '100k emails',
    writes: '200k writes',
    additionalEmails: '$3/k',
    additionalWrites: '$1.25/k',
    highlights: [
      { description: '100,000 emails included' },
      { description: '200,000 writes included' },
      { description: 'Additional emails: $3 per 1,000' },
      { description: 'Additional writes: $1.25 per 1,000' },
      { description: 'All Starter features' },
      { description: 'Advanced dashboard (Analytics, Fintech)' },
      { description: 'Full tasks management & collections' },
      { description: 'Complete email suite (Gmail Conversations, Postal API)' },
      { description: 'Crypto features (Admin Keys, Payment Links)' },
      { description: 'Advanced settings & billing' },
    ],
  },
  {
    name: 'Scale',
    planKey: 'scale',
    description: 'For agencies managing multiple outreach workflows.',
    priceMonthly: '$999',
    emails: '250k emails',
    writes: '500k writes',
    additionalEmails: '$2.5/k',
    additionalWrites: '$1/k',
    highlights: [
      { description: '250,000 emails included' },
      { description: '500,000 writes included' },
      { description: 'Additional emails: $2.50 per 1,000' },
      { description: 'Additional writes: $1 per 1,000' },
      { description: 'All Growth features' },
      { description: 'Full campaign management & analytics' },
      { description: 'Complete admin suite (Tasks, Credits, AI Models)' },
      { description: 'Advanced crypto tools (BTC XPUB, Generated Addresses)' },
      { description: 'Luxury features & premium tools' },
      { description: 'API access & custom integrations' },
      { description: 'Azure Tables Storage access' },
      { description: 'Priority phone support' },
      { description: 'Dedicated account manager' },
    ],
  },
]

const sections = [
  {
    name: 'Core Features',
    features: [
      { name: 'Dashboard Access', tiers: { Starter: true, Growth: true, Scale: true } },
      { name: 'Tasks Management', tiers: { Starter: 'Basic', Growth: 'Full', Scale: 'Full' } },
      { name: 'Collections & Saved Results', tiers: { Starter: true, Growth: true, Scale: true } },
      { name: 'Statistics & Analytics', tiers: { Starter: 'Basic', Growth: 'Advanced', Scale: 'Advanced' } },
      { name: 'User Management', tiers: { Starter: false, Growth: true, Scale: true } },
    ],
  },
  {
    name: 'Email & Communication',
    features: [
      { name: 'Prompt Tags', tiers: { Starter: true, Growth: true, Scale: true } },
      { name: 'Reply Simulator', tiers: { Starter: true, Growth: true, Scale: true } },
      { name: 'Gmail Conversations', tiers: { Starter: false, Growth: true, Scale: true } },
      { name: 'Postal API Guide', tiers: { Starter: false, Growth: true, Scale: true } },
    ],
  },
  {
    name: 'Admin & Advanced Tools',
    features: [
      { name: 'Campaign Management', tiers: { Starter: false, Growth: false, Scale: true } },
      { name: 'Campaign Statistics', tiers: { Starter: false, Growth: false, Scale: true } },
      { name: 'AI Models & Prompt Templates', tiers: { Starter: false, Growth: false, Scale: true } },
      { name: 'Credits & Cost Estimator', tiers: { Starter: false, Growth: false, Scale: true } },
      { name: 'Task Metadata & Settings', tiers: { Starter: false, Growth: false, Scale: true } },
      { name: 'Active Durable Functions', tiers: { Starter: false, Growth: false, Scale: true } },
    ],
  },
  {
    name: 'Crypto & Payment Features',
    features: [
      { name: 'Admin Keys', tiers: { Starter: false, Growth: true, Scale: true } },
      { name: 'Payment Links', tiers: { Starter: false, Growth: true, Scale: true } },
      { name: 'BTC XPUB Generator', tiers: { Starter: false, Growth: false, Scale: true } },
      { name: 'Generated Addresses', tiers: { Starter: false, Growth: false, Scale: true } },
      { name: 'Crypto Logs', tiers: { Starter: false, Growth: true, Scale: true } },
    ],
  },
  {
    name: 'Dashboard & Analytics',
    features: [
      { name: 'Main Dashboard', tiers: { Starter: true, Growth: true, Scale: true } },
      { name: 'Analytics Dashboard', tiers: { Starter: false, Growth: true, Scale: true } },
      { name: 'Fintech Dashboard', tiers: { Starter: false, Growth: true, Scale: true } },
    ],
  },
  {
    name: 'Storage & Infrastructure',
    features: [
      { name: 'Azure Tables Storage (ATS)', tiers: { Starter: false, Growth: false, Scale: true } },
      { name: 'Data Storage', tiers: { Starter: '10GB', Growth: '100GB', Scale: 'Unlimited' } },
    ],
  },
  {
    name: 'Support & Services',
    features: [
      { name: 'Email support', tiers: { Starter: true, Growth: true, Scale: true } },
      { name: 'Priority support', tiers: { Starter: false, Growth: false, Scale: true } },
      { name: 'Dedicated account manager', tiers: { Starter: false, Growth: false, Scale: true } },
      { name: 'API access', tiers: { Starter: false, Growth: false, Scale: true } },
      { name: 'Custom integrations', tiers: { Starter: false, Growth: false, Scale: true } },
    ],
  },
]

export function Pricing() {
  const [showPlanDetails, setShowPlanDetails] = useState(false)

  return (
    <div className="bg-gray-900 pt-12 pb-24 sm:pt-16 sm:pb-32">
      <div className="relative pt-8 sm:pt-12">
        <div className="absolute inset-x-0 top-48 bottom-0 bg-[radial-gradient(circle_at_center_center,#7775D680,#592E7180,transparent_70%)] lg:bg-[radial-gradient(circle_at_center_150%,#7775D680,#592E7180,transparent_70%)]" />
        <div className="relative mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-16">
          <div className="mb-10 flex items-center justify-between gap-6 max-sm:flex-col max-sm:items-start">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Pricing
              </h2>
              <p className="mt-2 text-sm text-gray-400">
                Choose a plan based on the scale and usage you need.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowPlanDetails((v) => !v)}
              className="rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-white shadow-none inset-ring inset-ring-white/5 hover:bg-white/20"
            >
              {showPlanDetails ? 'Hide plan details' : 'Show plan details'}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className="-m-2 grid grid-cols-1 rounded-4xl bg-white/2.5 shadow-[inset_0_0_2px_1px_#ffffff32] ring-1 ring-white/10 max-lg:mx-auto max-lg:w-full max-lg:max-w-md"
              >
                <div className="grid grid-cols-1 rounded-4xl p-2">
                  <div className="rounded-3xl bg-gray-800 p-10 pb-9 ring-1 ring-white/10">
                    <h2 className="text-sm font-semibold text-indigo-400">
                      {tier.name} <span className="sr-only">plan</span>
                    </h2>
                    <p className="mt-2 text-sm/6 text-pretty text-gray-300">{tier.description}</p>
                    <div className="mt-8 flex items-center gap-4">
                      <div className="text-5xl font-semibold text-white">{tier.priceMonthly}</div>
                      <div className="text-sm text-gray-400">
                        <p>USD</p>
                        <p>per month</p>
                      </div>
                    </div>
                    <div className="mt-6 space-y-2">
                      <div className="text-sm text-gray-300">
                        <span className="font-medium text-white">{tier.emails}</span>
                      </div>
                      <div className="text-sm text-gray-300">
                        <span className="font-medium text-white">{tier.writes}</span>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <p className="text-xs text-gray-400 mb-2">Additional usage:</p>
                        <div className="text-xs text-gray-400">
                          <p>Emails: {tier.additionalEmails}</p>
                          <p>Writes: {tier.additionalWrites}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-8">
                      <Link
                        to="/signup"
                        aria-label={`Get started with the ${tier.name} plan`}
                        className="inline-block rounded-md bg-indigo-500 px-3.5 py-2 text-center text-sm/6 font-semibold text-white hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
                      >
                        Get started
                      </Link>
                    </div>
                    {showPlanDetails ? (
                      <div className="mt-8">
                        <h3 className="text-sm/6 font-medium text-white">Plan details:</h3>
                        <ul className="mt-3 space-y-3">
                          {tier.highlights.map((highlight) => (
                            <li
                              key={highlight.description}
                              data-disabled={highlight.disabled}
                              className="group flex items-start gap-4 text-sm/6 text-gray-300 data-disabled:text-gray-500"
                            >
                              <span className="inline-flex h-6 items-center">
                                <PlusIcon
                                  aria-hidden="true"
                                  className="size-4 fill-gray-500 group-data-disabled:fill-gray-600"
                                />
                              </span>
                              {highlight.disabled ? <span className="sr-only">Not included:</span> : null}
                              {highlight.description}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="py-16 sm:py-24">
            <div className="logo-carousel-wrapper">
              <div className="logo-carousel">
                {/* First set of logos */}
                <div className="logo-item">
                  <img
                    alt="Transistor"
                    src="https://tailwindcss.com/plus-assets/img/logos/158x48/transistor-logo-white.svg"
                    className="h-9 sm:h-8 lg:h-12 opacity-60 hover:opacity-100 transition-opacity duration-300"
                  />
                </div>
                <div className="logo-item">
                  <img
                    alt="Laravel"
                    src="https://tailwindcss.com/plus-assets/img/logos/158x48/laravel-logo-white.svg"
                    className="h-9 sm:h-8 lg:h-12 opacity-60 hover:opacity-100 transition-opacity duration-300"
                  />
                </div>
                <div className="logo-item">
                  <img
                    alt="Tuple"
                    src="https://tailwindcss.com/plus-assets/img/logos/158x48/tuple-logo-white.svg"
                    className="h-9 sm:h-8 lg:h-12 opacity-60 hover:opacity-100 transition-opacity duration-300"
                  />
                </div>
                <div className="logo-item">
                  <img
                    alt="SavvyCal"
                    src="https://tailwindcss.com/plus-assets/img/logos/158x48/savvycal-logo-white.svg"
                    className="h-9 sm:h-8 lg:h-12 opacity-60 hover:opacity-100 transition-opacity duration-300"
                  />
                </div>
                <div className="logo-item">
                  <img
                    alt="Statamic"
                    src="https://tailwindcss.com/plus-assets/img/logos/158x48/statamic-logo-white.svg"
                    className="h-9 sm:h-8 lg:h-12 opacity-60 hover:opacity-100 transition-opacity duration-300"
                  />
                </div>
                {/* Duplicate set for seamless loop */}
                <div className="logo-item">
                  <img
                    alt="Transistor"
                    src="https://tailwindcss.com/plus-assets/img/logos/158x48/transistor-logo-white.svg"
                    className="h-9 sm:h-8 lg:h-12 opacity-60 hover:opacity-100 transition-opacity duration-300"
                  />
                </div>
                <div className="logo-item">
                  <img
                    alt="Laravel"
                    src="https://tailwindcss.com/plus-assets/img/logos/158x48/laravel-logo-white.svg"
                    className="h-9 sm:h-8 lg:h-12 opacity-60 hover:opacity-100 transition-opacity duration-300"
                  />
                </div>
                <div className="logo-item">
                  <img
                    alt="Tuple"
                    src="https://tailwindcss.com/plus-assets/img/logos/158x48/tuple-logo-white.svg"
                    className="h-9 sm:h-8 lg:h-12 opacity-60 hover:opacity-100 transition-opacity duration-300"
                  />
                </div>
                <div className="logo-item">
                  <img
                    alt="SavvyCal"
                    src="https://tailwindcss.com/plus-assets/img/logos/158x48/savvycal-logo-white.svg"
                    className="h-9 sm:h-8 lg:h-12 opacity-60 hover:opacity-100 transition-opacity duration-300"
                  />
                </div>
                <div className="logo-item">
                  <img
                    alt="Statamic"
                    src="https://tailwindcss.com/plus-assets/img/logos/158x48/statamic-logo-white.svg"
                    className="h-9 sm:h-8 lg:h-12 opacity-60 hover:opacity-100 transition-opacity duration-300"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showPlanDetails ? (
        <div className="mx-auto max-w-2xl px-6 pt-16 sm:pt-24 lg:max-w-7xl lg:px-16">
          <table className="w-full text-left max-sm:hidden">
            <caption className="sr-only">Pricing plan comparison</caption>
            <colgroup>
              <col className="w-2/5" />
              <col className="w-1/5" />
              <col className="w-1/5" />
              <col className="w-1/5" />
            </colgroup>
            <thead>
              <tr>
                <td className="p-0" />
                {tiers.map((tier) => (
                  <th key={tier.name} scope="col" className="p-0">
                    <div className="text-sm font-semibold text-indigo-400">
                      {tier.name} <span className="sr-only">plan</span>
                    </div>
                  </th>
                ))}
              </tr>
              <tr>
                <th className="p-0" />
                {tiers.map((tier) => (
                  <td key={tier.name} className="px-0 pt-3 pb-0">
                    <Link
                      to="/signup"
                      aria-label={`Get started with the ${tier.name} plan`}
                      className="inline-block rounded-md bg-white/10 px-2.5 py-1.5 text-sm font-semibold text-white shadow-none inset-ring inset-ring-white/5 hover:bg-white/20"
                    >
                      Get started
                    </Link>
                  </td>
                ))}
              </tr>
            </thead>
            {sections.map((section) => (
              <tbody key={section.name} className="group">
                <tr>
                  <th scope="colgroup" colSpan={4} className="px-0 pt-10 pb-0 group-first-of-type:pt-5">
                    <div className="-mx-4 rounded-lg bg-gray-800/50 px-4 py-3 text-sm/6 font-semibold text-white">
                      {section.name}
                    </div>
                  </th>
                </tr>
                {section.features.map((feature) => (
                  <tr key={feature.name} className="border-b border-white/10 last:border-none">
                    <th scope="row" className="px-0 py-4 text-sm/6 font-normal text-gray-300">
                      {feature.name}
                    </th>
                    {tiers.map((tier) => (
                      <td key={tier.name} className="p-4 max-sm:text-center">
                        {typeof feature.tiers[tier.name] === 'string' ? (
                          <>
                            <span className="sr-only">{tier.name} includes:</span>
                            <span className="text-sm/6 text-white">{feature.tiers[tier.name]}</span>
                          </>
                        ) : (
                          <>
                            {feature.tiers[tier.name] === true ? (
                              <CheckIcon
                                aria-hidden="true"
                                className="inline-block size-4 fill-green-500"
                              />
                            ) : (
                              <MinusIcon
                                aria-hidden="true"
                                className="inline-block size-4 fill-gray-500"
                              />
                            )}

                            <span className="sr-only">
                              {feature.tiers[tier.name] === true
                                ? `Included in ${tier.name}`
                                : `Not included in ${tier.name}`}
                            </span>
                          </>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
          <TabGroup className="sm:hidden">
            <TabList className="flex">
              {tiers.map((tier) => (
                <Tab
                  key={tier.name}
                  className="w-1/3 border-b border-white/10 py-4 text-base/8 font-medium text-indigo-400 not-focus-visible:focus:outline-none data-selected:border-indigo-400"
                >
                  {tier.name}
                </Tab>
              ))}
            </TabList>
            <TabPanels as={Fragment}>
              {tiers.map((tier) => (
                <TabPanel key={tier.name} className="focus:outline-none">
                  <Link
                    to="/signup"
                    className="mt-8 block w-full rounded-md bg-white/10 px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-none inset-ring inset-ring-white/5 hover:bg-white/20"
                  >
                    Get started
                  </Link>
                  {sections.map((section) => (
                    <Fragment key={section.name}>
                      <div className="-mx-6 mt-10 rounded-lg bg-gray-800/50 px-6 py-3 text-sm/6 font-semibold text-white group-first-of-type:mt-5">
                        {section.name}
                      </div>
                      <dl>
                        {section.features.map((feature) => (
                          <div
                            key={feature.name}
                            className="grid grid-cols-2 border-b border-white/10 py-4 last:border-none"
                          >
                            <dt className="text-sm/6 font-normal text-gray-300">{feature.name}</dt>
                            <dd className="text-center">
                              {typeof feature.tiers[tier.name] === 'string' ? (
                                <span className="text-sm/6 text-white">
                                  {feature.tiers[tier.name]}
                                </span>
                              ) : (
                                <>
                                  {feature.tiers[tier.name] === true ? (
                                    <CheckIcon
                                      aria-hidden="true"
                                      className="inline-block size-4 fill-green-500"
                                    />
                                  ) : (
                                    <MinusIcon
                                      aria-hidden="true"
                                      className="inline-block size-4 fill-gray-500"
                                    />
                                  )}

                                  <span className="sr-only">{feature.tiers[tier.name] === true ? 'Yes' : 'No'}</span>
                                </>
                              )}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </Fragment>
                  ))}
                </TabPanel>
              ))}
            </TabPanels>
          </TabGroup>
        </div>
      ) : null}
    </div>
  )
}
