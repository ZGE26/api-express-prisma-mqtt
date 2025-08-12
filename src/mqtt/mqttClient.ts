import mqtt, { MqttClient } from "mqtt";
import { PrismaClient } from "@prisma/client";
import http from "http";
import express from "express";
import { Server } from "socket.io";

const prisma = new PrismaClient();


interface SensorData {
    temperature: number;
    humidity: number;
    soilTemperature: number;
    soilMoisture?: number;
    time: Date;
}

let latestData: SensorData | null = null;

// const client: MqttClient = mqtt.connect("mqtt://localhost:1883");

export function setupMqtt(io: Server) {
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
                    soilTemperature: parseFloat(rawData.soilTemperature),
                    soilMoisture: parseFloat(rawData.soilMoisture),
                    time: rawData.time
                };

                latestData = parsed;

                // Simpan data ke database
                await prisma.sensorData.create({
                    data: {
                        temperature: parsed.temperature,
                        humidity: parsed.humidity,
                        soilTemperature: parsed.soilTemperature,
                        soilHumidity: parsed.soilMoisture ?? 0, // Provide a default value if undefined
                        time: new Date(),
                    },
                });

                io.emit("sensorData", parsed);

                // Cek jumlah data dan hapus jika terlalu banyak
                const count = await prisma.sensorData.count();
                if (count == 50) {
                    const hightTemp = await prisma.sensorData.findFirst({
                        select: {
                            temperature: true,
                            time: true,
                        },
                        orderBy: { temperature: "desc" },
                    })

                    console.log("⚠️ Too many records, deleting oldest data with highest temperature:", hightTemp?.temperature);
                    if (hightTemp && hightTemp.temperature !== undefined && hightTemp.time !== undefined) {
                        await prisma.hightTemperature.create({
                            data: {
                                temperature: hightTemp.temperature,
                                time: hightTemp.time,
                            },
                        });
                        console.log("✅ High temperature record saved:", hightTemp.temperature);
                    } else {
                        console.warn("⚠️ No high temperature record found to save.");
                    }

                    console.log("⚠️ Too many records, deleting oldest data");
                    await prisma.sensorData.deleteMany();
                    console.log("✅ Oldest data deleted");
                }

                if (parsed.temperature >= 20 && parsed.temperature <= 30) {
                    console.log("✅ Temperature is within the normal range. Time :", parsed.time);
                } else {
                    console.log("⚠️ Temperature is outside the normal range. Time :", parsed.time);
                }
                console.log("Data:", latestData);
            } catch (err) {
                console.error("❌ Failed to parse message:", err);
            }
        }
    });

}


// Koneksi ke broker MQTT

// client.on("connect", () => {
//     console.log("✅ Connected to MQTT Broker");
//     client.subscribe("sensor/data", (err) => {
//         if (!err) {
//             console.log("📡 Subscribed to sensor/data");
//         } else {
//             console.error("❌ Failed to subscribe:", err);
//         }
//     });
// });

// client.on("message", async (topic, message) => {
//     if (topic === "sensor/data") {
//         try {

//             const rawData = JSON.parse(message.toString());

//             const parsed: SensorData = {
//                 temperature: parseFloat(rawData.temperature),
//                 humidity: parseFloat(rawData.humidity),
//                 soilTemperature: parseFloat(rawData.soilTemperature),
//                 time: rawData.time
//             };

//             latestData = parsed;

//             // Simpan data ke database
//             await prisma.sensorData.create({
//                 data: {
//                     temperature: parsed.temperature,
//                     humidity: parsed.humidity,
//                     soilTemperature: parsed.soilTemperature,
//                     time: new Date(),
//                 },
//             });

//             io.emit("sensorData", parsed);

//             // Cek jumlah data dan hapus jika terlalu banyak
//             const count = await prisma.sensorData.count();
//             if (count == 10) {
//                 const hightTemp = await prisma.sensorData.findFirst({
//                     select: {
//                         temperature: true,
//                         time: true,
//                     },
//                     orderBy: { temperature: "desc" },
//                 })

//                 console.log("⚠️ Too many records, deleting oldest data with highest temperature:", hightTemp?.temperature);
//                 if (hightTemp && hightTemp.temperature !== undefined && hightTemp.time !== undefined) {
//                     await prisma.hightTemperature.create({
//                         data: {
//                             temperature: hightTemp.temperature,
//                             time: hightTemp.time,
//                         },
//                     });
//                     console.log("✅ High temperature record saved:", hightTemp.temperature);
//                 } else {
//                     console.warn("⚠️ No high temperature record found to save.");
//                 }

//                 console.log("⚠️ Too many records, deleting oldest data");
//                 await prisma.sensorData.deleteMany();
//                 console.log("✅ Oldest data deleted");
//             }

//             if (parsed.temperature >= 20 && parsed.temperature <= 30) {
//                 console.log("✅ Temperature is within the normal range. Time :", parsed.time);
//             } else {
//                 console.log("⚠️ Temperature is outside the normal range. Time :", parsed.time);
//             }
//             console.log("Data:", latestData);
//         } catch (err) {
//             console.error("❌ Failed to parse message:", err);
//         }
//     }
// });

// Fungsi untuk mengambil data terakhir
export function getLatestData(): SensorData | null {
    return latestData;
}

// export default { client, getLatestData };
