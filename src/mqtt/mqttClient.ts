import mqtt, { MqttClient } from "mqtt";

// Definisikan tipe data sensor (opsional, tapi bagus untuk TS)
interface SensorData {
    temperature: number;
    humidity: number;
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

client.on("message", (topic, message) => {
    if (topic === "sensor/data") {
        try {
            const parsed: SensorData = JSON.parse(message.toString());
            latestData = parsed;
            console.log("📥 Data received:", latestData);
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
