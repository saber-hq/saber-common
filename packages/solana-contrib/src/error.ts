export const firstAggregateError = (err: AggregateError) => {
  const errors = err.errors as Error[];
  const [firstError, ...remErrors] = [errors.pop(), ...errors];
  if (remErrors.length > 0) {
    console.error(remErrors);
  }
  return firstError;
};
