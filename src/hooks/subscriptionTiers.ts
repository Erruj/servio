export interface SubscriptionStatus {
  subscribed: boolean;
  product_id: string | null;
  subscription_status: 'trial' | 'active' | 'expired' | 'canceled' | 'free';
  trial_end_date: string | null;
  subscription_end: string | null;
}

// Product mapping for subscription tiers
export const SUBSCRIPTION_TIERS = {
  starter: {
    product_id: 'prod_U9FEn3lMyxZ6xR',
    price_id: 'price_1TAwkPDME8sDkzM9evpM3A6l',
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
    price_id: 'price_1TAwm4DME8sDkzM9EHWmKOfm',
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
    product_id: 'prod_U9FHgm6gn3Iq50',
    price_id: 'price_1TAwnFDME8sDkzM9EHWmKOfm'.replace('1TAwnFDME8sDkzM9EHWmKOfm', '1TAwnFDME8sDkzM9TdEvv5zC'),
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
