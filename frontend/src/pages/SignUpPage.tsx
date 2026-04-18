import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Brain, Sparkles, User, Mail, Lock } from 'lucide-react';
import { useAuth } from '../app/context/AuthContext';
import { Input } from '../components/ui/input';

export default function SignUpPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    signup(username, email, password);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center p-6">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-[#7C3AED]/20 rounded-full mix-blend-normal filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-[#8B5CF6]/20 rounded-full mix-blend-normal filter blur-xl opacity-30 animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-[#6D28D9]/20 rounded-full mix-blend-normal filter blur-xl opacity-30 animate-pulse delay-500"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-[#1E1E1E] backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-[#2A2A2A]">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] rounded-2xl blur-md opacity-50"></div>
              <div className="relative bg-gradient-to-br from-[#7C3AED] to-[#8B5CF6] p-4 rounded-2xl">
                <Brain className="w-10 h-10 text-white" />
                <Sparkles className="w-4 h-4 text-yellow-300 absolute -top-1 -right-1" />
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] bg-clip-text text-transparent">
              AllignAI
            </h1>
            <p className="text-[#A3A3A3] mt-2">Create your account and get started</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm text-[#EDEDED] block">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A3A3A3]" />
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  className="pl-10 h-12 bg-[#171717] border-[#2A2A2A] text-[#EDEDED] rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm text-[#EDEDED] block">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A3A3A3]" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="pl-10 h-12 bg-[#171717] border-[#2A2A2A] text-[#EDEDED] rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm text-[#EDEDED] block">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A3A3A3]" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  className="pl-10 h-12 bg-[#171717] border-[#2A2A2A] text-[#EDEDED] rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm text-[#EDEDED] block">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A3A3A3]" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="pl-10 h-12 bg-[#171717] border-[#2A2A2A] text-[#EDEDED] rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-white font-semibold shadow-lg hover:shadow-xl hover:shadow-[#7C3AED]/30 hover:scale-[1.02] transition-all"
            >
              Sign Up
            </button>
          </form>

          {/* Divider */}
          <div className="mt-8 mb-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-[#2A2A2A]"></div>
            <span className="text-sm text-[#A3A3A3]">OR</span>
            <div className="flex-1 h-px bg-[#2A2A2A]"></div>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-[#A3A3A3]">
              Already have an account?{' '}
              <Link to="/login" className="text-[#7C3AED] font-semibold hover:text-[#8B5CF6]">
                Login
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link to="/" className="text-[#A3A3A3] hover:text-[#EDEDED] text-sm">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}