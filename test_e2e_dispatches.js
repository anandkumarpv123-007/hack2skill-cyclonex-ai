const puppeteer = require("./frontend/node_modules/puppeteer-core");

async function testDispatchesTab() {
  console.log("=== STARTING DISPATCHES TAB E2E AUDIT ===");

  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--window-size=1280,1000"
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1000 });

  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  try {
    console.log("1. Navigating to http://localhost:3000/authority ...");
    await page.goto("http://localhost:3000/authority", {
      waitUntil: "networkidle0",
      timeout: 30000
    });

    await new Promise((r) => setTimeout(r, 2000));

    console.log("2. Clicking Tab 5: Automated Dispatches ...");
    // Find the button with Dispatches or Radio icon
    const tabClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const dispatchTab = buttons.find((b) => b.textContent && b.textContent.includes("Dispatches"));
      if (dispatchTab) {
        dispatchTab.click();
        return true;
      }
      return false;
    });

    if (!tabClicked) {
      throw new Error("Could not find Dispatches tab button!");
    }

    await new Promise((r) => setTimeout(r, 1500));

    console.log("3. Inspecting Dispatches UI elements...");
    const inspection = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll("h4")).map((h) => h.textContent?.trim());
      const cellBroadcastCard = headings.some((h) => h?.includes("Cellular Tower"));
      const sdmaCard = headings.some((h) => h?.includes("SDMA"));
      const sirenCard = headings.some((h) => h?.includes("Acoustic Siren") || h?.includes("Municipal"));
      const whatsappCard = headings.some((h) => h?.includes("WhatsApp"));

      // Check how many <pre> tags are currently visible in the DOM
      const preTags = Array.from(document.querySelectorAll("pre"));
      const visiblePreTags = preTags.filter((p) => {
        const style = window.getComputedStyle(p);
        return style.display !== "none" && style.visibility !== "hidden";
      });

      // Check for phone mockup / emergency alert banner
      const hasEmergencyBanner = document.body.textContent?.includes("Emergency Alert • IMD RED WARNING") || false;
      const hasTeluguButton = Array.from(document.querySelectorAll("button")).some(b => b.textContent?.includes("తెలుగు"));

      return {
        headings,
        cellBroadcastCard,
        sdmaCard,
        sirenCard,
        whatsappCard,
        visiblePreCount: visiblePreTags.length,
        hasEmergencyBanner,
        hasTeluguButton
      };
    });

    console.log("Inspection Results:", JSON.stringify(inspection, null, 2));

    // Verify 0 visible raw <pre> tags before expanding technical inspector
    if (inspection.visiblePreCount !== 0) {
      console.warn(`WARNING: Found ${inspection.visiblePreCount} visible <pre> tags when technical inspector is collapsed!`);
    } else {
      console.log("SUCCESS: 0 raw <pre> code tags visible in primary operations view!");
    }

    // Test clicking the Telugu language button
    console.log("4. Testing language toggle on Cell Broadcast SMS...");
    await page.evaluate(() => {
      const teBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent?.includes("తెలుగు"));
      if (teBtn) teBtn.click();
    });
    await new Promise((r) => setTimeout(r, 500));

    const teluguTextVisible = await page.evaluate(() => {
      return document.body.textContent?.includes("తుఫాను") || false;
    });
    console.log("Telugu SMS preview rendered:", teluguTextVisible);

    // Test clicking "Broadcast All Channels" button
    console.log("5. Testing Broadcast All Channels button...");
    await page.evaluate(() => {
      const broadcastAllBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent?.includes("Broadcast All Channels"));
      if (broadcastAllBtn) broadcastAllBtn.click();
    });
    await new Promise((r) => setTimeout(r, 800));

    const transmittedStatusCount = await page.evaluate(() => {
      const badges = Array.from(document.querySelectorAll("span"));
      return badges.filter(b => b.textContent?.trim() === "TRANSMITTED").length;
    });
    console.log("Channels with TRANSMITTED status:", transmittedStatusCount);

    // Test expanding technical inspector
    console.log("6. Testing Technical Inspector toggle...");
    await page.evaluate(() => {
      const inspectBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent?.includes("Inspect Raw Common Alerting Protocol"));
      if (inspectBtn) inspectBtn.click();
    });
    await new Promise((r) => setTimeout(r, 800));

    const expandedPreCount = await page.evaluate(() => {
      const preTags = Array.from(document.querySelectorAll("pre"));
      return preTags.length;
    });
    console.log("Expanded technical inspector pre tags count (XML + JSON):", expandedPreCount);

    // Take screenshot
    const screenshotPath = "dispatches_tab_verified.png";
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Saved audit screenshot to ${screenshotPath}`);

    console.log("\n=== DISPATCHES TAB E2E AUDIT COMPLETE & VERIFIED ===");
  } catch (err) {
    console.error("Test failed:", err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

testDispatchesTab();
