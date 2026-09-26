// 公開URLをブラウザで開き、読み込みエラーと検索の動作を確かめる。
// 使い方: node scripts/verify_site.mjs <URL>
import { chromium } from "playwright";

const url = process.argv[2];
if (!url) { console.error("URL を指定してください"); process.exit(2); }

// デプロイ直後は反映まで少しかかるので、トップが 200 になるまで待つ
for (let i = 0; ; i++) {
  const r = await fetch(url, { cache: "no-store" }).catch(() => null);
  if (r && r.status === 200) break;
  if (i >= 30) { console.error("トップページが 200 にならない:", r && r.status); process.exit(1); }
  await new Promise(res => setTimeout(res, 10000));
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
const problems = [];
const loaded = [];
page.on("response", r => {
  if (r.status() >= 400) problems.push(`HTTP ${r.status()} ${r.url()}`);
  else if (r.url().includes("/data/")) loaded.push(r.url().split("/").pop());
});
page.on("requestfailed", r => problems.push(`読み込み失敗 ${r.url()} ${r.failure()?.errorText}`));
page.on("pageerror", e => problems.push(`ページのエラー ${e.message}`));
page.on("console", m => { if (m.type() === "error") problems.push(`console.error ${m.text()}`); });

await page.goto(url, { waitUntil: "load" });
// ページのスクリプトが全データを読み終えるまで待つ（#loading は最初から hidden なので目印にしない）
await page.waitForFunction(() => typeof S !== "undefined" && S.allLoaded === true, null, { timeout: 120000 });

const results = {};
await page.fill("#q", "空き家");
await page.press("#q", "Enter");
for (const tab of ["ronten", "block", "speech"]) {
  await page.click(`#tab-${tab}`);
  await page.waitForTimeout(700);
  results[tab] = (await page.textContent("#count")).trim();
}
await page.click(".card");
await page.waitForSelector("#panel:not([hidden])");
results.detail = (await page.textContent("#pTitle")).trim();
await page.click("#pClose");

await page.click('[data-view="map"]');
results.mapCheck = (await page.textContent("#mapCheck")).trim();
await page.click('[data-cell="14|2018"]');
await page.waitForTimeout(500);
results.mapCell = (await page.textContent("#cellList h3")).trim();

await page.click('[data-view="pick"]');
await page.waitForTimeout(300);
results.pick = (await page.textContent("#pickBody .mono")).trim();
results.title = await page.title();
await browser.close();

console.log("読み込んだデータファイル:", loaded.length, "件");
console.log(JSON.stringify(results, null, 2));
const n = s => Number((s.match(/[\d,]+/) || ["0"])[0].replace(/,/g, ""));
if (loaded.length !== 18) problems.push(`データファイルが18件そろっていない（${loaded.length}件）`);
const total = { ronten: 1190, block: 473, speech: 40573 };
for (const t of ["ronten", "block", "speech"]) {
  const v = n(results[t]);
  if (!(v > 0 && v < total[t])) problems.push(`「空き家」の${t}の件数がおかしい（${results[t]}）`);
}
if (!results.mapCheck.includes("一致")) problems.push("地図の検算が一致していない: " + results.mapCheck);
if (!results.mapCell.includes("19論点")) problems.push("地図 14×2018年度 が19論点でない: " + results.mapCell);
if (problems.length) { console.error("問題:\n" + problems.join("\n")); process.exit(1); }
console.log("OK: 404・読み込みエラーなし。検索・地図・注目の質疑が動いた。");
