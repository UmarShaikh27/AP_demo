import { Prisma } from "@prisma/client";

/**
 * Normalizes an identifier (line ID or phone number in any format)
 * into a Prisma `LineWhereInput` condition.
 */
export function buildLineWhere(identifier: string): Prisma.LineWhereInput {
  const raw = decodeURIComponent(identifier).trim();
  const digitsOnly = raw.replace(/\D/g, "");

  const phoneCandidates: string[] = [raw];

  if (digitsOnly.length === 10) {
    phoneCandidates.push(`+1${digitsOnly}`, `+${digitsOnly}`, digitsOnly);
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith("1")) {
    phoneCandidates.push(`+${digitsOnly}`, `+1${digitsOnly.slice(1)}`, digitsOnly, digitsOnly.slice(1));
  } else if (digitsOnly.length > 0) {
    phoneCandidates.push(`+${digitsOnly}`, digitsOnly);
  }

  // If it's a small integer (< 1,000,000), it could be a Line ID
  const numId = parseInt(raw, 10);
  const isSmallNumericId = !isNaN(numId) && String(numId) === raw && numId < 1000000;

  if (isSmallNumericId) {
    return {
      OR: [
        { id: numId },
        { phone_number: { in: Array.from(new Set(phoneCandidates)) } },
      ],
    };
  }

  return {
    phone_number: { in: Array.from(new Set(phoneCandidates)) },
  };
}

/**
 * Normalizes an identifier (account ID, phone, or email)
 * into a Prisma `AccountWhereInput` condition.
 */
export function buildAccountWhere(identifier: string): Prisma.AccountWhereInput {
  const raw = decodeURIComponent(identifier).trim();
  const digitsOnly = raw.replace(/\D/g, "");

  // Check email
  if (raw.includes("@")) {
    return { email: raw.toLowerCase() };
  }

  const phoneCandidates: string[] = [raw];
  if (digitsOnly.length === 10) {
    phoneCandidates.push(`+1${digitsOnly}`, `+${digitsOnly}`, digitsOnly);
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith("1")) {
    phoneCandidates.push(`+${digitsOnly}`, `+1${digitsOnly.slice(1)}`, digitsOnly, digitsOnly.slice(1));
  } else if (digitsOnly.length > 0) {
    phoneCandidates.push(`+${digitsOnly}`, digitsOnly);
  }

  const numId = parseInt(raw, 10);
  const isSmallNumericId = !isNaN(numId) && String(numId) === raw && numId < 1000000;

  if (isSmallNumericId) {
    return {
      OR: [
        { id: numId },
        { phone: { in: Array.from(new Set(phoneCandidates)) } },
      ],
    };
  }

  return {
    phone: { in: Array.from(new Set(phoneCandidates)) },
  };
}
