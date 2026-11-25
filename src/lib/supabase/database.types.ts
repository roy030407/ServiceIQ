// Generated from supabase/migrations/0001_init.sql. Regenerate after schema changes with Supabase CLI.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      person: {
        Row: {
          person_id: string;
          auth_user_id: string | null;
          full_name: string;
          phone: string | null;
          email: string | null;
          base_city: string | null;
          lang_pref: string | null;
          phone_verified: boolean | null;
          id_verified: boolean | null;
          joined_at: string | null;
        };
        Insert: {
          person_id?: string;
          auth_user_id?: string | null;
          full_name: string;
          phone?: string | null;
          email?: string | null;
          base_city?: string | null;
          lang_pref?: string | null;
          phone_verified?: boolean | null;
          id_verified?: boolean | null;
          joined_at?: string | null;
        };
        Update: {
          person_id?: string;
          auth_user_id?: string | null;
          full_name?: string;
          phone?: string | null;
          email?: string | null;
          base_city?: string | null;
          lang_pref?: string | null;
          phone_verified?: boolean | null;
          id_verified?: boolean | null;
          joined_at?: string | null;
        };
        Relationships: [

        ];
      };
      organisation: {
        Row: {
          org_id: string;
          name: string;
          org_type: string;
          day_start: string | null;
          day_end: string | null;
          working_days: string | null;
          plan: string | null;
          created_at: string | null;
        };
        Insert: {
          org_id?: string;
          name: string;
          org_type?: string;
          day_start?: string | null;
          day_end?: string | null;
          working_days?: string | null;
          plan?: string | null;
          created_at?: string | null;
        };
        Update: {
          org_id?: string;
          name?: string;
          org_type?: string;
          day_start?: string | null;
          day_end?: string | null;
          working_days?: string | null;
          plan?: string | null;
          created_at?: string | null;
        };
        Relationships: [

        ];
      };
      org_membership: {
        Row: {
          membership_id: string;
          person_id: string;
          org_id: string;
          role: string;
          engagement_type: string | null;
          emp_code: string | null;
          is_active: boolean | null;
          joined_at: string | null;
        };
        Insert: {
          membership_id?: string;
          person_id: string;
          org_id: string;
          role: string;
          engagement_type?: string | null;
          emp_code?: string | null;
          is_active?: boolean | null;
          joined_at?: string | null;
        };
        Update: {
          membership_id?: string;
          person_id?: string;
          org_id?: string;
          role?: string;
          engagement_type?: string | null;
          emp_code?: string | null;
          is_active?: boolean | null;
          joined_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "org_membership_person_id_fkey"; columns: ["person_id"]; isOneToOne: false; referencedRelation: "person"; referencedColumns: ["person_id"] },
          { foreignKeyName: "org_membership_org_id_fkey"; columns: ["org_id"]; isOneToOne: false; referencedRelation: "organisation"; referencedColumns: ["org_id"] }
        ];
      };
      skill: {
        Row: {
          skill_id: string;
          name: string;
          requires_certification: boolean | null;
        };
        Insert: {
          skill_id?: string;
          name: string;
          requires_certification?: boolean | null;
        };
        Update: {
          skill_id?: string;
          name?: string;
          requires_certification?: boolean | null;
        };
        Relationships: [

        ];
      };
      person_skill: {
        Row: {
          person_skill_id: string;
          person_id: string;
          skill_id: string;
          level: string | null;
          cert_number: string | null;
          certified_from: string | null;
          certified_until: string | null;
          verified_by_org: string | null;
        };
        Insert: {
          person_skill_id?: string;
          person_id: string;
          skill_id: string;
          level?: string | null;
          cert_number?: string | null;
          certified_from?: string | null;
          certified_until?: string | null;
          verified_by_org?: string | null;
        };
        Update: {
          person_skill_id?: string;
          person_id?: string;
          skill_id?: string;
          level?: string | null;
          cert_number?: string | null;
          certified_from?: string | null;
          certified_until?: string | null;
          verified_by_org?: string | null;
        };
        Relationships: [
          { foreignKeyName: "person_skill_person_id_fkey"; columns: ["person_id"]; isOneToOne: false; referencedRelation: "person"; referencedColumns: ["person_id"] },
          { foreignKeyName: "person_skill_skill_id_fkey"; columns: ["skill_id"]; isOneToOne: false; referencedRelation: "skill"; referencedColumns: ["skill_id"] },
          { foreignKeyName: "person_skill_verified_by_org_fkey"; columns: ["verified_by_org"]; isOneToOne: false; referencedRelation: "organisation"; referencedColumns: ["org_id"] }
        ];
      };
      holiday: {
        Row: {
          holiday_id: string;
          org_id: string;
          holiday_date: string;
          name: string | null;
        };
        Insert: {
          holiday_id?: string;
          org_id: string;
          holiday_date: string;
          name?: string | null;
        };
        Update: {
          holiday_id?: string;
          org_id?: string;
          holiday_date?: string;
          name?: string | null;
        };
        Relationships: [
          { foreignKeyName: "holiday_org_id_fkey"; columns: ["org_id"]; isOneToOne: false; referencedRelation: "organisation"; referencedColumns: ["org_id"] }
        ];
      };
      party: {
        Row: {
          party_id: string;
          org_id: string;
          name: string;
          party_type: string;
          gstin: string | null;
          phone: string | null;
          attributes: Json | null;
          created_at: string | null;
        };
        Insert: {
          party_id?: string;
          org_id: string;
          name: string;
          party_type: string;
          gstin?: string | null;
          phone?: string | null;
          attributes?: Json | null;
          created_at?: string | null;
        };
        Update: {
          party_id?: string;
          org_id?: string;
          name?: string;
          party_type?: string;
          gstin?: string | null;
          phone?: string | null;
          attributes?: Json | null;
          created_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "party_org_id_fkey"; columns: ["org_id"]; isOneToOne: false; referencedRelation: "organisation"; referencedColumns: ["org_id"] }
        ];
      };
      site: {
        Row: {
          site_id: string;
          party_id: string;
          name: string;
          address: string | null;
          pincode: string | null;
          contact_name: string | null;
          contact_phone: string | null;
          geo_lat: number | null;
          geo_lng: number | null;
          created_at: string | null;
        };
        Insert: {
          site_id?: string;
          party_id: string;
          name: string;
          address?: string | null;
          pincode?: string | null;
          contact_name?: string | null;
          contact_phone?: string | null;
          geo_lat?: number | null;
          geo_lng?: number | null;
          created_at?: string | null;
        };
        Update: {
          site_id?: string;
          party_id?: string;
          name?: string;
          address?: string | null;
          pincode?: string | null;
          contact_name?: string | null;
          contact_phone?: string | null;
          geo_lat?: number | null;
          geo_lng?: number | null;
          created_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "site_party_id_fkey"; columns: ["party_id"]; isOneToOne: false; referencedRelation: "party"; referencedColumns: ["party_id"] }
        ];
      };
      equipment_category: {
        Row: {
          category_id: string;
          org_id: string | null;
          parent_id: string | null;
          name: string;
          depth: number | null;
          attribute_schema: Json | null;
          created_at: string | null;
        };
        Insert: {
          category_id?: string;
          org_id?: string | null;
          parent_id?: string | null;
          name: string;
          depth?: number | null;
          attribute_schema?: Json | null;
          created_at?: string | null;
        };
        Update: {
          category_id?: string;
          org_id?: string | null;
          parent_id?: string | null;
          name?: string;
          depth?: number | null;
          attribute_schema?: Json | null;
          created_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "equipment_category_org_id_fkey"; columns: ["org_id"]; isOneToOne: false; referencedRelation: "organisation"; referencedColumns: ["org_id"] },
          { foreignKeyName: "equipment_category_parent_id_fkey"; columns: ["parent_id"]; isOneToOne: false; referencedRelation: "equipment_category"; referencedColumns: ["category_id"] }
        ];
      };
      product_model: {
        Row: {
          model_id: string;
          org_id: string;
          category_id: string;
          brand_name: string | null;
          model_code: string | null;
          name: string;
          spec: Json | null;
          default_warranty_months: number | null;
          created_at: string | null;
        };
        Insert: {
          model_id?: string;
          org_id: string;
          category_id: string;
          brand_name?: string | null;
          model_code?: string | null;
          name: string;
          spec?: Json | null;
          default_warranty_months?: number | null;
          created_at?: string | null;
        };
        Update: {
          model_id?: string;
          org_id?: string;
          category_id?: string;
          brand_name?: string | null;
          model_code?: string | null;
          name?: string;
          spec?: Json | null;
          default_warranty_months?: number | null;
          created_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "product_model_org_id_fkey"; columns: ["org_id"]; isOneToOne: false; referencedRelation: "organisation"; referencedColumns: ["org_id"] },
          { foreignKeyName: "product_model_category_id_fkey"; columns: ["category_id"]; isOneToOne: false; referencedRelation: "equipment_category"; referencedColumns: ["category_id"] }
        ];
      };
      equipment_unit: {
        Row: {
          unit_id: string;
          org_id: string;
          model_id: string | null;
          site_id: string | null;
          sold_to_party_id: string | null;
          serial_no: string | null;
          sold_on: string | null;
          installed_on: string | null;
          warranty_end: string | null;
          status: string | null;
          attributes: Json | null;
          created_at: string | null;
        };
        Insert: {
          unit_id?: string;
          org_id: string;
          model_id?: string | null;
          site_id?: string | null;
          sold_to_party_id?: string | null;
          serial_no?: string | null;
          sold_on?: string | null;
          installed_on?: string | null;
          warranty_end?: string | null;
          status?: string | null;
          attributes?: Json | null;
          created_at?: string | null;
        };
        Update: {
          unit_id?: string;
          org_id?: string;
          model_id?: string | null;
          site_id?: string | null;
          sold_to_party_id?: string | null;
          serial_no?: string | null;
          sold_on?: string | null;
          installed_on?: string | null;
          warranty_end?: string | null;
          status?: string | null;
          attributes?: Json | null;
          created_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "equipment_unit_org_id_fkey"; columns: ["org_id"]; isOneToOne: false; referencedRelation: "organisation"; referencedColumns: ["org_id"] },
          { foreignKeyName: "equipment_unit_model_id_fkey"; columns: ["model_id"]; isOneToOne: false; referencedRelation: "product_model"; referencedColumns: ["model_id"] },
          { foreignKeyName: "equipment_unit_site_id_fkey"; columns: ["site_id"]; isOneToOne: false; referencedRelation: "site"; referencedColumns: ["site_id"] },
          { foreignKeyName: "equipment_unit_sold_to_party_id_fkey"; columns: ["sold_to_party_id"]; isOneToOne: false; referencedRelation: "party"; referencedColumns: ["party_id"] }
        ];
      };
      contract: {
        Row: {
          contract_id: string;
          org_id: string;
          party_id: string;
          renewed_from_id: string | null;
          contract_no: string;
          type: string | null;
          valid_from: string;
          valid_to: string;
          annual_value: number | null;
          status: string | null;
          sla_targets: Json | null;
          created_at: string | null;
        };
        Insert: {
          contract_id?: string;
          org_id: string;
          party_id: string;
          renewed_from_id?: string | null;
          contract_no: string;
          type?: string | null;
          valid_from: string;
          valid_to: string;
          annual_value?: number | null;
          status?: string | null;
          sla_targets?: Json | null;
          created_at?: string | null;
        };
        Update: {
          contract_id?: string;
          org_id?: string;
          party_id?: string;
          renewed_from_id?: string | null;
          contract_no?: string;
          type?: string | null;
          valid_from?: string;
          valid_to?: string;
          annual_value?: number | null;
          status?: string | null;
          sla_targets?: Json | null;
          created_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "contract_org_id_fkey"; columns: ["org_id"]; isOneToOne: false; referencedRelation: "organisation"; referencedColumns: ["org_id"] },
          { foreignKeyName: "contract_party_id_fkey"; columns: ["party_id"]; isOneToOne: false; referencedRelation: "party"; referencedColumns: ["party_id"] },
          { foreignKeyName: "contract_renewed_from_id_fkey"; columns: ["renewed_from_id"]; isOneToOne: false; referencedRelation: "contract"; referencedColumns: ["contract_id"] }
        ];
      };
      contract_equipment: {
        Row: {
          contract_equipment_id: string;
          contract_id: string;
          unit_id: string;
          pm_visits_per_year: number | null;
          pm_frequency: string | null;
        };
        Insert: {
          contract_equipment_id?: string;
          contract_id: string;
          unit_id: string;
          pm_visits_per_year?: number | null;
          pm_frequency?: string | null;
        };
        Update: {
          contract_equipment_id?: string;
          contract_id?: string;
          unit_id?: string;
          pm_visits_per_year?: number | null;
          pm_frequency?: string | null;
        };
        Relationships: [
          { foreignKeyName: "contract_equipment_contract_id_fkey"; columns: ["contract_id"]; isOneToOne: false; referencedRelation: "contract"; referencedColumns: ["contract_id"] },
          { foreignKeyName: "contract_equipment_unit_id_fkey"; columns: ["unit_id"]; isOneToOne: false; referencedRelation: "equipment_unit"; referencedColumns: ["unit_id"] }
        ];
      };
      coverage_rule: {
        Row: {
          rule_id: string;
          contract_id: string;
          scope: string;
          match_value: string | null;
          is_covered: boolean | null;
          cap_amount: number | null;
          priority: number | null;
        };
        Insert: {
          rule_id?: string;
          contract_id: string;
          scope: string;
          match_value?: string | null;
          is_covered?: boolean | null;
          cap_amount?: number | null;
          priority?: number | null;
        };
        Update: {
          rule_id?: string;
          contract_id?: string;
          scope?: string;
          match_value?: string | null;
          is_covered?: boolean | null;
          cap_amount?: number | null;
          priority?: number | null;
        };
        Relationships: [
          { foreignKeyName: "coverage_rule_contract_id_fkey"; columns: ["contract_id"]; isOneToOne: false; referencedRelation: "contract"; referencedColumns: ["contract_id"] }
        ];
      };
      pm_visit: {
        Row: {
          pm_visit_id: string;
          contract_equipment_id: string;
          due_date: string;
          grace_days: number | null;
          status: string | null;
        };
        Insert: {
          pm_visit_id?: string;
          contract_equipment_id: string;
          due_date: string;
          grace_days?: number | null;
          status?: string | null;
        };
        Update: {
          pm_visit_id?: string;
          contract_equipment_id?: string;
          due_date?: string;
          grace_days?: number | null;
          status?: string | null;
        };
        Relationships: [
          { foreignKeyName: "pm_visit_contract_equipment_id_fkey"; columns: ["contract_equipment_id"]; isOneToOne: false; referencedRelation: "contract_equipment"; referencedColumns: ["contract_equipment_id"] }
        ];
      };
      job_type: {
        Row: {
          job_type_id: string;
          org_id: string;
          code: string;
          name: string;
          checklist_schema: Json | null;
          requires_signature: boolean | null;
          requires_parts: boolean | null;
        };
        Insert: {
          job_type_id?: string;
          org_id: string;
          code: string;
          name: string;
          checklist_schema?: Json | null;
          requires_signature?: boolean | null;
          requires_parts?: boolean | null;
        };
        Update: {
          job_type_id?: string;
          org_id?: string;
          code?: string;
          name?: string;
          checklist_schema?: Json | null;
          requires_signature?: boolean | null;
          requires_parts?: boolean | null;
        };
        Relationships: [
          { foreignKeyName: "job_type_org_id_fkey"; columns: ["org_id"]; isOneToOne: false; referencedRelation: "organisation"; referencedColumns: ["org_id"] }
        ];
      };
      workflow_state: {
        Row: {
          state_id: string;
          job_type_id: string;
          code: string;
          label: string;
          allowed_next: string[] | null;
          is_initial: boolean | null;
          is_terminal: boolean | null;
          stops_sla_clock: boolean | null;
        };
        Insert: {
          state_id?: string;
          job_type_id: string;
          code: string;
          label: string;
          allowed_next?: string[] | null;
          is_initial?: boolean | null;
          is_terminal?: boolean | null;
          stops_sla_clock?: boolean | null;
        };
        Update: {
          state_id?: string;
          job_type_id?: string;
          code?: string;
          label?: string;
          allowed_next?: string[] | null;
          is_initial?: boolean | null;
          is_terminal?: boolean | null;
          stops_sla_clock?: boolean | null;
        };
        Relationships: [
          { foreignKeyName: "workflow_state_job_type_id_fkey"; columns: ["job_type_id"]; isOneToOne: false; referencedRelation: "job_type"; referencedColumns: ["job_type_id"] }
        ];
      };
      ticket: {
        Row: {
          ticket_id: string;
          org_id: string;
          site_id: string | null;
          unit_id: string | null;
          ticket_no: string;
          public_token: string;
          source: string | null;
          fault_description: string | null;
          priority: string | null;
          reported_at: string | null;
          status: string | null;
          created_at: string | null;
        };
        Insert: {
          ticket_id?: string;
          org_id: string;
          site_id?: string | null;
          unit_id?: string | null;
          ticket_no?: string;
          public_token?: string;
          source?: string | null;
          fault_description?: string | null;
          priority?: string | null;
          reported_at?: string | null;
          status?: string | null;
          created_at?: string | null;
        };
        Update: {
          ticket_id?: string;
          org_id?: string;
          site_id?: string | null;
          unit_id?: string | null;
          ticket_no?: string;
          public_token?: string;
          source?: string | null;
          fault_description?: string | null;
          priority?: string | null;
          reported_at?: string | null;
          status?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "ticket_org_id_fkey"; columns: ["org_id"]; isOneToOne: false; referencedRelation: "organisation"; referencedColumns: ["org_id"] },
          { foreignKeyName: "ticket_site_id_fkey"; columns: ["site_id"]; isOneToOne: false; referencedRelation: "site"; referencedColumns: ["site_id"] },
          { foreignKeyName: "ticket_unit_id_fkey"; columns: ["unit_id"]; isOneToOne: false; referencedRelation: "equipment_unit"; referencedColumns: ["unit_id"] }
        ];
      };
      job: {
        Row: {
          job_id: string;
          org_id: string;
          ticket_id: string | null;
          pm_visit_id: string | null;
          unit_id: string | null;
          job_type_id: string | null;
          current_state_id: string | null;
          job_no: string;
          scheduled_start: string | null;
          scheduled_end: string | null;
          actual_start: string | null;
          actual_end: string | null;
          response_due: string | null;
          resolution_due: string | null;
          paused_minutes: number | null;
          breached: boolean | null;
          customer_rating: number | null;
          customer_feedback: string | null;
          checklist_answers: Json | null;
          attachment_urls: string[] | null;
          signature_url: string | null;
          technician_notes: string | null;
          created_at: string | null;
        };
        Insert: {
          job_id?: string;
          org_id: string;
          ticket_id?: string | null;
          pm_visit_id?: string | null;
          unit_id?: string | null;
          job_type_id?: string | null;
          current_state_id?: string | null;
          job_no?: string;
          scheduled_start?: string | null;
          scheduled_end?: string | null;
          actual_start?: string | null;
          actual_end?: string | null;
          response_due?: string | null;
          resolution_due?: string | null;
          paused_minutes?: number | null;
          breached?: boolean | null;
          customer_rating?: number | null;
          customer_feedback?: string | null;
          checklist_answers?: Json | null;
          attachment_urls?: string[] | null;
          signature_url?: string | null;
          technician_notes?: string | null;
          created_at?: string | null;
        };
        Update: {
          job_id?: string;
          org_id?: string;
          ticket_id?: string | null;
          pm_visit_id?: string | null;
          unit_id?: string | null;
          job_type_id?: string | null;
          current_state_id?: string | null;
          job_no?: string;
          scheduled_start?: string | null;
          scheduled_end?: string | null;
          actual_start?: string | null;
          actual_end?: string | null;
          response_due?: string | null;
          resolution_due?: string | null;
          paused_minutes?: number | null;
          breached?: boolean | null;
          customer_rating?: number | null;
          customer_feedback?: string | null;
          checklist_answers?: Json | null;
          attachment_urls?: string[] | null;
          signature_url?: string | null;
          technician_notes?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "job_org_id_fkey"; columns: ["org_id"]; isOneToOne: false; referencedRelation: "organisation"; referencedColumns: ["org_id"] },
          { foreignKeyName: "job_ticket_id_fkey"; columns: ["ticket_id"]; isOneToOne: false; referencedRelation: "ticket"; referencedColumns: ["ticket_id"] },
          { foreignKeyName: "job_pm_visit_id_fkey"; columns: ["pm_visit_id"]; isOneToOne: false; referencedRelation: "pm_visit"; referencedColumns: ["pm_visit_id"] },
          { foreignKeyName: "job_unit_id_fkey"; columns: ["unit_id"]; isOneToOne: false; referencedRelation: "equipment_unit"; referencedColumns: ["unit_id"] },
          { foreignKeyName: "job_job_type_id_fkey"; columns: ["job_type_id"]; isOneToOne: false; referencedRelation: "job_type"; referencedColumns: ["job_type_id"] },
          { foreignKeyName: "job_current_state_id_fkey"; columns: ["current_state_id"]; isOneToOne: false; referencedRelation: "workflow_state"; referencedColumns: ["state_id"] }
        ];
      };
      job_assignment: {
        Row: {
          assignment_id: string;
          job_id: string;
          person_id: string;
          required_skill_id: string | null;
          slot_start: string | null;
          slot_end: string | null;
          status: string | null;
          is_lead: boolean | null;
          payout_amount: number | null;
          offered_at: string | null;
          responded_at: string | null;
        };
        Insert: {
          assignment_id?: string;
          job_id: string;
          person_id: string;
          required_skill_id?: string | null;
          slot_start?: string | null;
          slot_end?: string | null;
          status?: string | null;
          is_lead?: boolean | null;
          payout_amount?: number | null;
          offered_at?: string | null;
          responded_at?: string | null;
        };
        Update: {
          assignment_id?: string;
          job_id?: string;
          person_id?: string;
          required_skill_id?: string | null;
          slot_start?: string | null;
          slot_end?: string | null;
          status?: string | null;
          is_lead?: boolean | null;
          payout_amount?: number | null;
          offered_at?: string | null;
          responded_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "job_assignment_job_id_fkey"; columns: ["job_id"]; isOneToOne: false; referencedRelation: "job"; referencedColumns: ["job_id"] },
          { foreignKeyName: "job_assignment_person_id_fkey"; columns: ["person_id"]; isOneToOne: false; referencedRelation: "person"; referencedColumns: ["person_id"] },
          { foreignKeyName: "job_assignment_required_skill_id_fkey"; columns: ["required_skill_id"]; isOneToOne: false; referencedRelation: "skill"; referencedColumns: ["skill_id"] }
        ];
      };
      job_status_event: {
        Row: {
          event_id: string;
          job_id: string;
          from_state_id: string | null;
          to_state_id: string | null;
          changed_by: string | null;
          changed_at: string | null;
          geo_lat: number | null;
          geo_lng: number | null;
          synced_offline: boolean | null;
        };
        Insert: {
          event_id?: string;
          job_id: string;
          from_state_id?: string | null;
          to_state_id?: string | null;
          changed_by?: string | null;
          changed_at?: string | null;
          geo_lat?: number | null;
          geo_lng?: number | null;
          synced_offline?: boolean | null;
        };
        Update: {
          event_id?: string;
          job_id?: string;
          from_state_id?: string | null;
          to_state_id?: string | null;
          changed_by?: string | null;
          changed_at?: string | null;
          geo_lat?: number | null;
          geo_lng?: number | null;
          synced_offline?: boolean | null;
        };
        Relationships: [
          { foreignKeyName: "job_status_event_job_id_fkey"; columns: ["job_id"]; isOneToOne: false; referencedRelation: "job"; referencedColumns: ["job_id"] },
          { foreignKeyName: "job_status_event_from_state_id_fkey"; columns: ["from_state_id"]; isOneToOne: false; referencedRelation: "workflow_state"; referencedColumns: ["state_id"] },
          { foreignKeyName: "job_status_event_to_state_id_fkey"; columns: ["to_state_id"]; isOneToOne: false; referencedRelation: "workflow_state"; referencedColumns: ["state_id"] },
          { foreignKeyName: "job_status_event_changed_by_fkey"; columns: ["changed_by"]; isOneToOne: false; referencedRelation: "person"; referencedColumns: ["person_id"] }
        ];
      };
      part: {
        Row: {
          part_id: string;
          org_id: string;
          part_no: string | null;
          name: string;
          uom: string | null;
          sell_price: number | null;
          created_at: string | null;
        };
        Insert: {
          part_id?: string;
          org_id: string;
          part_no?: string | null;
          name: string;
          uom?: string | null;
          sell_price?: number | null;
          created_at?: string | null;
        };
        Update: {
          part_id?: string;
          org_id?: string;
          part_no?: string | null;
          name?: string;
          uom?: string | null;
          sell_price?: number | null;
          created_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "part_org_id_fkey"; columns: ["org_id"]; isOneToOne: false; referencedRelation: "organisation"; referencedColumns: ["org_id"] }
        ];
      };
      job_part: {
        Row: {
          job_part_id: string;
          job_id: string;
          part_id: string | null;
          contract_id: string | null;
          rule_id: string | null;
          quantity: number;
          unit_price: number | null;
          is_chargeable: boolean | null;
          coverage_source: string | null;
          coverage_explanation: string | null;
        };
        Insert: {
          job_part_id?: string;
          job_id: string;
          part_id?: string | null;
          contract_id?: string | null;
          rule_id?: string | null;
          quantity?: number;
          unit_price?: number | null;
          is_chargeable?: boolean | null;
          coverage_source?: string | null;
          coverage_explanation?: string | null;
        };
        Update: {
          job_part_id?: string;
          job_id?: string;
          part_id?: string | null;
          contract_id?: string | null;
          rule_id?: string | null;
          quantity?: number;
          unit_price?: number | null;
          is_chargeable?: boolean | null;
          coverage_source?: string | null;
          coverage_explanation?: string | null;
        };
        Relationships: [
          { foreignKeyName: "job_part_job_id_fkey"; columns: ["job_id"]; isOneToOne: false; referencedRelation: "job"; referencedColumns: ["job_id"] },
          { foreignKeyName: "job_part_part_id_fkey"; columns: ["part_id"]; isOneToOne: false; referencedRelation: "part"; referencedColumns: ["part_id"] },
          { foreignKeyName: "job_part_contract_id_fkey"; columns: ["contract_id"]; isOneToOne: false; referencedRelation: "contract"; referencedColumns: ["contract_id"] },
          { foreignKeyName: "job_part_rule_id_fkey"; columns: ["rule_id"]; isOneToOne: false; referencedRelation: "coverage_rule"; referencedColumns: ["rule_id"] }
        ];
      };
      audit_log: {
        Row: {
          audit_id: string;
          org_id: string | null;
          table_name: string;
          row_id: string | null;
          action: string;
          old_row: Json | null;
          new_row: Json | null;
          changed_by: string | null;
          changed_at: string | null;
        };
        Insert: {
          audit_id?: string;
          org_id?: string | null;
          table_name: string;
          row_id?: string | null;
          action: string;
          old_row?: Json | null;
          new_row?: Json | null;
          changed_by?: string | null;
          changed_at?: string | null;
        };
        Update: {
          audit_id?: string;
          org_id?: string | null;
          table_name?: string;
          row_id?: string | null;
          action?: string;
          old_row?: Json | null;
          new_row?: Json | null;
          changed_by?: string | null;
          changed_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "audit_log_org_id_fkey"; columns: ["org_id"]; isOneToOne: false; referencedRelation: "organisation"; referencedColumns: ["org_id"] },
          { foreignKeyName: "audit_log_changed_by_fkey"; columns: ["changed_by"]; isOneToOne: false; referencedRelation: "person"; referencedColumns: ["person_id"] }
        ];
      };
    };
    Views: {
      v_renewal_pipeline: { Row: { org_id: string; contract_id: string; contract_no: string; valid_to: string; annual_value: number | null; status: string | null; customer_name: string; customer_phone: string | null; days_until_expiry: number | null; equipment_count: number | null }; Relationships: [] };
      v_technician_performance: { Row: { person_id: string; full_name: string; jobs_assigned: number | null; jobs_completed: number | null; avg_rating: number | null; sla_breaches: number | null; completion_rate_pct: number | null }; Relationships: [] };
    };
    Functions: {
      fn_append_attachment: { Args: { p_job_id: string; p_url: string }; Returns: undefined };
      fn_check_entitlement: { Args: { p_unit_id: string; p_part_category?: string | null; p_scope?: string }; Returns: Json };
      fn_create_org: { Args: { p_full_name: string; p_phone: string | null; p_org_name: string; p_org_type?: string }; Returns: string };
      fn_daily_checks: { Args: Record<PropertyKey, never>; Returns: undefined };
      fn_generate_pm_visits: { Args: { p_contract_id: string }; Returns: number };
      fn_my_org_ids: { Args: Record<PropertyKey, never>; Returns: string[] };
      fn_my_person_id: { Args: Record<PropertyKey, never>; Returns: string | null };
      fn_my_role: { Args: { p_org_id: string }; Returns: string | null };
      fn_seed_org: { Args: { p_org_id: string }; Returns: undefined };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
