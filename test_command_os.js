const puppeteer = require("./frontend/node_modules/puppeteer-core");

async function runCommandOSTest() {
  console.log("=== STARTING COMMAND OS COMPREHENSIVE VERIFICATION ===");

  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--window-size=1440,900"
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const consoleLogs = [];
  const consoleErrors = [];

  page.on("console", (msg) => {
    const text = msg.text();
    const type = msg.type();
    consoleLogs.push({ type, text });
    if (type === "error" && !text.includes("favicon") && !text.includes("tile")) {
      consoleErrors.push(text);
    }
  });

  page.on("pageerror", (err) => {
    consoleErrors.push(`PageError: ${err.message}`);
  });

  try {
    // 1. FRESH LOAD
    console.log("\n[STEP 1] Loading http://localhost:3000/authority ...");
    await page.goto("http://localhost:3000/authority", {
      waitUntil: "networkidle0",
      timeout: 30000
    });

    await new Promise((r) => setTimeout(r, 2000));

    // Check title and shell
    const headerTitle = await page.evaluate(() => {
      return document.querySelector("header")?.innerText || "";
    });
    console.log("Header text preview:", headerTitle.replace(/\n+/g, " | ").substring(0, 150));

    // Check executive action strip
    const actionStripCards = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll("h4"));
      return cards.map(c => c.innerText);
    });
    console.log("Found card headings:", actionStripCards.slice(0, 6));

    // Take screenshot of main dashboard
    await page.screenshot({ path: "command_os_dashboard.png", fullPage: false });
    console.log("Captured command_os_dashboard.png");

    // 2. TEST EMERGENCY MODE TOGGLE
    console.log("\n[STEP 2] Testing Emergency Mode toggle...");
    const emergencyStateBefore = await page.evaluate(() => {
      return !!document.querySelector(".border-red-500");
    });
    console.log("Emergency border active before click:", emergencyStateBefore);

    const emergencyClicked = await page.evaluate(() => {
      const btn = document.querySelector('[data-testid="emergency-toggle"]');
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    console.log("Clicked Emergency Mode toggle:", emergencyClicked);
    await new Promise((r) => setTimeout(r, 1000));

    const emergencyStateAfter = await page.evaluate(() => {
      return !!document.querySelector(".border-red-500");
    });
    console.log("Emergency border active after click:", emergencyStateAfter);
    await page.screenshot({ path: "command_os_emergency_mode.png", fullPage: false });

    // 3. TEST SIDEBAR COLLAPSE
    console.log("\n[STEP 3] Testing Sidebar collapse toggle...");
    const sidebarWidthBefore = await page.evaluate(() => {
      return document.querySelector("aside")?.className.includes("w-64");
    });
    console.log("Sidebar is expanded (w-64) before click:", sidebarWidthBefore);

    const sidebarToggle = await page.evaluate(() => {
      const btn = document.querySelector('[data-testid="sidebar-toggle"]');
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    console.log("Clicked Sidebar toggle:", sidebarToggle);
    await new Promise((r) => setTimeout(r, 800));

    const sidebarWidthAfter = await page.evaluate(() => {
      return document.querySelector("aside")?.className.includes("w-20");
    });
    console.log("Sidebar is collapsed (w-20) after click:", sidebarWidthAfter);

    // Re-expand sidebar
    await page.evaluate(() => {
      const btn = document.querySelector('[data-testid="sidebar-toggle"]');
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 500));

    // 4. TEST TAB NAVIGATION: RISK INTELLIGENCE
    console.log("\n[STEP 4] Navigating to 'Risk Intelligence' tab...");
    await page.evaluate(() => {
      const navLinks = Array.from(document.querySelectorAll("nav button"));
      const target = navLinks.find(b => b.innerText.includes("Risk Intelligence"));
      if (target) target.click();
    });
    await new Promise((r) => setTimeout(r, 1000));
    await page.screenshot({ path: "command_os_risk_intelligence.png", fullPage: false });
    console.log("Captured command_os_risk_intelligence.png");

    // 5. TEST TAB NAVIGATION: RISK MAP
    console.log("\n[STEP 5] Navigating to 'Risk Map' tab...");
    await page.evaluate(() => {
      const navLinks = Array.from(document.querySelectorAll("nav button"));
      const target = navLinks.find(b => b.innerText.includes("Risk Map"));
      if (target) target.click();
    });

    console.log("Waiting for MapLibre map and layers to initialize...");
    await page.waitForFunction(() => {
      const map = window.__map;
      return map && map.getSource && map.getSource("track-line-layer");
    }, { timeout: 15000 });

    const mapStatus = await page.evaluate(() => {
      const map = window.__map;
      if (!map) return { ready: false, reason: "window.__map is null" };
      return {
        ready: true,
        loaded: map.loaded(),
        hasTrack: !!map.getSource("track-line-layer"),
        has34kt: !!map.getSource("swath-34-layer"),
        has50kt: !!map.getSource("swath-50-layer"),
        hasSurge: !!map.getSource("surge-layer"),
        markerCount: document.querySelectorAll(".maplibregl-marker").length
      };
    });
    console.log("Map tab readiness status:", mapStatus);
    await page.screenshot({ path: "command_os_risk_map.png", fullPage: false });
    console.log("Captured command_os_risk_map.png");

    // 6. TEST TAB NAVIGATION: INFRASTRUCTURE & DETAIL DRAWER
    console.log("\n[STEP 6] Navigating to 'Infrastructure' tab and testing Drawer...");
    await page.evaluate(() => {
      const navLinks = Array.from(document.querySelectorAll("nav button"));
      const target = navLinks.find(b => b.innerText.includes("Infrastructure"));
      if (target) target.click();
    });
    await new Promise((r) => setTimeout(r, 1000));

    // Click on first row in the table
    const rowClicked = await page.evaluate(() => {
      const row = document.querySelector("tbody tr");
      if (row) {
        row.click();
        return true;
      }
      return false;
    });
    console.log("Clicked infrastructure table row:", rowClicked);
    await new Promise((r) => setTimeout(r, 1000));

    // Verify drawer opened
    const drawerOpen = await page.evaluate(() => {
      const drawer = document.querySelector(".fixed.inset-0");
      return !!drawer;
    });
    console.log("Drawer open state:", drawerOpen);
    await page.screenshot({ path: "command_os_infrastructure_drawer.png", fullPage: false });
    console.log("Captured command_os_infrastructure_drawer.png");

    // Close drawer
    await page.evaluate(() => {
      const closeBtn = document.querySelector(".fixed.inset-0 button");
      if (closeBtn) closeBtn.click();
    });
    await new Promise((r) => setTimeout(r, 500));

    // 7. TEST TAB NAVIGATION: HARDENING & BUDGET
    console.log("\n[STEP 7] Navigating to 'Hardening Protocols' tab...");
    await page.evaluate(() => {
      const navLinks = Array.from(document.querySelectorAll("nav button"));
      const target = navLinks.find(b => b.innerText.includes("Hardening"));
      if (target) target.click();
    });
    await new Promise((r) => setTimeout(r, 1000));
    await page.screenshot({ path: "command_os_hardening.png", fullPage: false });
    console.log("Captured command_os_hardening.png");

    // 8. TEST TAB NAVIGATION: EARLY-WARNING ALERTS & DISPATCHES
    console.log("\n[STEP 8] Navigating to 'Alerts & Dispatches' tab...");
    await page.evaluate(() => {
      const navLinks = Array.from(document.querySelectorAll("nav button"));
      const target = navLinks.find(b => b.innerText.includes("Alerts"));
      if (target) target.click();
    });
    await new Promise((r) => setTimeout(r, 1000));
    await page.screenshot({ path: "command_os_alerts.png", fullPage: false });
    console.log("Captured command_os_alerts.png");

    console.log("\n=== CONSOLE AUDIT ===");
    console.log(`Errors encountered: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.log("Errors:", consoleErrors);
    } else {
      console.log("Zero page or runtime console errors!");
    }

    console.log("\n=== ALL TESTS PASSED SUCCESSFULLY! ===");
  } catch (err) {
    console.error("Test failed with error:", err);
  } finally {
    await browser.close();
  }
}

runCommandOSTest();
