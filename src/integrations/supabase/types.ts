export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          address: string | null
          city: string | null
          contact_person: string | null
          country: string | null
          created_at: string
          created_by: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          tax_number: string | null
          type: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string
          created_by: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          tax_number?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string
          created_by?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          tax_number?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          language: Database["public"]["Enums"]["quotation_language"] | null
          name: string
          setting_type: string
          value: Json
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          language?: Database["public"]["Enums"]["quotation_language"] | null
          name: string
          setting_type: string
          value: Json
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          language?: Database["public"]["Enums"]["quotation_language"] | null
          name?: string
          setting_type?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "company_settings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dictionary: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          key_name: string
          language: Database["public"]["Enums"]["quotation_language"]
          value: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          key_name: string
          language: Database["public"]["Enums"]["quotation_language"]
          value: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          key_name?: string
          language?: Database["public"]["Enums"]["quotation_language"]
          value?: string
        }
        Relationships: []
      }
      exhibition_followups: {
        Row: {
          company_id: string | null
          contact_person: string | null
          created_at: string
          created_by: string
          exhibition_id: string
          follow_up_date: string | null
          id: string
          notes: string | null
          status: string
        }
        Insert: {
          company_id?: string | null
          contact_person?: string | null
          created_at?: string
          created_by: string
          exhibition_id: string
          follow_up_date?: string | null
          id?: string
          notes?: string | null
          status?: string
        }
        Update: {
          company_id?: string | null
          contact_person?: string | null
          created_at?: string
          created_by?: string
          exhibition_id?: string
          follow_up_date?: string | null
          id?: string
          notes?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "exhibition_followups_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exhibition_followups_exhibition_id_fkey"
            columns: ["exhibition_id"]
            isOneToOne: false
            referencedRelation: "exhibitions"
            referencedColumns: ["id"]
          },
        ]
      }
      exhibitions: {
        Row: {
          actual_cost: number | null
          cost_currency: string | null
          created_at: string
          created_by: string
          end_date: string | null
          id: string
          location: string | null
          name: string
          notes: string | null
          start_date: string | null
          status: string
          target_cost: number | null
          type: string
          updated_at: string
        }
        Insert: {
          actual_cost?: number | null
          cost_currency?: string | null
          created_at?: string
          created_by: string
          end_date?: string | null
          id?: string
          location?: string | null
          name: string
          notes?: string | null
          start_date?: string | null
          status?: string
          target_cost?: number | null
          type: string
          updated_at?: string
        }
        Update: {
          actual_cost?: number | null
          cost_currency?: string | null
          created_at?: string
          created_by?: string
          end_date?: string | null
          id?: string
          location?: string | null
          name?: string
          notes?: string | null
          start_date?: string | null
          status?: string
          target_cost?: number | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      matrix_values: {
        Row: {
          created_at: string | null
          id: string
          matrix_id: string | null
          param_1_value: string | null
          param_2_value: string | null
          param_3_value: string | null
          param_4_value: string | null
          price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          matrix_id?: string | null
          param_1_value?: string | null
          param_2_value?: string | null
          param_3_value?: string | null
          param_4_value?: string | null
          price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          matrix_id?: string | null
          param_1_value?: string | null
          param_2_value?: string | null
          param_3_value?: string | null
          param_4_value?: string | null
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "matrix_values_matrix_id_fkey"
            columns: ["matrix_id"]
            isOneToOne: false
            referencedRelation: "product_matrices"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          currency: string
          delivery_date: string | null
          id: string
          notes: string | null
          order_number: string
          quotation_id: string | null
          status: string
          title: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          currency?: string
          delivery_date?: string | null
          id?: string
          notes?: string | null
          order_number: string
          quotation_id?: string | null
          status?: string
          title: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          currency?: string
          delivery_date?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          quotation_id?: string | null
          status?: string
          title?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      product_matrices: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          parameter_1_name: string | null
          parameter_2_name: string | null
          parameter_3_name: string | null
          parameter_4_name: string | null
          parameter_count: number | null
          product_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
          parameter_1_name?: string | null
          parameter_2_name?: string | null
          parameter_3_name?: string | null
          parameter_4_name?: string | null
          parameter_count?: number | null
          product_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          parameter_1_name?: string | null
          parameter_2_name?: string | null
          parameter_3_name?: string | null
          parameter_4_name?: string | null
          parameter_count?: number | null
          product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_matrices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_matrices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_properties: {
        Row: {
          conditional_display: string | null
          created_at: string | null
          display_order: number | null
          id: string
          language: Database["public"]["Enums"]["quotation_language"] | null
          product_id: string | null
          property_name: string
          property_value: string
          show_in_quotation: boolean | null
        }
        Insert: {
          conditional_display?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          language?: Database["public"]["Enums"]["quotation_language"] | null
          product_id?: string | null
          property_name: string
          property_value: string
          show_in_quotation?: boolean | null
        }
        Update: {
          conditional_display?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          language?: Database["public"]["Enums"]["quotation_language"] | null
          product_id?: string | null
          property_name?: string
          property_value?: string
          show_in_quotation?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "product_properties_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_sub_items: {
        Row: {
          created_at: string | null
          id: string
          parent_product_id: string | null
          quantity: number | null
          sub_product_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          parent_product_id?: string | null
          quantity?: number | null
          sub_product_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          parent_product_id?: string | null
          quantity?: number | null
          sub_product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_sub_items_parent_product_id_fkey"
            columns: ["parent_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_sub_items_sub_product_id_fkey"
            columns: ["sub_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand: string | null
          category_id: string | null
          created_at: string
          created_by: string
          currency: string
          description: string | null
          hs_code: string | null
          id: string
          ignore_sub_item_pricing: boolean | null
          image_url: string | null
          model: string | null
          name: string
          stock_quantity: number | null
          technical_specs: Json | null
          unit: string | null
          unit_price: number
          updated_at: string
          warranty_period: string | null
        }
        Insert: {
          brand?: string | null
          category_id?: string | null
          created_at?: string
          created_by: string
          currency?: string
          description?: string | null
          hs_code?: string | null
          id?: string
          ignore_sub_item_pricing?: boolean | null
          image_url?: string | null
          model?: string | null
          name: string
          stock_quantity?: number | null
          technical_specs?: Json | null
          unit?: string | null
          unit_price: number
          updated_at?: string
          warranty_period?: string | null
        }
        Update: {
          brand?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          description?: string | null
          hs_code?: string | null
          id?: string
          ignore_sub_item_pricing?: boolean | null
          image_url?: string | null
          model?: string | null
          name?: string
          stock_quantity?: number | null
          technical_specs?: Json | null
          unit?: string | null
          unit_price?: number
          updated_at?: string
          warranty_period?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      quotation_items: {
        Row: {
          created_at: string
          custom_properties: Json | null
          discount_percentage: number | null
          id: string
          is_sub_item: boolean | null
          parent_item_id: string | null
          product_id: string
          quantity: number
          quotation_id: string
          selected_matrix_id: string | null
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          custom_properties?: Json | null
          discount_percentage?: number | null
          id?: string
          is_sub_item?: boolean | null
          parent_item_id?: string | null
          product_id: string
          quantity: number
          quotation_id: string
          selected_matrix_id?: string | null
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          custom_properties?: Json | null
          discount_percentage?: number | null
          id?: string
          is_sub_item?: boolean | null
          parent_item_id?: string | null
          product_id?: string
          quantity?: number
          quotation_id?: string
          selected_matrix_id?: string | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotation_items_parent_item_id_fkey"
            columns: ["parent_item_id"]
            isOneToOne: false
            referencedRelation: "quotation_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_items_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_items_selected_matrix_id_fkey"
            columns: ["selected_matrix_id"]
            isOneToOne: false
            referencedRelation: "product_matrices"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_responsibilities: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          language: Database["public"]["Enums"]["quotation_language"] | null
          quotation_id: string | null
          responsibility_type: string
          responsible_party: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          language?: Database["public"]["Enums"]["quotation_language"] | null
          quotation_id?: string | null
          responsibility_type: string
          responsible_party: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          language?: Database["public"]["Enums"]["quotation_language"] | null
          quotation_id?: string | null
          responsibility_type?: string
          responsible_party?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotation_responsibilities_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          currency: string
          id: string
          language: Database["public"]["Enums"]["quotation_language"] | null
          notes: string | null
          parent_quotation_id: string | null
          prepared_by: string | null
          quotation_date: string | null
          quotation_number: string
          reviewed_by: string | null
          revision_number: number | null
          status: string
          title: string
          total_amount: number
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          currency?: string
          id?: string
          language?: Database["public"]["Enums"]["quotation_language"] | null
          notes?: string | null
          parent_quotation_id?: string | null
          prepared_by?: string | null
          quotation_date?: string | null
          quotation_number: string
          reviewed_by?: string | null
          revision_number?: number | null
          status?: string
          title: string
          total_amount?: number
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          currency?: string
          id?: string
          language?: Database["public"]["Enums"]["quotation_language"] | null
          notes?: string | null
          parent_quotation_id?: string | null
          prepared_by?: string | null
          quotation_date?: string | null
          quotation_number?: string
          reviewed_by?: string | null
          revision_number?: number | null
          status?: string
          title?: string
          total_amount?: number
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_parent_quotation_id_fkey"
            columns: ["parent_quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_prepared_by_fkey"
            columns: ["prepared_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      currency_type: "EUR" | "USD" | "TRY"
      quotation_language: "TR" | "EN" | "PL" | "FR" | "RU" | "DE" | "AR"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      currency_type: ["EUR", "USD", "TRY"],
      quotation_language: ["TR", "EN", "PL", "FR", "RU", "DE", "AR"],
    },
  },
} as const
