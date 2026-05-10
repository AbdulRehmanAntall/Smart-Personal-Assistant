import { useEffect, useState } from 'react';
import { CheckSquare, AlertCircle, Filter } from 'lucide-react';
import { Progress } from '../components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { apiFetch } from '../lib/api';

interface Task {
  id: string;
  category: string;
  title: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  progress: number;
  description: string;
  url: string;
}

export default function ClassroomPendingWorkPage() {
  const [sortBy, setSortBy] = useState('deadline');
  const [filterPriority, setFilterPriority] = useState('all');

  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const cached = typeof window !== 'undefined' ? localStorage.getItem('classroom_cache') : null;
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(tasks.length === 0);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      try {
        if (tasks.length === 0) setLoading(true);
        setError('');
        const data = await apiFetch<{ items: any[] }>('/classroom/pending-work');
        const parsedTasks = (data.items ?? []).map((t) => ({
          id: String(t.id),
          category: String(t.course ?? 'Classroom'),
          title: String(t.title ?? ''),
          dueDate: t.due_at ? new Date(t.due_at).toDateString() : 'No due date',
          priority: t.priority,
          progress: t.progress ?? 0,
          description: String(t.description ?? ''),
          url: String(t.alternateLink || t.url || 'https://classroom.google.com')
        }));
        setTasks(parsedTasks);
        localStorage.setItem('classroom_cache', JSON.stringify(parsedTasks));
      } catch (e) {
        if (tasks.length === 0) {
          setError(e instanceof Error ? e.message : 'Failed to load Classroom work. Re-login with Google to grant Classroom permission.');
        }
      } finally {
        setLoading(false);
      }
    };
    void load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-[#C2410C]/20 text-[#EA580C] border-[#C2410C]/30';
      case 'medium':
        return 'bg-[#D97706]/20 text-[#F59E0B] border-[#D97706]/30';
      case 'low':
        return 'bg-[#8B5CF6]/20 text-[#8B5CF6] border-[#8B5CF6]/30';
      default:
        return 'bg-[#2A2A2A]/20 text-[#A3A3A3] border-[#2A2A2A]/30';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Work Project': 'bg-[#8B5CF6]',
      'Personal': 'bg-[#7C3AED]',
      'Finance': 'bg-[#6D28D9]',
      'Health': 'bg-[#D97706]',
      'Learning': 'bg-[#F59E0B]',
      'Social': 'bg-[#EA580C]',
    };
    return colors[category] || 'bg-[#2A2A2A]';
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    if (sortBy === 'deadline') {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    } else if (sortBy === 'priority') {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    } else if (sortBy === 'category') {
      return a.category.localeCompare(b.category);
    }
    return 0;
  });

  const filteredTasks = filterPriority === 'all'
    ? sortedTasks
    : sortedTasks.filter(a => a.priority === filterPriority);

  const stats = {
    total: tasks.length,
    high: tasks.filter(a => a.priority === 'high').length,
    medium: tasks.filter(a => a.priority === 'medium').length,
    low: tasks.filter(a => a.priority === 'low').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] rounded-3xl p-8 text-white shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <CheckSquare className="w-10 h-10" />
          <h1 className="text-4xl font-bold">Tasks & Projects</h1>
        </div>
        <p className="text-lg text-white/90">Track and manage your tasks, projects and deadlines</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#1E1E1E] backdrop-blur-sm rounded-xl p-5 shadow-lg border border-[#2A2A2A]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-[#EDEDED]">{stats.total}</p>
              <p className="text-sm text-[#A3A3A3] mt-1">Total Tasks</p>
            </div>
            <CheckSquare className="w-8 h-8 text-[#8B5CF6]" />
          </div>
        </div>
        <div className="bg-[#1E1E1E] backdrop-blur-sm rounded-xl p-5 shadow-lg border border-[#2A2A2A]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-[#EA580C]">{stats.high}</p>
              <p className="text-sm text-[#A3A3A3] mt-1">High Priority</p>
            </div>
            <AlertCircle className="w-8 h-8 text-[#EA580C]" />
          </div>
        </div>
        <div className="bg-[#1E1E1E] backdrop-blur-sm rounded-xl p-5 shadow-lg border border-[#2A2A2A]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-[#F59E0B]">{stats.medium}</p>
              <p className="text-sm text-[#A3A3A3] mt-1">Medium Priority</p>
            </div>
            <AlertCircle className="w-8 h-8 text-[#F59E0B]" />
          </div>
        </div>
        <div className="bg-[#1E1E1E] backdrop-blur-sm rounded-xl p-5 shadow-lg border border-[#2A2A2A]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-[#8B5CF6]">{stats.low}</p>
              <p className="text-sm text-[#A3A3A3] mt-1">Low Priority</p>
            </div>
            <AlertCircle className="w-8 h-8 text-[#8B5CF6]" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#1E1E1E] backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#2A2A2A]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#A3A3A3]" />
            <span className="text-sm font-medium text-[#EDEDED]">Sort & Filter:</span>
          </div>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48 rounded-xl bg-[#171717] border-[#2A2A2A] text-[#EDEDED]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-[#1E1E1E] border-[#2A2A2A]">
              <SelectItem value="deadline">Deadline</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="category">Category</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-48 rounded-xl bg-[#171717] border-[#2A2A2A] text-[#EDEDED]">
              <SelectValue placeholder="Filter priority" />
            </SelectTrigger>
            <SelectContent className="bg-[#1E1E1E] border-[#2A2A2A]">
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High Priority</SelectItem>
              <SelectItem value="medium">Medium Priority</SelectItem>
              <SelectItem value="low">Low Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {loading && (
          <div className="bg-[#1E1E1E] backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#2A2A2A] text-[#A3A3A3]">
            Loading Classroom work...
          </div>
        )}
        {!loading && error && (
          <div className="bg-[#1E1E1E] backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#C2410C]/30 text-[#EA580C]">
            {error}
          </div>
        )}
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className="bg-[#1E1E1E] backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:shadow-[#7C3AED]/10 transition-all border border-[#2A2A2A] group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-3 h-3 rounded-full ${getCategoryColor(task.category)}`}></div>
                  <span className="text-sm font-semibold text-[#8B5CF6]">{task.category}</span>
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getPriorityBadgeColor(task.priority)}`}
                  >
                    {task.priority.toUpperCase()}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[#EDEDED] mb-1 group-hover:text-[#8B5CF6] transition-colors">
                  {task.title}
                </h3>
                <p className="text-[#A3A3A3] mb-3">{task.description}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2 text-sm text-[#A3A3A3]">
                  <AlertCircle className="w-4 h-4" />
                  <span>Due: {task.dueDate}</span>
                </div>
                <a 
                  href={task.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-white text-sm font-semibold hover:shadow-lg hover:shadow-[#7C3AED]/30 transition-all inline-block"
                >
                  Open
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <div className="bg-[#1E1E1E] backdrop-blur-sm rounded-2xl p-12 text-center shadow-lg border border-[#2A2A2A]">
          <CheckSquare className="w-16 h-16 text-[#2A2A2A] mx-auto mb-4" />
          <p className="text-xl text-[#A3A3A3]">No tasks found matching your criteria</p>
        </div>
      )}
    </div>
  );
}
