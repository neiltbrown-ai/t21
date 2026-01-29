#!/usr/bin/env python3
"""
T21 Directory - Import Google Sheets to Supabase

This script downloads CSV data from Google Sheets and imports it into Supabase.

Usage:
    pip install requests
    python supabase/import_from_sheets.py

The script will:
1. Download CSV data from the Google Sheets URLs
2. Show you the column headers for verification
3. Map columns to Supabase table columns
4. Import the data
"""

import requests
import csv
import io
import json
from datetime import datetime

# ============== CONFIGURATION ==============
SUPABASE_URL = "https://qistidaxuevycutiegsa.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpc3RpZGF4dWV2eWN1dGllZ3NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MTM5NTAsImV4cCI6MjA4NTI4OTk1MH0.6U6g4gsabRGxvcPAaO1so5cZgS38GqGhKfHmq6E9dSA"

# Google Sheets CSV export URLs
RESOURCES_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vScvR_Z2ICwP09GFt0afq3g9b_iBLrPVQiCg2v-WghUZki5VkGQlD9QSaA7aNp8ZQ/pub?output=csv"
INSPIRATION_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQNX5wnVoF72Whz5SswWvUjMux-LpeybJ-8iZVo3-eXtHpEdWwCZ-MHEhNL2rNxdg/pub?output=csv"

# ============== HELPERS ==============
headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}


def clean_value(val):
    """Clean and normalize a value."""
    if val is None or val == "" or val == "None" or val == "null":
        return None
    if isinstance(val, str):
        val = val.strip()
        if val == "" or val.lower() in ("none", "null", "n/a", "na"):
            return None
    return val


def clean_numeric(val):
    """Convert to numeric."""
    val = clean_value(val)
    if val is None:
        return None
    try:
        # Remove currency symbols and commas
        if isinstance(val, str):
            val = val.replace("$", "").replace(",", "").strip()
        return float(val)
    except (ValueError, TypeError):
        return None


def clean_int(val):
    """Convert to integer."""
    num = clean_numeric(val)
    if num is None:
        return None
    return int(num)


def clean_bool(val):
    """Convert to boolean."""
    val = clean_value(val)
    if val is None:
        return False
    if isinstance(val, bool):
        return val
    return str(val).lower() in ('yes', 'true', '1', 'y')


def normalize_column_name(name):
    """Normalize a column name for matching."""
    if not name:
        return ""
    return name.lower().strip().replace(" ", "_").replace("-", "_").replace("&", "and").replace("/", "_")


def download_csv(url):
    """Download and parse CSV from URL."""
    print(f"  Downloading from: {url[:60]}...")
    resp = requests.get(url)
    resp.raise_for_status()

    # Parse CSV
    reader = csv.DictReader(io.StringIO(resp.text))
    rows = list(reader)

    print(f"  Downloaded {len(rows)} rows")
    return rows, reader.fieldnames


def insert_records(table_name, records, batch_size=50):
    """Insert records into Supabase."""
    if not records:
        print(f"  No records to insert for {table_name}")
        return 0

    total_inserted = 0
    errors = []

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
            errors.append(f"Batch {i // batch_size + 1}: {resp.status_code} - {resp.text[:200]}")

    print(f"  Total inserted: {total_inserted}")
    if errors:
        print(f"  Errors:")
        for e in errors[:5]:  # Show first 5 errors
            print(f"    {e}")

    return total_inserted


# ============== COLUMN MAPPINGS ==============
# Map spreadsheet columns to Supabase table columns
# Adjust these based on your actual spreadsheet column names

def map_resource_row(row):
    """Map a resource row to financial_resources or therapy_services table format."""
    # Detect if this is a financial resource or therapy service
    # based on the presence of certain columns

    # First, let's get a normalized version of the row keys
    norm_row = {normalize_column_name(k): v for k, v in row.items()}

    # Check if it has program_id (financial) or resource_id (therapy)
    if 'program_id' in norm_row or 'program_name' in norm_row:
        return map_financial_row(row, norm_row)
    elif 'resource_id' in norm_row or 'resource_name' in norm_row:
        return map_therapy_row(row, norm_row)
    else:
        # Default to financial
        return map_financial_row(row, norm_row)


def map_financial_row(row, norm_row):
    """Map to financial_resources table."""
    return {
        "program_id": clean_value(norm_row.get("program_id")),
        "program_name": clean_value(norm_row.get("program_name")),
        "organization_type": clean_value(norm_row.get("organization_type")),
        "website": clean_value(norm_row.get("website")),
        "phone": clean_value(norm_row.get("phone")),
        "email": clean_value(norm_row.get("email")),
        "address": clean_value(norm_row.get("address")),
        "geographic_coverage": clean_value(norm_row.get("geographic_coverage")),
        "states_available": clean_value(norm_row.get("states_available")),
        "program_category": clean_value(norm_row.get("program_category")),
        "assistance_type": clean_value(norm_row.get("assistance_type")),
        "award_amount_min": clean_numeric(norm_row.get("award_amount_min")),
        "award_amount_max": clean_numeric(norm_row.get("award_amount_max")),
        "annual_cap": clean_numeric(norm_row.get("annual_cap")),
        "lifetime_cap": clean_numeric(norm_row.get("lifetime_cap")),
        "age_range_min": clean_int(norm_row.get("age_range_min")) or 0,
        "age_range_max": clean_int(norm_row.get("age_range_max")) or 999,
        "diagnosis_required": clean_value(norm_row.get("diagnosis_required")),
        "income_limit": clean_value(norm_row.get("income_limit")),
        "income_limit_details": clean_value(norm_row.get("income_limit_details")),
        "asset_limit": clean_value(norm_row.get("asset_limit")),
        "other_eligibility": clean_value(norm_row.get("other_eligibility")),
        "covered_expenses": clean_value(norm_row.get("covered_expenses")),
        "application_deadline": clean_value(norm_row.get("application_deadline")),
        "application_type": clean_value(norm_row.get("application_type")),
        "application_url": clean_value(norm_row.get("application_url")),
        "reapplication_allowed": clean_value(norm_row.get("reapplication_allowed")),
        "processing_time": clean_value(norm_row.get("processing_time")),
        "program_description": clean_value(norm_row.get("program_description")),
        "application_process": clean_value(norm_row.get("application_process")),
        "key_features": clean_value(norm_row.get("key_features") or norm_row.get("key_features_and_benefits")),
        "real_world_context": clean_value(norm_row.get("real_world_context") or norm_row.get("real_world_context")),
        "special_notes": clean_value(norm_row.get("special_notes")),
        "last_updated": clean_value(norm_row.get("last_updated")),
    }


def map_therapy_row(row, norm_row):
    """Map to therapy_services table."""
    return {
        "resource_id": clean_value(norm_row.get("resource_id")),
        "resource_name": clean_value(norm_row.get("resource_name")),
        "organization_name": clean_value(norm_row.get("organization_name")),
        "organization_type": clean_value(norm_row.get("organization_type")),
        "primary_category": clean_value(norm_row.get("primary_category")) or "Healthcare & Therapy",
        "subcategories": clean_value(norm_row.get("subcategories")),
        "resource_type": clean_value(norm_row.get("resource_type")),
        "ds_specificity": clean_value(norm_row.get("ds_specificity")),
        "website": clean_value(norm_row.get("website")),
        "phone": clean_value(norm_row.get("phone")),
        "email": clean_value(norm_row.get("email")),
        "address": clean_value(norm_row.get("address")),
        "jurisdiction_level": clean_value(norm_row.get("jurisdiction_level")),
        "states_available": clean_value(norm_row.get("states_available")),
        "service_area_notes": clean_value(norm_row.get("service_area_notes")),
        "lifecycle_stages": clean_value(norm_row.get("lifecycle_stages")),
        "age_min": clean_int(norm_row.get("age_min")) or 0,
        "age_max": clean_int(norm_row.get("age_max")) or 999,
        "eligibility_criteria": clean_value(norm_row.get("eligibility_criteria")),
        "cost_type": clean_value(norm_row.get("cost_type")),
        "cost_details": clean_value(norm_row.get("cost_details")),
        "application_status": clean_value(norm_row.get("application_status")),
        "short_description": clean_value(norm_row.get("short_description")),
        "full_description": clean_value(norm_row.get("full_description")),
        "key_features": clean_value(norm_row.get("key_features")),
        "practical_notes": clean_value(norm_row.get("practical_notes")),
        "tags": clean_value(norm_row.get("tags")),
    }


def map_inspiration_row(row):
    """Map to inspiration_profiles table."""
    norm_row = {normalize_column_name(k): v for k, v in row.items()}

    return {
        "profile_id": clean_value(norm_row.get("profile_id")),
        "full_name": clean_value(norm_row.get("full_name")),
        "known_as": clean_value(norm_row.get("known_as") or norm_row.get("known_as___stage_name") or norm_row.get("stage_name")),
        "birth_year": clean_int(norm_row.get("birth_year")),
        "location_city": clean_value(norm_row.get("location_city")),
        "location_state": clean_value(norm_row.get("location_state")),
        "location_country": clean_value(norm_row.get("location_country")) or "USA",
        "primary_field": clean_value(norm_row.get("primary_field")),
        "secondary_fields": clean_value(norm_row.get("secondary_fields")),
        "specific_achievements": clean_value(norm_row.get("specific_achievements")),
        "active_status": clean_value(norm_row.get("active_status")),
        "active_since": clean_value(norm_row.get("active_since")),
        "website": clean_value(norm_row.get("website")),
        "instagram": clean_value(norm_row.get("instagram")),
        "tiktok": clean_value(norm_row.get("tiktok")),
        "youtube": clean_value(norm_row.get("youtube")),
        "facebook": clean_value(norm_row.get("facebook")),
        "short_bio": clean_value(norm_row.get("short_bio")),
        "notable_quotes": clean_value(norm_row.get("notable_quotes")),
        "key_accomplishments": clean_value(norm_row.get("key_accomplishments")),
        "speaking_available": clean_bool(norm_row.get("speaking_available")),
        "awards_honors": clean_value(norm_row.get("awards_honors") or norm_row.get("awards_and_honors")),
        "include_in_directory": clean_bool(norm_row.get("include_in_directory") or norm_row.get("include_in_public_directory")),
        "directory_categories": clean_value(norm_row.get("directory_categories")),
        "featured_profile": clean_bool(norm_row.get("featured_profile")),
    }


# ============== IMPORT FUNCTIONS ==============

def import_resources():
    """Import resources from the DS Resources Directory spreadsheet."""
    print("\n" + "=" * 50)
    print("IMPORTING RESOURCES DIRECTORY")
    print("=" * 50)

    try:
        rows, columns = download_csv(RESOURCES_CSV_URL)
    except Exception as e:
        print(f"  Error downloading CSV: {e}")
        return 0, 0

    # Show columns for verification
    print(f"\n  Columns found ({len(columns)}):")
    for i, col in enumerate(columns):
        print(f"    {i+1}. {col}")

    # Separate into financial resources and therapy services
    financial_records = []
    therapy_records = []

    for row in rows:
        norm_row = {normalize_column_name(k): v for k, v in row.items()}

        # Determine type based on ID prefix or column presence
        program_id = clean_value(norm_row.get("program_id", ""))
        resource_id = clean_value(norm_row.get("resource_id", ""))

        if resource_id and (resource_id.startswith("HLT") or resource_id.startswith("THR")):
            # Therapy service
            record = map_therapy_row(row, norm_row)
            if record.get("resource_id") and record.get("resource_name"):
                therapy_records.append(record)
        elif program_id:
            # Financial resource
            record = map_financial_row(row, norm_row)
            if record.get("program_id") and record.get("program_name"):
                financial_records.append(record)

    print(f"\n  Parsed {len(financial_records)} financial resources")
    print(f"  Parsed {len(therapy_records)} therapy services")

    fin_count = 0
    ther_count = 0

    if financial_records:
        print("\n  Inserting financial resources...")
        fin_count = insert_records("financial_resources", financial_records)

    if therapy_records:
        print("\n  Inserting therapy services...")
        ther_count = insert_records("therapy_services", therapy_records)

    return fin_count, ther_count


def import_inspiration():
    """Import inspiration profiles from the DS Inspiration spreadsheet."""
    print("\n" + "=" * 50)
    print("IMPORTING INSPIRATION PROFILES")
    print("=" * 50)

    try:
        rows, columns = download_csv(INSPIRATION_CSV_URL)
    except Exception as e:
        print(f"  Error downloading CSV: {e}")
        return 0

    # Show columns for verification
    print(f"\n  Columns found ({len(columns)}):")
    for i, col in enumerate(columns):
        print(f"    {i+1}. {col}")

    # Map rows
    records = []
    for row in rows:
        record = map_inspiration_row(row)
        if record.get("profile_id") and record.get("full_name"):
            records.append(record)

    print(f"\n  Parsed {len(records)} inspiration profiles")

    if records:
        print("\n  Inserting inspiration profiles...")
        return insert_records("inspiration_profiles", records)

    return 0


# ============== MAIN ==============
if __name__ == "__main__":
    print("=" * 50)
    print("T21 DIRECTORY - GOOGLE SHEETS TO SUPABASE IMPORT")
    print("=" * 50)
    print(f"\nSupabase URL: {SUPABASE_URL}")
    print(f"Timestamp: {datetime.now().isoformat()}")

    # Import resources
    fin_count, ther_count = import_resources()

    # Import inspiration
    insp_count = import_inspiration()

    # Summary
    print("\n" + "=" * 50)
    print("IMPORT COMPLETE")
    print("=" * 50)
    print(f"\n  Financial Resources: {fin_count}")
    print(f"  Therapy Services: {ther_count}")
    print(f"  Inspiration Profiles: {insp_count}")
    print(f"  Total: {fin_count + ther_count + insp_count}")
    print(f"\nVerify at: {SUPABASE_URL}")
