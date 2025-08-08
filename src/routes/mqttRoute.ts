import mqttClient from "../mqtt/mqttClient";
import express from "express";

const router = express.Router();

router.get("/data", (req, res) => {
    const data = mqttClient.getLatestData();
    if (data) {
        res.json(data);
    } else {
        res.status(404).json({ message: "No data yet" });
    }
});

export default router;
