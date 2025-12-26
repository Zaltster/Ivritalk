export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          created_at: string
        }
        Insert: {
          id: string
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
        }
      }
      worlds: {
        Row: {
          id: string
          creator_id: string
          name: string
          code: string
          storyline: string
          created_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          name: string
          code: string
          storyline: string
          created_at?: string
        }
        Update: {
          id?: string
          creator_id?: string
          name?: string
          code?: string
          storyline?: string
          created_at?: string
        }
      }
      characters: {
        Row: {
          id: string
          world_id: string
          creator_id: string
          name: string
          what_did_i_do: string
          external_qualities: string
          internal_qualities: string
          instructions: string
          image_url: string | null
          published: boolean
          created_at: string
        }
        Insert: {
          id?: string
          world_id: string
          creator_id: string
          name: string
          what_did_i_do: string
          external_qualities: string
          internal_qualities: string
          instructions: string
          image_url?: string | null
          published?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          world_id?: string
          creator_id?: string
          name?: string
          what_did_i_do?: string
          external_qualities?: string
          internal_qualities?: string
          instructions?: string
          image_url?: string | null
          published?: boolean
          created_at?: string
        }
      }
      world_members: {
        Row: {
          id: string
          world_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          id?: string
          world_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          id?: string
          world_id?: string
          user_id?: string
          joined_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          world_id: string
          character_id: string | null
          user_id: string | null
          content: string
          is_system: boolean
          created_at: string
        }
        Insert: {
          id?: string
          world_id: string
          character_id?: string | null
          user_id?: string | null
          content: string
          is_system?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          world_id?: string
          character_id?: string | null
          user_id?: string | null
          content?: string
          is_system?: boolean
          created_at?: string
        }
      }
    }
  }
}
