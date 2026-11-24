CREATE DATABASE IF NOT EXISTS artik3d
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE artik3d;

-- 1. Tablas del sistema
CREATE TABLE IF NOT EXISTS Categorias (
  id_categoria INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(80) NOT NULL,
  PRIMARY KEY (id_categoria),
  UNIQUE KEY uq_categoria_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Productos (
  cprod INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(120) NOT NULL,
  cantidad INT NOT NULL DEFAULT 0,
  precio DECIMAL(10,2) NOT NULL,
  imagen VARCHAR(255) NOT NULL,
  id_categoria INT NOT NULL,
  es_destacado TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (cprod),
  KEY idx_productos_categoria (id_categoria),
  CONSTRAINT fk_productos_categoria
    FOREIGN KEY (id_categoria) REFERENCES Categorias (id_categoria)
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Historial_Precios (
  id_historial INT NOT NULL AUTO_INCREMENT,
  cprod INT NOT NULL,
  precio_anterior DECIMAL(10,2) NOT NULL,
  precio_nuevo DECIMAL(10,2) NOT NULL,
  cambiado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_historial),
  KEY idx_historial_cprod (cprod),
  CONSTRAINT fk_historial_producto
    FOREIGN KEY (cprod) REFERENCES Productos (cprod)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Comentarios (
  id_comentario INT NOT NULL AUTO_INCREMENT,
  nombre_cliente VARCHAR(80) NOT NULL,
  calificacion TINYINT NOT NULL DEFAULT 5,
  comentario TEXT NOT NULL,
  estado ENUM('pendiente', 'aprobado') NOT NULL DEFAULT 'pendiente',
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_comentario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Encargos (
  id_encargo INT NOT NULL AUTO_INCREMENT,
  nombre_cliente VARCHAR(120) NOT NULL,
  telefono VARCHAR(30) NOT NULL,
  estado ENUM('pendiente', 'finalizado', 'rechazado') NOT NULL DEFAULT 'pendiente',
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_encargo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Detalle_Encargos (
  id_detalle_encargo INT NOT NULL AUTO_INCREMENT,
  id_encargo INT NOT NULL,
  cprod INT NOT NULL,
  cantidad INT NOT NULL,
  PRIMARY KEY (id_detalle_encargo),
  KEY idx_detalle_encargo (id_encargo),
  KEY idx_detalle_encargo_producto (cprod),
  CONSTRAINT fk_detalle_encargo
    FOREIGN KEY (id_encargo) REFERENCES Encargos (id_encargo)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_detalle_encargo_producto
    FOREIGN KEY (cprod) REFERENCES Productos (cprod)
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Datos iniciales
INSERT IGNORE INTO Categorias (id_categoria, nombre) VALUES
  (1, 'Figuras'),
  (2, 'Coleccionables'),
  (3, 'Gadgets');

INSERT IGNORE INTO Productos (cprod, nombre, cantidad, precio, imagen, id_categoria, es_destacado) VALUES
  (1, 'Nutria',       5, 400.00, 'assets/images/products/p1.png', 1, 1),
  (2, 'Steve',        5, 400.00, 'assets/images/products/p2.png', 1, 1),
  (3, 'Pug',          5, 350.00, 'assets/images/products/p3.png', 1, 1),
  (4, 'Alien',        4, 270.00, 'assets/images/products/p4.png', 2, 1),
  (5, 'Araña',        5, 200.00, 'assets/images/products/p5.png', 2, 1),
  (6, 'Nose',         5, 150.00, 'assets/images/products/p6.png', 3, 1),
  (7, 'Flor enojada', 5, 200.00, 'assets/images/products/p7.png', 2, 1),
  (8, 'Serpiente',    0, 350.00, 'assets/images/products/p8.png', 1, 1);

INSERT IGNORE INTO Comentarios (id_comentario, nombre_cliente, calificacion, comentario, estado, creado_en) VALUES
  (1, 'Sofía R.', 5, 'La calidad de impresión es increíble, los detalles se ven geniales y el envío fue más rápido de lo que esperaba. Definitivamente volveré a comprar.', 'aprobado', '2025-06-12 12:00:00');

-- 3. Vista publica de catálogo (sin exponer stock)
CREATE OR REPLACE VIEW vista_catalogo_publico AS
SELECT
  p.cprod,
  p.nombre,
  p.precio,
  p.imagen,
  p.id_categoria,
  c.nombre AS categoria,
  p.es_destacado
FROM Productos p
INNER JOIN Categorias c ON p.id_categoria = c.id_categoria;

-- 4. Disparadores
DROP TRIGGER IF EXISTS trg_productos_after_update_precio;
DELIMITER $$
CREATE TRIGGER trg_productos_after_update_precio
AFTER UPDATE ON Productos
FOR EACH ROW
BEGIN
  IF OLD.precio <> NEW.precio THEN
    INSERT INTO Historial_Precios (cprod, precio_anterior, precio_nuevo)
    VALUES (NEW.cprod, OLD.precio, NEW.precio);
  END IF;
END$$
DELIMITER ;

DROP TRIGGER IF EXISTS trg_encargo_finalizado_descontar_stock;
DELIMITER $$
CREATE TRIGGER trg_encargo_finalizado_descontar_stock
AFTER UPDATE ON Encargos
FOR EACH ROW
BEGIN
  IF OLD.estado <> 'finalizado' AND NEW.estado = 'finalizado' THEN
    UPDATE Productos p
    INNER JOIN (
      SELECT cprod, SUM(cantidad) AS total_cantidad
      FROM Detalle_Encargos
      WHERE id_encargo = NEW.id_encargo
      GROUP BY cprod
    ) d ON p.cprod = d.cprod
    SET p.cantidad = GREATEST(0, p.cantidad - d.total_cantidad);
  END IF;
END$$
DELIMITER ;

-- 5. Procedimiento almacenado: gestión de destacados con límite de 8
DROP PROCEDURE IF EXISTS sp_establecer_destacado;
DELIMITER $$
CREATE PROCEDURE sp_establecer_destacado(
  IN p_cprod INT,
  IN p_es_destacado TINYINT(1)
)
BEGIN
  DECLARE v_total_destacados INT DEFAULT 0;

  IF p_es_destacado = 1 THEN
    SELECT COUNT(*) INTO v_total_destacados
    FROM Productos
    WHERE es_destacado = 1 AND cprod <> p_cprod;

    IF v_total_destacados >= 8 THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Límite alcanzado: solo se permiten 8 productos destacados.';
    END IF;
  END IF;

  UPDATE Productos
  SET es_destacado = IF(p_es_destacado = 1, 1, 0)
  WHERE cprod = p_cprod;

  SELECT ROW_COUNT() AS filas_afectadas;
END$$
DELIMITER ;