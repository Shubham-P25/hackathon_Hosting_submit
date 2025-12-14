import prisma from "../utils/prismaClient.js";
import { promises as fs } from 'fs';
import { uploadToCloudinary } from '../utils/cloudinary.js';

export const createTeam = async (req, res) => {
  try {
    const hackathonId = parseInt(req.params.id);
    const leaderId = req.user.id;
    const { name, bio, rolesRequired } = req.body;

    const normalizedRoles = Array.isArray(rolesRequired)
      ? rolesRequired
      : typeof rolesRequired === "string" && rolesRequired.trim().length
        ? rolesRequired.split(",").map((role) => role.trim()).filter(Boolean)
        : [];

    // Check if user already has a team in this hackathon
    const existingMembership = await prisma.teamMember.findFirst({
      where: {
        userId: leaderId,
        team: { hackathonId }
      }
    });

    const existingLeadership = await prisma.team.findFirst({
      where: {
        hackathonId,
        leaderId
      }
    });

    if (existingMembership || existingLeadership) {
      return res.status(400).json({ message: "Already part of a team in this hackathon" });
    }

    const team = await prisma.$transaction(async (tx) => {
      const createdTeam = await tx.team.create({
        data: {
          name,
          bio,
          rolesRequired: normalizedRoles,
          hackathonId,
          leaderId
        }
      });

      await tx.teamMember.create({
        data: {
          teamId: createdTeam.id,
          userId: leaderId,
          role: "Leader"
        }
      });

      return createdTeam;
    });

    const teamWithRelations = await prisma.team.findUnique({
      where: { id: team.id },
      include: {
        leader: {
          select: { id: true, name: true, email: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    res.status(201).json(teamWithRelations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const inviteToTeam = async (req, res) => {
  try {
    const teamId = parseInt(req.params.id);
    const { userId, role } = req.body;

    const team = await prisma.team.findUnique({
      where: { id: teamId }
    });

    if (team.leaderId !== req.user.id) {
      return res.status(403).json({ message: "Only team leader can invite members" });
    }

    const member = await prisma.teamMember.create({
      data: {
        teamId,
        userId,
        role
      }
    });

    res.status(201).json(member);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const joinTeam = async (req, res) => {
  try {
    const teamId = parseInt(req.params.id);
    const userId = req.user.id;
    const { role } = req.body || {};

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: true,
        joinRequests: true
      }
    });

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    if (team.leaderId === userId) {
      return res.status(400).json({ message: "You are already the leader of this team" });
    }

    const existingMembership = await prisma.teamMember.findFirst({
      where: {
        userId,
        team: { hackathonId: team.hackathonId }
      }
    });

    if (existingMembership) {
      return res.status(400).json({ message: "Already part of a team in this hackathon" });
    }

    const existingRequest = team.joinRequests.find((request) => request.userId === userId);

    if (existingRequest && existingRequest.status === "PENDING") {
      return res.status(200).json({ message: "Join request already sent", request: existingRequest });
    }

    if (existingRequest) {
      await prisma.teamJoinRequest.update({
        where: { id: existingRequest.id },
        data: {
          status: "PENDING",
          role: role || existingRequest.role || null
        }
      });

      return res.status(201).json({ message: "Join request re-submitted" });
    }

    const joinRequest = await prisma.teamJoinRequest.create({
      data: {
        teamId,
        userId,
        role: role || null
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            leaderId: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      message: "Join request sent to team leader",
      request: joinRequest
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getJoinRequestsForLeader = async (req, res) => {
  try {
    // ensure auth middleware populated req.user
    if (!req.user || !req.user.id) {
      console.warn('getJoinRequestsForLeader called without authenticated user');
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const leaderId = req.user.id;

    try {
      const requests = await prisma.teamJoinRequest.findMany({
        where: {
          status: "PENDING",
          team: {
            leaderId
          }
        },
        orderBy: { createdAt: "desc" },
        include: {
          team: {
            select: {
              id: true,
              name: true,
              hackathonId: true,
              hackathon: {
                select: { title: true }
              }
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      return res.json(requests);
    } catch (prismaErr) {
      // Log full stack for debugging
      console.error('Prisma error in getJoinRequestsForLeader:', prismaErr?.stack || prismaErr);
      return res.status(500).json({ message: 'Server error while loading join requests' });
    }
  } catch (error) {
    console.error('Unexpected error in getJoinRequestsForLeader:', error?.stack || error);
    res.status(500).json({ error: error.message });
  }
};

export const respondToJoinRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action } = req.body;
    const leaderId = req.user.id;

    const joinRequest = await prisma.teamJoinRequest.findUnique({
      where: { id: parseInt(requestId) },
      include: {
        team: true
      }
    });

    if (!joinRequest) {
      return res.status(404).json({ message: "Join request not found" });
    }

    if (joinRequest.team.leaderId !== leaderId) {
      return res.status(403).json({ message: "Not authorized to respond to this request" });
    }

    if (joinRequest.status !== "PENDING") {
      return res.status(400).json({ message: "Join request already handled" });
    }

    if (action === "accept") {
      const existingMembership = await prisma.teamMember.findFirst({
        where: {
          userId: joinRequest.userId,
          team: { hackathonId: joinRequest.team.hackathonId }
        }
      });

      if (existingMembership) {
        await prisma.teamJoinRequest.update({
          where: { id: joinRequest.id },
          data: { status: "DECLINED" }
        });

        return res.status(400).json({ message: "User already part of another team" });
      }

      await prisma.$transaction([
        prisma.teamMember.create({
          data: {
            teamId: joinRequest.teamId,
            userId: joinRequest.userId,
            role: joinRequest.role || null
          }
        }),
        prisma.teamJoinRequest.update({
          where: { id: joinRequest.id },
          data: { status: "ACCEPTED" }
        })
      ]);

      return res.json({ message: "Join request accepted" });
    }

    if (action === "decline") {
      await prisma.teamJoinRequest.update({
        where: { id: joinRequest.id },
        data: { status: "DECLINED" }
      });

      return res.json({ message: "Join request declined" });
    }

    return res.status(400).json({ message: "Invalid action" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTeams = async (req, res) => {
  try {
    const hackathonId = parseInt(req.params.id);
    const teams = await prisma.team.findMany({
      where: { hackathonId },
      include: {
        leader: {
          select: { name: true, email: true }
        },
        members: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        },
        joinRequests: {
          where: {
            status: "PENDING"
          },
          select: {
            id: true,
            userId: true
          }
        }
      }
    });

    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTeamById = async (req, res) => {
  try {
    const teamId = parseInt(req.params.id);
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        leader: { select: { id: true, name: true, email: true, role: true } },
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        joinRequests: true
      }
    });

    if (!team) return res.status(404).json({ message: 'Team not found' });

    // Determine requester (optional auth)
    let requester = null;
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded?.id) {
          const user = await prisma.user.findUnique({ where: { id: decoded.id }, select: { id: true, role: true } });
          if (user) requester = user;
        }
      }
    } catch (e) {
      // ignore token errors and treat as guest
      requester = null;
    }

    const isMember = requester ? team.members.some((m) => m.user.id === requester.id) : false;

    // If team is private, only members or admins/hosts may view
    if (team.isPublic === false) {
      const isPrivileged = requester && (requester.role === 'ADMIN' || requester.role === 'HOST');
      if (!isMember && !isPrivileged) {
        return res.status(403).json({ message: 'Team is private' });
      }
    }

    // Parse attachments from Team.fileurl (stored as JSON string) to maintain parity with the frontend
    let attachments = [];
    if (team.fileurl) {
      try {
        const parsed = JSON.parse(team.fileurl);
        if (Array.isArray(parsed)) attachments = parsed;
        else if (parsed && typeof parsed === 'object') attachments = [parsed];
      } catch (e) {
        // fileurl might be a plain string URL: convert to single attachment entry
        attachments = [{ id: null, label: 'File', url: team.fileurl, filename: null, uploadedAt: null }];
      }
    }

    res.json({
      id: team.id,
      name: team.name,
      bio: team.bio,
      projectName: team.projectName,
      problemStatement: team.problemStatement,
      projectLink: team.projectLink,
      fileurl: team.fileurl,
      isPublic: team.isPublic,
      leader: team.leader,
      members: team.members.map((m) => ({ id: m.user.id, name: m.user.name })),
      attachments
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateTeam = async (req, res) => {
  try {
    const teamId = parseInt(req.params.id);
    const userId = req.user.id;

    // Ensure user is a member of the team
    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } }
    });

    if (!membership) {
      return res.status(403).json({ message: 'Only team members can update the team' });
    }

    const { name, bio, projectName, problemStatement, projectLink, photo, fileurl, isPublic } = req.body;

    const updated = await prisma.team.update({
      where: { id: teamId },
      data: {
        name: name ?? undefined,
        bio: bio ?? undefined,
        projectName: projectName ?? undefined,
        problemStatement: problemStatement ?? undefined,
        projectLink: projectLink ?? undefined,
        photo: photo ?? undefined,
        fileurl: fileurl ?? undefined,
        isPublic: typeof isPublic === 'boolean' ? isPublic : undefined
      }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const uploadTeamFiles = async (req, res) => {
  try {
    const teamId = parseInt(req.params.id);
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) return res.status(404).json({ message: 'Team not found' });

    // only members can upload/update files
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const membership = await prisma.teamMember.findUnique({ where: { teamId_userId: { teamId, userId } } });
    if (!membership) return res.status(403).json({ message: 'Only team members can upload files' });

    const photoFile = req.files?.photo?.[0];
    const attachedFile = req.files?.file?.[0];

    // label may be provided in body (for front-end to indicate Report/PPT etc.)
    const label = req.body?.label || req.query?.label || 'Attachment';

    const createdAttachments = [];

    if (!photoFile && !attachedFile) {
      return res.status(400).json({ message: 'No files provided' });
    }

    if (photoFile) {
      const photoUrl = await uploadToCloudinary(photoFile);
      createdAttachments.push({ id: null, label, url: photoUrl, filename: photoFile.originalname, uploadedAt: new Date() });
    }
    if (attachedFile) {
      const fileUrl = await uploadToCloudinary(attachedFile);
      createdAttachments.push({ id: null, label, url: fileUrl, filename: attachedFile.originalname, uploadedAt: new Date() });
    }

    // cleanup temp files
    const toDelete = [];
    if (photoFile) toDelete.push(photoFile.path);
    if (attachedFile) toDelete.push(attachedFile.path);
    await Promise.all(toDelete.map(p => fs.unlink(p).catch(() => {})));

    // Persist attachments into Team.fileurl as JSON string. We'll merge with existing entries if present.
    const current = await prisma.team.findUnique({ where: { id: teamId }, select: { fileurl: true } });
    let existing = [];
    if (current?.fileurl) {
      try {
        const parsed = JSON.parse(current.fileurl);
        if (Array.isArray(parsed)) existing = parsed;
        else if (parsed && typeof parsed === 'object') existing = [parsed];
      } catch (e) {
        // if it's a plain string, convert to an entry
        existing = [{ id: null, label: 'File', url: current.fileurl, filename: null, uploadedAt: null }];
      }
    }

    const merged = [...existing, ...createdAttachments];
    await prisma.team.update({ where: { id: teamId }, data: { fileurl: JSON.stringify(merged) } });

    // return the created attachment metadata
    res.json({ message: 'Files uploaded', attachments: createdAttachments });
  } catch (error) {
    console.error('uploadTeamFiles error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const leaveTeam = async (req, res) => {
  try {
    const teamId = parseInt(req.params.id);
    const userId = req.user.id;

    // Ensure membership exists
    const membership = await prisma.teamMember.findUnique({ where: { teamId_userId: { teamId, userId } } });
    if (!membership) return res.status(404).json({ message: 'Membership not found' });

    // Prevent leader from leaving (they must delete the team)
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) return res.status(404).json({ message: 'Team not found' });
    if (team.leaderId === userId) return res.status(400).json({ message: 'Leader cannot leave team; delete the team instead' });

    await prisma.teamMember.delete({ where: { id: membership.id } });

    res.json({ message: 'Left team' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteTeam = async (req, res) => {
  try {
    const teamId = parseInt(req.params.id);
    const userId = req.user.id;

    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) return res.status(404).json({ message: 'Team not found' });

    // only leader or admin can delete
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (team.leaderId !== userId && user?.role !== 'ADMIN') return res.status(403).json({ message: 'Not authorized' });

    // Delete memberships and related join requests (transaction)
    await prisma.$transaction([
      prisma.teamJoinRequest.deleteMany({ where: { teamId } }),
      prisma.teamMember.deleteMany({ where: { teamId } }),
      prisma.team.delete({ where: { id: teamId } })
    ]);

    res.json({ message: 'Team deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
