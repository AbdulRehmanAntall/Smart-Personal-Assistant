import { useEffect, useMemo, useState } from 'react';
import {
  Mail,
  Star,
  Calendar,
  CheckSquare,
  Clock,
  PenSquare,
  Send,
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

        const data = await apiFetch<Email[]>(
          `/emails${forceRefresh ? '?force_refresh=true' : ''}`
        );

        if (!alive) return;

        setEmails(data);
        setSelectedEmail((prev) => prev ?? data[0] ?? null);
      } catch (e) {
        if (!alive) return;

        setEmails([]);
        setSelectedEmail(null);

        setError(
          e instanceof Error
            ? e.message
            : 'Failed to load emails. Connect Google in settings.'
        );
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };

    void loadEmails(false);

    const interval = window.setInterval(() => {
      void loadEmails(true);
    }, 60000);

    return () => {
      alive = false;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let alive = true;

    const fetchFullEmail = async () => {
      if (!selectedEmail?.id) {
        setSelectedFull(null);
        return;
      }

      setLoadingBody(true);

      try {
        const full = await apiFetch<EmailFull>(
          `/emails/${encodeURIComponent(selectedEmail.id)}`
        );

        if (!alive) return;

        setSelectedFull(full);
      } catch (e) {
        if (!alive) return;

        setSelectedFull(null);

        setError(
          e instanceof Error
            ? e.message
            : 'Failed to load email body'
        );
      } finally {
        if (!alive) return;

        setLoadingBody(false);
      }
    };

    void fetchFullEmail();

    return () => {
      alive = false;
    };
  }, [selectedEmail?.id]);

  const unreadCount = emails.filter((email) => !email.read).length;

  const bodyText = useMemo(() => {
    return selectedFull?.text?.trim() || selectedEmail?.preview || '';
  }, [selectedFull, selectedEmail]);

  const toggleStar = async (email: Email) => {
    const next = !email.starred;

    setEmails((prev) =>
      prev.map((e) =>
        e.id === email.id ? { ...e, starred: next } : e
      )
    );

    if (selectedEmail?.id === email.id) {
      setSelectedEmail({
        ...email,
        starred: next,
      });
    }

    try {
      await apiFetch(`/emails/${encodeURIComponent(email.id)}/star`, {
        method: 'POST',
        body: JSON.stringify({
          starred: next,
        }),
      });
    } catch {
      setEmails((prev) =>
        prev.map((e) =>
          e.id === email.id
            ? { ...e, starred: email.starred }
            : e
        )
      );
    }
  };

  const selectEmail = async (email: Email) => {
    setSelectedEmail(email);

    if (!email.read) {
      setEmails((prev) =>
        prev.map((e) =>
          e.id === email.id ? { ...e, read: true } : e
        )
      );

      try {
        await apiFetch(
          `/emails/${encodeURIComponent(email.id)}/mark-read`,
          {
            method: 'POST',
            body: JSON.stringify({
              read: true,
            }),
          }
        );
      } catch {
        //
      }
    }
  };

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
      setError(
        e instanceof Error
          ? e.message
          : 'Failed to send email'
      );
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
          <h1 className="text-4xl font-bold">
            Smart Email Assistant
          </h1>
        </div>

        <div className="flex items-center justify-between gap-4">
          <p className="text-lg text-white/90">
            Clean inbox management with Gmail integration
          </p>

          <button
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/20 transition-all border border-white/20"
            onClick={() => setShowCompose(true)}
          >
            <PenSquare className="w-4 h-4" />
            <span className="text-sm font-semibold">
              Compose
            </span>
          </button>
        </div>
      </div>

      {/* Compose */}
      {showCompose && (
        <div className="bg-[#1E1E1E] rounded-2xl p-6 shadow-lg border border-[#2A2A2A] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#EDEDED]">
              New Email
            </h3>

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
            className="w-full h-10 px-3 rounded-lg bg-[#171717] border border-[#2A2A2A] text-[#EDEDED]"
          />

          <input
            value={composeSubject}
            onChange={(e) => setComposeSubject(e.target.value)}
            placeholder="Subject"
            className="w-full h-10 px-3 rounded-lg bg-[#171717] border border-[#2A2A2A] text-[#EDEDED]"
          />

          <textarea
            value={composeBody}
            onChange={(e) => setComposeBody(e.target.value)}
            placeholder="Write your email..."
            className="w-full min-h-[140px] p-3 rounded-lg bg-[#171717] border border-[#2A2A2A] text-[#EDEDED]"
          />

          <button
            onClick={() => void sendComposed()}
            disabled={!composeTo.trim() || sending}
            className="w-full h-10 rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-white flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Send className="w-4 h-4" />
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1E1E1E] rounded-xl p-4 border border-[#2A2A2A]">
          <p className="text-2xl font-bold text-[#EDEDED]">
            {emails.length}
          </p>
          <p className="text-sm text-[#A3A3A3]">
            Total Emails
          </p>
        </div>

        <div className="bg-[#1E1E1E] rounded-xl p-4 border border-[#2A2A2A]">
          <p className="text-2xl font-bold text-[#EDEDED]">
            {unreadCount}
          </p>
          <p className="text-sm text-[#A3A3A3]">Unread</p>
        </div>

        <div className="bg-[#1E1E1E] rounded-xl p-4 border border-[#2A2A2A]">
          <p className="text-2xl font-bold text-[#EDEDED]">
            {emails.filter((e) => e.starred).length}
          </p>
          <p className="text-sm text-[#A3A3A3]">Starred</p>
        </div>
      </div>

      {/* Main */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inbox */}
        <div className="lg:col-span-1 bg-[#1E1E1E] rounded-2xl border border-[#2A2A2A] overflow-hidden">
          <div className="p-4 border-b border-[#2A2A2A]">
            <h3 className="font-bold text-lg text-[#EDEDED]">
              Inbox
            </h3>
          </div>

          <div className="divide-y divide-[#2A2A2A] max-h-[650px] overflow-y-auto">
            {loading && (
              <div className="p-6 text-[#A3A3A3]">
                Loading emails...
              </div>
            )}

            {!loading &&
              emails.map((email) => (
                <div
                  key={email.id}
                  onClick={() => void selectEmail(email)}
                  className={`p-4 cursor-pointer transition-all hover:bg-[#171717] ${
                    selectedEmail?.id === email.id
                      ? 'bg-[#171717]'
                      : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                     <p
                      className={`font-semibold truncate max-w-[220px] ${
                        email.read
                          ? 'text-[#A3A3A3]'
                          : 'text-[#EDEDED]'
                      }`}
                      title={email.from}
                    >
                      {email.from}
                    </p>

                      <p className="text-sm text-[#EDEDED] mt-1">
                        {email.subject}
                      </p>

                      <p className="text-xs text-[#A3A3A3] mt-2 line-clamp-2">
                        {email.preview}
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void toggleStar(email);
                      }}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          email.starred
                            ? 'text-[#F59E0B] fill-current'
                            : 'text-[#A3A3A3]'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-[#A3A3A3] mt-3">
                    <Clock className="w-3 h-3" />
                    {email.time}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Detail */}
        <div className="lg:col-span-2">
          {selectedEmail ? (
            <div className="bg-[#1E1E1E] rounded-2xl p-6 border border-[#2A2A2A]">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-[#EDEDED]">
                  {selectedEmail.subject}
                </h2>

                <div className="mt-2 text-sm text-[#A3A3A3]">
                  <p>
                    <span className="text-[#EDEDED] font-medium">
                      From:
                    </span>{' '}
                    {selectedEmail.from}
                  </p>

                  <p className="mt-1">{selectedEmail.time}</p>
                </div>
              </div>

              <div className="border-t border-[#2A2A2A] pt-6">
                {loadingBody ? (
                  <p className="text-[#A3A3A3]">
                    Loading email...
                  </p>
                ) : (
                  <pre className="whitespace-pre-wrap font-sans text-[#D4D4D4] leading-relaxed">
                    {bodyText}
                  </pre>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-8">
                <button className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#171717] text-[#EDEDED] border border-[#2A2A2A]">
                  <CheckSquare className="w-5 h-5" />
                  Mark as Done
                </button>

                <button className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-white">
                  <Calendar className="w-5 h-5" />
                  Add to Calendar
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-[#1E1E1E] rounded-2xl p-12 text-center border border-[#2A2A2A]">
              <Mail className="w-16 h-16 text-[#2A2A2A] mx-auto mb-4" />
              <p className="text-xl text-[#A3A3A3]">
                Select an email to view
              </p>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}