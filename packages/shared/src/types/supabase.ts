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
            users: {
                Row: {
                    id: string
                    created_at: string
                    name: string
                    username: string
                    password_hash: string
                }
                Insert: {
                    id?: string
                    created_at?: string
                    name: string
                    username: string
                    password_hash: string
                }
                Update: {
                    id?: string
                    created_at?: string
                    name?: string
                    username?: string
                    password_hash?: string
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
