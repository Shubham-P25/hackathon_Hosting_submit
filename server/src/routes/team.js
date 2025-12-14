import express from "express";
import {
	createTeam,
	inviteToTeam,
	joinTeam,
	getTeams,
	getTeamById,
	updateTeam,
	getJoinRequestsForLeader,
	respondToJoinRequest
} from "../controllers/teamController.js";
import {
	leaveTeam,
	deleteTeam,
} from "../controllers/teamController.js";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from '../middleware/uploadMiddleware.js';
import multer from 'multer';

// local multer instance for team uploads: photo (images, 5MB), file (any, 10MB)
const teamStorage = multer.diskStorage({
	destination: (req, file, cb) => cb(null, 'uploads/'),
	filename: (req, file, cb) => {
		const userId = req.user?.id || 'anon';
		const timestamp = Date.now();
		const ext = file.originalname ? file.originalname.replace(/.*\./, '') : '';
		cb(null, `${userId}_team_${file.fieldname}_${timestamp}.${ext}`);
	}
});

const teamUpload = multer({
	storage: teamStorage,
	limits: { fileSize: 10 * 1024 * 1024 }, // default 10MB; we'll validate per-field below
});

// upload fields: photo (image) and file (any attachment)

const router = express.Router();

router.post("/hackathons/:id/teams", protect, createTeam);
router.post("/teams/:id/invite", protect, inviteToTeam);
router.post("/teams/:id/join", protect, joinTeam);
router.post('/teams/:id/upload', protect, teamUpload.fields([{ name: 'photo', maxCount: 1 }, { name: 'file', maxCount: 1 }]), async (req, res, next) => {
	// runtime validation: photo must be image and <=5MB; file <=10MB
	try {
		const photo = req.files?.photo?.[0];
		const file = req.files?.file?.[0];
		if (photo) {
			if (!photo.mimetype.startsWith('image/')) {
				return res.status(400).json({ message: 'Photo must be an image' });
			}
			if (photo.size > 5 * 1024 * 1024) {
				return res.status(400).json({ message: 'Photo must be 5MB or smaller' });
			}
		}
		if (file) {
			if (file.size > 10 * 1024 * 1024) {
				return res.status(400).json({ message: 'File must be 10MB or smaller' });
			}
		}

		const { uploadTeamFiles } = await import('../controllers/teamController.js');
		return uploadTeamFiles(req, res, next);
	} catch (err) {
		return next(err);
	}
});
router.get('/teams/:id', getTeamById);
// leave the team (member)
router.post('/:id/leave', protect, leaveTeam);
// delete the team (leader or admin)
router.delete('/:id', protect, deleteTeam);
router.patch('/teams/:id', protect, updateTeam);
router.get("/hackathons/:id/teams", getTeams);
router.get("/teams/join-requests", protect, getJoinRequestsForLeader);
router.post("/teams/join-requests/:requestId/respond", protect, respondToJoinRequest);

export default router;
