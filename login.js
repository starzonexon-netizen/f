// test-meta-login.js
import puppeteer from "puppeteer";
import fs from "fs/promises";

async function main() {
  // 1. Baca cookies dari file
  const raw = await fs.readFile("./meta_cookies.json", "utf-8");
  const exportedCookies = JSON.parse(raw);

  // 2. Konversi ke format cookie Puppeteer
  const puppeteerCookies = exportedCookies.map((c) => ({
    name: c.name,
    value: c.value,
    domain: c.domain || ".meta.ai",
    path: c.path || "/",
    httpOnly: !!c.httpOnly,
    secure: !!c.secure,
    sameSite: c.sameSite === "no_restriction"
      ? "None"
      : c.sameSite === "lax"
      ? "Lax"
      : c.sameSite === "strict"
      ? "Strict"
      : "Lax",
    expires: c.expirationDate ? Math.floor(c.expirationDate) : -1
  }));

  // 3. Launch browser (untuk HuggingFace tambahin no-sandbox)
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  // 4. Set cookies sebelum buka meta.ai
  await page.setCookie(...puppeteerCookies);

  // 5. Buka Meta AI dengan session tersebut
  await page.goto("https://www.meta.ai", {
    waitUntil: "networkidle2"
  });

  const url = page.url();
  const title = await page.title();

  console.log("Current URL:", url);
  console.log("Page title:", title);

  // Optionally: cek apakah ada elemen chat (indikasi logged in)
  try {
    // ganti selector sesuai yang nanti kamu temukan
    await page.waitForSelector("textarea, [contenteditable='true']", {
      timeout: 5000
    });
    console.log("Sepertinya input chat muncul (mungkin sudah login).");
  } catch {
    console.log("Input chat tidak ditemukan cepat, mungkin belum login / UI beda.");
  }

  // Simpan screenshot buat ngecek (kalau bisa lihat file di HF)
  try {
    await page.screenshot({ path: "meta-test.png", fullPage: true });
    console.log("Screenshot disimpan ke meta-test.png");
  } catch (e) {
    console.log("Gagal simpan screenshot (boleh di-skip di HF):", e.message);
  }

  await browser.close();
}

main().catch((err) => {
  console.error("Error test login:", err);
  process.exit(1);
});
