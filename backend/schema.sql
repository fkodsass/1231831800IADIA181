-- Database schema for THW Club

CREATE DATABASE IF NOT EXISTS thw_club;
USE thw_club;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    uid INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(255),
    avatar_color VARCHAR(7),
    role ENUM('member', 'admin', 'Banned') DEFAULT 'member',
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    location VARCHAR(100),
    website VARCHAR(255),
    about TEXT,
    dob_day TINYINT,
    dob_month TINYINT,
    dob_year SMALLINT,
    show_dob_date BOOLEAN DEFAULT FALSE,
    show_dob_year BOOLEAN DEFAULT FALSE,
    receive_emails BOOLEAN DEFAULT TRUE,
    is_banned BOOLEAN DEFAULT FALSE,
    is_muted BOOLEAN DEFAULT FALSE,
    ban_reason TEXT,
    mute_reason TEXT,
    banned_until TIMESTAMP NULL,
    muted_until TIMESTAMP NULL
);

-- Invite codes table
CREATE TABLE IF NOT EXISTS invite_codes (
    code VARCHAR(50) PRIMARY KEY,
    uses_left INT DEFAULT 1 -- -1 for unlimited
);

-- Shouts table
CREATE TABLE IF NOT EXISTS shouts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uid INT NOT NULL,
    message TEXT NOT NULL,
    time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uid) REFERENCES users(uid) ON DELETE CASCADE
);

-- IP logs table
CREATE TABLE IF NOT EXISTS ip_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uid INT NOT NULL,
    ip_address VARCHAR(45) NOT NULL, -- IPv6 compatible
    count INT DEFAULT 1,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (uid) REFERENCES users(uid) ON DELETE CASCADE,
    UNIQUE KEY unique_uid_ip (uid, ip_address)
);

-- Insert some sample invite codes
INSERT INTO invite_codes (code, uses_left) VALUES ('welcome123', 10), ('beta-access', -1);

-- Insert some sample users (passwords in plain text)
INSERT INTO users (username, email, password_hash, role, avatar_url) VALUES
('admin', 'admin@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'https://ui-avatars.com/api/?name=admin&background=333333&color=cccccc'),
('user1', 'user1@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'member', 'https://ui-avatars.com/api/?name=user1&background=333333&color=cccccc'),
('user2', 'user2@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'member', 'https://ui-avatars.com/api/?name=user2&background=333333&color=cccccc');