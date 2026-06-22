-- MySQL Workbench Compatible Database Schema
-- Project: Premium Jewel Billing Software
-- Theme: Gold & Deep Red Showroom UI

CREATE DATABASE IF NOT EXISTS `gold_billing`;
USE `gold_billing`;

-- -----------------------------------------------------
-- Table `users`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` VARCHAR(20) NOT NULL COMMENT 'Admin, Staff',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_users_username` (`username` ASC)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

-- -----------------------------------------------------
-- Table `products` (Inventory)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE COMMENT 'SKU/Barcode',
  `name` VARCHAR(150) NOT NULL,
  `category` VARCHAR(50) NOT NULL COMMENT 'Gold, Silver, Diamond, Other',
  `purity` VARCHAR(50) NOT NULL COMMENT '22K, 18K, 24K, 925, etc.',
  `weight` DECIMAL(10, 3) NOT NULL COMMENT 'Weight in grams',
  `count` INT NOT NULL DEFAULT 0 COMMENT 'Quantity in stock',
  `price_per_gram` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT 'Metal price per gram',
  `making_charge_per_gram` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `wastage_percentage` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_products_code` (`code` ASC),
  INDEX `idx_products_category` (`category` ASC)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

-- -----------------------------------------------------
-- Table `customers`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `customers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(20) NOT NULL UNIQUE,
  `email` VARCHAR(100) NULL,
  `address` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_customers_phone` (`phone` ASC),
  INDEX `idx_customers_name` (`name` ASC)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

-- -----------------------------------------------------
-- Table `invoices`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `invoices` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `invoice_number` VARCHAR(50) NOT NULL UNIQUE,
  `customer_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `invoice_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `subtotal` DECIMAL(12, 2) NOT NULL COMMENT 'Sum of item amounts before GST',
  `making_charges_total` DECIMAL(12, 2) NOT NULL,
  `gst_amount` DECIMAL(12, 2) NOT NULL COMMENT 'Total 3% GST (1.5% SGST + 1.5% CGST)',
  `discount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `total_amount` DECIMAL(12, 2) NOT NULL COMMENT 'Final net amount payable',
  `payment_status` VARCHAR(20) NOT NULL COMMENT 'Paid, Partial, Unpaid',
  `payment_mode` VARCHAR(50) NOT NULL COMMENT 'Cash, Card, UPI, Bank Transfer',
  `branch` VARCHAR(100) NOT NULL DEFAULT 'Main Branch',
  CONSTRAINT `fk_invoices_customer`
    FOREIGN KEY (`customer_id`)
    REFERENCES `customers` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_invoices_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE,
  INDEX `idx_invoices_number` (`invoice_number` ASC),
  INDEX `idx_invoices_date` (`invoice_date` ASC)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

-- -----------------------------------------------------
-- Table `invoice_items`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `invoice_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `invoice_id` INT NOT NULL,
  `product_id` INT NULL,
  `item_name` VARCHAR(150) NOT NULL,
  `category` VARCHAR(50) NOT NULL,
  `weight` DECIMAL(10, 3) NOT NULL,
  `purity` VARCHAR(50) NOT NULL,
  `metal_rate` DECIMAL(12, 2) NOT NULL,
  `making_charge` DECIMAL(12, 2) NOT NULL,
  `wastage_percent` DECIMAL(5, 2) NOT NULL,
  `gst_rate` DECIMAL(5, 2) NOT NULL DEFAULT 3.00,
  `amount` DECIMAL(12, 2) NOT NULL,
  CONSTRAINT `fk_items_invoice`
    FOREIGN KEY (`invoice_id`)
    REFERENCES `invoices` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_items_product`
    FOREIGN KEY (`product_id`)
    REFERENCES `products` (`id`)
    ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

-- -----------------------------------------------------
-- Table `payments`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `invoice_id` INT NOT NULL,
  `payment_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `amount` DECIMAL(12, 2) NOT NULL,
  `payment_mode` VARCHAR(50) NOT NULL,
  `reference_number` VARCHAR(100) NULL,
  CONSTRAINT `fk_payments_invoice`
    FOREIGN KEY (`invoice_id`)
    REFERENCES `invoices` (`id`)
    ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;
