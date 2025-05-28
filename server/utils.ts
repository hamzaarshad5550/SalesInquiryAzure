export function handleError(error: unknown, context: string): void {
  console.error(`Error in ${context}:`, error);
  if (error instanceof Error) {
    console.error(`Error message: ${error.message}`);
    console.error(`Error stack: ${error.stack}`);
  }
} 