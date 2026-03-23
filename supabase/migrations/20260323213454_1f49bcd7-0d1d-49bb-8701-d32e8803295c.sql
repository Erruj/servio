
-- Fix RLS policies: change from 'public' to 'authenticated' role for 8 tables

-- receipts
ALTER POLICY "Users can view own receipts" ON receipts TO authenticated;
ALTER POLICY "Users can insert own receipts" ON receipts TO authenticated;
ALTER POLICY "Users can update own receipts" ON receipts TO authenticated;
ALTER POLICY "Users can delete own receipts" ON receipts TO authenticated;

-- documents
ALTER POLICY "Users can view own documents" ON documents TO authenticated;
ALTER POLICY "Users can insert own documents" ON documents TO authenticated;
ALTER POLICY "Users can update own documents" ON documents TO authenticated;
ALTER POLICY "Users can delete own documents" ON documents TO authenticated;

-- categories
ALTER POLICY "Users can view own categories" ON categories TO authenticated;
ALTER POLICY "Users can insert own categories" ON categories TO authenticated;
ALTER POLICY "Users can update own categories" ON categories TO authenticated;
ALTER POLICY "Users can delete own categories" ON categories TO authenticated;

-- transactions
ALTER POLICY "Users can view own transactions" ON transactions TO authenticated;
ALTER POLICY "Users can insert own transactions" ON transactions TO authenticated;
ALTER POLICY "Users can update own transactions" ON transactions TO authenticated;
ALTER POLICY "Users can delete own transactions" ON transactions TO authenticated;

-- invoices
ALTER POLICY "Users can view own invoices" ON invoices TO authenticated;
ALTER POLICY "Users can insert own invoices" ON invoices TO authenticated;
ALTER POLICY "Users can update own invoices" ON invoices TO authenticated;
ALTER POLICY "Users can delete own invoices" ON invoices TO authenticated;

-- emails
ALTER POLICY "Users can view own emails" ON emails TO authenticated;
ALTER POLICY "Users can insert own emails" ON emails TO authenticated;
ALTER POLICY "Users can update own emails" ON emails TO authenticated;
ALTER POLICY "Users can delete own emails" ON emails TO authenticated;

-- ai_insights
ALTER POLICY "Users can view own insights" ON ai_insights TO authenticated;
ALTER POLICY "Users can insert own insights" ON ai_insights TO authenticated;
ALTER POLICY "Users can delete own insights" ON ai_insights TO authenticated;

-- email_connections
ALTER POLICY "Users can view own email connections" ON email_connections TO authenticated;
ALTER POLICY "Users can insert own email connections" ON email_connections TO authenticated;
ALTER POLICY "Users can update own email connections" ON email_connections TO authenticated;
ALTER POLICY "Users can delete own email connections" ON email_connections TO authenticated;
