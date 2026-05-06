/**
 * One-time script to create the LINE Rich Menu (圖文選單).
 * Run with: npx tsx scripts/setup-richmenu.ts
 *
 * Requires LINE_CHANNEL_ACCESS_TOKEN in .env
 */
import "dotenv/config";
import { chromium } from "playwright";

const ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
if (!ACCESS_TOKEN) throw new Error("LINE_CHANNEL_ACCESS_TOKEN not set in .env");

const WEB_APP_URL = "https://flight-price-tracker-production-e34e.up.railway.app";

const HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 2500px;
      height: 843px;
      display: flex;
      font-family: 'PingFang TC', 'Noto Sans CJK TC', 'Microsoft JhengHei', system-ui, sans-serif;
      overflow: hidden;
    }
    .panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 28px;
      user-select: none;
    }
    .left {
      background: #F24822;
      border-right: 3px solid rgba(255,255,255,0.2);
    }
    .right {
      background: #111827;
    }
    .icon {
      font-size: 100px;
      line-height: 1;
    }
    .title {
      font-size: 68px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: 0.03em;
      text-align: center;
    }
    .sub {
      font-size: 38px;
      color: rgba(255,255,255,0.65);
      text-align: center;
      letter-spacing: 0.02em;
    }
  </style>
</head>
<body>
  <div class="panel left">
    <div class="icon">🗺️</div>
    <div class="title">新增及管理路線</div>
    <div class="sub">前往 Flighty 網站</div>
  </div>
  <div class="panel right">
    <div class="icon">🔄</div>
    <div class="title">刷新價格</div>
    <div class="sub">取得最新票價資訊</div>
  </div>
</body>
</html>`;

async function generateImage(): Promise<Buffer> {
  console.log("Launching browser to render rich menu image...");
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 2500, height: 843 });
  await page.setContent(HTML, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  const screenshot = await page.screenshot({ type: "png" });
  await browser.close();
  console.log(`Image generated (${screenshot.length} bytes)`);
  return Buffer.from(screenshot);
}

async function createRichMenu(): Promise<string> {
  console.log("Creating rich menu structure...");
  const body = {
    size: { width: 2500, height: 843 },
    selected: true,
    name: "Flighty Menu",
    chatBarText: "選單",
    areas: [
      {
        bounds: { x: 0, y: 0, width: 1250, height: 843 },
        action: { type: "uri", uri: WEB_APP_URL, label: "新增及管理路線" },
      },
      {
        bounds: { x: 1250, y: 0, width: 1250, height: 843 },
        action: { type: "message", text: "refresh", label: "刷新價格" },
      },
    ],
  };

  const res = await fetch("https://api.line.me/v2/bot/richmenu", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`createRichMenu failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { richMenuId: string };
  console.log(`Rich menu created: ${data.richMenuId}`);
  return data.richMenuId;
}

async function uploadImage(richMenuId: string, imageBuffer: Buffer): Promise<void> {
  console.log("Uploading image...");
  const res = await fetch(
    `https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`,
    {
      method: "POST",
      headers: {
        "Content-Type": "image/png",
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      body: imageBuffer as unknown as BodyInit,
    }
  );

  if (!res.ok) {
    throw new Error(`uploadImage failed: ${res.status} ${await res.text()}`);
  }
  console.log("Image uploaded.");
}

async function setDefaultMenu(richMenuId: string): Promise<void> {
  console.log("Setting as default rich menu for all users...");
  const res = await fetch(
    `https://api.line.me/v2/bot/user/all/richmenu/${richMenuId}`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
    }
  );

  if (!res.ok) {
    throw new Error(`setDefaultMenu failed: ${res.status} ${await res.text()}`);
  }
  console.log("Default rich menu set.");
}

async function main() {
  const image = await generateImage();
  const richMenuId = await createRichMenu();
  await uploadImage(richMenuId, image);
  await setDefaultMenu(richMenuId);
  console.log("\n✅ Rich menu setup complete!");
  console.log("   New users will see the menu immediately.");
  console.log("   Existing chat rooms may need the user to restart the app.");
}

main().catch((err) => {
  console.error("\n❌ Setup failed:", err.message);
  process.exit(1);
});
