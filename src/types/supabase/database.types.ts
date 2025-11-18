// Database types for Supabase
// Auto-generated types will go here after running: npx supabase gen types typescript

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      admins: {
        Row: {
          id: string
          email: string
          password: string
          business_name: string
          phone: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          password: string
          business_name: string
          phone: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          password?: string
          business_name?: string
          phone?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      branches: {
        Row: {
          id: string
          name: string
          code: string
          address: string
          phone: string
          email: string | null
          manager_name: string | null
          is_active: boolean
          admin_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          address: string
          phone: string
          email?: string | null
          manager_name?: string | null
          is_active?: boolean
          admin_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          address?: string
          phone?: string
          email?: string | null
          manager_name?: string | null
          is_active?: boolean
          admin_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      employees: {
        Row: {
          id: string
          full_name: string
          email: string
          phone: string
          role: string
          branch_id: string
          avatar_url: string | null
          is_active: boolean
          hourly_rate: number
          employee_pin: string
          qr_code: string | null
          join_date: string | null
          admin_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          full_name: string
          email: string
          phone: string
          role: string
          branch_id: string
          avatar_url?: string | null
          is_active?: boolean
          hourly_rate: number
          employee_pin: string
          qr_code?: string | null
          join_date?: string | null
          admin_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          phone?: string
          role?: string
          branch_id?: string
          avatar_url?: string | null
          is_active?: boolean
          hourly_rate?: number
          employee_pin?: string
          qr_code?: string | null
          join_date?: string | null
          admin_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          sku: string
          name: string
          description: string | null
          category_id: string
          category: string | null
          base_price: number
          cost_price: number
          tax_rate: number
          unit: string
          image_url: string | null
          is_active: boolean
          stock: number
          min_stock_level: number
          track_stock: boolean
          has_options: boolean
          options: Json | null
          branch_id: string
          admin_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sku: string
          name: string
          description?: string | null
          category_id: string
          category?: string | null
          base_price: number
          cost_price: number
          tax_rate: number
          unit: string
          image_url?: string | null
          is_active?: boolean
          stock?: number
          min_stock_level?: number
          track_stock?: boolean
          has_options?: boolean
          options?: Json | null
          branch_id: string
          admin_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sku?: string
          name?: string
          description?: string | null
          category_id?: string
          category?: string | null
          base_price?: number
          cost_price?: number
          tax_rate?: number
          unit?: string
          image_url?: string | null
          is_active?: boolean
          stock?: number
          min_stock_level?: number
          track_stock?: boolean
          has_options?: boolean
          options?: Json | null
          branch_id?: string
          admin_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          show_in_pos: boolean
          sort_order: number
          branch_id: string
          admin_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          show_in_pos?: boolean
          sort_order?: number
          branch_id: string
          admin_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          show_in_pos?: boolean
          sort_order?: number
          branch_id?: string
          admin_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      sales: {
        Row: {
          id: string
          branch_id: string
          cashier_id: string
          sale_number: string
          sale_date: string
          subtotal: number
          tax_amount: number
          discount_amount: number
          total_amount: number
          payment_method: string
          payment_status: string
          notes: string | null
          items: Json
          paid_amount: number | null
          remaining_amount: number | null
          admin_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          branch_id: string
          cashier_id: string
          sale_number: string
          sale_date: string
          subtotal: number
          tax_amount: number
          discount_amount: number
          total_amount: number
          payment_method: string
          payment_status: string
          notes?: string | null
          items: Json
          paid_amount?: number | null
          remaining_amount?: number | null
          admin_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          branch_id?: string
          cashier_id?: string
          sale_number?: string
          sale_date?: string
          subtotal?: number
          tax_amount?: number
          discount_amount?: number
          total_amount?: number
          payment_method?: string
          payment_status?: string
          notes?: string | null
          items?: Json
          paid_amount?: number | null
          remaining_amount?: number | null
          admin_id?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
