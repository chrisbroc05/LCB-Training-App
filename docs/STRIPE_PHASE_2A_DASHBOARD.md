# Stripe Dashboard settings (Phase 2A, test/sandbox)

## Customer Portal

**Settings > Billing > Customer portal**

| Setting | Recommendation |
|--------|----------------|
| Payment methods | **On** (customers can update cards) |
| Invoice history | **On** |
| Customer information | **On** (name, email, billing address if you collect it) |
| Cancel subscriptions | **Off** (cancel in-app only) |
| Switch plan / Update subscriptions | **Off** (upgrade, downgrade, and cancel in-app only) |

Return URL: your app already sends `return_url` to `/settings` when opening the portal.

## Billing retries and emails (align with 7-day in-app grace)

**Settings > Billing > Subscriptions and emails > Manage failed payments**

| Setting | Recommendation |
|--------|----------------|
| Smart Retries | **On** (Stripe retries failed cards on its schedule during the week) |
| Retry schedule | Use Stripe defaults (typically retries over ~1 week) |
| Email customers on failed payment | **On** (complements our in-app banner and app email) |
| Email customers on successful retry | **On** (optional but helpful) |
| Cancel subscription after all retries fail | **Off** if available; we drop access after **7 days** in-app grace via `pastDueGraceEndsAt`, not immediately on first failure |

Our app sets `PAST_DUE` and a **7-day** grace window on first `invoice.payment_failed` for Core/Plus/All-Access subscriptions. Stripe Smart Retries should run during that same week so most cards recover before grace ends.

## Products and prices

Ensure the three monthly prices exist in test mode and match `.env` (IDs from your Stripe test dashboard).
