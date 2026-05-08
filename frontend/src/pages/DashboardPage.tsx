import { useAuth } from '../app/context/useAuth';

export default function DashboardPage() {
    const { user } = useAuth();
    const name = user?.name || 'Abdul Rehman';
    const profilePicture = typeof window !== 'undefined' ? localStorage.getItem('profile_picture') : null;
    const greeting = `Hi, ${name}`;
    const dateText = new Date().toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });

    return (
        <div className="max-w-5xl">
            <div className="bg-[#1E1E1E] rounded-2xl p-8 border border-[#2A2A2A] shadow-xl">
                <div className="flex items-center gap-5">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#8B5CF6] flex items-center justify-center text-white text-2xl font-bold overflow-hidden flex-shrink-0">
                        {profilePicture ? (
                            <img src={profilePicture} alt="User profile" className="w-full h-full object-cover" />
                        ) : (
                            name.charAt(0).toUpperCase()
                        )}
                    </div>
                    <div>
                        <p className="text-sm text-[#A3A3A3]">Dashboard</p>
                        <h1 className="text-4xl font-bold text-[#EDEDED]">{greeting}</h1>
                        <p className="text-sm text-[#A3A3A3] mt-1">{dateText}</p>
                    </div>
                </div>
                <div className="mt-8 rounded-xl bg-gradient-to-r from-[#7C3AED]/15 to-[#8B5CF6]/15 border border-[#7C3AED]/20 p-6">
                    <p className="text-[#EDEDED] italic text-lg">
                        "Your future is created by what you do today, not tomorrow."
                    </p>
                </div>
            </div>
        </div>
    );
}
