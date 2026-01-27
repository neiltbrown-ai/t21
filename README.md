# T21 - Down Syndrome Resources Directory

A comprehensive directory of financial resources, benefits, grants, and inspiring individuals for the Down syndrome community.

## Features

- **Financial Resources Directory**: 202+ grants, benefits, scholarships, and support programs
- **Inspiration Profiles**: 95+ role models - athletes, artists, entrepreneurs, advocates
- **Smart Filtering**: Filter by category, age range, income limits, coverage area
- **Mobile Responsive**: Full mobile support with collapsible sidebar and hamburger menu
- **About Page**: Mission and personal story behind T21

## Pages

- **Home** (`/`) - Landing page with stats and navigation cards
- **Resources** (`/resources`) - Searchable/filterable financial resources directory
- **Inspiration** (`/inspiration`) - Profiles of inspiring individuals with Down syndrome
- **About** (`/about`) - Mission, vision, and personal story

## Tech Stack

- Single HTML file (self-contained)
- Vanilla JavaScript (no framework dependencies)
- Tailwind CSS (via CDN)
- DM Sans font (Google Fonts)

## Design System

### Colors
- Primary: `#0066CC` (blue)
- Secondary: `#4ECDC4` (teal)
- Tertiary: `#F97316` (orange)
- Black: `#111`
- Gray Light: `#f7f7f7`
- Gray Border: `#e0e0e0`
- Gray Text: `#666`

### Typography
- Font: DM Sans
- Headings: 700 weight
- Body: 400-500 weight

### Components
- Cards: 4px border radius, subtle shadow
- Buttons: Primary (blue), Secondary (outline)
- Tags: Uppercase, small, rounded
- Gradients: Blue→Teal for banners

## Deployment

### Option 1: Static Hosting (Netlify, Vercel, GitHub Pages)

1. Upload `index.html` to your hosting provider
2. No build step required - it's a single HTML file

### Option 2: Netlify Drop

1. Go to [netlify.com/drop](https://netlify.com/drop)
2. Drag and drop the `index.html` file
3. Get instant live URL

### Option 3: GitHub Pages

1. Create a new repository
2. Upload `index.html`
3. Enable GitHub Pages in repository settings
4. Access at `https://yourusername.github.io/repo-name`

## Data Structure

### Resources Data
Resources are stored in the `resourcesData` array with fields:
- `resource_id`: Unique identifier (e.g., "FIN-NAT-0001")
- `resource_name`: Program name
- `organization_type`: Federal Government, Private Foundation, etc.
- `subcategories`: Category classification
- `jurisdiction_level`: National, Multi-State, State
- `short_description`: Brief summary
- `full_description`: Detailed description
- `amount_min_`, `amount_max_`: Award amounts
- `income_limit_exists`: Yes/No
- `age_min`, `age_max`: Age eligibility
- `website`, `phone`: Contact info

### Inspiration Data
Profiles are stored in the `inspirationData` array with fields:
- `profile_id`: Unique identifier (e.g., "INS-0001")
- `full_name`: Legal name
- `known_as___stage_name`: Public/stage name
- `location_city`, `location_state`: Location
- `primary_field`: Main area (Athletics, Arts, etc.)
- `short_bio`: Brief biography
- `specific_achievements`: Notable accomplishments
- `website`, `instagram`: Social links

## Future Development

- [ ] Connect to backend database (Supabase/Firebase)
- [ ] Add search functionality
- [ ] User submissions for new resources
- [ ] Admin panel for content management
- [ ] State-specific filtering
- [ ] Email newsletter integration

## License

MIT License - Built with ❤️ for the Down syndrome community
