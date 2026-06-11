const express = require('express');
const { MongoClient } = require('mongodb');
const router = express.Router();

const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017';
const client = new MongoClient(MONGO_URL); 

let db;
client.connect().then(() => {
    db = client.db('bdmonapi');
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await db.collection('users').findOne({ username, password });
        if (user) {
            res.json({ message: "Connexion réussie !" });
        } else {
            res.status(401).json({ error: "Identifiants incorrects" });
        }
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

module.exports = router;