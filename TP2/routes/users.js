const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getDb } = require('../config/db');

const COLLECTION_NAME = 'users';

// GET all users
router.get('/', async (req, res) => {
    try {
        const db = getDb();
        const users = await db.collection(COLLECTION_NAME).find({}).toArray();
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET user by ID
router.get('/:id', async (req, res) => {
    try {
        const db = getDb();
        const id = req.params.id;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ message: "ID invalide" });
        }

        const user = await db.collection(COLLECTION_NAME).findOne({ _id: new ObjectId(id) });
        if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });
        
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST (Create user)
router.post('/', async (req, res) => {
    try {
        const db = getDb();
        const { nom, prenom, email, mot_de_passe } = req.body;

        const newUser = { nom, prenom, email, mot_de_passe };
        const result = await db.collection(COLLECTION_NAME).insertOne(newUser);
        
        res.status(201).json({ _id: result.insertedId, ...newUser });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT (Update user)
router.put('/:id', async (req, res) => {
    try {
        const db = getDb();
        const id = req.params.id;

        if (!ObjectId.isValid(id)) return res.status(400).json({ message: "ID invalide" });

        const { nom, prenom, email, mot_de_passe } = req.body;
        const updateData = {};
        if (nom) updateData.nom = nom;
        if (prenom) updateData.prenom = prenom;
        if (email) updateData.email = email;
        if (mot_de_passe) updateData.mot_de_passe = mot_de_passe;

        const result = await db.collection(COLLECTION_NAME).findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: updateData },
            { returnDocument: 'after' }
        );

        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE user
router.delete('/:id', async (req, res) => {
    try {
        const db = getDb();
        const id = req.params.id;

        if (!ObjectId.isValid(id)) return res.status(400).json({ message: "ID invalide" });

        const result = await db.collection(COLLECTION_NAME).deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) return res.status(404).json({ message: "Utilisateur introuvable" });

        res.status(200).json({ message: "Utilisateur supprimé" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;