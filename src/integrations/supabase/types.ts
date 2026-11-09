export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      appointments: {
        Row: {
          business_id: string;
          created_at: string;
          customer_id: string | null;
          id: string;
          kind: string;
          notes: string | null;
          order_id: string | null;
          starts_at: string;
          title: string;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          customer_id?: string | null;
          id?: string;
          kind?: string;
          notes?: string | null;
          order_id?: string | null;
          starts_at: string;
          title: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          customer_id?: string | null;
          id?: string;
          kind?: string;
          notes?: string | null;
          order_id?: string | null;
          starts_at?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "appointments_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "order_balances";
            referencedColumns: ["order_id"];
          },
          {
            foreignKeyName: "appointments_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          action: string;
          business_id: string;
          created_at: string;
          entity: string;
          entity_id: string | null;
          id: string;
          summary: string;
        };
        Insert: {
          action: string;
          business_id: string;
          created_at?: string;
          entity: string;
          entity_id?: string | null;
          id?: string;
          summary: string;
        };
        Update: {
          action?: string;
          business_id?: string;
          created_at?: string;
          entity?: string;
          entity_id?: string | null;
          id?: string;
          summary?: string;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      businesses: {
        Row: {
          created_at: string;
          currency: string;
          email: string | null;
          id: string;
          logo_path: string | null;
          measurement_unit: string;
          name: string;
          owner_id: string;
          owner_name: string;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          currency?: string;
          email?: string | null;
          id?: string;
          logo_path?: string | null;
          measurement_unit?: string;
          name: string;
          owner_id: string;
          owner_name: string;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          currency?: string;
          email?: string | null;
          id?: string;
          logo_path?: string | null;
          measurement_unit?: string;
          name?: string;
          owner_id?: string;
          owner_name?: string;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      collection_assets: {
        Row: {
          asset_id: string;
          business_id: string;
          collection_id: string;
        };
        Insert: {
          asset_id: string;
          business_id: string;
          collection_id: string;
        };
        Update: {
          asset_id?: string;
          business_id?: string;
          collection_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "collection_assets_asset_id_fkey";
            columns: ["asset_id"];
            isOneToOne: false;
            referencedRelation: "style_assets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "collection_assets_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "collection_assets_collection_id_fkey";
            columns: ["collection_id"];
            isOneToOne: false;
            referencedRelation: "style_collections";
            referencedColumns: ["id"];
          },
        ];
      };
      customer_measurement_sets: {
        Row: {
          business_id: string;
          created_at: string;
          customer_id: string;
          garment: string;
          id: string;
          notes: string | null;
          taken_on: string;
          template_id: string | null;
          unit: string;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          customer_id: string;
          garment: string;
          id?: string;
          notes?: string | null;
          taken_on?: string;
          template_id?: string | null;
          unit?: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          customer_id?: string;
          garment?: string;
          id?: string;
          notes?: string | null;
          taken_on?: string;
          template_id?: string | null;
          unit?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customer_measurement_sets_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_measurement_sets_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_measurement_sets_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "measurement_templates";
            referencedColumns: ["id"];
          },
        ];
      };
      customer_measurement_values: {
        Row: {
          business_id: string;
          id: string;
          label: string;
          position: number;
          set_id: string;
          value: number;
        };
        Insert: {
          business_id: string;
          id?: string;
          label: string;
          position?: number;
          set_id: string;
          value: number;
        };
        Update: {
          business_id?: string;
          id?: string;
          label?: string;
          position?: number;
          set_id?: string;
          value?: number;
        };
        Relationships: [
          {
            foreignKeyName: "customer_measurement_values_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_measurement_values_set_id_fkey";
            columns: ["set_id"];
            isOneToOne: false;
            referencedRelation: "customer_measurement_sets";
            referencedColumns: ["id"];
          },
        ];
      };
      customer_style_assets: {
        Row: {
          asset_id: string;
          business_id: string;
          customer_id: string;
        };
        Insert: {
          asset_id: string;
          business_id: string;
          customer_id: string;
        };
        Update: {
          asset_id?: string;
          business_id?: string;
          customer_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customer_style_assets_asset_id_fkey";
            columns: ["asset_id"];
            isOneToOne: false;
            referencedRelation: "style_assets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_style_assets_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_style_assets_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      customers: {
        Row: {
          address: string | null;
          archived_at: string | null;
          business_id: string;
          created_at: string;
          email: string | null;
          full_name: string;
          id: string;
          notes: string | null;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          archived_at?: string | null;
          business_id: string;
          created_at?: string;
          email?: string | null;
          full_name: string;
          id?: string;
          notes?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          archived_at?: string | null;
          business_id?: string;
          created_at?: string;
          email?: string | null;
          full_name?: string;
          id?: string;
          notes?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customers_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      measurement_fields: {
        Row: {
          business_id: string;
          id: string;
          label: string;
          position: number;
          template_id: string;
        };
        Insert: {
          business_id: string;
          id?: string;
          label: string;
          position?: number;
          template_id: string;
        };
        Update: {
          business_id?: string;
          id?: string;
          label?: string;
          position?: number;
          template_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "measurement_fields_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "measurement_fields_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "measurement_templates";
            referencedColumns: ["id"];
          },
        ];
      };
      measurement_templates: {
        Row: {
          business_id: string;
          created_at: string;
          id: string;
          name: string;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          id?: string;
          name: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          id?: string;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "measurement_templates_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      order_measurement_snapshots: {
        Row: {
          business_id: string;
          created_at: string;
          garment: string;
          id: string;
          order_id: string;
          source_set_id: string | null;
          unit: string;
          values: Json;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          garment: string;
          id?: string;
          order_id: string;
          source_set_id?: string | null;
          unit: string;
          values?: Json;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          garment?: string;
          id?: string;
          order_id?: string;
          source_set_id?: string | null;
          unit?: string;
          values?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "order_measurement_snapshots_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_measurement_snapshots_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "order_balances";
            referencedColumns: ["order_id"];
          },
          {
            foreignKeyName: "order_measurement_snapshots_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      order_style_assets: {
        Row: {
          asset_id: string;
          business_id: string;
          order_id: string;
        };
        Insert: {
          asset_id: string;
          business_id: string;
          order_id: string;
        };
        Update: {
          asset_id?: string;
          business_id?: string;
          order_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_style_assets_asset_id_fkey";
            columns: ["asset_id"];
            isOneToOne: false;
            referencedRelation: "style_assets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_style_assets_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_style_assets_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "order_balances";
            referencedColumns: ["order_id"];
          },
          {
            foreignKeyName: "order_style_assets_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          business_id: string;
          created_at: string;
          customer_id: string;
          delivered_at: string | null;
          description: string | null;
          due_date: string | null;
          id: string;
          outfit_name: string;
          price: number;
          production_notes: string | null;
          quantity: number;
          status: Database["public"]["Enums"]["order_status"];
          updated_at: string;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          customer_id: string;
          delivered_at?: string | null;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          outfit_name: string;
          price?: number;
          production_notes?: string | null;
          quantity?: number;
          status?: Database["public"]["Enums"]["order_status"];
          updated_at?: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          customer_id?: string;
          delivered_at?: string | null;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          outfit_name?: string;
          price?: number;
          production_notes?: string | null;
          quantity?: number;
          status?: Database["public"]["Enums"]["order_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          amount: number;
          business_id: string;
          created_at: string;
          id: string;
          method: string;
          note: string | null;
          order_id: string;
          paid_on: string;
        };
        Insert: {
          amount: number;
          business_id: string;
          created_at?: string;
          id?: string;
          method?: string;
          note?: string | null;
          order_id: string;
          paid_on?: string;
        };
        Update: {
          amount?: number;
          business_id?: string;
          created_at?: string;
          id?: string;
          method?: string;
          note?: string | null;
          order_id?: string;
          paid_on?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "order_balances";
            referencedColumns: ["order_id"];
          },
          {
            foreignKeyName: "payments_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          full_name: string | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          full_name?: string | null;
          id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          full_name?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      style_assets: {
        Row: {
          business_id: string;
          category: string | null;
          created_at: string;
          description: string | null;
          height: number | null;
          id: string;
          storage_path: string;
          tags: string[];
          title: string;
          width: number | null;
        };
        Insert: {
          business_id: string;
          category?: string | null;
          created_at?: string;
          description?: string | null;
          height?: number | null;
          id?: string;
          storage_path: string;
          tags?: string[];
          title?: string;
          width?: number | null;
        };
        Update: {
          business_id?: string;
          category?: string | null;
          created_at?: string;
          description?: string | null;
          height?: number | null;
          id?: string;
          storage_path?: string;
          tags?: string[];
          title?: string;
          width?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "style_assets_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      style_collections: {
        Row: {
          business_id: string;
          created_at: string;
          description: string | null;
          id: string;
          name: string;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "style_collections_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      order_balances: {
        Row: {
          balance: number | null;
          business_id: string | null;
          order_id: string | null;
          paid: number | null;
          payment_status: string | null;
          price: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "orders_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      owns_business: { Args: { _bid: string }; Returns: boolean };
    };
    Enums: {
      order_status:
        | "pending"
        | "cutting"
        | "sewing"
        | "fitting"
        | "finishing"
        | "ready"
        | "delivered"
        | "cancelled";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      order_status: [
        "pending",
        "cutting",
        "sewing",
        "fitting",
        "finishing",
        "ready",
        "delivered",
        "cancelled",
      ],
    },
  },
} as const;
