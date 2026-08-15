import { useEffect, useRef, useState } from 'react'

function getSubscribeUrl() {
  const base = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
  return base ? `${base}/api/newsletter/subscribe` : '/api/newsletter/subscribe';
}

export default function Newsletter() {
  const [showModal, setShowModal] = useState(false)
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const modalTimerRef = useRef(null)
  const backendInFlightRef = useRef(false)

  useEffect(() => {
    return () => {
      if (modalTimerRef.current) clearTimeout(modalTimerRef.current)
    }
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return
    setError('')
    setSubmitting(true)

    // Optimistic UI: show success modal after ~1s of buffering/loading,
    // but keep the email request running in the background.
    if (modalTimerRef.current) clearTimeout(modalTimerRef.current)
    modalTimerRef.current = setTimeout(() => {
      setShowModal(true)
      setSubmitting(false)
    }, 1000)

    // Avoid duplicate email sends if the user submits again while the first request is still running.
    if (!backendInFlightRef.current) {
      backendInFlightRef.current = true
      fetch(getSubscribeUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      })
        .then(async (res) => {
          // Consume body (if any) but ignore outcome; success modal is driven by UI timer.
          try {
            await res.json()
          } catch {
            // ignore non-JSON responses
          }
        })
        .catch(() => {
          // ignore network errors; success modal will still appear via the timer
        })
        .finally(() => {
          backendInFlightRef.current = false
        })
    }
  }

  const closeModal = () => {
    if (modalTimerRef.current) clearTimeout(modalTimerRef.current)
    modalTimerRef.current = null
    setShowModal(false)
    setEmail('')
    setError('')
  }

  return (
    <>
      <section className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center lg:max-w-none lg:text-left">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-16 lg:items-center">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold leading-8 text-indigo-400">
                  Stay informed
                </h3>
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                  Get product updates and insights
                </h2>
                <p className="text-lg leading-8 text-gray-300">
                  Join thousands of professionals who stay ahead with our latest features, industry insights, and best practices.
                </p>
              </div>
              <div className="mt-8 lg:mt-0">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:gap-3">
                    <div className="flex-1">
                      <label htmlFor="email-address" className="sr-only">
                        Email address
                      </label>
                      <input
                        id="email-address"
                        name="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email address"
                        autoComplete="email"
                        className="block w-full rounded-lg border-0 bg-white/10 px-4 py-3 text-base text-white placeholder:text-gray-400 backdrop-blur-sm focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-none rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Subscribing…' : 'Subscribe'}
                    </button>
                  </div>
                  {error ? (
                    <p className="text-sm text-red-400" role="alert">
                      {error}
                    </p>
                  ) : null}
                  <p className="text-sm leading-6 text-gray-400">
                    We respect your privacy. Unsubscribe at any time. Read our{' '}
                    <a href="/privacy-policy" className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors duration-200">
                      privacy policy
                    </a>
                    .
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="relative mx-4 w-full max-w-md rounded-lg bg-gray-900 border border-gray-700 p-8 shadow-2xl transform transition-all duration-300 ease-out scale-100 animate-in fade-in-0 zoom-in-95">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-600/20 border border-green-500/30">
                <svg
                  className="h-8 w-8 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-white">
                Successfully Subscribed!
              </h3>
              <div className="mt-3 text-sm text-gray-300 space-y-1">
                <p>Welcome to our newsletter community.</p>
                <p>Get ready for exclusive insights and strategies</p>
                <p>delivered straight to your inbox every Friday.</p>
                <p className="text-indigo-400 font-medium">Stay ahead of the competition!</p>
              </div>
              <button
                onClick={closeModal}
                className="mt-6 w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors duration-200"
              >
                Got it, thanks!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}