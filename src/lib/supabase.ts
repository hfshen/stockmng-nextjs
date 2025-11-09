import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 데이터베이스 타입 정의
export interface OrderRegister {
  id: number
  company: string
  chajong: string
  pumbeon: string
  pm: string
  in_qty: number
  out_qty: number
  stock_qty: number
  order_qty: number
  remark: string
  display_order: number
  created_at: string
  updated_at: string
}

export interface InRegister {
  id: number
  order_id: number
  in_date: string
  in_count: number
  created_at: string
}

export interface MonthlyData {
  id: number
  year_month: string
  order_id: number
  in_qty: number
  out_qty: number
  stock_qty: number
  order_qty: number
  created_at: string
  updated_at: string
}

export interface InventoryItem {
  id: number
  company: string
  chajong: string
  pumbeon: string
  pm: string
  in_qty: number
  stock_qty: number
  in_shortage: string
  order_qty: number
  out_qty: number
  remark: string
}

export interface EditHistory {
  id: number
  order_id: number
  user_name: string
  changed_fields: {
    field: string
    old_value: string | number
    new_value: string | number
  }[]
  created_at: string
}
