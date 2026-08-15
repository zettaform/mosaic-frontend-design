import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { useGuidedTour } from '../../contexts/GuidedTourContext';

const CHAPTERS = [
  {
    id: 'chapter-1',
    number: 1,
    title: 'Learn to target public users in your niche',
    estimate: '4–5 min',
    enabled: true,
  },
  {
    id: 'chapter-2',
    number: 2,
    title: 'Statistics of your database of your users',
    estimate: '3–4 min',
    enabled: true,
  },
  {
    id: 'chapter-3',
    number: 3,
    title: 'Shortlist database & filter users for a campaign',
    estimate: '4–6 min',
    enabled: true,
  },
  {
    id: 'chapter-4',
    number: 4,
    title: 'AI Assistants that write emails on demand',
    estimate: '3–5 min',
    enabled: true,
  },
  {
    id: 'chapter-5',
    number: 5,
    title: 'Instructing AI Assistant to fit your business',
    estimate: '4–6 min',
    enabled: true,
  },
  {
    id: 'chapter-6',
    number: 6,
    title: 'Email replies & autonomous AI agents',
    estimate: '4–6 min',
    enabled: true,
  },
  // Seed 4 more subjects based on existing features (can be implemented later)
  {
    id: 'chapter-7',
    number: 7,
    title: 'Understanding user statistics & unique users',
    estimate: '2–3 min',
    enabled: false,
  },
  {
    id: 'chapter-8',
    number: 8,
    title: 'Designing prompt templates for high-converting campaigns',
    estimate: '5–7 min',
    enabled: false,
  },
  {
    id: 'chapter-9',
    number: 9,
    title: 'Configuring AI models for your workflows',
    estimate: '3–4 min',
    enabled: false,
  },
  {
    id: 'chapter-10',
    number: 10,
    title: 'Reviewing credits, billing and task costs',
    estimate: '3–4 min',
    enabled: false,
  },
];

function AdminKnowledgeBaseGuidedTours() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { startTourWithCountdown } = useGuidedTour();

  const handleStartTour = (chapter) => {
    if (!chapter.enabled) return;

    // Map chapters to their target routes
    const routeMap = {
      'chapter-1': '/admin/tasks',
      'chapter-2': '/admin/statistics',
      'chapter-3': '/admin/tasks',
      'chapter-4': '/admin/chat',
      'chapter-5': '/admin/prompt-templates',
      'chapter-6': '/email/reply',
    };

    const targetRoute = routeMap[chapter.id] || '/admin/tasks';

    // Start a global guided tour with countdown; provider will handle the redirect and overlay
    startTourWithCountdown({
      tourId: chapter.id,
      targetRoute,
    });
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="sidebar-shell-main">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-5xl mx-auto">
            <header className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                Knowledge Base · Guided Tours
              </h1>
              <p className="mt-2 text-slate-600 dark:text-slate-300 max-w-2xl">
                Follow Cinderella as she walks you through the most important workflows in your admin tools.
                Each chapter is a short, focused guided tour.
              </p>
            </header>

            <div className="grid gap-4">
              {CHAPTERS.map((chapter) => (
                <div
                  key={chapter.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 px-4 py-3"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white text-sm font-semibold">
                      {chapter.number}
                    </div>
                    <div>
                      <h2 className="text-sm md:text-base font-semibold text-slate-900 dark:text-slate-100">
                        {chapter.title}
                      </h2>
                      {!chapter.enabled && (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          Guided tour coming soon for this chapter.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
                    <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-700 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-200">
                      Estimated time: {chapter.estimate}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleStartTour(chapter)}
                      disabled={!chapter.enabled}
                      className={`inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors ${
                        chapter.enabled
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                          : 'bg-slate-300 text-slate-600 dark:bg-slate-700 dark:text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      Start guided tour
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminKnowledgeBaseGuidedTours;


