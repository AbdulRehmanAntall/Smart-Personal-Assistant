import { useEffect, useMemo, useState } from 'react';
import {
  Mail, Star, Calendar, CheckSquare, Clock,
  PenSquare, Send, X, Inbox, User, AtSign, FileText,
} from 'lucide-react';
import { apiFetch } from '../lib/api';

interface Email {
  id: string;
  from: string;
  subject: string;
  preview: string;
  time: string;
  read: boolean;
  starred: boolean;
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
}

/** Extracts a human-readable display name and email address from a raw "From" header */
function parseFrom(raw: string): { name: string; addr: string } {
  const m = raw.match(/^(.+?)\s*<([^>]+)>/);
  if (m) return { name: m[1].trim().replace(/^"|"$/g, ''), addr: m[2].trim() };
  const emailOnly = raw.match(/[\w.+\-]+@[\w.\-]+/);
  if (emailOnly) return { name: '', addr: emailOnly[0] };
  return { name: raw, addr: '' };
}

export default function SmartEmailPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [selectedFull, setSelectedFull] = useState<EmailFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingBody, setLoadingBody] = useState(false);
  const [error, setError] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let alive = true;
    const loadEmails = async (forceRefresh = false) => {
      try {
        if (!forceRefresh) setLoading(true);
        setError('');
        const data = await apiFetch<Email[]>(`/emails${forceRefresh ? '?force_refresh=true' : ''}`);
        if (!alive) return;
        setEmails(data);
        setSelectedEmail(prev => prev ?? data[0] ?? null);
      } catch (e) {
        if (!alive) return;
        setEmails([]);
        setSelectedEmail(null);
        setError(e instanceof Error ? e.message : 'Failed to load emails. Connect Google in settings.');
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };
    void loadEmails(false);
    const interval = window.setInterval(() => void loadEmails(true), 60000);
    return () => { alive = false; window.clearInterval(interval); };
  }, []);

  useEffect(() => {
    let alive = true;
    const fetchFullEmail = async () => {
      if (!selectedEmail?.id) { setSelectedFull(null); return; }
      setLoadingBody(true);
      try {
        const full = await apiFetch<EmailFull>(`/emails/${encodeURIComponent(selectedEmail.id)}`);
        if (!alive) return;
        setSelectedFull(full);
      } catch (e) {
        if (!alive) return;
        setSelectedFull(null);
        setError(e instanceof Error ? e.message : 'Failed to load email body');
      } finally {
        if (!alive) return;
        setLoadingBody(false);
      }
    };
    void fetchFullEmail();
    return () => { alive = false; };
  }, [selectedEmail?.id]);

  const unreadCount = emails.filter(e => !e.read).length;
  const bodyText = useMemo(() => selectedFull?.text?.trim() || selectedEmail?.preview || '', [selectedFull, selectedEmail]);

  const toggleStar = async (email: Email) => {
    const next = !email.starred;
    setEmails(prev => prev.map(e => e.id === email.id ? { ...e, starred: next } : e));
    if (selectedEmail?.id === email.id) setSelectedEmail({ ...email, starred: next });
    try {
      await apiFetch(`/emails/${encodeURIComponent(email.id)}/star`, { method: 'POST', body: JSON.stringify({ starred: next }) });
    } catch {
      setEmails(prev => prev.map(e => e.id === email.id ? { ...e, starred: email.starred } : e));
    }
  };

  const selectEmail = async (email: Email) => {
    setSelectedEmail(email);
    if (!email.read) {
      setEmails(prev => prev.map(e => e.id === email.id ? { ...e, read: true } : e));
      try {
        await apiFetch(`/emails/${encodeURIComponent(email.id)}/mark-read`, { method: 'POST', body: JSON.stringify({ read: true }) });
      } catch { /* */ }
    }
  };

  const sendComposed = async () => {
    if (!composeTo.trim() || sending) return;
    setSending(true);
    setError('');
    try {
      await apiFetch('/emails/send', { method: 'POST', body: JSON.stringify({ to: composeTo.trim(), subject: composeSubject, body: composeBody }) });
      setShowCompose(false);
      setComposeTo(''); setComposeSubject(''); setComposeBody('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">

      {/* Header */}
      <div className="bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <Mail className="w-7 h-7 sm:w-10 sm:h-10 flex-shrink-0" />
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold">Smart Email</h1>
              <p className="text-sm sm:text-base text-white/80 mt-0.5">Clean inbox management with Gmail integration</p>
            </div>
          </div>
          <button
            id="compose-btn"
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 transition-all border border-white/20 text-sm font-semibold"
            onClick={() => setShowCompose(true)}
          >
            <PenSquare className="w-4 h-4" />
            Compose
          </button>
        </div>
      </div>

      {/* Compose modal */}
      {showCompose && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full sm:max-w-lg bg-[#1E1E1E] dark:bg-[#1E1E1E] light:bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#2A2A2A] dark:border-[#2A2A2A] light:border-gray-200">
              <h3 className="text-base sm:text-lg font-bold text-[#EDEDED] dark:text-[#EDEDED] light:text-gray-900">New Email</h3>
              <button onClick={() => setShowCompose(false)} disabled={sending} className="p-1.5 rounded-lg hover:bg-[#2A2A2A] dark:hover:bg-[#2A2A2A] light:hover:bg-gray-100 transition-all text-[#A3A3A3]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 sm:p-5 space-y-3">
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A3A3A3]" />
                <input value={composeTo} onChange={e => setComposeTo(e.target.value)} placeholder="To" className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#171717] dark:bg-[#171717] light:bg-gray-50 border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-gray-200 text-[#EDEDED] dark:text-[#EDEDED] light:text-gray-900 text-sm focus:outline-none focus:border-[#7C3AED]" />
              </div>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A3A3A3]" />
                <input value={composeSubject} onChange={e => setComposeSubject(e.target.value)} placeholder="Subject" className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#171717] dark:bg-[#171717] light:bg-gray-50 border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-gray-200 text-[#EDEDED] dark:text-[#EDEDED] light:text-gray-900 text-sm focus:outline-none focus:border-[#7C3AED]" />
              </div>
              <textarea value={composeBody} onChange={e => setComposeBody(e.target.value)} placeholder="Write your email..." rows={6} className="w-full p-3 rounded-xl bg-[#171717] dark:bg-[#171717] light:bg-gray-50 border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-gray-200 text-[#EDEDED] dark:text-[#EDEDED] light:text-gray-900 text-sm resize-none focus:outline-none focus:border-[#7C3AED]" />
              <button onClick={() => void sendComposed()} disabled={!composeTo.trim() || sending} className="w-full h-10 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-white flex items-center justify-center gap-2 text-sm font-semibold disabled:opacity-60 hover:scale-[1.02] transition-all">
                <Send className="w-4 h-4" />
                {sending ? 'Sending…' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: 'Total', value: emails.length },
          { label: 'Unread', value: unreadCount },
          { label: 'Starred', value: emails.filter(e => e.starred).length },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[#1E1E1E] dark:bg-[#1E1E1E] light:bg-white rounded-xl p-3 sm:p-4 border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-gray-200 text-center">
            <p className="text-xl sm:text-2xl font-bold text-[#EDEDED] dark:text-[#EDEDED] light:text-gray-900">{value}</p>
            <p className="text-xs sm:text-sm text-[#A3A3A3] dark:text-[#A3A3A3] light:text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <X className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Main: inbox + detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

        {/* Inbox list */}
        <div className="lg:col-span-1 bg-[#1E1E1E] dark:bg-[#1E1E1E] light:bg-white rounded-2xl border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-gray-200 overflow-hidden flex flex-col">
          <div className="p-3 sm:p-4 border-b border-[#2A2A2A] dark:border-[#2A2A2A] light:border-gray-200 flex items-center gap-2">
            <Inbox className="w-4 h-4 text-[#7C3AED]" />
            <h3 className="font-bold text-base sm:text-lg text-[#EDEDED] dark:text-[#EDEDED] light:text-gray-900">Inbox</h3>
            {unreadCount > 0 && (
              <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-[#7C3AED] text-white">{unreadCount}</span>
            )}
          </div>

          <div className="divide-y divide-[#2A2A2A] dark:divide-[#2A2A2A] light:divide-gray-100 max-h-[400px] lg:max-h-[600px] overflow-y-auto">
            {loading && (
              <div className="p-6 text-[#A3A3A3] dark:text-[#A3A3A3] light:text-gray-400 text-sm text-center">
                Loading emails…
              </div>
            )}
            {!loading && emails.length === 0 && !error && (
              <div className="p-6 text-[#A3A3A3] dark:text-[#A3A3A3] light:text-gray-400 text-sm text-center">No emails found.</div>
            )}
            {!loading && emails.map(email => {
              const { name, addr } = parseFrom(email.from);
              return (
                <div
                  key={email.id}
                  onClick={() => void selectEmail(email)}
                  className={`p-3 sm:p-4 cursor-pointer transition-all hover:bg-[#171717] dark:hover:bg-[#171717] light:hover:bg-gray-50 ${selectedEmail?.id === email.id ? 'bg-[#171717] dark:bg-[#171717] light:bg-gray-50 border-l-2 border-[#7C3AED]' : ''}`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      {/* Sender name */}
                      <p className={`text-sm font-semibold truncate ${email.read ? 'text-[#A3A3A3] dark:text-[#A3A3A3] light:text-gray-400' : 'text-[#EDEDED] dark:text-[#EDEDED] light:text-gray-900'}`}>
                        {name || addr}
                      </p>
                      {/* Email address (if name is different) */}
                      {name && addr && (
                        <p className="text-xs text-[#6B6B6B] dark:text-[#6B6B6B] light:text-gray-400 truncate">{addr}</p>
                      )}
                      {/* Subject */}
                      <p className={`text-xs sm:text-sm mt-1 truncate ${email.read ? 'text-[#A3A3A3] dark:text-[#A3A3A3] light:text-gray-500' : 'text-[#EDEDED] dark:text-[#EDEDED] light:text-gray-800 font-medium'}`}>
                        {email.subject || '(No subject)'}
                      </p>
                      {/* Preview */}
                      <p className="text-xs text-[#6B6B6B] dark:text-[#6B6B6B] light:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                        {email.preview}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <button onClick={e => { e.stopPropagation(); void toggleStar(email); }} className="p-0.5">
                        <Star className={`w-4 h-4 ${email.starred ? 'text-[#F59E0B] fill-current' : 'text-[#A3A3A3]'}`} />
                      </button>
                      {!email.read && <span className="w-2 h-2 rounded-full bg-[#7C3AED]" />}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#6B6B6B] dark:text-[#6B6B6B] light:text-gray-400 mt-2">
                    <Clock className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{email.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Email detail */}
        <div className="lg:col-span-2">
          {selectedEmail ? (
            <div className="bg-[#1E1E1E] dark:bg-[#1E1E1E] light:bg-white rounded-2xl border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-gray-200 overflow-hidden">
              {/* Detail header */}
              <div className="p-4 sm:p-6 border-b border-[#2A2A2A] dark:border-[#2A2A2A] light:border-gray-200">
                <h2 className="text-lg sm:text-2xl font-bold text-[#EDEDED] dark:text-[#EDEDED] light:text-gray-900 leading-snug break-words">
                  {selectedEmail.subject || '(No subject)'}
                </h2>

                {/* Metadata table */}
                <div className="mt-4 space-y-2.5">
                  {(() => {
                    const { name, addr } = parseFrom(selectedEmail.from);
                    return (
                      <div className="flex items-start gap-2 text-sm">
                        <User className="w-4 h-4 text-[#7C3AED] flex-shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <span className="text-[#EDEDED] dark:text-[#EDEDED] light:text-gray-900 font-medium">From: </span>
                          {name ? (
                            <>
                              <span className="text-[#EDEDED] dark:text-[#EDEDED] light:text-gray-900">{name}</span>
                              <span className="text-[#A3A3A3] dark:text-[#A3A3A3] light:text-gray-500 ml-1 break-all">&lt;{addr}&gt;</span>
                            </>
                          ) : (
                            <span className="text-[#A3A3A3] dark:text-[#A3A3A3] light:text-gray-500 break-all">{addr}</span>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {selectedFull?.to && (
                    <div className="flex items-start gap-2 text-sm">
                      <AtSign className="w-4 h-4 text-[#7C3AED] flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="text-[#EDEDED] dark:text-[#EDEDED] light:text-gray-900 font-medium">To: </span>
                        <span className="text-[#A3A3A3] dark:text-[#A3A3A3] light:text-gray-500 break-all">{selectedFull.to}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-[#7C3AED] flex-shrink-0" />
                    <span className="text-[#A3A3A3] dark:text-[#A3A3A3] light:text-gray-500">{selectedFull?.date || selectedEmail.time}</span>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-4 sm:p-6">
                {loadingBody ? (
                  <div className="flex items-center gap-3 text-[#A3A3A3]">
                    <div className="w-4 h-4 border-2 border-[#A3A3A3] border-t-[#7C3AED] rounded-full animate-spin" />
                    Loading email…
                  </div>
                ) : (
                  <div className="max-h-[400px] overflow-y-auto pr-1">
                    <pre className="whitespace-pre-wrap font-sans text-sm sm:text-base text-[#D4D4D4] dark:text-[#D4D4D4] light:text-gray-700 leading-relaxed break-words">
                      {bodyText || '(No content)'}
                    </pre>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-4 sm:p-6 pt-0 grid grid-cols-1 gap-3">
                <button 
                  onClick={() => {
                    if (selectedEmail) {
                      const emailId = selectedEmail.id;
                      setEmails(prev => prev.filter(e => e.id !== emailId));
                      setSelectedEmail(null);
                      apiFetch(`/emails/${encodeURIComponent(emailId)}/mark-read`, {
                        method: 'POST',
                        body: JSON.stringify({ read: true })
                      }).catch(() => {});
                    }
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#171717] dark:bg-[#171717] light:bg-gray-100 text-[#EDEDED] dark:text-[#EDEDED] light:text-gray-700 border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-gray-200 hover:border-[#7C3AED] transition-all text-sm font-medium"
                >
                  <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                  Mark as Done
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-[#1E1E1E] dark:bg-[#1E1E1E] light:bg-white rounded-2xl p-10 sm:p-16 text-center border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-gray-200 flex flex-col items-center justify-center gap-4">
              <Mail className="w-12 h-12 sm:w-16 sm:h-16 text-[#2A2A2A] dark:text-[#2A2A2A] light:text-gray-200" />
              <p className="text-base sm:text-xl text-[#A3A3A3] dark:text-[#A3A3A3] light:text-gray-400">
                Select an email to read it
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}