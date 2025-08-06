require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();

// 🔹 CORS configurado para tu dominio y abierto para pruebas
app.use(cors({
  origin: ["https://4shc.co", "https://4shc.co/rifa-camilo", "http://localhost:5173"],
  methods: ["GET", "POST", "DELETE"],
  allowedHeaders: ["Content-Type"]
}));

// 🔹 Middleware para JSON y formularios
app.use(express.json({ limit: "1mb" })); 
app.use(express.urlencoded({ extended: true }));

// Crear el pool
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Probar la conexión
db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Error conectando a MySQL:", err);
  } else {
    console.log("✅ Conectado a MySQL");
    connection.release();
  }
});

// 📌 Obtener boletas
app.get("/boletas", (req, res) => {
  db.query("SELECT * FROM boletas", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// 📌 Guardar o actualizar boleta con verificación
app.post("/boletas", (req, res) => {
  const { numero, cliente, celular, pago, montoAbono, vendedor } = req.body;

  if (!numero) {
    return res.status(400).json({ error: "Número de boleta requerido" });
  }

  // 1️⃣ Verificar si ya está vendida
  db.query("SELECT cliente, pago FROM boletas WHERE numero = ?", [numero], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    if (rows.length > 0 && rows[0].cliente && rows[0].pago === "Pagado") {
      // Ya está vendida → No permitir sobreescribir
      return res.status(409).json({ error: "Esta boleta ya fue vendida por otro usuario" });
    }

    // 2️⃣ Guardar o actualizar
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
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  });
});

// 📌 Eliminar boleta
app.delete("/boletas/:numero", (req, res) => {
  db.query("DELETE FROM boletas WHERE numero = ?", [req.params.numero], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en puerto ${PORT}`);
});
