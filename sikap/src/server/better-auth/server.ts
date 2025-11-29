import { auth } from ".";
import { headers } from "next/headers";


export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}
