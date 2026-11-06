/** Minimal SQL surface used by ingestion, supported by D1 bindings and the CLI. */
export interface IngestionStatement {
  bind(...values: (string | number | null)[]): IngestionStatement;
  run(): Promise<unknown>;
  all<T>(): Promise<{ results: T[] }>;
}

export interface IngestionDatabase {
  prepare(sql: string): IngestionStatement;
  batch(statements: IngestionStatement[]): Promise<unknown>;
}
