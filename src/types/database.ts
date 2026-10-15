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
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          actor: string
          created_at: string
          id: string
          payload: Json
          summary: string
          undone_at: string | null
          user_id: string
        }
        Insert: {
          action: string
          actor: string
          created_at?: string
          id?: string
          payload?: Json
          summary: string
          undone_at?: string | null
          user_id?: string
        }
        Update: {
          action?: string
          actor?: string
          created_at?: string
          id?: string
          payload?: Json
          summary?: string
          undone_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      airports: {
        Row: {
          city: string
          code: string
          country_code: string
        }
        Insert: {
          city: string
          code: string
          country_code: string
        }
        Update: {
          city?: string
          code?: string
          country_code?: string
        }
        Relationships: []
      }
      alerts: {
        Row: {
          anywhere: boolean
          created_at: string
          destination: string | null
          direct_only: boolean
          id: string
          is_demo: boolean
          last_checked_at: string | null
          max_price: number | null
          month: string | null
          nights: number | null
          origin: string | null
          status: string
          user_id: string
        }
        Insert: {
          anywhere?: boolean
          created_at?: string
          destination?: string | null
          direct_only?: boolean
          id?: string
          is_demo?: boolean
          last_checked_at?: string | null
          max_price?: number | null
          month?: string | null
          nights?: number | null
          origin?: string | null
          status?: string
          user_id?: string
        }
        Update: {
          anywhere?: boolean
          created_at?: string
          destination?: string | null
          direct_only?: boolean
          id?: string
          is_demo?: boolean
          last_checked_at?: string | null
          max_price?: number | null
          month?: string | null
          nights?: number | null
          origin?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_destination_fkey"
            columns: ["destination"]
            isOneToOne: false
            referencedRelation: "airports"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "alerts_origin_fkey"
            columns: ["origin"]
            isOneToOne: false
            referencedRelation: "airports"
            referencedColumns: ["code"]
          },
        ]
      }
      car_rentals: {
        Row: {
          car_type: string
          company: string
          currency: string
          external_id: string | null
          id: string
          pickup_city: string
          price_per_day: number
          source: string
        }
        Insert: {
          car_type: string
          company: string
          currency?: string
          external_id?: string | null
          id: string
          pickup_city: string
          price_per_day: number
          source?: string
        }
        Update: {
          car_type?: string
          company?: string
          currency?: string
          external_id?: string | null
          id?: string
          pickup_city?: string
          price_per_day?: number
          source?: string
        }
        Relationships: []
      }
      deals: {
        Row: {
          car_id: string | null
          featured: boolean
          flight_id: string | null
          hotel_id: string | null
          id: string
          image_url: string
          subtitle: string
          title: string
          type: string
        }
        Insert: {
          car_id?: string | null
          featured?: boolean
          flight_id?: string | null
          hotel_id?: string | null
          id: string
          image_url: string
          subtitle: string
          title: string
          type: string
        }
        Update: {
          car_id?: string | null
          featured?: boolean
          flight_id?: string | null
          hotel_id?: string | null
          id?: string
          image_url?: string
          subtitle?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "car_rentals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_flight_id_fkey"
            columns: ["flight_id"]
            isOneToOne: false
            referencedRelation: "flights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      destinations: {
        Row: {
          airport_code: string | null
          blurb: string
          city: string
          country: string
          id: string
          image_url: string
          rating: number
        }
        Insert: {
          airport_code?: string | null
          blurb: string
          city: string
          country: string
          id: string
          image_url: string
          rating: number
        }
        Update: {
          airport_code?: string | null
          blurb?: string
          city?: string
          country?: string
          id?: string
          image_url?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "destinations_airport_code_fkey"
            columns: ["airport_code"]
            isOneToOne: false
            referencedRelation: "airports"
            referencedColumns: ["code"]
          },
        ]
      }
      flights: {
        Row: {
          airline: string
          currency: string
          depart_date: string
          destination_code: string
          duration_minutes: number
          external_id: string | null
          id: string
          nights: number | null
          origin_code: string
          price: number
          return_date: string | null
          sample_depart_offset: number | null
          sample_return_offset: number | null
          source: string
          stops: number
        }
        Insert: {
          airline: string
          currency?: string
          depart_date: string
          destination_code: string
          duration_minutes: number
          external_id?: string | null
          id: string
          nights?: number | null
          origin_code: string
          price: number
          return_date?: string | null
          sample_depart_offset?: number | null
          sample_return_offset?: number | null
          source?: string
          stops: number
        }
        Update: {
          airline?: string
          currency?: string
          depart_date?: string
          destination_code?: string
          duration_minutes?: number
          external_id?: string | null
          id?: string
          nights?: number | null
          origin_code?: string
          price?: number
          return_date?: string | null
          sample_depart_offset?: number | null
          sample_return_offset?: number | null
          source?: string
          stops?: number
        }
        Relationships: [
          {
            foreignKeyName: "flights_destination_code_fkey"
            columns: ["destination_code"]
            isOneToOne: false
            referencedRelation: "airports"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "flights_origin_code_fkey"
            columns: ["origin_code"]
            isOneToOne: false
            referencedRelation: "airports"
            referencedColumns: ["code"]
          },
        ]
      }
      hotels: {
        Row: {
          city: string
          country: string
          currency: string
          external_id: string | null
          id: string
          name: string
          neighborhood: string
          price_per_night: number
          review_count: number
          review_score: number
          source: string
          star_rating: number
        }
        Insert: {
          city: string
          country: string
          currency?: string
          external_id?: string | null
          id: string
          name: string
          neighborhood: string
          price_per_night: number
          review_count: number
          review_score: number
          source?: string
          star_rating: number
        }
        Update: {
          city?: string
          country?: string
          currency?: string
          external_id?: string | null
          id?: string
          name?: string
          neighborhood?: string
          price_per_night?: number
          review_count?: number
          review_score?: number
          source?: string
          star_rating?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          currency: string
          language: string
          passport_country: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          currency?: string
          language?: string
          passport_country?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          currency?: string
          language?: string
          passport_country?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          id: string
          last_seen_at: string
          platform: string
          token: string
          user_id: string
        }
        Insert: {
          id?: string
          last_seen_at?: string
          platform: string
          token: string
          user_id?: string
        }
        Update: {
          id?: string
          last_seen_at?: string
          platform?: string
          token?: string
          user_id?: string
        }
        Relationships: []
      }
      recent_searches: {
        Row: {
          anywhere: boolean
          created_at: string
          depart_date: string | null
          destination: string | null
          direct_only: boolean
          id: string
          max_price: number | null
          month: string | null
          nights: number | null
          origin: string | null
          return_date: string | null
          user_id: string
        }
        Insert: {
          anywhere?: boolean
          created_at?: string
          depart_date?: string | null
          destination?: string | null
          direct_only?: boolean
          id?: string
          max_price?: number | null
          month?: string | null
          nights?: number | null
          origin?: string | null
          return_date?: string | null
          user_id?: string
        }
        Update: {
          anywhere?: boolean
          created_at?: string
          depart_date?: string | null
          destination?: string | null
          direct_only?: boolean
          id?: string
          max_price?: number | null
          month?: string | null
          nights?: number | null
          origin?: string | null
          return_date?: string | null
          user_id?: string
        }
        Relationships: []
      }
      saved_destinations: {
        Row: {
          created_at: string
          destination_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          destination_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
          destination_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_destinations_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_destinations_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations_with_price"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          booked_at: string
          car_id: string | null
          flight_id: string | null
          hotel_id: string | null
          id: string
          snapshot_currency: string
          snapshot_details: Json
          snapshot_price: number
          snapshot_title: string
          type: string
          user_id: string
        }
        Insert: {
          booked_at?: string
          car_id?: string | null
          flight_id?: string | null
          hotel_id?: string | null
          id?: string
          snapshot_currency: string
          snapshot_details?: Json
          snapshot_price: number
          snapshot_title: string
          type: string
          user_id?: string
        }
        Update: {
          booked_at?: string
          car_id?: string | null
          flight_id?: string | null
          hotel_id?: string | null
          id?: string
          snapshot_currency?: string
          snapshot_details?: Json
          snapshot_price?: number
          snapshot_title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "car_rentals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_flight_id_fkey"
            columns: ["flight_id"]
            isOneToOne: false
            referencedRelation: "flights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      deals_with_price: {
        Row: {
          car_id: string | null
          currency: string | null
          destination_code: string | null
          featured: boolean | null
          flight_id: string | null
          hotel_id: string | null
          id: string | null
          image_url: string | null
          price: number | null
          price_unit: string | null
          subtitle: string | null
          title: string | null
          type: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "car_rentals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_flight_id_fkey"
            columns: ["flight_id"]
            isOneToOne: false
            referencedRelation: "flights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flights_destination_code_fkey"
            columns: ["destination_code"]
            isOneToOne: false
            referencedRelation: "airports"
            referencedColumns: ["code"]
          },
        ]
      }
      destinations_with_price: {
        Row: {
          airport_code: string | null
          blurb: string | null
          city: string | null
          country: string | null
          currency: string | null
          id: string | null
          image_url: string | null
          price_from: number | null
          rating: number | null
        }
        Relationships: [
          {
            foreignKeyName: "destinations_airport_code_fkey"
            columns: ["airport_code"]
            isOneToOne: false
            referencedRelation: "airports"
            referencedColumns: ["code"]
          },
        ]
      }
    }
    Functions: {
      delete_user_data: { Args: { p_user_id: string }; Returns: undefined }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
