import { useState } from 'react';
import { Search, MapPin, DollarSign, Briefcase, Bookmark, Send, Trash2, Filter } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  description: string;
  saved: boolean;
}

export default function JobFinderPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [jobTypeFilter, setJobTypeFilter] = useState('all');

  const [jobs, setJobs] = useState<Job[]>([
    {
      id: 1,
      title: 'Software Engineering Intern',
      company: 'TechCorp Inc.',
      location: 'San Francisco, CA',
      type: 'Internship',
      salary: '$25-35/hr',
      description: 'Join our innovative team to work on cutting-edge web applications using React and Node.js.',
      saved: false,
    },
    {
      id: 2,
      title: 'Data Science Research Assistant',
      company: 'University Lab',
      location: 'Remote',
      type: 'Part-time',
      salary: '$20-25/hr',
      description: 'Assist with machine learning research projects and data analysis for academic studies.',
      saved: true,
    },
    {
      id: 3,
      title: 'UI/UX Design Intern',
      company: 'Creative Studios',
      location: 'New York, NY',
      type: 'Internship',
      salary: '$22-30/hr',
      description: 'Design beautiful and intuitive user interfaces for mobile and web applications.',
      saved: false,
    },
    {
      id: 4,
      title: 'Marketing Coordinator',
      company: 'StartupHub',
      location: 'Austin, TX',
      type: 'Full-time',
      salary: '$45k-55k/year',
      description: 'Coordinate marketing campaigns and social media strategy for growing startup.',
      saved: false,
    },
    {
      id: 5,
      title: 'Teaching Assistant - Computer Science',
      company: 'State University',
      location: 'Boston, MA',
      type: 'Part-time',
      salary: '$18-22/hr',
      description: 'Help students with programming assignments and conduct lab sessions.',
      saved: true,
    },
  ]);

  const toggleSave = (jobId: number) => {
    setJobs(jobs.map(job => 
      job.id === jobId ? { ...job, saved: !job.saved } : job
    ));
  };

  const deleteJob = (jobId: number) => {
    setJobs(jobs.filter(job => job.id !== jobId));
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = locationFilter === 'all' || job.location.includes(locationFilter);
    const matchesType = jobTypeFilter === 'all' || job.type === jobTypeFilter;
    return matchesSearch && matchesLocation && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] rounded-3xl p-8 text-white shadow-xl">
        <h1 className="text-4xl font-bold mb-2">Job Finder</h1>
        <p className="text-lg text-white/90">Discover opportunities tailored to your skills and schedule</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-[#1E1E1E] backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#2A2A2A] space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A3A3A3]" />
          <Input
            type="text"
            placeholder="Search for jobs or companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 bg-[#171717] border-[#2A2A2A] text-[#EDEDED] rounded-xl"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#A3A3A3]" />
            <span className="text-sm font-medium text-[#EDEDED]">Filters:</span>
          </div>
          
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-48 rounded-xl bg-[#171717] border-[#2A2A2A] text-[#EDEDED]">
              <MapPin className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent className="bg-[#1E1E1E] border-[#2A2A2A]">
              <SelectItem value="all">All Locations</SelectItem>
              <SelectItem value="Remote">Remote</SelectItem>
              <SelectItem value="San Francisco">San Francisco</SelectItem>
              <SelectItem value="New York">New York</SelectItem>
              <SelectItem value="Austin">Austin</SelectItem>
              <SelectItem value="Boston">Boston</SelectItem>
            </SelectContent>
          </Select>

          <Select value={jobTypeFilter} onValueChange={setJobTypeFilter}>
            <SelectTrigger className="w-48 rounded-xl bg-[#171717] border-[#2A2A2A] text-[#EDEDED]">
              <Briefcase className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Job Type" />
            </SelectTrigger>
            <SelectContent className="bg-[#1E1E1E] border-[#2A2A2A]">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Internship">Internship</SelectItem>
              <SelectItem value="Part-time">Part-time</SelectItem>
              <SelectItem value="Full-time">Full-time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Job Listings */}
      <div className="space-y-4">
        {filteredJobs.map((job) => (
          <div
            key={job.id}
            className="bg-[#1E1E1E] backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:shadow-[#7C3AED]/10 transition-all border border-[#2A2A2A] group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-[#EDEDED] mb-1 group-hover:text-[#7C3AED] transition-colors">
                  {job.title}
                </h3>
                <p className="text-lg text-[#A3A3A3] mb-3">{job.company}</p>
                
                <div className="flex flex-wrap gap-3 text-sm text-[#A3A3A3]">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    <span className="px-2 py-1 bg-[#7C3AED]/20 text-[#8B5CF6] rounded-lg">{job.type}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-semibold text-[#8B5CF6]">{job.salary}</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[#A3A3A3] mb-4">{job.description}</p>

            <div className="flex gap-3">
              <button
                onClick={() => toggleSave(job.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                  job.saved
                    ? 'bg-[#D97706]/20 text-[#F59E0B] border border-[#D97706]/30'
                    : 'bg-[#171717] text-[#A3A3A3] border border-[#2A2A2A] hover:bg-[#1E1E1E]'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${job.saved ? 'fill-current' : ''}`} />
                <span className="text-sm">{job.saved ? 'Saved' : 'Save'}</span>
              </button>
              
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-white hover:shadow-lg hover:shadow-[#7C3AED]/30 transition-all">
                <Send className="w-4 h-4" />
                <span className="text-sm">Apply</span>
              </button>
              
              <button
                onClick={() => deleteJob(job.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C2410C]/20 text-[#EA580C] border border-[#C2410C]/30 hover:bg-[#C2410C]/30 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-sm">Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredJobs.length === 0 && (
        <div className="bg-[#1E1E1E] backdrop-blur-sm rounded-2xl p-12 text-center shadow-lg border border-[#2A2A2A]">
          <Briefcase className="w-16 h-16 text-[#2A2A2A] mx-auto mb-4" />
          <p className="text-xl text-[#A3A3A3]">No jobs found matching your criteria</p>
        </div>
      )}
    </div>
  );
}