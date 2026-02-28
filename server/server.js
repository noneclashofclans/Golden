const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const User = require('./models/User');
const Message = require('./models/Message');
const Room = require('./models/Room');

const app = express();

// ── UNIVERSAL CORS CONFIGURATION ───────────────────────────────────────────────
// Allows Localhost, Main Production, and ANY Vercel Preview/Branch URL
const allowedOrigins = [
  'http://localhost:5173', 
  'https://golden-delta-seven.vercel.app'
];

const checkOrigin = (origin, callback) => {
  // Allow if:
  // 1. There is no origin (server-to-server pings/curl)
  // 2. The origin is in our static allowed list
  // 3. The origin is a dynamic Vercel deployment link
  if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
    callback(null, true);
  } else {
    console.log("CORS Blocked Origin:", origin);
    callback(new Error('Not allowed by CORS'));
  }
};

app.use(cors({
  origin: checkOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

app.use(express.json());

const server = http.createServer(app);

// ── SOCKET.IO CONFIGURATION ──────────────────────────────────────────────────
const io = new Server(server, {
  cors: { 
    origin: checkOrigin, 
    methods: ["GET", "POST"],
    credentials: true
  }
});

// ── DATABASE CONNECTION ──────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("MongoDB Connection Error:", err));

// ── REAL-TIME LOGIC (SOCKET.IO) ──────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);
  });

  socket.on('send_message', async (data) => {
    try {
      const newMessage = new Message({
        roomId: data.roomId,
        sender: data.senderId,
        text: data.text,
        isAI: false
      });
      await newMessage.save();

      io.to(data.roomId).emit('receive_message', newMessage);

      // AI Logic: Detect bug-related keywords
      if (data.text.toLowerCase().includes('error') || data.text.toLowerCase().includes('bug')) {
        const aiResponseText = "AI Node Analysis: I've detected a logic pattern typical of a syntax error. Please verify your scope blocks and closing characters.";
        
        const aiMessage = new Message({
          roomId: data.roomId,
          sender: null, 
          text: aiResponseText,
          isAI: true
        });
        
        await aiMessage.save();
        setTimeout(() => {
          io.to(data.roomId).emit('receive_message', aiMessage);
        }, 1000);
      }
    } catch (err) {
      console.error("Socket send_message error:", err);
    }
  });

  socket.on('disconnect', () => {
    console.log("User Disconnected", socket.id);
  });
});

// ── ROUTES ───────────────────────────────────────────────────────────────────
const authRoutes = require('./routes/userLogin');
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
    res.send('DevRoomsAI Backend Node: Active');
});

// ── SERVER START ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));