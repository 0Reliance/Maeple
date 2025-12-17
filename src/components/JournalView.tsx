import React, { useEffect, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import JournalEntry from './JournalEntry';
import TimelineEntry from './TimelineEntry';
import { useAppStore } from '../stores';

const JournalView: React.FC = () => {
  const { entries, addEntry } = useAppStore();
  const [scrollParent, setScrollParent] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Find the main scroll container
    // On desktop it's 'main-content', on mobile it might be window/body
    const mainElement = document.getElementById('main-content');
    if (mainElement && window.getComputedStyle(mainElement).overflowY !== 'visible') {
        setScrollParent(mainElement);
    } else {
        setScrollParent(null); // Use window scroll
    }
  }, []);

  return (
    <div className="space-y-8">
      <JournalEntry onEntryAdded={addEntry} />
      
      {entries.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white pl-1">Recent Context</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {entries.map((entry) => (
              <TimelineEntry key={entry.id} entry={entry} variant="card" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalView;
