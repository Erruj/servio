export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      ai_corrections: {
        Row: {
          corrected_reply: string
          created_at: string | null
          email_id: string | null
          id: string
          original_reply: string
          tone: string | null
          user_id: string
        }
        Insert: {
          corrected_reply: string
          created_at?: string | null
          email_id?: string | null
          id?: string
          original_reply: string
          tone?: string | null
          user_id: string
        }
        Update: {
          corrected_reply?: string
          created_at?: string | null
          email_id?: string | null
          id?: string
          original_reply?: string
          tone?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_corrections_email_id_fkey"
            columns: ["email_id"]
            isOneToOne: false
            referencedRelation: "emails"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_insights: {
        Row: {
          answer: string
          created_at: string | null
          id: string
          metadata: Json | null
          query: string | null
          type: string
          user_id: string
        }
        Insert: {
          answer: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          query?: string | null
          type: string
          user_id: string
        }
        Update: {
          answer?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          query?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          created_at: string | null
          endpoint: string | null
          id: string
          ip_address: string | null
          status: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          endpoint?: string | null
          id?: string
          ip_address?: string | null
          status: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          endpoint?: string | null
          id?: string
          ip_address?: string | null
          status?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          company_name: string | null
          country: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          postal_code: string | null
          updated_at: string
          user_id: string
          vat_number: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          updated_at?: string
          user_id: string
          vat_number?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          updated_at?: string
          user_id?: string
          vat_number?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          ai_key_points: Json | null
          ai_risks: Json | null
          ai_summary: string | null
          created_at: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          file_path: string
          id: string
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_key_points?: Json | null
          ai_risks?: Json | null
          ai_summary?: string | null
          created_at?: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          file_path: string
          id?: string
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_key_points?: Json | null
          ai_risks?: Json | null
          ai_summary?: string | null
          created_at?: string | null
          document_type?: Database["public"]["Enums"]["document_type"]
          file_path?: string
          id?: string
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      email_category_corrections: {
        Row: {
          corrected_category: string
          created_at: string
          email_id: string
          email_snippet: string | null
          email_subject: string | null
          id: string
          original_category: string
          user_id: string
        }
        Insert: {
          corrected_category: string
          created_at?: string
          email_id: string
          email_snippet?: string | null
          email_subject?: string | null
          id?: string
          original_category: string
          user_id: string
        }
        Update: {
          corrected_category?: string
          created_at?: string
          email_id?: string
          email_snippet?: string | null
          email_subject?: string | null
          id?: string
          original_category?: string
          user_id?: string
        }
        Relationships: []
      }
      email_connections: {
        Row: {
          access_token: string | null
          created_at: string
          email_address: string
          encrypted_password: string | null
          id: string
          imap_host: string | null
          imap_port: number | null
          is_active: boolean | null
          last_sync_at: string | null
          provider: string
          refresh_token: string | null
          scopes: string[] | null
          smtp_host: string | null
          smtp_port: number | null
          sync_error: string | null
          token_expires_at: string | null
          updated_at: string
          use_ssl: boolean | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          email_address: string
          encrypted_password?: string | null
          id?: string
          imap_host?: string | null
          imap_port?: number | null
          is_active?: boolean | null
          last_sync_at?: string | null
          provider: string
          refresh_token?: string | null
          scopes?: string[] | null
          smtp_host?: string | null
          smtp_port?: number | null
          sync_error?: string | null
          token_expires_at?: string | null
          updated_at?: string
          use_ssl?: boolean | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          email_address?: string
          encrypted_password?: string | null
          id?: string
          imap_host?: string | null
          imap_port?: number | null
          is_active?: boolean | null
          last_sync_at?: string | null
          provider?: string
          refresh_token?: string | null
          scopes?: string[] | null
          smtp_host?: string | null
          smtp_port?: number | null
          sync_error?: string | null
          token_expires_at?: string | null
          updated_at?: string
          use_ssl?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      emails: {
        Row: {
          ai_category: string | null
          ai_urgency: string | null
          body_html: string | null
          body_text: string | null
          cc_emails: string[] | null
          connection_id: string
          created_at: string
          customer_sentiment: string | null
          external_id: string
          follow_up_at: string | null
          from_email: string
          from_name: string | null
          has_attachments: boolean | null
          id: string
          is_read: boolean | null
          is_starred: boolean | null
          labels: string[] | null
          received_at: string
          snippet: string | null
          snoozed_until: string | null
          subject: string | null
          thread_id: string | null
          thread_summary: string | null
          thread_summary_updated_at: string | null
          to_emails: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_category?: string | null
          ai_urgency?: string | null
          body_html?: string | null
          body_text?: string | null
          cc_emails?: string[] | null
          connection_id: string
          created_at?: string
          customer_sentiment?: string | null
          external_id: string
          follow_up_at?: string | null
          from_email: string
          from_name?: string | null
          has_attachments?: boolean | null
          id?: string
          is_read?: boolean | null
          is_starred?: boolean | null
          labels?: string[] | null
          received_at: string
          snippet?: string | null
          snoozed_until?: string | null
          subject?: string | null
          thread_id?: string | null
          thread_summary?: string | null
          thread_summary_updated_at?: string | null
          to_emails?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_category?: string | null
          ai_urgency?: string | null
          body_html?: string | null
          body_text?: string | null
          cc_emails?: string[] | null
          connection_id?: string
          created_at?: string
          customer_sentiment?: string | null
          external_id?: string
          follow_up_at?: string | null
          from_email?: string
          from_name?: string | null
          has_attachments?: boolean | null
          id?: string
          is_read?: boolean | null
          is_starred?: boolean | null
          labels?: string[] | null
          received_at?: string
          snippet?: string | null
          snoozed_until?: string | null
          subject?: string | null
          thread_id?: string | null
          thread_summary?: string | null
          thread_summary_updated_at?: string | null
          to_emails?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emails_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "email_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emails_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "email_connections_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          ai_summary: string | null
          amount: number | null
          category: Database["public"]["Enums"]["transaction_category"] | null
          created_at: string | null
          customer_id: string | null
          due_date: string | null
          file_path: string
          id: string
          invoice_date: string | null
          invoice_number: string | null
          status: string | null
          supplier: string | null
          supplier_id: string | null
          updated_at: string | null
          user_id: string
          vat_amount: number | null
        }
        Insert: {
          ai_summary?: string | null
          amount?: number | null
          category?: Database["public"]["Enums"]["transaction_category"] | null
          created_at?: string | null
          customer_id?: string | null
          due_date?: string | null
          file_path: string
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          status?: string | null
          supplier?: string | null
          supplier_id?: string | null
          updated_at?: string | null
          user_id: string
          vat_amount?: number | null
        }
        Update: {
          ai_summary?: string | null
          amount?: number | null
          category?: Database["public"]["Enums"]["transaction_category"] | null
          created_at?: string | null
          customer_id?: string | null
          due_date?: string | null
          file_path?: string
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          status?: string | null
          supplier?: string | null
          supplier_id?: string | null
          updated_at?: string | null
          user_id?: string
          vat_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_name: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          onboarding_completed: boolean
          phone: string | null
          updated_at: string
          vat_number: string | null
        }
        Insert: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          onboarding_completed?: boolean
          phone?: string | null
          updated_at?: string
          vat_number?: string | null
        }
        Update: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean
          phone?: string | null
          updated_at?: string
          vat_number?: string | null
        }
        Relationships: []
      }
      quote_lines: {
        Row: {
          created_at: string
          description: string
          id: string
          quantity: number
          quote_id: string
          sort_order: number
          total: number
          unit_price: number
          vat_rate: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          quantity?: number
          quote_id: string
          sort_order?: number
          total?: number
          unit_price?: number
          vat_rate?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          quantity?: number
          quote_id?: string
          sort_order?: number
          total?: number
          unit_price?: number
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_lines_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          created_at: string
          customer_id: string | null
          description: string | null
          id: string
          notes: string | null
          quote_number: string | null
          status: string
          subtotal: number | null
          total: number | null
          updated_at: string
          user_id: string
          valid_until: string | null
          vat_amount: number | null
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          quote_number?: string | null
          status?: string
          subtotal?: number | null
          total?: number | null
          updated_at?: string
          user_id: string
          valid_until?: string | null
          vat_amount?: number | null
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          quote_number?: string | null
          status?: string
          subtotal?: number | null
          total?: number | null
          updated_at?: string
          user_id?: string
          valid_until?: string | null
          vat_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          ai_summary: string | null
          amount: number | null
          category: Database["public"]["Enums"]["transaction_category"] | null
          created_at: string | null
          file_path: string
          id: string
          merchant: string | null
          receipt_date: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_summary?: string | null
          amount?: number | null
          category?: Database["public"]["Enums"]["transaction_category"] | null
          created_at?: string | null
          file_path: string
          id?: string
          merchant?: string | null
          receipt_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_summary?: string | null
          amount?: number | null
          category?: Database["public"]["Enums"]["transaction_category"] | null
          created_at?: string | null
          file_path?: string
          id?: string
          merchant?: string | null
          receipt_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          created_at: string
          email: string | null
          iban: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
          vat_number: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          iban?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
          vat_number?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          iban?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
          vat_number?: string | null
        }
        Relationships: []
      }
      team_invitations: {
        Row: {
          accepted: boolean | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          inviter_id: string
          role: Database["public"]["Enums"]["app_role"]
          token: string
        }
        Insert: {
          accepted?: boolean | null
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          inviter_id: string
          role: Database["public"]["Enums"]["app_role"]
          token: string
        }
        Update: {
          accepted?: boolean | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          inviter_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
        }
        Relationships: []
      }
      time_entries: {
        Row: {
          billable: boolean | null
          created_at: string
          customer_id: string | null
          description: string | null
          duration_minutes: number | null
          end_time: string | null
          hourly_rate: number | null
          id: string
          invoiced: boolean | null
          project: string | null
          start_time: string
          updated_at: string
          user_id: string
        }
        Insert: {
          billable?: boolean | null
          created_at?: string
          customer_id?: string | null
          description?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          hourly_rate?: number | null
          id?: string
          invoiced?: boolean | null
          project?: string | null
          start_time: string
          updated_at?: string
          user_id: string
        }
        Update: {
          billable?: boolean | null
          created_at?: string
          customer_id?: string | null
          description?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          hourly_rate?: number | null
          id?: string
          invoiced?: boolean | null
          project?: string | null
          start_time?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["transaction_category"]
          created_at: string | null
          date: string
          description: string | null
          id: string
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          category: Database["public"]["Enums"]["transaction_category"]
          created_at?: string | null
          date: string
          description?: string | null
          id?: string
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["transaction_category"]
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      usage_tracking: {
        Row: {
          ai_call_count: number
          created_at: string | null
          email_count: number
          id: string
          month_year: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_call_count?: number
          created_at?: string | null
          email_count?: number
          id?: string
          month_year: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_call_count?: number
          created_at?: string | null
          email_count?: number
          id?: string
          month_year?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          accent_color: string | null
          ai_custom_personality: string | null
          ai_personality: string | null
          ai_tone: string | null
          auto_categorize: boolean | null
          auto_export_enabled: boolean
          auto_reply_enabled: boolean | null
          auto_vat_calculation: boolean | null
          compact_layout: boolean | null
          created_at: string
          dashboard_widgets: Json | null
          email_signature: string | null
          id: string
          language: string | null
          monthly_summary: boolean | null
          quick_actions: Json | null
          sidebar_favorites: string[] | null
          sidebar_order: Json | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_current_period_end: string | null
          subscription_product_id: string | null
          subscription_status: string | null
          tag_suggestions: boolean | null
          theme: string | null
          trial_end_date: string | null
          trial_start_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accent_color?: string | null
          ai_custom_personality?: string | null
          ai_personality?: string | null
          ai_tone?: string | null
          auto_categorize?: boolean | null
          auto_export_enabled?: boolean
          auto_reply_enabled?: boolean | null
          auto_vat_calculation?: boolean | null
          compact_layout?: boolean | null
          created_at?: string
          dashboard_widgets?: Json | null
          email_signature?: string | null
          id?: string
          language?: string | null
          monthly_summary?: boolean | null
          quick_actions?: Json | null
          sidebar_favorites?: string[] | null
          sidebar_order?: Json | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_current_period_end?: string | null
          subscription_product_id?: string | null
          subscription_status?: string | null
          tag_suggestions?: boolean | null
          theme?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accent_color?: string | null
          ai_custom_personality?: string | null
          ai_personality?: string | null
          ai_tone?: string | null
          auto_categorize?: boolean | null
          auto_export_enabled?: boolean
          auto_reply_enabled?: boolean | null
          auto_vat_calculation?: boolean | null
          compact_layout?: boolean | null
          created_at?: string
          dashboard_widgets?: Json | null
          email_signature?: string | null
          id?: string
          language?: string | null
          monthly_summary?: boolean | null
          quick_actions?: Json | null
          sidebar_favorites?: string[] | null
          sidebar_order?: Json | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_current_period_end?: string | null
          subscription_product_id?: string | null
          subscription_status?: string | null
          tag_suggestions?: boolean | null
          theme?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      email_connections_safe: {
        Row: {
          created_at: string | null
          email_address: string | null
          id: string | null
          imap_host: string | null
          imap_port: number | null
          is_active: boolean | null
          last_sync_at: string | null
          provider: string | null
          smtp_host: string | null
          smtp_port: number | null
          sync_error: string | null
          updated_at: string | null
          use_ssl: boolean | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email_address?: string | null
          id?: string | null
          imap_host?: string | null
          imap_port?: number | null
          is_active?: boolean | null
          last_sync_at?: string | null
          provider?: string | null
          smtp_host?: string | null
          smtp_port?: number | null
          sync_error?: string | null
          updated_at?: string | null
          use_ssl?: boolean | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email_address?: string | null
          id?: string | null
          imap_host?: string | null
          imap_port?: number | null
          is_active?: boolean | null
          last_sync_at?: string | null
          provider?: string | null
          smtp_host?: string | null
          smtp_port?: number | null
          sync_error?: string | null
          updated_at?: string | null
          use_ssl?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_audit_event: {
        Args: {
          _action: string
          _endpoint?: string
          _ip_address?: string
          _status: string
          _user_agent?: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "owner" | "admin" | "agent" | "finance" | "viewer"
      document_type: "invoice" | "receipt" | "contract" | "offer" | "other"
      transaction_category:
        | "marketing"
        | "software"
        | "hardware"
        | "office"
        | "travel"
        | "food"
        | "utilities"
        | "salary"
        | "tax"
        | "insurance"
        | "other"
      transaction_type: "income" | "expense"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["owner", "admin", "agent", "finance", "viewer"],
      document_type: ["invoice", "receipt", "contract", "offer", "other"],
      transaction_category: [
        "marketing",
        "software",
        "hardware",
        "office",
        "travel",
        "food",
        "utilities",
        "salary",
        "tax",
        "insurance",
        "other",
      ],
      transaction_type: ["income", "expense"],
    },
  },
} as const
