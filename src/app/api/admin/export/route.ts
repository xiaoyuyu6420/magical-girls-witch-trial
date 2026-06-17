import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkAdminAuth } from "@/lib/admin-auth";
import { apiError } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;
  try {
    const headers = [
      "ID",
      "Session",
      "Type",
      "Similarity",
      "IP",
      "UserAgent",
      "ScreenRes",
      "Language",
      "Timezone",
      "Duration",
      "StartedAt",
      "CompletedAt",
      "CreatedAt",
    ];

    const escape = (v: unknown): string => {
      const s = v === null || v === undefined ? "" : String(v);
      return s.includes(",") || s.includes('"') || s.includes("\n")
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };

    const rows: string[] = [];
    let cursor: { id: number } | undefined;
    const batchSize = 500;

    while (true) {
      const batch = await db.testRecord.findMany({
        take: batchSize,
        skip: cursor ? 1 : 0,
        cursor: cursor,
        orderBy: { id: "asc" },
        include: { answers: true },
      });
      if (batch.length === 0) break;

      for (const r of batch) {
        rows.push(
          [
            r.id,
            r.sessionId,
            r.resultCode,
            r.similarity,
            r.ipAddress,
            r.userAgent,
            r.screenRes,
            r.language,
            r.timezone,
            r.duration,
            r.startedAt?.toISOString(),
            r.completedAt?.toISOString(),
            r.createdAt.toISOString(),
          ]
            .map(escape)
            .join(",")
        );
      }

      cursor = { id: batch[batch.length - 1].id };
    }

    const csv = [headers.join(","), ...rows].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="test-records.csv"',
      },
    });
  } catch (e) {
    console.error(e);
    return apiError("Export failed", 500, e);
  }
}
