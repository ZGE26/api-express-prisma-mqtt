import { Prisma, PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import express from "express";

const prisma = new PrismaClient().$extends(withAccelerate());

const router = express();

router.get("/users", async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

router.post(`/signup`, async (req, res) => {
  const { name, email, posts } = req.body

  const postData = posts?.map((post: Prisma.PostCreateInput) => {
    return { title: post?.title, content: post?.content }
  })

  const result = await prisma.user.create({
    data: {
      name,
      email,
      posts: {
        create: postData,
      },
    },
  })
  res.json(result)
})

router.post(`/signup`, async (req, res) => {
  const { name, email, posts } = req.body

  const postData = posts?.map((post: Prisma.PostCreateInput) => {
    return { title: post?.title, content: post?.content }
  })

  const result = await prisma.user.create({
    data: {
      name,
      email,
      posts: {
        create: postData,
      },
    },
  })
  res.json(result)
})

router.get('/user/:id', async (req, res) => {
  const { id } = req.params

  const user = await prisma.user.findUnique({
    where: { id: Number(id) },
    include: {
      posts: true,
      profile: true,
    },
  })

  if (!user) {
    return res.status(404).json({ error: `User with ID ${id} does not exist in the database` })
  }

  res.json(user)
})

router.get('/user/:id/drafts', async (req, res) => {
  const { id } = req.params

  const drafts = await prisma.post.findMany({
    where: {
      authorId: Number(id),
      published: false,
    },
  })

  res.json(drafts)
})

export default router;