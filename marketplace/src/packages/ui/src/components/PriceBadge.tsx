export function PriceBadge(props: { amount: number; currency: string }) {
  return `${props.currency} ${props.amount.toFixed(2)}`;
}
