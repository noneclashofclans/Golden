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

// ── CORS CONFIGURATION ───────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173', 
  'https://golden-delta-seven.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl) 
    // or if the origin is in our allowed list
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("CORS Blocked Origin:", origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

app.use(express.json());

const server = http.createServer(app);

// ── SOCKET.IO CONFIGURATION ──────────────────────────────────────────────────
const io = new Server(server, {
  cors: { 
    origin: allowedOrigins, 
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

      // Simple keyword trigger for demo purposes
      if (data.text.toLowerCase().includes('error') || data.text.toLowerCase().includes('bug')) {
        const aiResponseText = "I've analyzed your snippet. You are missing a closing brace '}' on line 4. Try fixing that to resolve the syntax error!";
        
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