import { useTheme } from '../app/context/ThemeContext';

export default function Layout({ children }: { children: React.ReactNode }) {
    const { theme } = useTheme();

    return (
        <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark'
                ? 'bg-[#0A0A0A] text-white'
                : 'bg-gray-100 text-gray-900'
            }`}>
            {children}
        </div>
    );
}