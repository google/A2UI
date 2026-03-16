import assert from "node:assert";
import { describe, it } from "node:test";
import { MessageProcessor } from "@a2ui/web_core/v0_9";
import { minimalCatalog } from "../catalogs/minimal/index.js";
import fs from "fs";
import path from "path";

describe("v0.9 Minimal Catalog Examples", () => {
  const examplesDir = path.resolve(
    process.cwd(),
    "../specification/v0_9/json/catalogs/minimal/examples"
  );

  const files = fs.readdirSync(examplesDir).filter((f) => f.endsWith(".json"));

  for (const file of files) {
    it(`should successfully process ${file}`, () => {
      const content = fs.readFileSync(path.join(examplesDir, file), "utf-8");
      const data = JSON.parse(content);
      const messages = Array.isArray(data) ? data : data.messages || [];

      let surfaceId = file.replace(".json", "");
      const createMsg = messages.find((m: any) => m.createSurface);
      if (createMsg) {
        surfaceId = createMsg.createSurface.surfaceId;
      } else {
        messages.unshift({
          version: "v0.9",
          createSurface: {
            surfaceId,
            catalogId: minimalCatalog.id,
          },
        });
      }

      const processor = new MessageProcessor([minimalCatalog]);
      
      // Should process without throwing validation or parsing errors
      processor.processMessages(messages);
      
      const surface = processor.model.getSurface(surfaceId);
      assert.ok(surface, `Surface ${surfaceId} should exist`);
      
      const rootNode = surface.componentsModel.get("root");
      assert.ok(rootNode, "Surface should have a root component");
    });
  }
});