import { useState } from 'react';
import { Newspaper, ExternalLink } from 'lucide-react';
import ImageWithFallback from '../components/figma/ImageWithFallback';

interface NewsArticle {
  id: number;
  title: string;
  summary: string;
  category: string;
  image: string;
  url: string;
}

export default function DailyNewsPage() {
  const categories = ['All', 'Technology', 'Business', 'Education', 'AI', 'Science'];
  const [selectedCategory, setSelectedCategory] = useState('All');

  const articles: NewsArticle[] = [
    {
      id: 1,
      title: 'AI Breakthrough: New Language Model Surpasses GPT-4',
      summary: 'Researchers unveil a revolutionary AI model that demonstrates unprecedented understanding and reasoning capabilities across multiple domains.',
      category: 'AI',
      image: 'https://images.unsplash.com/photo-1579532537902-1e50099867b4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwbmV3cyUyMGRpZ2l0YWx8ZW58MXx8fHwxNzcyMDkwNzY4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      url: '#',
    },
    {
      id: 2,
      title: 'Tech Startups Raise Record $50B in Q1 2026',
      summary: 'Venture capital investment in technology startups reaches all-time high as investors bet on AI and quantum computing innovations.',
      category: 'Business',
      image: 'https://images.unsplash.com/photo-1579532536935-619928decd08?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMG5ld3MlMjBmaW5hbmNlfGVufDF8fHx8MTc3MjE4MTA3OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      url: '#',
    },
    {
      id: 3,
      title: 'Universities Adopt AI-Powered Learning Platforms',
      summary: 'Major universities worldwide integrate artificial intelligence tools to personalize education and improve student outcomes.',
      category: 'Education',
      image: 'https://images.unsplash.com/photo-1602052294200-a8b75e03adfe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlZHVjYXRpb24lMjB1bml2ZXJzaXR5JTIwc3R1ZGVudHN8ZW58MXx8fHwxNzcyMTgxMDc5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      url: '#',
    },
    {
      id: 4,
      title: 'Quantum Computing Makes Commercial Debut',
      summary: 'First commercial quantum computer becomes available for enterprise use, promising to revolutionize data processing and cryptography.',
      category: 'Technology',
      image: 'https://images.unsplash.com/photo-1579532537902-1e50099867b4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwbmV3cyUyMGRpZ2l0YWx8ZW58MXx8fHwxNzcyMDkwNzY4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      url: '#',
    },
    {
      id: 5,
      title: 'Student Entrepreneurs Launch Green Tech Initiative',
      summary: 'College students create innovative sustainability platform that helps reduce campus carbon footprint by 40%.',
      category: 'Education',
      image: 'https://images.unsplash.com/photo-1602052294200-a8b75e03adfe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlZHVjYXRpb24lMjB1bml2ZXJzaXR5JTIwc3R1ZGVudHN8ZW58MXx8fHwxNzcyMTgxMDc5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      url: '#',
    },
    {
      id: 6,
      title: 'AI Assists Scientists in Drug Discovery',
      summary: 'Machine learning algorithms accelerate pharmaceutical research, identifying promising drug candidates in record time.',
      category: 'Science',
      image: 'https://images.unsplash.com/photo-1579532537902-1e50099867b4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwbmV3cyUyMGRpZ2l0YWx8ZW58MXx8fHwxNzcyMDkwNzY4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      url: '#',
    },
  ];

  const filteredArticles = selectedCategory === 'All' 
    ? articles 
    : articles.filter(article => article.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] rounded-3xl p-8 text-white shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <Newspaper className="w-10 h-10" />
          <h1 className="text-4xl font-bold">Daily News</h1>
        </div>
        <p className="text-lg text-white/90">Stay updated with the latest news and trends</p>
      </div>

      {/* Category Filters */}
      <div className="bg-[#1E1E1E] backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#2A2A2A]">
        <div className="flex flex-wrap gap-3">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`
                px-5 py-2 rounded-xl transition-all font-medium
                ${selectedCategory === category
                  ? 'bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-white shadow-lg'
                  : 'bg-[#171717] text-[#A3A3A3] hover:bg-[#1E1E1E]'
                }
              `}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* News Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArticles.map((article) => (
          <div
            key={article.id}
            className="bg-[#1E1E1E] backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-[#7C3AED]/10 transition-all overflow-hidden border border-[#2A2A2A] group cursor-pointer"
          >
            {/* Article Image */}
            <div className="relative h-48 overflow-hidden">
              <ImageWithFallback
                src={article.image}
                alt={article.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute top-3 right-3">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#7C3AED]/90 backdrop-blur-sm text-white">
                  {article.category}
                </span>
              </div>
            </div>

            {/* Article Content */}
            <div className="p-5 space-y-3">
              <h3 className="text-lg font-bold text-[#EDEDED] group-hover:text-[#8B5CF6] transition-colors line-clamp-2">
                {article.title}
              </h3>
              <p className="text-sm text-[#A3A3A3] line-clamp-3">
                {article.summary}
              </p>
              <button className="flex items-center gap-2 text-[#7C3AED] hover:text-[#8B5CF6] font-medium text-sm group/btn">
                <span>Read More</span>
                <ExternalLink className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredArticles.length === 0 && (
        <div className="bg-[#1E1E1E] backdrop-blur-sm rounded-2xl p-12 text-center shadow-lg border border-[#2A2A2A]">
          <Newspaper className="w-16 h-16 text-[#2A2A2A] mx-auto mb-4" />
          <p className="text-xl text-[#A3A3A3]">No articles found in this category</p>
        </div>
      )}
    </div>
  );
}