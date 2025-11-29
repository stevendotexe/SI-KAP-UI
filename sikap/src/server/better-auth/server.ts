import { auth } from ".";
import { headers } from "next/headers";
import { cache } from "react";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}
