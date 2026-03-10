import { signal } from "@preact/signals-core";

const s = signal(0);
(s as any).unsubscribe = () => console.log("unsubscribed");

console.log(typeof (s as any).unsubscribe);
