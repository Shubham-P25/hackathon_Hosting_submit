import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getTeamById, updateTeam, getMe, uploadTeamFiles } from '../api';
import { Button } from '../ui/Button';
import { useToast } from '../components/ui/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingPage from '../components/ui/LoadingPage';

export default function TeamPage() {
  const { id } = useParams();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  // editing toggle: start in view mode (false) and allow members to edit
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ projectName: '', problemStatement: '', projectLink: '', isPrivate: false });
  const [user, setUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState({}); // { label: { url, name } }
  const [uploadProgress, setUploadProgress] = useState({});
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getTeamById(id);
  setTeam(data);
  setForm({ projectName: data.projectName || '', problemStatement: data.problemStatement || '', projectLink: data.projectLink || '', isPrivate: data.isPublic === false });
      // initialize uploadedFiles mapping when a fileurl exists
      if (data.fileurl) {
        setUploadedFiles({ Report: { url: data.fileurl, name: data.fileurl.split('/').pop() } });
      }
    } catch (err) {
      console.error('Failed to load team', err);
      addToast('Failed to load team', 'error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    getMe().then(setUser).catch(() => {});
  }, [load]);

  const isMember = user && team && (team.members || []).some((m) => m.id === user.id);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (!isMember) {
        addToast('Only team members can update the team', 'error');
        return;
      }
      // convert isPrivate (form) -> isPublic (backend)
      const payload = {
        projectName: form.projectName,
        problemStatement: form.problemStatement,
        projectLink: form.projectLink,
        isPublic: form.isPrivate ? false : true
      };

      const updated = await updateTeam(id, payload);
      setTeam((t) => ({ ...t, ...updated }));
      // sync form.isPrivate with returned value
      setForm((s) => ({ ...s, isPrivate: updated.isPublic === false }));
      addToast('Team updated', 'success');
      // switch to view mode after saving
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save team', err);
      addToast(err.message || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  

  const handleFileUpload = async (label, file) => {
    if (!file) return null;
    setUploading(true);
    try {
      const fd = new FormData();
      // server expects field name 'file' for attachment
      fd.append('file', file);
      fd.append('label', label);
      const data = await uploadTeamFiles(id, fd);
      if (data && Array.isArray(data.attachments) && data.attachments.length > 0) {
        // assume server returns created attachments; take the last one for this upload
        const att = data.attachments[data.attachments.length - 1];
        setTeam((t) => ({ ...t, attachments: [...(t.attachments || []), att] }));
        setUploadedFiles((prev) => ({ ...prev, [label]: { url: att.url, name: att.filename } }));
      }
      return data;
    } catch (err) {
      console.error('Upload failed', err);
      addToast(err.message || 'Upload failed', 'error');
      return null;
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <LoadingPage message="Loading team..." />;
  if (!team) return <div className="p-6 text-center text-slate-600">Team not found</div>;

  const headerAnim = { initial: { y: 6, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { duration: 0.45 } };
  const listVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } }
  };
  const itemAnim = {
    hidden: { x: -8, opacity: 0, scale: 0.98 },
    show: { x: 0, opacity: 1, scale: 1, transition: { duration: 0.36 } }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 py-12">
      <div className="relative max-w-5xl mx-auto px-6">
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-gradient-to-tr from-pink-50 to-amber-50 opacity-60 blur-3xl transform-gpu pointer-events-none" />

        <motion.header {...headerAnim} className="mb-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">{team.name}</h1>
              <p className="mt-1 text-sm text-slate-600">{team.bio}</p>
            </div>
            <div className="flex items-center gap-3">
              {isMember && (
                <motion.button whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.03 }} onClick={() => setIsEditing(true)} className="px-3 py-2 rounded-md bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-lg hover:shadow-2xl">
                  Edit
                </motion.button>
              )}
              <motion.button whileTap={{ scale: 0.97 }} whileHover={{ x: 4 }} onClick={() => window.scrollTo({ top: 400, behavior: 'smooth' })} className="px-3 py-2 rounded-md bg-white border border-slate-200 text-slate-700 shadow-sm hover:shadow-md">Jump to project</motion.button>
            </div>
          </div>
        </motion.header>

        {/* Members + Project area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.section className="order-2 lg:order-1 lg:col-span-1 bg-white rounded-xl shadow p-4" initial="hidden" animate="show" variants={listVariants}>
            <h3 className="text-sm font-medium text-slate-600">Members</h3>
            <motion.ul className="mt-3 space-y-3" initial="hidden" animate="show" variants={listVariants}>
              {team.members.map((m, i) => (
                <motion.li key={m.id} className="flex items-center gap-3" variants={itemAnim} layout>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-cyan-400 flex items-center justify-center text-white font-semibold shadow">{(m.name || 'U').slice(0,1).toUpperCase()}</div>
                  <div>
                    <div className="text-sm font-medium text-slate-800">{m.name}</div>
                    <div className="text-xs text-slate-400">{m.role || 'Member'}</div>
                  </div>
                </motion.li>
              ))}
            </motion.ul>
          </motion.section>

          <motion.section className="order-1 lg:order-2 lg:col-span-2 bg-white rounded-2xl shadow-lg p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }}>
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-slate-800">Project</h2>

                <AnimatePresence mode="wait">
                {!isEditing ? (
                  <motion.div key="view" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.28 }} className="mt-4">
                    {/* image removed per request; show uploaded file link if available */}
                    {team.fileurl ? (
                      <div className="mt-4 mb-4">
                        <p className="text-sm">Uploaded file: <a className="text-indigo-600" href={team.fileurl} target="_blank" rel="noreferrer">Download</a></p>
                      </div>
                    ) : (
                      <div className="w-full h-44 rounded-lg bg-gradient-to-r from-slate-100 to-slate-50 flex items-center justify-center text-slate-400 mb-4">No file uploaded</div>
                    )}

                    <h3 className="text-xl font-semibold text-slate-900">{team.projectName || 'No project yet'}</h3>
                    <p className="mt-3 text-sm text-slate-600">{team.problemStatement || 'No problem statement provided'}</p>
                    {team.projectLink && <p className="mt-3 text-sm">Link: <a className="text-indigo-600" href={team.projectLink} target="_blank" rel="noreferrer">{team.projectLink}</a></p>}
                  </motion.div>
                ) : (
                  <motion.form key="edit" onSubmit={handleSave} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.28 }} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium">Project name</label>
                      <input value={form.projectName} onChange={(e) => setForm((s) => ({ ...s, projectName: e.target.value }))} className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium">Problem statement</label>
                      <textarea value={form.problemStatement} onChange={(e) => setForm((s) => ({ ...s, problemStatement: e.target.value }))} className="w-full border rounded px-3 py-2" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium">Project link</label>
                      <input value={form.projectLink} onChange={(e) => setForm((s) => ({ ...s, projectLink: e.target.value }))} className="w-full border rounded px-3 py-2" />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium">Upload Report / PPT / Papers</label>
                      <div className="flex flex-col gap-2">
                        {['Report', 'PPT', 'Research Papers'].map((label) => (
                          <div key={label} className="flex items-center gap-3">
                            <label className="inline-flex items-center gap-2 cursor-pointer px-3 py-2 rounded-md bg-slate-50 border border-slate-100 hover:bg-slate-100">
                              <input type="file" className="hidden" onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setUploadProgress((p) => ({ ...p, [label]: 0 }));
                                // optimistic progress demo (real progress requires xhr)
                                const progInterval = setInterval(() => {
                                  setUploadProgress((p) => ({ ...p, [label]: Math.min(95, (p[label] || 0) + Math.floor(Math.random() * 20)) }));
                                }, 300);
                                const res = await handleFileUpload(label, file);
                                clearInterval(progInterval);
                                setUploadProgress((p) => ({ ...p, [label]: 100 }));
                                setTimeout(() => setUploadProgress((p) => ({ ...p, [label]: undefined })), 700);
                                if (res && res.attachments) {
                                  addToast(`${label} uploaded`, 'success');
                                }
                              }}>
                              </input>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 12v9m0-9l-3 3m3-3l3 3M16 7l-4-4-4 4" />
                              </svg>
                              <span className="text-sm text-slate-700">{label}</span>
                            </label>
                            {uploadedFiles[label] && (
                              <a className="text-sm text-indigo-600" href={uploadedFiles[label].url} target="_blank" rel="noreferrer">{uploadedFiles[label].name}</a>
                            )}
                            {uploadProgress[label] != null && (
                              <div className="w-28 bg-slate-100 rounded overflow-hidden">
                                <div className="h-1 bg-indigo-500" style={{ width: `${uploadProgress[label]}%` }} />
                              </div>
                            )}
                            <span className="text-sm text-gray-500">&nbsp;</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-3 text-sm">
                        <input type="checkbox" checked={!!form.isPrivate} onChange={(e) => setForm((s) => ({ ...s, isPrivate: e.target.checked }))} />
                        <span className="ml-2">Make it Private</span>
                      </label>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button type="submit" disabled={saving || uploading} className="bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-lg hover:scale-[1.02]">{saving ? 'Saving...' : 'Save'}</Button>
                      <Button type="button" variant="secondary" onClick={() => { setIsEditing(false); setForm({ projectName: team.projectName || '', problemStatement: team.problemStatement || '', projectLink: team.projectLink || '', isPrivate: team.isPublic === false }); addToast('Edits discarded', 'info'); }} disabled={saving || uploading}>{saving ? '...' : 'Cancel'}</Button>
                    </div>
                  </motion.form>
                )}
                </AnimatePresence>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
