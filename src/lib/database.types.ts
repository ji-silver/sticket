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
      bucket_items: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_completed: boolean
          ticket_book_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order: number
          id?: string
          is_completed?: boolean
          ticket_book_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_completed?: boolean
          ticket_book_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bucket_items_ticket_book_id_fkey"
            columns: ["ticket_book_id"]
            isOneToOne: false
            referencedRelation: "ticket_books"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          away_score: number | null
          away_team_id: string
          cancellation_reason: string | null
          created_at: string
          game_date: string
          game_key: string
          home_score: number | null
          home_team_id: string
          last_collected_at: string
          season: number
          series_type: string
          source_game_id: string | null
          sport: string
          stadium_name: string | null
          start_time: string | null
          status: string
          updated_at: string
        }
        Insert: {
          away_score?: number | null
          away_team_id: string
          cancellation_reason?: string | null
          created_at?: string
          game_date: string
          game_key: string
          home_score?: number | null
          home_team_id: string
          last_collected_at?: string
          season: number
          series_type: string
          source_game_id?: string | null
          sport?: string
          stadium_name?: string | null
          start_time?: string | null
          status: string
          updated_at?: string
        }
        Update: {
          away_score?: number | null
          away_team_id?: string
          cancellation_reason?: string | null
          created_at?: string
          game_date?: string
          game_key?: string
          home_score?: number | null
          home_team_id?: string
          last_collected_at?: string
          season?: number
          series_type?: string
          source_game_id?: string | null
          sport?: string
          stadium_name?: string | null
          start_time?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "games_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          favorite_team_id: string | null
          id: string
          nickname: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          favorite_team_id?: string | null
          id: string
          nickname: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          favorite_team_id?: string | null
          id?: string
          nickname?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_favorite_team_id_fkey"
            columns: ["favorite_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          name: string
          short_name: string
          sport: string
        }
        Insert: {
          created_at?: string
          display_order: number
          id: string
          is_active?: boolean
          name: string
          short_name: string
          sport: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          short_name?: string
          sport?: string
        }
        Relationships: []
      }
      ticket_books: {
        Row: {
          cover_color: string
          cover_pattern: string
          cover_photo_path: string | null
          created_at: string
          id: string
          sport: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cover_color: string
          cover_pattern?: string
          cover_photo_path?: string | null
          created_at?: string
          id?: string
          sport?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cover_color?: string
          cover_pattern?: string
          cover_photo_path?: string | null
          created_at?: string
          id?: string
          sport?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tickets: {
        Row: {
          created_at: string
          foods: string[]
          game_key: string
          id: string
          memo: string | null
          original_photo_path: string | null
          rating: number | null
          seat_name: string | null
          ticket_book_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          foods?: string[]
          game_key: string
          id?: string
          memo?: string | null
          original_photo_path?: string | null
          rating?: number | null
          seat_name?: string | null
          ticket_book_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          foods?: string[]
          game_key?: string
          id?: string
          memo?: string | null
          original_photo_path?: string | null
          rating?: number | null
          seat_name?: string | null
          ticket_book_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_game_key_fkey"
            columns: ["game_key"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["game_key"]
          },
          {
            foreignKeyName: "tickets_ticket_book_id_fkey"
            columns: ["ticket_book_id"]
            isOneToOne: false
            referencedRelation: "ticket_books"
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
