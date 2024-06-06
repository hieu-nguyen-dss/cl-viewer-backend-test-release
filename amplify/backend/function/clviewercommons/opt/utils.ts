export const isDate = (date) => {
  return new Date(date).toString() !== 'Invalid Date' && !isNaN(new Date(date).getTime());
};
