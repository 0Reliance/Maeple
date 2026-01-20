import React from "react";
import { useAppStore } from "../stores";
import JournalEntry from "./JournalEntry";
import TimelineEntry from "./TimelineEntry";

const JournalView: React.FC = () => {
  const { entries, addEntry } = useAppStore();

  return (
    <div className="space-y-8">
      <JournalEntry onEntryAdded={addEntry} />

      {entries.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white pl-1">Recent Context</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {entries.map(entry => (
              <TimelineEntry key={entry.id} entry={entry} variant="card" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalView;
