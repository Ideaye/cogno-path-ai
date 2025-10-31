import { ExamRef, DateRange } from '@/types/domain';
import { track } from '@/lib/track';
import { Calendar, Bell, Search } from 'lucide-react';

export interface TopBarProps {
  activeExam: ExamRef | null;
  exams: ExamRef[];
  dateRange: DateRange;
  notificationsCount: number;
  onExamChange: (exam_id: string) => void;
  onSearch: (q: string) => void;
  onDateRangeChange: (r: DateRange) => void;
}

export default function TopBar(p: TopBarProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
      <div className="flex items-center gap-3">
        <select
          className="border border-border bg-background rounded px-3 py-2 text-black"
          value={p.activeExam?.exam_id ?? ''}
          onChange={(e) => { 
            p.onExamChange(e.target.value); 
            track('ui.exam_switch', { exam_id: e.target.value });
          }}
        >
          {p.exams.map(e => <option key={e.exam_id} value={e.exam_id}>{e.name}</option>)}
        </select>
        <div className="flex items-center gap-2 text-sm text-black">
          <Calendar size={16} /> {p.dateRange.from} → {p.dateRange.to}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 border border-border rounded px-3 py-2">
          <Search size={16} className="text-black" />
          <input 
            placeholder="Search" 
            className="outline-none bg-transparent text-black"
            onKeyDown={(e) => { 
              if (e.key === 'Enter') { 
                p.onSearch((e.target as HTMLInputElement).value); 
                track('ui.search', { q: (e.target as HTMLInputElement).value });
              }
            }}
          />
        </div>
        <button className="relative border border-border rounded px-3 py-2 hover:bg-accent">
          <Bell size={16} />
          {p.notificationsCount > 0 && (
            <span className="absolute -top-1 -right-1 text-xs bg-primary text-primary-foreground rounded-full px-1">
              {p.notificationsCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
