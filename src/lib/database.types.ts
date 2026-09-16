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
      };
      branches: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          code: string;
          phone: string | null;
          email: string | null;
          city: string | null;
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
          city?: string | null;
          country?: string | null;
          timezone?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["branches"]["Insert"]>;
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
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_org_member: {
        Args: { target_organization_id: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
