import { PrismaClient } from "@prisma/client";
import { PERSONALITY_TYPES, QUESTIONS } from "../src/data/quiz-content";
import { MADOKA_TYPES, MADOKA_IP_CODE } from "../src/content/packs/madoka/config";

const prisma = new PrismaClient();

async function main() {
  const existingQuestions = await prisma.question.count();
  const force = process.env.FORCE_RESEED === "1";
  if (existingQuestions > 0 && !force) {
    console.log(`Seed skipped: ${existingQuestions} questions already exist in DB (set FORCE_RESEED=1 to rebuild)`);
    return;
  }
  if (force && existingQuestions > 0) {
    console.log("FORCE_RESEED=1 — wiping answers/options/questions before reseed");
  }

  // 跨IP角色：魔女审判标 ipCode="witch-trial"，小圆标 ipCode="madoka"
  const witchTrialTypes = PERSONALITY_TYPES.map((t) => ({ ...t, ipCode: "witch-trial" }));
  const madokaTypes = MADOKA_TYPES.map((t) => ({ ...t, ipCode: MADOKA_IP_CODE }));
  const allTypes = [...witchTrialTypes, ...madokaTypes];

  console.log("Seeding personality types...");
  for (const t of allTypes) {
    await prisma.personalityType.upsert({
      where: { code: t.code },
      update: {
        name: t.name, subtitle: t.subtitle ?? null, group: t.group,
        vector: t.vector, slogan: t.slogan, desc: t.desc,
        keywords: t.keywords ?? null, special: t.special ?? false,
        ipCode: t.ipCode,
      },
      create: {
        code: t.code, name: t.name, subtitle: t.subtitle ?? null, group: t.group,
        vector: t.vector, slogan: t.slogan, desc: t.desc,
        keywords: t.keywords ?? null, special: t.special ?? false,
        ipCode: t.ipCode,
      },
    });
  }
  console.log(`  → ${allTypes.length} types seeded (${witchTrialTypes.length} witch-trial + ${madokaTypes.length} madoka)`);

  console.log("Seeding questions...");
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
          create: q.options.map((o, j) => ({
            label: o.label,
            score: o.score ?? j + 1,
            value: o.value ?? null,
            trigger: o.trigger ?? null,
          })),
        },
      },
    });
  }
  console.log(`  → ${QUESTIONS.length} questions seeded`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
