export interface SubscriptionStatus {
  subscribed: boolean;
  product_id: string | null;
  subscription_status: 'trial' | 'active' | 'expired' | 'canceled';
  trial_end_date: string | null;
  subscription_end: string | null;
}

// Product mapping for subscription tiers
export const SUBSCRIPTION_TIERS = {
  starter: {
    product_id: 'prod_TUHktvw98PDTTn',
    price_id: 'price_1SXJAnDLXfTDUSDcxbedSrxR',
    name: 'Starter',
    price: 9.99,
    features: [
      'Beperkte inbox (50 e-mails/maand)',
      'Basis AI reply suggesties',
      '1 gebruiker',
      'Email support',
    ],
  },
  pro: {
    product_id: 'prod_U9FG9hWuBCWWMc',
    price_id: 'price_1SXJBPDLXfTDUSDcbIUY8onh',
    name: 'Pro',
    price: 29.99,
    features: [
      'Volledige inbox (onbeperkt)',
      'Administratie module',
      'AI boekhoudassistent',
      '3 gebruikers',
      'Priority support',
    ],
  },
  business: {
    product_id: 'prod_TUHl8Gz4fh6OIL',
    price_id: 'price_1SXJBcDLXfTDUSDcYeAzc1Rx',
    name: 'Business',
    price: 79.99,
    features: [
      'Alles van Pro',
      'Onbeperkte gebruikers',
      'Alle automatiseringen',
      'Prioriteits-SLA',
      'Dedicated support',
      'Custom integraties',
    ],
  },
} as const;
