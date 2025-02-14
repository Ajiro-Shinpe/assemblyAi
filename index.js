require("dotenv").config();
const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");

// ✅ Load API Key
const API_KEY = process.env.ASSEMBLYAI_API_KEY;
if (!API_KEY) {
  console.error("❌ Error: Missing AssemblyAI API Key in .env file");
  process.exit(1);
}

// ✅ Path to your WAV file (Update this if needed)
const FILE_PATH = path.join(__dirname, "./harvard.wav");

// ✅ Read the file and convert it to base64
const audioData = fs.readFileSync(FILE_PATH).toString("base64");

// ✅ Connect to AssemblyAI WebSocket
const ws = new WebSocket("wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000");

ws.on("open", () => {
  console.log("✅ Connected to AssemblyAI WebSocket");

  // 🔹 Authenticate
  ws.send(JSON.stringify({ auth_token: API_KEY }));

  // 🔹 Send the audio data
  ws.send(JSON.stringify({ audio_data: audioData }));
});

// 🔹 Listen for transcription messages
ws.on("message", (message) => {
  const msg = JSON.parse(message);
  console.log("🔹 Received:", msg);

  if (msg.error) {
    console.error("❌ API Error:", msg.error);
    ws.close();
    return;
  }

  if (msg.text) {
    console.log(`🎤 Transcription: ${msg.text}`);
  }
});

// 🔹 Handle WebSocket close event
ws.on("close", () => {
  console.log("❌ Connection closed");
});

// 🔹 Handle WebSocket errors
ws.on("error", (err) => {
  console.error("⚠️ WebSocket Error:", err);
});
