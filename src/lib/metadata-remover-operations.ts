/** Tracks which selection owns asynchronous work in the Metadata Remover UI. */
export class MetadataSelectionGuard {
  private generation = 0;
  private processingGeneration: number | null = null;

  beginSelection(): number {
    this.generation += 1;
    this.processingGeneration = null;
    return this.generation;
  }

  isCurrent(generation: number): boolean {
    return generation === this.generation;
  }

  beginProcessing(generation: number): boolean {
    if (!this.isCurrent(generation) || this.processingGeneration === generation) return false;
    this.processingGeneration = generation;
    return true;
  }

  endProcessing(generation: number): void {
    if (this.processingGeneration === generation) this.processingGeneration = null;
  }

  async run<T>(
    generation: number,
    operation: () => Promise<T>,
    handlers: {
      onSuccess: (result: T) => void;
      onError: (reason: unknown) => void;
      onFinally?: () => void;
    },
  ): Promise<void> {
    try {
      const result = await operation();
      if (this.isCurrent(generation)) handlers.onSuccess(result);
    } catch (reason) {
      if (this.isCurrent(generation)) handlers.onError(reason);
    } finally {
      if (this.isCurrent(generation)) handlers.onFinally?.();
    }
  }
}
