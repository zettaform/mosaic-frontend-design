import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AkshcatSplineViewer from '../components/akshcat/AkshcatSplineViewer';
import { buildAkshcatIframeEmbed } from '../constants/akshcatSpline';
import { useToast } from '../contexts/ToastContext';

function Akshcat() {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState(
    typeof window !== 'undefined' ? window.location.origin : ''
  );

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const embedCode = useMemo(() => buildAkshcatIframeEmbed(origin), [origin]);

  const copyEmbed = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      showToast('Embed code copied to clipboard', 'success');
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast('Could not copy — select the code and copy manually', 'error');
    }
  }, [embedCode, showToast]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <header className="shrink-0 border-b border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 backdrop-blur">
        <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">akshcat</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Public page — no sign-in required. Embed uses the minimal{' '}
              <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">/akshcat/embed</code>{' '}
              route for portfolio sites.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Home
            </Link>
            <Link
              to="/signin"
              className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <main className="grow max-w-9xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        <section aria-labelledby="viewer-heading">
          <h2 id="viewer-heading" className="sr-only">
            3D viewer
          </h2>
          <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm bg-slate-100 dark:bg-slate-900/50 min-h-[480px] h-[min(78vh,820px)]">
            <AkshcatSplineViewer className="h-full w-full" minHeight="480px" />
          </div>
        </section>

        <section
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden"
          aria-labelledby="embed-heading"
        >
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="embed-heading" className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                Embed for Behance (and other sites)
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
                Paste the code below into Behance using the project editor’s custom HTML/embed option (
                <a
                  href="https://help.behance.net/hc/en-us/articles/204484594-Guide-Embedding-Media"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Adobe’s embedding guide
                </a>
                ). The iframe loads only the viewer route, not the full app shell.
              </p>
            </div>
            <button
              type="button"
              onClick={copyEmbed}
              className="shrink-0 inline-flex items-center justify-center rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
            >
              {copied ? 'Copied' : 'Copy embed code'}
            </button>
          </div>
          <div className="p-5 bg-slate-50 dark:bg-slate-900/40">
            <pre
              className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-mono whitespace-pre-wrap break-all p-4 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 overflow-x-auto"
              tabIndex={0}
            >
              {embedCode}
            </pre>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              After deployment to <span className="font-medium">mymailgram.com</span>, this block uses{' '}
              <code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">https://mymailgram.com/akshcat/embed</code>{' '}
              automatically when you copy from that origin. On localhost it uses your dev origin (
              e.g. <code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">http://localhost:5174</code>
              ).
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Akshcat;
