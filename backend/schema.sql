CREATE DATABASE IF NOT EXISTS delight_music;
USE delight_music;

CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fullname VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    password VARCHAR(255),
    otp_code VARCHAR(10),
    otp_expires DATETIME,
    role ENUM('manager','producer','client') NOT NULL,
    client_type ENUM('artist','student','intern','event_planner','other') NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    client_id INT NOT NULL,
    producer_id INT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status ENUM('pending','in_progress','completed','cancelled') DEFAULT 'pending',
    progress_percentage INT DEFAULT 0,
    price DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deadline DATE,
    FOREIGN KEY (client_id) REFERENCES users(id),
    FOREIGN KEY (producer_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    message TEXT NOT NULL,
    type ENUM('lead','task_update','question','report','approval') DEFAULT 'lead',
    is_read BOOLEAN DEFAULT FALSE,
    file_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS work_orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_id INT NOT NULL,
    producer_id INT NOT NULL,
    requirements TEXT,
    draft_url VARCHAR(500),
    final_url VARCHAR(500),
    status ENUM('assigned','in_progress','review','completed') DEFAULT 'assigned',
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (producer_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS assets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_id INT NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_type ENUM('audio','video','document','image') NOT NULL,
    uploaded_by INT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS certificates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    certificate_url VARCHAR(500),
    issued_date DATE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS testimonials (
    id INT PRIMARY KEY AUTO_INCREMENT,
    client_name VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    rating INT DEFAULT 5,
    is_approved BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS partner_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fullname VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    message TEXT,
    status ENUM('pending','contacted','converted') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

