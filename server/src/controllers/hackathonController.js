import { promises as fs } from 'fs';
import prisma from "../utils/prismaClient.js";

const sanitizeString = (value, fallback = "") => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }
  if (value === null || value === undefined) {
    return fallback;
  }
  return value;
};

const normalizeArrayInput = (value) => {
  if (value == null) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
      return parsed ? [parsed] : [];
    } catch {
      return value.trim() ? [value.trim()] : [];
    }
  }
  return [value];
};

const parseDateValue = (value, { fieldName, required = true, fallback = null } = {}) => {
  if (value === undefined) {
    if (!required) {
      return fallback;
    }
    if (fallback) {
      return fallback;
    }
    throw new Error(`${fieldName || 'Date'} is required`);
  }

  if (value === null || value === "") {
    if (required) {
      throw new Error(`${fieldName || 'Date'} cannot be empty`);
    }
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ${fieldName || 'date'} value`);
  }
  return date;
};

const normalizeRules = (input) => normalizeArrayInput(input)
  .map((rule) => (typeof rule === "string" ? rule.trim() : rule))
  .filter((rule) => (typeof rule === "string" ? rule.length > 0 : rule !== null && rule !== undefined));

const normalizeSkills = (input) => normalizeArrayInput(input)
  .map((skill) => (typeof skill === "string" ? skill.trim() : skill))
  .filter((skill) => (typeof skill === "string" ? skill.length > 0 : skill !== null && skill !== undefined));

const normalizeTimeline = (input) => normalizeArrayInput(input)
  .map((phase) => {
    if (typeof phase === "object" && phase !== null) {
      return {
        phase: sanitizeString(phase.phase || phase.title || phase.name || ""),
        date: phase.date || phase.deadline || null,
        description: sanitizeString(phase.description || phase.details || "")
      };
    }
    return { description: sanitizeString(phase) };
  })
  .filter((phase) => phase.phase || phase.date || phase.description);

const normalizeRounds = (input) => normalizeArrayInput(input)
  .map((round) => {
    if (typeof round === "object" && round !== null) {
      return {
        name: sanitizeString(round.name || round.title || ""),
        description: sanitizeString(round.description || round.details || ""),
        duration: sanitizeString(round.duration || "")
      };
    }
    return { description: sanitizeString(round) };
  })
  .filter((round) => round.name || round.description || round.duration);

const normalizePrizes = (input) => normalizeArrayInput(input)
  .map((prize) => {
    if (typeof prize === "object" && prize !== null) {
      return {
        type: sanitizeString(prize.type || prize.position || ""),
        amount: sanitizeString(prize.amount || prize.value || ""),
        details: sanitizeString(prize.details || prize.description || "")
      };
    }
    return { type: sanitizeString(prize) };
  })
  .filter((prize) => prize.type || prize.amount || prize.details);

const normalizeFaqs = (input) => normalizeArrayInput(input)
  .map((faq) => {
    if (typeof faq === "object" && faq !== null) {
      return {
        question: sanitizeString(faq.question || faq.q || ""),
        answer: sanitizeString(faq.answer || faq.a || "")
      };
    }
    return { question: sanitizeString(faq), answer: "" };
  })
  .filter((faq) => faq.question || faq.answer);

const normalizeStringEntries = (input) => normalizeArrayInput(input)
  .map((entry) => (typeof entry === "string" ? entry.trim() : entry))
  .filter((entry) => (typeof entry === "string" ? entry.length > 0 : entry !== null && entry !== undefined));

const buildHackathonData = (body, {
  hostId,
  existing,
  allowMissingDates = false
} = {}) => {
  const hasOwn = (key) => Object.prototype.hasOwnProperty.call(body, key);
  const pick = (key, fallback) => (hasOwn(key) ? body[key] : fallback);

  const rawStartDate = pick('startDate', existing?.startDate);
  const rawEndDate = pick('endDate', existing?.endDate);

  const startDate = parseDateValue(rawStartDate, {
    fieldName: 'start date',
    required: !allowMissingDates,
    fallback: existing?.startDate ?? null
  });

  const endDate = parseDateValue(rawEndDate, {
    fieldName: 'end date',
    required: !allowMissingDates,
    fallback: existing?.endDate ?? null
  });

  if (startDate && endDate && endDate <= startDate) {
    throw new Error('End date must be after start date');
  }

  const rules = hasOwn('rules') ? normalizeRules(body.rules) : existing?.rules ?? [];
  const skillsRequired = hasOwn('skillsRequired') ? normalizeSkills(body.skillsRequired) : existing?.skillsRequired ?? [];
  const timeline = hasOwn('timeline') ? normalizeTimeline(body.timeline) : existing?.timeline ?? [];
  const rounds = hasOwn('rounds') ? normalizeRounds(body.rounds) : existing?.rounds ?? [];
  const prizes = hasOwn('prizes') ? normalizePrizes(body.prizes) : existing?.prizes ?? [];
  const faqs = hasOwn('faqs') ? normalizeFaqs(body.faqs) : existing?.faqs ?? [];
  const updates = hasOwn('updates') ? normalizeStringEntries(body.updates) : existing?.updates ?? [];
  const helpContact = hasOwn('helpContact') ? normalizeStringEntries(body.helpContact) : existing?.helpContact ?? [];
  const gallerySource = hasOwn('galleryUrl')
    ? body.galleryUrl
    : hasOwn('gallery')
      ? body.gallery
      : existing?.gallery ?? [];
  const gallery = normalizeStringEntries(gallerySource);

  const teamSizeValue = pick('teamSize', existing?.teamSize ?? null);
  const parsedTeamSize = teamSizeValue === null || teamSizeValue === '' || teamSizeValue === undefined
    ? null
    : parseInt(teamSizeValue, 10);

  if (parsedTeamSize !== null && Number.isNaN(parsedTeamSize)) {
    throw new Error('Team size must be a number');
  }

  const isPaidRaw = hasOwn('Is_Paid')
    ? body.Is_Paid
    : hasOwn('Ispaid')
      ? body.Ispaid
      : hasOwn('isPaid')
        ? body.isPaid
        : existing?.Ispaid;
  const isPaid = typeof isPaidRaw === 'string' ? isPaidRaw === 'true' : Boolean(isPaidRaw);

  const locationRaw = hasOwn('location') ? body.location : existing?.location ?? null;
  const location = locationRaw === null || locationRaw === undefined || locationRaw === ''
    ? null
    : sanitizeString(locationRaw);

  const posterValue = hasOwn('posterUrl') ? body.posterUrl : hasOwn('poster') ? body.poster : existing?.poster ?? null;
  const bannerValue = hasOwn('bannerUrl') ? body.bannerUrl : hasOwn('banner') ? body.banner : existing?.banner ?? null;

  const cleanMedia = (value) => {
    if (value === null || value === undefined) return null;
    const sanitized = sanitizeString(value, '');
    return sanitized.length ? sanitized : null;
  };

  const data = {
    title: sanitizeString(pick('title', existing?.title)),
    description: sanitizeString(pick('description', existing?.description)),
    overview: sanitizeString(pick('overview', existing?.overview || existing?.description)),
    rules,
    criteria: sanitizeString(pick('criteria', existing?.criteria ?? "")),
    timeline,
    rounds,
    prizes,
    faqs,
    updates,
    helpContact,
    mode: sanitizeString(pick('mode', existing?.mode || 'ONLINE'), 'ONLINE'),
    teamSize: parsedTeamSize,
    domain: sanitizeString(pick('domain', existing?.domain)),
    skillsRequired,
    startDate,
    endDate,
    location,
    Ispaid: isPaid,
    poster: cleanMedia(posterValue),
    banner: cleanMedia(bannerValue),
    gallery
  };

  if (typeof hostId === 'number') {
    data.hostId = hostId;
  }

  return data;
};

// CREATE Hackathon
export const createHackathon = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user || user.role !== 'HOST') {
      return res.status(403).json({ error: "Only hosts can create hackathons" });
    }
    const hackathonData = buildHackathonData(req.body, {
      hostId: req.user.id,
      allowMissingDates: false
    });

    const hackathon = await prisma.hackathon.create({
      data: hackathonData
    });

    res.status(201).json(hackathon);
  } catch (err) {
    console.error("Error creating hackathon:", err);
    res.status(400).json({ error: err.message });
  }
};

// GET all Hackathons
export const getHackathons = async (req, res) => {
  try {
    const hackathons = await prisma.hackathon.findMany({
      include: {
        host: {
          select: {
            id: true,
            name: true,
            email: true,
            hostProfile: true
          }
        },
        registrations: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(hackathons);
  } catch (error) {
    console.error('Error fetching hackathons:', error);
    res.status(500).json({ 
      error: true,
      message: 'Failed to fetch hackathons',
      details: error.message 
    });
  }
};

// UPDATE Hackathon (host or admin)
export const updateHackathon = async (req, res) => {
  try {
    const hackathonId = Number(req.params.id);

    if (Number.isNaN(hackathonId)) {
      return res.status(400).json({ error: 'Invalid hackathon ID' });
    }

    const existing = await prisma.hackathon.findUnique({ where: { id: hackathonId } });

    if (!existing) {
      return res.status(404).json({ error: 'Hackathon not found' });
    }

    const isOwner = req.user.role === 'HOST' && existing.hostId === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to update this hackathon' });
    }

    const data = buildHackathonData(req.body, {
      existing,
      allowMissingDates: true
    });

    const updated = await prisma.hackathon.update({
      where: { id: hackathonId },
      data
    });

    res.json(updated);
  } catch (err) {
    console.error('Error updating hackathon:', err);
    res.status(500).json({ error: err.message });
  }
};

// DELETE Hackathon (admin only)
export const deleteHackathon = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.hackathon.delete({
      where: { id: Number(id) },
    });

    res.json({ message: "Hackathon deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add new route to serve images
export const getHackathonImage = async (req, res) => {
  try {
    const { id, type } = req.params;
    const hackathon = await prisma.hackathon.findUnique({
      where: { id: parseInt(id) },
      select: { 
        bannerData: type === 'banner',
        posterData: type === 'poster',
        galleryData: type === 'gallery'
      }
    });

    if (!hackathon) {
      return res.status(404).json({ error: 'Hackathon not found' });
    }

    const imageData = hackathon[`${type}Data`];
    if (!imageData) {
      return res.status(404).json({ error: 'Image not found' });
    }

    res.writeHead(200, {
      'Content-Type': 'image/jpeg',
      'Content-Length': imageData.length
    });
    res.end(Buffer.from(imageData));

  } catch (error) {
    console.error('Error serving image:', error);
    res.status(500).json({ error: 'Error serving image' });
  }
};

export const uploadImages = async (req, res) => {
  try {
    if (!req.files) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const imageData = {};

    // Read file as binary data
    if (req.files.banner) {
      imageData.bannerData = await fs.readFile(req.files.banner[0].path);
    }
    if (req.files.poster) {
      imageData.posterData = await fs.readFile(req.files.poster[0].path);
    }
    if (req.files.gallery) {
      imageData.galleryData = await Promise.all(
        req.files.gallery.map(file => fs.readFile(file.path))
      );
    }

    // Store in database
    const hackathon = await prisma.hackathon.update({
      where: { id: parseInt(req.params.id) },
      data: imageData
    });

    // Cleanup temp files
    for (const field in req.files) {
      await Promise.all(
        req.files[field].map(file => fs.unlink(file.path))
      );
    }

    res.json({ message: 'Images uploaded successfully' });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
};