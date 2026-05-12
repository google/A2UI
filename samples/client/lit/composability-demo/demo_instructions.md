# A2UI Compile-Time Catalog Composition — Presentation Demo Guide

This document provides a complete, step-by-step guide to delivering a flawless, high-impact presentation of the **A2UI Compile-Time Catalog Architecture**. It showcases our transition from insecure runtime dynamic loading to a robust, safe, pre-build static compilation paradigm.

---

## 📋 Core Presentation Pitch
> *"Traditionally, loading custom widgets dynamically into client applications required insecure runtime javascript execution or complex remote bundle loading. With the new A2UI Compile-Time Catalog Compiler, we move catalog ingestion entirely to the pre-build phase. Administrative catalog additions are parsed, verified against a strict domain security whitelist, and generated as type-safe static imports. This guarantees 100% security, platform-agnostic consistency (Web, iOS, Android), and maximum rendering performance."*

---

## 🛠️ Phase 1: Baseline Startup Configuration

1. **Show Whitelist Security Configuration**:
   * Open [config/whitelist.json](file:///Users/mandard/work/agents/a2ui/samples/client/lit/composability-demo/config/whitelist.json) on your screen.
   * *Explain*: *"We protect our developer pipeline using a declarative domain whitelist. Only components from these trusted domains are allowed to compile."*

2. **Show Ingested Target Catalogs**:
   * Open [config/catalogs.json](file:///Users/mandard/work/agents/a2ui/samples/client/lit/composability-demo/config/catalogs.json).
   * *Explain*: *"Initially, our app starts in a minimal state. Only the Basic Primitive catalog is registered."*

3. **Navigate to the Browser**:
   * Open [http://localhost:8000/](http://localhost:8000/).
   * *Explain*: *"Notice that only the 'Basic Catalog (Primitives)' button is active. The component registry contains only baseline layout items like Text, Button, Column, and Row."*

---

## 🌤️ Phase 2: Ingestion of Whitelisted Custom Catalog

1. **Execute the Terminal Ingestion Command**:
   * Run this command to dynamically register the **Weather Catalog**:
     ```bash
     node scripts/compile-catalogs.js --add https://a2ui.org/catalogs/v1/weather-catalog.json
     ```
2. **Highlight the Compiler Output**:
   * Point out the terminal logs to the audience:
     * `📥 Registering new catalog URL...`
     * `🔒 Performing domain security verification...`
     * `✓ Domain verified: "a2ui.org"`
     * `✓ Static catalog registries generated successfully!`

3. **Observe the Live UI Hot-Reload**:
   * Vite automatically hot-swaps the registry. The **"Weather Catalog (Primitives + Weather)"** button immediately appears in the browser!
   * Click the button to trigger a beautiful, glowing **glassmorphic success toast** indicating successful ingestion.
   * Select **`WeatherWidget`** from the sidebar to render the gorgeous purple forecast container.
   * Click **"Refresh Local Weather"** and show the live action dispatches streaming to the logging console on the bottom-left.

---

## 🔒 Phase 3: Domain Security Rejection (The Guardrail Demo)

1. **Simulate a Malicious Catalog Ingestion**:
   * Run an unauthorized dynamic domain addition in your terminal:
     ```bash
     node scripts/compile-catalogs.js --add https://malicious-untrusted-site.com/hack.json
     ```
2. **Highlight the Compiler Safety Block**:
   * The compiler rejects the addition instantly and halts code generation:
     ```text
     🚨 SECURITY REJECTION: Hostname "malicious-untrusted-site.com" is not whitelisted in whitelist.json!
     ```
3. **Show UI Stability**:
   * Look back at the browser: *"Our app remains 100% safe, untainted, and stable. Untrusted domains can never corrupt the compiled codebase."*

---

## 📦 Phase 4: Generative MCP Sandbox Ingestion

1. **Execute Whitelisted MCP Command**:
   * Register the sandboxed generative MCP application:
     ```bash
     node scripts/compile-catalogs.js --add https://a2ui.org/catalogs/v1/mcp-catalog.json
     ```
2. **Show the Button Appearing**:
   * Click the newly generated **"Generative MCP Catalog"** button.
   * Select **`McpApp`** from the sidebar.
   * Click **"Run Tool"** inside the secure calculator sandbox, showing the real-time JSON-RPC postMessages streaming to the developer console logs.

---

## 🧹 Phase 5: Resetting the Demo Baseline
To restore your demo to its clean, single-button starting state for the next presentation:
```bash
echo '[\n  "https://a2ui.org/catalogs/v1/basic-catalog.json"\n]' > config/catalogs.json && node scripts/compile-catalogs.js
```
The browser instantly reloads back to the single **Basic Catalog** start screen!
