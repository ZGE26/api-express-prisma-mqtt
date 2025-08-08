import { Prisma, PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import express from "express";

const prisma = new PrismaClient().$extends(withAccelerate());

const router = express.Router();

router.post('/profile', async (req, res) => {
  const { bio, userId } = req.body;

  try {
    const profile = await prisma.profile.create({
      data: {
        bio,
        user: { connect: { id: userId } },
      },
    });
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: "Failed to create profile" });
  }
});

router.get('/profile/:userId', async (req, res) => {
    const { userId } = req.params;
    const profile = await prisma.profile.findUnique({
      where: { userId: Number(userId) },
      include: { user: true },
    });
    if (profile) {
      res.json(profile);
    } else {
      res.status(404).json({ message: "Profile not found" });
    }
});

router.get('/profiles', async (req, res) => {
  const profiles = await prisma.profile.findMany({
    // include: { user: true },
  });
  res.json(profiles);
});

export default router;