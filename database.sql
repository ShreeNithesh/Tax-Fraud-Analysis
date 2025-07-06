-- Drop the Database if it Exists (Optional)
-- DROP DATABASE IF EXISTS fraud_detection_db;

-- Create Database
CREATE DATABASE IF NOT EXISTS fraud_detection_db;
USE fraud_detection_db;

-- Drop Existing Tables (in reverse order due to foreign key dependencies)
DROP TABLE IF EXISTS Fraud_Flags;
DROP TABLE IF EXISTS Transaction;
DROP TABLE IF EXISTS Taxpayer;

-- Create Tables
CREATE TABLE Taxpayer (
    taxpayer_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone_no VARCHAR(20),
    address VARCHAR(255),
    city VARCHAR(50),
    state VARCHAR(50),
    country VARCHAR(50),
    dob DATE,
    occupation VARCHAR(50),
    marital_stat VARCHAR(20),
    employment_stat VARCHAR(20),
    ssn VARCHAR(20) UNIQUE NOT NULL,
    salary DECIMAL(10, 2) NOT NULL -- Added salary column
);

CREATE TABLE Transaction (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    taxpayer_id INT,
    amount DECIMAL(10, 2),
    transaction_date DATE,
    description VARCHAR(255),
    FOREIGN KEY (taxpayer_id) REFERENCES Taxpayer(taxpayer_id)
);

CREATE TABLE Fraud_Flags (
    flag_id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT,
    flag_type VARCHAR(50),
    flag_date DATE,
    description VARCHAR(255),
    FOREIGN KEY (transaction_id) REFERENCES Transaction(transaction_id)
);

-- Drop Existing Stored Procedures
DROP PROCEDURE IF EXISTS insert_taxpayer;
DROP PROCEDURE IF EXISTS generate_taxpayers;
DROP PROCEDURE IF EXISTS get_high_risk_taxpayers;
DROP PROCEDURE IF EXISTS get_fraud_trends;

-- Stored Procedure to Insert Taxpayer
DELIMITER //
CREATE PROCEDURE insert_taxpayer(
    IN p_first_name VARCHAR(50),
    IN p_last_name VARCHAR(50),
    IN p_email VARCHAR(100),
    IN p_phone_no VARCHAR(20),
    IN p_address VARCHAR(255),
    IN p_city VARCHAR(50),
    IN p_state VARCHAR(50),
    IN p_country VARCHAR(50),
    IN p_dob DATE,
    IN p_occupation VARCHAR(50),
    IN p_marital_stat VARCHAR(20),
    IN p_employment_stat VARCHAR(20),
    IN p_ssn VARCHAR(20),
    IN p_salary DECIMAL(10, 2) -- Added salary parameter
)
BEGIN
    INSERT INTO Taxpayer (
        first_name, last_name, email, phone_no, address, city, state, country,
        dob, occupation, marital_stat, employment_stat, ssn, salary
    ) VALUES (
        p_first_name, p_last_name, p_email, p_phone_no, p_address, p_city, p_state, p_country,
        p_dob, p_occupation, p_marital_stat, p_employment_stat, p_ssn, p_salary
    );
END //
DELIMITER ;

-- Stored Procedure to Generate Random Taxpayers with Random Cities
DELIMITER //
CREATE PROCEDURE generate_taxpayers()
BEGIN
    DECLARE i INT DEFAULT 1;
    DECLARE random_city VARCHAR(50);
    DECLARE city_array JSON;
    DECLARE city_count INT;
    DECLARE first_names JSON;
    DECLARE last_names JSON;
    DECLARE first_name_count INT;
    DECLARE last_name_count INT;
    DECLARE random_first_name VARCHAR(50);
    DECLARE random_last_name VARCHAR(50);
    DECLARE random_email VARCHAR(100);
    DECLARE random_phone VARCHAR(20);

    -- Define arrays for realistic first names and last names
    SET first_names = JSON_ARRAY(
        'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
        'William', 'Elizabeth', 'David', 'Susan', 'Joseph', 'Margaret', 'Charles', 'Karen',
        'Thomas', 'Nancy', 'Christopher', 'Lisa'
    );
    SET last_names = JSON_ARRAY(
        'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
        'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
        'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'
    );
    SET first_name_count = JSON_LENGTH(first_names);
    SET last_name_count = JSON_LENGTH(last_names);

    -- Define cities array
    SET city_array = JSON_ARRAY(
        'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose',
        'Tokyo', 'London', 'Paris', 'Sydney', 'Toronto', 'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata'
    );
    SET city_count = JSON_LENGTH(city_array);

    WHILE i <= 1000 DO
        -- Select random first name and last name
        SET random_first_name = JSON_UNQUOTE(JSON_EXTRACT(first_names, CONCAT('$[', FLOOR(RAND() * first_name_count), ']')));
        SET random_last_name = JSON_UNQUOTE(JSON_EXTRACT(last_names, CONCAT('$[', FLOOR(RAND() * last_name_count), ']')));

        -- Generate realistic email
        SET random_email = CONCAT(LOWER(random_first_name), '.', LOWER(random_last_name), i, '@gmail.com');

        -- Generate realistic phone number (format: +1-XXX-XXX-XXXX)
        SET random_phone = CONCAT('+1-', LPAD(FLOOR(RAND() * 1000), 3, '0'), '-', LPAD(FLOOR(RAND() * 1000), 3, '0'), '-', LPAD(FLOOR(RAND() * 10000), 4, '0'));

        -- Select random city
        SET random_city = JSON_UNQUOTE(JSON_EXTRACT(city_array, CONCAT('$[', FLOOR(RAND() * city_count), ']')));

        INSERT INTO Taxpayer (
            first_name, last_name, email, phone_no, address, city, state, country,
            dob, occupation, marital_stat, employment_stat, ssn, salary
        ) VALUES (
            random_first_name,
            random_last_name,
            random_email,
            random_phone,
            CONCAT(i, ' Main St'),
            random_city,
            'State',
            'Country',
            DATE_SUB(CURDATE(), INTERVAL (20 + FLOOR(RAND() * 40)) YEAR),
            CASE FLOOR(RAND() * 3)
                WHEN 0 THEN 'Engineer'
                WHEN 1 THEN 'Teacher'
                ELSE 'Doctor'
            END,
            CASE FLOOR(RAND() * 3)
                WHEN 0 THEN 'Single'
                WHEN 1 THEN 'Married'
                ELSE 'Divorced'
            END,
            CASE FLOOR(RAND() * 3)
                WHEN 0 THEN 'Employed'
                WHEN 1 THEN 'Unemployed'
                ELSE 'Self-Employed'
            END,
            CONCAT(LPAD(FLOOR(RAND() * 1000), 3, '0'), '-', LPAD(FLOOR(RAND() * 100), 2, '0'), '-', LPAD(FLOOR(RAND() * 10000), 4, '0')),
            ROUND(RAND() * 100000 + 30000, 2) -- Random salary between 30,000 and 130,000
        );
        SET i = i + 1;
    END WHILE;

    -- Generate Transactions
    SET i = 1;
    WHILE i <= 2000 DO
        INSERT INTO Transaction (taxpayer_id, amount, transaction_date, description)
        VALUES (
            FLOOR(RAND() * 1000) + 1,
            ROUND(RAND() * 10000, 2),
            DATE_SUB(CURDATE(), INTERVAL FLOOR(RAND() * 365) DAY),
            CONCAT('Transaction ', i)
        );
        SET i = i + 1;
    END WHILE;

    -- Generate Fraud Flags
    -- Generate Fraud Flags
    SET i = 1;
    WHILE i <= 500 DO
        INSERT INTO Fraud_Flags (transaction_id, flag_type, flag_date, description)
        VALUES (
            FLOOR(RAND() * 2000) + 1,
            CASE FLOOR(RAND() * 3)
                WHEN 0 THEN 'High Amount'
                WHEN 1 THEN 'Suspicious Pattern'
                ELSE 'Unverified Source'
            END,
            DATE_SUB(CURDATE(), INTERVAL FLOOR(RAND() * 180) DAY), -- Last 6 months
            CONCAT('Fraud Flag ', i)
        );
        SET i = i + 1;
    END WHILE;
END //
DELIMITER ;

-- Stored Procedure to Get High-Risk Taxpayers
DELIMITER //
CREATE PROCEDURE get_high_risk_taxpayers()
BEGIN
    SELECT DISTINCT t.*
    FROM Taxpayer t
    JOIN Transaction tr ON t.taxpayer_id = tr.taxpayer_id
    JOIN Fraud_Flags f ON tr.transaction_id = f.transaction_id
    ORDER BY t.taxpayer_id
    LIMIT 1000;
END //
DELIMITER ;

-- Stored Procedure to Get Fraud Trends
DELIMITER //
CREATE PROCEDURE get_fraud_trends()
BEGIN
    SELECT 
        DATE_FORMAT(f.flag_date, '%Y-%m') AS month,
        COUNT(*) AS fraud_count
    FROM Fraud_Flags f
    GROUP BY DATE_FORMAT(f.flag_date, '%Y-%m')
    ORDER BY month;
END //
DELIMITER ;

-- Call the Procedure to Generate Data
CALL generate_taxpayers();