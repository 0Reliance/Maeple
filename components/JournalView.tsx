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
    <div className="space-y-6 md:space-y-8">
      <JournalEntry onEntryAdded={addEntry} />
      {entries.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 pl-1">Recent Context</h3>
          <Virtuoso
            useWindowScroll={!scrollParent}
            customScrollParent={scrollParent || undefined}
            data={entries}
            itemContent={(index, entry) => (
              <div className="pb-4">
                <TimelineEntry entry={entry} />
              </div>
            )}
            style={{ height: entries.length * 200 }} // Fallback height? No, Virtuoso manages height if not window scroll?
          />
        </div>
      )}
    </div>
  );
};

export default JournalView;
