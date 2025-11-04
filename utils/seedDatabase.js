import { query } from '../config/database.js';

// Helper function to generate URL-friendly slug from title
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '');      // Remove leading/trailing hyphens
}

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Check if admin user exists
    const adminCheck = await query('SELECT id FROM users WHERE email = $1', ['admin@isaca.com']);
    const adminId = adminCheck.rows[0]?.id || 1;

    // Insert events
    const eventInserts = [
      {
        title: 'Cybersecurity Best Practices Workshop',
        hosted_by: 'ISACA Silicon Valley',
        status: 'upcoming',
        category: 'Workshop',
        date: '2025-11-15',
        start_time: '14:00',
        end_time: '17:00',
        member_price: 0.00,
        non_member_price: 50.00,
        max_attendees: 80,
        current_attendees: 35,
        cpe_hours: 3.0,
        tags: ['Cybersecurity', 'Best Practices', 'Workshop'],
        description: 'Learn the latest cybersecurity best practices from industry experts. This comprehensive workshop covers threat detection, incident response, and security frameworks.'
      },
      {
        title: 'Risk Management in Digital Age',
        hosted_by: 'ISACA Silicon Valley',
        status: 'upcoming',
        category: 'Webinar',
        date: '2025-11-22',
        start_time: '18:00',
        end_time: '20:00',
        member_price: 0.00,
        non_member_price: 25.00,
        max_attendees: 200,
        current_attendees: 168,
        cpe_hours: 2.0,
        tags: ['Risk Management', 'Digital Transformation'],
        description: 'Explore modern risk management strategies and frameworks for digital transformation initiatives.'
      },
      {
        title: 'ISACA Certification Prep Session',
        hosted_by: 'ISACA Silicon Valley',
        status: 'upcoming',
        category: 'Training',
        date: '2025-12-05',
        start_time: '10:00',
        end_time: '16:00',
        member_price: 50.00,
        non_member_price: 150.00,
        max_attendees: 40,
        current_attendees: 20,
        cpe_hours: 6.0,
        tags: ['Certification', 'CISA', 'CISM', 'Training'],
        description: 'Intensive preparation session for ISACA certifications including CISA, CISM, CGEIT, and CRISC.'
      },
      {
        title: 'AI Governance & Ethics Summit',
        hosted_by: 'ISACA Silicon Valley',
        status: 'upcoming',
        category: 'Summit',
        date: '2025-12-12',
        start_time: '09:00',
        end_time: '17:00',
        member_price: 75.00,
        non_member_price: 200.00,
        max_attendees: 150,
        current_attendees: 89,
        cpe_hours: 8.0,
        tags: ['AI', 'Governance', 'Ethics', 'Summit'],
        description: 'Full-day summit on AI governance, ethics, and risk management in enterprise environments.'
      },
      {
        title: 'Cloud Security Fundamentals',
        hosted_by: 'ISACA Silicon Valley',
        status: 'upcoming',
        category: 'Webinar',
        date: '2025-12-18',
        start_time: '19:00',
        end_time: '20:30',
        member_price: 0.00,
        non_member_price: 30.00,
        max_attendees: 300,
        current_attendees: 245,
        cpe_hours: 1.5,
        tags: ['Cloud Security', 'Fundamentals'],
        description: 'Essential cloud security concepts for IT professionals transitioning to cloud environments.'
      },
      {
        title: 'Monthly Networking Mixer',
        hosted_by: 'ISACA Silicon Valley',
        status: 'upcoming',
        category: 'Networking',
        date: '2025-11-24',
        start_time: '18:00',
        end_time: '21:00',
        member_price: 15.00,
        non_member_price: 40.00,
        max_attendees: 120,
        current_attendees: 67,
        cpe_hours: 0.0,
        tags: ['Networking', 'Social'],
        description: 'Monthly networking event for ISACA members and IT professionals in Silicon Valley.'
      },
      {
        title: 'Annual ISACA Conference 2025',
        hosted_by: 'ISACA Global',
        status: 'ongoing',
        category: 'Summit',
        date: '2025-10-26',
        start_time: '09:00',
        end_time: '17:00',
        member_price: 200.00,
        non_member_price: 400.00,
        max_attendees: 500,
        current_attendees: 450,
        cpe_hours: 8.0,
        tags: ['Conference', 'Networking', 'Professional Development'],
        description: 'Three-day annual conference featuring keynote speakers, workshops, and networking opportunities for IT professionals.'
      },
      {
        title: 'Cloud Security Best Practices',
        hosted_by: 'ISACA Silicon Valley',
        status: 'completed',
        category: 'Webinar',
        date: '2025-09-15',
        start_time: '19:00',
        end_time: '21:00',
        member_price: 0.00,
        non_member_price: 30.00,
        max_attendees: 250,
        current_attendees: 230,
        cpe_hours: 2.0,
        tags: ['Cloud Security', 'Best Practices', 'Virtual'],
        description: 'Comprehensive overview of cloud security best practices and implementation strategies.'
      }
    ];

    for (const event of eventInserts) {
      const slug = generateSlug(event.title);
      
      const result = await query(
        `INSERT INTO events (
          event_title, event_slug, hosted_by, event_status, event_category, event_date,
          start_time, end_time, member_price, non_member_price, max_attendees,
          current_attendees, cpe_hours, event_tags, event_description, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING id`,
        [
          event.title, slug, event.hosted_by, event.status, event.category, event.date,
          event.start_time, event.end_time, event.member_price, event.non_member_price,
          event.max_attendees, event.current_attendees, event.cpe_hours, event.tags,
          event.description, adminId
        ]
      );
      const eventId = result.rows[0].id;
      console.log(`✓ Created event: ${event.title} (ID: ${eventId})`);
      
      // Add sample speakers for the first event
      if (event.title === 'Cybersecurity Best Practices Workshop') {
        await query(
          `INSERT INTO event_speakers (event_id, full_name, job_title, company, biography, photo_url, linkedin_profile, display_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [eventId, 'Alice Kumar', 'CTO', 'SecureCorp', 'Expert on ML-secure systems with 15+ years experience in cybersecurity and artificial intelligence.', 
           'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=100&h=100&fit=crop&crop=face', 
           'https://www.linkedin.com/in/alicek', 1]
        );
        
        await query(
          `INSERT INTO event_speakers (event_id, full_name, job_title, company, biography, photo_url, linkedin_profile, display_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [eventId, 'Bob Lee', 'Head of Research', 'CyberSys', 'Threat intelligence lead specializing in advanced persistent threats and AI-powered attack detection.', 
           'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face', 
           'https://www.linkedin.com/in/bobl', 2]
        );
        
        console.log(`  ✓ Added 2 speakers`);
        
        // Add agenda
        await query(
          `INSERT INTO event_agenda (event_id, start_time, end_time, session_title, session_description)
           VALUES ($1, $2, $3, $4, $5)`,
          [eventId, '14:00:00', '15:00:00', 'Keynote: Cybersecurity Threats 2025', 
           'Explore the evolving landscape of cybersecurity threats and learn how organizations can prepare.']
        );
        
        await query(
          `INSERT INTO event_agenda (event_id, start_time, end_time, session_title, session_description)
           VALUES ($1, $2, $3, $4, $5)`,
          [eventId, '15:15:00', '16:30:00', 'Workshop: Hands-on Defense Strategies', 
           'Get hands-on experience with the latest cybersecurity tools and techniques.']
        );
        
        await query(
          `INSERT INTO event_agenda (event_id, start_time, end_time, session_title, session_description)
           VALUES ($1, $2, $3, $4, $5)`,
          [eventId, '16:30:00', '17:00:00', 'Q&A and Networking', 
           'Connect with fellow professionals and ask questions to our expert speakers.']
        );
        
        console.log(`  ✓ Added 3 agenda items`);
        
        // Add venue
        await query(
          `INSERT INTO venues (event_id, venue_name, full_address, latitude, longitude)
           VALUES ($1, $2, $3, $4, $5)`,
          [eventId, 'Silicon Valley Convention Center', '2401 Walsh Ave, Santa Clara, CA 95051', 37.3688, -121.9784]
        );
        
        console.log(`  ✓ Added venue information`);
        
        // Add sponsors
        await query(
          `INSERT INTO event_sponsors (event_id, sponsor_name, logo_url, sponsorship_level, website_url, display_order)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [eventId, 'MegaSecure Inc', 'https://placehold.co/120x60/3B82F6/FFFFFF/png?text=MegaSecure', 'platinum', 'https://megasecure.com', 1]
        );
        
        await query(
          `INSERT INTO event_sponsors (event_id, sponsor_name, logo_url, sponsorship_level, website_url, display_order)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [eventId, 'CloudOps Solutions', 'https://placehold.co/120x60/10B981/FFFFFF/png?text=CloudOps', 'gold', 'https://cloudops.com', 2]
        );
        
        console.log(`  ✓ Added 2 sponsors`);
      }
      
      // Add virtual links for AI Summit
      if (event.title === 'AI Governance & Ethics Summit') {
        await query(
          `INSERT INTO virtual_links (event_id, zoom_link, meeting_password, virtual_instructions)
           VALUES ($1, $2, $3, $4)`,
          [eventId, 'https://zoom.us/j/123456789?pwd=YWJjZGVmZ2hpams', 'SecureEvent2025', 
           'Please join the meeting 15 minutes early for a tech check. Download the Zoom app for the best experience.']
        );
        
        console.log(`  ✓ Added virtual meeting links`);
        
        // Add speaker
        await query(
          `INSERT INTO event_speakers (event_id, full_name, job_title, company, biography, photo_url, linkedin_profile, display_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [eventId, 'Dr. Sarah Chen', 'AI Ethics Lead', 'TechCorp', 'Leading expert in AI governance and ethical AI implementation with 20+ years in the field.', 
           'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face', 
           'https://www.linkedin.com/in/sarahchen', 1]
        );
        
        console.log(`  ✓ Added 1 speaker`);
      }
    }

    // Get count
    const countResult = await query('SELECT COUNT(*) FROM events');
    console.log(`\n✅ Successfully created ${countResult.rows[0].count} events!`);
    
    console.log('\nYou can now:');
    console.log('1. Start the backend server: npm run dev');
    console.log('2. Access events at: http://localhost:5000/api/events');
    console.log('3. View the frontend events page\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
