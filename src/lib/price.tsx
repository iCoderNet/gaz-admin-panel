// lib/price.tsx
import React from "react";

export function uzPrice(value: unknown): string {
  if (value === null || value === undefined) return "0";

  const num = Number(value);
  if (isNaN(num)) return String(value);

  return num.toLocaleString("uz-UZ").replace(/,/g, " ");
}

type PriceProps = {
  value: number | string;
  suffix?: string;
};

const PricePipe: React.FC<PriceProps> = ({ value, suffix = "so'm" }) => {
  return <span>{`${uzPrice(value)} ${suffix}`}</span>;
};

export default PricePipe;
