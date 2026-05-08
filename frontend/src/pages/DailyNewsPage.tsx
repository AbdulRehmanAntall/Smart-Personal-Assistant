import { useEffect, useState } from 'react';
import { Newspaper, ExternalLink } from 'lucide-react';
import ImageWithFallback from '../components/figma/ImageWithFallback';
import { apiFetch } from '../lib/api';

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

  const [articles, setArticles] = useState<NewsArticle[]>([
    {
      id: 1,
      title: 'AI Breakthrough: New Language Model Surpasses GPT-4',
      summary:
        'Researchers unveil a revolutionary AI model that demonstrates unprecedented understanding and reasoning capabilities across multiple domains.',
      category: 'AI',
      image:
        'https://images.unsplash.com/photo-1579532537902-1e50099867b4?auto=format&fit=crop&w=1080&q=80',
      url: 'https://example.com/ai-news-1',
    },
    {
      id: 2,
      title: 'Tech Startups Raise Record $50B in Q1 2026',
      summary:
        'Venture capital investment in technology startups reaches all-time high as investors bet on AI and quantum computing innovations.',
      category: 'Business',
      image:
        'https://images.unsplash.com/photo-1579532536935-619928decd08?auto=format&fit=crop&w=1080&q=80',
      url: 'https://example.com/business-news-2',
    },
    {
      id: 3,
      title: 'Universities Adopt AI-Powered Learning Platforms',
      summary:
        'Major universities worldwide integrate artificial intelligence tools to personalize education and improve student outcomes.',
      category: 'Education',
      image:
        'https://images.unsplash.com/photo-1602052294200-a8b75e03adfe?auto=format&fit=crop&w=1080&q=80',
      url: 'https://example.com/education-news-3',
    },
  ]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch<NewsArticle[]>(
          `/news?category=${encodeURIComponent(selectedCategory)}`
        );
        if (data?.length) setArticles(data);
      } catch {
        // fallback to static data
      }
    };
    void load();
  }, [selectedCategory]);

  const filteredArticles =
    selectedCategory === 'All'
      ? articles
      : articles.filter((a) => a.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] rounded-3xl p-8 text-white shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <Newspaper className="w-10 h-10" />
          <h1 className="text-4xl font-bold">Daily News</h1>
        </div>
        <p className="text-lg text-white/90">
          Stay updated with the latest news and trends
        </p>
      </div>

      {/* Categories */}
      <div className="bg-[#1E1E1E] rounded-2xl p-6 border border-[#2A2A2A]">
        <div className="flex flex-wrap gap-3">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-5 py-2 rounded-xl font-medium transition-all ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-white'
                  : 'bg-[#171717] text-[#A3A3A3] hover:bg-[#222]'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Articles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArticles.map((article) => (
          <div
            key={article.id}
            className="bg-[#1E1E1E] rounded-2xl overflow-hidden border border-[#2A2A2A] shadow-lg hover:shadow-[#7C3AED]/10 transition"
          >
            {/* Image */}
            <div className="h-48 overflow-hidden relative">
              <ImageWithFallback
                src={article.image}
                alt={article.title}
                className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
              />
              <span className="absolute top-3 right-3 px-3 py-1 text-xs rounded-full bg-[#7C3AED]/90 text-white">
                {article.category}
              </span>
            </div>

            {/* Content */}
            <div className="p-5 space-y-3">
              <h3 className="text-lg font-bold text-[#EDEDED] line-clamp-2">
                {article.title}
              </h3>

              <p className="text-sm text-[#A3A3A3] line-clamp-3">
                {article.summary}
              </p>

              {/* FIXED LINK */}
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[#7C3AED] hover:text-[#8B5CF6] font-medium text-sm group"
              >
                <span>Read More</span>
                <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {filteredArticles.length === 0 && (
        <div className="bg-[#1E1E1E] rounded-2xl p-12 text-center border border-[#2A2A2A]">
          <Newspaper className="w-16 h-16 text-[#2A2A2A] mx-auto mb-4" />
          <p className="text-[#A3A3A3] text-lg">
            No articles found in this category
          </p>
        </div>
      )}
    </div>
  );
}