import { describe, it, expect, vi, beforeEach } from "vitest";

// Must mock before importing the route handler
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}));

import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { POST } from "@/app/api/user/sync/route";

const mockAuth = vi.mocked(auth);
const mockFrom = vi.mocked(supabaseAdmin.from);

describe("POST /api/user/sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when the user is not authenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null } as never);

    const res = await POST();

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("returns 200 and upserts the profile for a new user", async () => {
    mockAuth.mockResolvedValue({ userId: "user_abc123" } as never);
    mockFrom.mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ error: null }),
    } as never);

    const res = await POST();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
    expect(mockFrom).toHaveBeenCalledWith("profiles");
  });

  it("returns 200 when the profile already exists (idempotent)", async () => {
    mockAuth.mockResolvedValue({ userId: "user_existing" } as never);
    // ignoreDuplicates: true means a conflict is not an error
    mockFrom.mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ error: null }),
    } as never);

    const res = await POST();

    expect(res.status).toBe(200);
  });

  it("returns 500 when the database returns an error", async () => {
    mockAuth.mockResolvedValue({ userId: "user_abc123" } as never);
    mockFrom.mockReturnValue({
      upsert: vi.fn().mockResolvedValue({
        error: { message: "DB connection error" },
      }),
    } as never);

    const res = await POST();

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ error: "Internal server error" });
  });
});
