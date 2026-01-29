/**
 * Migration Script: Import JSON data to Supabase
 *
 * Usage:
 *   1. Install dependencies: npm install @supabase/supabase-js
 *   2. Set environment variables:
 *      - SUPABASE_URL: Your Supabase project URL
 *      - SUPABASE_SERVICE_KEY: Your Supabase service role key (not anon key!)
 *   3. Run: node supabase/migrate-data.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Missing environment variables');
    console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_KEY');
    console.error('Example:');
    console.error('  export SUPABASE_URL="https://your-project.supabase.co"');
    console.error('  export SUPABASE_SERVICE_KEY="your-service-role-key"');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Transform financial resource from JSON to database format
 */
function transformFinancialResource(item) {
    return {
        program_id: item.program_id,
        program_name: item.program_name,
        organization_type: item.organization_type,
        website: item.website,
        phone: item.phone,
        email: item.email,
        address: item.address,
        geographic_coverage: item.geographic_coverage,
        states_available: item.states_available,
        program_category: item.program_category,
        assistance_type: item.assistance_type,
        award_amount_min: item.award_amount_min,
        award_amount_max: item.award_amount_max,
        annual_cap: item.annual_cap,
        lifetime_cap: item.lifetime_cap,
        age_range_min: item.age_range_min,
        age_range_max: item.age_range_max,
        diagnosis_required: item.diagnosis_required,
        income_limit: item.income_limit,
        income_limit_details: item.income_limit_details,
        asset_limit: item.asset_limit,
        other_eligibility: item.other_eligibility,
        covered_expenses: item.covered_expenses,
        application_deadline: item.application_deadline,
        application_type: item.application_type,
        application_url: item.application_url,
        reapplication_allowed: item.reapplication_allowed,
        processing_time: item.processing_time,
        program_description: item.program_description,
        application_process: item.application_process,
        key_features_and_benefits: item['key_features_&_benefits'],
        real_world_context: item['real-world_context'],
        special_notes: item.special_notes,
        last_updated: item.last_updated
    };
}

/**
 * Transform therapy resource from JSON to database format
 */
function transformTherapyResource(item) {
    return {
        resource_id: item.resource_id,
        resource_name: item.resource_name,
        organization_name: item.organization_name,
        organization_type: item.organization_type,
        primary_category: item.primary_category,
        subcategories: item.subcategories,
        resource_type: item.resource_type,
        ds_specificity: item.ds_specificity,
        website: item.website,
        phone: item.phone,
        email: item.email,
        address: item.address,
        jurisdiction_level: item.jurisdiction_level,
        states_available: item.states_available,
        service_area_notes: item.service_area_notes,
        lifecycle_stages: item.lifecycle_stages,
        age_min: item.age_min,
        age_max: item.age_max,
        eligibility_criteria: item.eligibility_criteria,
        cost_type: item.cost_type,
        cost_details: item.cost_details,
        application_status: item.application_status,
        short_description: item.short_description,
        full_description: item.full_description,
        key_features: item.key_features,
        practical_notes: item.practical_notes,
        date_added: item.date_added,
        last_verified: item.last_verified,
        verification_source: item.verification_source,
        data_quality_score: item.data_quality_score,
        tags: item.tags
    };
}

/**
 * Transform inspiration profile from JSON to database format
 */
function transformInspirationProfile(item) {
    return {
        profile_id: item.profile_id,
        full_name: item.full_name,
        known_as_stage_name: item['known_as___stage_name'],
        birth_year: item.birth_year,
        location_city: item.location_city,
        location_state: item.location_state,
        location_country: item.location_country,
        primary_field: item.primary_field,
        secondary_fields: item.secondary_fields,
        specific_achievements: item.specific_achievements,
        active_status: item.active_status,
        active_since: item.active_since,
        website: item.website,
        instagram: item.instagram,
        tiktok: item.tiktok,
        youtube: item.youtube,
        facebook: item.facebook,
        short_bio: item.short_bio,
        notable_quotes: item.notable_quotes,
        key_accomplishments: item.key_accomplishments,
        speaking_available: item.speaking_available,
        awards_and_honors: item['awards_&_honors'],
        include_in_public_directory: item.include_in_public_directory,
        directory_categories: item.directory_categories,
        featured_profile: item.featured_profile
    };
}

/**
 * Import data to a table with upsert (insert or update on conflict)
 */
async function importToTable(tableName, data, idColumn) {
    console.log(`\nImporting ${data.length} records to ${tableName}...`);

    // Supabase has a limit on batch size, so we'll chunk the data
    const chunkSize = 100;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);

        const { data: result, error } = await supabase
            .from(tableName)
            .upsert(chunk, {
                onConflict: idColumn,
                ignoreDuplicates: false
            });

        if (error) {
            console.error(`  Error inserting chunk ${i / chunkSize + 1}:`, error.message);
            errorCount += chunk.length;
        } else {
            successCount += chunk.length;
            console.log(`  Inserted chunk ${i / chunkSize + 1} (${chunk.length} records)`);
        }
    }

    console.log(`  Completed: ${successCount} success, ${errorCount} errors`);
    return { successCount, errorCount };
}

/**
 * Main migration function
 */
async function migrate() {
    console.log('========================================');
    console.log('T21 Data Migration to Supabase');
    console.log('========================================');
    console.log(`Supabase URL: ${supabaseUrl}`);
    console.log('');

    const dataDir = path.join(__dirname, '..', 'data');

    try {
        // Load JSON data files
        console.log('Loading data files...');

        const financialData = JSON.parse(
            fs.readFileSync(path.join(dataDir, 'financial.json'), 'utf8')
        );
        console.log(`  Loaded ${financialData.length} financial resources`);

        const therapyData = JSON.parse(
            fs.readFileSync(path.join(dataDir, 'therapy.json'), 'utf8')
        );
        console.log(`  Loaded ${therapyData.length} therapy resources`);

        const inspirationData = JSON.parse(
            fs.readFileSync(path.join(dataDir, 'inspiration.json'), 'utf8')
        );
        console.log(`  Loaded ${inspirationData.length} inspiration profiles`);

        // Transform and import financial resources
        const transformedFinancial = financialData.map(transformFinancialResource);
        const financialResult = await importToTable(
            'financial_resources',
            transformedFinancial,
            'program_id'
        );

        // Transform and import therapy resources
        const transformedTherapy = therapyData.map(transformTherapyResource);
        const therapyResult = await importToTable(
            'therapy_resources',
            transformedTherapy,
            'resource_id'
        );

        // Transform and import inspiration profiles
        const transformedInspiration = inspirationData.map(transformInspirationProfile);
        const inspirationResult = await importToTable(
            'inspiration_profiles',
            transformedInspiration,
            'profile_id'
        );

        // Summary
        console.log('\n========================================');
        console.log('Migration Complete!');
        console.log('========================================');
        console.log(`Financial Resources: ${financialResult.successCount} imported`);
        console.log(`Therapy Resources: ${therapyResult.successCount} imported`);
        console.log(`Inspiration Profiles: ${inspirationResult.successCount} imported`);
        console.log(`Total: ${
            financialResult.successCount +
            therapyResult.successCount +
            inspirationResult.successCount
        } records`);

        const totalErrors =
            financialResult.errorCount +
            therapyResult.errorCount +
            inspirationResult.errorCount;

        if (totalErrors > 0) {
            console.log(`\nWarning: ${totalErrors} errors occurred during migration`);
            process.exit(1);
        }

    } catch (error) {
        console.error('\nMigration failed:', error.message);
        process.exit(1);
    }
}

// Run migration
migrate();
