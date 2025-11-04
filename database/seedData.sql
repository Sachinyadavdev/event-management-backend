-- ========================
-- SEED DATA FOR TESTING
-- Silicon Valley ISACA Database
-- ========================

-- Insert sample events
INSERT INTO events (
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
    current_attendees, 
    cpe_hours, 
    event_tags, 
    event_description,
    created_by
) VALUES 
-- UPCOMING EVENTS
(
    'Cybersecurity Best Practices Workshop',
    'ISACA Silicon Valley',
    'published',
    'Workshop',
    '2025-11-15',
    '14:00',
    '17:00',
    0.00,
    50.00,
    80,
    35,
    3.0,
    ARRAY['Cybersecurity', 'Best Practices', 'Workshop'],
    'Learn the latest cybersecurity best practices from industry experts. This comprehensive workshop covers threat detection, incident response, and security frameworks.',
    1
),
(
    'Risk Management in Digital Age',
    'ISACA Silicon Valley',
    'published',
    'Webinar',
    '2025-11-22',
    '18:00',
    '20:00',
    0.00,
    25.00,
    200,
    168,
    2.0,
    ARRAY['Risk Management', 'Digital Transformation'],
    'Explore modern risk management strategies and frameworks for digital transformation initiatives.',
    1
),
(
    'ISACA Certification Prep Session',
    'ISACA Silicon Valley',
    'published',
    'Training',
    '2025-12-05',
    '10:00',
    '16:00',
    50.00,
    150.00,
    40,
    20,
    6.0,
    ARRAY['Certification', 'CISA', 'CISM', 'Training'],
    'Intensive preparation session for ISACA certifications including CISA, CISM, CGEIT, and CRISC.',
    1
),
(
    'AI Governance & Ethics Summit',
    'ISACA Silicon Valley',
    'published',
    'Summit',
    '2025-12-12',
    '09:00',
    '17:00',
    75.00,
    200.00,
    150,
    89,
    8.0,
    ARRAY['AI', 'Governance', 'Ethics', 'Summit'],
    'Full-day summit on AI governance, ethics, and risk management in enterprise environments.',
    1
),
(
    'Cloud Security Fundamentals',
    'ISACA Silicon Valley',
    'published',
    'Webinar',
    '2025-12-18',
    '19:00',
    '20:30',
    0.00,
    30.00,
    300,
    245,
    1.5,
    ARRAY['Cloud Security', 'Fundamentals'],
    'Essential cloud security concepts for IT professionals transitioning to cloud environments.',
    1
),
(
    'Data Privacy & GDPR Compliance',
    'ISACA Silicon Valley',
    'published',
    'Workshop',
    '2025-12-25',
    '14:00',
    '18:00',
    40.00,
    120.00,
    60,
    28,
    4.0,
    ARRAY['Data Privacy', 'GDPR', 'Compliance'],
    'Comprehensive workshop on data privacy regulations and GDPR compliance strategies.',
    1
),
(
    'Blockchain & Cryptocurrency Security',
    'ISACA Silicon Valley',
    'published',
    'Webinar',
    '2026-01-03',
    '18:30',
    '20:30',
    0.00,
    35.00,
    250,
    156,
    2.0,
    ARRAY['Blockchain', 'Cryptocurrency', 'Security'],
    'Understanding security challenges and opportunities in blockchain and cryptocurrency ecosystems.',
    1
),
(
    'IT Audit Essentials Workshop',
    'ISACA Silicon Valley',
    'published',
    'Workshop',
    '2026-01-10',
    '09:00',
    '16:00',
    60.00,
    180.00,
    45,
    31,
    7.0,
    ARRAY['IT Audit', 'Compliance', 'Workshop'],
    'Essential skills and methodologies for effective IT auditing in modern organizations.',
    1
),
(
    'IoT Security & Risk Assessment',
    'ISACA Silicon Valley',
    'published',
    'Workshop',
    '2026-01-17',
    '15:00',
    '18:00',
    45.00,
    135.00,
    35,
    19,
    3.0,
    ARRAY['IoT', 'Security', 'Risk Assessment'],
    'Hands-on workshop on IoT security challenges and risk assessment methodologies.',
    1
),
(
    'Monthly Networking Mixer',
    'ISACA Silicon Valley',
    'published',
    'Networking',
    '2026-01-24',
    '18:00',
    '21:00',
    15.00,
    40.00,
    120,
    67,
    0.0,
    ARRAY['Networking', 'Social'],
    'Monthly networking event for ISACA members and IT professionals in Silicon Valley.',
    1
),

-- ONGOING EVENT
(
    'Annual ISACA Conference 2025',
    'ISACA Global',
    'published',
    'Summit',
    '2025-10-26',
    '09:00',
    '17:00',
    200.00,
    400.00,
    500,
    450,
    8.0,
    ARRAY['Conference', 'Networking', 'Professional Development'],
    'Three-day annual conference featuring keynote speakers, workshops, and networking opportunities for IT professionals.',
    1
),

-- COMPLETED EVENTS
(
    'Cloud Security Best Practices',
    'ISACA Silicon Valley',
    'completed',
    'Webinar',
    '2025-09-15',
    '19:00',
    '21:00',
    0.00,
    30.00,
    250,
    230,
    2.0,
    ARRAY['Cloud Security', 'Best Practices', 'Virtual'],
    'Comprehensive overview of cloud security best practices and implementation strategies.',
    1
),
(
    'Data Governance Workshop',
    'ISACA Silicon Valley',
    'completed',
    'Workshop',
    '2025-08-20',
    '14:00',
    '18:00',
    40.00,
    100.00,
    60,
    55,
    4.0,
    ARRAY['Data Governance', 'Workshop', 'Compliance'],
    'Hands-on workshop covering data governance frameworks and implementation strategies.',
    1
);

-- Insert venues for some events
INSERT INTO venues (event_id, venue_name, mode, full_address, google_maps_url, latitude, longitude)
SELECT id, 
    CASE 
        WHEN event_title LIKE '%Virtual%' OR event_title LIKE '%Webinar%' THEN 'Virtual Platform'
        WHEN event_title LIKE '%Workshop%' AND event_date > '2025-11-01' THEN 'Silicon Valley Conference Center'
        WHEN event_title LIKE '%Summit%' THEN 'San Francisco Marriott'
        WHEN event_title LIKE '%Networking%' THEN 'Silicon Valley Tech Hub'
        ELSE 'TechHub San Jose'
    END,
    CASE 
        WHEN event_title LIKE '%Virtual%' OR event_title LIKE '%Webinar%' THEN 'Virtual'
        ELSE 'Physical'
    END,
    CASE 
        WHEN event_title LIKE '%Virtual%' OR event_title LIKE '%Webinar%' THEN NULL
        WHEN event_title LIKE '%Workshop%' AND event_date > '2025-11-01' THEN '123 Tech Drive, San Jose, CA 95110'
        WHEN event_title LIKE '%Summit%' THEN '55 4th St, San Francisco, CA 94103'
        WHEN event_title LIKE '%Networking%' THEN '100 Innovation Drive, Mountain View, CA 94043'
        ELSE '456 Innovation Blvd, San Jose, CA 95134'
    END,
    NULL,
    NULL,
    NULL
FROM events;

-- Insert virtual links for webinars
INSERT INTO virtual_links (event_id, zoom_link, google_meet_link)
SELECT id,
    'https://zoom.us/j/' || FLOOR(RANDOM() * 1000000000 + 1000000000)::TEXT,
    'https://meet.google.com/' || substring(md5(random()::text), 1, 10)
FROM events
WHERE event_category = 'Webinar';

-- Insert sample speakers
INSERT INTO event_speakers (event_id, full_name, title, bio, photo_url, linkedin_url, email)
SELECT id,
    CASE (RANDOM() * 5)::INT
        WHEN 0 THEN 'Dr. Sarah Chen'
        WHEN 1 THEN 'Michael Rodriguez'
        WHEN 2 THEN 'Jennifer Kim'
        WHEN 3 THEN 'Dr. Alex Thompson'
        WHEN 4 THEN 'David Park'
        ELSE 'Lisa Anderson'
    END,
    CASE (RANDOM() * 5)::INT
        WHEN 0 THEN 'CISO at TechCorp'
        WHEN 1 THEN 'Risk Management Director'
        WHEN 2 THEN 'ISACA Certified Trainer'
        WHEN 3 THEN 'AI Ethics Researcher'
        WHEN 4 THEN 'Cloud Security Architect'
        ELSE 'Privacy Compliance Officer'
    END,
    'Industry expert with over 15 years of experience in cybersecurity and risk management.',
    'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=400&h=400&fit=crop',
    NULL,
    NULL
FROM events
WHERE event_status = 'published'
LIMIT 10;

-- Insert sample sponsors
INSERT INTO event_sponsors (event_id, sponsor_name, sponsor_logo, sponsor_url, sponsorship_tier)
SELECT id,
    CASE (RANDOM() * 4)::INT
        WHEN 0 THEN 'CyberSec Corp'
        WHEN 1 THEN 'SecureTech'
        WHEN 2 THEN 'Risk Solutions'
        ELSE 'Tech Global'
    END,
    'https://placehold.co/200x100/3B82F6/FFFFFF/png?text=Sponsor',
    'https://example.com',
    CASE (RANDOM() * 2)::INT
        WHEN 0 THEN 'Gold'
        ELSE 'Silver'
    END
FROM events
WHERE event_status = 'published'
LIMIT 8;

COMMIT;

-- Display summary
SELECT 
    'Events created' as item, 
    COUNT(*) as count 
FROM events
UNION ALL
SELECT 
    'Venues created' as item, 
    COUNT(*) as count 
FROM venues
UNION ALL
SELECT 
    'Virtual links created' as item, 
    COUNT(*) as count 
FROM virtual_links
UNION ALL
SELECT 
    'Speakers added' as item, 
    COUNT(*) as count 
FROM event_speakers
UNION ALL
SELECT 
    'Sponsors added' as item, 
    COUNT(*) as count 
FROM event_sponsors;
