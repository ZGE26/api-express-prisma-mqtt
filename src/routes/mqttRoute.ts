import express from "express";
import { getLatestData } from "../mqtt/mqttClient";

const router = express.Router();

router.get("/data", (req, res) => {
  const data = getLatestData();
  if (data) {
    res.json(data);
  } else {
    res.status(404).json({ message: "No data yet" });
  }
});

export default router;
