require('dotenv').config();
const express = require('express');
const datastore = require('nedb-promises');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();
const db = datastore.create('tickets.db');
const usuarios = [
    { 
        user: process.env.ADMIN_USER, 
        pass: process.env.ADMIN_PASS, 
        role: 1 
    },
    { 
        user: process.env.EMPLOY_USER, 
        pass: process.env.EMPLOY_PASS, 
        role: 3 
    },
    { 
        user: process.env.ADMIN_MANAGER_USER, 
        pass: process.env.ADMIN_MANAGER_PASS, 
        role: 2 
    }
];

app.use(cors());
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
const SECRET_KEY=process.env.JWT_SECRET;

const verificarToken = (req, res, next) => {
    let token = req.headers['authorization'];
    
    if (!token) return res.status(403).json({ mensaje: "Acceso denegado." });

    if (token.startsWith('Bearer ')) {
        token = token.slice(7, token.length);
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ mensaje: "Token inválido." });
        req.user = decoded;
        next(); 
    });
};

app.post('/api/login', (req, res) => {
    const { user, pass } = req.body; 
    
    const usuarioEncontrado = usuarios.find(u => u.user === user && u.pass === pass);

    if (usuarioEncontrado) {
        
        const token = jwt.sign(
            { user: usuarioEncontrado.user, role: usuarioEncontrado.role }, 
            SECRET_KEY, 
            { expiresIn: '4h' }
        );
        
        res.json({ success: true, token, role: usuarioEncontrado.role });
    } else {
        
        res.status(401).json({ success: false, mensaje: "Credenciales incorrectas" });
    }
});

const autorizarRol = (rolRequerido) => {
    return (req, res, next) => {
       
        if (req.user.role !== rolRequerido && req.user.role !== 1) { 
            return res.status(403).json({ mensaje: "No tienes permisos para esta área." });
        }
        next();
    };
};

app.post('/api/tickets', async (req, res) => {
    try {
        const nuevoTicket = {
            ...req.body,
            estado: 'Pendiente',
            fecha: new Date().toLocaleString()
        };
        const ticketGuardado = await db.insert(nuevoTicket);
        res.json(ticketGuardado);
    } catch (error) {
        res.status(500).json({ error: "Error al crear el ticket" });
    }
});

app.get('/api/tickets', verificarToken, async (req, res) => {
   try {
       
        if (req.user.role === 1 || req.user.role === 2) {
            const todos = await db.find({}).sort({ fecha: -1 });
            res.json(todos);
        } else {

            res.status(403).json({ mensaje: "Permisos insuficientes para ver reportes" });
        }
    } catch (error) {
        res.status(500).json({ error: "Error al consultar la base de datos" });
    }
});

app.post('/api/tickets/:id/notas', verificarToken, autorizarRol(1), async (req, res) => {
    try {
        const { nota } = req.body;
        const fechaNota = new Date().toLocaleString();

        if (!nota) return res.status(400).json({ error: "La nota no puede estar vacía" });

        await db.update(
            { _id: req.params.id }, 
            { $push: { notas: { texto: nota, fecha: fechaNota } } }
        );
        
        res.json({ success: true, mensaje: "Nota agregada" });
    } catch (error) {
        console.error("Error en servidor al guardar nota:", error);
        res.status(500).json({ error: "Error interno al guardar la nota" });
    }
});

app.patch('/api/tickets/:id', verificarToken, async (req, res) => {
    try {
        const { estado } = req.body;
        const updateData = { estado };

        if (estado === 'En Proceso') {
            updateData.fechaInicio = new Date().toLocaleString();
        }

        await db.update({ _id: req.params.id }, { $set: updateData });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar estado" });
    }
});
app.patch('/api/tickets/:id/finalizar', verificarToken, async (req, res) => {
    try {
        const { solucion, causa } = req.body;
        const fechaCierre = new Date().toLocaleString();

        await db.update(
            { _id: req.params.id }, 
            { 
                $set: { 
                    estado: 'Resuelto', 
                    solucion: solucion,
                    causaRaiz: causa, 
                    fechaCierre: fechaCierre 
                } 
            }
        );
        res.json({ success: true, mensaje: "Ticket cerrado con éxito" });
    } catch (error) {
        console.error("Error al finalizar:", error);
        res.status(500).json({ error: "Error al finalizar el ticket" });
    }
});
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
}
