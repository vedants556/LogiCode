-- LogiCode Database Setup Script
-- Run this in your Railway MySQL database

-- Create the main database (if not using 'railway' database)
-- CREATE DATABASE IF NOT EXISTS codesync;
-- USE codesync;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Problems table
CREATE TABLE IF NOT EXISTS problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    difficulty ENUM('Easy', 'Medium', 'Hard') NOT NULL,
    test_cases JSON,
    expected_output TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Submissions table
CREATE TABLE IF NOT EXISTS submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    problem_id INT NOT NULL,
    code TEXT NOT NULL,
    language VARCHAR(50) NOT NULL,
    status ENUM('Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Runtime Error', 'Compilation Error') NOT NULL,
    execution_time INT,
    memory_used INT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE
);

-- Leaderboard table
CREATE TABLE IF NOT EXISTS leaderboard (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    score INT DEFAULT 0,
    problems_solved INT DEFAULT 0,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user (user_id)
);

-- Insert some sample problems
INSERT INTO problems (title, description, difficulty, test_cases, expected_output) VALUES
('Hello World', 'Write a program that prints "Hello, World!" to the console.', 'Easy', 
 '{"test_cases": [{"input": "", "output": "Hello, World!"}]}', 'Hello, World!'),

('Sum of Two Numbers', 'Given two integers a and b, return their sum.', 'Easy',
 '{"test_cases": [{"input": "5 3", "output": "8"}, {"input": "10 20", "output": "30"}]}', '8'),

('Palindrome Check', 'Check if a given string is a palindrome.', 'Medium',
 '{"test_cases": [{"input": "racecar", "output": "true"}, {"input": "hello", "output": "false"}]}', 'true');

-- Create indexes for better performance
CREATE INDEX idx_submissions_user_id ON submissions(user_id);
CREATE INDEX idx_submissions_problem_id ON submissions(problem_id);
CREATE INDEX idx_submissions_submitted_at ON submissions(submitted_at);
CREATE INDEX idx_leaderboard_score ON leaderboard(score DESC);
