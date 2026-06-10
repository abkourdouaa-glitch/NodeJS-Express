const express = require('express');
const app = express();
const { connectDB } = require('./config/db');

app.use(express.json());

// 1. Branchement de Routes
app.use('/api/products', require('./routes/products'));
app.use('/api/users', require('./routes/users'));
app.use('/api/orders', require('./routes/orders'));

const PORT = 3000;

// 2. Connexion à la BDD avant de lancer le serveur
async function startServer() {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`Serveur démarré avec succès sur le port ${PORT}`);
    });
}

startServer();