CREATE DATABASE IF NOT EXISTS sivoe71
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sivoe71;

CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  callsign VARCHAR(40) NOT NULL UNIQUE,
  email VARCHAR(160) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('administrador','comandante','instructor','piloto','aspirante') NOT NULL DEFAULT 'aspirante',
  rank_name VARCHAR(80) NULL,
  status ENUM('activo','reserva','suspendido') NOT NULL DEFAULT 'activo',
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL
);

CREATE TABLE aircraft (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tail_number VARCHAR(40) NOT NULL UNIQUE,
  model VARCHAR(80) NOT NULL,
  type ENUM('caza','ataque','entrenamiento','helicoptero','transporte') NOT NULL,
  status ENUM('operativo','mantenimiento','no_disponible') NOT NULL DEFAULT 'operativo',
  hours DECIMAL(8,2) NOT NULL DEFAULT 0,
  notes TEXT NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL
);

CREATE TABLE missions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(40) NOT NULL UNIQUE,
  name VARCHAR(160) NOT NULL,
  mission_type ENUM('entrenamiento','cap','strike','cas','sead','csar','recon') NOT NULL,
  status ENUM('borrador','planeacion','confirmada','ejecutada','cancelada') NOT NULL DEFAULT 'borrador',
  briefing TEXT NULL,
  theater VARCHAR(120) NULL,
  scheduled_at DATETIME NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  CONSTRAINT missions_created_by_fk FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE flight_plans (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  mission_id BIGINT UNSIGNED NOT NULL,
  callsign_package VARCHAR(80) NOT NULL,
  route JSON NULL,
  frequencies JSON NULL,
  fuel_plan JSON NULL,
  alternates JSON NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  CONSTRAINT flight_plans_mission_fk FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE
);

CREATE TABLE mission_assignments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  mission_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  aircraft_id BIGINT UNSIGNED NULL,
  role VARCHAR(80) NOT NULL,
  status ENUM('pendiente','confirmado','no_disponible') NOT NULL DEFAULT 'pendiente',
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  CONSTRAINT assignments_mission_fk FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE,
  CONSTRAINT assignments_user_fk FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT assignments_aircraft_fk FOREIGN KEY (aircraft_id) REFERENCES aircraft(id)
);

CREATE TABLE flight_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  flight_date DATE NOT NULL,
  user_id BIGINT UNSIGNED NULL,
  pilot_name VARCHAR(120) NOT NULL,
  callsign VARCHAR(40) NOT NULL,
  aircraft_id BIGINT UNSIGNED NULL,
  aircraft_name VARCHAR(80) NOT NULL,
  squadron VARCHAR(80) NOT NULL,
  map_name VARCHAR(120) NOT NULL,
  mission_id BIGINT UNSIGNED NULL,
  mission_name VARCHAR(160) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  flown_hours DECIMAL(6,2) NOT NULL DEFAULT 0,
  instructor_id BIGINT UNSIGNED NULL,
  instructor_name VARCHAR(120) NULL,
  observations TEXT NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  INDEX flight_logs_date_idx (flight_date),
  INDEX flight_logs_aircraft_idx (aircraft_name),
  INDEX flight_logs_pilot_idx (pilot_name),
  INDEX flight_logs_squadron_idx (squadron),
  CONSTRAINT flight_logs_user_fk FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT flight_logs_aircraft_fk FOREIGN KEY (aircraft_id) REFERENCES aircraft(id),
  CONSTRAINT flight_logs_mission_fk FOREIGN KEY (mission_id) REFERENCES missions(id),
  CONSTRAINT flight_logs_instructor_fk FOREIGN KEY (instructor_id) REFERENCES users(id),
  CONSTRAINT flight_logs_created_by_fk FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE training_records (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  course_code VARCHAR(40) NOT NULL,
  course_name VARCHAR(140) NOT NULL,
  progress TINYINT UNSIGNED NOT NULL DEFAULT 0,
  status ENUM('inscrito','en_progreso','aprobado','reprobado') NOT NULL DEFAULT 'inscrito',
  instructor_id BIGINT UNSIGNED NULL,
  evaluated_at DATETIME NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  CONSTRAINT training_user_fk FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT training_instructor_fk FOREIGN KEY (instructor_id) REFERENCES users(id)
);

CREATE TABLE academy_courses (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  phase ENUM(
    'Fase I Familiarizacion',
    'Fase II Navegacion',
    'Fase III Formacion',
    'Fase IV Combate BVR',
    'Fase V Combate WVR',
    'Fase VI Operaciones Nocturnas'
  ) NOT NULL,
  code VARCHAR(40) NOT NULL UNIQUE,
  name VARCHAR(140) NOT NULL,
  instructor_id BIGINT UNSIGNED NULL,
  instructor_name VARCHAR(120) NOT NULL,
  objective TEXT NULL,
  status ENUM('activo','cerrado') NOT NULL DEFAULT 'activo',
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  INDEX academy_courses_phase_idx (phase),
  INDEX academy_courses_instructor_idx (instructor_name),
  CONSTRAINT academy_courses_instructor_fk FOREIGN KEY (instructor_id) REFERENCES users(id),
  CONSTRAINT academy_courses_created_by_fk FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE academy_evaluations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  academy_course_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NULL,
  pilot_name VARCHAR(120) NOT NULL,
  evaluated_at DATE NOT NULL,
  result ENUM('Aprobado','Requiere Refuerzo','No Aprobado') NOT NULL,
  notes TEXT NULL,
  evaluated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  INDEX academy_evaluations_date_idx (evaluated_at),
  INDEX academy_evaluations_result_idx (result),
  INDEX academy_evaluations_pilot_idx (pilot_name),
  CONSTRAINT academy_evaluations_course_fk FOREIGN KEY (academy_course_id) REFERENCES academy_courses(id) ON DELETE CASCADE,
  CONSTRAINT academy_evaluations_user_fk FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT academy_evaluations_evaluator_fk FOREIGN KEY (evaluated_by) REFERENCES users(id)
);

CREATE TABLE maintenance_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  aircraft_id BIGINT UNSIGNED NOT NULL,
  reported_by BIGINT UNSIGNED NOT NULL,
  severity ENUM('baja','media','alta','critica') NOT NULL DEFAULT 'media',
  description TEXT NOT NULL,
  status ENUM('abierto','en_revision','cerrado') NOT NULL DEFAULT 'abierto',
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  CONSTRAINT maintenance_aircraft_fk FOREIGN KEY (aircraft_id) REFERENCES aircraft(id),
  CONSTRAINT maintenance_reporter_fk FOREIGN KEY (reported_by) REFERENCES users(id)
);
