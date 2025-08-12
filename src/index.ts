import { Prisma, PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'
import express from 'express'
import mqttRoute from './routes/mqttRoute'
import usersRoute from './routes/usersRoute'
import postRoute from './routes/postRoute'
import http from "http";
import { Server } from "socket.io";
import profileRoute from './routes/profileRoute' 
import {setupMqtt } from './mqtt/mqttClient'
import { startOfDay, endOfDay } from 'date-fns'
const prisma = new PrismaClient().$extends(withAccelerate())

const app = express()
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    socket.on("getLatestData", async () => {
    const data = await prisma.sensorData.findMany({
      where: {
        time: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      orderBy: { time: 'desc' },
    });
    socket.emit("latestData", data.reverse());
  });
});

app.use(express.json())

app.use("/", mqttRoute)
app.use("/", usersRoute)
app.use("/", postRoute)
app.use("/", profileRoute)

setupMqtt(io);

server.listen(3000, () =>
  console.log(`
🚀 Server ready at: http://localhost:3000
⭐️ See sample requests: https://github.com/prisma/prisma-examples/blob/latest/orm/express/README.md#using-the-rest-api`),
)
