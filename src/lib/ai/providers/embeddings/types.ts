/**
 * Provider-agnostic embedding contract. Implementations map text into a
 * fixed-dimension vector space; callers never depend on provider internals.
 */
export interface EmbeddingResult {
  vector: number[];
  dimensions: number;
  provider: string;
  model: string;
}

export interface EmbeddingProvider {
  readonly name: string;
  readonly model: string;
  readonly dimensions: number;
  isReady(): boolean;
  embed(text: string): Promise<EmbeddingResult>;
  embedBatch(texts: string[]): Promise<EmbeddingResult[]>;
}
