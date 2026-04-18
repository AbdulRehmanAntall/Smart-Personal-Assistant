import { useState } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { Input } from '../components/ui/input';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export default function AvailabilityManagerPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm your AI Availability Assistant. I can help you manage your schedule, find free time slots, and optimize your calendar. How can I assist you today?",
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: messages.length + 1,
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: messages.length + 2,
        text: generateAIResponse(inputText),
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);

    setInputText('');
  };

  const generateAIResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('free') || input.includes('available')) {
      return "Based on your calendar, you have free time slots on:\n• Tomorrow at 2:00 PM - 4:00 PM\n• Friday at 10:00 AM - 12:00 PM\n• Saturday all day\n\nWould you like me to schedule something during any of these times?";
    }
    
    if (input.includes('schedule') || input.includes('meeting')) {
      return "I can help you schedule that! What time works best for you? I'll make sure it doesn't conflict with your classes and assignments.";
    }
    
    if (input.includes('busy') || input.includes('workload')) {
      return "Looking at your schedule, you have 5 assignments due this week and 3 meetings scheduled. I recommend:\n• Blocking 2 hours tomorrow for the Math assignment\n• Moving your Friday study session to Saturday morning\n• Taking a break on Sunday to recharge";
    }
    
    return "I understand. Let me help you with that. Based on your current schedule and commitments, I can suggest the best times for your activities and help you maintain a healthy work-life balance.";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] rounded-3xl p-8 text-white shadow-xl">
        <h1 className="text-4xl font-bold mb-2">AI Availability Assistant</h1>
        <p className="text-lg text-white/90">Chat with AI to manage your schedule and availability</p>
      </div>

      {/* Chat Container */}
      <div className="bg-[#1E1E1E] backdrop-blur-sm rounded-2xl shadow-xl border border-[#2A2A2A] overflow-hidden">
        {/* Chat Messages */}
        <div className="h-[600px] overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                message.sender === 'ai'
                  ? 'bg-gradient-to-br from-purple-500 to-blue-500'
                  : 'bg-gradient-to-br from-pink-400 to-purple-400'
              }`}>
                {message.sender === 'ai' ? (
                  <Bot className="w-5 h-5 text-white" />
                ) : (
                  <User className="w-5 h-5 text-white" />
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[70%] rounded-2xl p-4 ${
                  message.sender === 'ai'
                    ? 'bg-[#171717] border border-[#2A2A2A]'
                    : 'bg-gradient-to-br from-[#7C3AED] to-[#8B5CF6] text-white'
                }`}
              >
                <p className={`whitespace-pre-line ${
                  message.sender === 'ai' ? 'text-[#EDEDED]' : 'text-white'
                }`}>
                  {message.text}
                </p>
                <p className={`text-xs mt-2 ${
                  message.sender === 'ai' ? 'text-[#A3A3A3]' : 'text-white/70'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="border-t border-[#2A2A2A] p-4 bg-[#171717]">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <Input
              type="text"
              placeholder="Ask me about your availability, schedule meetings, or get time management tips..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 h-12 bg-[#1E1E1E] border-[#2A2A2A] text-[#EDEDED] rounded-xl"
            />
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-white hover:shadow-lg hover:shadow-[#7C3AED]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!inputText.trim()}
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          'When am I free this week?',
          'Schedule study time for finals',
          'Show my busiest days',
        ].map((suggestion, index) => (
          <button
            key={index}
            onClick={() => {
              setInputText(suggestion);
            }}
            className="p-4 bg-[#1E1E1E] backdrop-blur-sm rounded-xl shadow-md hover:shadow-lg hover:shadow-[#7C3AED]/10 transition-all border border-[#2A2A2A] text-left text-sm text-[#EDEDED] hover:bg-[#171717]"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}