// src/controllers/authController.js

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../utils/prismaClient.js";

// REGISTER
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role === "HOST" ? "HOST" : "USER", // allow host registration
      },
    });

    res.status(201).json({ message: "User registered", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// LOGIN
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('👉 Login attempt for:', email);

    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({ message: "Please provide email and password" });
    }

    // Find user
    console.log('🔍 Finding user in database...');
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true
      }
    });

    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(404).json({ message: "User not found" });
    }

    console.log('✅ User found, verifying password...');
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      console.log('❌ Invalid password for user:', email);
      return res.status(401).json({ message: "Invalid credentials" });
    }


    console.log('✅ Password verified, generating token...');
    let token, dashboard;
    if (user.role === 'HOST') {
      token = jwt.sign(
        { id: user.id, role: user.role, type: 'host' },
        process.env.JWT_SECRET || 'fallback-secret-key',
        { expiresIn: "1d" }
      );
      dashboard = '/host/dashboard';
    } else {
      token = jwt.sign(
        { id: user.id, role: user.role, type: 'user' },
        process.env.JWT_SECRET || 'fallback-secret-key',
        { expiresIn: "1d" }
      );
      dashboard = '/user/dashboard';
    }

    console.log('✅ Login successful for:', email);
    const { password: _, ...userWithoutPassword } = user;
    res.json({
      success: true,
      token,
      user: userWithoutPassword,
      dashboard
    });

  } catch (err) {
    console.error('🔥 Login error details:', {
      error: err.message,
      stack: err.stack,
      name: err.name
    });
    res.status(500).json({ 
      message: "Server error during login",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// GET LOGGED-IN USER PROFILE
export const getMe = async (req, res) => {
  try {
    const userId = req.user.id;
    let userData;

    if (req.user.role === 'HOST') {
      userData = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          hostProfile: true,
          hostedHackathons: {
            include: {
              registrations: true,
              host: {
                select: { name: true, email: true }
              }
            }
          }
        }
      });
    } else {
      userData = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
          registrations: {
            include: {
              hackathon: {
                include: {
                  host: {
                    select: { name: true, email: true }
                  }
                }
              }
            }
          },
          teamMemberships: {
            include: {
              team: {
                include: {
                  hackathon: true,
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
              }
            }
          },
          ledTeams: {
            include: {
              hackathon: true,
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
          }
        }
      });
    }

    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove sensitive data
    const { password, ...sanitizedData } = userData;
    res.json(sanitizedData);
  } catch (err) {
    console.error('Error in getMe:', err);
    res.status(500).json({ error: err.message });
  }
};