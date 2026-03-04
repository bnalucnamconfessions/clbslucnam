-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: clbsvhdthptlucnam
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `accounts`
--

DROP TABLE IF EXISTS `accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accounts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `avatar_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `provider` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_login_at` datetime(6) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `club_permission` varchar(35) COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `student_id_image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `accounts_email_provider_a99890fb_uniq` (`email`,`provider`),
  KEY `accounts_email_200aa879` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accounts`
--

LOCK TABLES `accounts` WRITE;
/*!40000 ALTER TABLE `accounts` DISABLE KEYS */;
INSERT INTO `accounts` VALUES (1,'hoangthanhbinh0809@gmail.com','Hoàng Thanh Bình','https://lh3.googleusercontent.com/a/ACg8ocLC28bvizrq-mbBzI_Z63CQtGKLVvLocz6rCmgfOlFyNObF7Ie1=s96-c','google','2026-03-04 17:11:19.407021','2026-02-01 05:03:45.541985','chairperson','hoangthanhbinh0809@gmail.com',NULL,'http://localhost:8000//media/student_id/fd9b73cb574f4aea8192ed5afe3d1630.jpg'),(2,'damthimai08092003@gmail.com','Bình Hoàng','https://lh3.googleusercontent.com/a/ACg8ocKjs5zvRupN2LZ-Tzsc0IjSp9_sXk697Nbwnr4FCSA6n1zq5Q=s96-c','google','2026-02-03 16:23:23.396181','2026-02-01 05:05:14.452699','chairperson','damthimai08092003@gmail.com',NULL,'http://localhost:8000//media/student_id/d7eab30379a44b7888f416d3166c220c.jpg'),(8,'admin@gmail.com','Admin',NULL,'email','2026-03-04 17:10:22.630082','2026-02-01 13:14:16.055010','admin','','pbkdf2_sha256$1200000$68ChWIKdaB5NRQuG9R8l5f$4sQUYSoskj28azkV8HvR4rrdKegD8rXXjQHaaqmum28=','http://localhost:8000//media/student_id/448bfaf88f41453ca9e02579f49319e9.jpg'),(9,'thanhbenh0809@gmail.com','Thanhbenh0809',NULL,'email','2026-02-20 08:05:08.347223','2026-02-01 13:17:58.045307','vice_head_communication','','pbkdf2_sha256$1200000$FoHUQxGWEqbAUtWFVr5RFU$ugUbwVHGicctXLhmgxcjcLMd1o1KXIcCiUYaVAOvDXg=',NULL),(12,'nongsannhanongxanh@gmail.com','Nongsannhanongxanh',NULL,'email','2026-03-04 16:39:55.576508','2026-03-04 16:39:50.049917','user','','pbkdf2_sha256$1200000$HGjyc0ir1E9jBxpISRQjzK$HyLr5pcgWDEtiASNgLcwdhS+6/zCOIzSz3L5jH01kNs=','http://localhost:8000//media/student_id/2e5f38ae0f4049d19cecd31e3e119e72.jpg');
/*!40000 ALTER TABLE `accounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `activity_logs`
--

DROP TABLE IF EXISTS `activity_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `action` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `details` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `account_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `activity_logs_account_id_3530f0bd_fk_accounts_id` (`account_id`),
  CONSTRAINT `activity_logs_account_id_3530f0bd_fk_accounts_id` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=188 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_logs`
--

LOCK TABLES `activity_logs` WRITE;
/*!40000 ALTER TABLE `activity_logs` DISABLE KEYS */;
INSERT INTO `activity_logs` VALUES (1,'Cập nhật hồ sơ cá nhân','','2026-02-01 19:18:44.089337',2),(2,'Cập nhật giao dịch thu chi','Trạng thái: Đã xác nhận','2026-02-01 19:23:47.691795',2),(3,'Cập nhật giao dịch thu chi','Nội dung: đsđa | Thu 3.333.333 ₫ | Người yêu cầu: fffff | Trạng thái: Đã xác nhận','2026-02-01 19:26:43.128676',2),(4,'Cập nhật thành viên','Tên: Bình Hoàng | Mã: acc-2 | Quyền: Thành viên ban Truyền thông - Đối Ngoại','2026-02-01 19:52:16.094233',2),(5,'Cập nhật thành viên','Tên: Bình Hoàng | Mã: acc-2 | Quyền: Phó chủ nhiệm','2026-02-02 14:47:29.929950',1),(6,'Tạo thông báo','Tiêu đề: dựkdkbjad | Đối tượng: Ban chủ nhiệm | Loại: Nội bộ | Mức độ: Thường','2026-02-02 14:48:14.129303',2),(7,'Cập nhật thành viên','Tên: Hoàng Thanh Bình | Mã: acc-1 | Quyền: Thành viên ban Truyền thông - Đối Ngoại','2026-02-02 14:53:54.621466',1),(8,'Tạo giao dịch thu chi','Nội dung: hjhfaf | Chi 55.555 ₫ | Người yêu cầu: đưaăđư | Ngày: 2026-02-02','2026-02-02 14:59:24.963202',2),(9,'Cập nhật thành viên','Tên: Hoàng Thanh Bình | Mã: acc-1 | Quyền: Quản trị viên','2026-02-02 15:01:54.058405',2),(10,'Cập nhật giao dịch thu chi','Nội dung: hjhfaf | Chi 55.555 ₫ | Người yêu cầu: đưaăđư | Trạng thái: Đã duyệt','2026-02-02 15:02:03.952547',2),(11,'Tạo giao dịch thu chi','Nội dung: đưaădư55 | Chi 55.555 ₫ | Người yêu cầu: dưadwa | Ngày: 2026-02-02','2026-02-02 15:02:15.113060',2),(12,'Tạo giao dịch thu chi','Nội dung: đuawđ | Chi 444.444 ₫ | Người yêu cầu: ffesfsefes | Ngày: 2026-02-02','2026-02-02 15:04:41.494603',2),(13,'Tạo giao dịch thu chi','Nội dung: ddwd | Chi 555.555 ₫ | Người yêu cầu: đuawdwa | Ngày: 2026-02-02','2026-02-02 15:09:25.911138',2),(14,'Tạo giao dịch thu chi','Nội dung: dưad | Chi 55.555 ₫ | Người yêu cầu: dădwdawda | Ngày: 2026-02-02','2026-02-02 15:12:56.323696',2),(15,'Cập nhật giao dịch thu chi','Nội dung: dưad | Chi 55.555 ₫ | Người yêu cầu: dădwdawda | Trạng thái: Đã duyệt','2026-02-02 15:13:03.687491',1),(16,'Cập nhật giao dịch thu chi','Nội dung: ddwd | Chi 555.555 ₫ | Người yêu cầu: đuawdwa | Trạng thái: Đã duyệt','2026-02-02 15:13:43.198164',2),(17,'Cập nhật giao dịch thu chi','Nội dung: đuawđ | Chi 444.444 ₫ | Người yêu cầu: ffesfsefes | Trạng thái: Đã duyệt','2026-02-02 15:13:44.128269',2),(18,'Cập nhật giao dịch thu chi','Nội dung: đưaădư55 | Chi 55.555 ₫ | Người yêu cầu: dưadwa | Trạng thái: Đã duyệt','2026-02-02 15:13:45.225584',2),(19,'Cập nhật thành viên','Tên: Bình Hoàng | Mã: acc-2 | Quyền: Thành viên ban Quản lý sách','2026-02-02 15:16:18.143547',2),(20,'Cập nhật thành viên','Tên: Bình Hoàng | Mã: acc-2 | Quyền: Người dùng','2026-02-02 15:17:35.702591',1),(21,'Cập nhật thành viên','Tên: Bình Hoàng | Mã: acc-2 | Quyền: Thành viên ban Truyền thông - Đối Ngoại','2026-02-02 15:20:06.038552',1),(22,'Cập nhật thành viên','Tên: Bình Hoàng | Mã: acc-2 | Quyền: Người dùng','2026-02-02 15:20:21.977272',1),(23,'Cập nhật thành viên','Tên: Bình Hoàng | Mã: acc-2 | Quyền: Trưởng ban Quản Lý Sách','2026-02-02 15:23:26.315861',1),(24,'Cập nhật thành viên','Tên: Bình Hoàng | Mã: acc-2 | Quyền: Chủ nhiệm','2026-02-02 17:49:34.148942',1),(25,'Đăng xuất','Email: hoangthanhbinh0809@gmail.com','2026-02-02 18:21:14.720644',1),(26,'Cập nhật thành viên','Tên: Hoàng Thanh Bình | Mã: acc-1 | Quyền: Người dùng','2026-02-02 18:24:01.294157',1),(27,'Cập nhật thành viên','Tên: Hoàng Thanh Bình | Mã: acc-1 | Quyền: Quản trị viên','2026-02-03 15:21:03.399859',2),(28,'Đăng xuất','Email: damthimai08092003@gmail.com','2026-02-03 15:52:18.477315',2),(31,'Đăng xuất','Email: hoangthanhbinh0809@gmail.com','2026-02-03 16:16:33.609629',1),(34,'Đăng nhập','Đăng nhập bằng tài khoản | Email: thanhbenh0809@gmail.com','2026-02-03 17:59:08.665291',9),(35,'Đăng xuất','Email: thanhbenh0809@gmail.com','2026-02-03 18:29:21.904637',9),(36,'Đăng xuất','Email: hoangthanhbinh0809@gmail.com','2026-02-03 18:29:53.127804',1),(37,'Đăng nhập','Đăng nhập bằng tài khoản | Email: thanhbenh0809@gmail.com','2026-02-03 18:29:55.877725',9),(38,'Tạo thông báo','Tiêu đề: grdgdrg | Đối tượng: Ban chủ nhiệm | Loại: Nội bộ | Mức độ: Quan trọng','2026-02-17 18:07:34.923244',9),(39,'Tạo thông báo','Tiêu đề: dâdwadaw | Đối tượng: Tất cả thành viên | Loại: Công khai | Mức độ: Khẩn','2026-02-17 18:08:42.803868',9),(40,'Đăng xuất','Email: thanhbenh0809@gmail.com','2026-02-20 08:04:34.242103',9),(41,'Đăng nhập','Đăng nhập bằng tài khoản | Email: thanhbenh0809@gmail.com','2026-02-20 08:05:08.373775',9),(42,'Thêm sách (QR)','Tên: Đắc nhân tâm | Tác giả: aaa | Loại: Kỹ năng','2026-02-20 08:10:41.719448',9),(43,'Thêm sách','Tên: Tôi thấy hoa vàng trên cỏ xanh | Tác giả: Nguyễn Nhật Ánh | Thể loại: Văn học','2026-02-20 08:12:51.546660',9),(44,'Tạo thông báo','Tiêu đề: láodaosd | Đối tượng: — | Loại: Công khai | Mức độ: Thường','2026-02-20 08:18:05.906171',9),(45,'Cập nhật thành viên','Tên: Bình Hoàng | Mã: acc-2 | Quyền: Phó ban Quản Lý Sách','2026-02-20 08:21:37.879615',9),(46,'Cập nhật thành viên','Tên: Thanhbenh0809 | Mã: acc-9 | Quyền: Thành viên ban Quản lý sách','2026-02-20 08:22:07.665813',9),(47,'Đăng xuất','Email: thanhbenh0809@gmail.com','2026-02-20 08:28:36.981902',9),(48,'Đăng nhập','Đăng nhập bằng tài khoản | Email: admin@gmail.com','2026-02-20 08:30:57.094226',8),(49,'Cập nhật thành viên','Tên: Thanhbenh0809 | Mã: acc-9 | Quyền: Quản trị viên','2026-02-20 08:31:15.467623',8),(50,'Cập nhật thành viên','Tên: Bình Hoàng | Mã: acc-2 | Quyền: Quản trị viên','2026-02-20 08:31:56.805243',8),(51,'Cập nhật thành viên','Tên: Bình Hoàng | Mã: acc-2 | Quyền: Trưởng ban Nhân sự - Tài Chính','2026-02-20 08:32:24.946503',2),(52,'Tạo giao dịch thu chi','Nội dung: jhcgdtrt | Chi 5.555.555.555.555 ₫ | Người yêu cầu: minhminh | Ngày: 2026-02-20','2026-02-20 08:33:00.593125',2),(53,'Cập nhật giao dịch thu chi','Nội dung: jhcgdtrt | Chi 5.555.555.555.555 ₫ | Người yêu cầu: minhminh | Trạng thái: Đã duyệt','2026-02-20 08:33:18.788311',8),(54,'Cập nhật thành viên','Tên: Bình Hoàng | Mã: acc-2 | Quyền: Trưởng ban Truyền thông - Đối Ngoại','2026-02-20 08:34:11.116937',8),(55,'Cập nhật thành viên','Tên: Admin | Mã: acc-8 | Quyền: Người dùng','2026-02-20 08:53:19.584163',8),(56,'Đăng xuất','Email: admin@gmail.com','2026-02-23 16:04:18.183239',8),(57,'Đăng nhập','Đăng nhập bằng tài khoản | Email: admin@gmail.com','2026-02-23 16:04:23.283842',8),(58,'Đăng xuất','Email: admin@gmail.com','2026-02-23 16:04:25.976067',8),(59,'Đăng nhập','Đăng nhập qua Google | Email: hoangthanhbinh0809@gmail.com','2026-02-23 16:04:32.536188',1),(60,'Tạo thông báo','Tiêu đề: đankạd | Đối tượng: — | Loại: Nội bộ | Mức độ: Thường','2026-02-23 16:04:56.871106',1),(61,'Tạo thông báo','Tiêu đề: dmamdawdkn | Đối tượng: Tất cả thành viên | Loại: Nội bộ | Mức độ: Thường','2026-02-23 16:05:29.057952',1),(62,'Đăng xuất','Email: hoangthanhbinh0809@gmail.com','2026-02-23 16:06:06.428193',1),(63,'Đăng nhập','Đăng nhập bằng tài khoản | Email: admin@gmail.com','2026-02-23 16:06:08.810350',8),(64,'Đăng xuất','Email: admin@gmail.com','2026-02-23 16:06:45.375261',8),(65,'Đăng nhập','Đăng nhập qua Google | Email: hoangthanhbinh0809@gmail.com','2026-02-23 16:06:51.729322',1),(66,'Xóa thông báo','Tiêu đề: đuaw | Đối tượng: Tất cả thành viên','2026-02-23 16:07:18.508153',1),(67,'Xóa thông báo','Tiêu đề: dựkdkbjad | Đối tượng: Ban chủ nhiệm','2026-02-23 16:07:21.581051',1),(68,'Xóa thông báo','Tiêu đề: grdgdrg | Đối tượng: Ban chủ nhiệm','2026-02-23 16:07:24.336966',1),(69,'Xóa thông báo','Tiêu đề: dâdwadaw | Đối tượng: Tất cả thành viên','2026-02-23 16:07:27.211099',1),(70,'Xóa thông báo','Tiêu đề: dmamdawdkn | Đối tượng: Tất cả thành viên','2026-02-23 16:07:30.430808',1),(71,'Cập nhật thành viên','Tên: Bình Hoàng | Mã: acc-2 | Quyền: Quản trị viên','2026-02-23 16:08:46.372966',1),(72,'Cập nhật thành viên','Tên: Thanhbenh0809 | Mã: 9 | Quyền: Thành viên ban Quản lý sách','2026-02-23 16:17:25.312033',1),(73,'Cập nhật thành viên','Tên: Admin | Mã: 8 | Quyền: Người dùng','2026-02-23 16:18:55.547104',1),(74,'Cập nhật thành viên','Tên: Thanhbenh0809 | Mã: 9 | Quyền: Phó ban Truyền thông - Đối Ngoại','2026-02-23 16:19:03.434785',1),(75,'Mượn sách','Thành viên: Thanhbenh0809 | Sách: Đắc nhân tâm, Tôi thấy hoa vàng trên cỏ xanh','2026-02-23 16:26:05.876775',1),(76,'Trả sách','Sách: Đắc nhân tâm | Thành viên: Thanhbenh0809 | Hạn trả: 2026-03-09','2026-02-23 16:42:17.607344',2),(77,'Trả sách','Sách: Tôi thấy hoa vàng trên cỏ xanh | Thành viên: Thanhbenh0809 | Hạn trả: 2026-03-09 | Ghi chú: Sách bị rách ở trang 12','2026-02-23 16:50:44.320815',1),(78,'Mượn sách','Thành viên: Thanhbenh0809 | Sách: Đắc nhân tâm, Tôi thấy hoa vàng trên cỏ xanh','2026-02-23 16:51:21.207592',1),(79,'Trả sách','Sách: Đắc nhân tâm | Thành viên: Thanhbenh0809 | Hạn trả: 2026-03-09 | Ghi chú: Sách bị rách','2026-02-23 16:51:37.064056',1),(80,'Trả sách','Sách: Tôi thấy hoa vàng trên cỏ xanh | Thành viên: Thanhbenh0809 | Hạn trả: 2026-03-09 | Ghi chú: Sách bị rách','2026-02-23 16:55:12.207219',1),(81,'Cập nhật thành viên','Tên: Bình Hoàng | Mã: 2 | Quyền: Thành viên ban Quản lý sách','2026-02-23 17:01:35.701083',1),(82,'Mượn sách','Thành viên: Thanhbenh0809 | Sách: Đắc nhân tâm, Tôi thấy hoa vàng trên cỏ xanh','2026-02-23 17:02:06.929416',2),(83,'Trả sách','Sách: Đắc nhân tâm | Thành viên: Thanhbenh0809 | Hạn trả: 2026-03-10 | Ghi chú: 3 chấm','2026-02-23 17:02:17.740178',2),(84,'Cập nhật quyền thành viên','Tài khoản: Bình Hoàng | Quyền mới: Chủ nhiệm','2026-02-23 17:04:07.839479',1),(85,'Xóa thông báo','Tiêu đề: Ghi chú trả sách: Tôi thấy hoa vàng trên cỏ xanh | Đối tượng: Ban Quản lý Sách','2026-02-23 17:05:24.083795',2),(86,'Xóa thông báo','Tiêu đề: Ghi chú trả sách: Đắc nhân tâm | Đối tượng: Ban Quản lý Sách','2026-02-23 17:05:25.046285',2),(87,'Xóa thông báo','Tiêu đề: Ghi chú trả sách: Tôi thấy hoa vàng trên cỏ xanh | Đối tượng: Ban Quản lý Sách','2026-02-23 17:05:25.794054',2),(88,'Xóa thông báo','Tiêu đề: Ghi chú trả sách: Đắc nhân tâm | Đối tượng: Ban Quản lý Sách','2026-02-23 17:05:26.424723',2),(89,'Trả sách','Sách: Tôi thấy hoa vàng trên cỏ xanh | Thành viên: Thanhbenh0809 | Hạn trả: 2026-03-10 | Ghi chú: djkkadkjaw','2026-02-23 17:05:59.820292',1),(90,'Mượn sách','Thành viên: Thanhbenh0809 | Sách: Đắc nhân tâm, Tôi thấy hoa vàng trên cỏ xanh','2026-02-23 17:10:07.043626',1),(91,'Trả sách','Sách: Đắc nhân tâm | Thành viên: Thanhbenh0809 | Hạn trả: 2026-03-10 | Ghi chú: ahidg ătuitiy28498623978w vui4','2026-02-23 17:10:36.834087',1),(92,'Trả sách','Sách: Tôi thấy hoa vàng trên cỏ xanh | Thành viên: Thanhbenh0809 | Hạn trả: 2026-03-10 | Ghi chú: dựkah g7821t84udghgaugduagudguawgduagudw\nđưaă','2026-02-23 17:11:03.189473',2),(93,'Mượn sách','Thành viên: Bình Hoàng | Sách: Đắc nhân tâm, Tôi thấy hoa vàng trên cỏ xanh','2026-02-23 17:14:24.927906',1),(94,'Trả sách','Sách: Đắc nhân tâm | Thành viên: Bình Hoàng | Hạn trả: 2026-03-10 | Ghi chú: à há','2026-02-23 17:14:38.574100',1),(95,'Trả sách','Sách: Tôi thấy hoa vàng trên cỏ xanh | Thành viên: Bình Hoàng | Hạn trả: 2026-03-10 | Ghi chú: 4 con cò','2026-02-23 17:17:22.802044',2),(96,'Đăng xuất','Email: hoangthanhbinh0809@gmail.com','2026-02-23 19:17:08.822639',1),(97,'Đăng nhập','Đăng nhập qua Google | Email: hoangthanhbinh0809@gmail.com','2026-02-23 19:48:25.819790',1),(98,'Tạo thông báo','Tiêu đề: yuftrdy | Đối tượng: Tất cả thành viên | Loại: Nội bộ | Mức độ: Khẩn','2026-02-23 19:49:39.455384',1),(99,'Thêm sách','Tên: hjvfu | Tác giả: iguy | Thể loại: Văn học','2026-02-23 19:50:15.547522',1),(100,'Mượn sách','Thành viên: Thanhbenh0809 | Sách: Đắc nhân tâm, Tôi thấy hoa vàng trên cỏ xanh, hjvfu','2026-02-23 19:52:32.711763',1),(101,'Trả sách','Sách: Tôi thấy hoa vàng trên cỏ xanh | Thành viên: Thanhbenh0809 | Hạn trả: 2026-03-10 | Ghi chú: tyttydyttyfytfytfty','2026-02-23 19:53:11.634939',1),(102,'Trả sách','Sách: Đắc nhân tâm | Thành viên: Thanhbenh0809 | Hạn trả: 2026-03-10','2026-02-23 19:53:47.429175',1),(103,'Trả sách','Sách: hjvfu | Thành viên: Thanhbenh0809 | Hạn trả: 2026-03-10','2026-02-23 19:53:54.064613',1),(104,'Tạo giao dịch thu chi','Nội dung: hjvggcg | Chi 67.000.000.000.000 ₫ | Người yêu cầu: hjvygg | Ngày: 2026-02-23','2026-02-23 19:55:15.733770',1),(105,'Cập nhật giao dịch thu chi','Nội dung: hjvggcg | Chi 67.000.000.000.000 ₫ | Người yêu cầu: hjvygg | Trạng thái: Đã duyệt','2026-02-23 19:55:44.294085',2),(106,'Đăng xuất','Email: hoangthanhbinh0809@gmail.com','2026-02-23 19:57:08.921281',1),(107,'Đăng nhập','Đăng nhập bằng tài khoản | Email: admin@gmail.com','2026-02-23 19:58:06.528553',8),(108,'Đăng xuất','Email: admin@gmail.com','2026-02-23 19:58:17.929085',8),(109,'Đăng nhập','Đăng nhập qua Google | Email: hoangthanhbinh0809@gmail.com','2026-02-24 16:26:30.359796',1),(110,'Mượn sách','Thành viên: Admin | Sách: Đắc nhân tâm, Tôi thấy hoa vàng trên cỏ xanh, hjvfu','2026-02-24 16:38:59.106651',2),(111,'Trả sách','Sách: Đắc nhân tâm | Thành viên: Admin | Hạn trả: 2026-03-10 | Ghi chú: jkagdgajdaw','2026-02-24 16:39:15.229419',2),(112,'Trả sách','Sách: Tôi thấy hoa vàng trên cỏ xanh | Thành viên: Admin | Hạn trả: 2026-03-10 | Ghi chú: hdjhwjdhjadw','2026-02-24 16:39:36.362365',1),(113,'Mượn sách','Hoàng Thanh Bình (12A7) | Sách: Đắc nhân tâm, Tôi thấy hoa vàng trên cỏ xanh','2026-02-24 16:51:23.521039',2),(114,'Trả sách','Sách: Đắc nhân tâm | Thành viên: Hoàng Thanh Bình | Hạn trả: 2026-03-10','2026-02-24 16:51:42.464682',2),(115,'Trả sách','Sách: Tôi thấy hoa vàng trên cỏ xanh | Thành viên: Hoàng Thanh Bình | Hạn trả: 2026-03-10 | Ghi chú: ahihinycladoconcho','2026-02-24 16:51:55.020763',2),(116,'Trả sách','Sách: hjvfu | Thành viên: Admin | Hạn trả: 2026-03-10 | Ghi chú: ihuidggug2ggu','2026-02-24 16:55:24.743781',1),(117,'Mượn sách','Thành viên: Thanhbenh0809 | Sách: Đắc nhân tâm','2026-02-24 16:57:22.718864',2),(118,'Trả sách','Sách: Đắc nhân tâm | Thành viên: Thanhbenh0809 | Hạn trả: 2026-03-10 | Ghi chú: dahdiguaudawd','2026-02-24 16:57:34.058595',2),(119,'Mượn sách','Thành viên: Admin | Sách: hjvfu','2026-02-24 17:00:59.674283',2),(120,'Trả sách','Sách: hjvfu | Thành viên: Admin | Hạn trả: 2026-03-11 | Ghi chú: 123456789','2026-02-24 17:01:09.688619',2),(121,'Cập nhật thành viên','Tên: Admin | Mã: 8 | Quyền: Thành viên ban Nhân sự - Tài Chính','2026-02-24 17:22:02.376603',2),(122,'Cập nhật thành viên','Tên: Admin | Mã: 8 | Quyền: Người dùng','2026-02-24 17:22:13.328626',2),(123,'Đăng xuất','Email: hoangthanhbinh0809@gmail.com','2026-02-24 17:33:49.865222',1),(124,'Đăng nhập','Đăng nhập qua Google | Email: hoangthanhbinh0809@gmail.com','2026-02-24 17:33:58.925444',1),(125,'Đăng xuất','Email: hoangthanhbinh0809@gmail.com','2026-02-24 17:38:14.932110',1),(126,'Đăng nhập','Đăng nhập qua Google | Email: hoangthanhbinh0809@gmail.com','2026-02-24 17:38:22.470876',1),(127,'Đăng xuất','Email: hoangthanhbinh0809@gmail.com','2026-02-24 17:41:42.655766',1),(128,'Đăng nhập','Đăng nhập qua Google | Email: hoangthanhbinh0809@gmail.com','2026-02-24 17:41:52.678778',1),(129,'Đăng xuất','Email: hoangthanhbinh0809@gmail.com','2026-02-25 13:48:05.863258',1),(130,'Đăng nhập','Đăng nhập qua Google | Email: hoangthanhbinh0809@gmail.com','2026-02-25 13:49:11.864184',1),(131,'Đăng xuất','Email: hoangthanhbinh0809@gmail.com','2026-02-25 16:27:27.377198',1),(132,'Đăng nhập','Đăng nhập qua Google | Email: hoangthanhbinh0809@gmail.com','2026-02-25 16:27:36.116471',1),(133,'Tạo mã QR hàng loạt','10 sách','2026-02-25 16:48:37.344602',1),(134,'Cập nhật sách','Tên: kcasnkcnkas | Tác giả: ncansc | Thể loại: Kỹ năng sống','2026-02-25 16:49:03.367163',1),(135,'Cập nhật sách','Tên: eeeee | Tác giả: fvfdv | Thể loại: Khoa học','2026-02-25 16:49:32.744368',1),(136,'Xóa sách','Tên: Mã QR - Chờ nhập #2 | Tác giả: — | Thể loại: —','2026-02-25 16:50:03.544320',1),(137,'Xóa sách','Tên: Mã QR - Chờ nhập #3 | Tác giả: — | Thể loại: —','2026-02-25 16:50:11.976551',1),(138,'Xóa sách','Tên: Mã QR - Chờ nhập #4 | Tác giả: — | Thể loại: —','2026-02-25 16:50:18.349750',1),(139,'Xóa sách','Tên: Mã QR - Chờ nhập #5 | Tác giả: — | Thể loại: —','2026-02-25 16:50:22.984500',1),(140,'Xóa sách','Tên: Mã QR - Chờ nhập #6 | Tác giả: — | Thể loại: —','2026-02-25 16:50:46.940714',1),(141,'Xóa sách','Tên: Mã QR - Chờ nhập #7 | Tác giả: — | Thể loại: —','2026-02-25 16:50:51.398750',1),(142,'Xóa sách','Tên: Mã QR - Chờ nhập #8 | Tác giả: — | Thể loại: —','2026-02-25 16:50:59.029220',1),(143,'Xóa sách','Tên: Mã QR - Chờ nhập #9 | Tác giả: — | Thể loại: —','2026-02-25 16:51:03.244134',1),(144,'Thêm sách (QR)','Tên: dvxvdxvd | Tác giả: vdvxvdxv | Loại: Tiểu thuyết','2026-02-25 16:52:05.101689',1),(145,'Thêm sách (QR)','Tên: csmbcasc | Tác giả: cnasncnas | Loại: Giáo khoa','2026-02-25 16:55:06.744515',2),(146,'Tạo mã QR hàng loạt','10 sách','2026-02-25 17:22:02.003365',1),(147,'Thêm sách (QR)','Tên: gfag | Tác giả: djhawjdjaw | Thể loại: Kỹ năng sống','2026-02-25 17:32:12.572013',1),(148,'Mượn sách','Thành viên: Admin | Sách: kcasnkcnkas','2026-02-27 14:47:45.682752',2),(149,'Đăng xuất','Email: hoangthanhbinh0809@gmail.com','2026-02-27 15:04:27.962901',1),(150,'Đăng nhập','Đăng nhập bằng tài khoản | Email: admin@gmail.com','2026-02-27 15:04:34.047723',8),(151,'Đăng xuất','Email: admin@gmail.com','2026-02-27 15:05:11.450929',8),(152,'Đăng nhập','Đăng nhập qua Google | Email: hoangthanhbinh0809@gmail.com','2026-02-27 15:05:39.383005',1),(153,'Đăng xuất','Email: hoangthanhbinh0809@gmail.com','2026-02-27 15:06:07.173220',1),(154,'Đăng nhập','Đăng nhập bằng tài khoản | Email: admin@gmail.com','2026-02-27 15:06:09.924349',8),(155,'Đăng xuất','Email: admin@gmail.com','2026-02-27 15:07:16.584797',8),(156,'Đăng nhập','Đăng nhập qua Google | Email: hoangthanhbinh0809@gmail.com','2026-02-27 15:07:24.451660',1),(157,'Mượn sách','Thành viên: Thanhbenh0809 | Sách: Đắc nhân tâm','2026-02-27 17:04:43.229343',1),(158,'Trả sách','Sách: Đắc nhân tâm | Thành viên: Thanhbenh0809 | Hạn trả: 2026-03-14','2026-02-27 17:05:05.994297',1),(159,'Mượn sách','Thành viên: Bình Hoàng | Sách: Đắc nhân tâm','2026-02-27 17:26:56.890695',1),(160,'Xóa tài khoản','Tên: Nongsannhanongxanh | Email: nongsannhanongxanh@gmail.com','2026-03-04 16:38:06.822191',1),(161,'Đăng xuất','Email: hoangthanhbinh0809@gmail.com','2026-03-04 16:38:11.060263',1),(162,'Xóa tài khoản','Tên: Nhà Nông Xanh | Email: nongsannhanongxanh@gmail.com','2026-03-04 16:39:10.381063',2),(163,'Đăng ký tài khoản','Email: nongsannhanongxanh@gmail.com','2026-03-04 16:39:50.077196',12),(164,'Đăng nhập','Đăng nhập bằng tài khoản | Email: nongsannhanongxanh@gmail.com','2026-03-04 16:39:55.603704',12),(165,'Mượn sách','Thành viên: Hoàng Thanh Bình | Sách: Tôi thấy hoa vàng trên cỏ xanh','2026-03-04 16:50:09.387159',2),(166,'Mượn sách','Thành viên: Nongsannhanongxanh | Sách: hjvfu','2026-03-04 16:53:18.820134',2),(167,'Trả sách','Sách: hjvfu | Thành viên: Nongsannhanongxanh | Hạn trả: 2026-03-18','2026-03-04 16:53:25.528796',2),(168,'Đăng xuất','Email: nongsannhanongxanh@gmail.com','2026-03-04 16:53:31.143127',12),(169,'Đăng nhập','Đăng nhập bằng tài khoản | Email: admin@gmail.com','2026-03-04 16:54:26.601788',8),(170,'Đăng xuất','Email: admin@gmail.com','2026-03-04 16:54:29.470947',8),(171,'Đăng nhập','Đăng nhập qua Google | Email: hoangthanhbinh0809@gmail.com','2026-03-04 16:57:36.829140',1),(172,'Đăng nhập','Đăng nhập qua Google | Email: hoangthanhbinh0809@gmail.com','2026-03-04 16:57:36.829658',1),(173,'Cập nhật quyền thành viên','Tài khoản: Admin | Quyền mới: Quản trị viên','2026-03-04 17:03:38.058749',2),(174,'Đăng xuất','Email: hoangthanhbinh0809@gmail.com','2026-03-04 17:05:15.982234',1),(175,'Đăng nhập','Đăng nhập bằng tài khoản | Email: admin@gmail.com','2026-03-04 17:05:18.540412',8),(176,'Đăng xuất','Email: admin@gmail.com','2026-03-04 17:05:27.461824',8),(177,'Đăng nhập','Đăng nhập qua Google | Email: hoangthanhbinh0809@gmail.com','2026-03-04 17:05:34.002582',1),(178,'Đăng nhập','Đăng nhập qua Google | Email: hoangthanhbinh0809@gmail.com','2026-03-04 17:05:34.028479',1),(179,'Cập nhật quyền thành viên','Tài khoản: Hoàng Thanh Bình | Quyền mới: Chủ nhiệm','2026-03-04 17:07:05.016218',2),(180,'Đăng xuất','Email: hoangthanhbinh0809@gmail.com','2026-03-04 17:07:18.125291',1),(181,'Đăng nhập','Đăng nhập qua Google | Email: hoangthanhbinh0809@gmail.com','2026-03-04 17:07:27.303650',1),(182,'Đăng nhập','Đăng nhập qua Google | Email: hoangthanhbinh0809@gmail.com','2026-03-04 17:07:27.315586',1),(183,'Đăng xuất','Email: hoangthanhbinh0809@gmail.com','2026-03-04 17:10:20.215932',1),(184,'Đăng nhập','Đăng nhập bằng tài khoản | Email: admin@gmail.com','2026-03-04 17:10:22.665828',8),(185,'Đăng xuất','Email: admin@gmail.com','2026-03-04 17:11:12.445136',8),(186,'Đăng nhập','Đăng nhập qua Google | Email: hoangthanhbinh0809@gmail.com','2026-03-04 17:11:20.438207',1),(187,'Đăng nhập','Đăng nhập qua Google | Email: hoangthanhbinh0809@gmail.com','2026-03-04 17:11:20.442123',1);
/*!40000 ALTER TABLE `activity_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_group`
--

DROP TABLE IF EXISTS `auth_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_group` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_group`
--

LOCK TABLES `auth_group` WRITE;
/*!40000 ALTER TABLE `auth_group` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_group` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_group_permissions`
--

DROP TABLE IF EXISTS `auth_group_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_group_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `group_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_group_permissions_group_id_permission_id_0cd325b0_uniq` (`group_id`,`permission_id`),
  KEY `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` (`permission_id`),
  CONSTRAINT `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `auth_group_permissions_group_id_b120cbf9_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_group_permissions`
--

LOCK TABLES `auth_group_permissions` WRITE;
/*!40000 ALTER TABLE `auth_group_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_group_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_permission`
--

DROP TABLE IF EXISTS `auth_permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_permission` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_type_id` int NOT NULL,
  `codename` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_permission_content_type_id_codename_01ab375a_uniq` (`content_type_id`,`codename`),
  CONSTRAINT `auth_permission_content_type_id_2f476e4b_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=97 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_permission`
--

LOCK TABLES `auth_permission` WRITE;
/*!40000 ALTER TABLE `auth_permission` DISABLE KEYS */;
INSERT INTO `auth_permission` VALUES (1,'Can add log entry',1,'add_logentry'),(2,'Can change log entry',1,'change_logentry'),(3,'Can delete log entry',1,'delete_logentry'),(4,'Can view log entry',1,'view_logentry'),(5,'Can add permission',3,'add_permission'),(6,'Can change permission',3,'change_permission'),(7,'Can delete permission',3,'delete_permission'),(8,'Can view permission',3,'view_permission'),(9,'Can add group',2,'add_group'),(10,'Can change group',2,'change_group'),(11,'Can delete group',2,'delete_group'),(12,'Can view group',2,'view_group'),(13,'Can add user',4,'add_user'),(14,'Can change user',4,'change_user'),(15,'Can delete user',4,'delete_user'),(16,'Can view user',4,'view_user'),(17,'Can add content type',5,'add_contenttype'),(18,'Can change content type',5,'change_contenttype'),(19,'Can delete content type',5,'delete_contenttype'),(20,'Can view content type',5,'view_contenttype'),(21,'Can add session',6,'add_session'),(22,'Can change session',6,'change_session'),(23,'Can delete session',6,'delete_session'),(24,'Can view session',6,'view_session'),(25,'Can add dashboard stats',7,'add_dashboardstats'),(26,'Can change dashboard stats',7,'change_dashboardstats'),(27,'Can delete dashboard stats',7,'delete_dashboardstats'),(28,'Can view dashboard stats',7,'view_dashboardstats'),(29,'Can add overdue book',8,'add_overduebook'),(30,'Can change overdue book',8,'change_overduebook'),(31,'Can delete overdue book',8,'delete_overduebook'),(32,'Can view overdue book',8,'view_overduebook'),(33,'Can add top reader',9,'add_topreader'),(34,'Can change top reader',9,'change_topreader'),(35,'Can delete top reader',9,'delete_topreader'),(36,'Can view top reader',9,'view_topreader'),(37,'Can add notification',13,'add_notification'),(38,'Can change notification',13,'change_notification'),(39,'Can delete notification',13,'delete_notification'),(40,'Can view notification',13,'view_notification'),(41,'Can add member',12,'add_member'),(42,'Can change member',12,'change_member'),(43,'Can delete member',12,'delete_member'),(44,'Can view member',12,'view_member'),(45,'Can add borrow record',11,'add_borrowrecord'),(46,'Can change borrow record',11,'change_borrowrecord'),(47,'Can delete borrow record',11,'delete_borrowrecord'),(48,'Can view borrow record',11,'view_borrowrecord'),(49,'Can add book',10,'add_book'),(50,'Can change book',10,'change_book'),(51,'Can delete book',10,'delete_book'),(52,'Can view book',10,'view_book'),(53,'Can add account',14,'add_account'),(54,'Can change account',14,'change_account'),(55,'Can delete account',14,'delete_account'),(56,'Can view account',14,'view_account'),(57,'Can add password reset token',15,'add_passwordresettoken'),(58,'Can change password reset token',15,'change_passwordresettoken'),(59,'Can delete password reset token',15,'delete_passwordresettoken'),(60,'Can view password reset token',15,'view_passwordresettoken'),(61,'Can add fund transaction',16,'add_fundtransaction'),(62,'Can change fund transaction',16,'change_fundtransaction'),(63,'Can delete fund transaction',16,'delete_fundtransaction'),(64,'Can view fund transaction',16,'view_fundtransaction'),(65,'Can add notification read',17,'add_notificationread'),(66,'Can change notification read',17,'change_notificationread'),(67,'Can delete notification read',17,'delete_notificationread'),(68,'Can view notification read',17,'view_notificationread'),(69,'Can add activity log',18,'add_activitylog'),(70,'Can change activity log',18,'change_activitylog'),(71,'Can delete activity log',18,'delete_activitylog'),(72,'Can view activity log',18,'view_activitylog'),(73,'Can add doi tac data',19,'add_doitacdata'),(74,'Can change doi tac data',19,'change_doitacdata'),(75,'Can delete doi tac data',19,'delete_doitacdata'),(76,'Can view doi tac data',19,'view_doitacdata'),(77,'Can add donation campaign',21,'add_donationcampaign'),(78,'Can change donation campaign',21,'change_donationcampaign'),(79,'Can delete donation campaign',21,'delete_donationcampaign'),(80,'Can view donation campaign',21,'view_donationcampaign'),(81,'Can add donation',20,'add_donation'),(82,'Can change donation',20,'change_donation'),(83,'Can delete donation',20,'delete_donation'),(84,'Can view donation',20,'view_donation'),(85,'Can add email verification code',22,'add_emailverificationcode'),(86,'Can change email verification code',22,'change_emailverificationcode'),(87,'Can delete email verification code',22,'delete_emailverificationcode'),(88,'Can view email verification code',22,'view_emailverificationcode'),(89,'Can add ranking gift config',23,'add_rankinggiftconfig'),(90,'Can change ranking gift config',23,'change_rankinggiftconfig'),(91,'Can delete ranking gift config',23,'delete_rankinggiftconfig'),(92,'Can view ranking gift config',23,'view_rankinggiftconfig'),(93,'Can add website config',24,'add_websiteconfig'),(94,'Can change website config',24,'change_websiteconfig'),(95,'Can delete website config',24,'delete_websiteconfig'),(96,'Can view website config',24,'view_websiteconfig');
/*!40000 ALTER TABLE `auth_permission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_user`
--

DROP TABLE IF EXISTS `auth_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `password` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_login` datetime(6) DEFAULT NULL,
  `is_superuser` tinyint(1) NOT NULL,
  `username` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(254) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_staff` tinyint(1) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `date_joined` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_user`
--

LOCK TABLES `auth_user` WRITE;
/*!40000 ALTER TABLE `auth_user` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_user_groups`
--

DROP TABLE IF EXISTS `auth_user_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_user_groups` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `group_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_user_groups_user_id_group_id_94350c0c_uniq` (`user_id`,`group_id`),
  KEY `auth_user_groups_group_id_97559544_fk_auth_group_id` (`group_id`),
  CONSTRAINT `auth_user_groups_group_id_97559544_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`),
  CONSTRAINT `auth_user_groups_user_id_6a12ed8b_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_user_groups`
--

LOCK TABLES `auth_user_groups` WRITE;
/*!40000 ALTER TABLE `auth_user_groups` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_user_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_user_user_permissions`
--

DROP TABLE IF EXISTS `auth_user_user_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_user_user_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_user_user_permissions_user_id_permission_id_14a6b632_uniq` (`user_id`,`permission_id`),
  KEY `auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm` (`permission_id`),
  CONSTRAINT `auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `auth_user_user_permissions_user_id_a95ead1b_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_user_user_permissions`
--

LOCK TABLES `auth_user_user_permissions` WRITE;
/*!40000 ALTER TABLE `auth_user_user_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_user_user_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `books`
--

DROP TABLE IF EXISTS `books`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `books` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `author` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `genre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `publisher` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_borrowed` tinyint(1) NOT NULL,
  `code` varchar(12) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `purchase_date` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `books`
--

LOCK TABLES `books` WRITE;
/*!40000 ALTER TABLE `books` DISABLE KEYS */;
INSERT INTO `books` VALUES (17,'Đắc nhân tâm','aaa','Kỹ năng','','600000',1,NULL,NULL),(18,'Tôi thấy hoa vàng trên cỏ xanh','Nguyễn Nhật Ánh','Văn học','NXB trẻ','80000',1,NULL,NULL),(19,'hjvfu','iguy','Văn học','jcghdhg','20000000000',0,NULL,NULL),(20,'kcasnkcnkas','ncansc','Kỹ năng sống','scacasc','3333333',1,NULL,NULL),(29,'eeeee','fvfdv','Khoa học','vfdvdf','34444444',1,NULL,NULL),(30,'dvxvdxvd','vdvxvdxv','Tiểu thuyết','','4444444',1,NULL,NULL),(31,'csmbcasc','cnasncnas','Giáo khoa','','5555555',0,NULL,NULL),(32,'Mã QR - Chờ nhập #1','','','','',0,NULL,NULL),(33,'Mã QR - Chờ nhập #2','','','','',0,NULL,NULL),(34,'Mã QR - Chờ nhập #3','','','','',0,NULL,NULL),(35,'Mã QR - Chờ nhập #4','','','','',0,NULL,NULL),(36,'Mã QR - Chờ nhập #5','','','','',0,NULL,NULL),(37,'Mã QR - Chờ nhập #6','','','','',0,NULL,NULL),(38,'Mã QR - Chờ nhập #7','','','','',0,NULL,NULL),(39,'Mã QR - Chờ nhập #8','','','','',0,NULL,NULL),(40,'Mã QR - Chờ nhập #9','','','','',0,NULL,NULL),(41,'Mã QR - Chờ nhập #10','','','','',0,NULL,NULL),(42,'gfag','djhawjdjaw','Kỹ năng sống','','558555',0,'255555555555',NULL);
/*!40000 ALTER TABLE `books` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `borrow_records`
--

DROP TABLE IF EXISTS `borrow_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `borrow_records` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `borrow_date` date NOT NULL,
  `due_date` date NOT NULL,
  `return_date` date DEFAULT NULL,
  `book_id` bigint NOT NULL,
  `member_id` bigint DEFAULT NULL,
  `return_notes` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `recorded_by_id` bigint DEFAULT NULL,
  `guest_class` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `guest_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `borrow_records_book_id_d4cd019e_fk_books_id` (`book_id`),
  KEY `borrow_records_recorded_by_id_be46697c_fk_accounts_id` (`recorded_by_id`),
  KEY `borrow_records_member_id_c9b23407_fk_members_id` (`member_id`),
  CONSTRAINT `borrow_records_book_id_d4cd019e_fk_books_id` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`),
  CONSTRAINT `borrow_records_member_id_c9b23407_fk_members_id` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`),
  CONSTRAINT `borrow_records_recorded_by_id_be46697c_fk_accounts_id` FOREIGN KEY (`recorded_by_id`) REFERENCES `accounts` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `borrow_records`
--

LOCK TABLES `borrow_records` WRITE;
/*!40000 ALTER TABLE `borrow_records` DISABLE KEYS */;
INSERT INTO `borrow_records` VALUES (1,'2026-02-23','2026-03-09','2026-02-23',17,15,'',NULL,'',''),(2,'2026-02-23','2026-03-09','2026-02-23',18,15,'Sách bị rách ở trang 12',NULL,'',''),(3,'2026-02-23','2026-03-09','2026-02-23',17,15,'Sách bị rách',NULL,'',''),(4,'2026-02-23','2026-03-09','2026-02-23',18,15,'Sách bị rách',NULL,'',''),(5,'2026-02-24','2026-03-10','2026-02-24',17,15,'3 chấm',NULL,'',''),(6,'2026-02-24','2026-03-10','2026-02-24',18,15,'djkkadkjaw',NULL,'',''),(7,'2026-02-24','2026-03-10','2026-02-24',17,15,'ahidg ătuitiy28498623978w vui4',NULL,'',''),(8,'2026-02-24','2026-03-10','2026-02-24',18,15,'dựkah g7821t84udghgaugduagudguawgduagudw\nđưaă',NULL,'',''),(9,'2026-02-24','2026-03-10','2026-02-24',17,13,'à há',NULL,'',''),(10,'2026-02-24','2026-03-10','2026-02-24',18,13,'4 con cò',NULL,'',''),(11,'2026-02-24','2026-03-10','2026-02-24',17,15,'',NULL,'',''),(12,'2026-02-24','2026-03-10','2026-02-24',18,15,'tyttydyttyfytfytfty',NULL,'',''),(13,'2026-02-24','2026-03-10','2026-02-24',19,15,'',NULL,'',''),(14,'2026-02-24','2026-03-10','2026-02-24',17,14,'jkagdgajdaw',2,'',''),(15,'2026-02-24','2026-03-10','2026-02-24',18,14,'hdjhwjdhjadw',2,'',''),(16,'2026-02-24','2026-03-10','2026-02-24',19,14,'ihuidggug2ggu',2,'',''),(17,'2026-02-24','2026-03-10','2026-02-24',17,NULL,'',2,'12A7','Hoàng Thanh Bình'),(18,'2026-02-24','2026-03-10','2026-02-24',18,NULL,'ahihinycladoconcho',2,'12A7','Hoàng Thanh Bình'),(19,'2026-02-24','2026-03-10','2026-02-24',17,15,'dahdiguaudawd',2,'',''),(20,'2026-02-25','2026-03-11','2026-02-25',19,14,'123456789',2,'',''),(21,'2026-02-27','2026-03-13',NULL,20,14,'',2,'',''),(22,'2026-02-27','2026-03-13',NULL,29,14,'',2,'',''),(23,'2026-02-27','2026-03-13',NULL,30,14,'',2,'',''),(24,'2026-02-28','2026-03-14','2026-02-28',17,15,'',1,'',''),(25,'2026-02-28','2026-03-14',NULL,17,13,'',1,'',''),(26,'2026-03-04','2026-03-18',NULL,18,9,'',2,'',''),(27,'2026-03-04','2026-03-18','2026-03-04',19,16,'',2,'','');
/*!40000 ALTER TABLE `borrow_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dashboard_stats`
--

DROP TABLE IF EXISTS `dashboard_stats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dashboard_stats` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `borrow_today` int NOT NULL,
  `borrow_month` int NOT NULL,
  `overdue_count` int NOT NULL,
  `active_members` int NOT NULL,
  `borrow_today_change` decimal(5,2) NOT NULL,
  `borrow_month_change` decimal(5,2) NOT NULL,
  `active_members_change` decimal(5,2) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dashboard_stats`
--

LOCK TABLES `dashboard_stats` WRITE;
/*!40000 ALTER TABLE `dashboard_stats` DISABLE KEYS */;
/*!40000 ALTER TABLE `dashboard_stats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_admin_log`
--

DROP TABLE IF EXISTS `django_admin_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_admin_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `action_time` datetime(6) NOT NULL,
  `object_id` longtext COLLATE utf8mb4_unicode_ci,
  `object_repr` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action_flag` smallint unsigned NOT NULL,
  `change_message` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_type_id` int DEFAULT NULL,
  `user_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `django_admin_log_content_type_id_c4bce8eb_fk_django_co` (`content_type_id`),
  KEY `django_admin_log_user_id_c564eba6_fk_auth_user_id` (`user_id`),
  CONSTRAINT `django_admin_log_content_type_id_c4bce8eb_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`),
  CONSTRAINT `django_admin_log_user_id_c564eba6_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `django_admin_log_chk_1` CHECK ((`action_flag` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_admin_log`
--

LOCK TABLES `django_admin_log` WRITE;
/*!40000 ALTER TABLE `django_admin_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `django_admin_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_content_type`
--

DROP TABLE IF EXISTS `django_content_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_content_type` (
  `id` int NOT NULL AUTO_INCREMENT,
  `app_label` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `model` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `django_content_type_app_label_model_76bd3d3b_uniq` (`app_label`,`model`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_content_type`
--

LOCK TABLES `django_content_type` WRITE;
/*!40000 ALTER TABLE `django_content_type` DISABLE KEYS */;
INSERT INTO `django_content_type` VALUES (1,'admin','logentry'),(14,'api','account'),(18,'api','activitylog'),(10,'api','book'),(11,'api','borrowrecord'),(7,'api','dashboardstats'),(19,'api','doitacdata'),(20,'api','donation'),(21,'api','donationcampaign'),(22,'api','emailverificationcode'),(16,'api','fundtransaction'),(12,'api','member'),(13,'api','notification'),(17,'api','notificationread'),(8,'api','overduebook'),(15,'api','passwordresettoken'),(23,'api','rankinggiftconfig'),(9,'api','topreader'),(24,'api','websiteconfig'),(2,'auth','group'),(3,'auth','permission'),(4,'auth','user'),(5,'contenttypes','contenttype'),(6,'sessions','session');
/*!40000 ALTER TABLE `django_content_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_migrations`
--

DROP TABLE IF EXISTS `django_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_migrations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `app` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `applied` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_migrations`
--

LOCK TABLES `django_migrations` WRITE;
/*!40000 ALTER TABLE `django_migrations` DISABLE KEYS */;
INSERT INTO `django_migrations` VALUES (1,'contenttypes','0001_initial','2026-01-31 16:28:42.210083'),(2,'auth','0001_initial','2026-01-31 16:28:42.681201'),(3,'admin','0001_initial','2026-01-31 16:28:42.792130'),(4,'admin','0002_logentry_remove_auto_add','2026-01-31 16:28:42.798206'),(5,'admin','0003_logentry_add_action_flag_choices','2026-01-31 16:28:42.804271'),(6,'contenttypes','0002_remove_content_type_name','2026-01-31 16:28:42.903962'),(7,'auth','0002_alter_permission_name_max_length','2026-01-31 16:28:42.968163'),(8,'auth','0003_alter_user_email_max_length','2026-01-31 16:28:42.991731'),(9,'auth','0004_alter_user_username_opts','2026-01-31 16:28:42.998308'),(10,'auth','0005_alter_user_last_login_null','2026-01-31 16:28:43.051167'),(11,'auth','0006_require_contenttypes_0002','2026-01-31 16:28:43.054912'),(12,'auth','0007_alter_validators_add_error_messages','2026-01-31 16:28:43.061234'),(13,'auth','0008_alter_user_username_max_length','2026-01-31 16:28:43.124609'),(14,'auth','0009_alter_user_last_name_max_length','2026-01-31 16:28:43.178472'),(15,'auth','0010_alter_group_name_max_length','2026-01-31 16:28:43.202720'),(16,'auth','0011_update_proxy_permissions','2026-01-31 16:28:43.213294'),(17,'auth','0012_alter_user_first_name_max_length','2026-01-31 16:28:43.307701'),(18,'sessions','0001_initial','2026-01-31 16:28:43.346422'),(19,'api','0001_initial','2026-01-31 16:29:58.080910'),(20,'api','0002_add_books_members_notifications_borrow','2026-01-31 16:46:07.373298'),(21,'api','0003_add_account_model','2026-02-01 05:02:26.507274'),(22,'api','0004_add_account_club_permission','2026-02-01 05:12:13.996086'),(23,'api','0005_change_account_roles','2026-02-01 05:15:44.926784'),(24,'api','0006_add_display_email','2026-02-01 05:53:20.787511'),(25,'api','0007_expand_role_choices','2026-02-01 06:01:04.792625'),(26,'api','0008_split_member_roles','2026-02-01 06:03:12.753887'),(27,'api','0009_add_account_password_hash','2026-02-01 10:39:44.024019'),(28,'api','0010_add_password_reset_token','2026-02-01 10:56:55.660324'),(29,'api','0011_add_fund_transaction','2026-02-01 14:18:16.071403'),(30,'api','0012_add_notification_urgency','2026-02-01 18:24:59.004560'),(31,'api','0013_add_notification_sender_label','2026-02-01 18:34:58.907364'),(32,'api','0014_add_notification_read','2026-02-01 19:00:29.265872'),(33,'api','0015_add_activity_log','2026-02-01 19:08:23.700276'),(34,'api','0016_add_doi_tac_data','2026-02-02 17:48:18.558936'),(35,'api','0017_add_quyen_gop_models','2026-02-03 15:19:36.849388'),(36,'api','0018_add_email_verification_code','2026-02-03 15:54:32.613279'),(37,'api','0019_add_ranking_gift_config','2026-02-03 16:27:09.682798'),(38,'api','0020_add_borrow_record_return_notes','2026-02-23 16:47:17.049272'),(39,'api','0021_add_borrow_record_recorded_by','2026-02-24 16:36:52.743810'),(40,'api','0022_borrowrecord_guest_optional_member','2026-02-24 16:50:53.914573'),(41,'api','0023_add_website_config','2026-02-25 13:44:01.268137'),(42,'api','0024_add_book_code','2026-02-25 16:59:50.895488'),(43,'api','0025_add_book_purchase_date','2026-02-25 17:39:47.722307'),(44,'api','0026_add_student_id_image_url','2026-02-27 14:57:40.387436');
/*!40000 ALTER TABLE `django_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_session`
--

DROP TABLE IF EXISTS `django_session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_session` (
  `session_key` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `session_data` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expire_date` datetime(6) NOT NULL,
  PRIMARY KEY (`session_key`),
  KEY `django_session_expire_date_a5c62663` (`expire_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_session`
--

LOCK TABLES `django_session` WRITE;
/*!40000 ALTER TABLE `django_session` DISABLE KEYS */;
/*!40000 ALTER TABLE `django_session` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `doi_tac_data`
--

DROP TABLE IF EXISTS `doi_tac_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `doi_tac_data` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `key` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `data` json NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `key` (`key`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `doi_tac_data`
--

LOCK TABLES `doi_tac_data` WRITE;
/*!40000 ALTER TABLE `doi_tac_data` DISABLE KEYS */;
INSERT INTO `doi_tac_data` VALUES (1,'data','{\"sponsorsGold\": [{\"url\": \"https://www.facebook.com/copy.link.fb.la.yeuminhroiii\", \"icon\": \"verified\", \"name\": \"TechEdu Solutions\", \"image\": \"http://localhost:8000//media/uploads/173949f015f6495a9cf7b996f0dcea96.jpg\", \"description\": \"Đơn vị cung cấp giải pháp công nghệ giáo dục hàng đầu, tài trợ hệ thống quản lý thư viện số và các thiết bị đọc sách điện tử cho thành viên câu lạc bộ.\"}, {\"url\": \"https://www.facebook.com/copy.link.fb.la.yeuminhroiii\", \"icon\": \"school\", \"name\": \"NXB Tri Thức Trẻ\", \"image\": \"https://lh3.googleusercontent.com/aida-public/AB6AXuCAixUwENBdTJtrysXw2eh_LMbEtEQZa3ZU2OVUOIMdHa0HpIKl2CccNvfmswBoe5BOEeqo6UK5Hbb19o94EAaqoXDprHLxGqzT9yxHsBrQewsZE8hmWy-6BxoQPf-IdfGI6B6Qt5B7RFDWML9jIxQoRJ6kkbucVxI3-IJDR10TtDqgw5R1SKwUALeBz5JTErC0w4DmVYw726K3AGe-EZzM2iapbfE6iEJMVQDyK9fSX_l01QCeOiRQUgdcIciIVFRAHrDvcoXNz2_J\", \"description\": \"Đối tác cung cấp nguồn sách bản quyền phong phú, hỗ trợ tổ chức các buổi tọa đàm tác giả và workshop kỹ năng đọc hiểu cho sinh viên.\"}], \"partnersCommunity\": [{\"icon\": \"menu_book\", \"name\": \"BookWorm\"}, {\"icon\": \"language\", \"name\": \"Global Lang\"}, {\"icon\": \"palette\", \"name\": \"Art Space\"}, {\"icon\": \"science\", \"name\": \"SciLab\"}, {\"icon\": \"sports_esports\", \"name\": \"GameZone\"}], \"partnersStrategic\": [{\"desc\": \"Hỗ trợ không gian làm việc nhóm và tổ chức sự kiện chuyên nghiệp cho các dự án của CLB.\", \"name\": \"Innovation Hub\", \"image\": \"https://lh3.googleusercontent.com/aida-public/AB6AXuCqnBdMDqFF36ZHbeOv7NxTVGX8yJ1A_yTuyfASGjoaJ1tmytRJNa8ePT6gZx-QuKjBIPy8C5-tRpF8cqGADjs4qZjgBRGdUjGYmb16Y7F_ouqzW3-3_pOJvzmAVh-8uzBhXPScJByyIeYx7QpJ6NrDgUcm3drGram9FH_MSvNC8a7AIb9EsXoNe_aHecaGi2fhiCp2oTMdTWrUHPSJNuQQeKWwJudr3C-KeLQ-UNgJWkMfvOgAG-TUX4yhvPbn84mCnOyFolc_HN5z\"}, {\"desc\": \"Tài trợ voucher đồ uống và địa điểm cho các buổi offline đọc sách hàng tháng.\", \"name\": \"Coffee & Books\", \"image\": \"https://lh3.googleusercontent.com/aida-public/AB6AXuAEz5ZZObQsNNQXR8gs-BOTaQcowIEJcdnoRY18VON36WW3Bgq3YzvOExscRRz6swDMJA8Or9LGr_VSfYFSldLA8z5rgVlqvhjiZTdiu4uEdXSMwjbobWFYUrujo_Kuqn2LSvw8G7ee_9D_nmeM3jMWDCrDK-3uFGgFy97Md5nMNbwmLgYFii-UXMQZ5i7SAEc4RJUx6pz1S7C9DxQfME6QAFJXnsUxL0m8g0iuwMPAop3HoowjMOlix2txK3X2_NMJ1tXbjtRPzdCd\"}, {\"desc\": \"Cung cấp văn phòng phẩm và các vật phẩm quà tặng cho các cuộc thi viết.\", \"name\": \"Alpha Stationery\", \"image\": \"https://lh3.googleusercontent.com/aida-public/AB6AXuAm8geTdPQunDiVInhI932PTrFJi5FpOvO99fZk_vzh_-cjQCYOfoISC8liLr3XLqJjfNLxfOv_KATKHbAbUX2wCt0FcNTbmUj-oeuBPHwNW-9wn6QDqlE0cJ9m0xlkVsPtBGP8-iGxKwAi_GnuKqjkfDfBQHNwg2W8RaDPs9PkGNLq3_MSxf8xsgDLOP4MonKvKVsgGgxSNZ7rhoVikpTZ04YKzG83VRY9DTBJRRZdWyaum1zaOQTDX8E2hTcXUWuJXOMgZSE6S9Iv\"}]}','2026-02-02 18:17:33.466279');
/*!40000 ALTER TABLE `doi_tac_data` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `donation_campaigns`
--

DROP TABLE IF EXISTS `donation_campaigns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `donation_campaigns` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `goal` decimal(14,0) NOT NULL,
  `banner_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `donation_campaigns`
--

LOCK TABLES `donation_campaigns` WRITE;
/*!40000 ALTER TABLE `donation_campaigns` DISABLE KEYS */;
/*!40000 ALTER TABLE `donation_campaigns` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `donations`
--

DROP TABLE IF EXISTS `donations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `donations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `donor_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(14,0) NOT NULL,
  `message` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_anonymous` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `account_id` bigint DEFAULT NULL,
  `campaign_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `donations_account_id_36e240e5_fk_accounts_id` (`account_id`),
  KEY `donations_campaign_id_b0e04707_fk_donation_campaigns_id` (`campaign_id`),
  CONSTRAINT `donations_account_id_36e240e5_fk_accounts_id` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`),
  CONSTRAINT `donations_campaign_id_b0e04707_fk_donation_campaigns_id` FOREIGN KEY (`campaign_id`) REFERENCES `donation_campaigns` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `donations`
--

LOCK TABLES `donations` WRITE;
/*!40000 ALTER TABLE `donations` DISABLE KEYS */;
/*!40000 ALTER TABLE `donations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `email_verification_codes`
--

DROP TABLE IF EXISTS `email_verification_codes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `email_verification_codes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(6) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime(6) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `email_verification_codes_email_78cb32a2` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `email_verification_codes`
--

LOCK TABLES `email_verification_codes` WRITE;
/*!40000 ALTER TABLE `email_verification_codes` DISABLE KEYS */;
INSERT INTO `email_verification_codes` VALUES (2,'hoangthanhbinh0809@gmail.com','134312','2026-02-03 16:32:47.851870','2026-02-03 16:17:47.852277');
/*!40000 ALTER TABLE `email_verification_codes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fund_transactions`
--

DROP TABLE IF EXISTS `fund_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fund_transactions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `transaction_date` date NOT NULL,
  `content` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(14,0) NOT NULL,
  `requester_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `requester_account_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fund_transactions_requester_account_id_78abfa72_fk_accounts_id` (`requester_account_id`),
  CONSTRAINT `fund_transactions_requester_account_id_78abfa72_fk_accounts_id` FOREIGN KEY (`requester_account_id`) REFERENCES `accounts` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fund_transactions`
--

LOCK TABLES `fund_transactions` WRITE;
/*!40000 ALTER TABLE `fund_transactions` DISABLE KEYS */;
INSERT INTO `fund_transactions` VALUES (1,'2026-02-01','Mua sách','income',500000,'Thanh Bình','confirmed','2026-02-01 14:26:13.233038',NULL),(2,'2026-02-01','quà tết','expense',100000,'Văn Long','confirmed','2026-02-01 14:30:46.722547',NULL),(3,'2026-02-01','Ủng hộ','income',1000000,'Không biết tên','confirmed','2026-02-01 14:31:16.190588',NULL),(4,'2026-02-01','đàu tư','expense',5000,'Thanh Bình','confirmed','2026-02-01 19:10:40.861605',NULL),(5,'2026-02-01','akwdkawd','expense',555555,'Bình','confirmed','2026-02-01 19:13:13.487121',NULL),(6,'2026-02-01','fgrgdrgrdgr','expense',55555,'dssdfs','confirmed','2026-02-01 19:15:38.645295',NULL),(7,'2026-02-01','đưaă44444','expense',444444,'fsfsefes','confirmed','2026-02-01 19:19:06.640017',NULL),(8,'2026-02-01','dựkdhjad','income',97979878798,'đuawd','confirmed','2026-02-01 19:23:45.005812',NULL),(9,'2026-02-01','đsđa','income',3333333,'fffff','confirmed','2026-02-01 19:26:24.292947',NULL),(10,'2026-02-02','hjhfaf','expense',55555,'đưaăđư','confirmed','2026-02-02 14:59:24.949578',NULL),(11,'2026-02-02','đưaădư55','expense',55555,'dưadwa','confirmed','2026-02-02 15:02:15.091910',NULL),(12,'2026-02-02','đuawđ','expense',444444,'ffesfsefes','confirmed','2026-02-02 15:04:41.483618',NULL),(13,'2026-02-02','ddwd','expense',555555,'đuawdwa','confirmed','2026-02-02 15:09:25.899800',NULL),(14,'2026-02-02','dưad','expense',55555,'dădwdawda','confirmed','2026-02-02 15:12:56.312620',2),(15,'2026-02-20','jhcgdtrt','expense',5555555555555,'minhminh','confirmed','2026-02-20 08:33:00.564845',2),(16,'2026-02-23','hjvggcg','expense',67000000000000,'hjvygg','confirmed','2026-02-23 19:55:15.719280',1);
/*!40000 ALTER TABLE `fund_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `members`
--

DROP TABLE IF EXISTS `members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `members` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `department` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `join_date` date DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `avatar_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `members`
--

LOCK TABLES `members` WRITE;
/*!40000 ALTER TABLE `members` DISABLE KEYS */;
INSERT INTO `members` VALUES (9,'Hoàng Thanh Bình','acc-1','','Quản trị viên','2026-02-01','active','https://lh3.googleusercontent.com/a/ACg8ocLC28bvizrq-mbBzI_Z63CQtGKLVvLocz6rCmgfOlFyNObF7Ie1=s96-c'),(13,'Bình Hoàng','2','Ban Chủ nhiệm','Chủ nhiệm','2026-02-01','active','https://lh3.googleusercontent.com/a/ACg8ocKjs5zvRupN2LZ-Tzsc0IjSp9_sXk697Nbwnr4FCSA6n1zq5Q=s96-c'),(14,'Admin','8','','Quản trị viên','2026-02-01','active',NULL),(15,'Thanhbenh0809','9','Ban Truyền thông - Đối Ngoại','Phó ban Truyền thông - Đối Ngoại','2026-02-01','active',NULL),(16,'Nongsannhanongxanh','12','','Người dùng','2026-03-04','active',NULL),(17,'Hoàng Thanh Bình','1','Ban Chủ nhiệm','Chủ nhiệm','2026-03-05','active','https://lh3.googleusercontent.com/a/ACg8ocLC28bvizrq-mbBzI_Z63CQtGKLVvLocz6rCmgfOlFyNObF7Ie1=s96-c');
/*!40000 ALTER TABLE `members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_reads`
--

DROP TABLE IF EXISTS `notification_reads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_reads` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `read_at` datetime(6) NOT NULL,
  `account_id` bigint NOT NULL,
  `notification_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_notif_read` (`notification_id`,`account_id`),
  KEY `notification_reads_account_id_2b280595_fk_accounts_id` (`account_id`),
  CONSTRAINT `notification_reads_account_id_2b280595_fk_accounts_id` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`),
  CONSTRAINT `notification_reads_notification_id_14a129d8_fk_notifications_id` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_reads`
--

LOCK TABLES `notification_reads` WRITE;
/*!40000 ALTER TABLE `notification_reads` DISABLE KEYS */;
INSERT INTO `notification_reads` VALUES (10,'2026-02-20 08:18:13.879821',9,13),(11,'2026-02-23 16:01:35.114576',2,13),(20,'2026-02-23 17:06:06.630714',2,20),(21,'2026-02-23 17:07:37.770971',1,20),(22,'2026-02-23 17:10:41.412227',1,21),(23,'2026-02-23 17:11:08.013244',1,22),(24,'2026-02-23 17:11:14.123434',2,22),(25,'2026-02-23 17:14:51.111720',1,24),(26,'2026-02-23 17:14:59.211616',1,23),(27,'2026-02-23 17:15:39.505383',2,25),(28,'2026-02-23 17:17:27.337988',2,26),(29,'2026-02-23 17:18:17.819859',1,26),(30,'2026-02-23 17:18:40.281114',2,24),(31,'2026-02-23 17:19:55.260466',1,25),(32,'2026-02-23 19:49:46.988304',1,27),(33,'2026-02-23 19:53:21.521624',1,28),(34,'2026-02-24 16:27:39.599174',2,28),(35,'2026-02-24 16:38:27.345915',2,23),(36,'2026-02-24 16:38:32.360565',2,21),(37,'2026-02-24 16:39:02.887439',2,27),(38,'2026-02-24 16:39:21.580887',2,29),(39,'2026-02-24 16:39:42.241733',1,30),(40,'2026-02-24 16:39:58.373016',2,30),(41,'2026-02-24 16:41:45.980228',1,29),(42,'2026-02-24 16:52:09.764004',2,31),(43,'2026-02-24 16:55:30.450097',1,32),(44,'2026-02-24 16:55:47.352124',2,32),(45,'2026-02-24 16:57:38.058419',2,33),(46,'2026-02-24 16:57:46.331158',1,33),(47,'2026-02-24 17:01:13.587473',2,34),(48,'2026-02-25 13:30:51.538078',1,34),(49,'2026-02-25 13:30:56.307288',1,31);
/*!40000 ALTER TABLE `notification_reads` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `summary` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `audience` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `scheduled_date` datetime(6) DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `urgency` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sender_label` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (13,'láodaosd','hello','',NULL,'sent','public','normal','Chủ nhiệm'),(14,'đankạd','jkdbadjaw<div><br></div>','',NULL,'sent','internal','normal','Quản trị viên'),(20,'Ghi chú trả sách: Tôi thấy hoa vàng trên cỏ xanh','Ghi chú: djkkadkjaw\n\nSách: Tôi thấy hoa vàng trên cỏ xanh - Nguyễn Nhật Ánh\nMã sách: 18\nThành viên trả: Thanhbenh0809\nNgày trả: 24/02/2026','Ban Quản lý Sách',NULL,'sent','internal','normal','Hoàng Thanh Bình'),(21,'Ghi chú trả sách: Đắc nhân tâm','Ghi chú: ahidg ătuitiy28498623978w vui4\n\nSách: Đắc nhân tâm - aaa\nMã sách: 17\nNgười trả: Thanhbenh0809\nNgày trả: 24/02/2026','Ban Quản lý Sách',NULL,'sent','internal','normal','Hoàng Thanh Bình'),(22,'Ghi chú trả sách: Tôi thấy hoa vàng trên cỏ xanh','Ghi chú: dựkah g7821t84udghgaugduagudguawgduagudw\nđưaă\n\nSách: Tôi thấy hoa vàng trên cỏ xanh - Nguyễn Nhật Ánh\nMã sách: 18\nNgười trả: Thanhbenh0809\nNgày trả: 24/02/2026','Ban Quản lý Sách',NULL,'sent','internal','normal','Bình Hoàng'),(23,'Đã ghi mượn sách: Đắc nhân tâm','Sách: Đắc nhân tâm - aaa\nMã sách: 17\nNgười mượn: Bình Hoàng\nNgày mượn: 24/02/2026\nHạn trả: 10/03/2026','Ban Quản lý Sách',NULL,'sent','internal','normal','Hoàng Thanh Bình'),(24,'Đã ghi mượn sách: Tôi thấy hoa vàng trên cỏ xanh','Sách: Tôi thấy hoa vàng trên cỏ xanh - Nguyễn Nhật Ánh\nMã sách: 18\nNgười mượn: Bình Hoàng\nNgày mượn: 24/02/2026\nHạn trả: 10/03/2026','Ban Quản lý Sách',NULL,'sent','internal','normal','Hoàng Thanh Bình'),(25,'Ghi chú trả sách: Đắc nhân tâm','Ghi chú: à há\n\nSách: Đắc nhân tâm - aaa\nMã sách: 17\nNgười trả: Bình Hoàng\nNgày trả: 24/02/2026','Ban Quản lý Sách',NULL,'sent','internal','normal','Hoàng Thanh Bình'),(26,'Ghi chú trả sách: Tôi thấy hoa vàng trên cỏ xanh','Ghi chú: 4 con cò\n\nSách: Tôi thấy hoa vàng trên cỏ xanh - Nguyễn Nhật Ánh\nMã sách: 18\nNgười trả: Bình Hoàng\nNgày trả: 24/02/2026','Ban Quản lý Sách',NULL,'sent','internal','normal','Bình Hoàng'),(27,'yuftrdy','j.kvtyddy','Tất cả thành viên',NULL,'sent','internal','urgent','Quản trị viên'),(28,'Ghi chú trả sách: Tôi thấy hoa vàng trên cỏ xanh','Ghi chú: tyttydyttyfytfytfty\n\nSách: Tôi thấy hoa vàng trên cỏ xanh - Nguyễn Nhật Ánh\nMã sách: 18\nNgười trả: Thanhbenh0809\nNgày trả: 24/02/2026','Ban Quản lý Sách',NULL,'sent','internal','normal','Hoàng Thanh Bình'),(29,'Ghi chú trả sách: Đắc nhân tâm','Ghi chú: jkagdgajdaw\n\nSách: Đắc nhân tâm - aaa\nMã sách: 17\nNgười ghi mượn sách: Bình Hoàng\nThành viên trả sách: Admin\nNgày trả: 24/02/2026','Ban Quản lý Sách',NULL,'sent','internal','normal','Bình Hoàng'),(30,'Ghi chú trả sách: Tôi thấy hoa vàng trên cỏ xanh','Ghi chú: hdjhwjdhjadw\n\nSách: Tôi thấy hoa vàng trên cỏ xanh - Nguyễn Nhật Ánh\nMã sách: 18\nNgười ghi mượn sách: Bình Hoàng\nThành viên trả sách: Admin\nNgày trả: 24/02/2026','Ban Quản lý Sách',NULL,'sent','internal','normal','Hoàng Thanh Bình'),(31,'Ghi chú trả sách: Tôi thấy hoa vàng trên cỏ xanh','Ghi chú: ahihinycladoconcho\n\nSách: Tôi thấy hoa vàng trên cỏ xanh - Nguyễn Nhật Ánh\nMã sách: 18\nNgười ghi mượn sách: Bình Hoàng\nThành viên trả sách: Hoàng Thanh Bình (12A7)\nNgày trả: 24/02/2026','Ban Quản lý Sách',NULL,'sent','internal','normal','Bình Hoàng'),(32,'Ghi chú trả sách: hjvfu','Ghi chú: ihuidggug2ggu\n\nSách: hjvfu - iguy\nMã sách: 19\nNgười mượn: Admin\nNgày trả: 24/02/2026','Ban Quản lý Sách',NULL,'sent','internal','normal','Hoàng Thanh Bình'),(33,'Ghi chú trả sách: Đắc nhân tâm','Ghi chú: dahdiguaudawd\n\nSách: Đắc nhân tâm - aaa\nMã sách: 17\nNgười mượn: Thanhbenh0809\nNgày trả: 24/02/2026','Ban Quản lý Sách',NULL,'sent','internal','normal','Bình Hoàng'),(34,'Ghi chú trả sách: hjvfu','Ghi chú: 123456789\n\nSách: hjvfu - iguy\nMã sách: 19\nNgười ghi mượn sách: Bình Hoàng\nNgười mượn: Admin\nNgày trả: 25/02/2026','Ban Quản lý Sách',NULL,'sent','internal','normal','Bình Hoàng');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `overdue_books`
--

DROP TABLE IF EXISTS `overdue_books`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `overdue_books` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `book_title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `member_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `due_date` date NOT NULL,
  `days_overdue` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `overdue_books`
--

LOCK TABLES `overdue_books` WRITE;
/*!40000 ALTER TABLE `overdue_books` DISABLE KEYS */;
/*!40000 ALTER TABLE `overdue_books` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime(6) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `account_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `password_reset_tokens_account_id_a9cd56bd_fk_accounts_id` (`account_id`),
  CONSTRAINT `password_reset_tokens_account_id_a9cd56bd_fk_accounts_id` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
INSERT INTO `password_reset_tokens` VALUES (33,'IUcOAvK5IVfQuUYJ6WYgy9uNVx2ZXgcXVnqwmqu4emo','2026-02-03 16:21:43.890842','2026-02-03 16:16:43.891079',9);
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ranking_gift_config`
--

DROP TABLE IF EXISTS `ranking_gift_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ranking_gift_config` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `intro` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `items` json NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ranking_gift_config`
--

LOCK TABLES `ranking_gift_config` WRITE;
/*!40000 ALTER TABLE `ranking_gift_config` DISABLE KEYS */;
/*!40000 ALTER TABLE `ranking_gift_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `top_readers`
--

DROP TABLE IF EXISTS `top_readers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `top_readers` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `book_count` int NOT NULL,
  `rank` int NOT NULL,
  `avatar_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `top_readers`
--

LOCK TABLES `top_readers` WRITE;
/*!40000 ALTER TABLE `top_readers` DISABLE KEYS */;
INSERT INTO `top_readers` VALUES (5,'Thanhbenh0809',11,1,NULL),(6,'Bình Hoàng',2,2,'https://lh3.googleusercontent.com/a/ACg8ocKjs5zvRupN2LZ-Tzsc0IjSp9_sXk697Nbwnr4FCSA6n1zq5Q=s96-c');
/*!40000 ALTER TABLE `top_readers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `website_config`
--

DROP TABLE IF EXISTS `website_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `website_config` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `key` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `data` json NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `key` (`key`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `website_config`
--

LOCK TABLES `website_config` WRITE;
/*!40000 ALTER TABLE `website_config` DISABLE KEYS */;
INSERT INTO `website_config` VALUES (1,'main','{\"logoUrl\": \"\", \"siteName\": \"CLB Sách và Hành động THPT Lục Nam\", \"footerText\": \"\", \"contactEmail\": \"\"}','2026-02-25 16:24:37.865650');
/*!40000 ALTER TABLE `website_config` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-05  0:12:20
