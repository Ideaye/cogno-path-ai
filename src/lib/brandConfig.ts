export const APP_BRAND = import.meta.env.VITE_APP_BRAND || "Yukti AI";

export function getBrandName(): string {
  return APP_BRAND;
}
