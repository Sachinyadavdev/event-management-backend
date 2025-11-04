import { query, getClient } from '../config/database.js';

// @desc    Get all events
// @route   GET /api/events
// @access  Public
export const getEvents = async (req, res, next) => {
  try {
    const { status, category, search, page = 1, limit = 10, upcoming = false } = req.query;
    
    let queryText = `
      SELECT e.*, 
        (SELECT COUNT(*) FROM registrations WHERE event_id = e.id) as registered_count,
        (SELECT json_agg(json_build_object('id', s.id, 'full_name', s.full_name, 'photo_url', s.photo_url))
         FROM event_speakers s WHERE s.event_id = e.id) as speakers
      FROM events e
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramIndex = 1;

    // Filter by status
    if (status) {
      queryText += ` AND e.event_status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    // Filter by category
    if (category) {
      queryText += ` AND e.event_category = $${paramIndex}`;
      queryParams.push(category);
      paramIndex++;
    }

    // Filter upcoming events
    if (upcoming === 'true') {
      queryText += ` AND e.event_date >= CURRENT_DATE`;
    }

    // Search by title or description
    if (search) {
      queryText += ` AND (e.event_title ILIKE $${paramIndex} OR e.event_description ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Get total count (simpler query without subqueries)
    const countQuery = `
      SELECT COUNT(*) 
      FROM events e
      WHERE 1=1
      ${status ? ` AND e.event_status = '${status}'` : ''}
      ${category ? ` AND e.event_category = '${category}'` : ''}
      ${upcoming === 'true' ? ` AND e.event_date >= CURRENT_DATE` : ''}
      ${search ? ` AND (e.event_title ILIKE '%${search}%' OR e.event_description ILIKE '%${search}%')` : ''}
    `;
    
    const countResult = await query(countQuery, []);
    const total = parseInt(countResult.rows[0].count);

    // Add pagination and ordering
    const offset = (page - 1) * limit;
    queryText += ` ORDER BY e.event_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await query(queryText, queryParams);

    // Format all events to ensure dates are returned correctly
    const formattedEvents = result.rows.map(event => ({
      ...event,
      // Ensure event_date is returned as YYYY-MM-DD string only (no timezone)
      event_date: event.event_date ? 
        (typeof event.event_date === 'string' ? 
          event.event_date.split('T')[0] : 
          event.event_date.toISOString().split('T')[0]) : 
        null
    }));

    console.log('🔍 BACKEND DEBUG - getEvents first event date:');
    if (result.rows.length > 0) {
      console.log('- Raw event_date from DB:', result.rows[0].event_date);
      console.log('- Formatted event_date:', formattedEvents[0].event_date);
    }

    res.status(200).json({
      success: true,
      count: formattedEvents.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: formattedEvents
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single event with full details
// @route   GET /api/events/:id (supports both ID and slug)
// @access  Public
export const getEvent = async (req, res, next) => {
  try {
    const identifier = req.params.id;
    
    // Check if identifier is a number (ID) or string (slug)
    const isNumeric = /^\d+$/.test(identifier);
    
    const eventResult = await query(
      isNumeric 
        ? 'SELECT * FROM events WHERE id = $1'
        : 'SELECT * FROM events WHERE event_slug = $1',
      [identifier]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const event = eventResult.rows[0];

    // Get venue information
    const venueResult = await query(
      'SELECT * FROM venues WHERE event_id = $1',
      [event.id]
    );

    // Get virtual links
    const virtualResult = await query(
      'SELECT * FROM virtual_links WHERE event_id = $1',
      [event.id]
    );

    // Get media/banner
    const mediaResult = await query(
      'SELECT * FROM event_media WHERE event_id = $1',
      [event.id]
    );

    // Get speakers
    const speakersResult = await query(
      'SELECT * FROM event_speakers WHERE event_id = $1 ORDER BY display_order',
      [event.id]
    );

    // Get sponsors
    const sponsorsResult = await query(
      'SELECT * FROM event_sponsors WHERE event_id = $1 ORDER BY display_order',
      [event.id]
    );

    // Get agenda
    const agendaResult = await query(
      'SELECT * FROM event_agenda WHERE event_id = $1 ORDER BY start_time',
      [event.id]
    );

    // Get registration count
    const regCountResult = await query(
      'SELECT COUNT(*) as count FROM registrations WHERE event_id = $1',
      [event.id]
    );

    // Format the event data to ensure dates are returned correctly
    const formattedEvent = {
      ...event,
      // NUCLEAR APPROACH: Force date to be YYYY-MM-DD string with no timezone
      event_date: event.event_date ? 
        (() => {
          const rawDate = event.event_date;
          if (typeof rawDate === 'string') {
            return rawDate.split('T')[0];
          } else if (rawDate instanceof Date) {
            // Manual date formatting to avoid timezone conversion
            const year = rawDate.getFullYear();
            const month = String(rawDate.getMonth() + 1).padStart(2, '0');
            const day = String(rawDate.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          }
          return rawDate;
        })() : 
        null
    };

    console.log('🔍 BACKEND DEBUG - getEvent formatting:');
    console.log('- Raw event_date from DB:', event.event_date);
    console.log('- Formatted event_date:', formattedEvent.event_date);
    console.log('- Type of raw date:', typeof event.event_date);

    res.status(200).json({
      success: true,
      data: {
        ...formattedEvent,
        venue: venueResult.rows[0] || null,
        virtual_links: virtualResult.rows[0] || null,
        media: mediaResult.rows[0] || null,
        speakers: speakersResult.rows,
        sponsors: sponsorsResult.rows,
        agenda: agendaResult.rows,
        registered_count: parseInt(regCountResult.rows[0].count)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create event
// @route   POST /api/events
// @access  Private/Admin
export const createEvent = async (req, res, next) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    const {
      event_title,
      hosted_by,
      event_status,
      event_category,
      event_date,
      start_time,
      end_time,
      member_price,
      non_member_price,
      max_attendees,
      cpe_hours,
      event_tags,
      event_description,
      venue,
      virtual_links,
      media,
      speakers,
      sponsors,
      agenda
    } = req.body;

    // Create event
    const eventResult = await client.query(
      `INSERT INTO events (
        event_title, hosted_by, event_status, event_category, event_date,
        start_time, end_time, member_price, non_member_price, max_attendees,
        cpe_hours, event_tags, event_description, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        event_title, hosted_by, event_status || 'draft', event_category, event_date,
        start_time, end_time, member_price, non_member_price, max_attendees,
        cpe_hours, event_tags, event_description, req.user.id
      ]
    );

    const event = eventResult.rows[0];

    // Add venue if provided
    if (venue) {
      await client.query(
        `INSERT INTO venues (event_id, venue_name, mode, full_address, google_maps_url, latitude, longitude)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [event.id, venue.venue_name, venue.mode, venue.full_address, venue.google_maps_url, venue.latitude, venue.longitude]
      );
    }

    // Add virtual links if provided
    if (virtual_links) {
      await client.query(
        `INSERT INTO virtual_links (event_id, zoom_link, google_meet_link, ms_team_link, other_link, meeting_password, virtual_instructions)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [event.id, virtual_links.zoom_link, virtual_links.google_meet_link, virtual_links.ms_team_link, 
         virtual_links.other_link, virtual_links.meeting_password, virtual_links.virtual_instructions]
      );
    }

    // Add media if provided
    if (media) {
      await client.query(
        `INSERT INTO event_media (event_id, banner_image, banner_url, overlay_settings, overlay_opacity)
         VALUES ($1, $2, $3, $4, $5)`,
        [event.id, media.banner_image, media.banner_url, media.overlay_settings, media.overlay_opacity]
      );
    }

    // Add speakers if provided
    if (speakers && speakers.length > 0) {
      for (let i = 0; i < speakers.length; i++) {
        const speaker = speakers[i];
        await client.query(
          `INSERT INTO event_speakers (event_id, full_name, job_title, company, photo_url, linkedin_profile, biography, display_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [event.id, speaker.full_name, speaker.job_title, speaker.company, speaker.photo_url, 
           speaker.linkedin_profile, speaker.biography, i]
        );
      }
    }

    // Add sponsors if provided
    if (sponsors && sponsors.length > 0) {
      for (let i = 0; i < sponsors.length; i++) {
        const sponsor = sponsors[i];
        await client.query(
          `INSERT INTO event_sponsors (event_id, sponsor_name, logo_url, sponsorship_level, custom_label, website_url, display_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [event.id, sponsor.sponsor_name, sponsor.logo_url, sponsor.sponsorship_level, 
           sponsor.custom_label, sponsor.website_url, i]
        );
      }
    }

    // Add agenda if provided
    if (agenda && agenda.length > 0) {
      for (let i = 0; i < agenda.length; i++) {
        const item = agenda[i];
        await client.query(
          `INSERT INTO event_agenda (event_id, session_title, session_description, start_time, end_time, session_speakers, display_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [event.id, item.session_title, item.session_description, item.start_time, item.end_time, 
           item.session_speakers, i]
        );
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private/Admin
export const updateEvent = async (req, res, next) => {
  try {
    const {
      event_title,
      hosted_by,
      event_status,
      event_category,
      event_date,
      start_time,
      end_time,
      member_price,
      non_member_price,
      max_attendees,
      cpe_hours,
      event_tags,
      event_description,
      // 🏢 VENUE DATA
      venue_name,
      full_address,
      mode,
      // 🎨 BANNER & MEDIA DATA
      banner_image,
      banner_overlay_color,
      banner_overlay_opacity
    } = req.body;

    console.log('Received update request for event:', req.params.id);
    console.log('Request body keys:', Object.keys(req.body));
    
    // Debug: Log incoming data
    console.log('Date update - event_date:', event_date, 'start_time:', start_time);
    console.log('Venue update - venue_name:', venue_name, 'full_address:', full_address, 'mode:', mode);
    console.log('🎨 Banner update - banner_image length:', banner_image?.length || 0, 
                'overlay_color:', banner_overlay_color, 'overlay_opacity:', banner_overlay_opacity);
    console.log('🎨 Banner data types:', {
      banner_image: typeof banner_image,
      banner_overlay_color: typeof banner_overlay_color,
      banner_overlay_opacity: typeof banner_overlay_opacity
    });

    // Detect if identifier is numeric ID or text slug
    const identifier = req.params.id;
    const isNumeric = /^\d+$/.test(identifier);

    // Generate new slug if title is being updated
    let event_slug = null;
    if (event_title) {
      event_slug = event_title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    // Build WHERE clause based on identifier type  
    const whereClause = isNumeric ? 'id = $15' : 'event_slug = $15';

    // Format event_tags as PostgreSQL array if it's provided
    const formattedTags = event_tags && Array.isArray(event_tags) ? event_tags : null;

    console.log('Formatted tags:', formattedTags);
    console.log('WHERE clause:', whereClause, 'with identifier:', identifier);

    // Log parameters being sent to database
    console.log('Updating event with date:', event_date, 'time:', start_time);

    // Use transaction to update both events and venues tables
    console.log('🔄 Starting transaction for event update...');
    const client = await getClient();
    let result = null;
    
    try {
      console.log('🔄 Beginning transaction...');
      await client.query('BEGIN');

      // Update the main events table
      const eventResult = await client.query(
        `UPDATE events 
         SET event_title = COALESCE($1, event_title),
             event_slug = COALESCE($2, event_slug),
             hosted_by = COALESCE($3, hosted_by),
             event_status = COALESCE($4, event_status),
             event_category = COALESCE($5, event_category),
             event_date = COALESCE($6::date, event_date),
             start_time = COALESCE($7::time, start_time),
             end_time = COALESCE($8::time, end_time),
             member_price = COALESCE($9, member_price),
             non_member_price = COALESCE($10, non_member_price),
             max_attendees = COALESCE($11, max_attendees),
             cpe_hours = COALESCE($12, cpe_hours),
             event_tags = COALESCE($13, event_tags),
             event_description = COALESCE($14, event_description),
             updated_at = NOW()
         WHERE ${whereClause}
         RETURNING *`,
        [event_title, event_slug, hosted_by, event_status, event_category, event_date, start_time, end_time,
         member_price, non_member_price, max_attendees, cpe_hours, formattedTags, event_description, identifier]
      );

      console.log('🔄 Event update result:', eventResult.rows.length, 'rows affected');

      if (eventResult.rows.length === 0) {
        console.log('❌ Event not found, rolling back...');
        await client.query('ROLLBACK');
        client.release();
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }

      const eventId = eventResult.rows[0].id;
      console.log('✅ Event updated successfully, ID:', eventId);

      // Update or insert venue data
      if (venue_name || full_address || mode) {
        console.log('🏢 Updating venue data for event ID:', eventId);
        
        // Check if venue record exists
        const existingVenue = await client.query(
          'SELECT id FROM venues WHERE event_id = $1',
          [eventId]
        );

        if (existingVenue.rows.length > 0) {
          // Update existing venue
          console.log('🔄 Updating existing venue record...');
          await client.query(
            `UPDATE venues 
             SET venue_name = COALESCE($1, venue_name),
                 full_address = COALESCE($2, full_address),
                 mode = COALESCE($3, mode)
             WHERE event_id = $4`,
            [venue_name, full_address, mode, eventId]
          );
          console.log('✅ Updated existing venue record');
        } else {
          // Insert new venue record
          console.log('🔄 Creating new venue record...');
          await client.query(
            `INSERT INTO venues (event_id, venue_name, full_address, mode)
             VALUES ($1, $2, $3, $4)`,
            [eventId, venue_name, full_address, mode]
          );
          console.log('✅ Created new venue record');
        }
      }

      // Update or insert banner/media data
      // Check if any banner/media data is provided (use !== undefined to allow 0 values and empty strings)
      const hasBannerData = (banner_image !== undefined && banner_image !== null) || 
                            (banner_overlay_color !== undefined && banner_overlay_color !== null) || 
                            (banner_overlay_opacity !== undefined && banner_overlay_opacity !== null);
      
      if (hasBannerData) {
        console.log('🎨 Updating banner/media data for event ID:', eventId);
        
        // Validate and convert opacity to proper decimal
        let validOpacity = banner_overlay_opacity;
        if (banner_overlay_opacity !== undefined && banner_overlay_opacity !== null) {
          validOpacity = parseFloat(banner_overlay_opacity);
          if (isNaN(validOpacity) || validOpacity < 0 || validOpacity > 1) {
            console.warn('🎨 Invalid opacity value:', banner_overlay_opacity, '- setting to 0.3');
            validOpacity = 0.3;
          }
        }
        
        console.log('🎨 Values - banner_image:', banner_image ? `${banner_image.substring(0, 50)}...` : 'null', 
                    'color:', banner_overlay_color, 'opacity:', validOpacity);
        
        // Check if media record exists
        const existingMedia = await client.query(
          'SELECT id FROM event_media WHERE event_id = $1',
          [eventId]
        );

        if (existingMedia.rows.length > 0) {
          // Update existing media record - only update fields that are provided
          console.log('🔄 Updating existing media record...');
          
          // Build dynamic update query based on which fields are provided
          const updates = [];
          const values = [];
          let paramCount = 1;
          
          if (banner_image !== undefined) {
            updates.push(`banner_image = $${paramCount++}`);
            values.push(banner_image);
          }
          if (banner_overlay_color !== undefined) {
            updates.push(`overlay_settings = $${paramCount++}`);
            values.push(banner_overlay_color);
          }
          if (banner_overlay_opacity !== undefined) {
            updates.push(`overlay_opacity = $${paramCount++}`);
            values.push(validOpacity);
          }
          
          if (updates.length > 0) {
            values.push(eventId);
            await client.query(
              `UPDATE event_media 
               SET ${updates.join(', ')}
               WHERE event_id = $${paramCount}`,
              values
            );
            console.log('✅ Updated existing media record with fields:', updates);
          }
        } else {
          // Insert new media record
          console.log('🔄 Creating new media record...');
          await client.query(
            `INSERT INTO event_media (event_id, banner_image, overlay_settings, overlay_opacity)
             VALUES ($1, $2, $3, $4)`,
            [eventId, banner_image || null, banner_overlay_color || null, validOpacity || null]
          );
          console.log('✅ Created new media record');
        }
      }

      await client.query('COMMIT');
      console.log('✅ Transaction committed successfully');
      result = eventResult; // Use the event result for the response

    } catch (error) {
      console.error('❌ Rolling back transaction due to error...');
      await client.query('ROLLBACK');
      console.error('❌ Transaction failed:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        detail: error.detail,
        stack: error.stack.split('\n').slice(0, 5)
      });
      throw error;
    } finally {
      client.release();
    }

    console.log('Update query executed, rows affected:', result.rows.length);

    if (result.rows.length === 0) {
      console.log('No event found with identifier:', identifier);
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    console.log('Event updated successfully:', result.rows[0].id);
    
    // Verify what was stored in database
    console.log('Stored event_date:', result.rows[0].event_date, typeof result.rows[0].event_date);

    // Fetch updated venue data for the response
    const venueResult = await query(
      'SELECT * FROM venues WHERE event_id = $1',
      [result.rows[0].id]
    );

    // Fetch updated media data for the response
    const mediaResult = await query(
      'SELECT * FROM event_media WHERE event_id = $1',
      [result.rows[0].id]
    );

    // Format the response to ensure dates are returned in the correct format
    const responseData = {
      ...result.rows[0],
      // Include venue data in response
      venue: venueResult.rows[0] || null,
      // Include media data in response
      media: mediaResult.rows[0] || null,
      // NUCLEAR APPROACH: Force date to be YYYY-MM-DD string with no timezone
      event_date: result.rows[0].event_date ? 
        (() => {
          const rawDate = result.rows[0].event_date;
          if (typeof rawDate === 'string') {
            return rawDate.split('T')[0];
          } else if (rawDate instanceof Date) {
            const year = rawDate.getFullYear();
            const month = String(rawDate.getMonth() + 1).padStart(2, '0');
            const day = String(rawDate.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          }
          return rawDate;
        })() : 
        null
    };

    console.log('🏢 VENUE DEBUG - Response data:');
    console.log('- Venue data in response:', responseData.venue);
    console.log('- venue_name:', responseData.venue?.venue_name);
    console.log('- full_address:', responseData.venue?.full_address);
    
    console.log('🎨 MEDIA DEBUG - Response data:');
    console.log('- Media data in response:', responseData.media);
    console.log('- banner_image:', responseData.media?.banner_image);
    console.log('- overlay_settings:', responseData.media?.overlay_settings);
    console.log('- overlay_opacity:', responseData.media?.overlay_opacity);

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: responseData
    });
  } catch (error) {
    console.error('❌ Error in updateEvent:', error);
    console.error('❌ Error stack:', error.stack);
    
    // Send proper error response
    res.status(500).json({
      success: false,
      message: 'Failed to update event',
      error: error.message
    });
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private/Admin
export const deleteEvent = async (req, res, next) => {
  try {
    const result = await query(
      'DELETE FROM events WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Test date handling - DEBUGGING ENDPOINT
// @route   POST /api/events/test-date
// @access  Private/Admin
export const testDateHandling = async (req, res, next) => {
  try {
    const { test_date } = req.body;
    
    console.log('🧪 DATE TEST ENDPOINT:');
    console.log('- Received test_date:', test_date);
    console.log('- Type:', typeof test_date);
    
    // Test inserting and retrieving a date
    const testResult = await query(
      `SELECT $1::date as input_date, 
              $1::date::text as date_as_text,
              NOW() as current_timestamp`,
      [test_date]
    );
    
    console.log('- PostgreSQL returned:', testResult.rows[0]);
    console.log('- input_date type:', typeof testResult.rows[0].input_date);
    console.log('- date_as_text:', testResult.rows[0].date_as_text);
    
    res.json({
      success: true,
      input: test_date,
      postgresql_result: testResult.rows[0],
      debug: {
        input_date_type: typeof testResult.rows[0].input_date,
        input_date_toString: testResult.rows[0].input_date?.toString(),
        date_as_text: testResult.rows[0].date_as_text
      }
    });
  } catch (error) {
    console.error('Date test error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get event statistics
// @route   GET /api/events/stats
// @access  Private/Admin
export const getEventStats = async (req, res, next) => {
  try {
    const result = await query(`
      SELECT 
        COUNT(*) as total_events,
        COUNT(CASE WHEN event_status = 'published' THEN 1 END) as published_events,
        COUNT(CASE WHEN event_status = 'draft' THEN 1 END) as draft_events,
        COUNT(CASE WHEN event_date >= CURRENT_DATE THEN 1 END) as upcoming_events,
        COUNT(CASE WHEN event_date < CURRENT_DATE THEN 1 END) as past_events,
        (SELECT COUNT(*) FROM registrations) as total_registrations
      FROM events
    `);

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};
