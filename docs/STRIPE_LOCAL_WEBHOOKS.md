# Stripe webhooks (local dev)

## Prerequisites

- Stripe CLI installed and logged in (`stripe login`)
- App running at `http://localhost:3000`
- Test mode keys in `.env` (`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`)
- Monthly price IDs in `.env`:

```bash
STRIPE_PRICE_CORE_MONTHLY=price_1UVGepL5cHzuQyqZsraujEIy
STRIPE_PRICE_PLUS_MONTHLY=price_1UVGfsL5cHzuQyqZIGgawuzY
STRIPE_PRICE_ALL_ACCESS_MONTHLY=price_1UVGgFL5cHzuQyqZXkM0cgX8
```

## Forward webhooks

In a **second terminal** (keep `npm run dev` running in the first):

```bash
stripe listen \
  --events checkout.session.completed,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted,invoice.paid,invoice.payment_failed,charge.refunded \
  --forward-to localhost:3000/api/webhooks/stripe
```

Do not use `--all-thin`; our handler expects regular snapshot event payloads.

Copy the `whsec_...` signing secret printed by the CLI into `.env`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```

Restart `npm run dev` after changing `.env`.

## Trigger test events (optional)

```bash
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger invoice.payment_failed
```

For real checkout flows, complete Checkout in the browser; the CLI forwards live test events.

## Failed renewal (not first checkout)

Our app Checkout always succeeds with `4242`. To test **renewal** failure you need a subscription that already exists, then a failing card on the **next** invoice.

### Option A (recommended locally): dev simulator after real 4242 checkout

1. Subscribe with `4242` via `/upgrade` (keep `stripe listen` running).
2. Open **http://localhost:3000/dev/subscription-testing** as admin, search for the player by email, and select them.
3. Click **Simulate failed renewal** (failing default PM + `billing_cycle_anchor: now` renewal, then sync from Stripe `past_due`) -> `PAST_DUE`, site-wide amber banner, Settings -> My plan warning, access still on for 7 days.
4. Check **App status**, **Grace ends**, and **Stripe subscription status** on the dev page, then click **Expire grace now** -> membership level cleared (base tier); banner gone.

This matches webhook + grace logic without waiting for a billing period.

### Option B: Stripe test clock + failing card (full Stripe path)

1. Stripe Dashboard (test mode) -> **Developers -> Test clocks** -> Create clock (start time = now).
2. Stripe Dashboard -> **Customers** -> Create customer and attach the customer to that test clock (required before subscribing).
3. Create a subscription on that customer for your Core/Plus/All-Access test price (Dashboard or API), paying with `4242`.
4. Attach failing test payment method `4000 0000 0000 0341` (or `pm_card_chargeCustomerFail`) and set it as the customer default.
5. Advance the test clock past the subscription's `current_period_end` (Dashboard: Advance time on the clock).
6. Stripe attempts renewal -> `invoice.payment_failed` -> forwarded by `stripe listen` -> app sets `PAST_DUE` + 7-day grace.

Note: customers created by our Checkout flow are **not** on a test clock unless you create them on a clock first; use Option A for app QA or Option B when you need end-to-end Stripe billing.

### Option C: CLI on an existing subscription (after 4242 checkout)

Replace ids from Dashboard / your DB:

```bash
# Failing card payment method on the customer
stripe payment_methods attach pm_card_chargeCustomerFail --customer cus_XXXX
stripe customers update cus_XXXX -d "invoice_settings[default_payment_method]=pm_card_chargeCustomerFail"

# Create and attempt to pay the next invoice (renewal)
stripe invoices create --customer cus_XXXX --subscription sub_XXXX
stripe invoices finalize inv_XXXX
stripe invoices pay inv_XXXX
```

With `stripe listen` running, expect `invoice.payment_failed` and the same in-app behavior as Option A.
