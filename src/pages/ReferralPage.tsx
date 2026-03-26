import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Gift, Share2, Sparkles, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getReferralCode } from '../lib/localData';

export default function ReferralPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [copied, setCopied] = React.useState(false);

  if (!user) {
    return null;
  }

  const code = getReferralCode(user);
  const inviteLink = `${window.location.origin}/register?ref=${code}`;

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  async function shareInvite() {
    const text = `Join me on Sora AI. Start from 0 and build toward IELTS. Use my code: ${code}\n${inviteLink}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Sora AI invite',
          text,
          url: inviteLink,
        });
        return;
      } catch {
        // Fall back to clipboard copy below.
      }
    }

    await copyInvite();
  }

  return (
    <div className="bg-background min-h-screen">
      <header className="bg-background sticky top-0 z-40 glass-nav">
        <div className="flex items-center gap-3 px-4 py-4 sm:px-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-surface-container rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-on-surface" />
          </button>
          <div>
            <div className="text-xl font-extrabold text-primary">Invite Friends</div>
            <div className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">
              Grow with Sora AI together
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 sm:px-6 sm:py-8 space-y-6">
        <section className="rounded-[2rem] p-6 sm:p-8 bg-gradient-to-br from-primary to-primary-container text-white shadow-2xl shadow-primary/15">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-2xl">
              <div className="text-xs font-black uppercase tracking-widest opacity-80">Sora AI referral</div>
              <h1 className="mt-3 text-3xl sm:text-4xl font-extrabold leading-tight">
                Bring one friend into the 0 to IELTS path
              </h1>
              <p className="mt-3 text-white/85 leading-7">
                Share your personal link. Your friend starts with the placement test, opens the roadmap,
                and gets daily missions from day one.
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <Sparkles className="w-7 h-7" />
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <InviteStat icon={<Users className="w-5 h-5" />} label="Your code" value={code.toUpperCase()} />
          <InviteStat icon={<Gift className="w-5 h-5" />} label="Best use" value="Friends starting from 0" />
          <InviteStat icon={<Share2 className="w-5 h-5" />} label="Link ready" value="Copy or share now" />
        </section>

        <section className="bg-surface-container-lowest rounded-[2rem] p-5 sm:p-6 border border-outline-variant/10 shadow-sm">
          <div className="text-sm font-black uppercase tracking-widest text-primary">Invite link</div>
          <div className="mt-3 rounded-[1.5rem] bg-surface-container-low p-4 text-sm sm:text-base text-on-surface break-all">
            {inviteLink}
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={copyInvite}
              className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-primary text-white font-bold inline-flex items-center justify-center gap-2"
            >
              <Copy className="w-4 h-4" />
              {copied ? 'Copied' : 'Copy link'}
            </button>
            <button
              onClick={() => void shareInvite()}
              className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-secondary-container text-white font-bold inline-flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share invite
            </button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <StepCard
            title="1. Share the link"
            text="Send the invite link or code to your friend in Telegram, Instagram, or any chat."
          />
          <StepCard
            title="2. Start with placement"
            text="They take the placement test first, so Sora AI puts them on the correct level path."
          />
          <StepCard
            title="3. Follow daily missions"
            text="The app then drives lesson, listening, writing, and speaking practice every day."
          />
        </section>
      </main>
    </div>
  );
}

function InviteStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.5rem] bg-surface-container-lowest p-5 border border-outline-variant/10 shadow-sm">
      <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
        {icon}
      </div>
      <div className="mt-4 text-xs font-black uppercase tracking-widest text-on-surface-variant">{label}</div>
      <div className="mt-2 text-lg font-extrabold text-on-surface break-words">{value}</div>
    </div>
  );
}

function StepCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[1.5rem] bg-surface-container-lowest p-5 border border-outline-variant/10 shadow-sm">
      <div className="font-bold text-on-surface">{title}</div>
      <div className="mt-2 text-sm text-on-surface-variant leading-6">{text}</div>
    </div>
  );
}
