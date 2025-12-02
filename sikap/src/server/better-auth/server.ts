import { cache } from "react";
import { auth } from ".";
import { headers } from "next/headers";

export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);
