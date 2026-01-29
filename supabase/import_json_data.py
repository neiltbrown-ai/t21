#!/usr/bin/env python3
"""
T21 Directory - Supabase JSON Data Import Script

This script imports data from the existing JSON files into Supabase.

Usage:
    python supabase/import_json_data.py

Requirements:
    pip install requests
"""

import requests
import json
import os
from pathlib import Path

# ============== CONFIGURATION ==============
SUPABASE_URL = "https://qistidaxuevycutiegsa.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpc3RpZGF4dWV2eWN1dGllZ3NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MTM5NTAsImV4cCI6MjA4NTI4OTk1MH0.6U6g4gsabRGxvcPAaO1so5cZgS38GqGhKfHmq6E9dSA"

# Data file paths (relative to project root)
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
DATA_DIR = PROJECT_ROOT / "data"

FINANCIAL_FILE = DATA_DIR / "financial.json"
THERAPY_FILE = DATA_DIR / "therapy.json"
INSPIRATION_FILE = DATA_DIR / "inspiration.json"

# ============== HELPERS ==============
headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}


def clean_value(val):
    """Clean and normalize a value for database insertion."""
    if val is None:
        return None
    if isinstance(val, bool):
        return val
    if isinstance(val, (int, float)):
        return val
    return str(val).strip() if val else None


def clean_numeric(val):
    """Convert value to numeric, handling None and invalid values."""
    if val is None:
        return None
    try:
        return float(val)
    except (ValueError, TypeError):
        return None


def clean_int(val):
    """Convert value to integer, handling None and invalid values."""
    if val is None:
        return None
    try:
        return int(val)
    except (ValueError, TypeError):
        return None


def clean_bool(val):
    """Convert value to boolean."""
    if val is None:
        return False
    if isinstance(val, bool):
        return val
    return str(val).lower() in ('yes', 'true', '1', 'y')


def insert_records(table_name, records, batch_size=50):
    """Insert records into Supabase table in batches."""
    if not records:
        print(f"  No records to insert for {table_name}")
        return 0

    total_inserted = 0
    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        resp = requests.post(
            f"{SUPABASE_URL}/rest/v1/{table_name}",
            headers=headers,
            json=batch
        )
        if resp.status_code in (200, 201):
            total_inserted += len(batch)
            print(f"  Inserted batch {i // batch_size + 1} ({len(batch)} records)")
        else:
            print(f"  Error inserting batch {i // batch_size + 1}: {resp.status_code}")
            print(f"    {resp.text[:500]}")

    print(f"  Total inserted into {table_name}: {total_inserted}")
    return total_inserted


# ============== FINANCIAL RESOURCES ==============
def transform_financial(item):
    """Transform a financial resource from JSON format to database format."""
    return {
        "program_id": clean_value(item.get("program_id")),
        "program_name": clean_value(item.get("program_name")),
        "organization_type": clean_value(item.get("organization_type")),
        "website": clean_value(item.get("website")),
        "phone": clean_value(item.get("phone")),
        "email": clean_value(item.get("email")),
        "address": clean_value(item.get("address")),
        "geographic_coverage": clean_value(item.get("geographic_coverage")),
        "states_available": clean_value(item.get("states_available")),
        "program_category": clean_value(item.get("program_category")),
        "assistance_type": clean_value(item.get("assistance_type")),
        "award_amount_min": clean_numeric(item.get("award_amount_min")),
        "award_amount_max": clean_numeric(item.get("award_amount_max")),
        "annual_cap": clean_numeric(item.get("annual_cap")),
        "lifetime_cap": clean_numeric(item.get("lifetime_cap")),
        "age_range_min": clean_int(item.get("age_range_min")) or 0,
        "age_range_max": clean_int(item.get("age_range_max")) or 999,
        "diagnosis_required": clean_value(item.get("diagnosis_required")),
        "income_limit": clean_value(item.get("income_limit")),
        "income_limit_details": clean_value(item.get("income_limit_details")),
        "asset_limit": clean_value(item.get("asset_limit")),
        "other_eligibility": clean_value(item.get("other_eligibility")),
        "covered_expenses": clean_value(item.get("covered_expenses")),
        "application_deadline": clean_value(item.get("application_deadline")),
        "application_type": clean_value(item.get("application_type")),
        "application_url": clean_value(item.get("application_url")),
        "reapplication_allowed": clean_value(item.get("reapplication_allowed")),
        "processing_time": clean_value(item.get("processing_time")),
        "program_description": clean_value(item.get("program_description")),
        "application_process": clean_value(item.get("application_process")),
        "key_features": clean_value(item.get("key_features_&_benefits")),
        "real_world_context": clean_value(item.get("real-world_context")),
        "special_notes": clean_value(item.get("special_notes")),
        "last_updated": clean_value(item.get("last_updated")),
    }


def import_financial():
    """Import financial resources from JSON file."""
    if not FINANCIAL_FILE.exists():
        print(f"  File not found: {FINANCIAL_FILE}")
        return 0

    print("\nLoading Financial Resources...")
    with open(FINANCIAL_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    records = [transform_financial(item) for item in data if item.get("program_name")]
    print(f"  Parsed {len(records)} financial records")
    return insert_records("financial_resources", records)


# ============== THERAPY SERVICES ==============
def transform_therapy(item):
    """Transform a therapy resource from JSON format to database format."""
    return {
        "resource_id": clean_value(item.get("resource_id")),
        "resource_name": clean_value(item.get("resource_name")),
        "organization_name": clean_value(item.get("organization_name")),
        "organization_type": clean_value(item.get("organization_type")),
        "primary_category": clean_value(item.get("primary_category")) or "Healthcare & Therapy",
        "subcategories": clean_value(item.get("subcategories")),
        "resource_type": clean_value(item.get("resource_type")),
        "ds_specificity": clean_value(item.get("ds_specificity")),
        "website": clean_value(item.get("website")),
        "phone": clean_value(item.get("phone")),
        "email": clean_value(item.get("email")),
        "address": clean_value(item.get("address")),
        "jurisdiction_level": clean_value(item.get("jurisdiction_level")),
        "states_available": clean_value(item.get("states_available")),
        "service_area_notes": clean_value(item.get("service_area_notes")),
        "lifecycle_stages": clean_value(item.get("lifecycle_stages")),
        "age_min": clean_int(item.get("age_min")) or 0,
        "age_max": clean_int(item.get("age_max")) or 999,
        "eligibility_criteria": clean_value(item.get("eligibility_criteria")),
        "cost_type": clean_value(item.get("cost_type")),
        "cost_details": clean_value(item.get("cost_details")),
        "application_status": clean_value(item.get("application_status")),
        "short_description": clean_value(item.get("short_description")),
        "full_description": clean_value(item.get("full_description")),
        "key_features": clean_value(item.get("key_features")),
        "practical_notes": clean_value(item.get("practical_notes")),
        "date_added": clean_value(item.get("date_added")),
        "last_verified": clean_value(item.get("last_verified")),
        "verification_source": clean_value(item.get("verification_source")),
        "data_quality_score": clean_int(item.get("data_quality_score")),
        "tags": clean_value(item.get("tags")),
    }


def import_therapy():
    """Import therapy services from JSON file."""
    if not THERAPY_FILE.exists():
        print(f"  File not found: {THERAPY_FILE}")
        return 0

    print("\nLoading Therapy Services...")
    with open(THERAPY_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    records = [transform_therapy(item) for item in data if item.get("resource_name")]
    print(f"  Parsed {len(records)} therapy records")
    return insert_records("therapy_services", records)


# ============== INSPIRATION PROFILES ==============
def transform_inspiration(item):
    """Transform an inspiration profile from JSON format to database format."""
    return {
        "profile_id": clean_value(item.get("profile_id")),
        "full_name": clean_value(item.get("full_name")),
        "known_as": clean_value(item.get("known_as___stage_name")),
        "birth_year": clean_int(item.get("birth_year")),
        "location_city": clean_value(item.get("location_city")),
        "location_state": clean_value(item.get("location_state")),
        "location_country": clean_value(item.get("location_country")) or "USA",
        "primary_field": clean_value(item.get("primary_field")),
        "secondary_fields": clean_value(item.get("secondary_fields")),
        "specific_achievements": clean_value(item.get("specific_achievements")),
        "active_status": clean_value(item.get("active_status")),
        "active_since": clean_value(item.get("active_since")),
        "website": clean_value(item.get("website")),
        "instagram": clean_value(item.get("instagram")),
        "tiktok": clean_value(item.get("tiktok")),
        "youtube": clean_value(item.get("youtube")),
        "facebook": clean_value(item.get("facebook")),
        "short_bio": clean_value(item.get("short_bio")),
        "notable_quotes": clean_value(item.get("notable_quotes")),
        "key_accomplishments": clean_value(item.get("key_accomplishments")),
        "speaking_available": clean_bool(item.get("speaking_available")),
        "awards_honors": clean_value(item.get("awards_&_honors")),
        "include_in_directory": clean_bool(item.get("include_in_public_directory")),
        "directory_categories": clean_value(item.get("directory_categories")),
        "featured_profile": clean_bool(item.get("featured_profile")),
    }


def import_inspiration():
    """Import inspiration profiles from JSON file."""
    if not INSPIRATION_FILE.exists():
        print(f"  File not found: {INSPIRATION_FILE}")
        return 0

    print("\nLoading Inspiration Profiles...")
    with open(INSPIRATION_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    records = [transform_inspiration(item) for item in data if item.get("full_name")]
    print(f"  Parsed {len(records)} inspiration records")
    return insert_records("inspiration_profiles", records)


# ============== MAIN ==============
if __name__ == "__main__":
    print("=" * 50)
    print("T21 DIRECTORY - SUPABASE JSON DATA IMPORT")
    print("=" * 50)
    print(f"\nSupabase URL: {SUPABASE_URL}")
    print(f"Data directory: {DATA_DIR}")

    total = 0
    total += import_financial()
    total += import_therapy()
    total += import_inspiration()

    print("\n" + "=" * 50)
    print("IMPORT COMPLETE")
    print("=" * 50)
    print(f"\nTotal records imported: {total}")
    print("\nCheck your Supabase Table Editor to verify the data:")
    print(f"  {SUPABASE_URL}")
