import { query } from '../config/database.js';

async function addEventSlugColumn() {
  try {
    console.log('🔄 Checking if event_slug column exists...');
    
    // Check if event_slug column exists
    const columnCheck = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'events' AND column_name = 'event_slug'
    `);
    
    if (columnCheck.rows.length === 0) {
      console.log('⚠️  event_slug column not found, adding it...');
      
      // Add the event_slug column
      await query(`
        ALTER TABLE events 
        ADD COLUMN event_slug VARCHAR(250) UNIQUE
      `);
      
      console.log('✅ Added event_slug column');
      
      // Generate slugs for existing events
      const events = await query('SELECT id, event_title FROM events WHERE event_slug IS NULL');
      
      console.log(`🔄 Generating slugs for ${events.rows.length} existing events...`);
      
      for (const event of events.rows) {
        const slug = event.event_title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        
        await query(
          'UPDATE events SET event_slug = $1 WHERE id = $2',
          [slug, event.id]
        );
      }
      
      console.log('✅ Generated slugs for all existing events');
    } else {
      console.log('✅ event_slug column already exists');
    }
    
    console.log('✅ Migration completed successfully');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addEventSlugColumn()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default addEventSlugColumn;