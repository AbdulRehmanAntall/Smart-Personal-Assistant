import { Link } from 'react-router';
import { Brain, Calendar, Mail, Briefcase, Sparkles, CheckCircle } from 'lucide-react';
import ImageWithFallback from '../components/figma/ImageWithFallback';

export default function LandingPage() {
    const features = [
        {
            icon: Brain,
            title: 'Smart Scheduling',
            description: 'AI-powered scheduling that adapts to your lifestyle and personal needs',
            gradient: 'from-[#7C3AED] to-[#8B5CF6]'
        },
        {
            icon: Calendar,
            title: 'Task Management',
            description: 'Intelligent task planning and prioritization for maximum productivity',
            gradient: 'from-[#8B5CF6] to-[#6D28D9]'
        },
        {
            icon: Briefcase,
            title: 'Job Finder',
            description: 'Discover opportunities tailored to your skills and schedule',
            gradient: 'from-[#6D28D9] to-[#7C3AED]'
        },
        {
            icon: Mail,
            title: 'Email Automation',
            description: 'Smart email management with AI-powered summaries and actions',
            gradient: 'from-[#7C3AED] to-[#8B5CF6]'
        }
    ];

    return (
        <div className="min-h-screen bg-[#0D0D0D]">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 bg-[#171717]/80 backdrop-blur-lg border-b border-[#2A2A2A] z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-[#7C3AED] to-[#8B5CF6] p-2 rounded-xl relative">
                            <Brain className="w-6 h-6 text-white" />
                            <Sparkles className="w-3 h-3 text-yellow-300 absolute -top-1 -right-1" />
                        </div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] bg-clip-text text-transparent">
                            AllignAI
                        </h1>
                    </div>
                    <div className="flex gap-4">
                        <Link
                            to="/login"
                            className="px-6 py-2 rounded-xl text-[#7C3AED] hover:bg-[#1E1E1E] transition-all"
                        >
                            Login
                        </Link>
                        <Link
                            to="/signup"
                            className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-white shadow-lg hover:shadow-xl hover:shadow-[#7C3AED]/30 hover:scale-105 transition-all"
                        >
                            Sign Up
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6">
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#7C3AED]/20 text-[#8B5CF6] text-sm border border-[#7C3AED]/30">
                            <Sparkles className="w-4 h-4" />
                            <span>AI-Powered Personal Productivity</span>
                        </div>

                        <h1 className="text-6xl font-bold leading-tight text-[#EDEDED]">
                            Your Intelligent{' '}
                            <span className="bg-gradient-to-r from-[#7C3AED] via-[#8B5CF6] to-[#6D28D9] bg-clip-text text-transparent">
                                Personal AI
                            </span>{' '}
                            Assistant
                        </h1>

                        <p className="text-xl text-[#A3A3A3] leading-relaxed">
                            Streamline your life with AI-powered scheduling, smart task management,
                            intelligent email assistance, and personalized productivity insights. Get more done with less stress.
                        </p>

                        <div className="flex gap-4">
                            <Link
                                to="/signup"
                                className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-white text-lg shadow-xl hover:shadow-2xl hover:shadow-[#7C3AED]/30 hover:scale-105 transition-all"
                            >
                                Get Started Free
                            </Link>
                            <Link
                                to="/login"
                                className="px-8 py-4 rounded-xl bg-[#1E1E1E] text-[#7C3AED] text-lg shadow-lg hover:shadow-xl transition-all border border-[#2A2A2A]"
                            >
                                Login
                            </Link>
                        </div>

                        <div className="flex gap-6 text-sm text-[#A3A3A3]">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-[#8B5CF6]" />
                                <span>No credit card required</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-[#8B5CF6]" />
                                <span>Free forever</span>
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] rounded-3xl blur-3xl opacity-20 animate-pulse"></div>
                        <div className="relative bg-[#1E1E1E]/50 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-[#2A2A2A]">
                            <ImageWithFallback
                                src="https://images.unsplash.com/photo-1524591282491-edb48a0fca8f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib29rcyUyMHN0dWR5JTIwbGlicmFyeSUyMGVkdWNhdGlvbnxlbnwxfHx8fDE3NzIxOTAxODR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                                alt="Books and Study Materials"
                                className="w-full rounded-2xl shadow-lg"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 px-6 bg-[#171717]/30">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4 text-[#EDEDED]">
                            Powered by <span className="bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] bg-clip-text text-transparent">AI Intelligence</span>
                        </h2>
                        <p className="text-xl text-[#A3A3A3]">
                            Everything you need to stay organized and productive
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((feature, index) => {
                            const Icon = feature.icon;
                            return (
                                <div
                                    key={index}
                                    className="group p-6 rounded-2xl bg-[#1E1E1E] shadow-lg hover:shadow-2xl hover:shadow-[#7C3AED]/10 transition-all duration-300 hover:-translate-y-2 border border-[#2A2A2A]"
                                >
                                    <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient} mb-4 group-hover:scale-110 transition-transform`}>
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2 text-[#EDEDED]">{feature.title}</h3>
                                    <p className="text-[#A3A3A3]">{feature.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="bg-gradient-to-r from-[#7C3AED] via-[#8B5CF6] to-[#6D28D9] rounded-3xl p-12 shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#7C3AED]/20 to-[#8B5CF6]/20 backdrop-blur-sm"></div>
                        <div className="relative z-10 space-y-6">
                            <h2 className="text-4xl font-bold text-white">
                                Ready to Transform Your Productivity?
                            </h2>
                            <p className="text-xl text-white/90">
                                Join thousands of users who are already using AllignAI
                            </p>
                            <Link
                                to="/signup"
                                className="inline-block px-10 py-4 rounded-xl bg-white text-[#7C3AED] text-lg font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
                            >
                                Get Started Now
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-[#2A2A2A] bg-[#171717]/30">
                <div className="max-w-7xl mx-auto text-center space-y-4">
                    <div className="flex items-center justify-center gap-3">
                        <div className="bg-gradient-to-br from-[#7C3AED] to-[#8B5CF6] p-2 rounded-xl relative">
                            <Brain className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-xl font-bold bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] bg-clip-text text-transparent">
                            AllignAI
                        </h3>
                    </div>
                    <p className="text-[#A3A3A3]">
                        Your intelligent personal productivity assistant
                    </p>
                    <p className="text-sm text-[#A3A3A3]">
                        © 2026 AllignAI. Empowering productivity for everyone.
                    </p>
                </div>

            </footer>
        </div>

    );
}