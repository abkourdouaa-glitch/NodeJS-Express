const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getDb } = require('../config/db');

// Collection Name f database
const COLLECTION_NAME = 'products';

// GET all products
router.get('/', async (req, res) => {
    try {
        const db = getDb();
        const products = await db.collection(COLLECTION_NAME).find({}).toArray();
        res.status(200).json(products);
    } catch (err) {
        res.status(500).json({ message: "Erreur lors de la récupération des produits", error: err.message });
    }
});

// GET product by ID
router.get('/:id', async (req, res) => {
    try {
        const db = getDb();
        const id = req.params.id;

        // T'akkad blli l-ID fih structure s7i7a dyal MongoDB ObjectId
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ message: "ID invalide" });
        }

        const product = await db.collection(COLLECTION_NAME).findOne({ _id: new ObjectId(id) });
        if (!product) {
            return res.status(404).json({ message: "Produit introuvable" });
        }
        res.status(200).json(product);
    } catch (err) {
        res.status(500).json({ message: "Erreur", error: err.message });
    }
});

// POST (Create product)
router.post('/', async (req, res) => {
    try {
        const db = getDb();
        const { nom, prix, description, categorie } = req.body;

        const newProduct = {
            nom,
            prix: Number(prix),
            description,
            categorie
        };

        const result = await db.collection(COLLECTION_NAME).insertOne(newProduct);
        
        // N-rejj3o l-produit jdid m3a l-_id dyalo
        res.status(201).json({ _id: result.insertedId, ...newProduct });
    } catch (err) {
        res.status(500).json({ message: "Erreur d'ajout", error: err.message });
    }
});

// PUT (Update product)
router.put('/:id', async (req, res) => {
    try {
        const db = getDb();
        const id = req.params.id;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ message: "ID invalide" });
        }

        const { nom, prix, description, categorie } = req.body;
        const updateData = {};
        if (nom) updateData.nom = nom;
        if (prix) updateData.prix = Number(prix);
        if (description) updateData.description = description;
        if (categorie) updateData.categorie = categorie;

        const result = await db.collection(COLLECTION_NAME).findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: updateData },
            { returnDocument: 'after' } // Bach y-rejje3 l-version jdida m-modyfya
        );

        // MongoClient jdid kirejje3 l-document direct f result
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ message: "Erreur de modification", error: err.message });
    }
});

// DELETE product
router.delete('/:id', async (req, res) => {
    try {
        const db = getDb();
        const id = req.params.id;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ message: "ID invalide" });
        }

        const result = await db.collection(COLLECTION_NAME).deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Produit introuvable" });
        }

        res.status(200).json({ message: "Produit supprimé avec succès" });
    } catch (err) {
        res.status(500).json({ message: "Erreur de suppression", error: err.message });
    }
});

module.exports = router;