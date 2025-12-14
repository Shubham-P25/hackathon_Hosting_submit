import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  Calendar,
  CalendarClock,
  Globe,
  HelpCircle,
  ImageIcon,
  Info,
  Loader2,
  MapPin,
  MessageSquare,
  Plus,
  Sparkles,
  Trash2,
  Trophy,
  UploadCloud,
  Users,
} from "lucide-react";
import { Button } from "../ui/Button";
import { Skeleton } from "../ui/Skeleton";
import { useToast } from "../components/ui/Toast";
import { getHackathonById, updateHackathon, uploadHackathonImages, getTeamsForHackathon } from "../api";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "rules", label: "Rules" },
  { id: "criteria", label: "Criteria" },
  { id: "timeline", label: "Timeline" },
  { id: "rounds", label: "Rounds" },
  { id: "prizes", label: "Prizes" },
  { id: "gallery", label: "Gallery" },
  { id: "faqs", label: "FAQs" },
  { id: "updates", label: "Updates" },
  { id: "skills", label: "Skills" },
  { id: "support", label: "Support" },
  { id: "teams", label: "Teams" },
];

const EMPTY_TIMELINE = { phase: "", date: "", description: "" };
const EMPTY_ROUND = { name: "", description: "" };
const EMPTY_PRIZE = { type: "", amount: "", details: "" };
const EMPTY_FAQ = { question: "", answer: "" };

const fieldStack = "space-y-2";
const labelTone = "text-xs font-semibold uppercase tracking-wide text-slate-500";
const inputTone =
  "w-full rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300";
const textareaTone =
  "w-full rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300";

const toDateInputValue = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 16);
};

const coerceArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") return Object.values(value);
  if (typeof value === "string" && value.trim()) return [value];
  return [];
};

const ensureStringList = (value) => {
  const list = coerceArray(value).map((item) => (typeof item === "string" ? item : item ?? ""));
  return list.length ? list : [];
};

const ensureObjectList = (value, shape) => {
  const list = coerceArray(value)
    .map((item) => (item && typeof item === "object" ? { ...shape, ...item } : { ...shape }))
    .filter((item) => Object.values(item).some((x) => `${x}`.trim().length));
  return list.length ? list : [{ ...shape }];
};

const buildFormState = (hackathon) => ({
  posterUrl: hackathon?.poster ?? "",
  bannerUrl: hackathon?.banner ?? "",
  gallery: ensureStringList(hackathon?.gallery || hackathon?.galleryUrl),
  title: hackathon?.title ?? "",
  description: hackathon?.description ?? "",
  overview: hackathon?.overview ?? hackathon?.description ?? "",
  domain: hackathon?.domain ?? "",
  mode: hackathon?.mode ?? "ONLINE",
  location: hackathon?.location ?? "",
  startDate: toDateInputValue(hackathon?.startDate),
  endDate: toDateInputValue(hackathon?.endDate),
  teamSize: hackathon?.teamSize ? String(hackathon.teamSize) : "",
  Ispaid: Boolean(hackathon?.Ispaid),
  rules: ensureStringList(hackathon?.rules),
  criteria: typeof hackathon?.criteria === "string" ? hackathon.criteria : JSON.stringify(hackathon?.criteria ?? ""),
  skillsRequired: ensureStringList(hackathon?.skillsRequired),
  timeline: ensureObjectList(hackathon?.timeline, EMPTY_TIMELINE),
  rounds: ensureObjectList(hackathon?.rounds, EMPTY_ROUND),
  prizes: ensureObjectList(hackathon?.prizes, EMPTY_PRIZE),
  faqs: ensureObjectList(hackathon?.faqs, EMPTY_FAQ),
  updates: ensureStringList(hackathon?.updates),
  helpContact: ensureStringList(hackathon?.helpContact),
});

const cleanStringList = (items) =>
  (items || [])
    .map((item) => (item ?? "").trim())
    .filter((value) => value.length);

const cleanObjectList = (items, keys) =>
  (items || [])
    .map((item) => {
      const next = keys.reduce(
        (acc, key) => ({
          ...acc,
          [key]: (item?.[key] ?? "").trim(),
        }),
        {}
      );
      return keys.some((key) => next[key].length) ? next : null;
    })
    .filter(Boolean);

const Section = ({ icon: Icon, title, description, children }) => (
  <section className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-sm">
    <div className="mb-3 flex items-center gap-3">
      {Icon ? <Icon className="h-5 w-5 text-indigo-500" /> : null}
      <div>
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
        {description ? <p className="text-sm text-slate-500">{description}</p> : null}
      </div>
    </div>
    <div className="space-y-4">{children}</div>
  </section>
);

const EmptyHint = ({ children }) => (
  <p className="text-xs text-slate-400 italic">{children}</p>
);

const ListActionButton = ({ icon: Icon, label, onClick, tone = "indigo" }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium transition-colors ${
      tone === "red"
        ? "border-rose-200 text-rose-600 hover:bg-rose-50"
        : "border-indigo-200 text-indigo-600 hover:bg-indigo-50"
    }`}
  >
    {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
    {label}
  </button>
);

const ListRow = ({ children }) => (
  <div className="flex flex-col gap-2 rounded-xl border border-slate-200/70 bg-white/80 p-4 shadow-sm sm:flex-row sm:items-center">
    {children}
  </div>
);

const formatDateTime = (value) => {
  if (!value) return "TBA";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "TBA";
  return parsed.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const parseList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && typeof parsed === "object") return [parsed];
    } catch (err) {
      return value
        .split(/\r?\n+/)
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [value];
  }
  if (typeof value === "object") {
    const items = Object.values(value);
    return Array.isArray(items) ? items : [value];
  }
  return [];
};

const parseObjectList = (value) =>
  parseList(value).filter((item) => item && typeof item === "object");

export default function EditHackathon() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [editTab, setEditTab] = useState(TABS[0].id);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [previewTab, setPreviewTab] = useState(TABS[0].id);
  const [uploading, setUploading] = useState({ banner: false, poster: false, gallery: false });
  const [participantsCount, setParticipantsCount] = useState(0);
  const [teams, setTeams] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(false);

  const fetchHackathon = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getHackathonById(id);
      if (!data || data.error) {
        throw new Error(data?.message || data?.error || "Unable to load hackathon");
      }
      const nextState = buildFormState(data);
      setForm(nextState);
      setSnapshot(nextState);
      const registrations = Array.isArray(data?.registrations) ? data.registrations : [];
      const participants = typeof data?.participantsCount === "number" ? data.participantsCount : registrations.length;
      setParticipantsCount(participants);
    } catch (err) {
      console.error("Failed to load hackathon", err);
      setError(err.message || "Failed to load hackathon");
      addToast(err.message || "Failed to load hackathon", "error");
    } finally {
      setLoading(false);
    }
  }, [id, addToast]);

  useEffect(() => {
    fetchHackathon();
  }, [fetchHackathon]);

  // Load teams for the hackathon when the Teams tab is active
  useEffect(() => {
    let mounted = true;
    const loadTeams = async () => {
      if (editTab !== "teams" || !id) return;
      setTeamsLoading(true);
      try {
        const res = await getTeamsForHackathon(id);
        if (!mounted) return;
        setTeams(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error("Failed to load teams for hackathon", err);
        if (mounted) setTeams([]);
      } finally {
        if (mounted) setTeamsLoading(false);
      }
    };
    loadTeams();
    return () => {
      mounted = false;
    };
  }, [editTab, id]);

  const handleFieldChange = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleStringListChange = useCallback((field, index, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item)),
    }));
  }, []);

  const addListItem = useCallback((field, value = "") => {
    setForm((prev) => ({ ...prev, [field]: [...prev[field], value] }));
  }, []);

  const removeListItem = useCallback((field, index) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  }, []);

  const handleObjectListChange = useCallback((field, index, key, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    }));
  }, []);

  const addObjectItem = useCallback((field, template) => {
    setForm((prev) => ({ ...prev, [field]: [...prev[field], template] }));
  }, []);

  const removeObjectItem = useCallback((field, index) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  }, []);

  const handleBannerUpload = useCallback(
    async (file) => {
      if (!file) return;
      setUploading((prev) => ({ ...prev, banner: true }));
      try {
        const formData = new FormData();
        formData.append("banner", file);
        const response = await uploadHackathonImages(formData);
        if (!response || response.success === false || response.error) {
          throw new Error(response?.message || response?.error || "Failed to upload banner");
        }
        const nextUrl = response?.data?.banner || response?.banner;
        if (nextUrl) {
          setForm((prev) => ({ ...prev, bannerUrl: nextUrl }));
        }
        addToast("Banner updated", "success");
      } catch (err) {
        console.error("Banner upload failed", err);
        addToast(err.message || "Failed to upload banner", "error");
      } finally {
        setUploading((prev) => ({ ...prev, banner: false }));
      }
    },
    [addToast]
  );

  const handlePosterUpload = useCallback(
    async (file) => {
      if (!file) return;
      setUploading((prev) => ({ ...prev, poster: true }));
      try {
        const formData = new FormData();
        formData.append("poster", file);
        const response = await uploadHackathonImages(formData);
        if (!response || response.success === false || response.error) {
          throw new Error(response?.message || response?.error || "Failed to upload poster");
        }
        const nextUrl = response?.data?.poster || response?.poster;
        if (nextUrl) {
          setForm((prev) => ({ ...prev, posterUrl: nextUrl }));
        }
        addToast("Poster updated", "success");
      } catch (err) {
        console.error("Poster upload failed", err);
        addToast(err.message || "Failed to upload poster", "error");
      } finally {
        setUploading((prev) => ({ ...prev, poster: false }));
      }
    },
    [addToast]
  );

  const handleGalleryUpload = useCallback(
    async (files, options = {}) => {
      const fileArray = Array.from(files || []).filter(Boolean);
      if (!fileArray.length) return;
      setUploading((prev) => ({ ...prev, gallery: true }));
      try {
        const formData = new FormData();
        fileArray.forEach((file) => formData.append("gallery", file));
        const response = await uploadHackathonImages(formData);
        if (!response || response.success === false || response.error) {
          throw new Error(response?.message || response?.error || "Failed to upload gallery images");
        }
        const urls = response?.data?.gallery || response?.gallery || [];
        if (!urls.length) {
          throw new Error("Upload succeeded but no image URLs were returned");
        }
        setForm((prev) => {
          if (!prev) return prev;
          if (typeof options.index === "number") {
            const nextGallery = [...prev.gallery];
            nextGallery[options.index] = urls[0] || nextGallery[options.index];
            return { ...prev, gallery: nextGallery };
          }
          return { ...prev, gallery: [...prev.gallery, ...urls] };
        });
        addToast("Gallery updated", "success");
      } catch (err) {
        console.error("Gallery upload failed", err);
        addToast(err.message || "Failed to upload gallery images", "error");
      } finally {
        setUploading((prev) => ({ ...prev, gallery: false }));
      }
    },
    [addToast]
  );

  const isDirty = useMemo(() => {
    if (!snapshot || !form) return false;
    return JSON.stringify(snapshot) !== JSON.stringify(form);
  }, [snapshot, form]);

  const resetChanges = useCallback(() => {
    if (snapshot) setForm(snapshot);
  }, [snapshot]);

  const buildPayload = useCallback(() => {
    if (!form) return null;

    const startIso = form.startDate ? new Date(form.startDate).toISOString() : null;
    const endIso = form.endDate ? new Date(form.endDate).toISOString() : null;

    if (startIso && endIso && new Date(endIso) <= new Date(startIso)) {
      throw new Error("End date must be after the start date");
    }

    let criteriaValue = form.criteria;
    try {
      const parsed = JSON.parse(form.criteria);
      criteriaValue = parsed;
    } catch (err) {
      criteriaValue = form.criteria.trim();
    }

    return {
      title: form.title.trim(),
      description: form.description.trim(),
      overview: form.overview.trim(),
      domain: form.domain.trim(),
      mode: form.mode,
      location: form.location.trim() || null,
      startDate: startIso,
      endDate: endIso,
      teamSize: form.teamSize ? parseInt(form.teamSize, 10) : null,
      Ispaid: Boolean(form.Ispaid),
      rules: cleanStringList(form.rules),
      criteria: criteriaValue,
      skillsRequired: cleanStringList(form.skillsRequired),
      timeline: cleanObjectList(form.timeline, ["phase", "date", "description"]),
      rounds: cleanObjectList(form.rounds, ["name", "description"]),
      prizes: cleanObjectList(form.prizes, ["type", "amount", "details"]),
      faqs: cleanObjectList(form.faqs, ["question", "answer"]),
      updates: cleanStringList(form.updates),
      helpContact: cleanStringList(form.helpContact),
      posterUrl: form.posterUrl.trim() || null,
      bannerUrl: form.bannerUrl.trim() || null,
      galleryUrl: cleanStringList(form.gallery),
    };
  }, [form]);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (!id || !form) return;

      try {
        setSaving(true);
        const payload = buildPayload();
        if (!payload) return;

        const response = await updateHackathon(id, payload);
        if (!response || response.error) {
          throw new Error(response?.message || response?.error || "Failed to update hackathon");
        }

        const nextState = buildFormState(response);
        setForm(nextState);
        setSnapshot(nextState);
        const responseRegistrations = Array.isArray(response?.registrations) ? response.registrations : [];
        if (typeof response?.participantsCount === "number" || responseRegistrations.length) {
          const updatedParticipants = typeof response?.participantsCount === "number" ? response.participantsCount : responseRegistrations.length;
          setParticipantsCount(updatedParticipants);
        }
        addToast("Hackathon updated successfully", "success");
      } catch (err) {
        console.error("Failed to save hackathon", err);
        addToast(err.message || "Failed to update hackathon", "error");
      } finally {
        setSaving(false);
      }
    },
    [id, form, buildPayload, addToast]
  );

  const statusInfo = useMemo(() => {
    const source = form || snapshot;
    if (!source) {
      return {
        label: "Draft",
        tone: "bg-slate-100 text-slate-600",
      };
    }
    const now = new Date();
    const start = source.startDate ? new Date(source.startDate) : null;
    const end = source.endDate ? new Date(source.endDate) : null;

    if (end && now > end) {
      return {
        label: "Completed",
        tone: "bg-emerald-100 text-emerald-700",
      };
    }
    if (start && now < start) {
      return {
        label: "Upcoming",
        tone: "bg-amber-100 text-amber-700",
      };
    }
    if (start && (!end || now <= end)) {
      return {
        label: "Ongoing",
        tone: "bg-indigo-100 text-indigo-700",
      };
    }
    return {
      label: "Draft",
      tone: "bg-slate-100 text-slate-600",
    };
  }, [form, snapshot]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-10">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-8 w-96" />
        <Skeleton className="h-96 w-full rounded-3xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-16 text-center">
        <h2 className="text-2xl font-semibold text-slate-800">Something went wrong</h2>
        <p className="text-slate-500">{error}</p>
        <Button variant="primary" onClick={fetchHackathon}>
          Try again
        </Button>
      </div>
    );
  }

  if (!form) {
    return null;
  }

  const previewData = snapshot || form;
  const previewBanner = previewData?.bannerUrl || previewData?.banner || "";
  const previewPoster = previewData?.posterUrl || previewData?.poster || "";
  const previewGallery = parseList(previewData?.gallery || previewData?.galleryUrl);
  const previewRules = parseList(previewData?.rules);
  const previewCriteria = parseList(previewData?.criteria);
  const previewTimeline = parseObjectList(previewData?.timeline);
  const previewRounds = parseObjectList(previewData?.rounds);
  const previewPrizes = parseObjectList(previewData?.prizes);
  const previewFaqs = parseObjectList(previewData?.faqs);
  const previewUpdates = parseList(previewData?.updates);
  const previewSkills = parseList(previewData?.skillsRequired);
  const previewSupport = parseList(previewData?.helpContact);
  const participantLabel = participantsCount === 1 ? "Participant" : "Participants";

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-[#f0fdfa] via-[#f8fafc] to-[#e0e7ff] px-3 py-10 sm:px-6 lg:px-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.section
        className="mx-auto mt-6 w-full max-w-7xl overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br from-indigo-300 via-purple-200 to-cyan-300 p-8 text-white shadow-2xl"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/60">Hackathon Insights</p>
            <h2 className="text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
              {previewData.title || "Untitled Hackathon"}
            </h2>
            <p className="text-sm text-white/80 sm:text-base">
              {previewData.description || previewData.overview || "Fine-tune every detail before sharing it with participants."}
            </p>
            <div className="flex flex-wrap gap-3 text-xs font-medium text-white/80">
              {previewData.mode ? (
                <span className="rounded-full bg-white/15 px-3 py-1">Mode: {previewData.mode}</span>
              ) : null}
              {previewData.location ? (
                <span className="rounded-full bg-white/15 px-3 py-1">Location: {previewData.location}</span>
              ) : null}
              {previewData.domain ? (
                <span className="rounded-full bg-white/15 px-3 py-1">Domain: {previewData.domain}</span>
              ) : null}
            </div>
          </div>
          <div className="flex w-full max-w-md flex-col gap-4 sm:max-w-sm">
            <div className="flex flex-wrap items-center justify-end gap-2">
              {isEditing ? (
                <>
                  <Button variant="ghost" type="button" disabled={!isDirty || saving} onClick={resetChanges}>
                    Reset
                  </Button>
                  <Button
                    variant="secondary"
                    type="button"
                    disabled={saving}
                    onClick={() => {
                      if (snapshot) {
                        setForm(snapshot);
                      }
                      setEditTab(TABS[0].id);
                      setPreviewTab(TABS[0].id);
                      setIsEditing(false);
                    }}
                  >
                    Preview
                  </Button>
                  <Button
                    type="submit"
                    form="edit-hackathon-form"
                    variant="primary"
                    isLoading={saving}
                    disabled={saving || !isDirty}
                  >
                    {saving ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Saving
                      </span>
                    ) : (
                      "Save changes"
                    )}
                  </Button>
                </>
              ) : (
                <Button
                  variant="primary"
                  type="button"
                  onClick={() => {
                    if (snapshot) {
                      setForm(snapshot);
                    }
                    setEditTab(TABS[0].id);
                    setIsEditing(true);
                  }}
                >
                  Edit content
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-white/15 p-4 text-center shadow-lg backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-white/70">Participants</p>
                <p className="mt-2 text-3xl font-bold sm:text-4xl">{participantsCount}</p>
                <p className="text-xs text-white/70">{participantLabel}</p>
              </div>
              <div className="rounded-2xl bg-white/15 p-4 text-center shadow-lg backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-white/70">Status</p>
                <p className="mt-2 text-sm font-semibold sm:text-base">{statusInfo.label}</p>
                <p className="text-xs text-white/70">{formatDateTime(form.startDate)} → {formatDateTime(form.endDate)}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {isEditing ? (
        <motion.form
          id="edit-hackathon-form"
          onSubmit={handleSubmit}
          className="mx-auto mt-8 flex max-w-7xl flex-col gap-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/70 shadow-xl">
            {form.bannerUrl ? (
              <img src={form.bannerUrl} alt="Hackathon banner" className="h-64 w-full object-cover" />
            ) : (
              <div className="flex h-64 w-full items-center justify-center bg-slate-100 text-slate-400">
                Banner preview
              </div>
            )}
            <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-white/60 bg-white/80 p-3 shadow-lg backdrop-blur">
              <p className={labelTone}>Banner image</p>
              <label className="mt-1 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-600 shadow-sm transition hover:bg-indigo-100">
                <UploadCloud className="h-4 w-4" />
                <span>{uploading.banner ? "Uploading..." : "Upload new banner"}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    await handleBannerUpload(file);
                    if (event.target.value) {
                      event.target.value = "";
                    }
                  }}
                />
              </label>
              <p className="mt-1 text-[11px] text-slate-400">PNG, JPG, or JPEG up to 5MB.</p>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <motion.aside
              className="space-y-6 rounded-3xl border border-white/70 bg-gradient-to-br from-white/85 via-indigo-100/40 to-cyan-100/40 p-6 shadow-2xl"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="space-y-3">
                {form.posterUrl ? (
                  <img src={form.posterUrl} alt={form.title || "Poster preview"} className="h-64 w-full rounded-2xl object-cover shadow" />
                ) : (
                  <div className="flex h-64 w-full items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/70 text-slate-400">
                    Poster preview
                  </div>
                )}
                <div className={fieldStack}>
                  <span className={labelTone}>Poster image</span>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-600 shadow-sm transition hover:bg-indigo-50">
                    <UploadCloud className="h-4 w-4" />
                    <span>{uploading.poster ? "Uploading..." : "Upload new poster"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        await handlePosterUpload(file);
                        if (event.target.value) {
                          event.target.value = "";
                        }
                      }}
                    />
                  </label>
                  <p className="text-[11px] text-slate-400">We recommend 800x1200px for best results.</p>
                </div>
              </div>

              <div className={fieldStack}>
                <label className={labelTone}>Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(event) => handleFieldChange("title", event.target.value)}
                  className={inputTone}
                  placeholder="Hackathon title"
                />
              </div>

              <div className={fieldStack}>
                <label className={labelTone}>Short Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(event) => handleFieldChange("description", event.target.value)}
                  className={textareaTone}
                  placeholder="Describe the hackathon in a sentence or two"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className={fieldStack}>
                  <label className={labelTone}>Domain</label>
                  <input
                    type="text"
                    value={form.domain}
                    onChange={(event) => handleFieldChange("domain", event.target.value)}
                    className={inputTone}
                    placeholder="e.g. AI, Web3"
                  />
                </div>
                <div className={fieldStack}>
                  <label className={labelTone}>Mode</label>
                  <select
                    value={form.mode}
                    onChange={(event) => handleFieldChange("mode", event.target.value)}
                    className={inputTone}
                  >
                    <option value="ONLINE">Online</option>
                    <option value="OFFLINE">Offline</option>
                    <option value="HYBRID">Hybrid</option>
                  </select>
                </div>
                <div className={fieldStack}>
                  <label className={labelTone}>Start date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="datetime-local"
                      value={form.startDate}
                      onChange={(event) => handleFieldChange("startDate", event.target.value)}
                      className={`${inputTone} pl-9`}
                    />
                  </div>
                </div>
                <div className={fieldStack}>
                  <label className={labelTone}>End date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="datetime-local"
                      value={form.endDate}
                      onChange={(event) => handleFieldChange("endDate", event.target.value)}
                      className={`${inputTone} pl-9`}
                    />
                  </div>
                </div>
                <div className={fieldStack}>
                  <label className={labelTone}>Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={form.location}
                      onChange={(event) => handleFieldChange("location", event.target.value)}
                      className={`${inputTone} pl-9`}
                      placeholder="City, Country"
                    />
                  </div>
                </div>
                <div className={fieldStack}>
                  <label className={labelTone}>Team size</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="number"
                      min={1}
                      value={form.teamSize}
                      onChange={(event) => handleFieldChange("teamSize", event.target.value)}
                      className={`${inputTone} pl-9`}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-white/60 bg-white/80 px-4 py-3">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  <span className="font-medium">Paid event?</span>
                </div>
                <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={form.Ispaid}
                    onChange={(event) => handleFieldChange("Ispaid", event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-300"
                  />
                  Charge participants
                </label>
              </div>

              <div className="rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm text-slate-600">
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-indigo-500" />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
                    <span className={`mt-1 inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.tone}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-slate-400" />
                    <span>{formatDateTime(form.startDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-slate-400" />
                    <span>{formatDateTime(form.endDate)}</span>
                  </div>
                </div>
              </div>
            </motion.aside>

            <motion.div
              className="space-y-6 lg:col-span-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {TABS.map((tabItem) => (
                  <motion.button
                    key={tabItem.id}
                    type="button"
                    onClick={() => setEditTab(tabItem.id)}
                    whileHover={{ scale: 1.03 }}
                    className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-all duration-150 ${
                      editTab === tabItem.id
                        ? "border-indigo-400 bg-gradient-to-r from-indigo-500 to-cyan-400 text-white shadow-lg"
                        : "border-white/70 bg-white/80 text-slate-700 hover:border-indigo-200 hover:text-indigo-600"
                    }`}
                  >
                    {tabItem.label}
                  </motion.button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={editTab}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {editTab === "overview" && (
                    <Section icon={Info} title="Overview" description="Tell participants what makes this hackathon special.">
                      <div className={fieldStack}>
                        <label className={labelTone}>Overview content</label>
                        <textarea
                          rows={6}
                          value={form.overview}
                          onChange={(event) => handleFieldChange("overview", event.target.value)}
                          className={textareaTone}
                          placeholder="Share context, objectives, and any narrative you want participants to read first."
                        />
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Start</span>
                          <p className="text-sm text-slate-600">{formatDateTime(form.startDate)}</p>
                        </div>
                        <div>
                          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">End</span>
                          <p className="text-sm text-slate-600">{formatDateTime(form.endDate)}</p>
                        </div>
                      </div>
                    </Section>
                  )}

                  {editTab === "rules" && (
                    <Section icon={Globe} title="Rules & Guidelines" description="Set expectations for participation and submissions.">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-500">Add concise, actionable rules your participants must follow.</p>
                        <ListActionButton icon={Plus} label="Add rule" onClick={() => addListItem("rules")} />
                      </div>
                      {form.rules.length === 0 ? (
                        <EmptyHint>No rules provided yet.</EmptyHint>
                      ) : (
                        <div className="space-y-3">
                          {form.rules.map((rule, index) => (
                            <ListRow key={`rule-${index}`}>
                              <textarea
                                rows={2}
                                value={rule}
                                onChange={(event) => handleStringListChange("rules", index, event.target.value)}
                                className={`${textareaTone} flex-1`}
                              />
                              <ListActionButton
                                icon={Trash2}
                                label="Remove"
                                tone="red"
                                onClick={() => removeListItem("rules", index)}
                              />
                            </ListRow>
                          ))}
                        </div>
                      )}
                    </Section>
                  )}

                  {editTab === "criteria" && (
                    <Section icon={BadgeCheck} title="Judging Criteria" description="Explain how submissions will be evaluated.">
                      <div className={fieldStack}>
                        <label className={labelTone}>Criteria (accepts plain text or JSON array)</label>
                        <textarea
                          rows={8}
                          value={form.criteria}
                          onChange={(event) => handleFieldChange("criteria", event.target.value)}
                          className={textareaTone}
                          placeholder="Provide a descriptive paragraph or paste a JSON array of criteria objects."
                        />
                      </div>
                    </Section>
                  )}

                  {editTab === "timeline" && (
                    <Section icon={CalendarClock} title="Event Timeline" description="Map every milestone participants should anticipate.">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-500">Add phases such as registrations, submissions, demos, and awards.</p>
                        <ListActionButton icon={Plus} label="Add phase" onClick={() => addObjectItem("timeline", { ...EMPTY_TIMELINE })} />
                      </div>
                      {form.timeline.length === 0 ? (
                        <EmptyHint>No timeline entries yet.</EmptyHint>
                      ) : (
                        <div className="space-y-4">
                          {form.timeline.map((item, index) => (
                            <div key={`timeline-${index}`} className="space-y-4 rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-3">
                                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">
                                    {index + 1}
                                  </span>
                                  <input
                                    type="text"
                                    value={item.phase}
                                    onChange={(event) => handleObjectListChange("timeline", index, "phase", event.target.value)}
                                    placeholder="Phase name"
                                    className={`${inputTone} flex-1`}
                                  />
                                </div>
                                <ListActionButton icon={Trash2} label="Remove" tone="red" onClick={() => removeObjectItem("timeline", index)} />
                              </div>
                              <div className="grid gap-3 sm:grid-cols-2">
                                <div className={fieldStack}>
                                  <label className={labelTone}>Date</label>
                                  <input
                                    type="date"
                                    value={item.date || ""}
                                    onChange={(event) => handleObjectListChange("timeline", index, "date", event.target.value)}
                                    className={inputTone}
                                  />
                                </div>
                                <div className={`${fieldStack} sm:col-span-2`}>
                                  <label className={labelTone}>Description</label>
                                  <textarea
                                    rows={3}
                                    value={item.description}
                                    onChange={(event) => handleObjectListChange("timeline", index, "description", event.target.value)}
                                    className={textareaTone}
                                    placeholder="What happens in this phase?"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </Section>
                  )}

                  {editTab === "rounds" && (
                    <Section icon={Sparkles} title="Competition Rounds" description="Outline the progression of the competition.">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-500">Break down judging rounds or checkpoints.</p>
                        <ListActionButton icon={Plus} label="Add round" onClick={() => addObjectItem("rounds", { ...EMPTY_ROUND })} />
                      </div>
                      {form.rounds.length === 0 ? (
                        <EmptyHint>No rounds defined yet.</EmptyHint>
                      ) : (
                        <div className="space-y-4">
                          {form.rounds.map((item, index) => (
                            <div key={`round-${index}`} className="space-y-3 rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <input
                                  type="text"
                                  value={item.name}
                                  onChange={(event) => handleObjectListChange("rounds", index, "name", event.target.value)}
                                  placeholder={`Round ${index + 1}`}
                                  className={`${inputTone} flex-1`}
                                />
                                <ListActionButton icon={Trash2} label="Remove" tone="red" onClick={() => removeObjectItem("rounds", index)} />
                              </div>
                              <textarea
                                rows={3}
                                value={item.description}
                                onChange={(event) => handleObjectListChange("rounds", index, "description", event.target.value)}
                                className={textareaTone}
                                placeholder="Describe what happens in this round"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </Section>
                  )}

                  {editTab === "prizes" && (
                    <Section icon={Trophy} title="Prizes & Rewards" description="Highlight incentives for participants.">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-500">Celebrate the outcomes teams can aim for.</p>
                        <ListActionButton icon={Plus} label="Add prize" onClick={() => addObjectItem("prizes", { ...EMPTY_PRIZE })} />
                      </div>
                      {form.prizes.length === 0 ? (
                        <EmptyHint>No prize details yet.</EmptyHint>
                      ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                          {form.prizes.map((item, index) => (
                            <div key={`prize-${index}`} className="space-y-3 rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <input
                                  type="text"
                                  value={item.type}
                                  onChange={(event) => handleObjectListChange("prizes", index, "type", event.target.value)}
                                  placeholder="Prize name"
                                  className={`${inputTone} flex-1`}
                                />
                                <ListActionButton icon={Trash2} label="Remove" tone="red" onClick={() => removeObjectItem("prizes", index)} />
                              </div>
                              <input
                                type="text"
                                value={item.amount}
                                onChange={(event) => handleObjectListChange("prizes", index, "amount", event.target.value)}
                                placeholder="Amount or value"
                                className={inputTone}
                              />
                              <textarea
                                rows={3}
                                value={item.details}
                                onChange={(event) => handleObjectListChange("prizes", index, "details", event.target.value)}
                                className={textareaTone}
                                placeholder="Additional details"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </Section>
                  )}

                  {editTab === "gallery" && (
                    <Section icon={ImageIcon} title="Gallery" description="Showcase visuals from the event.">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-slate-500">Upload images to refresh what participants will see.</p>
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-600 shadow-sm transition hover:bg-indigo-50">
                          <UploadCloud className="h-4 w-4" />
                          <span>{uploading.gallery ? "Uploading..." : "Upload images"}</span>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={async (event) => {
                              const files = event.target.files;
                              await handleGalleryUpload(files);
                              if (event.target.value) {
                                event.target.value = "";
                              }
                            }}
                          />
                        </label>
                      </div>
                      {form.gallery.length === 0 ? (
                        <EmptyHint>No gallery images yet.</EmptyHint>
                      ) : (
                        <div className="grid gap-3 md:grid-cols-2">
                          {form.gallery.map((url, index) => (
                            <div key={`gallery-${index}`} className="space-y-3 rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm">
                              {url ? (
                                <img src={url} alt={`Gallery ${index + 1}`} className="h-44 w-full rounded-xl object-cover" />
                              ) : (
                                <div className="flex h-44 items-center justify-center rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
                                  Image preview
                                </div>
                              )}
                              <p className="truncate text-[11px] text-slate-400">{url || "No image uploaded yet"}</p>
                              <div className="flex flex-wrap items-center gap-2">
                                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-indigo-600 shadow-sm transition hover:bg-indigo-50">
                                  <UploadCloud className="h-3.5 w-3.5" />
                                  <span>Replace</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={async (event) => {
                                      const files = event.target.files;
                                      await handleGalleryUpload(files, { index });
                                      if (event.target.value) {
                                        event.target.value = "";
                                      }
                                    }}
                                  />
                                </label>
                                <ListActionButton icon={Trash2} label="Remove" tone="red" onClick={() => removeListItem("gallery", index)} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </Section>
                  )}

                  {editTab === "faqs" && (
                    <Section icon={HelpCircle} title="FAQs" description="Answer common participant questions.">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-500">Help teams stay informed before reaching out.</p>
                        <ListActionButton icon={Plus} label="Add FAQ" onClick={() => addObjectItem("faqs", { ...EMPTY_FAQ })} />
                      </div>
                      {form.faqs.length === 0 ? (
                        <EmptyHint>No FAQs yet.</EmptyHint>
                      ) : (
                        <div className="space-y-4">
                          {form.faqs.map((item, index) => (
                            <div key={`faq-${index}`} className="space-y-3 rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <input
                                  type="text"
                                  value={item.question}
                                  onChange={(event) => handleObjectListChange("faqs", index, "question", event.target.value)}
                                  placeholder="Question"
                                  className={`${inputTone} flex-1`}
                                />
                                <ListActionButton icon={Trash2} label="Remove" tone="red" onClick={() => removeObjectItem("faqs", index)} />
                              </div>
                              <textarea
                                rows={3}
                                value={item.answer}
                                onChange={(event) => handleObjectListChange("faqs", index, "answer", event.target.value)}
                                className={textareaTone}
                                placeholder="Answer"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </Section>
                  )}

                  {editTab === "updates" && (
                    <Section icon={MessageSquare} title="Updates" description="Share announcements as the event evolves.">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-500">Keep participants in the loop with timely updates.</p>
                        <ListActionButton icon={Plus} label="Add update" onClick={() => addListItem("updates")} />
                      </div>
                      {form.updates.length === 0 ? (
                        <EmptyHint>No updates yet.</EmptyHint>
                      ) : (
                        <div className="space-y-3">
                          {form.updates.map((item, index) => (
                            <ListRow key={`update-${index}`}>
                              <textarea
                                rows={2}
                                value={item}
                                onChange={(event) => handleStringListChange("updates", index, event.target.value)}
                                className={`${textareaTone} flex-1`}
                              />
                              <ListActionButton icon={Trash2} label="Remove" tone="red" onClick={() => removeListItem("updates", index)} />
                            </ListRow>
                          ))}
                        </div>
                      )}
                    </Section>
                  )}

                  {editTab === "skills" && (
                    <Section icon={Users} title="Skills Required" description="Let applicants know what skills shine here.">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-500">List key skills or tools teams should know.</p>
                        <ListActionButton icon={Plus} label="Add skill" onClick={() => addListItem("skillsRequired")} />
                      </div>
                      {form.skillsRequired.length === 0 ? (
                        <EmptyHint>No skills listed yet.</EmptyHint>
                      ) : (
                        <div className="space-y-3">
                          {form.skillsRequired.map((skill, index) => (
                            <ListRow key={`skill-${index}`}>
                              <input
                                type="text"
                                value={skill}
                                onChange={(event) => handleStringListChange("skillsRequired", index, event.target.value)}
                                className={`${inputTone} flex-1`}
                                placeholder="Skill"
                              />
                              <ListActionButton icon={Trash2} label="Remove" tone="red" onClick={() => removeListItem("skillsRequired", index)} />
                            </ListRow>
                          ))}
                        </div>
                      )}
                    </Section>
                  )}

                  {editTab === "support" && (
                    <Section icon={HelpCircle} title="Help & Support" description="Share points of contact for participant queries.">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-500">Add email, phone, or social handles participants can reach.</p>
                        <ListActionButton icon={Plus} label="Add contact" onClick={() => addListItem("helpContact")} />
                      </div>
                      {form.helpContact.length === 0 ? (
                        <EmptyHint>No support contacts yet.</EmptyHint>
                      ) : (
                        <div className="space-y-3">
                          {form.helpContact.map((contact, index) => (
                            <ListRow key={`contact-${index}`}>
                              <input
                                type="text"
                                value={contact}
                                onChange={(event) => handleStringListChange("helpContact", index, event.target.value)}
                                className={`${inputTone} flex-1`}
                                placeholder="Email, phone number, or link"
                              />
                              <ListActionButton icon={Trash2} label="Remove" tone="red" onClick={() => removeListItem("helpContact", index)} />
                            </ListRow>
                          ))}
                        </div>
                      )}
                    </Section>
                  )}

                  {editTab === "teams" && (
                    <Section icon={Users} title="Teams" description="View teams registered for this hackathon.">
                      {teamsLoading ? (
                        <div className="space-y-3">
                          <Skeleton className="h-12 w-full" />
                          <Skeleton className="h-12 w-full" />
                        </div>
                      ) : teams.length === 0 ? (
                        <EmptyHint>No teams have registered yet.</EmptyHint>
                      ) : (
                        <div className="space-y-3">
                          {teams.map((team) => (
                            <div key={team.id} className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white/80 p-4">
                              <div className="flex-1">
                                <h4 className="text-sm font-semibold text-slate-800">{team.projectName || team.name || `Team ${team.id}`}</h4>
                              </div>
                              <div className="ml-4">
                                <Button onClick={() => navigate(`/teams/${team.id}`)} tone="indigo">View</Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </Section>
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
        </motion.form>
      ) : (
        <motion.div
          className="mx-auto mt-8 flex max-w-7xl flex-col gap-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/70 shadow-xl">
            {previewBanner ? (
              <img src={previewBanner} alt="Hackathon banner" className="h-64 w-full object-cover" />
            ) : (
              <div className="flex h-64 w-full items-center justify-center bg-slate-100 text-slate-400">Banner preview</div>
            )}
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <motion.aside
              className="space-y-6 rounded-3xl border border-white/70 bg-gradient-to-br from-white/85 via-indigo-100/40 to-cyan-100/40 p-6 shadow-2xl"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {previewPoster ? (
                <img src={previewPoster} alt={previewData?.title || "Poster preview"} className="h-64 w-full rounded-2xl object-cover shadow" />
              ) : (
                <div className="flex h-64 w-full items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/70 text-slate-400">
                  Poster preview
                </div>
              )}

              <div>
                <h2 className="text-3xl font-semibold text-slate-900">{previewData?.title || "Untitled hackathon"}</h2>
                <p className="mt-2 text-sm text-slate-600">{previewData?.description || "No description provided yet."}</p>
              </div>

              <div className="grid gap-3 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span>Starts: {formatDateTime(previewData?.startDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span>Ends: {formatDateTime(previewData?.endDate)}</span>
                </div>
                {previewData?.mode ? (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-slate-400" />
                    <span>Mode: {previewData.mode}</span>
                  </div>
                ) : null}
                {previewData?.location ? (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span>Location: {previewData.location}</span>
                  </div>
                ) : null}
                {previewData?.teamSize ? (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span>Team size: {previewData.teamSize}</span>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                {previewData?.domain ? (
                  <span className="rounded-full bg-indigo-100 px-3 py-1 text-indigo-700">{previewData.domain}</span>
                ) : null}
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">{previewData?.Ispaid ? "Paid" : "Free"}</span>
                {previewData?.mode ? (
                  <span className="rounded-full bg-cyan-100 px-3 py-1 text-cyan-700">{previewData.mode}</span>
                ) : null}
              </div>

              <div className="rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm text-slate-600">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
                <div className={`mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.tone}`}>
                  {statusInfo.label}
                </div>
              </div>
            </motion.aside>

            <motion.div
              className="space-y-6 lg:col-span-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {TABS.map((tabItem) => (
                  <motion.button
                    key={`preview-${tabItem.id}`}
                    type="button"
                    onClick={() => setPreviewTab(tabItem.id)}
                    whileHover={{ scale: 1.03 }}
                    className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-all duration-150 ${
                      previewTab === tabItem.id
                        ? "border-indigo-400 bg-gradient-to-r from-indigo-500 to-cyan-400 text-white shadow-lg"
                        : "border-white/70 bg-white/80 text-slate-700 hover:border-indigo-200 hover:text-indigo-600"
                    }`}
                  >
                    {tabItem.label}
                  </motion.button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={`preview-content-${previewTab}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {previewTab === "overview" && (
                    <Section icon={Info} title="Overview" description="Exactly how participants will see the story.">
                      <p className="text-sm leading-relaxed text-slate-600">
                        {previewData?.overview || previewData?.description || "No overview has been provided yet."}
                      </p>
                      <div className="grid gap-4 md:grid-cols-2 text-xs text-slate-500">
                        <span>Start: {formatDateTime(previewData?.startDate)}</span>
                        <span>End: {formatDateTime(previewData?.endDate)}</span>
                      </div>
                    </Section>
                  )}

                  {previewTab === "rules" && (
                    <Section icon={Globe} title="Rules & Guidelines" description="These rules are visible to participants.">
                      {previewRules.length ? (
                        <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-600">
                          {previewRules.map((item, index) => (
                            <li key={`preview-rule-${index}`}>
                              {typeof item === "string" ? item : item?.rule || item?.text || JSON.stringify(item)}
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <EmptyHint>No rules have been published yet.</EmptyHint>
                      )}
                    </Section>
                  )}

                  {previewTab === "criteria" && (
                    <Section icon={BadgeCheck} title="Judging Criteria" description="Transparent evaluation metrics.">
                      {previewCriteria.length ? (
                        <div className="space-y-3">
                          {previewCriteria.map((criterion, index) => {
                            const isObject = criterion && typeof criterion === "object";
                            return (
                              <div
                                key={`preview-criterion-${index}`}
                                className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4"
                              >
                                <h4 className="text-sm font-semibold text-emerald-700">
                                  {isObject ? criterion.title || criterion.name || `Criterion ${index + 1}` : `Criterion ${index + 1}`}
                                </h4>
                                <p className="mt-1 text-sm text-emerald-600">
                                  {isObject ? criterion.description || criterion.detail || criterion.text : criterion}
                                </p>
                                {isObject && criterion.weight ? (
                                  <p className="mt-2 text-xs font-medium text-emerald-500">Weight: {criterion.weight}</p>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <EmptyHint>Judging criteria will be announced soon.</EmptyHint>
                      )}
                    </Section>
                  )}

                  {previewTab === "timeline" && (
                    <Section icon={CalendarClock} title="Event Timeline" description="Milestones your participants see.">
                      {previewTimeline.length ? (
                        <div className="space-y-4">
                          {previewTimeline.map((item, index) => (
                            <div
                              key={`preview-timeline-${index}`}
                              className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm"
                            >
                              <h4 className="text-sm font-semibold text-slate-700">
                                {item.phase || item.title || item.name || `Phase ${index + 1}`}
                              </h4>
                              {item.date ? (
                                <p className="mt-1 text-xs text-slate-500">{formatDateTime(item.date)}</p>
                              ) : null}
                              {item.description ? (
                                <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <EmptyHint>The public timeline hasn't been created yet.</EmptyHint>
                      )}
                    </Section>
                  )}

                  {previewTab === "rounds" && (
                    <Section icon={Sparkles} title="Competition Rounds" description="How submissions progress.">
                      {previewRounds.length ? (
                        <div className="space-y-3">
                          {previewRounds.map((item, index) => (
                            <div
                              key={`preview-round-${index}`}
                              className="rounded-2xl border border-purple-200 bg-purple-50/70 p-4"
                            >
                              <h4 className="text-sm font-semibold text-purple-700">
                                {item.name || `Round ${index + 1}`}
                              </h4>
                              {item.description ? (
                                <p className="mt-2 text-sm text-purple-600">{item.description}</p>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <EmptyHint>Round information will appear here once added.</EmptyHint>
                      )}
                    </Section>
                  )}

                  {previewTab === "prizes" && (
                    <Section icon={Trophy} title="Prizes & Rewards" description="Incentives published to participants.">
                      {previewPrizes.length ? (
                        <div className="grid gap-4 md:grid-cols-2">
                          {previewPrizes.map((item, index) => (
                            <div
                              key={`preview-prize-${index}`}
                              className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-center"
                            >
                              <h4 className="text-sm font-semibold text-amber-700">
                                {item.type || item.title || `Prize ${index + 1}`}
                              </h4>
                              {item.amount ? (
                                <p className="mt-2 text-lg font-bold text-amber-600">{item.amount}</p>
                              ) : null}
                              {item.details ? (
                                <p className="mt-2 text-xs text-amber-500">{item.details}</p>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <EmptyHint>Prizes will be revealed soon.</EmptyHint>
                      )}
                    </Section>
                  )}

                  {previewTab === "gallery" && (
                    <Section icon={ImageIcon} title="Gallery" description="Images displayed on the public page.">
                      {previewGallery.length ? (
                        <div className="grid gap-4 md:grid-cols-2">
                          {previewGallery.map((url, index) => (
                            <div key={`preview-gallery-${index}`} className="overflow-hidden rounded-2xl border border-slate-200/70">
                              {typeof url === "string" ? (
                                <img src={url} alt={`Gallery ${index + 1}`} className="h-48 w-full object-cover" />
                              ) : (
                                <div className="flex h-48 items-center justify-center bg-slate-100 text-xs text-slate-400">
                                  Invalid gallery item
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <EmptyHint>No gallery images yet.</EmptyHint>
                      )}
                    </Section>
                  )}

                  {previewTab === "faqs" && (
                    <Section icon={HelpCircle} title="FAQs" description="Questions participants can see.">
                      {previewFaqs.length ? (
                        <div className="space-y-3">
                          {previewFaqs.map((item, index) => (
                            <div
                              key={`preview-faq-${index}`}
                              className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm"
                            >
                              <p className="text-sm font-semibold text-slate-700">{item.question || `Question ${index + 1}`}</p>
                              <p className="mt-2 text-sm text-slate-600">{item.answer || "Answer coming soon."}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <EmptyHint>No FAQs have been added yet.</EmptyHint>
                      )}
                    </Section>
                  )}

                  {previewTab === "updates" && (
                    <Section icon={MessageSquare} title="Updates" description="Announcements sent to participants.">
                      {previewUpdates.length ? (
                        <div className="space-y-3">
                          {previewUpdates.map((item, index) => (
                            <div
                              key={`preview-update-${index}`}
                              className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm"
                            >
                              <p className="text-sm text-slate-600">{typeof item === "string" ? item : JSON.stringify(item)}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <EmptyHint>No updates have been published yet.</EmptyHint>
                      )}
                    </Section>
                  )}

                  {previewTab === "skills" && (
                    <Section icon={Users} title="Skills Required" description="Participants will check these skills.">
                      {previewSkills.length ? (
                        <div className="flex flex-wrap gap-2">
                          {previewSkills.map((item, index) => (
                            <span
                              key={`preview-skill-${index}`}
                              className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700"
                            >
                              {typeof item === "string" ? item : item?.name || JSON.stringify(item)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <EmptyHint>No skills listed yet.</EmptyHint>
                      )}
                    </Section>
                  )}

                  {previewTab === "support" && (
                    <Section icon={HelpCircle} title="Help & Support" description="Contacts visible to participants.">
                      {previewSupport.length ? (
                        <ul className="space-y-2 text-sm text-slate-600">
                          {previewSupport.map((item, index) => (
                            <li key={`preview-support-${index}`}>{typeof item === "string" ? item : JSON.stringify(item)}</li>
                          ))}
                        </ul>
                      ) : (
                        <EmptyHint>No support contacts provided.</EmptyHint>
                      )}
                    </Section>
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
