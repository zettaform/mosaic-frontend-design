import React from 'react';
import AkshcatSplineViewer from '../components/akshcat/AkshcatSplineViewer';

/**
 * Minimal shell for iframe embedding (Behance custom embed / HTML blocks).
 * No auth, no app chrome — nginx must allow framing for this path only.
 */
function AkshcatEmbed() {
  return (
    <div className="min-h-screen w-full bg-slate-950 m-0 p-0 overflow-hidden">
      <AkshcatSplineViewer className="h-screen w-full" minHeight="100vh" height="100vh" />
    </div>
  );
}

export default AkshcatEmbed;
