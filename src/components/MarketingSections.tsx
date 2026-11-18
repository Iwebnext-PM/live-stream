import React, { useState } from 'react';
import {
  BadgeCheck,
  Bell,
  BellOff,
  Check,
  ChevronDown,
  Globe,
  Layers,
  Lock,
  Mail,
  MessageSquare,
  Phone,
  Radio,
  ShieldCheck,
  Smartphone,
  UserPlus,
  Video,
  X,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { SmartImage } from './SmartImage';

interface MarketingSectionsProps {
  onStartStreaming: () => void;
  onSelectCategoryAndScroll: (category: string) => void;
  onOpenCreatorProfile: (creatorId: string) => void;
}

export function MarketingSections({
  onStartStreaming,
  onSelectCategoryAndScroll,
  onOpenCreatorProfile,
}: MarketingSectionsProps) {
  const {
    user,
    userProfile,
    creators,
    categories,
    pricingPlans,
    testimonials,
    faqs,
    toggleFollowCreator,
    toggleNotifications,
    selectPlanPreference,
    submitContactForm,
  } = usePlatform();

  // FAQ Accordion State
  const [openFaqId, setOpenFaqId] = useState<string | null>(faqs[0]?.id || null);

  // Plan Selection Feedback
  const [selectedPlanNotice, setSelectedPlanNotice] = useState<string | null>(null);

  // Contact Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [submittingContact, setSubmittingContact] = useState(false);

  // Legal Modal State
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | null>(null);

  const handlePlanSelect = async (planName: string) => {
    setSubject(`Plan Inquiry: ${planName}`);
    setSelectedPlanNotice(planName);
    if (user) {
      await selectPlanPreference(planName);
    }
    const contactEl = document.getElementById('contact');
    if (contactEl) {
      contactEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactError(null);
    setContactSuccess(false);

    if (fullName.trim().length < 2) {
      setContactError('Please enter your full name (at least 2 characters).');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setContactError('Please provide a valid email address.');
      return;
    }
    if (phone.trim() && !/^[0-9+\-()\s]{7,25}$/.test(phone.trim())) {
      setContactError('Please enter a valid phone number.');
      return;
    }
    if (subject.trim().length < 2) {
      setContactError('Please include a brief subject.');
      return;
    }
    if (message.trim().length < 5) {
      setContactError('Please write a message of at least 5 characters.');
      return;
    }

    setSubmittingContact(true);
    try {
      await submitContactForm({
        fullName,
        email,
        phone,
        subject,
        message,
      });
      setContactSuccess(true);
      setFullName('');
      setEmail('');
      setPhone('');
      setSubject('');
      setMessage('');
    } catch (err) {
      setContactError(
        err instanceof Error ? err.message : 'Unable to send your message. Please try again.'
      );
    } finally {
      setSubmittingContact(false);
    }
  };

  const notificationsOn = userProfile?.notificationsEnabled ?? false;

  return (
    <>
      {/* 1. HOW IT WORKS */}
      <section id="how-it-works" className="py-16 sm:py-20 border-b border-white/10 bg-[#080C17]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <h2 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-white">
                How GoToLive Stream Works
              </h2>
              <p className="text-sm sm:text-base text-slate-400 mt-2 max-w-xl">
                Move from channel setup to live interactive broadcasting in three focused steps.
              </p>
            </div>
            <button
              type="button"
              onClick={onStartStreaming}
              className="self-start md:self-auto px-4 py-2 rounded-lg text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 transition-colors cursor-pointer"
            >
              Launch Broadcast Studio
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-7 rounded-2xl bg-[#0C1120] border border-white/10">
              <p className="text-xs font-mono-tabular text-violet-400 mb-3">01</p>
              <h3 className="text-lg font-display font-semibold text-white mb-2">
                Create Your Account
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Sign up with Google authentication, customize your creator handle, and choose your primary streaming category.
              </p>
            </div>

            <div className="p-7 rounded-2xl bg-[#0C1120] border border-white/10">
              <p className="text-xs font-mono-tabular text-blue-400 mb-3">02</p>
              <h3 className="text-lg font-display font-semibold text-white mb-2">
                Start Broadcasting
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Connect your camera and microphone in the browser studio, verify audio levels in Demo Mode, or attach LiveKit, Agora, or WHIP ingest.
              </p>
            </div>

            <div className="p-7 rounded-2xl bg-[#0C1120] border border-white/10">
              <p className="text-xs font-mono-tabular text-violet-400 mb-3">03</p>
              <h3 className="text-lg font-display font-semibold text-white mb-2">
                Build Your Audience
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Engage viewers through real-time stream chat, grow channel followers, and monitor live viewership across every session.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FEATURES BENTO GRID */}
      <section id="features" className="py-16 sm:py-20 border-b border-white/10 bg-[#060913]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-white">
              Built for Modern Live Broadcasting
            </h2>
            <p className="text-sm sm:text-base text-slate-400 mt-2">
              Every essential capability needed to host reliable streams, organize channels, and connect with audiences across desktop and mobile.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0C1120] border border-white/10 flex flex-col justify-between">
              <div>
                <Video className="w-5 h-5 text-violet-400 mb-4" />
                <h3 className="text-lg font-display font-semibold text-white mb-2">
                  HD Live Video Streaming
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Browser-native MediaDevices camera/mic preview paired with extensible 1080p60 quality presets and WebRTC SFU architecture.
                </p>
              </div>
              <p className="text-xs font-mono-tabular text-slate-500 mt-5">
                Supports 1080p60 · 720p60 · 480p · Adaptive
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0C1120] border border-white/10">
              <MessageSquare className="w-5 h-5 text-blue-400 mb-4" />
              <h3 className="text-base font-display font-semibold text-white mb-2">
                Real-Time Live Chat
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Low-latency Firestore-backed stream chat rooms synchronized instantly alongside every live player.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0C1120] border border-white/10">
              <Layers className="w-5 h-5 text-violet-400 mb-4" />
              <h3 className="text-base font-display font-semibold text-white mb-2">
                Multiple Streaming Categories
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Dedicated discovery channels for Gaming, Music, Technology, Podcasts, Education, Sports, Entertainment, and Lifestyle.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0C1120] border border-white/10">
              <Radio className="w-5 h-5 text-blue-400 mb-4" />
              <h3 className="text-base font-display font-semibold text-white mb-2">
                Creator Profiles
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Dedicated channel pages with verified badges, follower counts, bios, and active broadcast archives.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0C1120] border border-white/10">
              <Globe className="w-5 h-5 text-violet-400 mb-4" />
              <h3 className="text-base font-display font-semibold text-white mb-2">
                Audience Engagement
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                One-click channel following, shareable stream links, and interactive chat prompts that turn viewers into regulars.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0C1120] border border-white/10">
              <Smartphone className="w-5 h-5 text-blue-400 mb-4" />
              <h3 className="text-base font-display font-semibold text-white mb-2">
                Mobile-Friendly Streaming
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Responsive player layouts and touch-ready broadcast studio controls engineered for phones and tablets.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0C1120] border border-white/10 flex flex-col justify-between">
              <div>
                <Bell className="w-5 h-5 text-violet-400 mb-4" />
                <h3 className="text-base font-display font-semibold text-white mb-2">
                  Live Notifications
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-4">
                  Manage instant go-live alerts for the creators you follow.
                </p>
              </div>
              <button
                type="button"
                onClick={toggleNotifications}
                className="inline-flex items-center gap-2 text-xs font-semibold text-violet-300 hover:text-white cursor-pointer"
              >
                {notificationsOn ? (
                  <>
                    <Bell className="w-3.5 h-3.5 text-emerald-400" />
                    Alerts Enabled
                  </>
                ) : (
                  <>
                    <BellOff className="w-3.5 h-3.5 text-slate-400" />
                    {user ? 'Enable Live Alerts' : 'Sign in for Live Alerts'}
                  </>
                )}
              </button>
            </div>

            <div className="lg:col-span-4 p-6 rounded-2xl bg-[#0C1120] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-4">
                <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-display font-semibold text-white">
                    Secure Streaming Experience
                  </h3>
                  <p className="text-sm text-slate-400">
                    Protected by Firebase Authentication, verified role-based access rules, and PII-isolated user data architecture.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300 shrink-0">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>RBAC & TLS Ready</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FEATURED CREATORS */}
      <section id="creators" className="py-16 sm:py-20 border-b border-white/10 bg-[#080C17]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h2 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-white">
              Featured Creators
            </h2>
            <p className="text-sm sm:text-base text-slate-400 mt-2">
              Explore broadcasters hosting recurring shows across gaming, music, engineering, and live podcasts.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {creators.map((creator) => {
              const isFollowing = userProfile?.followedCreatorIds?.includes(creator.id) ?? false;
              return (
                <div
                  key={creator.id}
                  className="p-6 rounded-2xl bg-[#0C1120] border border-white/10 hover:border-violet-500/40 transition-colors flex flex-col justify-between gap-5"
                >
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <button
                        type="button"
                        onClick={() => onOpenCreatorProfile(creator.id)}
                        className="flex items-center gap-3.5 text-left cursor-pointer group"
                      >
                        <SmartImage
                          src={creator.avatarUrl}
                          alt={creator.name}
                          fallbackTitle={creator.name}
                          className="w-14 h-14 rounded-full object-cover border border-white/15 shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-base font-display font-semibold text-white group-hover:text-violet-300 transition-colors">
                              {creator.name}
                            </h3>
                            {creator.isVerified && (
                              <BadgeCheck className="w-4 h-4 text-blue-400 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {creator.primaryCategory} · @{creator.handle}
                          </p>
                        </div>
                      </button>
                    </div>

                    <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">
                      {creator.bio}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] text-slate-500">Followers</p>
                      <p className="text-sm font-display font-bold text-white font-mono-tabular">
                        {creator.followersCount.toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenCreatorProfile(creator.id)}
                        className="px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        Profile
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleFollowCreator(creator.id)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          isFollowing
                            ? 'bg-white/10 text-white border border-white/20'
                            : 'bg-violet-600 hover:bg-violet-500 text-white'
                        }`}
                      >
                        {isFollowing ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <UserPlus className="w-3.5 h-3.5" />
                        )}
                        {isFollowing ? 'Following' : 'Follow'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. PRICING PLANS */}
      <section id="pricing" className="py-16 sm:py-20 border-b border-white/10 bg-[#060913]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-white">
              Simple, Scalable Streaming Plans
            </h2>
            <p className="text-sm sm:text-base text-slate-400 mt-2">
              Start broadcasting for free or upgrade for custom branding, analytics, and multi-channel teams. Prices shown are editable placeholders.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {pricingPlans.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-2xl p-7 flex flex-col justify-between transition-colors ${
                  plan.isPopular
                    ? 'bg-[#10172D] border border-violet-500/60'
                    : 'bg-[#0C1120] border border-white/10'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="text-lg font-display font-bold text-white">{plan.name}</h3>
                    {plan.isPopular && (
                      <span className="text-[11px] font-semibold text-violet-300">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mb-6">{plan.tagline}</p>

                  <div className="mb-6 pb-6 border-b border-white/10">
                    <span className="text-4xl font-display font-bold text-white font-mono-tabular">
                      {plan.priceLabel}
                    </span>
                    <span className="text-xs text-slate-400 ml-2">{plan.billingCycle}</span>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                        <Check className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => handlePlanSelect(plan.name)}
                  className={`w-full py-3 px-4 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                    plan.isPopular
                      ? 'bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white'
                      : 'bg-[#131B31] hover:bg-white/10 text-white border border-white/10'
                  }`}
                >
                  {plan.ctaLabel}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. TESTIMONIALS (CLEARLY IDENTIFIED SAMPLE FEEDBACK) */}
      <section id="testimonials" className="py-16 sm:py-20 border-b border-white/10 bg-[#080C17]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-white">
                Creator Stories
              </h2>
              <p className="text-sm sm:text-base text-slate-400 mt-2">
                Sample testimonials illustrating creator workflows until live customer feedback is published in the Admin Dashboard.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <blockquote
                key={t.id}
                className="p-6 rounded-2xl bg-[#0C1120] border border-white/10 flex flex-col justify-between gap-6"
              >
                <div>
                  {t.isSample && (
                    <p className="text-[11px] font-medium text-slate-400 mb-3">
                      Sample Testimonial
                    </p>
                  )}
                  <p className="text-sm text-slate-200 leading-relaxed">
                    "{t.quote}"
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                  <SmartImage
                    src={t.avatarUrl}
                    alt={t.authorName}
                    fallbackTitle={t.authorName}
                    className="w-10 h-10 rounded-full object-cover border border-white/15 shrink-0"
                  />
                  <div>
                    <p className="text-sm font-display font-semibold text-white">
                      {t.authorName}
                    </p>
                    <p className="text-xs text-slate-400">
                      {t.authorRole} · {t.organization}
                    </p>
                  </div>
                </div>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* 6. FAQ ACCORDION */}
      <section id="faq" className="py-16 sm:py-20 border-b border-white/10 bg-[#060913]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h2 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-white">
              Frequently Asked Questions
            </h2>
            <p className="text-sm sm:text-base text-slate-400 mt-2">
              Answers on broadcasting setup, free viewing, mobile capture, and technical support.
            </p>
          </div>

          <div className="divide-y divide-white/10 border-t border-b border-white/10">
            {faqs.map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div key={faq.id} className="py-1">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                    className="w-full py-4 flex items-center justify-between gap-4 text-left cursor-pointer group"
                  >
                    <span className="text-sm sm:text-base font-display font-semibold text-white group-hover:text-violet-300 transition-colors">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-violet-400' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="pb-5 pr-8 text-sm text-slate-400 leading-relaxed">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. CONTACT SECTION */}
      <section id="contact" className="py-16 sm:py-20 border-b border-white/10 bg-[#080C17]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left Info */}
            <div className="lg:col-span-5">
              <h2 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-white mb-4">
                Contact GoToLive Stream
              </h2>
              <p className="text-sm sm:text-base text-slate-400 leading-relaxed mb-8">
                Questions about creator onboarding, business broadcasting plans, or WebRTC ingest integration? Reach out directly.
              </p>

              <div className="space-y-5">
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-lg bg-[#0C1120] border border-white/10 text-violet-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Email</p>
                    <p className="text-sm font-semibold text-white mt-0.5">iwebnext.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-lg bg-[#0C1120] border border-white/10 text-blue-400">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Phone</p>
                    <a
                      href="tel:8884455423"
                      className="text-sm font-semibold text-white hover:text-violet-300 transition-colors mt-0.5 inline-block font-mono-tabular"
                    >
                      888-445-5423
                    </a>
                  </div>
                </div>
              </div>

              {selectedPlanNotice && (
                <div className="mt-8 p-4 rounded-xl bg-violet-500/10 border border-violet-500/30 text-xs text-violet-200">
                  Selected plan: <strong className="text-white">{selectedPlanNotice}</strong>. Complete the form to request activation or custom billing details.
                </div>
              )}
            </div>

            {/* Right Form */}
            <div className="lg:col-span-7">
              <form
                onSubmit={handleContactSubmit}
                noValidate
                className="p-6 sm:p-8 rounded-2xl bg-[#0C1120] border border-white/10 space-y-5"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="contact-name" className="block text-xs font-medium text-slate-300 mb-1.5">
                      Full Name
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      maxLength={100}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Alex Morgan"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#060913] border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="block text-xs font-medium text-slate-300 mb-1.5">
                      Email Address
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      maxLength={120}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@company.com"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#060913] border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="contact-phone" className="block text-xs font-medium text-slate-300 mb-1.5">
                      Phone Number
                    </label>
                    <input
                      id="contact-phone"
                      type="tel"
                      maxLength={30}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="888-445-5423"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#060913] border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-subject" className="block text-xs font-medium text-slate-300 mb-1.5">
                      Subject
                    </label>
                    <input
                      id="contact-subject"
                      type="text"
                      required
                      maxLength={140}
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Creator channel or plan inquiry"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#060913] border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="contact-message" className="block text-xs font-medium text-slate-300 mb-1.5">
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    rows={4}
                    required
                    maxLength={2000}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us about your live broadcast goals..."
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#060913] border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
                  />
                </div>

                {contactError && (
                  <p role="alert" className="text-xs text-rose-400">
                    {contactError}
                  </p>
                )}

                {contactSuccess && (
                  <p role="status" className="text-xs text-emerald-400">
                    Thank you. Your inquiry has been recorded and is visible in the Admin Dashboard.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submittingContact}
                  className="px-6 py-3 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {submittingContact ? 'Sending Message...' : 'Send Message'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="bg-[#060913] pt-14 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-white/10">
            <div className="md:col-span-4">
              <p className="text-lg font-display font-bold text-white mb-3">
                GoToLive Stream
              </p>
              <p className="text-sm text-slate-400 leading-relaxed max-w-sm mb-5">
                Live video broadcasting, real-time audience chat, and scalable WebRTC creator studio tools built for high-definition channels.
              </p>
              <div className="flex items-center gap-3">
                <a
                  href="#streams"
                  aria-label="GoToLive Stream Broadcasts"
                  className="p-2 rounded-lg bg-[#0C1120] border border-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <Video className="w-4 h-4" />
                </a>
                <a
                  href="#creators"
                  aria-label="GoToLive Stream Creators"
                  className="p-2 rounded-lg bg-[#0C1120] border border-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <Globe className="w-4 h-4" />
                </a>
                <a
                  href="#contact"
                  aria-label="Contact GoToLive Stream"
                  className="p-2 rounded-lg bg-[#0C1120] border border-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <Mail className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="md:col-span-2">
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">
                Navigation
              </h3>
              <ul className="space-y-2.5 text-sm text-slate-400">
                <li>
                  <a href="#streams" className="hover:text-white transition-colors">
                    Live Streams
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-white transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#creators" className="hover:text-white transition-colors">
                    Creators
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-white transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-white transition-colors">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

            <div className="md:col-span-3">
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">
                Streaming Categories
              </h3>
              <ul className="grid grid-cols-2 gap-2.5 text-sm text-slate-400">
                {categories.slice(0, 8).map((cat) => (
                  <li key={cat.id}>
                    <button
                      type="button"
                      onClick={() => onSelectCategoryAndScroll(cat.name)}
                      className="hover:text-white transition-colors cursor-pointer text-left"
                    >
                      {cat.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="md:col-span-3">
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">
                Contact Information
              </h3>
              <ul className="space-y-2.5 text-sm text-slate-400">
                <li>Email: <span className="text-slate-200">iwebnext.com</span></li>
                <li>Phone: <span className="text-slate-200 font-mono-tabular">888-445-5423</span></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} GoToLive Stream. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => setLegalModal('privacy')}
                className="hover:text-slate-300 transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
              <button
                type="button"
                onClick={() => setLegalModal('terms')}
                className="hover:text-slate-300 transition-colors cursor-pointer"
              >
                Terms & Conditions
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Privacy Policy / Terms & Conditions Modal */}
      {legalModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={legalModal === 'privacy' ? 'Privacy Policy' : 'Terms and Conditions'}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="w-full max-w-xl bg-[#0C1120] border border-white/15 rounded-2xl p-6 sm:p-8 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-display font-bold text-white">
                {legalModal === 'privacy' ? 'Privacy Policy' : 'Terms & Conditions'}
              </h3>
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                aria-label="Close legal notice"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {legalModal === 'privacy' ? (
              <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
                <p>
                  GoToLive Stream collects only the information needed to authenticate creator accounts, store channel preferences, and process submitted contact inquiries.
                </p>
                <p>
                  Camera and microphone feeds captured in the Broadcast Studio remain strictly local in Demo Mode unless you explicitly configure and connect an external LiveKit, Agora, or WebRTC WHIP endpoint.
                </p>
                <p>
                  For privacy inquiries, contact us at iwebnext.com or 888-445-5423.
                </p>
              </div>
            ) : (
              <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
                <p>
                  By accessing GoToLive Stream, broadcasters agree to stream lawful content and respect community chat guidelines.
                </p>
                <p>
                  Sample channels labeled DEMO represent simulated preview metadata and do not connect to external live video feeds until configured with a compatible WebRTC SFU provider.
                </p>
                <p>
                  Pricing tiers shown on the platform are configurable placeholders managed by the platform administrator.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
