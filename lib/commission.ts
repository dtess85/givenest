export const COMMISSION_RATE = 0.025;
export const GIVING_POOL_RATE = 0.30;

export const calcCommission = (price: number): number =>
  price * COMMISSION_RATE;

export const calcGivingPool = (price: number): number =>
  calcCommission(price) * GIVING_POOL_RATE;

export const calcDistribution = (price: number): number =>
  calcGivingPool(price);
