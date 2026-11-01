export function buildStripeSubscriptionDiscountFields(params: {
  clearExistingDiscounts: boolean;
  applyCouponId: string | null;
}): { discounts: { coupon: string }[] } | Record<string, never> {
  if (params.clearExistingDiscounts) {
    return { discounts: [] };
  }
  if (params.applyCouponId) {
    return { discounts: [{ coupon: params.applyCouponId }] };
  }
  return {};
}
