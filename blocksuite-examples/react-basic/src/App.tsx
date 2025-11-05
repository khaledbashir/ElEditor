"use client";

import { ViewSwitcher } from "./components/view-switcher";

function App() {
  return (
    <div className="app min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                BlockSuite + Spreadsheet Demo
              </h1>
              <p className="mt-2 text-gray-600">
                Switch between spreadsheet charts and block-based document editing
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                React 19.1.1
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                BlockSuite
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="h-[calc(100vh-200px)] min-h-[600px]">
            <ViewSwitcher className="h-full" initialMode="sheets" />
          </div>
        </div>
      </main>

      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            Built with React, BlockSuite, and modern web technologies
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;