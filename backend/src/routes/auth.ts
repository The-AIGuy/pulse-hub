import "dotenv/config";
import bcrypt from "bcryptjs";
import { Router } from "express";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { UserModel } from "../models/Schemas.js";

const authRouter = Router();
const jwtSecret = process.env.JWT_SECRET ?? "development-only-secret";

const mailer = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    })
  : null;

async function sendVerificationCode(email: string, code: string) {
  if (!mailer) {
    console.log(`[development] Verification code for ${email}: ${code}`);
    return;
  }

  await mailer.sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    to: email,
    subject: "Your Pulse Hub verification code",
    text: `Your Pulse Hub verification code is ${code}. It expires in 10 minutes.`,
  });
}

authRouter.post("/register", async (request, response) => {
  const { username, email, password } = request.body as { username?: string; email?: string; password?: string };
  if (!username?.trim() || !email?.trim() || !password || password.length < 8) {
    response.status(400).json({ error: "username, email, and a password of at least 8 characters are required" });
    return;
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await UserModel.findOne({ $or: [{ email: normalizedEmail }, { username: username.trim() }] });
    if (existingUser) {
      response.status(409).json({ error: "username or email is already in use" });
      return;
    }

    const verificationCode = String(Math.floor(100000 + Math.random() * 900000));
    const user = await UserModel.create({
      username: username.trim(),
      email: normalizedEmail,
      password: await bcrypt.hash(password, 12),
      verificationCodeHash: await bcrypt.hash(verificationCode, 10),
      verificationCodeExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    await sendVerificationCode(normalizedEmail, verificationCode);
    response.status(201).json({ userId: user.id, message: "Verification code sent" });
  } catch (error: unknown) {
    console.error("Registration failed", error);
    response.status(500).json({ error: "Registration failed" });
  }
});

authRouter.post("/verify", async (request, response) => {
  const { email, code } = request.body as { email?: string; code?: string };
  const submittedCode = code ?? "";
  if (!email || !/^\d{6}$/.test(submittedCode)) {
    response.status(400).json({ error: "email and a six-digit code are required" });
    return;
  }

  const user = await UserModel.findOne({ email: email.toLowerCase() }).select("+verificationCodeHash +verificationCodeExpiresAt");
  const verificationCodeHash = user?.verificationCodeHash;
  const verificationCodeExpiresAt = user?.verificationCodeExpiresAt;
  if (!user || !verificationCodeHash || !verificationCodeExpiresAt || verificationCodeExpiresAt < new Date()) {
    response.status(400).json({ error: "invalid or expired verification code" });
    return;
  }
  if (!(await bcrypt.compare(submittedCode, verificationCodeHash))) {
    response.status(400).json({ error: "invalid or expired verification code" });
    return;
  }

  user.isVerified = true;
  user.verificationCodeHash = undefined;
  user.verificationCodeExpiresAt = undefined;
  await user.save();
  response.json({ message: "Email verified" });
});

authRouter.post("/login", async (request, response) => {
  const { email, password } = request.body as { email?: string; password?: string };
  const user = email ? await UserModel.findOne({ email: email.toLowerCase() }) : null;
  if (!user || !(await bcrypt.compare(password ?? "", user.password))) {
    response.status(401).json({ error: "invalid email or password" });
    return;
  }
  if (!user.isVerified) {
    response.status(403).json({ error: "verify your email before logging in" });
    return;
  }

  const token = jwt.sign({ userId: user.id, username: user.username }, jwtSecret, { expiresIn: "7d" });
  response.json({ token, user: { id: user.id, username: user.username, email: user.email } });
});

export default authRouter;