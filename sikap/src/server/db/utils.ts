import { db } from "./index";
import { user } from "./schema";
import { count, like } from "drizzle-orm";

/**
 * Generates a user code based on the pattern: [PREFIX]-[YY][INCREMENT]
 * Example: MEN-25001
 *
 * @param role The role of the user
 * @returns A promise that resolves to the generated code string
 */
export async function generateUserCode(role: "admin" | "mentor" | "student") {
  const prefix = role === "admin" ? "ADM" : role === "mentor" ? "MEN" : "STD";
  const year = new Date().getFullYear().toString().slice(-2);
  const pattern = `${prefix}-${year}`;

  const result = await db
    .select({
      total: count(),
    })
    .from(user)
    .where(like(user.code, `${pattern}%`));

  const total = result[0]?.total ?? 0;
  const nextIncrement = total + 1;
  const incrementStr = nextIncrement.toString().padStart(3, "0");

  return `${pattern}${incrementStr}`;
}
