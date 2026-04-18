// Remove the cn function from here
export { cn } from '@/lib/utils'; // ← use shadcn's cn instead

// Keep only themeClasses
export const themeClasses = {
  // Backgrounds
  bg: {
    primary: 'bg-[#0D0D0D] dark:bg-[#0D0D0D] light:bg-gray-50',
    surface: 'bg-[#171717] dark:bg-[#171717] light:bg-white',
    card: 'bg-[#1E1E1E] dark:bg-[#1E1E1E] light:bg-white',
    cardHover: 'hover:bg-[#171717] dark:hover:bg-[#171717] light:hover:bg-gray-50',
  },
  border: {
    default: 'border-[#2A2A2A] dark:border-[#2A2A2A] light:border-gray-200',
    light: 'border-[#2A2A2A] dark:border-[#2A2A2A] light:border-gray-100',
  },
  text: {
    primary: 'text-[#EDEDED] dark:text-[#EDEDED] light:text-gray-900',
    secondary: 'text-[#A3A3A3] dark:text-[#A3A3A3] light:text-gray-600',
    muted: 'text-[#A3A3A3] dark:text-[#A3A3A3] light:text-gray-500',
  },
  input: {
    bg: 'bg-[#171717] dark:bg-[#171717] light:bg-white',
    border: 'border-[#2A2A2A] dark:border-[#2A2A2A] light:border-gray-300',
    text: 'text-[#EDEDED] dark:text-[#EDEDED] light:text-gray-900',
    placeholder: 'placeholder:text-[#A3A3A3] dark:placeholder:text-[#A3A3A3] light:placeholder:text-gray-400',
  },
};