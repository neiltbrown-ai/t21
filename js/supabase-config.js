// Supabase Configuration for T21 Directory
// This file initializes the Supabase client for data fetching

const SUPABASE_URL = 'https://qistidaxuevycutiegsa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpc3RpZGF4dWV2eWN1dGllZ3NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MTM5NTAsImV4cCI6MjA4NTI4OTk1MH0.6U6g4gsabRGxvcPAaO1so5cZgS38GqGhKfHmq6E9dSA';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Flag to enable/disable Supabase (set to false to use local JSON files)
const USE_SUPABASE = true;

/**
 * Fetch financial resources from Supabase
 * @returns {Promise<Array>} Array of financial resources
 */
async function fetchFinancialResources() {
    const { data, error } = await supabase
        .from('financial_resources')
        .select('*')
        .order('program_name');

    if (error) {
        console.error('Error fetching financial resources:', error);
        throw error;
    }

    // Transform database column names back to JSON format for compatibility
    return data.map(item => ({
        ...item,
        'key_features_&_benefits': item.key_features,
        'real-world_context': item.real_world_context,
    }));
}

/**
 * Fetch therapy services from Supabase
 * @returns {Promise<Array>} Array of therapy services
 */
async function fetchTherapyServices() {
    const { data, error } = await supabase
        .from('therapy_services')
        .select('*')
        .order('resource_name');

    if (error) {
        console.error('Error fetching therapy services:', error);
        throw error;
    }

    return data;
}

/**
 * Fetch inspiration profiles from Supabase
 * @returns {Promise<Array>} Array of inspiration profiles
 */
async function fetchInspirationProfiles() {
    const { data, error } = await supabase
        .from('inspiration_profiles')
        .select('*')
        .order('full_name');

    if (error) {
        console.error('Error fetching inspiration profiles:', error);
        throw error;
    }

    // Transform database column names back to JSON format for compatibility
    return data.map(item => ({
        ...item,
        'known_as___stage_name': item.known_as,
        'awards_&_honors': item.awards_honors,
        'include_in_public_directory': item.include_in_directory ? 'Yes' : 'No',
        'speaking_available': item.speaking_available ? 'Yes' : 'No',
        'featured_profile': item.featured_profile ? 'Yes' : 'No',
    }));
}

/**
 * Fetch all data from Supabase
 * @returns {Promise<{financial: Array, therapy: Array, inspiration: Array}>}
 */
async function fetchAllFromSupabase() {
    const [financial, therapy, inspiration] = await Promise.all([
        fetchFinancialResources(),
        fetchTherapyServices(),
        fetchInspirationProfiles()
    ]);

    return { financial, therapy, inspiration };
}
