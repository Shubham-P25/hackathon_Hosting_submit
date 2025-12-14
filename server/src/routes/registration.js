import express from "express";
import { registerForHackathon, getRegistrations, unregisterFromHackathon, checkRegistrationStatus } from "../controllers/registrationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Route to register a user for a hackathon (protected)
router.post("/", protect, registerForHackathon);

// Route to get all registrations (admin only recommended)
router.get("/", protect, getRegistrations);

// Route to check if current user is registered for a hackathon
router.get("/status/:hackathonId", protect, checkRegistrationStatus);

// Route to unregister a user from a hackathon (protected)
router.delete("/:hackathonId", protect, unregisterFromHackathon);

export default router;
