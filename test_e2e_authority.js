const puppeteer = require("./frontend/node_modules/puppeteer-core");

async function runAudit() {
  console.log("=== STARTING CYCLONEX AUTHORITY FRESH LOAD & LIFECYCLE AUDIT ===");

  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--window-size=1280,800"
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const consoleLogs = [];
  const consoleErrors = [];
  const consoleWarnings = [];

  page.on("console", (msg) => {
    const text = msg.text();
    const type = msg.type();
    consoleLogs.push({ type, text });
    if (type === "error") {
      consoleErrors.push(text);
    } else if (type === "warning") {
      consoleWarnings.push(text);
    }
  });

  page.on("pageerror", (err) => {
    consoleErrors.push(`PageError: ${err.message}`);
  });

  try {
    // -------------------------------------------------------------
    // TEST 1: HARD FRESH LOAD OF /authority
    // -------------------------------------------------------------
    console.log("\n[TEST 1] Performing hard fresh load of http://localhost:3000/authority ...");
    await page.goto("http://localhost:3000/authority", {
      waitUntil: "networkidle0",
      timeout: 30000
    });

    // Wait until MapLibre is initialized and basemap style loaded
    await page.waitForFunction(() => {
      return window.__map && typeof window.__map.isStyleLoaded === "function" && window.__map.isStyleLoaded();
    }, { timeout: 10000 });

    // Allow async render layers to settle
    await new Promise((r) => setTimeout(r, 2000));

    const freshLoadState = await page.evaluate(() => {
      const map = window.__map;
      if (!map) return { error: "window.__map not found" };

      const layers = map.getStyle().layers.map((l) => l.id);
      const markers = document.querySelectorAll(".maplibregl-marker");
      const markerIcons = Array.from(markers).map((m) => m.textContent.trim());

      return {
        selectedScenario: document.querySelector("select") ? document.querySelector("select").value : null,
        layers: {
          hasEsriBasemap: layers.includes("esri-dark-layer"),
          hasTrackLine: layers.includes("track-line-layer"),
          hasSwath34: layers.includes("swath-34-layer"),
          hasSwath50: layers.includes("swath-50-layer"),
          hasSwath64: layers.includes("swath-64-layer"),
          hasSurge: layers.includes("surge-layer"),
        },
        markerCount: markers.length,
        markerIconsSample: markerIcons.slice(0, 5),
        allLayerIds: layers.filter((id) => !id.includes("esri")),
      };
    });

    console.log("FRESH LOAD RESULT (Default Michaung):", JSON.stringify(freshLoadState, null, 2));

    // -------------------------------------------------------------
    // TEST 2: SCENARIO SWITCH -> Cyclone Hudhud (2014)
    // -------------------------------------------------------------
    console.log("\n[TEST 2] Switching scenario dropdown to Cyclone Hudhud 2014 ...");
    await page.select("select", "cyclone_hudhud_2014");

    // Wait 2.5s for API call and renderLayers
    await new Promise((r) => setTimeout(r, 2500));

    const hudhudState = await page.evaluate(() => {
      const map = window.__map;
      const layers = map.getStyle().layers.map((l) => l.id);
      const markers = document.querySelectorAll(".maplibregl-marker");

      return {
        selectedScenario: document.querySelector("select") ? document.querySelector("select").value : null,
        layers: {
          hasEsriBasemap: layers.includes("esri-dark-layer"),
          hasTrackLine: layers.includes("track-line-layer"),
          hasSwath34: layers.includes("swath-34-layer"),
          hasSwath50: layers.includes("swath-50-layer"),
          hasSwath64: layers.includes("swath-64-layer"), // MUST BE TRUE FOR HUDHUD
          hasSurge: layers.includes("surge-layer"),
        },
        markerCount: markers.length,
        allLayerIds: layers.filter((id) => !id.includes("esri")),
      };
    });

    console.log("HUDHUD SCENARIO SWITCH RESULT:", JSON.stringify(hudhudState, null, 2));

    // -------------------------------------------------------------
    // TEST 3: SCENARIO SWITCH BACK -> Cyclone Michaung (2023)
    // -------------------------------------------------------------
    console.log("\n[TEST 3] Switching scenario back to Cyclone Michaung 2023 ...");
    await page.select("select", "cyclone_michaung_2023");

    // Wait 2.5s for API call and renderLayers
    await new Promise((r) => setTimeout(r, 2500));

    const michaungReturnState = await page.evaluate(() => {
      const map = window.__map;
      const layers = map.getStyle().layers.map((l) => l.id);
      const markers = document.querySelectorAll(".maplibregl-marker");

      return {
        selectedScenario: document.querySelector("select") ? document.querySelector("select").value : null,
        layers: {
          hasEsriBasemap: layers.includes("esri-dark-layer"),
          hasTrackLine: layers.includes("track-line-layer"),
          hasSwath34: layers.includes("swath-34-layer"),
          hasSwath50: layers.includes("swath-50-layer"),
          hasSwath64: layers.includes("swath-64-layer"), // MUST BE FALSE (REMOVED) FOR MICHAUNG
          hasSurge: layers.includes("surge-layer"),
        },
        markerCount: markers.length,
        allLayerIds: layers.filter((id) => !id.includes("esri")),
      };
    });

    console.log("MICHAUNG RETURN SWITCH RESULT:", JSON.stringify(michaungReturnState, null, 2));

    // -------------------------------------------------------------
    // TEST 4: HARD BROWSER REFRESH / RELOAD
    // -------------------------------------------------------------
    console.log("\n[TEST 4] Performing hard browser page reload ...");
    await page.reload({ waitUntil: "networkidle0", timeout: 30000 });

    await page.waitForFunction(() => {
      return window.__map && typeof window.__map.isStyleLoaded === "function" && window.__map.isStyleLoaded();
    }, { timeout: 10000 });

    await new Promise((r) => setTimeout(r, 2000));

    const postReloadState = await page.evaluate(() => {
      const map = window.__map;
      const layers = map.getStyle().layers.map((l) => l.id);
      const markers = document.querySelectorAll(".maplibregl-marker");

      return {
        selectedScenario: document.querySelector("select") ? document.querySelector("select").value : null,
        layers: {
          hasEsriBasemap: layers.includes("esri-dark-layer"),
          hasTrackLine: layers.includes("track-line-layer"),
          hasSwath34: layers.includes("swath-34-layer"),
          hasSwath50: layers.includes("swath-50-layer"),
          hasSwath64: layers.includes("swath-64-layer"),
          hasSurge: layers.includes("surge-layer"),
        },
        markerCount: markers.length,
        allLayerIds: layers.filter((id) => !id.includes("esri")),
      };
    });

    console.log("POST-RELOAD FRESH DEFAULT RESULT:", JSON.stringify(postReloadState, null, 2));

    // -------------------------------------------------------------
    // TEST 5: CONSOLE ERRORS & WARNINGS SUMMARY
    // -------------------------------------------------------------
    console.log("\n[TEST 5] Checking console errors and warnings ...");
    console.log(`Total console logs: ${consoleLogs.length}`);
    console.log(`Total console warnings: ${consoleWarnings.length}`);
    console.log(`Total console errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.log("Console Errors:", consoleErrors);
    }
    if (consoleWarnings.length > 0) {
      console.log("Console Warnings:", consoleWarnings);
    }

    console.log("\n=== ALL AUDIT CHECKS COMPLETED ===");
  } catch (err) {
    console.error("FATAL ERROR DURING AUDIT:", err);
  } finally {
    await browser.close();
  }
}

runAudit();
