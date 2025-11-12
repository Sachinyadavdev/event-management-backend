import { query } from './config/database.js';

async function addEventUpdates() {
  try {
    const eventId = 31;
    
    console.log('📢 Adding test event updates for event', eventId);
    
    // Test event updates data
    const testUpdates = [
      {
        update_title: 'Schedule Update',
        update_message: 'Panel time changed to 10:30 AM to accommodate keynote speaker travel. Please plan accordingly.',
        created_by: 1 // Assuming admin user ID 1
      },
      {
        update_title: 'Parking Information',
        update_message: 'Free parking is available in the adjacent lot. Please allow extra time for security check-in.',
        created_by: 1
      },
      {
        update_title: 'Special Guest Speaker',
        update_message: 'We are excited to announce that John Doe, CISO at TechCorp, will be joining as a special guest speaker.',
        created_by: 1
      }
    ];
    
    // Delete existing updates for this event first
    await query('DELETE FROM event_updates WHERE event_id = $1', [eventId]);
    console.log('🔄 Cleared existing event updates');
    
    // Insert new test updates
    for (const update of testUpdates) {
      await query(
        `INSERT INTO event_updates (event_id, update_title, update_message, created_by)
         VALUES ($1, $2, $3, $4)`,
        [eventId, update.update_title, update.update_message, update.created_by]
      );
    }
    
    console.log('✅ Added', testUpdates.length, 'event updates successfully!');
    
    // Verify the updates were added
    const newUpdates = await query(
      'SELECT * FROM event_updates WHERE event_id = $1 ORDER BY publication_timestamp DESC', 
      [eventId]
    );
    
    console.log('\n✅ Verification - New updates count:', newUpdates.rows.length);
    newUpdates.rows.forEach((update, index) => {
      console.log(`Update ${index + 1}:`, {
        id: update.id,
        title: update.update_title,
        message: update.update_message.substring(0, 50) + '...',
        timestamp: update.publication_timestamp
      });
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding event updates:', error.message);
    process.exit(1);
  }
}

addEventUpdates();