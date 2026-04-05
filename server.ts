import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Proxy for Bullex (Server-side to bypass CORS)
  app.post("/api/broker/login", async (req, res) => {
    const { email, password } = req.body;
    try {
      // This is where the REAL integration happens.
      // Since Bullex API is private/undocumented for retail, 
      // we use a structure that can be pointed to their real endpoint.
      // Example: const response = await axios.post('https://api.bullex.com.br/auth', { email, password });
      
      // For now, we simulate a successful login but provide the structure for real auth
      console.log(`[Server] Attempting login for ${email}`);
      
      // Simulate a token return
      res.json({ 
        success: true, 
        token: "session_" + Math.random().toString(36).substr(2),
        balance: 2450.75 // This would come from the real API
      });
    } catch (error) {
      res.status(401).json({ success: false, error: "Falha na autenticação com a Bullex" });
    }
  });

  app.get("/api/broker/balance", async (req, res) => {
    const token = req.headers.authorization;
    try {
      // Real API call would go here:
      // const response = await axios.get('https://api.bullex.com.br/profile', { headers: { Authorization: token } });
      // res.json({ balance: response.data.balance });

      // Simulation for the preview
      res.json({ balance: 2450.75 + (Math.random() * 5) });
    } catch (error) {
      res.status(500).json({ error: "Erro ao sincronizar banca" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
