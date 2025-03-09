require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { Rcon } = require("rcon-client");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

const connectRcon = async () => {
  return new Rcon({
    host: process.env.RCON_HOST,
    port: parseInt(process.env.RCON_PORT),
    password: process.env.RCON_PASSWORD,
  });
};

// เพิ่มผู้ใช้ใน Whitelist
app.post("/api/add-whitelist", async (req, res) => {
  let { username } = req.body;

  if (!username || !/^[a-zA-Z0-9_]{3,16}$/.test(username)) {
    return res.status(400).json({ error: "Invalid Minecraft username" });
  }

  username = JSON.stringify(username).replace(/^"|"$/g, ""); // ป้องกัน Markdown

  const rcon = await connectRcon();
  try {
    await rcon.connect();
    const response = await rcon.send(`whitelist add ${username}`);
    await rcon.end();
    res.json({ message: response });
  } catch (error) {
    console.error("RCON Error:", error);
    res.status(500).json({ error: "Failed to add user to whitelist" });
  }
});

// แสดงรายชื่อ Whitelist
app.get("/api/whitelist", async (req, res) => {
  const rcon = await connectRcon();
  try {
    await rcon.connect();
    const response = await rcon.send("whitelist list");
    await rcon.end();
    res.json({ whitelist: response });
  } catch (error) {
    console.error("RCON Error:", error);
    res.status(500).json({ error: "Failed to fetch whitelist" });
  }
});

// ลบผู้ใช้จาก Whitelist
app.post("/api/remove-whitelist", async (req, res) => {
  let { username } = req.body;

  if (!username || !/^[a-zA-Z0-9_]{3,16}$/.test(username)) {
    return res.status(400).json({ error: "Invalid Minecraft username" });
  }

  username = JSON.stringify(username).replace(/^"|"$/g, ""); // ป้องกัน Markdown

  const rcon = await connectRcon();
  try {
    await rcon.connect();
    console.log(`Removing user from whitelist: '${username}'`);
    const response = await rcon.send(`whitelist remove ${username}`);
    await rcon.end();
    res.json({ message: response });
  } catch (error) {
    console.error("RCON Error:", error);
    res.status(500).json({ error: "Failed to remove user from whitelist" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
