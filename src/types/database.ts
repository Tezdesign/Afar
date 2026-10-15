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
