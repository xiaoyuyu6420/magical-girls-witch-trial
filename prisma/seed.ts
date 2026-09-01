import { PrismaClient } from "@prisma/client";
import { PERSONALITY_TYPES, QUESTIONS } from "../src/data/quiz-content";
import { ANNOTATION_POOLS } from "../src/lib/annotations";

const prisma = new PrismaClient();

/**
 * seed 行为（2026-08-31 起）：
 * - 角色：始终 upsert（slogan/desc 等文案随镜像更新自动同步进 DB）
 * - 题目：题数与选项结构与代码一致时，仅同步文案（text/meta/label），不动 id 与用户答题记录；
 *         结构不一致（题数/选项数/打分键变化）或 FORCE_RESEED=1 时才 deleteMany 全量重建。
 * 这样 push main 自动部署后，线上文案立即生效，统计（TestRecord）永不丢失。
 */
async function main() {
  const force = process.env.FORCE_RESEED === "1";

  // ── 角色：始终 upsert ──
  console.log("Syncing personality types...");
  for (const t of PERSONALITY_TYPES) {
    await prisma.personalityType.upsert({
      where: { code: t.code },
      update: {
        name: t.name, subtitle: t.subtitle ?? null, group: t.group,
        vector: t.vector, slogan: t.slogan, desc: t.desc,
        keywords: t.keywords ?? null, special: t.special ?? false,
        ipCode: t.ipCode ?? "witch-trial",
        prosecution: t.prosecution,
        softlanding: t.softlanding,
        tags: t.tags,
      },
      create: {
        code: t.code, name: t.name, subtitle: t.subtitle ?? null, group: t.group,
        vector: t.vector, slogan: t.slogan, desc: t.desc,
        keywords: t.keywords ?? null, special: t.special ?? false,
        ipCode: t.ipCode ?? "witch-trial",
        prosecution: t.prosecution,
        softlanding: t.softlanding,
        tags: t.tags,
      },
    });
  }
  console.log(`  → ${PERSONALITY_TYPES.length} types synced`);

  // ── 题目：结构比对 ──
  const existingQuestions = await prisma.question.findMany({
    orderBy: { order: "asc" },
    include: { options: { orderBy: { id: "asc" } } },
  });

  const signatureOf = (q: (typeof QUESTIONS)[number]) =>
    `${q.dim}|${q.type}|${q.renderType ?? "normal"}|${q.options.length}|${q.options
      .map((o) => `${o.score ?? "-"}:${o.value ?? ""}:${o.trigger ?? ""}`)
      .join(",")}`;
  const dbSignatureOf = (q: (typeof existingQuestions)[number]) =>
    `${q.dim}|${q.type}|${q.renderType}|${q.options.length}|${q.options
      .map((o) => `${o.score}:${o.value ?? ""}:${o.trigger ?? ""}`)
      .join(",")}`;

  const structureMatch =
    !force &&
    existingQuestions.length === QUESTIONS.length &&
    existingQuestions.every((dbQ, i) => dbSignatureOf(dbQ) === signatureOf(QUESTIONS[i]));

  if (!structureMatch) {
    if (existingQuestions.length > 0) {
      console.log(
        force ? "FORCE_RESEED=1 — rebuilding questions" : "Question structure mismatch — rebuilding questions",
      );
    }
    await prisma.answer.deleteMany();
    await prisma.option.deleteMany();
    await prisma.question.deleteMany();
    for (let i = 0; i < QUESTIONS.length; i++) {
      const q = QUESTIONS[i];
      await prisma.question.create({
        data: {
          dim: q.dim, text: q.text, order: i + 1, type: q.type, meta: q.meta ?? "",
          renderType: q.renderType ?? "normal",
          options: {
            create: q.options.map((o) => ({
              label: o.label,
              score: o.score ?? 0,
              value: o.value ?? null,
              trigger: o.trigger ?? null,
            })),
          },
        },
      });
    }
    console.log(`  → ${QUESTIONS.length} questions rebuilt`);
    return;
  }

  // ── 文案级同步（结构一致：只更新文字，保 id / 答题记录）──
  let textChanges = 0;
  for (let i = 0; i < QUESTIONS.length; i++) {
    const src = QUESTIONS[i];
    const dbQ = existingQuestions[i];
    const qData = { text: src.text, meta: src.meta ?? "", dim: src.dim, type: src.type, renderType: src.renderType ?? "normal" };
    if (
      dbQ.text !== qData.text || dbQ.meta !== qData.meta || dbQ.dim !== qData.dim ||
      dbQ.type !== qData.type || dbQ.renderType !== qData.renderType
    ) {
      await prisma.question.update({ where: { id: dbQ.id }, data: qData });
      textChanges++;
    }
    for (let j = 0; j < src.options.length; j++) {
      const srcOpt = src.options[j];
      const dbOpt = dbQ.options[j];
      if (dbOpt && dbOpt.label !== srcOpt.label) {
        await prisma.option.update({ where: { id: dbOpt.id }, data: { label: srcOpt.label } });
        textChanges++;
      }
    }
  }
  console.log(`  → ${QUESTIONS.length} questions synced (${textChanges} text updates)`);

  // ── 审判官批注：全量替换（表小、无关联数据；代码池为权威源，后台编辑即时生效、
  //    下次部署随镜像刷新——与题目文案同一语义） ──
  console.log("Syncing annotations...");
  await prisma.annotation.deleteMany();
  const annotationRows: { node: number; tier: string; text: string; order: number }[] = [];
  for (const [nodeKey, tiers] of Object.entries(ANNOTATION_POOLS)) {
    const node = Number(nodeKey);
    for (const [tier, texts] of Object.entries(tiers as Record<string, string[]>)) {
      (texts as string[]).forEach((text, order) => annotationRows.push({ node, tier, text, order }));
    }
  }
  if (annotationRows.length > 0) {
    await prisma.annotation.createMany({ data: annotationRows });
  }
  console.log(`  → ${annotationRows.length} annotations synced`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
