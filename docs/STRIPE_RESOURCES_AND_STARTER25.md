# Stripe: resource products and STARTER25

Create these **one-time** Prices in Stripe (Test and Live). Add each Price ID to Render env vars.

| Env var | Product name (suggested) | Amount |
|---------|--------------------------|--------|
| `STRIPE_PRICE_RES_STARTER_BUNDLE` | 4-Week Starter Bundle (Strength, Speed, Mobility) | $25 |
| `STRIPE_PRICE_RES_STRENGTH` | Strength: 4-Week Starter | $10 |
| `STRIPE_PRICE_RES_SPEED` | Speed and Agility: 4-Week Starter | $10 |
| `STRIPE_PRICE_RES_MOBILITY` | Mobility: 4-Week Starter | $10 |
| `STRIPE_PRICE_RES_MENTAL` | Mental Game Workbook | $10 |
| `STRIPE_PRICE_RES_RECRUITING` | College Baseball Recruiting Guide | $19 |
| `STRIPE_PRICE_RES_BACK_ARM` | Back and Arm Strength: 4-Week Starter | $10 |

Existing (unchanged):

- `STRIPE_BASIC_PRICE_ID` - Playbook ($59)
- `TWELVE_WEEK_PROGRAM_PRICE_ID` - 12-Week Program ($599)
- `STRIPE_REMOTE_PRICE_ID` - Remote Session ($60)

## STARTER25 coupon ($25 off 12-Week Program)

1. Stripe Dashboard -> Products -> Coupons -> Create coupon.
2. **Amount off:** $25.00 USD (or 2500 cents).
3. **Duration:** Once.
4. **Applies to:** Specific product -> select your 12-Week Program product (same product as `TWELVE_WEEK_PROGRAM_PRICE_ID`).
5. **Coupon ID / code:** `STARTER25` (customer-facing promotion code).
6. Under Promotion codes, create code **STARTER25** linked to that coupon.

Checkout for the 12-Week Program uses `allow_promotion_codes: true` on `/api/stripe/checkout/twelve-week`.

## COMPANY_MAILING_ADDRESS

Set on Render for CAN-SPAM style footers on lead/marketing email. Required before the **3-day lead follow-up** email sends (delivery emails still send without it).
