import { describe, it } from "node:test";
import assert from "node:assert";
import { DataModel } from "../state/data-model.js";
import { DataContext } from "../rendering/data-context.js";

import { timer } from "rxjs";
import { map } from "rxjs/operators";

describe("Function Execution in DataContext", () => {
  it("resolves and subscribes to metronome function", (_t, done) => {
    const dataModel = new DataModel();

    const functions = new Map<string, Function>();
    // mimic metronome: returns a stream of ticks
    functions.set("metronome", (args: Record<string, any>) => {
      const interval = Number(args["interval"]) || 100;
      return timer(0, interval).pipe(map((i) => `tick ${i}`));
    });

    const context = new DataContext(dataModel, "/", (name, args) => {
      const fn = functions.get(name);
      return fn ? fn(args) : undefined;
    });

    // DynamicValue representing: metronome(interval: 50)
    const dynamicValue = {
      call: "metronome",
      args: {
        interval: 50,
      },
      returnType: "string" as const,
    };

    const values: string[] = [];
    const subscription = context.subscribeDynamicValue<string>(
      dynamicValue,
      (val) => {
        if (val) values.push(val);
        if (values.length >= 3) {
          subscription.unsubscribe();
          try {
            assert.strictEqual(values[0], "tick 0");
            assert.strictEqual(values[1], "tick 1");
            assert.strictEqual(values[2], "tick 2");
            done();
          } catch (e) {
            done(e);
          }
        }
      },
    );
  });

  it("updates function output when arguments change", (_t, done) => {
    const dataModel = new DataModel();
    const functions = new Map<string, Function>();

    functions.set("echo", (args: Record<string, any>) => {
      return `echo: ${args["val"]}`;
    });

    const context = new DataContext(dataModel, "/", (name, args) => {
      const fn = functions.get(name);
      return fn ? fn(args) : undefined;
    });
    dataModel.set("/msg", "hello");

    // echo(val: {path: '/msg'})
    const dynamicValue = {
      call: "echo",
      args: {
        val: { path: "/msg" },
      },
      returnType: "string" as const,
    };

    const values: string[] = [];
    const subscription = context.subscribeDynamicValue<string>(
      dynamicValue,
      (val) => {
        if (val) values.push(val);
        if (values.length === 2) {
          subscription.unsubscribe();
          try {
            assert.strictEqual(values[0], "echo: hello");
            assert.strictEqual(values[1], "echo: world");
            done();
          } catch (e) {
            done(e);
          }
        }
      },
    );
    if (subscription.value) {
      values.push(subscription.value);
    }

    // Change data after a short delay to ensure first emit happens
    setTimeout(() => {
      dataModel.set("/msg", "world");
    }, 50);
  });
});
