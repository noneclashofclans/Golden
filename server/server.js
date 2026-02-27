const PORT = 5000;
const express = require('express');
const app = express();
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');

require('dotenv').config();

app.use(cors({
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));


app.use(express.urlencoded({extended: false}))
app.use(express.json());

// const connectDB = async () => {
//   try {
//     console.log('Attempting to connect to MongoDB...');
//     await mongoose.connect(process.env.MONGO_URI);
//     console.log('MongoDB Connected!');
//   } catch (error) {
//     console.error('MongoDB connection error:', error.message);
//     console.error('Make sure your IP is whitelisted and your URI is correct.');
//     process.exit(1); 
//   }
// };

// connectDB();

// const Expense = require('./models/Expense');
// const authRoutes = require('./routes/userLogin');
// const expenseRoutes = require('./routes/expenseRoutes');

// app.use('/api/auth', authRoutes);
// app.use('/api/expenses', expenseRoutes);

app.get('/', (req, res) => {
    res.send('Hey there from backend');
})

app.listen(PORT, () => {
    console.log(`Backend is running at ${PORT}`);
})