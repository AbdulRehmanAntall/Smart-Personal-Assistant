import { useEffect, useMemo, useState } from 'react';
import { Mail, Star, Calendar, CheckSquare, Sparkles, Clock, PenSquare, Send } from 'lucide-react';
import { apiFetch } from '../lib/api';

interface Email {
  id: string;
  from: string;
  subject: string;
  preview: string;
  time: string;
  read: boolean;
  starred: boolean;
  aiSummary: string;
}

interface EmailFull {
  id: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  snippet: string;
  read: boolean;
  starred: boolean;
  text: string;
  html: string;
}

export default function SmartEmailPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [selectedFull, setSelectedFull] = useState<EmailFull | null>(null);
  const [loadingBody, setLoadingBody] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const [showCompose, setShowCompose] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async (forceRefresh = false) => {
      try {
        if (!forceRefresh) {
          setLoading(true);
        }
        setError('');
        const data = await apiFetch<Email[]>(`/emails${forceRefresh ? '?force_refresh=true' : ''}`);
        if (!alive) return;
        setEmails(data);
        setSelectedEmail((prev) => prev ?? data[0] ?? null);
      } catch (e) {
        if (!alive) return;
        if (!forceRefresh) {
          setEmails([]);
          setSelectedEmail(null);
        }
        setError(e instanceof Error ? e.message : 'Failed to load emails. Connect Google in Settings.');
      } finally {
        if (!alive) return;
        if (!forceRefresh) setLoading(false);
      }
    };
    void load(false);

    const interval = window.setInterval(() => {
      void load(true);
    }, 60_000);

    return () => {
      alive = false;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    const fetchBody = async () => {
      if (!selectedEmail?.id) {
        setSelectedFull(null);
        return;
      }
      setLoadingBody(true);
      try {
        const full = await apiFetch<EmailFull>(`/emails/${encodeURIComponent(selectedEmail.id)}`);
        if (!alive) return;
        setSelectedFull(full);
      } catch (e) {
        if (!alive) return;
        setSelectedFull(null);
        setError(e instanceof Error ? e.message : 'Failed to load full email body');
      } finally {
        if (!alive) return;
        setLoadingBody(false);
      }
    };
    void fetchBody();
    return () => {
      alive = false;
    };
  }, [selectedEmail?.id]);

  const unreadCount = emails.filter(email => !email.read).length;

  const toggleStar = async (email: Email) => {
    const next = !email.starred;
    setEmails((prev) => prev.map((e) => (e.id === email.id ? { ...e, starred: next } : e)));
    if (selectedEmail?.id === email.id) setSelectedEmail({ ...email, starred: next });
    try {
      await apiFetch(`/emails/${encodeURIComponent(email.id)}/star`, {
        method: 'POST',
        body: JSON.stringify({ starred: next }),
      });
    } catch {
      // revert on failure
      setEmails((prev) => prev.map((e) => (e.id === email.id ? { ...e, starred: email.starred } : e)));
      if (selectedEmail?.id === email.id) setSelectedEmail(email);
    }
  };

  const selectEmail = async (email: Email) => {
    setSelectedEmail(email);
    if (!email.read) {
      setEmails((prev) => prev.map((e) => (e.id === email.id ? { ...e, read: true } : e)));
      try {
        await apiFetch(`/emails/${encodeURIComponent(email.id)}/mark-read`, {
          method: 'POST',
          body: JSON.stringify({ read: true }),
        });
      } catch {
        // ignore
      }
    }
  };

  const bodyText = useMemo(() => {
    const t = (selectedFull?.text || '').trim();
    if (t) return t;
    return selectedEmail?.preview ?? '';
  }, [selectedFull?.text, selectedEmail?.preview]);

  const sendComposed = async () => {
    if (!composeTo.trim() || sending) return;
    setSending(true);
    setError('');
    try {
      await apiFetch('/emails/send', {
        method: 'POST',
        body: JSON.stringify({
          to: composeTo.trim(),
          subject: composeSubject,
          body: composeBody,
        }),
      });
      setShowCompose(false);
      setComposeTo('');
      setComposeSubject('');
      setComposeBody('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] rounded-3xl p-8 text-white shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <Mail className="w-10 h-10" />
          <h1 className="text-4xl font-bold">Smart Email Assistant</h1>
        </div>
        <div className="flex items-center justify-between gap-4">
          <p className="text-lg text-white/90">AI-powered email management with smart summaries</p>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/20 transition-all border border-white/20"
            onClick={() => setShowCompose(true)}
          >
            <PenSquare className="w-4 h-4" />
            <span className="text-sm font-semibold">Compose</span>
          </button>
        </div>
      </div>

      {showCompose && (
        <div className="bg-[#1E1E1E] rounded-2xl p-6 shadow-lg border border-[#2A2A2A] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#EDEDED]">New Email</h3>
            <button
              className="text-sm text-[#A3A3A3] hover:text-[#EDEDED]"
              onClick={() => setShowCompose(false)}
              disabled={sending}
            >
              Close
            </button>
          </div>
          <input
            value={composeTo}
            onChange={(e) => setComposeTo(e.target.value)}
            placeholder="To"
            className="w-full h-10 px-3 rounded-lg bg-[#171717] border border-[#2A2A2A] text-[#EDEDED] text-sm"
          />
          <input
            value={composeSubject}
            onChange={(e) => setComposeSubject(e.target.value)}
            placeholder="Subject"
            className="w-full h-10 px-3 rounded-lg bg-[#171717] border border-[#2A2A2A] text-[#EDEDED] text-sm"
          />
          <textarea
            value={composeBody}
            onChange={(e) => setComposeBody(e.target.value)}
            placeholder="Write your message..."
            className="w-full min-h-[120px] p-3 rounded-lg bg-[#171717] border border-[#2A2A2A] text-[#EDEDED] text-sm"
          />
          <button
            className="flex items-center justify-center gap-2 w-full h-10 rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-white text-sm font-semibold disabled:opacity-60"
            onClick={() => void sendComposed()}
            disabled={!composeTo.trim() || sending}
          >
            <Send className="w-4 h-4" />
            <span>{sending ? 'Sending...' : 'Send'}</span>
          </button>
          <p className="text-xs text-[#A3A3A3]">
            If sending fails, re-connect Google with Gmail send permission.
          </p>
        </div>
      )}

      {/* Email Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#1E1E1E] backdrop-blur-sm rounded-xl p-4 shadow-lg border border-[#2A2A2A]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#8B5CF6]/20">
              <Mail className="w-5 h-5 text-[#8B5CF6]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#EDEDED]">{emails.length}</p>
              <p className="text-sm text-[#A3A3A3]">Total Emails</p>
            </div>
          </div>
        </div>
        <div className="bg-[#1E1E1E] backdrop-blur-sm rounded-xl p-4 shadow-lg border border-[#2A2A2A]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#7C3AED]/20">
              <Mail className="w-5 h-5 text-[#7C3AED]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#EDEDED]">{unreadCount}</p>
              <p className="text-sm text-[#A3A3A3]">Unread</p>
            </div>
          </div>
        </div>
        <div className="bg-[#1E1E1E] backdrop-blur-sm rounded-xl p-4 shadow-lg border border-[#2A2A2A]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#D97706]/20">
              <Star className="w-5 h-5 text-[#F59E0B]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#EDEDED]">{emails.filter(e => e.starred).length}</p>
              <p className="text-sm text-[#A3A3A3]">Starred</p>
            </div>
          </div>
        </div>
        <div className="bg-[#1E1E1E] backdrop-blur-sm rounded-xl p-4 shadow-lg border border-[#2A2A2A]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#6D28D9]/20">
              <Sparkles className="w-5 h-5 text-[#8B5CF6]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#EDEDED]">AI</p>
              <p className="text-sm text-[#A3A3A3]">Powered</p>
            </div>
          </div>
        </div>
      </div>

      {/* Email Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Email List */}
        <div className="lg:col-span-1 bg-[#1E1E1E] backdrop-blur-sm rounded-2xl shadow-lg border border-[#2A2A2A] overflow-hidden">
          <div className="p-4 border-b border-[#2A2A2A]">
            <h3 className="font-bold text-lg text-[#EDEDED]">Inbox</h3>
          </div>
          <div className="divide-y divide-[#2A2A2A] max-h-[600px] overflow-y-auto">
            {loading && (
              <div className="p-6 text-sm text-[#A3A3A3]">Loading emails...</div>
            )}
            {!loading && error && (
              <div className="p-6 text-sm text-[#EA580C]">{error}</div>
            )}
            {emails.map((email) => (
              <div
                key={email.id}
                onClick={() => void selectEmail(email)}
                className={`p-4 cursor-pointer transition-all hover:bg-[#171717] ${
                  selectedEmail?.id === email.id ? 'bg-[#171717]' : ''
                } ${!email.read ? 'border-l-4 border-[#7C3AED]' : ''}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`font-semibold text-sm ${!email.read ? 'text-[#EDEDED]' : 'text-[#A3A3A3]'}`}>
                        {email.from}
                      </p>
                      {email.starred && <Star className="w-4 h-4 text-[#F59E0B] fill-current" />}
                    </div>
                    <p className={`text-sm mb-1 ${!email.read ? 'text-[#EDEDED] font-medium' : 'text-[#A3A3A3]'}`}>
                      {email.subject}
                    </p>
                    <p className="text-xs text-[#A3A3A3] line-clamp-2">{email.preview}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#A3A3A3]">
                  <Clock className="w-3 h-3" />
                  <span>{email.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Email Detail */}
        <div className="lg:col-span-2 space-y-4">
          {selectedEmail ? (
            <>
              {/* Email Header */}
              <div className="bg-[#1E1E1E] backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#2A2A2A]">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-2 text-[#EDEDED]">{selectedEmail.subject}</h2>
                    <div className="flex items-center gap-3 text-sm text-[#A3A3A3]">
                      <span className="font-medium text-[#EDEDED]">From: {selectedEmail.from}</span>
                      <span>•</span>
                      <span>{selectedEmail.time}</span>
                    </div>
                  </div>
                  <button
                    className="p-2 rounded-lg hover:bg-[#171717] transition-all"
                    onClick={() => void toggleStar(selectedEmail)}
                  >
                    <Star
                      className={`w-5 h-5 ${
                        selectedEmail.starred ? 'text-[#F59E0B] fill-current' : 'text-[#A3A3A3]'
                      }`}
                    />
                  </button>
                </div>

                {/* AI Summary */}
                <div className="bg-gradient-to-br from-[#7C3AED]/20 to-[#8B5CF6]/20 rounded-xl p-4 border border-[#7C3AED]/30">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-[#8B5CF6] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold mb-1 text-[#EDEDED]">AI Summary</p>
                      <p className="text-sm text-[#EDEDED]">{selectedEmail.aiSummary}</p>
                    </div>
                  </div>
                </div>

                {/* Email Body */}
                <div className="mt-6">
                  {loadingBody ? (
                    <p className="text-sm text-[#A3A3A3]">Loading full email…</p>
                  ) : (
                    <pre className="text-[#A3A3A3] leading-relaxed whitespace-pre-wrap font-sans">
                      {bodyText}
                    </pre>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-[#1E1E1E] backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#2A2A2A]">
                <h3 className="font-bold text-lg mb-4 text-[#EDEDED]">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#171717] text-[#EDEDED] hover:bg-[#1E1E1E] border border-[#2A2A2A] transition-all">
                    <CheckSquare className="w-5 h-5" />
                    <span>Mark as Done</span>
                  </button>
                  <button className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-white hover:shadow-lg hover:shadow-[#7C3AED]/30 transition-all">
                    <Calendar className="w-5 h-5" />
                    <span>Add to Calendar</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-[#1E1E1E] backdrop-blur-sm rounded-2xl p-12 text-center shadow-lg border border-[#2A2A2A]">
              <Mail className="w-16 h-16 text-[#2A2A2A] mx-auto mb-4" />
              <p className="text-xl text-[#A3A3A3]">Select an email to view</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
