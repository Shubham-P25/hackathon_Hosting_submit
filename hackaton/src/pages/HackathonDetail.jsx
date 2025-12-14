
import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getHackathonById } from "../api";
import { Skeleton } from "../ui/Skeleton";
import { Button } from "../ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Trophy, Globe, Calendar, User2, Clock, Info, Shield, BadgeCheck, 
  ImageIcon, HelpCircle, Bell, MessageSquare, MapPin, 
  Target, Zap, ChevronLeft, ChevronRight, Star, Award, Code, Mail, Phone
} from "lucide-react";

// Banner rendering above tabs array
export function BannerAboveTabs({ banner }) {
  if (!banner) return null;
  return (
    <div className="w-full mb-6">
      <img src={banner} alt="Banner" className="w-full h-72 object-cover rounded-3xl shadow-xl" />
    </div>
  );
}

const BASE_TABS = [
  "Overview",
  "Rules",
  "Criteria", 
  "Timeline",
  "Rounds",
  "Prizes",
  "Gallery",
  "FAQs",
  "Updates",
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
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        return [val];
      }
    }
    return [val];
  }

  // Helper to safely parse JSON fields
  function safeParseJSON(val, fallback = []) {
    if (Array.isArray(val)) return val;
    if (val == null) return fallback;
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch {
        return fallback;
      }
    }
    if (typeof val === 'object') return val;
    return fallback;
  }

  useEffect(() => {
    getHackathonById(id).then(data => {
      setHackathon(data);
      setLoading(false);
    });
  }, [id]);

  const statusRaw = useMemo(() => {
    if (!hackathon) return null;
    if (hackathon.status) return hackathon.status;
    const now = new Date();
    const start = hackathon.startDate ? new Date(hackathon.startDate) : null;
    const end = hackathon.endDate ? new Date(hackathon.endDate) : null;
    if (end && now > end) return "Ended";
    if (start && now < start) return "Upcoming";
    return "Ongoing";
  }, [hackathon]);

  const statusKey = typeof statusRaw === "string" ? statusRaw.toLowerCase() : "";
  const statusLabel = statusKey
    ? statusKey.charAt(0).toUpperCase() + statusKey.slice(1)
    : "N/A";
  const endedStatuses = ["ended", "completed", "finished", "closed"];
  const hasEnded = endedStatuses.includes(statusKey);
  const statusTone = hasEnded
    ? "bg-rose-100 text-rose-700"
    : statusKey === "upcoming"
      ? "bg-amber-100 text-amber-700"
      : "bg-emerald-100 text-emerald-700";
  const tabs = hasEnded ? [...BASE_TABS, "Results"] : BASE_TABS;

  useEffect(() => {
    if (!hasEnded && tab === "Results") {
      setTab("Overview");
    }
  }, [hasEnded, tab]);

  if (loading) return <div className="max-w-7xl mx-auto py-10"><Skeleton height="h-64" /></div>;
  if (!hackathon) return <div className="text-center py-10 text-gray-500">Hackathon not found.</div>;

  // Normalize criteria and timeline to always be arrays
  const criteriaArr = toArray(hackathon.criteria);
  const timelineArr = toArray(hackathon.timeline);
  const hallOfFameArr = toArray(hackathon.hallOfFame);
  const resultsArr = toArray(hackathon.results);

  const go = (d) => setIdx((p) => (p + d + (hackathon.gallery?.length || 0)) % (hackathon.gallery?.length || 1));

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#e0e7ff] to-[#f0fdfa] px-2 sm:px-8 lg:px-24 py-12 "
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7 }}
    >
      <div className="max-w-7xl mx-auto grid gap-8">
        {/* Banner above tabs */}
        {hackathon.banner && (
          <div className="w-full mb-6">
            <img src={hackathon.banner} alt={`${hackathon.title} Banner`} className="w-full h-64 object-cover rounded-3xl shadow-xl" />
          </div>
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
            {hackathon.poster && (
              <img src={hackathon.poster} alt={hackathon.title} className="w-full h-64 object-cover rounded-b-3xl" />
            )}
            <div className="p-6 grid gap-4">
              <h2 className="text-3xl font-extrabold leading-tight text-slate-900 drop-shadow mb-2">{hackathon.title}</h2>
              <p className="text-slate-600 text-sm leading-relaxed">{hackathon.description}</p>
              
              <div className="grid grid-cols-1 gap-3 text-sm text-slate-600">
                <Meta icon={Calendar} label={`Start: ${new Date(hackathon.startDate).toLocaleDateString('en-US', { 
                  weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', 
                  hour: '2-digit', minute: '2-digit' 
                })}`} />
                <Meta icon={Calendar} label={`End: ${new Date(hackathon.endDate).toLocaleDateString('en-US', { 
                  weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', 
                  hour: '2-digit', minute: '2-digit' 
                })}`} />
                <Meta icon={Globe} label={`Mode: ${hackathon.mode}`} />
                {hackathon.location && <Meta icon={MapPin} label={`Location: ${hackathon.location}`} />}
                {hackathon.teamSize && <Meta icon={Users} label={`Team Size: ${hackathon.teamSize} members`} />}
                <Meta icon={Rupee} label={hackathon.Ispaid ? "Paid Event" : "Free Event"} />
                {hackathon.domain && <Meta icon={Target} label={`Domain: ${hackathon.domain}`} />}
              </div>

              <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                <span>Status:</span>
                <span className={`px-3 py-1 rounded-full shadow-sm ${statusTone}`}>
                  {statusLabel}
                </span>
              </div>

              <div className="flex gap-2 mt-2 flex-wrap">
                <Pill variant="primary">{hackathon.domain}</Pill>
                <Pill variant={hackathon.Ispaid ? "warning" : "success"}>{hackathon.Ispaid ? "Paid" : "Free"}</Pill>
                <Pill variant="info">{hackathon.mode}</Pill>
                {hackathon.location && <Pill variant="secondary">{hackathon.location}</Pill>}
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  variant="primary"
                  size="md"
                  className="flex-1 shadow-lg hover:scale-105 transition-transform duration-200"
                  onClick={() => navigate(`/hackathons/${hackathon.id}/registration`)}
                >
                  Register Now
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  className="shadow-lg hover:scale-105 transition-transform duration-200"
                  onClick={() => navigate(`/hackathons`)}
                >
                  Back to List
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
                {tab === "Overview" && (
                  <Section title="Overview" icon={Info}>
                    <div className="prose prose-slate max-w-none">
                      <p className="text-lg leading-relaxed">{hackathon.overview || hackathon.description}</p>
                      <div className="mt-4 grid grid-cols-2 gap-4 text-sm bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl">
                        <div>
                          <span className="font-semibold text-slate-700">Created:</span>
                          <p className="text-slate-600">{new Date(hackathon.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-700">Last Updated:</span>
                          <p className="text-slate-600">{new Date(hackathon.updatedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  </Section>
                )}

                {tab === "Rules" && (
                  <Section title="Rules & Guidelines" icon={Shield}>
                    {safeParseJSON(hackathon.rules).length > 0 ? (
                      <ol className="list-decimal pl-6 space-y-2">
                        {safeParseJSON(hackathon.rules).map((rule, i) => (
                          <li key={i} className="text-slate-700 leading-relaxed">
                            {typeof rule === 'string' ? rule : rule.rule || rule.text || JSON.stringify(rule)}
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <div className="text-slate-500 italic">No specific rules provided</div>
                    )}
                  </Section>
                )}

                {tab === "Criteria" && (
                  <Section title="Judging Criteria" icon={BadgeCheck}>
                    {criteriaArr.length > 0 ? (
                      <div className="grid gap-4">
                        {criteriaArr.map((criterion, i) => {
                          const value =
                            typeof criterion === "string"
                              ? { title: `Criterion ${i + 1}`, description: criterion }
                              : {
                                  title: criterion.title || criterion.name || criterion.metric || `Criterion ${i + 1}`,
                                  description: criterion.description || criterion.detail || criterion.text || "Details coming soon",
                                  weight: criterion.weight || criterion.score || criterion.points,
                                };
                          return (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, y: 16 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true, amount: 0.4 }}
                              transition={{ duration: 0.4, delay: i * 0.05 }}
                              className="p-5 bg-gradient-to-br from-emerald-50 to-green-100 rounded-xl border border-emerald-200 shadow-sm"
                            >
                              <div className="flex items-center justify-between gap-4">
                                <h4 className="text-lg font-semibold text-emerald-800">{value.title}</h4>
                                {value.weight && (
                                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-200/70 text-emerald-800">
                                    Weight: {value.weight}
                                  </span>
                                )}
                              </div>
                              <p className="mt-2 text-sm text-emerald-700 leading-relaxed">{value.description}</p>
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl">
                        <p className="text-slate-700 leading-relaxed text-lg">
                          Judging criteria will be announced soon.
                        </p>
                      </div>
                    )}
                  </Section>
                )}

                {tab === "Timeline" && (
                  <Section title="Event Timeline" icon={Calendar}>
                    {safeParseJSON(hackathon.timeline).length > 0 ? (
                      <div className="space-y-4">
                        {safeParseJSON(hackathon.timeline).map((phase, i) => (
                          <div key={i} className="flex items-start gap-4 p-4 bg-white/70 rounded-xl border border-white/50">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                              {i + 1}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-slate-900">
                                {phase.phase || phase.title || phase.name || `Phase ${i + 1}`}
                              </h4>
                              {phase.date && (
                                <p className="text-sm text-slate-600 mt-1">
                                  📅 {new Date(phase.date).toLocaleDateString()}
                                </p>
                              )}
                              {phase.description && (
                                <p className="text-slate-700 mt-2">{phase.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-slate-500 italic">Timeline will be updated soon</div>
                    )}
                  </Section>
                )}

                {tab === "Rounds" && (
                  <Section title="Competition Rounds" icon={Zap}>
                    {safeParseJSON(hackathon.rounds).length > 0 ? (
                      <div className="grid gap-4">
                        {safeParseJSON(hackathon.rounds).map((round, i) => (
                          <div key={i} className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                            <h4 className="font-bold text-lg text-purple-900">
                              {round.name || `Round ${i + 1}`}
                            </h4>
                            {round.description && (
                              <p className="text-purple-700 mt-2">{round.description}</p>
                            )}
                            {round.duration && (
                              <p className="text-sm text-purple-600 mt-1">⏱️ Duration: {round.duration}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-slate-500 italic">Round details will be announced</div>
                    )}
                  </Section>
                )}

                {tab === "Prizes" && (
                  <Section title="Prizes & Rewards" icon={Trophy}>
                    {safeParseJSON(hackathon.prizes).length > 0 ? (
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {safeParseJSON(hackathon.prizes).map((prize, i) => (
                          <div key={i} className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border border-orange-200 text-center">
                            <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                              <Award className="w-6 h-6 text-white" />
                            </div>
                            <h4 className="font-bold text-lg text-orange-900 mb-1">
                              {prize.type || prize.position || `Prize ${i + 1}`}
                            </h4>
                            <p className="text-2xl font-black text-orange-700 mb-2">
                              {prize.amount || "TBA"}
                            </p>
                            {prize.details && (
                              <p className="text-sm text-orange-600">{prize.details}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-slate-500 italic">Prize details coming soon</div>
                    )}
                  </Section>
                )}

                {tab === "Gallery" && (
                  <Section title="Event Gallery" icon={ImageIcon}>
                    {safeParseJSON(hackathon.gallery).length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {safeParseJSON(hackathon.gallery).map((imageUrl, i) => (
                          <div key={i} className="relative group overflow-hidden rounded-xl shadow-lg">
                            <img 
                              src={imageUrl} 
                              alt={`Gallery image ${i + 1}`}
                              className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <ImageIcon className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                        <p className="text-slate-500">No gallery images available yet</p>
                      </div>
                    )}
                  </Section>
                )}

                {tab === "FAQs" && (
                  <Section title="Frequently Asked Questions" icon={HelpCircle}>
                    {safeParseJSON(hackathon.faqs).length > 0 ? (
                      <div className="space-y-3">
                        {safeParseJSON(hackathon.faqs).map((faq, i) => (
                          <details key={i} className="group bg-gradient-to-r from-blue-100 to-cyan-100 border border-white/50 rounded-xl p-4 cursor-pointer">
                            <summary className="font-semibold text-slate-900 list-none flex items-center justify-between">
                              <span>{faq.question || faq.q || `Question ${i + 1}`}</span>
                              <ChevronRight className="w-5 h-5 text-slate-400 transition-transform group-open:rotate-90" />
                            </summary>
                            <div className="mt-3 pt-3 border-t border-slate-200">
                              <p className="text-slate-700 leading-relaxed">
                                {faq.answer || faq.a || "Answer not provided"}
                              </p>
                            </div>
                          </details>
                        ))}
                      </div>
                    ) : (
                      <div className="text-slate-500 italic">No FAQs available</div>
                    )}
                  </Section>
                )}

                {tab === "Updates" && (
                  <Section title="Latest Updates" icon={Bell}>
                    {safeParseJSON(hackathon.updates).length > 0 ? (
                      <div className="space-y-4">
                        {safeParseJSON(hackathon.updates).map((update, i) => (
                          <div key={i} className="flex items-start gap-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl">
                            <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-slate-700 leading-relaxed">
                                {typeof update === 'string' ? update : update.text || update.message || JSON.stringify(update)}
                              </p>
                              {update.date && (
                                <p className="text-xs text-slate-500 mt-2">
                                  {new Date(update.date).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-slate-500 italic">No updates available</div>
                    )}
                  </Section>
                )}

                {tab === "Results" && (
                  <Section title="Results" icon={Trophy}>
                    {resultsArr.length > 0 ? (
                      <div className="grid gap-5 md:grid-cols-2">
                        {resultsArr.map((entry, index) => {
                          const data = typeof entry === "string" ? { teamName: entry } : entry || {};
                          const teamName = data.teamName || data.team || data.name || `Team ${index + 1}`;
                          const projectTitle = data.project || data.projectName || data.title;
                          const projectLink = data.projectLink || data.link || data.url;
                          const position = data.position || data.rank || data.place;
                          const summary = data.summary || data.description || data.notes;

                          return (
                            <motion.div
                              key={`${teamName}-${index}`}
                              initial={{ opacity: 0, y: 24 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true, amount: 0.3 }}
                              transition={{ duration: 0.45, delay: index * 0.08 }}
                              className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-white/90 px-6 py-5 shadow-lg"
                            >
                              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-transparent to-cyan-100 opacity-0 transition-opacity duration-300 hover:opacity-100" />
                              <div className="relative z-10 space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <h3 className="text-xl font-bold text-slate-900">{teamName}</h3>
                                    {position && (
                                      <p className="text-sm font-semibold text-indigo-600">{position}</p>
                                    )}
                                  </div>
                                  <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                                    <Star className="w-4 h-4" />
                                    #{index + 1}
                                  </div>
                                </div>

                                {projectTitle && (
                                  <p className="text-sm font-medium text-slate-700">{projectTitle}</p>
                                )}

                                {summary && (
                                  <p className="text-sm leading-relaxed text-slate-600">{summary}</p>
                                )}

                                {projectLink && (
                                  <a
                                    href={projectLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                                  >
                                    View Project
                                    <ChevronRight className="w-4 h-4" />
                                  </a>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 px-6 py-10 text-center text-slate-500">
                        Results will be published soon.
                      </div>
                    )}
                  </Section>
                )}

                {tab === "Skills Required" && (
                  <Section title="Required Skills & Technologies" icon={Code}>
                    {safeParseJSON(hackathon.skillsRequired).length > 0 ? (
                      <div className="flex flex-wrap gap-3">
                        {safeParseJSON(hackathon.skillsRequired).map((skill, i) => (
                          <Pill key={i} variant="primary" className="bg-gradient-to-r from-indigo-500 to-purple-500 text-yellow-50 w-24 h-12 flex items-center justify-center text-[18px]">
                            {typeof skill === 'string' ? skill : skill.name || JSON.stringify(skill)}
                          </Pill>
                        ))}
                      </div>
                    ) : (
                      <div className="text-slate-500 italic">No specific skills mentioned</div>
                    )}
                  </Section>
                )}

                {tab === "Help Contact" && (
                  <Section title="Get Help & Support" icon={MessageSquare}>
                    {safeParseJSON(hackathon.helpContact).length > 0 ? (
                      <div className="grid sm:grid-cols-2 gap-4">
                        {safeParseJSON(hackathon.helpContact).map((contact, i) => (
                          <div key={i} className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                            <div className="flex items-center gap-3 mb-2">
                              {contact.includes('@') ? (
                                <Mail className="w-5 h-5 text-green-600" />
                              ) : (
                                <Phone className="w-5 h-5 text-green-600" />
                              )}
                              <span className="font-semibold text-green-900">
                                {contact.includes('@') ? 'Email' : 'Contact'}
                              </span>
                            </div>
                            <p className="text-green-700 font-mono">
                              {typeof contact === 'string' ? contact : contact.value || contact.contact || JSON.stringify(contact)}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-slate-500 italic">Contact information will be provided</div>
                    )}
                  </Section>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {hasEnded && (
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-white shadow-2xl px-8 py-10"
          >
            <div className="absolute -top-20 -right-10 w-56 h-56 bg-gradient-to-br from-purple-200/70 to-indigo-200/70 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-16 w-64 h-64 bg-gradient-to-br from-emerald-200/60 to-cyan-200/60 rounded-full blur-3xl" />

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative z-10 text-center mb-8"
            >
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 text-white shadow-lg">
                <Trophy className="w-5 h-5" />
                <span className="text-sm font-semibold tracking-wide uppercase">Hall of Fame</span>
              </div>
              <h2 className="mt-4 text-3xl md:text-4xl font-extrabold text-slate-900">Celebrating our Champions</h2>
              <p className="mt-3 max-w-2xl mx-auto text-slate-600">
                Meet the innovators who left a mark on this hackathon. Their projects inspire the next generation of builders.
              </p>
            </motion.div>

            {hallOfFameArr.length > 0 ? (
              <div className="relative z-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {hallOfFameArr.map((entry, index) => {
                  const details = typeof entry === "string" ? { name: entry } : entry || {};
                  const name = details.name || details.teamName || details.team || `Winner ${index + 1}`;
                  const position = details.position || details.rank || details.place;
                  const project = details.project || details.projectName || details.title;
                  const summary = details.description || details.summary || details.highlight;
                  const score = details.score || details.points;
                  const avatar = details.avatar || details.image || details.logo;

                  return (
                    <motion.article
                      key={`${name}-${index}`}
                      initial={{ opacity: 0, y: 24 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{ duration: 0.45, delay: index * 0.08 }}
                      className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white/80 backdrop-blur-sm p-6 shadow-lg"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white via-transparent to-indigo-100 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      <div className="relative z-10 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {avatar ? (
                              <img src={avatar} alt={name} className="w-12 h-12 rounded-full object-cover border-2 border-indigo-200" />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold">
                                {name.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <h3 className="text-lg font-bold text-slate-900">{name}</h3>
                              {position && (
                                <p className="text-sm font-semibold text-indigo-600">{position}</p>
                              )}
                            </div>
                          </div>
                          <Star className="w-6 h-6 text-yellow-400" />
                        </div>

                        {project && (
                          <div className="rounded-xl bg-slate-100/70 px-4 py-2 text-left">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Project</p>
                            <p className="text-sm font-medium text-slate-800">{project}</p>
                          </div>
                        )}

                        {summary && (
                          <p className="text-sm leading-relaxed text-slate-600 text-left">{summary}</p>
                        )}

                        {score && (
                          <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
                            <BadgeCheck className="w-4 h-4" />
                            Score: {score}
                          </span>
                        )}
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="relative z-10 rounded-2xl border border-dashed border-slate-200 bg-white/70 px-6 py-12 text-center"
              >
                <User2 className="mx-auto mb-4 h-10 w-10 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-600">Hall of Fame coming soon</h3>
                <p className="mt-2 text-sm text-slate-500">We’re gathering the highlights from this hackathon. Check back shortly!</p>
              </motion.div>
            )}
          </motion.section>
        )}
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
function Pill({ children, variant = "default", className = "" }) {
  const variants = {
    default: "bg-slate-100 text-slate-700",
    primary: "bg-blue-100 text-blue-700",
    success: "bg-green-100 text-green-700", 
    warning: "bg-yellow-100 text-yellow-700",
    info: "bg-cyan-100 text-cyan-700",
    secondary: "bg-purple-100 text-purple-700"
  };
  
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
// Simple Rupee icon renderer (uses Unicode symbol). We keep it local to avoid extra dependency.
function Rupee({ className = '' }) {
  // ensure the rupee symbol aligns visually similar to other icons
  return <span className={`${className} inline-block text-[14px] leading-4`} aria-hidden>₹</span>;
}

function Meta({ icon: Icon, label }) {
  // Icon may be:
  // - a React component (function)
  // - a forwardRef/memo component (object with .render)
  // - an already-instantiated React element (object with $$typeof but no .render)
  // - a raw element/node
  let iconNode = null;
  if (Icon == null) {
    iconNode = null;
  } else if (typeof Icon === 'function' || (Icon && Icon.render)) {
    // component type (function or forwardRef/memo object)
    // JSX accepts component types (functions or objects like forwardRef/memo)
    iconNode = <Icon className="w-4 h-4 text-slate-400" />;
  } else {
    // assume it's already a valid element or primitive
    iconNode = Icon;
  }

  return (
    <span className="inline-flex items-center gap-1">
      {iconNode}
      <span>{label}</span>
    </span>
  );
}
