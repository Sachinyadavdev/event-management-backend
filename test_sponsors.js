import { query } from './config/database.js';

async function testSponsors() {
  try {
    // First, check if event_sponsors table exists and what sponsors are there
    console.log('📊 Checking existing sponsors...');
    const existingSponsors = await query('SELECT * FROM event_sponsors ORDER BY event_id, display_order');
    console.log('Existing sponsors count:', existingSponsors.rows.length);
    
    existingSponsors.rows.forEach((sponsor, index) => {
      console.log(`Sponsor ${index + 1}:`, {
        id: sponsor.id,
        event_id: sponsor.event_id,
        sponsor_name: sponsor.sponsor_name,
        logo_url: sponsor.logo_url,
        level: sponsor.sponsorship_level
      });
    });
    
    // Get an event to add sponsors to
    console.log('\n📊 Getting events to add sponsors to...');
    const events = await query('SELECT id, event_title FROM events LIMIT 3');
    console.log('Available events:', events.rows.length);
    
    if (events.rows.length > 0) {
      const eventId = 31; // Use the event we tested
      console.log(`\n🧪 Adding test sponsors to event ID: ${eventId}`);
      
      // Delete existing sponsors for this event first
      await query('DELETE FROM event_sponsors WHERE event_id = $1', [eventId]);
      
      // Add test sponsors
      const testSponsors = [
        {
          sponsor_name: 'Microsoft',
          logo_url: 'https://logos-world.net/wp-content/uploads/2020/09/Microsoft-Logo.png',
          website_url: 'https://microsoft.com',
          sponsorship_level: 'platinum',
          custom_label: '',
          display_order: 1
        },
        {
          sponsor_name: 'Google',
          logo_url: 'https://logos-world.net/wp-content/uploads/2020/09/Google-Logo.png',
          website_url: 'https://google.com',
          sponsorship_level: 'gold',
          custom_label: '',
          display_order: 2
        },
        {
          sponsor_name: 'Amazon',
          logo_url: 'https://logos-world.net/wp-content/uploads/2020/04/Amazon-Logo.png',
          website_url: 'https://amazon.com',
          sponsorship_level: 'silver',
          custom_label: '',
          display_order: 3
        }
      ];
      
      // Insert test sponsors
      for (const sponsor of testSponsors) {
        await query(
          `INSERT INTO event_sponsors (event_id, sponsor_name, logo_url, website_url, sponsorship_level, custom_label, display_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            eventId,
            sponsor.sponsor_name,
            sponsor.logo_url,
            sponsor.website_url,
            sponsor.sponsorship_level,
            sponsor.custom_label,
            sponsor.display_order
          ]
        );
      }
      
      console.log('✅ Added test sponsors successfully!');
      
      // Verify the sponsors were added
      const newSponsors = await query('SELECT * FROM event_sponsors WHERE event_id = $1 ORDER BY display_order', [eventId]);
      console.log('\n✅ Verification - New sponsors count:', newSponsors.rows.length);
      newSponsors.rows.forEach((sponsor, index) => {
        console.log(`New Sponsor ${index + 1}:`, {
          sponsor_name: sponsor.sponsor_name,
          logo_url: sponsor.logo_url,
          level: sponsor.sponsorship_level
        });
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testSponsors();