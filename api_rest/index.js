const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
app.use(express.json());

const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017';
const client = new MongoClient(MONGO_URL);

let db;

async function connectDB() {
    try {
        await client.connect();
        db = client.db('bdmonapi'); 
        console.log("Connecté avec succès à MongoDB via Docker !");
    } catch (err) {
        console.error("Erreur de connexion MongoDB:", err);
    }
}
connectDB();

// Route 
app.get('/equipes', async (req, res) => {
    try {
        const equipes = await db.collection('equipes').find({}).toArray();
        res.json(equipes);
    } catch (err) {
        res.status(500).json({ error: "Erreur lors de la récupération des équipes" });
    }
});

app.listen(3000, () => {
    console.log("Application démarrée sur le port 3000");
});