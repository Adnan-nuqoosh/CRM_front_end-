"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken, getUser } from "@/lib/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Static export: decide on client using stored auth.
    const token = getToken();
    const user = getUser();
    router.replace(token && user ? "/dashboard" : "/login");
  }, [router]);

  return null;
}
