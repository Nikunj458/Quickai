import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import aiRouter from './routes/aiRoutes.js';
import connectCloudinary from './configs/cloudinary.js';
import userRouter from './routes/userRoutes.js';
import authRouter from './routes/authRoutes.js';
import sql from './configs/db.js';

const app = express();

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required in server/.env');
}

await connectCloudinary();
await sql`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )
`;

await sql`
  ALTER TABLE creations
  ADD COLUMN IF NOT EXISTS likes TEXT[] NOT NULL DEFAULT '{}'
`;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send("Server is running");
});

app.use('/api/auth', authRouter)
app.use('/api/ai',aiRouter)
app.use('/api/user',userRouter)

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(' Server is running on port ', PORT);
});
