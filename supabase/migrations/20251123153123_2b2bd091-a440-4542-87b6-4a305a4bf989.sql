-- Create ai_insights table for storing AI analysis history
CREATE TABLE IF NOT EXISTS public.ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'question', 'summary', 'analysis', 'suggestion'
  query TEXT,
  answer TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own insights"
  ON public.ai_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own insights"
  ON public.ai_insights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own insights"
  ON public.ai_insights FOR DELETE
  USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX idx_transactions_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX idx_transactions_category ON public.transactions(user_id, category);
CREATE INDEX idx_invoices_user_date ON public.invoices(user_id, invoice_date DESC);
CREATE INDEX idx_receipts_user_date ON public.receipts(user_id, receipt_date DESC);
CREATE INDEX idx_documents_user_type ON public.documents(user_id, document_type);
CREATE INDEX idx_ai_insights_user_created ON public.ai_insights(user_id, created_at DESC);

-- Add automation settings to user_settings
ALTER TABLE public.user_settings 
  ADD COLUMN IF NOT EXISTS auto_categorize BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_vat_calculation BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS monthly_summary BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS tag_suggestions BOOLEAN DEFAULT true;