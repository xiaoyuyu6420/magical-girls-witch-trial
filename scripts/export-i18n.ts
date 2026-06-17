/**
 * 导出所有文案到 Excel
 * 运行: npx tsx scripts/export-i18n.ts
 */

import * as XLSX from "xlsx";
import * as path from "path";
import * as fs from "fs";

// 动态导入 i18n 文件
const i18nDir = path.join(process.cwd(), "src/i18n");
const locales = ["zh-CN", "zh-TW", "en", "ja"] as const;
const localeNames: Record<string, string> = {
  "zh-CN": "简体中文",
  "zh-TW": "繁體中文",
  en: "English",
  ja: "日本語",
};

type I18nData = {
  meta: { title: string; description: string };
  welcome: {
    badge: string;
    title: string;
    subtitle: string;
    startHint: string;
    participants: string;
    startButton: string;
    prologue1: string;
    prologue2: string;
    prologue3: string;
  };
  loading: { text: string };
  test: {
    exit: string;
    gateBadge: string;
    triggerBadge: string;
    keyHint: string;
  };
  result: {
    archetype: string;
    hidden: string;
    border: string;
    share: string;
    copyLink: string;
    rebirth: string;
    analysis: string;
    dimAnalysis: string;
    you: string;
    ideal: string;
    statsInfo: string;
    statsShort: string;
    factorResonance: string;
    factorResonanceLabel: string;
    shareText: string;
  };
  dims: Record<string, string>;
  dimGroups: Record<string, string>;
  types: Record<
    string,
    { name: string; slogan: string; desc: string; keywords?: string; subtitle?: string }
  >;
  questions: Array<{ meta: string; text: string; options: string[] }>;
  gate: { meta: string; text: string; options: string[] };
  trigger: { meta: string; text: string; options: string[] };
};

// 加载所有 i18n 数据
const i18nData: Record<string, I18nData> = {};
for (const locale of locales) {
  const filePath = path.join(i18nDir, `${locale}.ts`);
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const module = require(filePath);
  i18nData[locale] = module.default || module;
}

const workbook = XLSX.utils.book_new();

// ===== Sheet 1: UI Strings =====
const uiRows: Array<{
  分类: string;
  键名: string;
  [key: string]: string;
}> = [];

const uiKeys: Array<{ category: string; key: string }> = [
  { category: "meta", key: "title" },
  { category: "meta", key: "description" },
  { category: "welcome", key: "badge" },
  { category: "welcome", key: "title" },
  { category: "welcome", key: "subtitle" },
  { category: "welcome", key: "startHint" },
  { category: "welcome", key: "participants" },
  { category: "welcome", key: "startButton" },
  { category: "welcome", key: "prologue1" },
  { category: "welcome", key: "prologue2" },
  { category: "welcome", key: "prologue3" },
  { category: "loading", key: "text" },
  { category: "test", key: "exit" },
  { category: "test", key: "gateBadge" },
  { category: "test", key: "triggerBadge" },
  { category: "test", key: "keyHint" },
  { category: "result", key: "archetype" },
  { category: "result", key: "hidden" },
  { category: "result", key: "border" },
  { category: "result", key: "share" },
  { category: "result", key: "copyLink" },
  { category: "result", key: "rebirth" },
  { category: "result", key: "analysis" },
  { category: "result", key: "dimAnalysis" },
  { category: "result", key: "you" },
  { category: "result", key: "ideal" },
  { category: "result", key: "statsInfo" },
  { category: "result", key: "statsShort" },
  { category: "result", key: "factorResonance" },
  { category: "result", key: "factorResonanceLabel" },
  { category: "result", key: "shareText" },
];

for (const { category, key } of uiKeys) {
  const row: Record<string, string> = {
    分类: category,
    键名: key,
  };
  for (const locale of locales) {
    row[localeNames[locale]] = (i18nData[locale] as Record<string, Record<string, string>>)[
      category
    ]?.[key] as string;
  }
  uiRows.push(row);
}

const uiSheet = XLSX.utils.json_to_sheet(uiRows);
XLSX.utils.book_append_sheet(workbook, uiSheet, "UI文案");

// ===== Sheet 2: Dimensions =====
const dimRows: Array<Record<string, string>> = [];
const dimKeys = ["S1", "S2", "S3", "F1", "F2", "F3", "B1", "B2", "B3", "W1", "W2", "W3"];
for (const key of dimKeys) {
  const row: Record<string, string> = { 维度代码: key };
  for (const locale of locales) {
    row[localeNames[locale]] = i18nData[locale].dims[key];
  }
  dimRows.push(row);
}
// Add dimGroups
for (const key of ["S", "F", "B", "W"]) {
  const row: Record<string, string> = { 维度代码: `${key} (分组)` };
  for (const locale of locales) {
    row[localeNames[locale]] = i18nData[locale].dimGroups[key];
  }
  dimRows.push(row);
}
const dimSheet = XLSX.utils.json_to_sheet(dimRows);
XLSX.utils.book_append_sheet(workbook, dimSheet, "维度");

// ===== Sheet 3: Personality Types =====
const typeKeys = [
  "EMMA",
  "SHERRY",
  "MIRIA",
  "HIRO",
  "NANOKA",
  "HANNA",
  "MERURU",
  "COCO",
  "NOAH",
  "MARGO",
  "ANAN",
  "ALISA",
  "LEIA",
  "UNSET",
  "YUKI",
  "ETL",
];
const typeRows: Array<Record<string, string>> = [];
for (const key of typeKeys) {
  const row: Record<string, string> = { 类型代码: key, 字段: "名称" };
  for (const locale of locales) {
    row[localeNames[locale]] = i18nData[locale].types[key]?.name || "";
  }
  typeRows.push(row);

  // subtitle
  const subtitleRow: Record<string, string> = { 类型代码: key, 字段: "副标题" };
  for (const locale of locales) {
    subtitleRow[localeNames[locale]] = i18nData[locale].types[key]?.subtitle || "";
  }
  if (Object.values(subtitleRow).some((v) => v && v !== key)) {
    typeRows.push(subtitleRow);
  }

  // slogan
  const sloganRow: Record<string, string> = { 类型代码: key, 字段: "标语" };
  for (const locale of locales) {
    sloganRow[localeNames[locale]] = i18nData[locale].types[key]?.slogan || "";
  }
  typeRows.push(sloganRow);

  // desc
  const descRow: Record<string, string> = { 类型代码: key, 字段: "描述" };
  for (const locale of locales) {
    descRow[localeNames[locale]] = i18nData[locale].types[key]?.desc || "";
  }
  typeRows.push(descRow);

  // keywords
  const kwRow: Record<string, string> = { 类型代码: key, 字段: "关键词" };
  for (const locale of locales) {
    kwRow[localeNames[locale]] = i18nData[locale].types[key]?.keywords || "";
  }
  if (Object.values(kwRow).some((v) => v)) {
    typeRows.push(kwRow);
  }
}
const typeSheet = XLSX.utils.json_to_sheet(typeRows);
XLSX.utils.book_append_sheet(workbook, typeSheet, "人格类型");

// ===== Sheet 4: Questions =====
const questionRows: Array<Record<string, string>> = [];
const questionCount = i18nData["zh-CN"].questions.length;

for (let i = 0; i < questionCount; i++) {
  // meta
  const metaRow: Record<string, string> = { 题号: `Q${i + 1}`, 字段: "元信息" };
  for (const locale of locales) {
    metaRow[localeNames[locale]] = i18nData[locale].questions[i]?.meta || "";
  }
  questionRows.push(metaRow);

  // text
  const textRow: Record<string, string> = { 题号: `Q${i + 1}`, 字段: "题目" };
  for (const locale of locales) {
    textRow[localeNames[locale]] = i18nData[locale].questions[i]?.text || "";
  }
  questionRows.push(textRow);

  // options
  const optionCount = i18nData["zh-CN"].questions[i]?.options?.length || 0;
  for (let j = 0; j < optionCount; j++) {
    const optRow: Record<string, string> = { 题号: `Q${i + 1}`, 字段: `选项${j + 1}` };
    for (const locale of locales) {
      optRow[localeNames[locale]] = i18nData[locale].questions[i]?.options?.[j] || "";
    }
    questionRows.push(optRow);
  }
}

// Gate question
const gateMetaRow: Record<string, string> = { 题号: "GATE", 字段: "元信息" };
for (const locale of locales) {
  gateMetaRow[localeNames[locale]] = i18nData[locale].gate?.meta || "";
}
questionRows.push(gateMetaRow);

const gateTextRow: Record<string, string> = { 题号: "GATE", 字段: "题目" };
for (const locale of locales) {
  gateTextRow[localeNames[locale]] = i18nData[locale].gate?.text || "";
}
questionRows.push(gateTextRow);

const gateOptionCount = i18nData["zh-CN"].gate?.options?.length || 0;
for (let j = 0; j < gateOptionCount; j++) {
  const optRow: Record<string, string> = { 题号: "GATE", 字段: `选项${j + 1}` };
  for (const locale of locales) {
    optRow[localeNames[locale]] = i18nData[locale].gate?.options?.[j] || "";
  }
  questionRows.push(optRow);
}

// Trigger question
const triggerMetaRow: Record<string, string> = { 题号: "TRIGGER", 字段: "元信息" };
for (const locale of locales) {
  triggerMetaRow[localeNames[locale]] = i18nData[locale].trigger?.meta || "";
}
questionRows.push(triggerMetaRow);

const triggerTextRow: Record<string, string> = { 题号: "TRIGGER", 字段: "题目" };
for (const locale of locales) {
  triggerTextRow[localeNames[locale]] = i18nData[locale].trigger?.text || "";
}
questionRows.push(triggerTextRow);

const triggerOptionCount = i18nData["zh-CN"].trigger?.options?.length || 0;
for (let j = 0; j < triggerOptionCount; j++) {
  const optRow: Record<string, string> = { 题号: "TRIGGER", 字段: `选项${j + 1}` };
  for (const locale of locales) {
    optRow[localeNames[locale]] = i18nData[locale].trigger?.options?.[j] || "";
  }
  questionRows.push(optRow);
}

const questionSheet = XLSX.utils.json_to_sheet(questionRows);
XLSX.utils.book_append_sheet(workbook, questionSheet, "题目");

// Write to file
const outputPath = path.join(process.cwd(), "witch-trial-i18n.xlsx");
XLSX.writeFile(workbook, outputPath);
console.log(`✅ 导出完成: ${outputPath}`);
console.log(`   - UI文案: ${uiRows.length} 行`);
console.log(`   - 维度: ${dimRows.length} 行`);
console.log(`   - 人格类型: ${typeRows.length} 行`);
console.log(`   - 题目: ${questionRows.length} 行`);
