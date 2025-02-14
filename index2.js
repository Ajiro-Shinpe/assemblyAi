require("dotenv").config();
const WebSocket = require("ws");
const { spawn } = require("child_process");

// ✅ Load API Key
const API_KEY = process.env.ASSEMBLYAI_API_KEY;
if (!API_KEY) {
  console.error("❌ Error: Missing AssemblyAI API Key in .env file");
  process.exit(1);
}

// ✅ Connect to AssemblyAI WebSocket
const ws = new WebSocket("wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000");

ws.on("open", () => {
  console.log("✅ Connected to AssemblyAI WebSocket");

  // 🔹 Authenticate with API Key
  ws.send(JSON.stringify({ auth_token: API_KEY }));

  // 🔹 Start capturing system audio
  startSystemAudioStream();
});

// 🔹 Function to Capture System Audio
function startSystemAudioStream() {
  console.log("🎧 Capturing system audio...");

  // 📢 Capture system audio using `ffmpeg`
  const ffmpeg = spawn("ffmpeg", [
    "-f", "dshow",                 // Use DirectShow (Windows) [For Linux/Mac, use 'avfoundation']
    "-i", "audio=Stereo Mix",      // Capture from "Stereo Mix" (change based on your system)
    "-ac", "1",                    // Convert to mono
    "-ar", "16000",                 // Set sample rate to 16kHz (AssemblyAI requirement)
    "-f", "wav",                    // Output format
    "pipe:1"                        // Send output as a stream
  ]);

  // 🔹 Send audio data to WebSocket in chunks
  ffmpeg.stdout.on("data", (data) => {
    ws.send(JSON.stringify({ audio_data: data.toString("base64") }));
  });

  // ❌ Handle errors
  ffmpeg.stderr.on("data", (data) => {
    console.error("FFmpeg Error:", data.toString());
  });

  ffmpeg.on("close", () => {
    console.log("❌ FFmpeg process closed");
  });
}

// 🔹 Handle Transcriptions
ws.on("message", (message) => {
  const msg = JSON.parse(message);

  if (msg.error) {
    console.error("❌ API Error:", msg.error);
    ws.close();
    return;
  }

  if (msg.text) {
    console.log(`🎤 Transcription: ${msg.text}`);
  }
});

// 🔹 Handle WebSocket Close & Errors
ws.on("close", () => {
  console.log("❌ Connection closed");
});

ws.on("error", (err) => {
  console.error("⚠️ WebSocket Error:", err);
});
