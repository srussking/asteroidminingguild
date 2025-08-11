
-- ------
-- BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
-- AsteroidMiningGuild implementation : © <Your name here> <Your email address here>
-- 
-- This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
-- See http://en.boardgamearena.com/#!doc/Studio for more information.
-- -----

-- dbmodel.sql

-- This is the file where you are describing the database schema of your game
-- Basically, you just have to export from PhpMyAdmin your table structure and copy/paste
-- this export here.
-- Note that the database itself and the standard tables ("global", "stats", "gamelog" and "player") are
-- already created and must not be created here

-- Note: The database schema is created from this file when the game starts. If you modify this file,
--       you have to restart a game to see your changes in database.

-- Example 1: create a standard "card" table to be used with the "Deck" tools (see example game "hearts"):

-- CREATE TABLE IF NOT EXISTS `card` (
--   `card_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
--   `card_type` varchar(16) NOT NULL,
--   `card_type_arg` int(11) NOT NULL,
--   `card_location` varchar(16) NOT NULL,
--   `card_location_arg` int(11) NOT NULL,
--   PRIMARY KEY (`card_id`)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;


-- Example 2: add a custom field to the standard "player" table
-- ALTER TABLE `player` ADD `player_my_custom_field` INT UNSIGNED NOT NULL DEFAULT '0';

CREATE TABLE IF NOT EXISTS `card` (
  `card_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `card_type` varchar(16) NOT NULL,
  `card_type_arg` int(11) NOT NULL,
  `card_location` varchar(16) NOT NULL,
  `card_location_arg` int(11) NOT NULL,
  `card_order` int(11) DEFAULT 0,
  PRIMARY KEY (`card_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

CREATE TABLE IF NOT EXISTS `market` (
  `market_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `lead` TINYINT UNSIGNED NOT NULL,
  `copper` TINYINT UNSIGNED NOT NULL,
  `iron` TINYINT UNSIGNED NOT NULL,
  `gold` TINYINT UNSIGNED NOT NULL,
  PRIMARY KEY (`market_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

CREATE TABLE IF NOT EXISTS `asteroid` (
  `asteroid_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `location` VARCHAR(20) NOT NULL DEFAULT 'auction',
  `location_arg` INT DEFAULT NULL,                 
  PRIMARY KEY (`asteroid_id`)
);

CREATE TABLE IF NOT EXISTS `asteroid_bid` (
  `asteroid_id` INT UNSIGNED NOT NULL,
  `player_id` INT UNSIGNED NOT NULL,
  `bid_amount` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`asteroid_id`, `player_id`)
);

ALTER TABLE `player` ADD `money` SMALLINT UNSIGNED NOT NULL DEFAULT '50';
ALTER TABLE `player` ADD COLUMN knowledge JSON;
ALTER TABLE `player` ADD `passed` TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE `player` ADD `next_first` TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE `player` ADD `outbid` TINYINT(1) NOT NULL DEFAULT 0;

CREATE INDEX idx_location_order ON card(card_location, card_location_arg, card_order);
