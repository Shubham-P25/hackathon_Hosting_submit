
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getHackathonById } from "../api";
import { Skeleton } from "../ui/Skeleton";
import { Button } from "../ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Trophy, Globe, Calendar, User2, Clock, Info, Shield, BadgeCheck, ImageIcon, HelpCircle, Bell, MessageSquare } from "lucide-react";

// Banner rendering above tabs array
export function BannerAboveTabs({ banner }) {
  if (!banner) return null;
  return (
    <div className="w-full mb-6">
      <img src={banner} alt="Banner" className="w-full h-72 object-cover rounded-3xl shadow-xl" />
    </div>
  );
}

const tabs = [
  "Overview",
  "Rules",
  "Criteria",
  "Timeline",
  "Rounds",
  "Prizes",
  "Gallery",
  "FAQs",
  "Updates",
  "Help",
  "Skills Required",
  "Help Contact",
];

export default function HackathonDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hackathon, setHackathon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("Overview");
  const [idx, setIdx] = useState(0);

  // Helper to normalize any value to array
  function toArray(val) {
    if (Array.isArray(val)) return val;
    if (val == null) return [];
    return [val];
  }

  useEffect(() => {
    getHackathonById(id).then(data => {
      setHackathon(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="max-w-7xl mx-auto py-10"><Skeleton height="h-64" /></div>;
  if (!hackathon) return <div className="text-center py-10 text-gray-500">Hackathon not found.</div>;

  // Normalize criteria and timeline to always be arrays
  const criteriaArr = toArray(hackathon.criteria);
  const timelineArr = toArray(hackathon.timeline);

  const go = (d) => setIdx((p) => (p + d + (hackathon.gallery?.length || 0)) % (hackathon.gallery?.length || 1));

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#e0e7ff] to-[#f0fdfa] px-2 sm:px-8 lg:px-24 py-12 "
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7 }}
    >
      <div className="max-w-7xl mx-auto grid gap-8">
        {/* Banner above tabs (always leave space) */}
        {hackathon.banner ? (
          <div className="w-full mb-6">
            <img src={hackathon.banner} alt="Banner" className="w-full h-50 object-cover rounded-3xl shadow-xl" />
          </div>
        ) : (
          <div className="w-full mb-6 h-55" />
        )}
        <motion.div
          className="grid lg:grid-cols-3 gap-8"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <motion.div
            className="lg:col-span-1 bg-gradient-to-br from-white/80 via-indigo-100 to-cyan-100 border border-white/50 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl transition-transform duration-0"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            whileHover={{ scale: 1.04, boxShadow: '0 8px 32px rgba(60, 60, 180, 0.18)' }}
          >
            <img src={hackathon.poster} alt={hackathon.title} className="w-full h-64 object-cover rounded-b-3xl" />
            <div className="p-6 grid gap-4">
              <h2 className="text-3xl font-extrabold leading-tight text-slate-900 drop-shadow mb-2">{hackathon.title}</h2>
              <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
                <Meta icon={Users} label={`${hackathon.participants?.toLocaleString() || "0"} participants`} />
                <Meta icon={Trophy} label={`$${hackathon.prize || 0} prize`} />
                <Meta icon={Globe} label={`Mode: ${hackathon.mode || "ONLINE"}`} />
                <Meta icon={Calendar} label={`Dates: ${fmtRange({start: hackathon.startDate, end: hackathon.endDate})}`} />
                <Meta icon={Clock} label={`Team Size: ${hackathon.teamSize || hackathon.members || "N/A"}`} />
                <Meta icon={Globe} label={`Location: ${hackathon.location || "N/A"}`} />
              </div>
              <div className="flex gap-2 mt-2 flex-wrap">
                <Pill>{hackathon.domain}</Pill>
                <Pill>{hackathon.Is_Paid || hackathon.paid ? "Paid" : "Free"}</Pill>
                <Pill>{hackathon.location}</Pill>
                <Pill>{hackathon.mode}</Pill>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="primary"
                  size="md"
                  className="shadow-lg hover:scale-105 transition-transform duration-200"
                  onClick={() => navigate('/registration')}
                >
                  Apply Now
                </Button>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="lg:col-span-2 grid gap-6"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            <div className="grid grid-cols-6 gap-2 mb-4">
              {tabs.map((t) => (
                <motion.button
                  key={t}
                  onClick={() => setTab(t)}
                  whileHover={{ scale: 1.08 }}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border shadow transition-all duration-200 ${
                    tab === t
                      ? "bg-gradient-to-r from-indigo-500 to-cyan-400 text-white border-indigo-500 shadow-lg"
                      : "bg-white/80 border-white/50 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
                  }`}
                >
                  {t}
                </motion.button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="grid gap-6"
              >
                {tab === "Overview" && <Section title="Overview" icon={Info}>{hackathon.overview || hackathon.description}</Section>}
                {tab === "Rules" && (
                  <Section title="Rules" icon={Shield}>
                    <ul className="list-disc pl-6 grid gap-1">
                      {(hackathon.rules || []).map((r, i) => (
                        <li key={i}>{typeof r === 'string' ? r : r.rule}</li>
                      ))}
                    </ul>
                  </Section>
                )}
                {tab === "Criteria" && (
                  <Section title="Judging Criteria" icon={BadgeCheck}>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(hackathon.criteria) ? hackathon.criteria.map((c, i) => (
                        <Pill key={i}>{typeof c === 'string' ? c : c.criteria || c.label || JSON.stringify(c)}</Pill>
                      )) : <Pill>{hackathon.criteria}</Pill>}
                    </div>
                  </Section>
                )}
                {tab === "Timeline" && (
                  <Section title="Timeline" icon={Calendar}>
                    <ol className="grid gap-2">
                      {Array.isArray(hackathon.timeline) ? hackathon.timeline.map((t, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-slate-900" />
                          <span className="font-medium">{typeof t === 'string' ? t : t.label || t.event || JSON.stringify(t)}</span>
                          <span className="text-slate-500">— {t.date || t.when || ''}</span>
                        </li>
                      )) : <li>{JSON.stringify(hackathon.timeline)}</li>}
                    </ol>
                  </Section>
                )}
                {tab === "Rounds" && (
                  <Section title="Rounds" icon={Clock}>
                    <ul className="list-disc pl-6 grid gap-1">
                      {Array.isArray(hackathon.rounds) ? hackathon.rounds.map((r, i) => (
                        <li key={i}>
                          <span className="font-medium">{r.label || `Round ${i + 1}`}</span>{" "}
                          <span className="text-slate-500">({r.mode})</span>
                        </li>
                      )) : <li>{JSON.stringify(hackathon.rounds)}</li>}
                    </ul>
                  </Section>
                )}
                {tab === "Prizes" && (
                  <Section title="Prizes" icon={Trophy}>
                    <div className="grid sm:grid-cols-3 gap-3">
                      {Array.isArray(hackathon.prizes) ? hackathon.prizes.map((p, i) => (
                        <div key={i} className="bg-white/70 rounded-xl p-4 border border-white/50 text-center">
                          <div className="text-sm text-slate-500">{p.place || p.position}</div>
                          <div className="text-2xl font-black">${p.amount}</div>
                        </div>
                      )) : <div>{JSON.stringify(hackathon.prizes)}</div>}
                    </div>
                  </Section>
                )}
                {tab === "Banner" && hackathon.banner && (
                  <Section title="Banner" icon={ImageIcon}>
                    <img src={hackathon.banner} alt="Banner" className="w-full h-64 object-cover rounded-xl" />
                  </Section>
                )}
                {tab === "FAQs" && (
                  <Section title="FAQs" icon={HelpCircle}>
                    <div className="grid gap-3">
                      {Array.isArray(hackathon.faqs) ? hackathon.faqs.map((f, i) => (
                        <details key={i} className="bg-white/70 border border-white/50 rounded-xl p-3">
                          <summary className="font-medium cursor-pointer">{f.q}</summary>
                          <p className="text-slate-600 mt-1">{f.a}</p>
                        </details>
                      )) : <div>{JSON.stringify(hackathon.faqs)}</div>}
                    </div>
                  </Section>
                )}
                {tab === "Updates" && (
                  <Section title="Updates" icon={Bell}>
                    <ul className="grid gap-2">
                      {Array.isArray(hackathon.updates) ? hackathon.updates.map((u, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-rose-500" />
                          <span className="text-slate-500 w-28">{u.when}</span>
                          <span className="font-medium">{u.text}</span>
                        </li>
                      )) : <li>{JSON.stringify(hackathon.updates)}</li>}
                    </ul>
                  </Section>
                )}
                {tab === "Help" && (
                  <Section title="Help" icon={MessageSquare}>
                    For assistance, DM the guide <span className="font-semibold">{hackathon.guide}</span> or mail
                    <span className="font-mono"> support@submitit.example </span>. We reply fast.
                  </Section>
                )}
                {tab === "Skills Required" && (
                  <Section title="Skills Required" icon={BadgeCheck}>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(hackathon.skillsRequired) ? hackathon.skillsRequired.map((s, i) => (
                        <Pill key={i}>{typeof s === 'string' ? s : JSON.stringify(s)}</Pill>
                      )) : <Pill>{JSON.stringify(hackathon.skillsRequired)}</Pill>}
                    </div>
                  </Section>
                )}
                {tab === "Help Contact" && (
                  <Section title="Help Contact" icon={HelpCircle}>
                    <div className="grid gap-2">
                      {Array.isArray(hackathon.helpContact) ? hackathon.helpContact.map((c, i) => (
                        <div key={i} className="bg-white/70 border border-white/50 rounded-xl p-3">
                          <span className="font-medium">{c.name || c.type || "Contact"}</span>: <span className="text-slate-600">{c.value || JSON.stringify(c)}</span>
                        </div>
                      )) : <div>{JSON.stringify(hackathon.helpContact)}</div>}
                    </div>
                  </Section>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// Remove duplicate tab content and fix closing tags

function fmtRange(dates) {
  try {
    const start = new Date(dates?.start);
    const end = new Date(dates?.end);
    return `${start.toLocaleDateString()} → ${end.toLocaleDateString()}`;
  } catch {
    return "TBA";
  }
}

// Dummy components for Section, Pill, Meta (replace with your actual UI components)
function Section({ title, icon: Icon, children }) {
  return (
    <section className="bg-white/70 rounded-xl p-4 border border-white/50">
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon className="w-5 h-5 text-slate-500" />}
        <h3 className="text-lg font-bold">{title}</h3>
      </div>
      <div>{children}</div>
    </section>
  );
}
function Pill({ children }) {
  return <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">{children}</span>;
}
function Meta({ icon: Icon, label }) {
  return <span className="inline-flex items-center gap-1"><Icon className="w-4 h-4 text-slate-400" /> {label}</span>;
}
