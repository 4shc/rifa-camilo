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

// ✅ Usar pool para conexiones estables
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10, // hasta 10 conexiones simultáneas
  queueLimit: 0
});

db.connect((err) => {
  if (err) {
    console.error("❌ Error conectando a MySQL:", err);
    return;
  }
  console.log("✅ Conectado a MySQL");
});

// 📌 Obtener boletas
app.get("/boletas", (req, res) => {
  console.log("📌 Petición recibida en /boletas");

  db.query("SELECT * FROM boletas", (err, results) => {
    if (err) {
      console.error("❌ Error en consulta MySQL:", err);
      return res.status(500).json({ error: err.message });
    }
    console.log("✅ Resultados enviados:", results.length);
    res.json(results);
  });
});

// 📌 Guardar o actualizar boleta
app.post("/boletas", (req, res) => {
  console.log("📌 Datos recibidos en POST /boletas:", req.body);

  const { numero, cliente, celular, pago, montoAbono, vendedor } = req.body;

  if (!numero) {
    return res.status(400).json({ error: "Número de boleta requerido" });
  }

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
    if (err) {
      console.error("❌ Error guardando boleta:", err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true });
  });
});

// 📌 Eliminar boleta
app.delete("/boletas/:numero", (req, res) => {
  console.log(`📌 Eliminando boleta ${req.params.numero}`);

  db.query("DELETE FROM boletas WHERE numero = ?", [req.params.numero], (err) => {
    if (err) {
      console.error("❌ Error eliminando boleta:", err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true });
  });
});

// Servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en puerto ${PORT}`);
});
