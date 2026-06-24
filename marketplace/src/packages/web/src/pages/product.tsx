import { PriceBadge } from "../../../ui/src/components/PriceBadge";

export function ProductPage() {
  return PriceBadge({ amount: 42, currency: "EUR" });
}
