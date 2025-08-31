'use client';

import React from 'react';

export function LayoutTest() {
  return (
    <div className="p-6 bg-red-100 dark:bg-red-900 border-2 border-red-500">
      <h2 className="text-lg font-bold text-red-800 dark:text-red-200">
        Layout Test Component
      </h2>
      <p className="text-red-700 dark:text-red-300">
        If you can see this component properly positioned, the layout is working correctly.
      </p>
      <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded border">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          This content should be visible and not hidden behind the sidebar.
        </p>
      </div>
    </div>
  );
}