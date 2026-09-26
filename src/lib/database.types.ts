export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          business_type: string;
          currency_code: string;
          timezone: string;
          phone: string | null;
          email: string | null;
          logo_url: string | null;
          status: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          business_type?: string;
          currency_code?: string;
          timezone?: string;
          phone?: string | null;
          email?: string | null;
          logo_url?: string | null;
          status?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["organizations"]["Insert"]>;
        Relationships: [];
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role_id: string | null;
          status: string;
          joined_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role_id?: string | null;
          status?: string;
          joined_at?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["organization_members"]["Insert"]
        >;
        Relationships: [];
      };
      branches: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          code: string;
          phone: string | null;
          email: string | null;
          address_line_1: string | null;
          address_line_2: string | null;
          city: string | null;
          state: string | null;
          country: string | null;
          timezone: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          code: string;
          phone?: string | null;
          email?: string | null;
          address_line_1?: string | null;
          address_line_2?: string | null;
          city?: string | null;
          state?: string | null;
          country?: string | null;
          timezone?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["branches"]["Insert"]>;
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          description: string | null;
          category_id: string | null;
          brand_id: string | null;
          product_type: string;
          tax_rate: number;
          track_inventory: boolean;
          allow_negative_stock: boolean;
          low_stock_threshold: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          description?: string | null;
          category_id?: string | null;
          brand_id?: string | null;
          product_type?: string;
          tax_rate?: number;
          track_inventory?: boolean;
          allow_negative_stock?: boolean;
          low_stock_threshold?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [];
      };
      product_variants: {
        Row: {
          id: string;
          organization_id: string;
          product_id: string;
          name: string;
          sku: string | null;
          barcode: string | null;
          cost_price: number;
          selling_price: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          product_id: string;
          name?: string;
          sku?: string | null;
          barcode?: string | null;
          cost_price?: number;
          selling_price?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["product_variants"]["Insert"]
        >;
        Relationships: [];
      };
      branch_inventory: {
        Row: {
          id: string;
          organization_id: string;
          branch_id: string;
          variant_id: string;
          quantity_on_hand: number;
          quantity_reserved: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          branch_id: string;
          variant_id: string;
          quantity_on_hand?: number;
          quantity_reserved?: number;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["branch_inventory"]["Insert"]
        >;
        Relationships: [];
      };
      inventory_movements: {
        Row: {
          id: string;
          organization_id: string;
          branch_id: string;
          variant_id: string;
          movement_type: string;
          quantity: number;
          reference_type: string | null;
          reference_id: string | null;
          unit_cost: number | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          branch_id: string;
          variant_id: string;
          movement_type: string;
          quantity: number;
          reference_type?: string | null;
          reference_id?: string | null;
          unit_cost?: number | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["inventory_movements"]["Insert"]
        >;
        Relationships: [];
      };
      register_shifts: {
        Row: { id: string; organization_id: string; branch_id: string; opened_by: string; closed_by: string | null; opening_cash: number; closing_cash: number | null; expected_cash: number | null; status: string; opened_at: string; closed_at: string | null };
        Insert: { id?: string; organization_id: string; branch_id: string; opened_by: string; closed_by?: string | null; opening_cash?: number; closing_cash?: number | null; expected_cash?: number | null; status?: string; opened_at?: string; closed_at?: string | null };
        Update: Partial<Database["public"]["Tables"]["register_shifts"]["Insert"]>;
        Relationships: [];
      };
      sales: {
        Row: { id: string; organization_id: string; branch_id: string; register_shift_id: string | null; customer_id: string | null; checkout_key: string | null; receipt_number: string; status: string; subtotal: number; discount_total: number; tax_total: number; grand_total: number; paid_total: number; change_total: number; notes: string | null; created_by: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; organization_id: string; branch_id: string; register_shift_id?: string | null; customer_id?: string | null; checkout_key?: string | null; receipt_number: string; status?: string; subtotal?: number; discount_total?: number; tax_total?: number; grand_total?: number; paid_total?: number; change_total?: number; notes?: string | null; created_by?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["sales"]["Insert"]>;
        Relationships: [];
      };
      sale_items: {
        Row: { id: string; organization_id: string; sale_id: string; variant_id: string; quantity: number; unit_price: number; unit_cost: number; discount_total: number; tax_total: number; line_total: number };
        Insert: { id?: string; organization_id: string; sale_id: string; variant_id: string; quantity: number; unit_price: number; unit_cost?: number; discount_total?: number; tax_total?: number; line_total: number };
        Update: Partial<Database["public"]["Tables"]["sale_items"]["Insert"]>;
        Relationships: [];
      };
      sale_payments: {
        Row: { id: string; organization_id: string; sale_id: string; method: string; amount: number; reference_number: string | null; created_at: string };
        Insert: { id?: string; organization_id: string; sale_id: string; method: string; amount: number; reference_number?: string | null; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["sale_payments"]["Insert"]>;
        Relationships: [];
      };
      sale_returns: {
        Row: { id: string; organization_id: string; branch_id: string; sale_id: string; register_shift_id: string | null; return_key: string | null; return_number: string; refund_method: string; refund_total: number; reason: string | null; created_by: string | null; created_at: string };
        Insert: { id?: string; organization_id: string; branch_id: string; sale_id: string; register_shift_id?: string | null; return_key?: string | null; return_number: string; refund_method?: string; refund_total?: number; reason?: string | null; created_by?: string | null; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["sale_returns"]["Insert"]>;
        Relationships: [];
      };
      sale_return_items: {
        Row: { id: string; organization_id: string; sale_return_id: string; sale_item_id: string; variant_id: string; quantity: number; refund_total: number };
        Insert: { id?: string; organization_id: string; sale_return_id: string; sale_item_id: string; variant_id: string; quantity: number; refund_total: number };
        Update: Partial<Database["public"]["Tables"]["sale_return_items"]["Insert"]>;
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          phone: string | null;
          email: string | null;
          address: string | null;
          loyalty_points: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          loyalty_points?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["customers"]["Insert"]>;
        Relationships: [];
      };
      suppliers: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          phone: string | null;
          email: string | null;
          address: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["suppliers"]["Insert"]>;
        Relationships: [];
      };
      purchases: {
        Row: {
          id: string;
          organization_id: string;
          branch_id: string;
          supplier_id: string | null;
          purchase_number: string;
          status: string;
          subtotal: number;
          discount_total: number;
          tax_total: number;
          grand_total: number;
          paid_total: number;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          branch_id: string;
          supplier_id?: string | null;
          purchase_number: string;
          status?: string;
          subtotal?: number;
          discount_total?: number;
          tax_total?: number;
          grand_total?: number;
          paid_total?: number;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["purchases"]["Insert"]>;
        Relationships: [];
      };
      purchase_items: {
        Row: {
          id: string;
          organization_id: string;
          purchase_id: string;
          variant_id: string;
          quantity: number;
          unit_cost: number;
          discount_total: number;
          tax_total: number;
          line_total: number;
        };
        Insert: {
          id?: string;
          organization_id: string;
          purchase_id: string;
          variant_id: string;
          quantity: number;
          unit_cost: number;
          discount_total?: number;
          tax_total?: number;
          line_total: number;
        };
        Update: Partial<Database["public"]["Tables"]["purchase_items"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      return_cash_sale: { Args: { p_organization_id: string; p_branch_id: string; p_shift_id: string; p_sale_id: string; p_return_key: string; p_items: Json; p_reason: string }; Returns: string };
      open_register: { Args: { p_organization_id: string; p_branch_id: string; p_opening_cash: number }; Returns: string };
      close_register: { Args: { p_organization_id: string; p_branch_id: string; p_shift_id: string; p_closing_cash: number }; Returns: undefined };
      complete_cash_sale: { Args: { p_organization_id: string; p_branch_id: string; p_shift_id: string; p_checkout_key: string; p_items: Json; p_cash_received: number }; Returns: string };
      adjust_branch_inventory: {
        Args: {
          p_organization_id: string;
          p_branch_id: string;
          p_variant_id: string;
          p_adjustment: number;
          p_notes: string;
        };
        Returns: number;
      };
      create_product_with_inventory: {
        Args: {
          p_organization_id: string;
          p_branch_id: string;
          p_name: string;
          p_sku: string;
          p_barcode: string;
          p_cost_price: number;
          p_selling_price: number;
          p_opening_stock: number;
          p_low_stock_threshold: number;
        };
        Returns: { product_id: string; variant_id: string }[];
      };
      create_retail_workspace: {
        Args: {
          organization_name: string;
          organization_slug: string;
          branch_name: string;
          branch_code: string;
          currency_code?: string;
          timezone?: string;
        };
        Returns: {
          organization_id: string;
          branch_id: string;
        }[];
      };
      set_product_active_status: {
        Args: {
          p_organization_id: string;
          p_product_id: string;
          p_is_active: boolean;
        };
        Returns: undefined;
      };
      update_product_details: {
        Args: {
          p_organization_id: string;
          p_product_id: string;
          p_variant_id: string;
          p_name: string;
          p_sku: string;
          p_barcode: string;
          p_cost_price: number;
          p_selling_price: number;
          p_low_stock_threshold: number;
        };
        Returns: undefined;
      };
      is_org_member: {
        Args: { target_organization_id: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
