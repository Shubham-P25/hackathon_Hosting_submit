import prisma from "../utils/prismaClient.js";

// Register user for a hackathon
export const registerForHackathon = async (req, res) => {
  try {
    const { hackathonId, ...registrationData } = req.body;

    if (!hackathonId) {
      return res.status(400).json({
        error: true,
        message: "Hackathon ID is required",
      });
    }

    // Check if already registered
    const existingRegistration = await prisma.registration.findFirst({
      where: {
        userId: req.user.id,
        hackathonId: Number(hackathonId),
      },
    });

    if (existingRegistration) {
      return res.status(400).json({
        error: true,
        message: "Already registered for this hackathon",
      });
    }

    const registration = await prisma.registration.create({
      data: {
        userId: req.user.id,
        hackathonId: parseInt(hackathonId),
        ...registrationData,
      },
      include: {
        hackathon: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json(registration);
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      error: true,
      message: error.message || "Failed to register for hackathon",
    });
  }
};

// Check if user is registered for a specific hackathon
export const checkRegistrationStatus = async (req, res) => {
  try {
    const { hackathonId } = req.params;

    if (!hackathonId) {
      return res.status(400).json({
        error: true,
        message: "Hackathon ID is required",
      });
    }

    const registration = await prisma.registration.findFirst({
      where: {
        userId: req.user.id,
        hackathonId: parseInt(hackathonId, 10),
      },
      select: {
        id: true,
        createdAt: true,
      },
    });

    return res.json({
      registered: Boolean(registration),
      registration,
    });
  } catch (error) {
    console.error("Check registration status error:", error);
    return res.status(500).json({
      error: true,
      message: "Failed to verify registration status",
    });
  }
};

// Get all registrations
export const getRegistrations = async (req, res) => {
  try {
    const registrations = await prisma.registration.findMany({
      include: { user: true, hackathon: true },
    });

    res.json(registrations);
  } catch (error) {
    console.error("❌ Error fetching registrations:", error);
    res.status(500).json({ error: "Server error while fetching registrations" });
  }
};

// Unregister user from a hackathon
export const unregisterFromHackathon = async (req, res) => {
  try {
    const { hackathonId } = req.params;
    const userId = req.user.id;

    const registration = await prisma.registration.findFirst({
      where: {
        userId,
        hackathonId: parseInt(hackathonId),
      },
    });

    if (!registration) {
      return res.status(404).json({
        error: true,
        message: "Registration not found",
      });
    }

    await prisma.registration.delete({
      where: {
        id: registration.id,
      },
    });

    res.json({ message: "Successfully unregistered from hackathon" });
  } catch (error) {
    console.error("Unregister error:", error);
    res.status(500).json({
      error: true,
      message: "Failed to unregister from hackathon",
    });
  }
};

