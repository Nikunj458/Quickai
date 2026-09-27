import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import sql from "../configs/db.js";

const createToken = (user) => jwt.sign(
  { userId: user.id, name: user.name, email: user.email },
  process.env.JWT_SECRET,
  { expiresIn: "7d" }
);

const toUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email
});

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!name?.trim() || !normalizedEmail || !password) {
      return res.status(400).json({ success: false, message: "Name, email, and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    const [existingUser] = await sql`SELECT id FROM users WHERE email = ${normalizedEmail}`;
    if (existingUser) {
      return res.status(409).json({ success: false, message: "An account with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = await sql`
      INSERT INTO users (id, name, email, password_hash)
      VALUES (${randomUUID()}, ${name.trim()}, ${normalizedEmail}, ${passwordHash})
      RETURNING id, name, email
    `;

    return res.status(201).json({ success: true, token: createToken(user), user: toUser(user) });
  } catch (error) {
    console.error("Registration failed:", error.message);
    return res.status(500).json({ success: false, message: "Unable to create account" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();
    const [user] = await sql`SELECT id, name, email, password_hash FROM users WHERE email = ${normalizedEmail}`;

    if (!user || !password || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    return res.json({ success: true, token: createToken(user), user: toUser(user) });
  } catch (error) {
    console.error("Login failed:", error.message);
    return res.status(500).json({ success: false, message: "Unable to sign in" });
  }
};
