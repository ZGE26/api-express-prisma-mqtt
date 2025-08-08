import mqtt, { MqttClient } from "mqtt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
// Definisikan tipe data sensor (opsional, tapi bagus untuk TS)
interface SensorData {
    temperature: number;
    humidity: number;
    time: Date;
}

let latestData: SensorData | null = null;

// Koneksi ke broker MQTT
const client: MqttClient = mqtt.connect("mqtt://localhost:1883");

client.on("connect", () => {
    console.log("✅ Connected to MQTT Broker");
    client.subscribe("sensor/data", (err) => {
        if (!err) {
            console.log("📡 Subscribed to sensor/data");
        } else {
            console.error("❌ Failed to subscribe:", err);
        }
    });
});

client.on("message", async (topic, message) => {
    if (topic === "sensor/data") {
        try {

            const rawData = JSON.parse(message.toString());

            const parsed: SensorData = {
                temperature: parseFloat(rawData.temperature),
                humidity: parseFloat(rawData.humidity),
                time: rawData.time
            };

            latestData = parsed;

            // Simpan data ke database
            await prisma.sensorData.create({
                data: {
                    temperature: parsed.temperature,
                    humidity: parsed.humidity,
                    time: new Date(),
                },
            });

            // Cek jumlah data dan hapus jika terlalu banyak
            const count = await prisma.sensorData.count();
            if (count == 10) {
                console.log("⚠️ Too many records, deleting oldest data");
                await prisma.sensorData.deleteMany();
                console.log("✅ Oldest data deleted");
            }

            console.log("Data:", latestData);
        } catch (err) {
            console.error("❌ Failed to parse message:", err);
        }
    }
});

// Fungsi untuk mengambil data terakhir
function getLatestData(): SensorData | null {
    return latestData;
}

export default { client, getLatestData };
