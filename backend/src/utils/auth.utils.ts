import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UserPayload } from "../types/auth.types";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const SALT_ROUNDS = 10;

/**
 * Hash un mot de passe avec bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compare un mot de passe avec son hash
 */
export const comparePassword = async (
  password: string,
  hash: string,
): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

/**
 * Génère un token JWT
 */
export const generateToken = (payload: UserPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

/**
 * Vérifie et décode un token JWT
 */
export const verifyToken = (token: string): UserPayload => {
  return jwt.verify(token, JWT_SECRET) as UserPayload;
};

/**
 * Valide le format d'un email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valide la force d'un mot de passe
 * Min 8 caractères
 */
export const isValidPassword = (password: string): boolean => {
  return password.length >= 8;
};

/**
 * Valide un username
 * 3-30 caractères, accepte lettres, chiffres, espaces et quelques symboles
 */
export const isValidUsername = (username: string): boolean => {
  // Accepte lettres, chiffres, espaces, apostrophes, tirets, underscores, &
  const usernameRegex =
    /^[a-zA-Z0-9àâäéèêëïîôùûüÿçÀÂÄÉÈÊËÏÎÔÙÛÜŸÇ\s'\-_&]{3,30}$/;
  return usernameRegex.test(username.trim()) && username.trim().length >= 3;
};
