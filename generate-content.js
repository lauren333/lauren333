// node generate-content.js 

// Importing chromium functionalities from playwright package
// Chromium renders the css js html into a browser instance
// Playwright lets us create/host page within the browser 
// to render diff components + screenshot 
const { chromium } = require("playwright");
// Path to find image files, fs to write
const fs = require("fs");
const path = require("path");

// Async functions so browser runs/renders/etc will awaiting specific data / executions
(async () => {

  // ---- CARDS AND TITLES ----- 
  // Launch chromium browser  
  const browser = await chromium.launch({ headless: true });
  // Create new page 
  const page = await browser.newPage({
    viewport: { width: 1200, height: 900 },
    deviceScaleFactor: 2
  });

  // Get file path, go to and wait for fonts to load first
  const htmlPath = path.resolve(__dirname, "projects.html");
  await page.goto(`file://${htmlPath}`);
  await page.evaluate(() => document.fonts.ready);

  // Finds all html card elements and gather into array 
  const cards = await page.locator(".project-card").all();

  // Finds all section titles elements and gather into array 
  const titles = await page.locator(".section-title").all();
  
  // Create output destination (folder) for cards
  const outputDir = path.join(__dirname, "project-cards");

  // If doesnt exist create it, if recursive is true make any parent folders, wont throw error if already exists
  fs.mkdirSync(outputDir, { recursive: true });

  // Process each card  
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const filename = `project-${i + 1}.png`;
    // Screenshot is playwright function, save image as png
    const png = await card.screenshot({ type: "png"});
    // Builds file path and saves file (png)
    fs.writeFileSync(path.join(outputDir, filename), png);
    console.log(`Generated ${filename}`); 
  }

  // Make the page background transparent 
  // evaluate: run js within browser instance where page lives
  await page.evaluate(() => {
      document.body.style.background = "transparent";
      document.documentElement.style.background = "transparent";
  });

  // process each title
  for (let i = 0; i<titles.length; i++){
    const title= titles[i]; 
    const filename = `title-${i + 1}.png`; 
    const png = await title.screenshot({ type: "png", omitBackground: true })
    fs.writeFileSync(path.join(outputDir,filename),png)
    console.log(`Generated ${filename}`);
  }

  // ---- SKILLS CARD ----
  const skillsPath = path.resolve(__dirname, "skills.html");
  // Reuse same browser page we created but we render new html + load fonts
  await page.goto(`file://${skillsPath}`);
  await page.evaluate(() => document.fonts.ready);

  // Icons are loaded from a CDN so wait for the network to settle
  await page.waitForLoadState("networkidle");

  // Wait for every icon image to finish loading before screenshotting
  // If icon done loading skip, if it hasnt then when image load or fails return 
  await page.evaluate(() =>
    Promise.all(
      [...document.images].map(img =>
        img.complete ?
        null : new Promise(r => { img.onload = img.onerror = r; })
      )
    )
  );

  // goto reloads the page so the transparent background needs to be set again
  // only the rounded card will show, no dark box around it
  await page.evaluate(() => {
      document.body.style.background = "transparent";
      document.documentElement.style.background = "transparent";
  });

  // Find the skills card and screenshot it, saved in the same output folder
  const skills = page.locator(".skills-card");
  const skillsPng = await skills.screenshot({ type: "png", omitBackground: true });
  fs.writeFileSync(path.join(outputDir, "skills.png"), skillsPng);
  console.log("Generated skills.png");

  // ---- CONTACT PILLS ----
  // Go to the contacts page and wait for fonts + icons to load
  const contactsPath = path.resolve(__dirname, "header.html");
  await page.goto(`file://${contactsPath}`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState("networkidle");

  // Make the page background transparent again after navigating
  await page.evaluate(() => {
      document.body.style.background = "transparent";
      document.documentElement.style.background = "transparent";
  });

  // Each pill has a data-out attribute (info, email, linkedin) used as its filename
  const pills = await page.locator("[data-out]").all();
  for (const pill of pills) {
    const name = await pill.getAttribute("data-out");
    const png = await pill.screenshot({ type: "png", omitBackground: true });
    fs.writeFileSync(path.join(outputDir, `${name}.png`), png);
    console.log(`Generated ${name}.png`);
  }

  await browser.close();
})();