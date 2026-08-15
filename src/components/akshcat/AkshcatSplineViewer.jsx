import React, { useEffect, useState } from 'react';
import { SPLINE_SCRIPT_SRC, SPLINE_SCENE_URL } from '../../constants/akshcatSpline';

/**
 * Loads the Spline web component once and renders the scene.
 */
export default function AkshcatSplineViewer({
  className = '',
  minHeight = '480px',
  height,
}) {
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    const existing = document.querySelector(`script[src="${SPLINE_SCRIPT_SRC}"]`);
    if (existing) {
      setScriptReady(true);
      return undefined;
    }
    const script = document.createElement('script');
    script.type = 'module';
    script.src = SPLINE_SCRIPT_SRC;
    script.onload = () => setScriptReady(true);
    document.head.appendChild(script);
    return undefined;
  }, []);

  const boxStyle = {
    width: '100%',
    height: height || '100%',
    minHeight,
    display: 'block',
  };

  return (
    <div className={className} style={{ width: '100%', minHeight, height: height || undefined }}>
      {scriptReady ? (
        <spline-viewer url={SPLINE_SCENE_URL} style={boxStyle} />
      ) : (
        <div
          className="flex items-center justify-center w-full text-slate-500 dark:text-slate-400 text-sm bg-slate-100 dark:bg-slate-900/50"
          style={{ minHeight }}
        >
          Loading viewer…
        </div>
      )}
    </div>
  );
}
