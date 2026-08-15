import React, { useState } from 'react';

import { PLANS } from '../../lib/plans';
import api from '../../services/api';

function PlansPanel() {
  const orderedPlans = [PLANS.starter, PLANS.growth, PLANS.scale];
  const [upgradingPlanKey, setUpgradingPlanKey] = useState(null);
  const [upgradeError, setUpgradeError] = useState(null);

  async function upgrade(plan) {
    try {
      setUpgradeError(null);
      setUpgradingPlanKey(plan);

      const res = await api.post('/billing/create-checkout', { plan });
      const url = res?.data?.url;

      if (!url) {
        throw new Error('No checkout URL returned');
      }

      window.location.assign(url);
    } catch (err) {
      console.error('Upgrade error:', err);
      setUpgradingPlanKey(null);
      setUpgradeError(err?.response?.data?.error || err?.message || 'Failed to start checkout');
    }
  }

  const accentByKey = {
    starter: {
      topBar: 'bg-emerald-500',
      badge: 'from-emerald-500 to-emerald-300',
    },
    growth: {
      topBar: 'bg-sky-500',
      badge: 'from-sky-500 to-sky-300',
    },
    scale: {
      topBar: 'bg-indigo-500',
      badge: 'from-indigo-500 to-indigo-300',
    },
  };

  return (
    <div className="grow">

     {/* Panel body */}
      <div className="p-6 space-y-6">

       {/* Plans */}
        <section>
          <div className="mb-8">
            <h2 className="text-2xl text-slate-800 dark:text-slate-100 font-bold mb-4">Plans</h2>
            <div className="text-sm">
              Compare plans and choose what works best for you. Features are aligned with the public pricing page.
            </div>
          </div>

         {/* Pricing */}
          <div>
            {upgradeError ? (
              <div className="mb-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded px-3 py-2">
                {upgradeError}
              </div>
            ) : null}
           {/* Pricing tabs */}
            <div className="grid grid-cols-12 gap-6">
              {orderedPlans.map((plan) => {
                const accent = accentByKey[plan.key] ?? accentByKey.starter;
                const priceDisplay = Number.isFinite(plan.priceMonthlyUsd)
                  ? Math.round(plan.priceMonthlyUsd).toLocaleString()
                  : '';

                return (
                  <div
                    key={plan.key}
                    className="relative col-span-full xl:col-span-4 bg-white dark:bg-slate-800 shadow-md rounded-sm border border-slate-200 dark:border-slate-700 h-full flex flex-col"
                  >
                    <div className={`absolute top-0 left-0 right-0 h-0.5 ${accent.topBar}`} aria-hidden="true"></div>
                    <div className="px-5 pt-5 pb-6 border-b border-slate-200 dark:border-slate-700">
                      <header className="flex items-center mb-2">
                        <div className={`w-6 h-6 rounded-full shrink-0 bg-gradient-to-tr ${accent.badge} mr-3`}>
                          <svg className="w-6 h-6 fill-current text-white" viewBox="0 0 24 24">
                            <path d="M12 17a.833.833 0 01-.833-.833 3.333 3.333 0 00-3.334-3.334.833.833 0 110-1.666 3.333 3.333 0 003.334-3.334.833.833 0 111.666 0 3.333 3.333 0 003.334 3.334.833.833 0 110 1.666 3.333 3.333 0 00-3.334 3.334c0 .46-.373.833-.833.833z" />
                          </svg>
                        </div>
                        <h3 className="text-lg text-slate-800 dark:text-slate-100 font-semibold">{plan.displayName}</h3>
                      </header>
                      <div className="text-sm mb-2 min-h-[40px]">{plan.description}</div>
                      {/* Price */}
                      <div className="text-slate-800 dark:text-slate-100 font-bold mb-4 min-h-[56px] flex items-end">
                        <div className="flex items-baseline">
                          <span className="text-2xl">$</span>
                          <span className="text-4xl leading-none">{priceDisplay}</span>
                        </div>
                      </div>
                      <button
                        className="btn bg-indigo-500 hover:bg-indigo-600 text-white w-full disabled:opacity-60 disabled:cursor-not-allowed"
                        onClick={() => upgrade(plan.key)}
                        disabled={!!upgradingPlanKey}
                      >
                        {upgradingPlanKey === plan.key ? 'Redirecting…' : `Upgrade to ${plan.displayName}`}
                      </button>
                    </div>
                    <div className="px-5 pt-4 pb-5 flex-1">
                      <div className="text-xs text-slate-800 dark:text-slate-100 font-semibold uppercase mb-4">
                        What's included
                      </div>
                      <ul>
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start py-1">
                            <svg className="w-3 h-3 shrink-0 fill-current text-emerald-500 mr-2 mt-1" viewBox="0 0 12 12">
                              <path d="M10.28 1.28L3.989 7.575 1.695 5.28A1 1 0 00.28 6.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 1.28z" />
                            </svg>
                            <div className="text-sm">{feature}</div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

       {/* Contact Sales */}
        <section>
          <div className="px-5 py-3 bg-indigo-50 dark:bg-indigo-500/30 border border-indigo-100 dark:border-transparent rounded-sm text-center xl:text-left xl:flex xl:flex-wrap xl:justify-between xl:items-center">
            <div className="text-slate-800 dark:text-slate-100 font-semibold mb-2 xl:mb-0">Looking for different configurations?</div>
            <button className="btn bg-indigo-500 hover:bg-indigo-600 text-white">Contact Sales</button>
          </div>
        </section>

       {/* FAQs */}
        <section>
          <div className="my-8">
            <h2 className="text-2xl text-slate-800 dark:text-slate-100 font-bold">FAQs</h2>
          </div>
          <ul className="space-y-5">
            <li>
              <div className="font-semibold text-slate-800 dark:text-slate-100 mb-1">
                What is the difference between the three versions?
              </div>
              <div className="text-sm">
                Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit.
              </div>
            </li>
            <li>
              <div className="font-semibold text-slate-800 dark:text-slate-100 mb-1">
                Is there any difference between Basic and Plus licenses?
              </div>
              <div className="text-sm">
                Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
              </div>
            </li>
            <li>
              <div className="font-semibold text-slate-800 dark:text-slate-100 mb-1">
                Got more questions?
              </div>
              <div className="text-sm">
                Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum in voluptate velit esse cillum dolore eu fugiat <a className="font-medium text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400" href="#0">contact us</a>.
              </div>
            </li>
          </ul>
        </section>

      </div>

     {/* Panel footer */}
      <footer>
        <div className="flex flex-col px-6 py-5 border-t border-slate-200 dark:border-slate-700">
          <div className="flex self-end">
            <button className="btn dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300">Cancel</button>
            <button className="btn bg-indigo-500 hover:bg-indigo-600 text-white ml-3">Save Changes</button>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default PlansPanel;