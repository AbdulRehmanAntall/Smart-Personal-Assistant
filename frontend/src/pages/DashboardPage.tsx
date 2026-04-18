import { useAuth } from '../app/context/AuthContext';
import { Mail, BookOpen, Calendar, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Progress } from '../components/ui/progress';

export default function DashboardPage() {
    const { user } = useAuth();

    const getCurrentGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    const metrics = [
        { label: 'Emails Today', value: '12', icon: Mail, color: 'from-[#7C3AED] to-[#8B5CF6]' },
        { label: 'Pending Assignments', value: '5', icon: BookOpen, color: 'from-[#8B5CF6] to-[#7C3AED]' },
        { label: 'Scheduled Meetings', value: '3', icon: Calendar, color: 'from-[#7C3AED] to-[#6D28D9]' },
        { label: 'Productivity Score', value: '87%', icon: TrendingUp, color: 'from-[#8B5CF6] to-[#6D28D9]' },
    ];

    const todayTasks = [
        { title: 'Complete Math Assignment', time: '2:00 PM', priority: 'high' },
        { title: 'Team Meeting - CS Project', time: '4:30 PM', priority: 'medium' },
        { title: 'Review Physics Notes', time: '6:00 PM', priority: 'low' },
    ];

    const upcomingDeadlines = [
        { title: 'Machine Learning Project', due: 'Feb 28', subject: 'Computer Science', progress: 75 },
        { title: 'Research Paper Draft', due: 'Mar 2', subject: 'English', progress: 50 },
        { title: 'Lab Report', due: 'Mar 5', subject: 'Chemistry', progress: 30 },
    ];

    const aiSuggestions = [
        'Schedule study time for Machine Learning - exam in 2 weeks',
        'You have 3 unread emails from professors',
        'Consider working on low-priority tasks during your free slot tomorrow',
    ];

    return (
        <div className="space-y-8 max-w-7xl">
            {/* Welcome Header */}
            <div className="bg-gradient-to-r from-[#7C3AED] via-[#8B5CF6] to-[#6D28D9] rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-[#7C3AED]/20 to-[#8B5CF6]/20 backdrop-blur-sm"></div>
                <div className="relative z-10">
                    <h1 className="text-4xl font-bold mb-2">
                        {getCurrentGreeting()}, {user?.name || 'Student'}! 👋
                    </h1>
                    <p className="text-lg text-white/90">
                        Here's your productivity overview for today
                    </p>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {metrics.map((metric, index) => {
                    const Icon = metric.icon;
                    return (
                        <div
                            key={index}
                            className="bg-[#1E1E1E] backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:shadow-[#7C3AED]/10 transition-all hover:-translate-y-1 border border-[#2A2A2A]"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 rounded-xl bg-gradient-to-br ${metric.color}`}>
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <p className="text-3xl font-bold mb-1 text-[#EDEDED]">{metric.value}</p>
                            <p className="text-sm text-[#A3A3A3]">{metric.label}</p>
                        </div>
                    );
                })}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Today's Tasks */}
                <div className="bg-[#1E1E1E] backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#2A2A2A]">
                    <div className="flex items-center gap-2 mb-6">
                        <Clock className="w-5 h-5 text-[#7C3AED]" />
                        <h2 className="text-xl font-bold text-[#EDEDED]">Today's Tasks</h2>
                    </div>
                    <div className="space-y-4">
                        {todayTasks.map((task, index) => (
                            <div
                                key={index}
                                className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#171717] transition-all cursor-pointer"
                            >
                                <div className={`mt-1 w-2 h-2 rounded-full ${task.priority === 'high' ? 'bg-[#C2410C]' :
                                        task.priority === 'medium' ? 'bg-[#D97706]' : 'bg-[#8B5CF6]'
                                    }`}></div>
                                <div className="flex-1">
                                    <p className="font-medium text-[#EDEDED]">{task.title}</p>
                                    <p className="text-sm text-[#A3A3A3]">{task.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Upcoming Deadlines */}
                <div className="bg-[#1E1E1E] backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#2A2A2A]">
                    <div className="flex items-center gap-2 mb-6">
                        <AlertCircle className="w-5 h-5 text-[#8B5CF6]" />
                        <h2 className="text-xl font-bold text-[#EDEDED]">Upcoming Deadlines</h2>
                    </div>
                    <div className="space-y-5">
                        {upcomingDeadlines.map((item, index) => (
                            <div key={index} className="space-y-2">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-medium text-[#EDEDED]">{item.title}</p>
                                        <p className="text-sm text-[#A3A3A3]">{item.subject}</p>
                                    </div>
                                    <span className="text-xs font-semibold text-[#7C3AED] bg-[#7C3AED]/10 px-2 py-1 rounded-lg">
                                        {item.due}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-[#A3A3A3]">
                                        <span>Progress</span>
                                        <span>{item.progress}%</span>
                                    </div>
                                    <Progress value={item.progress} className="h-2" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* AI Suggestions */}
                <div className="bg-gradient-to-br from-[#7C3AED]/10 to-[#8B5CF6]/10 rounded-2xl p-6 shadow-lg border border-[#7C3AED]/20">
                    <div className="flex items-center gap-2 mb-6">
                        <CheckCircle className="w-5 h-5 text-[#7C3AED]" />
                        <h2 className="text-xl font-bold text-[#EDEDED]">AI Suggestions</h2>
                    </div>
                    <div className="space-y-4">
                        {aiSuggestions.map((suggestion, index) => (
                            <div
                                key={index}
                                className="flex items-start gap-3 p-3 bg-[#1E1E1E]/60 rounded-xl border border-[#2A2A2A]"
                            >
                                <div className="mt-1 w-2 h-2 rounded-full bg-[#7C3AED]"></div>
                                <p className="text-sm text-[#EDEDED]">{suggestion}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Calendar Preview Widget */}
            <div className="bg-[#1E1E1E] backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#2A2A2A]">
                <h2 className="text-xl font-bold mb-4 text-[#EDEDED]">This Week at a Glance</h2>
                <div className="grid grid-cols-7 gap-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                        <div key={index} className="text-center">
                            <p className="text-xs text-[#A3A3A3] mb-2">{day}</p>
                            <div className={`h-16 rounded-xl flex items-center justify-center ${index === 3 ? 'bg-gradient-to-br from-[#7C3AED] to-[#8B5CF6] text-white font-bold shadow-lg shadow-[#7C3AED]/30' : 'bg-[#171717] text-[#A3A3A3]'
                                }`}>
                                <span className="text-sm">{24 + index}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
