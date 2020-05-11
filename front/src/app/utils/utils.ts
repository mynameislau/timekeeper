export const roundToPrecision = (nb: number, precision: number = 1) => Math.round(nb * Math.pow(10, precision)) / Math.pow(10, precision);
