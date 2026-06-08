import React, { useState } from 'react';

type Props = {
  onSchedule: (range: { start: string; end: string } | null) => void;
};

const SchedulerCalendar: React.FC<Props> = ({ onSchedule }) => {
  const [start, setStart] = useState<string>('');
  const [end, setEnd] = useState<string>('');

  const handleApply = () => {
    if (start && end) {
      onSchedule({ start, end });
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Schedule</label>
      <div className="flex gap-4 items-end">
        <div className="flex-1 space-y-1">
          <span className="text-xs text-muted-foreground">Start</span>
          <input
            type="datetime-local"
            value={start}
            onChange={e => setStart(e.target.value)}
            className="w-full rounded-md border bg-sidebar p-2 text-sidebar-foreground"
          />
        </div>
        <div className="flex-1 space-y-1">
          <span className="text-xs text-muted-foreground">End</span>
          <input
            type="datetime-local"
            value={end}
            onChange={e => setEnd(e.target.value)}
            className="w-full rounded-md border bg-sidebar p-2 text-sidebar-foreground"
          />
        </div>
        <button
          type="button"
          onClick={handleApply}
          className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/80"
        >
          Apply
        </button>
      </div>
    </div>
  );
};

export default SchedulerCalendar;
