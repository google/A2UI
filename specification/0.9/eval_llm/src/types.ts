
import { TestPrompt } from "./prompts";

export interface GeneratedResult {
  modelName: string;
  prompt: TestPrompt;
  runNumber: number;
  rawText?: string;
  components?: any[];
  latency: number;
  error?: any;
}

export interface ValidatedResult extends GeneratedResult {
  validationErrors: string[];
}

export interface EvaluatedResult extends ValidatedResult {
  evaluationResult?: {
    pass: boolean;
    reason: string;
  };
}
