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
      cau_hinh_may_tinh: {
        Row: {
          cpu: string | null
          ghi_chu: string | null
          he_dieu_hanh_id: number | null
          id: number
          mainboard: string | null
          man_hinh: string | null
          o_cung: string | null
          phan_mem_diet_virus_id: number | null
          ram: string | null
          thiet_bi_id: number
        }
        Insert: {
          cpu?: string | null
          ghi_chu?: string | null
          he_dieu_hanh_id?: number | null
          id?: number
          mainboard?: string | null
          man_hinh?: string | null
          o_cung?: string | null
          phan_mem_diet_virus_id?: number | null
          ram?: string | null
          thiet_bi_id: number
        }
        Update: {
          cpu?: string | null
          ghi_chu?: string | null
          he_dieu_hanh_id?: number | null
          id?: number
          mainboard?: string | null
          man_hinh?: string | null
          o_cung?: string | null
          phan_mem_diet_virus_id?: number | null
          ram?: string | null
          thiet_bi_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "cau_hinh_may_tinh_he_dieu_hanh_id_fkey"
            columns: ["he_dieu_hanh_id"]
            isOneToOne: false
            referencedRelation: "he_dieu_hanh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cau_hinh_may_tinh_phan_mem_diet_virus_id_fkey"
            columns: ["phan_mem_diet_virus_id"]
            isOneToOne: false
            referencedRelation: "phan_mem_diet_virus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cau_hinh_may_tinh_thiet_bi_id_fkey"
            columns: ["thiet_bi_id"]
            isOneToOne: true
            referencedRelation: "thiet_bi"
            referencedColumns: ["id"]
          },
        ]
      }
      hang_model: {
        Row: {
          ghi_chu: string | null
          id: number
          ten_hang: string
          ten_model: string | null
        }
        Insert: {
          ghi_chu?: string | null
          id?: number
          ten_hang: string
          ten_model?: string | null
        }
        Update: {
          ghi_chu?: string | null
          id?: number
          ten_hang?: string
          ten_model?: string | null
        }
        Relationships: []
      }
      he_dieu_hanh: {
        Row: {
          id: number
          phien_ban: string | null
          ten_he_dieu_hanh: string
        }
        Insert: {
          id?: number
          phien_ban?: string | null
          ten_he_dieu_hanh: string
        }
        Update: {
          id?: number
          phien_ban?: string | null
          ten_he_dieu_hanh?: string
        }
        Relationships: []
      }
      lich_su_ban_giao: {
        Row: {
          ghi_chu: string | null
          hinh_thuc: string | null
          id: number
          ngay_ban_giao: string
          ngay_thu_hoi: string | null
          nguoi_nhan_id: number | null
          noi_dung: string | null
          phong_ban_nhan_id: number | null
          thiet_bi_id: number
        }
        Insert: {
          ghi_chu?: string | null
          hinh_thuc?: string | null
          id?: number
          ngay_ban_giao: string
          ngay_thu_hoi?: string | null
          nguoi_nhan_id?: number | null
          noi_dung?: string | null
          phong_ban_nhan_id?: number | null
          thiet_bi_id: number
        }
        Update: {
          ghi_chu?: string | null
          hinh_thuc?: string | null
          id?: number
          ngay_ban_giao?: string
          ngay_thu_hoi?: string | null
          nguoi_nhan_id?: number | null
          noi_dung?: string | null
          phong_ban_nhan_id?: number | null
          thiet_bi_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "lich_su_ban_giao_nguoi_nhan_id_fkey"
            columns: ["nguoi_nhan_id"]
            isOneToOne: false
            referencedRelation: "nguoi_dung"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lich_su_ban_giao_phong_ban_nhan_id_fkey"
            columns: ["phong_ban_nhan_id"]
            isOneToOne: false
            referencedRelation: "phong_ban"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lich_su_ban_giao_thiet_bi_id_fkey"
            columns: ["thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "thiet_bi"
            referencedColumns: ["id"]
          },
        ]
      }
      loai_thiet_bi: {
        Row: {
          ghi_chu: string | null
          id: number
          ma_loai: string | null
          ten_loai: string
        }
        Insert: {
          ghi_chu?: string | null
          id?: number
          ma_loai?: string | null
          ten_loai: string
        }
        Update: {
          ghi_chu?: string | null
          id?: number
          ma_loai?: string | null
          ten_loai?: string
        }
        Relationships: []
      }
      nguoi_dung: {
        Row: {
          email: string | null
          ho_ten: string
          id: number
          mat_khau: string
          phong_ban_id: number | null
          so_dien_thoai: string | null
          ten_dang_nhap: string
          trang_thai: boolean | null
          vai_tro: string | null
        }
        Insert: {
          email?: string | null
          ho_ten: string
          id?: number
          mat_khau: string
          phong_ban_id?: number | null
          so_dien_thoai?: string | null
          ten_dang_nhap: string
          trang_thai?: boolean | null
          vai_tro?: string | null
        }
        Update: {
          email?: string | null
          ho_ten?: string
          id?: number
          mat_khau?: string
          phong_ban_id?: number | null
          so_dien_thoai?: string | null
          ten_dang_nhap?: string
          trang_thai?: boolean | null
          vai_tro?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nguoi_dung_phong_ban_id_fkey"
            columns: ["phong_ban_id"]
            isOneToOne: false
            referencedRelation: "phong_ban"
            referencedColumns: ["id"]
          },
        ]
      }
      nguon_goc_tai_san: {
        Row: {
          ghi_chu: string | null
          id: number
          ma_nguon_goc: string | null
          ten_nguon_goc: string
        }
        Insert: {
          ghi_chu?: string | null
          id?: number
          ma_nguon_goc?: string | null
          ten_nguon_goc: string
        }
        Update: {
          ghi_chu?: string | null
          id?: number
          ma_nguon_goc?: string | null
          ten_nguon_goc?: string
        }
        Relationships: []
      }
      phan_mem_diet_virus: {
        Row: {
          id: number
          phien_ban: string | null
          ten_phan_mem: string
        }
        Insert: {
          id?: number
          phien_ban?: string | null
          ten_phan_mem: string
        }
        Update: {
          id?: number
          phien_ban?: string | null
          ten_phan_mem?: string
        }
        Relationships: []
      }
      phong_ban: {
        Row: {
          ghi_chu: string | null
          id: number
          ma_phong_ban: string | null
          ten_phong_ban: string
        }
        Insert: {
          ghi_chu?: string | null
          id?: number
          ma_phong_ban?: string | null
          ten_phong_ban: string
        }
        Update: {
          ghi_chu?: string | null
          id?: number
          ma_phong_ban?: string | null
          ten_phong_ban?: string
        }
        Relationships: []
      }
      sua_chua_bao_tri: {
        Row: {
          chi_phi: number | null
          don_vi_sua_chua: string | null
          ghi_chu: string | null
          id: number
          ket_qua_xu_ly: string | null
          loai_xu_ly: string | null
          mo_ta_loi: string | null
          ngay_ghi_nhan: string
          ngay_sua_chua: string | null
          thiet_bi_id: number
        }
        Insert: {
          chi_phi?: number | null
          don_vi_sua_chua?: string | null
          ghi_chu?: string | null
          id?: number
          ket_qua_xu_ly?: string | null
          loai_xu_ly?: string | null
          mo_ta_loi?: string | null
          ngay_ghi_nhan: string
          ngay_sua_chua?: string | null
          thiet_bi_id: number
        }
        Update: {
          chi_phi?: number | null
          don_vi_sua_chua?: string | null
          ghi_chu?: string | null
          id?: number
          ket_qua_xu_ly?: string | null
          loai_xu_ly?: string | null
          mo_ta_loi?: string | null
          ngay_ghi_nhan?: string
          ngay_sua_chua?: string | null
          thiet_bi_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "sua_chua_bao_tri_thiet_bi_id_fkey"
            columns: ["thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "thiet_bi"
            referencedColumns: ["id"]
          },
        ]
      }
      thiet_bi: {
        Row: {
          ghi_chu: string | null
          hang_model_id: number | null
          id: number
          la_thiet_bi_dung_chung: boolean | null
          loai_thiet_bi_id: number
          ma_thiet_bi: string
          nam_trang_bi: number | null
          ngay_tiep_nhan: string | null
          nguoi_su_dung_id: number | null
          nguon_goc_id: number | null
          phong_ban_id: number | null
          serial: string | null
          ten_thiet_bi: string
          thiet_bi_mat: boolean | null
          tinh_trang_id: number | null
        }
        Insert: {
          ghi_chu?: string | null
          hang_model_id?: number | null
          id?: number
          la_thiet_bi_dung_chung?: boolean | null
          loai_thiet_bi_id: number
          ma_thiet_bi: string
          nam_trang_bi?: number | null
          ngay_tiep_nhan?: string | null
          nguoi_su_dung_id?: number | null
          nguon_goc_id?: number | null
          phong_ban_id?: number | null
          serial?: string | null
          ten_thiet_bi: string
          thiet_bi_mat?: boolean | null
          tinh_trang_id?: number | null
        }
        Update: {
          ghi_chu?: string | null
          hang_model_id?: number | null
          id?: number
          la_thiet_bi_dung_chung?: boolean | null
          loai_thiet_bi_id?: number
          ma_thiet_bi?: string
          nam_trang_bi?: number | null
          ngay_tiep_nhan?: string | null
          nguoi_su_dung_id?: number | null
          nguon_goc_id?: number | null
          phong_ban_id?: number | null
          serial?: string | null
          ten_thiet_bi?: string
          thiet_bi_mat?: boolean | null
          tinh_trang_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "thiet_bi_hang_model_id_fkey"
            columns: ["hang_model_id"]
            isOneToOne: false
            referencedRelation: "hang_model"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thiet_bi_loai_thiet_bi_id_fkey"
            columns: ["loai_thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "loai_thiet_bi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thiet_bi_nguoi_su_dung_id_fkey"
            columns: ["nguoi_su_dung_id"]
            isOneToOne: false
            referencedRelation: "nguoi_dung"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thiet_bi_nguon_goc_id_fkey"
            columns: ["nguon_goc_id"]
            isOneToOne: false
            referencedRelation: "nguon_goc_tai_san"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thiet_bi_phong_ban_id_fkey"
            columns: ["phong_ban_id"]
            isOneToOne: false
            referencedRelation: "phong_ban"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thiet_bi_tinh_trang_id_fkey"
            columns: ["tinh_trang_id"]
            isOneToOne: false
            referencedRelation: "tinh_trang_thiet_bi"
            referencedColumns: ["id"]
          },
        ]
      }
      tinh_trang_thiet_bi: {
        Row: {
          ghi_chu: string | null
          id: number
          ma_tinh_trang: string | null
          ten_tinh_trang: string
        }
        Insert: {
          ghi_chu?: string | null
          id?: number
          ma_tinh_trang?: string | null
          ten_tinh_trang: string
        }
        Update: {
          ghi_chu?: string | null
          id?: number
          ma_tinh_trang?: string | null
          ten_tinh_trang?: string
        }
        Relationships: []
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
    Enums: {},
  },
} as const
