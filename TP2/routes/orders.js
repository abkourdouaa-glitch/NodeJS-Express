const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getDb } = require('../config/db');

const COLLECTION_NAME = 'orders';

// GET all orders (with Manual Populate)
router.get('/', async (req, res) => {
        try {
            const db = getDb();
            const orders = await db.collection(COLLECTION_NAME).find({}).toArray();
            res.status(200).json(orders);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
});

// GET order by ID
router.get('/:id', async (req, res) => {
        try {
            const db = getDb();
            const id = req.params.id;
    
            if (!ObjectId.isValid(id)) {
                return res.status(400).json({ message: "ID invalide" });
            }
    
            const order = await db.collection(COLLECTION_NAME).findOne({ _id: new ObjectId(id) });
            if (!order) return res.status(404).json({ message: "Commande introuvable" });
            
            res.status(200).json(order);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
});

// POST (Create order)
router.post('/', async (req, res) => {
    try {
        const db = getDb();
        const { id_utilisateur, id_produit, quantite, statut } = req.body;

        if (!ObjectId.isValid(id_utilisateur) || !ObjectId.isValid(id_produit)) {
            return res.status(400).json({ message: "Les IDs utilisateur ou produit sont invalides" });
        }

        const newOrder = {
            id_utilisateur: new ObjectId(id_utilisateur),
            id_produit: new ObjectId(id_produit),
            quantite: Number(quantite),
            statut: statut || 'En attente',
            date: new Date()
        };

        const result = await db.collection(COLLECTION_NAME).insertOne(newOrder);
        res.status(201).json({ _id: result.insertedId, ...newOrder });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT (Update order)
router.put('/:id', async (req, res) => {
    try {
        const db = getDb();
        const id = req.params.id;

        if (!ObjectId.isValid(id)) return res.status(400).json({ message: "ID invalide" });

        const { id_utilisateur, id_produit, quantite, statut } = req.body;
        const updateData = {};
        
        if (id_utilisateur && ObjectId.isValid(id_utilisateur)) updateData.id_utilisateur = new ObjectId(id_utilisateur);
        if (id_produit && ObjectId.isValid(id_produit)) updateData.id_produit = new ObjectId(id_produit);
        if (quantite) updateData.quantite = Number(quantite);
        if (statut) updateData.statut = statut;

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

// DELETE order
router.delete('/:id', async (req, res) => {
    try {
        const db = getDb();
        const id = req.params.id;

        if (!ObjectId.isValid(id)) return res.status(400).json({ message: "ID invalide" });

        const result = await db.collection(COLLECTION_NAME).deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) return res.status(404).json({ message: "Commande introuvable" });

        res.status(200).json({ message: "Commande supprimée" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;