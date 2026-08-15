import { Link } from 'react-router-dom';

export default function BillingSuccess() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-2xl font-semibold text-white mb-2">Thank you for your purchase</h1>
        <p className="text-gray-400 mb-6">
          Your payment was successful. You can now access your plan from the app.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/settings/billing"
            className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
          >
            Go to Billing
          </Link>
          <Link
            to="/"
            className="rounded-md bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
