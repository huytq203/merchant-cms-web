function messageOf(error: unknown) {
  return error instanceof Error ? error.message : "Yêu cầu thất bại";
}

/** Clears the previous error, runs the action and reports a failure as a message instead of throwing. */
export async function runGuarded(
  setError: (message: string | null) => void,
  action: () => Promise<void>,
) {
  setError(null);
  try {
    await action();
  } catch (error) {
    setError(messageOf(error));
  }
}
