/*
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { combineLatest, Observable, of, throwError } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { ExpressionEvaluator, EvaluationContext } from "./expression_evaluator";

import { DataContext } from "../../rendering/data-context";

export class ExpressionParser {
  private static readonly MAX_DEPTH = 10;

  constructor(
    private context: DataContext,
    private evaluator: ExpressionEvaluator,
  ) {}

  public parse(input: string, depth = 0): Observable<string> {
    try {
      if (depth > ExpressionParser.MAX_DEPTH) {
        throw new Error("Max recursion depth reached in parse");
      }
      if (!input || !input.includes("${")) {
        return of(input);
      }

      const parts: Observable<string>[] = [];
      const scanner = new Scanner(input);

      while (!scanner.isAtEnd()) {
        if (scanner.matches("${")) {
          scanner.advance(2);
          const content = this.extractInterpolationContent(scanner);
          parts.push(
            this.evaluateExpression(content, depth + 1).pipe(
              map((val) =>
                val === null || val === undefined ? "" : String(val),
              ),
            ),
          );
        } else if (
          scanner.peek() === "\\" &&
          scanner.peek(1) === "$" &&
          scanner.peek(2) === "{"
        ) {
          // Escaped \${
          // Consume \
          scanner.advance();
          // Literal ${
          parts.push(of("${"));
          // Consume ${ (2 chars)
          scanner.advance(2);
        } else {
          // Literal text
          // Advance until we see ${ BUT check if it's escaped
          // A simple loop is safer than advanceUntil
          const start = scanner.pos;
          while (!scanner.isAtEnd()) {
            if (scanner.matches("${")) {
              break;
            }
            if (
              scanner.peek() === "\\" &&
              scanner.peek(1) === "$" &&
              scanner.peek(2) === "{"
            ) {
              break;
            }
            scanner.advance();
          }
          parts.push(of(scanner.input.substring(start, scanner.pos)));
        }
      }

      return combineLatest(parts).pipe(
        map((resolved: string[]) => resolved.join("")),
      );
    } catch (e) {
      return throwError(() => e);
    }
  }

  private extractInterpolationContent(scanner: Scanner): string {
    const start = scanner.pos;
    let braceBalance = 1;

    while (!scanner.isAtEnd() && braceBalance > 0) {
      const char = scanner.advance();
      if (char === "{") {
        braceBalance++;
      } else if (char === "}") {
        braceBalance--;
      } else if (char === "'" || char === '"') {
        const quote = char;
        while (!scanner.isAtEnd()) {
          const c = scanner.advance();
          if (c === "\\") {
            scanner.advance();
          } else if (c === quote) {
            break;
          }
        }
      }
    }

    if (braceBalance > 0) {
      throw new Error("Unclosed interpolation: missing '}'");
    }

    return scanner.input.substring(start, scanner.pos - 1);
  }

  private evaluateExpression(expr: string, depth: number): Observable<any> {
    expr = expr.trim();
    if (!expr) return of(null);

    const scanner = new Scanner(expr);
    const result = this.parseExpression(scanner, depth);
    if (!scanner.isAtEnd()) {
      throw new Error(
        `Unexpected characters at end of expression: '${scanner.input.substring(
          scanner.pos,
        )}'`,
      );
    }
    return result;
  }

  private parseExpression(scanner: Scanner, depth: number): Observable<any> {
    scanner.skipWhitespace();
    if (scanner.isAtEnd()) return of(null);

    // 0. Nested Interpolation (Block)
    if (scanner.matches("${")) {
      scanner.advance(2);
      const content = this.extractInterpolationContent(scanner);
      return this.evaluateExpression(content, depth + 1);
    }

    // 1. Literals
    if (scanner.matchesString("'") || scanner.matchesString('"')) {
      return of(this.parseStringLiteral(scanner));
    }
    if (this.isDigit(scanner.peek())) {
      return of(this.parseNumberLiteral(scanner));
    }
    if (scanner.matchesKeyword("true")) return of(true);
    if (scanner.matchesKeyword("false")) return of(false);
    if (scanner.matchesKeyword("null")) return of(null);

    // 2. Identifiers (Function calls or Path starts)
    const token = this.scanPathOrIdentifier(scanner);
    scanner.skipWhitespace();

    if (scanner.peek() === "(") {
      return this.parseFunctionCall(token, scanner, depth);
    } else {
      if (!token) {
        return of(null);
      }
      return this.resolvePath(token);
    }
  }

  private scanPathOrIdentifier(scanner: Scanner): string {
    const start = scanner.pos;
    while (!scanner.isAtEnd()) {
      const c = scanner.peek();
      if (this.isAlnum(c) || c === "/" || c === "." || c === "_" || c === "-") {
        scanner.advance();
      } else {
        break;
      }
    }
    return scanner.input.substring(start, scanner.pos);
  }

  private parseFunctionCall(
    funcName: string,
    scanner: Scanner,
    depth: number,
  ): Observable<any> {
    scanner.match("(");
    scanner.skipWhitespace();

    const args: Record<string, Observable<any>> = {};

    while (!scanner.isAtEnd() && scanner.peek() !== ")") {
      const argName = this.scanIdentifier(scanner);
      scanner.skipWhitespace();
      if (!scanner.match(":")) {
        throw new Error(
          `Expected ':' after argument name '${argName}' in function '${funcName}'`,
        );
      }
      scanner.skipWhitespace();

      args[argName] = this.parseExpression(scanner, depth);

      scanner.skipWhitespace();
      if (scanner.peek() === ",") {
        scanner.advance();
        scanner.skipWhitespace();
      }
    }

    if (!scanner.match(")")) {
      throw new Error(
        `Expected ')' after function arguments for '${funcName}'`,
      );
    }

    return combineLatest(args).pipe(
      switchMap((resolvedArgs: Record<string, unknown>) => {
        const evalContext: EvaluationContext = this.context;
        const result = this.evaluator.evaluate(
          { call: funcName, args: resolvedArgs } as any,
          evalContext,
        );
        if (result instanceof Observable) {
          return result;
        }
        return of(result);
      }),
    );
  }

  private scanIdentifier(scanner: Scanner): string {
    const start = scanner.pos;
    while (
      !scanner.isAtEnd() &&
      (this.isAlnum(scanner.peek()) || scanner.peek() === "_")
    ) {
      scanner.advance();
    }
    return scanner.input.substring(start, scanner.pos);
  }

  private parseStringLiteral(scanner: Scanner): string {
    const quote = scanner.advance();
    let result = "";
    while (!scanner.isAtEnd()) {
      const c = scanner.advance();
      if (c === "\\") {
        scanner.advance();
        const next = scanner.advance();
        if (next === "n") result += "\n";
        else if (next === "t") result += "\t";
        else if (next === "r") result += "\r";
        else result += next;
      } else if (c === quote) {
        break;
      } else {
        result += c;
      }
    }
    return result;
  }

  private parseNumberLiteral(scanner: Scanner): number {
    const start = scanner.pos;
    while (
      !scanner.isAtEnd() &&
      (this.isDigit(scanner.peek()) || scanner.peek() === ".")
    ) {
      scanner.advance();
    }
    return Number(scanner.input.substring(start, scanner.pos));
  }

  private resolvePath(path: string): Observable<any> {
    return new Observable((sub) => {
      const observer = this.context.subscribeDynamicValue({ path }, (val) =>
        sub.next(val),
      );
      sub.next(observer.value);
      return () => observer.unsubscribe();
    });
  }

  private isAlnum(c: string): boolean {
    return (
      (c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || (c >= "0" && c <= "9")
    );
  }

  private isDigit(c: string): boolean {
    return c >= "0" && c <= "9";
  }
}

class Scanner {
  pos = 0;
  constructor(public input: string) {}

  isAtEnd(): boolean {
    return this.pos >= this.input.length;
  }

  peek(offset = 0): string {
    if (this.pos + offset >= this.input.length) return "\0";
    return this.input[this.pos + offset];
  }

  advance(count = 1): string {
    const char = this.input.substring(this.pos, this.pos + count);
    this.pos += count;
    return char;
  }

  match(expected: string): boolean {
    if (this.peek() === expected) {
      this.advance();
      return true;
    }
    return false;
  }

  matches(expected: string): boolean {
    if (this.input.startsWith(expected, this.pos)) {
      return true;
    }
    return false;
  }

  matchesString(expected: string): boolean {
    return this.peek() === expected;
  }

  matchesKeyword(keyword: string): boolean {
    if (this.input.startsWith(keyword, this.pos)) {
      const next = this.peek(keyword.length);
      if (!/[a-zA-Z0-9_]/.test(next)) {
        this.advance(keyword.length);
        return true;
      }
    }
    return false;
  }

  skipWhitespace() {
    while (!this.isAtEnd() && /\s/.test(this.peek())) {
      this.advance();
    }
  }

  advanceUntil(target: string): string {
    const idx = this.input.indexOf(target, this.pos);
    if (idx === -1) {
      const res = this.input.substring(this.pos);
      this.pos = this.input.length;
      return res;
    }
    const res = this.input.substring(this.pos, idx);
    this.pos = idx;
    return res;
  }

  advanceRest(): string {
    const res = this.input.substring(this.pos);
    this.pos = this.input.length;
    return res;
  }
}
