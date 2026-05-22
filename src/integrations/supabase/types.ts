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
      approval_audit_log: {
        Row: {
          action: string
          actor_user_id: string | null
          company_id: string
          created_at: string
          id: string
          new_status: Database["public"]["Enums"]["user_approval_status"] | null
          previous_status:
            | Database["public"]["Enums"]["user_approval_status"]
            | null
          reason: string | null
          role_slug: string | null
          target_user_id: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          company_id: string
          created_at?: string
          id?: string
          new_status?:
            | Database["public"]["Enums"]["user_approval_status"]
            | null
          previous_status?:
            | Database["public"]["Enums"]["user_approval_status"]
            | null
          reason?: string | null
          role_slug?: string | null
          target_user_id: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          company_id?: string
          created_at?: string
          id?: string
          new_status?:
            | Database["public"]["Enums"]["user_approval_status"]
            | null
          previous_status?:
            | Database["public"]["Enums"]["user_approval_status"]
            | null
          reason?: string | null
          role_slug?: string | null
          target_user_id?: string
        }
        Relationships: []
      }
      batch_barcodes: {
        Row: {
          batch_id: string
          box_number: number | null
          carton_number_total: number | null
          code: string
          company_id: string
          container_id: string | null
          created_at: string
          created_by: string | null
          current_location: Database["public"]["Enums"]["barcode_location"]
          id: string
          last_scanned_at: string | null
          last_scanned_by: string | null
          level: string
          net_weight: number | null
          packing_date: string | null
          scan_count: number
          shipment_id: string | null
          sku_code: string | null
          status: string
          updated_at: string
        }
        Insert: {
          batch_id: string
          box_number?: number | null
          carton_number_total?: number | null
          code: string
          company_id: string
          container_id?: string | null
          created_at?: string
          created_by?: string | null
          current_location?: Database["public"]["Enums"]["barcode_location"]
          id?: string
          last_scanned_at?: string | null
          last_scanned_by?: string | null
          level?: string
          net_weight?: number | null
          packing_date?: string | null
          scan_count?: number
          shipment_id?: string | null
          sku_code?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          batch_id?: string
          box_number?: number | null
          carton_number_total?: number | null
          code?: string
          company_id?: string
          container_id?: string | null
          created_at?: string
          created_by?: string | null
          current_location?: Database["public"]["Enums"]["barcode_location"]
          id?: string
          last_scanned_at?: string | null
          last_scanned_by?: string | null
          level?: string
          net_weight?: number | null
          packing_date?: string | null
          scan_count?: number
          shipment_id?: string | null
          sku_code?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "batch_barcodes_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "inventory_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          base_currency: string | null
          country: string | null
          created_at: string
          id: string
          name: string
          plan: string | null
          slug: string | null
          updated_at: string
        }
        Insert: {
          base_currency?: string | null
          country?: string | null
          created_at?: string
          id?: string
          name: string
          plan?: string | null
          slug?: string | null
          updated_at?: string
        }
        Update: {
          base_currency?: string | null
          country?: string | null
          created_at?: string
          id?: string
          name?: string
          plan?: string | null
          slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      farmers: {
        Row: {
          bank_account: string | null
          code: string | null
          company_id: string
          country: string | null
          created_at: string
          district: string | null
          email: string | null
          full_name: string
          id: string
          ifsc_code: string | null
          is_active: boolean
          notes: string | null
          phone: string | null
          primary_crops: string[] | null
          state: string | null
          updated_at: string
          village: string | null
        }
        Insert: {
          bank_account?: string | null
          code?: string | null
          company_id: string
          country?: string | null
          created_at?: string
          district?: string | null
          email?: string | null
          full_name: string
          id?: string
          ifsc_code?: string | null
          is_active?: boolean
          notes?: string | null
          phone?: string | null
          primary_crops?: string[] | null
          state?: string | null
          updated_at?: string
          village?: string | null
        }
        Update: {
          bank_account?: string | null
          code?: string | null
          company_id?: string
          country?: string | null
          created_at?: string
          district?: string | null
          email?: string | null
          full_name?: string
          id?: string
          ifsc_code?: string | null
          is_active?: boolean
          notes?: string | null
          phone?: string | null
          primary_crops?: string[] | null
          state?: string | null
          updated_at?: string
          village?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "farmers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farmers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      farms: {
        Row: {
          area_acres: number | null
          certifications: string[] | null
          company_id: string
          created_at: string
          crops: string[] | null
          farmer_id: string
          id: string
          latitude: number | null
          longitude: number | null
          name: string | null
          updated_at: string
        }
        Insert: {
          area_acres?: number | null
          certifications?: string[] | null
          company_id: string
          created_at?: string
          crops?: string[] | null
          farmer_id: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          updated_at?: string
        }
        Update: {
          area_acres?: number | null
          certifications?: string[] | null
          company_id?: string
          created_at?: string
          crops?: string[] | null
          farmer_id?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "farms_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farms_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farms_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmers"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_batches: {
        Row: {
          company_id: string
          cost_per_kg: number | null
          created_at: string
          expiry_date: string | null
          farmer_id: string | null
          grade: string | null
          id: string
          lot_number: string
          moisture_pct: number | null
          po_id: string | null
          product_id: string
          quantity_kg: number
          quantity_remaining_kg: number
          received_date: string
          status: Database["public"]["Enums"]["batch_status"]
          updated_at: string
          warehouse_id: string | null
        }
        Insert: {
          company_id: string
          cost_per_kg?: number | null
          created_at?: string
          expiry_date?: string | null
          farmer_id?: string | null
          grade?: string | null
          id?: string
          lot_number: string
          moisture_pct?: number | null
          po_id?: string | null
          product_id: string
          quantity_kg: number
          quantity_remaining_kg: number
          received_date?: string
          status?: Database["public"]["Enums"]["batch_status"]
          updated_at?: string
          warehouse_id?: string | null
        }
        Update: {
          company_id?: string
          cost_per_kg?: number | null
          created_at?: string
          expiry_date?: string | null
          farmer_id?: string | null
          grade?: string | null
          id?: string
          lot_number?: string
          moisture_pct?: number | null
          po_id?: string | null
          product_id?: string
          quantity_kg?: number
          quantity_remaining_kg?: number
          received_date?: string
          status?: Database["public"]["Enums"]["batch_status"]
          updated_at?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_batches_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_batches_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_batches_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_batches_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_batches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_batches_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          action: string
          code: string
          created_at: string
          description: string | null
          id: string
          module: string
        }
        Insert: {
          action: string
          code: string
          created_at?: string
          description?: string | null
          id?: string
          module: string
        }
        Update: {
          action?: string
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          module?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          company_id: string
          created_at: string
          default_grade: string | null
          description: string | null
          hs_code: string | null
          id: string
          is_active: boolean
          name: string
          sku: string
          unit: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          company_id: string
          created_at?: string
          default_grade?: string | null
          description?: string | null
          hs_code?: string | null
          id?: string
          is_active?: boolean
          name: string
          sku: string
          unit?: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          company_id?: string
          created_at?: string
          default_grade?: string | null
          description?: string | null
          hs_code?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sku?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          avatar_url: string | null
          company_id: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean
          phone: string | null
          rejection_reason: string | null
          requested_role: string | null
          status: Database["public"]["Enums"]["user_approval_status"]
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean
          phone?: string | null
          rejection_reason?: string | null
          requested_role?: string | null
          status?: Database["public"]["Enums"]["user_approval_status"]
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          rejection_reason?: string | null
          requested_role?: string | null
          status?: Database["public"]["Enums"]["user_approval_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          created_at: string
          expected_grade: string | null
          id: string
          line_total: number | null
          po_id: string
          product_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          expected_grade?: string | null
          id?: string
          line_total?: number | null
          po_id: string
          product_id: string
          quantity: number
          unit_price: number
        }
        Update: {
          created_at?: string
          expected_grade?: string | null
          id?: string
          line_total?: number | null
          po_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          currency: string
          expected_delivery: string | null
          farmer_id: string
          id: string
          notes: string | null
          order_date: string
          po_number: string
          status: Database["public"]["Enums"]["po_status"]
          subtotal: number
          tax: number
          total: number
          updated_at: string
          warehouse_id: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          currency?: string
          expected_delivery?: string | null
          farmer_id: string
          id?: string
          notes?: string | null
          order_date?: string
          po_number: string
          status?: Database["public"]["Enums"]["po_status"]
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
          warehouse_id?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          expected_delivery?: string | null
          farmer_id?: string
          id?: string
          notes?: string | null
          order_date?: string
          po_number?: string
          status?: Database["public"]["Enums"]["po_status"]
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      qc_inspections: {
        Row: {
          attachments: string[] | null
          batch_id: string
          broken_pct: number | null
          company_id: string
          created_at: string
          foreign_matter_pct: number | null
          grade: string | null
          id: string
          inspected_at: string
          inspector_id: string | null
          lab_notes: string | null
          moisture_pct: number | null
          result: Database["public"]["Enums"]["qc_result"]
          updated_at: string
        }
        Insert: {
          attachments?: string[] | null
          batch_id: string
          broken_pct?: number | null
          company_id: string
          created_at?: string
          foreign_matter_pct?: number | null
          grade?: string | null
          id?: string
          inspected_at?: string
          inspector_id?: string | null
          lab_notes?: string | null
          moisture_pct?: number | null
          result?: Database["public"]["Enums"]["qc_result"]
          updated_at?: string
        }
        Update: {
          attachments?: string[] | null
          batch_id?: string
          broken_pct?: number | null
          company_id?: string
          created_at?: string
          foreign_matter_pct?: number | null
          grade?: string | null
          id?: string
          inspected_at?: string
          inspector_id?: string | null
          lab_notes?: string | null
          moisture_pct?: number | null
          result?: Database["public"]["Enums"]["qc_result"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "qc_inspections_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "inventory_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qc_inspections_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qc_inspections_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          permission_id: string
          role_id: string
        }
        Insert: {
          permission_id: string
          role_id: string
        }
        Update: {
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string
          role_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          role_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouses: {
        Row: {
          address: string | null
          capacity_kg: number | null
          city: string | null
          code: string | null
          company_id: string
          country: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          capacity_kg?: number | null
          city?: string | null
          code?: string | null
          company_id: string
          country?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          capacity_kg?: number | null
          city?: string | null
          code?: string | null
          company_id?: string
          country?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          id: string
          company_id: string
          customer_id: string | null
          quotation_number: string
          amount: number
          subtotal: number
          tax_rate: number
          tax_amount: number
          currency: string
          status: string
          valid_until: string | null
          incoterm: string | null
          container_type: string | null
          packaging_type: string | null
          packaging_cost: number
          shipment_type: string | null
          shipping_cost: number
          payment_terms: string | null
          items_count: number
          lead_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          customer_id?: string | null
          quotation_number: string
          amount: number
          subtotal?: number
          tax_rate?: number
          tax_amount?: number
          currency?: string
          status?: string
          valid_until?: string | null
          incoterm?: string | null
          container_type?: string | null
          packaging_type?: string | null
          packaging_cost?: number
          shipment_type?: string | null
          shipping_cost?: number
          payment_terms?: string | null
          items_count?: number
          lead_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          customer_id?: string | null
          quotation_number?: string
          amount?: number
          subtotal?: number
          tax_rate?: number
          tax_amount?: number
          currency?: string
          status?: string
          valid_until?: string | null
          incoterm?: string | null
          container_type?: string | null
          packaging_type?: string | null
          packaging_cost?: number
          shipment_type?: string | null
          shipping_cost?: number
          payment_terms?: string | null
          items_count?: number
          lead_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      quotation_items: {
        Row: {
          id: string
          quotation_id: string
          product_id: string | null
          description: string | null
          hsn_code: string | null
          quantity: number
          unit_price: number
          total_price: number
          unit: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          quotation_id: string
          product_id?: string | null
          description?: string | null
          hsn_code?: string | null
          quantity: number
          unit_price: number
          total_price?: number
          unit?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          quotation_id?: string
          product_id?: string | null
          description?: string | null
          hsn_code?: string | null
          quantity?: number
          unit_price?: number
          total_price?: number
          unit?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          id: string
          company_id: string
          name: string
          email: string | null
          phone: string | null
          address: string | null
          country: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          email?: string | null
          phone?: string | null
          address?: string | null
          country?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          country?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          id: string
          company_id: string
          company_name: string | null
          contact_name: string | null
          email: string | null
          phone: string | null
          interested_product: string | null
          product_type: string | null
          business_category: string | null
          mobile: string | null
          website: string | null
          country: string | null
          date: string | null
          assigned_to: string | null
          remark: string | null
          status: string | null
          stage: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          company_name?: string | null
          contact_name?: string | null
          email?: string | null
          phone?: string | null
          interested_product?: string | null
          product_type?: string | null
          business_category?: string | null
          mobile?: string | null
          website?: string | null
          country?: string | null
          date?: string | null
          assigned_to?: string | null
          remark?: string | null
          status?: string | null
          stage?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          company_name?: string | null
          contact_name?: string | null
          email?: string | null
          phone?: string | null
          interested_product?: string | null
          product_type?: string | null
          business_category?: string | null
          mobile?: string | null
          website?: string | null
          country?: string | null
          date?: string | null
          assigned_to?: string | null
          remark?: string | null
          status?: string | null
          stage?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      export_orders: {
        Row: {
          id: string
          company_id: string
          customer_id: string | null
          order_number: string
          total_amount: number
          currency: string
          status: string
          payment_terms: string | null
          payment_status: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          customer_id?: string | null
          order_number: string
          total_amount: number
          currency?: string
          status?: string
          payment_terms?: string | null
          payment_status?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          customer_id?: string | null
          order_number?: string
          total_amount?: number
          currency?: string
          status?: string
          payment_terms?: string | null
          payment_status?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      tenants: {
        Row: {
          base_currency: string | null
          country: string | null
          created_at: string | null
          id: string | null
          name: string | null
          plan: string | null
          slug: string | null
          updated_at: string | null
        }
        Insert: {
          base_currency?: string | null
          country?: string | null
          created_at?: string | null
          id?: string | null
          name?: string | null
          plan?: string | null
          slug?: string | null
          updated_at?: string | null
        }
        Update: {
          base_currency?: string | null
          country?: string | null
          created_at?: string | null
          id?: string | null
          name?: string | null
          plan?: string | null
          slug?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string | null
          is_active: boolean | null
          phone: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          is_active?: boolean | null
          phone?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          is_active?: boolean | null
          phone?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      approve_user: {
        Args: { _role_slug: string; _target: string }
        Returns: undefined
      }
      current_company_id: { Args: never; Returns: string }
      has_permission: {
        Args: { _code: string; _user_id: string }
        Returns: boolean
      }
      is_admin_or_manager: { Args: { _user_id: string }; Returns: boolean }
      is_company_admin: { Args: { _user_id: string }; Returns: boolean }
      is_user_approved: { Args: { _user_id: string }; Returns: boolean }
      reject_user: {
        Args: { _reason: string; _target: string }
        Returns: undefined
      }
      scan_barcode: {
        Args: {
          _code: string
          _new_location?: Database["public"]["Enums"]["barcode_location"]
        }
        Returns: {
          barcode_id: string
          batch_id: string
          box_number: number
          code: string
          current_location: Database["public"]["Enums"]["barcode_location"]
          farmer_name: string
          grade: string
          level: string
          lot_number: string
          product_name: string
          received_date: string
          scan_count: number
          status: string
          warehouse_name: string
        }[]
      }
    }
    Enums: {
      barcode_location:
        | "storage"
        | "picking"
        | "packing"
        | "dispatch"
        | "in_transit"
        | "delivered"
      batch_status:
        | "pending_qc"
        | "approved"
        | "rejected"
        | "reserved"
        | "shipped"
        | "consumed"
      po_status: "draft" | "approved" | "received" | "partial" | "cancelled"
      qc_result: "pending" | "approved" | "rejected" | "rework"
      user_approval_status: "pending" | "approved" | "rejected"
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
      barcode_location: [
        "storage",
        "picking",
        "packing",
        "dispatch",
        "in_transit",
        "delivered",
      ],
      batch_status: [
        "pending_qc",
        "approved",
        "rejected",
        "reserved",
        "shipped",
        "consumed",
      ],
      po_status: ["draft", "approved", "received", "partial", "cancelled"],
      qc_result: ["pending", "approved", "rejected", "rework"],
      user_approval_status: ["pending", "approved", "rejected"],
    },
  },
} as const
