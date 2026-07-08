-- MySQL dump 10.13  Distrib 9.4.0, for macos14.7 (x86_64)
--
-- Host: localhost    Database: logistics_db
-- ------------------------------------------------------
-- Server version	9.4.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `app_settings`
--

DROP TABLE IF EXISTS `app_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `app_settings` (
  `setting_key` varchar(50) NOT NULL,
  `setting_value` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `app_settings`
--

LOCK TABLES `app_settings` WRITE;
/*!40000 ALTER TABLE `app_settings` DISABLE KEYS */;
INSERT INTO `app_settings` VALUES ('block_demands','false');
/*!40000 ALTER TABLE `app_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `category_demands`
--

DROP TABLE IF EXISTS `category_demands`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `category_demands` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category_user_id` int NOT NULL,
  `imported_by` int NOT NULL,
  `source` enum('SHEET','MANUAL') DEFAULT 'SHEET',
  `overall_status` enum('DRAFT','UNDER_REVIEW','CLOSED') DEFAULT 'DRAFT',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `category_user_id` (`category_user_id`),
  KEY `imported_by` (`imported_by`),
  CONSTRAINT `category_demands_ibfk_1` FOREIGN KEY (`category_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `category_demands_ibfk_2` FOREIGN KEY (`imported_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `category_demands`
--

LOCK TABLES `category_demands` WRITE;
/*!40000 ALTER TABLE `category_demands` DISABLE KEYS */;
INSERT INTO `category_demands` VALUES (3,2,1,'SHEET','DRAFT','2026-02-21 17:47:52'),(4,7,5,'SHEET','DRAFT','2026-07-01 05:31:14');
/*!40000 ALTER TABLE `category_demands` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `deliveries`
--

DROP TABLE IF EXISTS `deliveries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `deliveries` (
  `id` int NOT NULL AUTO_INCREMENT,
  `mapping_id` int NOT NULL,
  `delivered_qty` int NOT NULL,
  `delivered_by` int NOT NULL,
  `delivered_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `delivery_log_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `mapping_id` (`mapping_id`),
  KEY `delivered_by` (`delivered_by`),
  KEY `delivery_log_id` (`delivery_log_id`),
  CONSTRAINT `deliveries_ibfk_1` FOREIGN KEY (`mapping_id`) REFERENCES `demand_inventory_mapping` (`id`),
  CONSTRAINT `deliveries_ibfk_2` FOREIGN KEY (`delivered_by`) REFERENCES `users` (`id`),
  CONSTRAINT `deliveries_ibfk_3` FOREIGN KEY (`delivery_log_id`) REFERENCES `delivery_logs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deliveries`
--

LOCK TABLES `deliveries` WRITE;
/*!40000 ALTER TABLE `deliveries` DISABLE KEYS */;
INSERT INTO `deliveries` VALUES (2,4,2,1,'2026-02-21 17:53:07',NULL),(3,4,2,1,'2026-02-22 05:30:51',NULL),(4,4,-1,1,'2026-02-22 05:33:19',NULL),(5,7,2,5,'2026-07-02 05:41:32',NULL),(6,7,1,5,'2026-07-02 06:52:15',NULL),(7,5,2,5,'2026-07-02 12:17:44',1),(8,6,1,5,'2026-07-02 12:17:44',1);
/*!40000 ALTER TABLE `deliveries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `delivery_logs`
--

DROP TABLE IF EXISTS `delivery_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `delivery_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category_user_id` int NOT NULL,
  `delivered_by` int NOT NULL,
  `receiver_name` varchar(255) NOT NULL,
  `delivered_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `category_user_id` (`category_user_id`),
  KEY `delivered_by` (`delivered_by`),
  CONSTRAINT `delivery_logs_ibfk_1` FOREIGN KEY (`category_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `delivery_logs_ibfk_2` FOREIGN KEY (`delivered_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `delivery_logs`
--

LOCK TABLES `delivery_logs` WRITE;
/*!40000 ALTER TABLE `delivery_logs` DISABLE KEYS */;
INSERT INTO `delivery_logs` VALUES (1,7,5,'arts cc','2026-07-02 12:17:44');
/*!40000 ALTER TABLE `delivery_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `demand_inventory_mapping`
--

DROP TABLE IF EXISTS `demand_inventory_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `demand_inventory_mapping` (
  `id` int NOT NULL AUTO_INCREMENT,
  `demand_item_id` int NOT NULL,
  `inventory_item_id` int NOT NULL,
  `issued_qty` int NOT NULL,
  `is_final` tinyint(1) DEFAULT '0',
  `mapped_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `demand_item_id` (`demand_item_id`),
  KEY `inventory_item_id` (`inventory_item_id`),
  KEY `mapped_by` (`mapped_by`),
  CONSTRAINT `demand_inventory_mapping_ibfk_1` FOREIGN KEY (`demand_item_id`) REFERENCES `demand_items` (`id`),
  CONSTRAINT `demand_inventory_mapping_ibfk_2` FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items` (`id`),
  CONSTRAINT `demand_inventory_mapping_ibfk_3` FOREIGN KEY (`mapped_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `demand_inventory_mapping`
--

LOCK TABLES `demand_inventory_mapping` WRITE;
/*!40000 ALTER TABLE `demand_inventory_mapping` DISABLE KEYS */;
INSERT INTO `demand_inventory_mapping` VALUES (4,5,3,5,0,1,'2026-02-21 17:51:07'),(5,6,8,2,0,5,'2026-07-02 05:21:26'),(6,7,8,1,0,5,'2026-07-02 05:21:57'),(7,8,12,3,0,5,'2026-07-02 05:38:22'),(8,8,11,3,0,5,'2026-07-02 06:51:04'),(9,8,10,3,0,5,'2026-07-02 06:51:15'),(11,9,10,5,0,5,'2026-07-02 07:03:24'),(12,7,10,5,0,5,'2026-07-02 12:16:25'),(13,6,11,1,0,5,'2026-07-02 12:16:53');
/*!40000 ALTER TABLE `demand_inventory_mapping` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `demand_items`
--

DROP TABLE IF EXISTS `demand_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `demand_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `demand_id` int NOT NULL,
  `raw_item_name` varchar(255) NOT NULL,
  `unit` varchar(50) NOT NULL,
  `requested_qty` int NOT NULL,
  `negotiated_qty` int DEFAULT NULL,
  `remarks` text,
  `status` enum('UNDER_REVIEW','APPROVED','REJECTED') DEFAULT 'UNDER_REVIEW',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `demand_id` (`demand_id`),
  CONSTRAINT `demand_items_ibfk_1` FOREIGN KEY (`demand_id`) REFERENCES `category_demands` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `demand_items`
--

LOCK TABLES `demand_items` WRITE;
/*!40000 ALTER TABLE `demand_items` DISABLE KEYS */;
INSERT INTO `demand_items` VALUES (5,3,'White Paint 100ml','bottle',10,8,'Approved partially','APPROVED','2026-02-21 17:48:25'),(6,4,'yellow spray paint','bottle',3,2,'1 black 1 white','APPROVED','2026-07-01 05:31:14'),(7,4,'white chart paper','pcs',5,5,NULL,'APPROVED','2026-07-01 10:50:29'),(8,4,'chart paper','TBD',10,9,'3 white 3 green 3 blue','APPROVED','2026-07-02 05:36:18'),(9,3,'chart paper','pc',5,5,'all white','APPROVED','2026-07-02 07:02:05');
/*!40000 ALTER TABLE `demand_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_items`
--

DROP TABLE IF EXISTS `inventory_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `unit` varchar(50) NOT NULL,
  `quantity` int NOT NULL DEFAULT '0',
  `location` varchar(255) DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_item` (`name`,`unit`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `inventory_items_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_items`
--

LOCK TABLES `inventory_items` WRITE;
/*!40000 ALTER TABLE `inventory_items` DISABLE KEYS */;
INSERT INTO `inventory_items` VALUES (3,'White Paint 100ml','bottle',17,'Store A',1,'2026-02-21 17:46:57'),(4,'Brush Large','piece',15,'Store A',1,'2026-02-21 17:47:08'),(6,'White Paint','50ml',20,'Warehouse A',NULL,'2026-06-30 09:51:02'),(7,'White Paint','25ml',40,'Warehouse B',NULL,'2026-06-30 09:51:02'),(8,'Blue Paint','25ml',27,'Warehouse B',NULL,'2026-06-30 09:51:02'),(9,'Canvas Sheet','pc',100,'Warehouse C',NULL,'2026-06-30 09:51:02'),(10,'white chart paper','pcs',30,NULL,5,'2026-07-01 04:43:45'),(11,'blue chart paper','PCS',10,'A4',5,'2026-07-02 05:35:39'),(12,'Green Chart paper','pcs',7,'a4',5,'2026-07-02 05:35:54');
/*!40000 ALTER TABLE `inventory_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('CC','OC','CATEGORY') NOT NULL,
  `category_name` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `block_demands` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'cc@test.com','$2b$10$TjwqEiyzNJDFGcC1yk1F1./te1Fo0K0Ho/ztcyZNLQ7pFDGPEner6','CC',NULL,1,'2026-01-25 07:05:35',0),(2,'lighting@fest.com','$2b$10$jaArC2fYB33VaXDkXjkpB.N7okHfA4nQbpCgk7SgAU2CNidXMrhH2','CATEGORY','Lighting',1,'2026-02-04 12:03:54',0),(3,'cat2@fest.com','$2b$10$NtedbutndXMD1myMMum0U.hufiJR2bUEfA.xpy1dAyT2WIlr7eO3S','CATEGORY','painting',1,'2026-02-04 17:34:14',0),(4,'oc@fest.com','$2b$10$0oZJAKapppbqQkmrMtxIAeoQFuZXnRwQGx0xNfDJaCRBcMlJIeJAS','OC',NULL,1,'2026-02-04 17:36:03',0),(5,'cc@logistics.com','$2b$10$2dLwT63kKP/aMsAcZswO0./9E3drKDtVxBDH5ifHQyCpcs7NGt0YG','CC',NULL,1,'2026-06-30 09:51:02',0),(6,'oc@logistics.com','$2b$10$2dLwT63kKP/aMsAcZswO0./9E3drKDtVxBDH5ifHQyCpcs7NGt0YG','OC',NULL,1,'2026-06-30 09:51:02',0),(7,'arts@logistics.com','$2b$10$2dLwT63kKP/aMsAcZswO0./9E3drKDtVxBDH5ifHQyCpcs7NGt0YG','CATEGORY','Arts',1,'2026-06-30 09:51:02',1),(8,'sports@logistics.com','$2b$10$2dLwT63kKP/aMsAcZswO0./9E3drKDtVxBDH5ifHQyCpcs7NGt0YG','CATEGORY','Sports',1,'2026-06-30 09:51:02',0),(13,'pnp@logi.com','$2b$10$SvoE7tEzEhrWKOKHWcEOHOlvCQ6i7JI6SpoP2wDfoVgz0dTev4Zy2','CATEGORY','PnP',1,'2026-07-03 04:52:24',0);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-03 10:50:06
