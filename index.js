require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app); // Necesario para Socket.IO

// Configuración de CORS
const allowedOrigins = [
  "https://4shc.co",
  "https://4shc.co/rifa-camilo",
  "http://localhost:5173"
];

const io = new Server(server, {
  cors: { origin: allowedOrigins }
});

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Conexión MySQL con Pool
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Probar conexión
db.getConnection((err, connection) => {
  if (err) console.error("❌ Error conectando a MySQL:", err);
  else {
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

// 📌 Guardar/actualizar boleta con bloqueo
app.post("/boletas", (req, res) => {
  const { numero, cliente, celular, pago, montoAbono, vendedor } = req.body;
  if (!numero) return res.status(400).json({ error: "Número de boleta requerido" });

  // Verificar si ya está vendida
  db.query("SELECT cliente, pago FROM boletas WHERE numero = ?", [numero], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    if (rows.length > 0 && rows[0].cliente && rows[0].pago === "Pagado") {
      return res.status(409).json({ error: "Esta boleta ya fue vendida por otro usuario" });
    }

    // Guardar o actualizar
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

      // 🔹 Emitir evento a todos los clientes conectados
      io.emit("boletaActualizada", { numero, cliente, celular, pago, montoAbono, vendedor });

      res.json({ success: true });
    });
  });
});

// 📌 Eliminar boleta
app.delete("/boletas/:numero", (req, res) => {
  db.query("DELETE FROM boletas WHERE numero = ?", [req.params.numero], (err) => {
    if (err) return res.status(500).json({ error: err.message });

    // 🔹 Notificar a todos que se eliminó
    io.emit("boletaEliminada", req.params.numero);

    res.json({ success: true });
  });
});

// Socket.IO conexión
io.on("connection", (socket) => {
  console.log("🔌 Usuario conectado:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Usuario desconectado:", socket.id);
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en puerto ${PORT}`);
});


// Verificar código de autorización
app.post("/verificar-codigo", (req, res) => {
  console.log("Código recibido:", req.body.codigo);
  console.log("Código esperado:", process.env.DELETE_CODE);

  if (req.body.codigo?.trim() === process.env.DELETE_CODE.trim()) {
    return res.json({ valido: true });
  }
  res.status(401).json({ valido: false, error: "Código incorrecto" });
});