require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Rcon } = require("rcon-client");

const app = express();
const port = 3000;
app.use(express.json());
app.use(cors());

// ตรวจสอบค่าพอร์ตจาก .env
const rconPort = parseInt(process.env.RCON_PORT, 10);
if (isNaN(rconPort) || rconPort < 0 || rconPort > 65535) {
  console.warn("Invalid RCON_PORT. Using default: 25575");
}

// ข้อมูลการเชื่อมต่อ RCON
const rconConfig = {
  host: process.env.RCON_HOST || "127.0.0.1",
  port: isNaN(rconPort) ? 25575 : rconPort, // ใช้ 25575 ถ้าพอร์ตผิดพลาด
  password: process.env.RCON_PASSWORD || "",
};

// ฟังก์ชันเชื่อมต่อ RCON
async function sendRconCommand(command) {
  const rcon = new Rcon(rconConfig);
  await rcon.connect();
  const response = await rcon.send(command);
  await rcon.end();
  return response;
}

// เพิ่มผู้เล่นใน Whitelist
app.post("/api/add-whitelist", async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "Username is required" });
  // console.log(username);
  try {
    const response = await sendRconCommand(`whitelist add ${username}`);
    res.json({ message: response.trim() });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to add whitelist", details: err.message });
  }
});

// แสดงรายชื่อ Whitelist
app.get("/api/whitelist", async (req, res) => {
  try {
    const response = await sendRconCommand("whitelist list");
    res.json({ whitelist: response.trim() });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to get whitelist", details: err.message });
  }
});

// ลบผู้เล่นออกจาก Whitelist
app.post("/api/remove-whitelist", async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "Username is required" });
  try {
    const response = await sendRconCommand(`whitelist remove ${username}`);
    res.json({ message: response.trim() });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to remove from whitelist", details: err.message });
  }
});

app.get("/api/online-server", async (req, res) => {
  try {
    const response = await sendRconCommand("list");
    res.json({ online: parseInt(response.slice(10, 11)) });
  } catch (err) {
    res.status(500).json({
      error: "Failed online server status",
      details: err.message,
    });
  }
});

app.get("/api/online-player", async (req, res) => {
  try {
    const response = await sendRconCommand("list");
    res.status(200).json({
      player: response.slice(43),
    });
  } catch (err) {
    res.status(500).json({
      error: "Failed online player status",
      deatails: err.message,
    });
  }
});

app.get("/api/tps", async (req, res) => {
  try {
    const response = await sendRconCommand("tps");
    res.status(200).json({
      tps: parseFloat(response.slice(31, 35)),
    });
  } catch (err) {
    res.json(500).json({
      message: err,
    });
  }
});

// เริ่มเซิร์ฟเวอร์
app.listen(port, () => {
  console.log(`Minecraft Whitelist API is running on port ${port}`);
});
