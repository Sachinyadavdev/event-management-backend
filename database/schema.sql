-- ========================
-- DATABASE: silicon_valley_db
-- Updated Schema with Improvements
-- ========================

-- Drop existing tables (for rebuild)
DROP TABLE IF EXISTS certificates, registrations, event_updates, event_agenda, event_sponsors, event_speakers, event_media, virtual_links, venues, notifications, support_tickets, events, roles, users CASCADE;

-- ========================
-- Roles Table
-- ========================
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO roles (role_name, description) VALUES 
    ('Admin', 'Full system access and management'),
    ('Member', 'Registered ISACA member'),
    ('Non-member', 'Non-ISACA member'),
    ('Student', 'Student member');

-- ========================
-- Users Table
-- ========================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(50),
    password VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    position VARCHAR(100),
    company VARCHAR(150),
    location VARCHAR(150),
    experience INTEGER,
    membership_details TEXT,
    certifications TEXT,
    cpe_score INTEGER DEFAULT 0,
    cpe_status VARCHAR(50),
    last_cpe_update TIMESTAMP,
    last_login TIMESTAMP,
    profile_picture TEXT,
    verified BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'pending', -- pending, active, inactive, suspended
    role_id INTEGER REFERENCES roles(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ========================
-- Events Table
-- ========================
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    event_title VARCHAR(200) NOT NULL,
    event_slug VARCHAR(250) UNIQUE,
    hosted_by VARCHAR(150),
    event_status VARCHAR(50) DEFAULT 'draft', -- draft, published, cancelled, completed
    event_category VARCHAR(100),
    event_date DATE,
    start_time TIME,
    end_time TIME,
    member_price DECIMAL(10,2),
    non_member_price DECIMAL(10,2),
    max_attendees INTEGER,
    current_attendees INTEGER DEFAULT 0,
    cpe_hours DECIMAL(4,2),
    event_tags TEXT[],
    event_description TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ========================
-- Venue Information
-- ========================
CREATE TABLE venues (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    venue_name VARCHAR(150),
    mode VARCHAR(50), -- Physical, Virtual, Hybrid
    full_address TEXT,
    google_maps_url TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ========================
-- Virtual Meeting Links
-- ========================
CREATE TABLE virtual_links (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    zoom_link TEXT,
    google_meet_link TEXT,
    ms_team_link TEXT,
    other_link TEXT,
    meeting_password VARCHAR(100),
    virtual_instructions TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ========================
-- Event Media / Banner
-- ========================
CREATE TABLE event_media (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    banner_image TEXT,
    banner_url TEXT,
    overlay_settings VARCHAR(100),
    overlay_opacity DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ========================
-- Speakers
-- ========================
CREATE TABLE event_speakers (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    job_title VARCHAR(150),
    company VARCHAR(150),
    photo_url TEXT,
    linkedin_profile TEXT,
    biography TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ========================
-- Sponsors
-- ========================
CREATE TABLE event_sponsors (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    sponsor_name VARCHAR(150) NOT NULL,
    logo_url TEXT,
    sponsorship_level VARCHAR(100), -- Platinum, Gold, Silver, Bronze
    custom_label VARCHAR(100),
    website_url TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ========================
-- Event Agenda
-- ========================
CREATE TABLE event_agenda (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    session_title VARCHAR(150) NOT NULL,
    session_description TEXT,
    start_time TIME,
    end_time TIME,
    session_speakers TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ========================
-- Event Updates
-- ========================
CREATE TABLE event_updates (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    update_title VARCHAR(150) NOT NULL,
    update_message TEXT,
    publication_timestamp TIMESTAMP DEFAULT NOW(),
    created_by INTEGER REFERENCES users(id)
);

-- ========================
-- Registrations
-- ========================
CREATE TABLE registrations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    registration_date TIMESTAMP DEFAULT NOW(),
    attended BOOLEAN DEFAULT FALSE,
    attendance_date TIMESTAMP,
    cp_score INTEGER DEFAULT 0,
    certificate_url TEXT,
    payment_status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed, refunded
    payment_amount DECIMAL(10,2),
    payment_date TIMESTAMP,
    payment_method VARCHAR(50),
    transaction_id VARCHAR(100),
    notes TEXT,
    UNIQUE(user_id, event_id) -- Prevent duplicate registrations
);

-- ========================
-- Certificates
-- ========================
CREATE TABLE certificates (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    certificate_url TEXT NOT NULL,
    certificate_number VARCHAR(100) UNIQUE,
    issued_date TIMESTAMP DEFAULT NOW(),
    valid_until DATE,
    cpe_credits DECIMAL(4,2)
);

-- ========================
-- Notifications
-- ========================
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50), -- email, system, sms
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ========================
-- Support Tickets
-- ========================
CREATE TABLE support_tickets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'Open', -- Open, In Progress, Resolved, Closed
    priority VARCHAR(50) DEFAULT 'Medium', -- Low, Medium, High, Urgent
    assigned_to INTEGER REFERENCES users(id),
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP
);

-- ========================
-- Performance Indexes
-- ========================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_status ON events(event_status);
CREATE INDEX idx_events_category ON events(event_category);
CREATE INDEX idx_registrations_user ON registrations(user_id);
CREATE INDEX idx_registrations_event ON registrations(event_id);
CREATE INDEX idx_registrations_payment_status ON registrations(payment_status);
CREATE INDEX idx_certificates_user ON certificates(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);

-- ========================
-- Sample Admin User (Password: Admin@123)
-- Note: This is a bcrypt hash - you should change this after first login
-- ========================
INSERT INTO users (full_name, email, password, role_id, status, verified) VALUES 
('System Admin', 'admin@isacasv.org', '$2b$10$nBdKScJHbhJfV9hJQD1xZOTlUb/i3doojdmUwUHAW7Oq5kJeh8iqq', 1, 'active', TRUE);

-- ========================
-- End of Schema
-- ========================
