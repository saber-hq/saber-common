export const firstAggregateError = (err: AggregateError) => {
  const errors = err.errors as Error[];
  const [firstError, ...remErrors] = [errors.pop(), ...errors];
  console.error(remErrors);
  return firstError;
};
