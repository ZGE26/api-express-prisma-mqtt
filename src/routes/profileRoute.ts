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

export default router;