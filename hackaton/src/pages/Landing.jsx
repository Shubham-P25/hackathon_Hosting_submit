
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { Button } from '../ui/Button';
import { motion } from "framer-motion";

export default function Landing() {
  const user = useSelector(state => state.user.user);

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-white via-blue-100 to-pink-100 relative overflow-hidden">
            {/* Decorative shapes */}
            <motion.div initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 0.3, scale: 1 }} transition={{ duration: 1 }} className="absolute top-0 left-0 w-96 h-96 bg-blue-200 rounded-full blur-3xl z-0" />
            <motion.div initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 0.2, scale: 1 }} transition={{ duration: 1.2 }} className="absolute bottom-0 right-0 w-80 h-80 bg-pink-200 rounded-full blur-3xl z-0" />
            <motion.div initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 0.15, scale: 1 }} transition={{ duration: 1.4 }} className="absolute top-1/2 left-1/2 w-72 h-72 bg-purple-200 rounded-full blur-3xl z-0" />

            {/* Main Content Card - wider and with top margin */}
            <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="relative z-10 w-full max-w-5xl mx-auto px-12 py-20 mt-12 mb-12 bg-white/80 rounded-3xl shadow-2xl backdrop-blur-lg flex flex-col items-center">
                <motion.h1 initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-6 drop-shadow-lg text-center">SubmitIt</motion.h1>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.7 }} className="mt-2 text-gray-700 text-lg max-w-2xl text-center">Join, host and manage hackathons — submit projects, review entries and discover opportunities.</motion.p>

                {/* CTA Buttons */}
                <div className="mt-10 flex gap-6">
                    <motion.div whileHover={{ scale: 1.08 }}>
                        <Link to="/host/dashboard" className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 text-blue-900 px-7 py-3 rounded-xl font-bold shadow-lg hover:scale-105 transition">Create hackathons</Link>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.08 }}>
                        <Link to="/user/dashboard" className="inline-flex items-center gap-2 border border-blue-200 px-7 py-3 rounded-xl font-bold shadow-lg text-purple-900 bg-white/70 hover:bg-blue-50 transition">Browse hackathons</Link>
                    </motion.div>
                </div>

                                {/* Steps to Host/Join Hackathons with cool animation and distinct backgrounds */}
                                <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-10 w-full">
                                    {/* Host Steps */}
                                    <motion.div initial={{ opacity: 0, x: -60 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.7 }} whileHover={{ scale: 1.04, rotate: -2 }} className="bg-gradient-to-br from-blue-100 via-white to-purple-100 p-8 rounded-2xl shadow-2xl flex flex-col items-center text-center border border-blue-200">
                                        <div className="text-5xl mb-2 animate-bounce">🎉</div>
                                        <div className="font-bold text-xl mb-3 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Host a Hackathon</div>
                                        <ul className="text-gray-700 text-base space-y-3 text-left mt-2">
                                            <li className="flex items-center gap-2"><span className="font-semibold text-blue-400">1.</span> <span className="animate-fade-in">Create your event with details and rules</span></li>
                                            <li className="flex items-center gap-2"><span className="font-semibold text-blue-400">2.</span> <span className="animate-fade-in">Set up registration and team options</span></li>
                                            <li className="flex items-center gap-2"><span className="font-semibold text-blue-400">3.</span> <span className="animate-fade-in">Launch and manage submissions</span></li>
                                            <li className="flex items-center gap-2"><span className="font-semibold text-blue-400">4.</span> <span className="animate-fade-in">Review entries and announce winners</span></li>
                                        </ul>
                                    </motion.div>
                                    {/* Judging Card - new distinct card */}
                                    <motion.div initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 0.7 }} whileHover={{ scale: 1.07, rotate: 2 }} className="bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 p-8 rounded-2xl shadow-2xl flex flex-col items-center text-center border border-purple-200">
                                        <div className="text-5xl mb-2 animate-spin-slow">🧑‍⚖️</div>
                                        <div className="font-bold text-xl mb-3 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">Judging & Results</div>
                                        <div className="text-gray-700 text-base mt-2 animate-fade-in">Automated scoring, fair reviews, and instant results for all participants. Experience transparent judging with real-time feedback!</div>
                                    </motion.div>
                                    {/* Join Steps */}
                                    <motion.div initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4, duration: 0.7 }} whileHover={{ scale: 1.04, rotate: 2 }} className="bg-gradient-to-br from-pink-100 via-white to-blue-100 p-8 rounded-2xl shadow-2xl flex flex-col items-center text-center border border-pink-200">
                                        <div className="text-5xl mb-2 animate-bounce">🤝</div>
                                        <div className="font-bold text-xl mb-3 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400">Join a Hackathon</div>
                                        <ul className="text-gray-700 text-base space-y-3 text-left mt-2">
                                            <li className="flex items-center gap-2"><span className="font-semibold text-pink-400">1.</span> <span className="animate-fade-in">Browse and select a hackathon</span></li>
                                            <li className="flex items-center gap-2"><span className="font-semibold text-pink-400">2.</span> <span className="animate-fade-in">Register solo or with a team</span></li>
                                            <li className="flex items-center gap-2"><span className="font-semibold text-pink-400">3.</span> <span className="animate-fade-in">Submit your project before deadline</span></li>
                                            <li className="flex items-center gap-2"><span className="font-semibold text-pink-400">4.</span> <span className="animate-fade-in">Track results and feedback</span></li>
                                        </ul>
                                    </motion.div>
                                </div>

                {/* Search Hackathons Button */}
                <motion.div whileHover={{ scale: 1.07 }} className="mt-14">
                    <Link to="/hackathons" className="inline-block px-10 py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 text-blue-900 shadow-xl hover:scale-105 transition">Search Hackathons</Link>
                </motion.div>

                {/* Animated Upcoming Hackathons Card */}
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.7 }} className="mt-16 w-full">
                    <div className="bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 p-8 rounded-2xl shadow-xl backdrop-blur-md">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Upcoming Hackathons</h3>
                                <p className="text-sm text-blue-400/80">Handpicked for you</p>
                            </div>
                            <div className="text-sm text-pink-400 animate-pulse">Live</div>
                        </div>
                        <ul className="mt-4 space-y-4">
                            {[
                                { name: "AI Builder Hack", date: "Sep 18 · 48h", prize: "$10k" },
                                { name: "Fintech Sprint", date: "Oct 1 · 72h", prize: "$8k" },
                                { name: "Web3 Jam", date: "Oct 10 · 24h", prize: "$5k" }
                            ].map((h, i) => (
                                <motion.li key={h.name} whileHover={{ scale: 1.04, backgroundColor: "#f3e8ff" }} className="p-5 bg-white/80 rounded-xl flex items-center justify-between shadow-lg transition border border-blue-100">
                                    <div>
                                        <div className="font-semibold text-lg text-blue-700">{h.name}</div>
                                        <div className="text-xs text-purple-400/70">{h.date}</div>
                                    </div>
                                    <div className="font-bold text-pink-400 text-lg">{h.prize}</div>
                                </motion.li>
                            ))}
                        </ul>
                    </div>
                </motion.div>

                                {/* Steps Mapping UI for Hosting and Joining Hackathons */}
                                <div className="mt-20 w-full grid grid-cols-1 md:grid-cols-2 gap-10">
                                    {/* Host Steps Card with animated pirate-map lines */}
                                    <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.7 }} className="bg-gradient-to-br from-blue-100 via-white to-purple-100 p-8 rounded-2xl shadow-2xl border border-blue-200 flex flex-col gap-6 relative">
                                        <div className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">How to Host a Hackathon</div>
                                        {[
                                            { label: "Step 1", title: "Create Event", desc: "Set up your hackathon details and rules." },
                                            { label: "Step 2", title: "Enable Teams", desc: "Allow team registration and collaboration." },
                                            { label: "Step 3", title: "Launch", desc: "Open registrations and start accepting entries." },
                                            { label: "Step 4", title: "Review", desc: "Evaluate submissions and shortlist winners." },
                                            { label: "Step 5", title: "Announce", desc: "Publish results and celebrate winners!" }
                                        ].map((step, i, arr) => (
                                            <div key={step.label} className="relative">
                                                <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }} className={`flex items-center gap-4 bg-white/80 p-4 rounded-xl shadow-lg ${i % 2 === 0 ? 'mr-48' : 'ml-48'}`}>
                                                    <div className="flex flex-col items-center">
                                                        <div className="font-bold text-blue-500">{step.label}</div>
                                                        <div className="font-semibold text-lg">{step.title}</div>
                                                        <div className="text-xs text-gray-600">{step.desc}</div>
                                                    </div>
                                                </motion.div>
                                                {/* Classic horizontal dashed SVG line to next step */}
                                                {i < arr.length - 1 && (
                                                    <motion.svg initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 + i * 0.1, duration: 0.7 }}
                                                        className="absolute left-0 right-0 mx-auto top-full" width="100" height="12" viewBox="0 0 100 12" fill="none" style={{ zIndex: 1 }}>
                                                        <motion.line
                                                            x1="0" y1="6" x2="100" y2="6"
                                                            stroke="#60A5FA"
                                                            strokeWidth="3"
                                                            strokeDasharray="16 10"
                                                            initial={{ pathLength: 0 }}
                                                            animate={{ pathLength: 1 }}
                                                            transition={{ duration: 1.2, delay: 0.5 + i * 0.1 }}
                                                        />
                                                    </motion.svg>
                                                )}
                                            </div>
                                        ))}
                                    </motion.div>
                                    {/* Join Steps Card with animated pirate-map lines */}
                                    <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.7 }} className="bg-gradient-to-br from-pink-100 via-white to-blue-100 p-8 rounded-2xl shadow-2xl border border-pink-200 flex flex-col gap-6 relative">
                                        <div className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400">How to Join a Hackathon</div>
                                        {[
                                            { label: "Step 1", title: "Find Event", desc: "Browse and select a hackathon." },
                                            { label: "Step 2", title: "Register", desc: "Sign up solo or with a team." },
                                            { label: "Step 3", title: "Build", desc: "Work on your project and collaborate." },
                                            { label: "Step 4", title: "Submit", desc: "Upload your project before the deadline." },
                                            { label: "Step 5", title: "Celebrate", desc: "See results and celebrate your achievements!" }
                                        ].map((step, i, arr) => (
                                            <div key={step.label} className="relative">
                                                <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }} className={`flex items-center gap-4 bg-white/80 p-4 rounded-xl shadow-lg ${i % 2 === 1 ? 'mr-48' : 'ml-48'}`}>
                                                    <div className="flex flex-col items-center">
                                                        <div className="font-bold text-pink-500">{step.label}</div>
                                                        <div className="font-semibold text-lg">{step.title}</div>
                                                        <div className="text-xs text-gray-600">{step.desc}</div>
                                                    </div>
                                                </motion.div>
                                                {/* Classic horizontal dashed SVG line to next step */}
                                                {i < arr.length - 1 && (
                                                    <motion.svg initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 + i * 0.1, duration: 0.7 }}
                                                        className="absolute left-0 right-0 mx-auto top-full" width="100" height="12" viewBox="0 0 100 12" fill="none" style={{ zIndex: 1 }}>
                                                        <motion.line
                                                            x1="0" y1="6" x2="100" y2="6"
                                                            stroke="#F472B6"
                                                            strokeWidth="3"
                                                            strokeDasharray="16 10"
                                                            initial={{ pathLength: 0 }}
                                                            animate={{ pathLength: 1 }}
                                                            transition={{ duration: 1.2, delay: 0.5 + i * 0.1 }}
                                                        />
                                                    </motion.svg>
                                                )}
                                            </div>
                                        ))}
                                    </motion.div>
                                </div>
            </motion.div>
        </div>
    );
}
