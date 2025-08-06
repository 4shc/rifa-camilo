/* 
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();
app.use(cors());
app.use(express.json());

// Configura tu conexión a MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "", // vacía por defecto en XAMPP
  database: "rifa"
});

// Probar conexión
db.connect((err) => {
  if (err) {
    console.error("Error conectando a MySQL:", err);
    return;
  }
  console.log("✅ Conectado a MySQL");
});

// Obtener todas las boletas
app.get("/boletas", (req, res) => {
  db.query("SELECT * FROM boletas", (err, results) => {
    if (err) {
      return res.status(500).json({ error: err });
    }
    res.json(results);
  });
});

// Guardar o actualizar una boleta
app.post("/boletas", (req, res) => {
  const { numero, cliente, celular, pago, montoAbono, vendedor } = req.body;

  const sql = `
    INSERT INTO boletas (numero, cliente, celular, pago, montoAbono, vendedor)
    VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
    cliente = VALUES(cliente),
    celular = VALUES(celular),
    pago = VALUES(pago),
    montoAbono = VALUES(montoAbono),
    vendedor = VALUES(vendedor)
  `;

  db.query(sql, [numero, cliente, celular, pago, montoAbono, vendedor], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err });
    }
    res.json({ success: true });
  });
});

// Eliminar boleta
app.delete("/boletas/:numero", (req, res) => {
  const { numero } = req.params;
  db.query("DELETE FROM boletas WHERE numero = ?", [numero], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true });
  });
});


// Iniciar servidor
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});
 */




// Preparando para render. el codigo anterior funcina para localhost
require("dotenv").config(); // Para usar variables de entorno

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();
app.use(cors());
app.use(express.json());

// Conexión MySQL usando variables de entorno
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) {
    console.error("❌ Error conectando a MySQL:", err);
    return;
  }
  console.log("✅ Conectado a MySQL");
});

// Obtener boletas
app.get("/boletas", (req, res) => {
  console.log("📌 Petición recibida en /boletas");
  db.query("SELECT * FROM boletas", (err, results) => {
    if (err) {
      console.error("❌ Error en consulta MySQL:", err);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// Guardar o actualizar boleta
app.post("/boletas", (req, res) => {
  const { numero, cliente, celular, pago, montoAbono, vendedor } = req.body;

  const sql = `
    INSERT INTO boletas (numero, cliente, celular, pago, montoAbono, vendedor)
    VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
    cliente = VALUES(cliente),
    celular = VALUES(celular),
    pago = VALUES(pago),
    montoAbono = VALUES(montoAbono),
    vendedor = VALUES(vendedor)
  `;

  db.query(sql, [numero, cliente, celular, pago, montoAbono, vendedor], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true });
  });
});

// Eliminar boleta
app.delete("/boletas/:numero", (req, res) => {
  db.query("DELETE FROM boletas WHERE numero = ?", [req.params.numero], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true });
  });
});

// Servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});
