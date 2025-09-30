import { useState } from 'react';

export function HackathonCard({ hackathon }) {
  const [showDetails, setShowDetails] = useState(false);

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
        </motion.div>
      </div>
    </motion.div>
  );
}