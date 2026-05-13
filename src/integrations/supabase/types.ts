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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string
          created_at: string
          id: string
          is_default: boolean
          label: string
          line1: string
          pincode: string
          user_id: string
        }
        Insert: {
          city: string
          created_at?: string
          id?: string
          is_default?: boolean
          label: string
          line1: string
          pincode: string
          user_id: string
        }
        Update: {
          city?: string
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          line1?: string
          pincode?: string
          user_id?: string
        }
        Relationships: []
      }
      cart: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          product_id: string
          quantity: number
          shop_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          product_id: string
          quantity?: number
          shop_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          product_id?: string
          quantity?: number
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      deliveries: {
        Row: {
          courier: string | null
          id: string
          order_id: string
          status: Database["public"]["Enums"]["delivery_status"]
          tracking_no: string | null
          updated_at: string
        }
        Insert: {
          courier?: string | null
          id?: string
          order_id: string
          status?: Database["public"]["Enums"]["delivery_status"]
          tracking_no?: string | null
          updated_at?: string
        }
        Update: {
          courier?: string | null
          id?: string
          order_id?: string
          status?: Database["public"]["Enums"]["delivery_status"]
          tracking_no?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          id: string
          product_id: string
          quantity: number
          shop_id: string
          shop_price: number
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          quantity?: number
          shop_id: string
          shop_price?: number
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          quantity?: number
          shop_id?: string
          shop_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
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
          address: string | null
          created_at: string
          customer_id: string
          id: string
          shop_id: string
          status: Database["public"]["Enums"]["order_status"]
          token_code: string | null
          total: number
          type: Database["public"]["Enums"]["order_type"]
        }
        Insert: {
          address?: string | null
          created_at?: string
          customer_id: string
          id?: string
          shop_id: string
          status?: Database["public"]["Enums"]["order_status"]
          token_code?: string | null
          total?: number
          type?: Database["public"]["Enums"]["order_type"]
        }
        Update: {
          address?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          shop_id?: string
          status?: Database["public"]["Enums"]["order_status"]
          token_code?: string | null
          total?: number
          type?: Database["public"]["Enums"]["order_type"]
        }
        Relationships: [
          {
            foreignKeyName: "orders_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          admin_profit_pct: number
          base_price: number
          brand: string | null
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          specifications: Json
        }
        Insert: {
          admin_profit_pct?: number
          base_price?: number
          brand?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          specifications?: Json
        }
        Update: {
          admin_profit_pct?: number
          base_price?: number
          brand?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          specifications?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      repair_offers: {
        Row: {
          accepted: boolean | null
          cost: number
          created_at: string
          eta_days: number
          id: string
          notes: string | null
          repair_id: string
          shop_id: string
        }
        Insert: {
          accepted?: boolean | null
          cost: number
          created_at?: string
          eta_days: number
          id?: string
          notes?: string | null
          repair_id: string
          shop_id: string
        }
        Update: {
          accepted?: boolean | null
          cost?: number
          created_at?: string
          eta_days?: number
          id?: string
          notes?: string | null
          repair_id?: string
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "repair_offers_repair_id_fkey"
            columns: ["repair_id"]
            isOneToOne: false
            referencedRelation: "repairs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repair_offers_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      repairs: {
        Row: {
          created_at: string
          customer_id: string
          device: string
          id: string
          issue: string
          shop_id: string | null
          status: Database["public"]["Enums"]["repair_status"]
        }
        Insert: {
          created_at?: string
          customer_id: string
          device: string
          id?: string
          issue: string
          shop_id?: string | null
          status?: Database["public"]["Enums"]["repair_status"]
        }
        Update: {
          created_at?: string
          customer_id?: string
          device?: string
          id?: string
          issue?: string
          shop_id?: string | null
          status?: Database["public"]["Enums"]["repair_status"]
        }
        Relationships: [
          {
            foreignKeyName: "repairs_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shops: {
        Row: {
          active: boolean
          address: string
          city: string
          created_at: string
          id: string
          name: string
          owner_id: string | null
          phone: string | null
        }
        Insert: {
          active?: boolean
          address: string
          city: string
          created_at?: string
          id?: string
          name: string
          owner_id?: string | null
          phone?: string | null
        }
        Update: {
          active?: boolean
          address?: string
          city?: string
          created_at?: string
          id?: string
          name?: string
          owner_id?: string | null
          phone?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_is_admin: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "customer" | "shop_owner" | "admin"
      delivery_status:
        | "pending"
        | "assigned"
        | "in_transit"
        | "delivered"
        | "failed"
      order_status:
        | "pending"
        | "confirmed"
        | "preparing"
        | "shipped"
        | "delivered"
        | "collected"
        | "cancelled"
      order_type: "online" | "buy_at_shop"
      repair_status:
        | "requested"
        | "offer_sent"
        | "accepted"
        | "in_progress"
        | "completed"
        | "cancelled"
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
      app_role: ["customer", "shop_owner", "admin"],
      delivery_status: [
        "pending",
        "assigned",
        "in_transit",
        "delivered",
        "failed",
      ],
      order_status: [
        "pending",
        "confirmed",
        "preparing",
        "shipped",
        "delivered",
        "collected",
        "cancelled",
      ],
      order_type: ["online", "buy_at_shop"],
      repair_status: [
        "requested",
        "offer_sent",
        "accepted",
        "in_progress",
        "completed",
        "cancelled",
      ],
    },
  },
} as const
