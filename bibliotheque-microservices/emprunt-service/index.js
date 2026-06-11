import express from 'express';
import { MongoClient } from 'mongodb';
import axios from 'axios';

const app = express();
app.use(express.json());

const url = 'mongodb://127.0.0.1:27017';
const dbName = 'bibliotheque_emprunts';
let db, empruntsCollection, countersCollection;

const LIVRE_SERVICE = 'http://localhost:3001';
const MEMBRE_SERVICE = 'http://localhost:3002';

async function initDB() {
    const client = await MongoClient.connect(url);
    db = client.db(dbName);
    empruntsCollection = db.collection('emprunts');
    countersCollection = db.collection('counters');
    console.log('Connected to MongoDB: bibliotheque_emprunts');
}
await initDB();

async function getNextSequenceValue(sequenceName) {
    const sequenceDocument = await countersCollection.findOneAndUpdate(
        { _id: sequenceName },
        { $inc: { sequence_value: 1 } },
        { upsert: true, returnDocument: 'after' }
    );
    return sequenceDocument.sequence_value;
}

// Routes
app.get('/emprunts', async (req, res) => {
    const emprunts = await empruntsCollection.find({}).toArray();
    res.json(emprunts);
});

app.get('/emprunts/en-cours', async (req, res) => {
    const emprunts = await empruntsCollection.find({ retourne: false }).toArray();
    res.json(emprunts);
});

app.get('/emprunts/membre/:idMembre', async (req, res) => {
    const emprunts = await empruntsCollection.find({ idMembre: parseInt(req.params.idMembre) }).toArray();
    res.json(emprunts);
});

// LOGIQUE POST /emprunts
app.post('/emprunts', async (req, res) => {
    const { idMembre, idLivre } = req.body;

    try {
        // 1. Vérifier membre
        let membre;
        try {
            const mRes = await axios.get(`${MEMBRE_SERVICE}/membres/${idMembre}`);
            membre = mRes.data;
        } catch (err) {
            if (err.response?.status === 404) return res.status(404).json({ message: "Membre inexistant" });
            throw err;
        }
        if (!membre.actif) return res.status(400).json({ message: "Membre inactif" });

        // 2. Vérifier livre
        let livre;
        try {
            const lRes = await axios.get(`${LIVRE_SERVICE}/livres/${idLivre}`);
            livre = lRes.data;
        } catch (err) {
            if (err.response?.status === 404) return res.status(404).json({ message: "Livre inexistant" });
            throw err;
        }
        if (!livre.disponible) return res.status(400).json({ message: "Livre non disponible" });

        // 3. Créer l'emprunt
        const nextId = await getNextSequenceValue('empruntId');
        const newEmprunt = {
            id: nextId,
            idMembre: parseInt(idMembre),
            idLivre: parseInt(idLivre),
            nomMembre: membre.nom,
            titreLivre: livre.titre,
            dateEmprunt: new Date().toISOString(),
            dateRetour: null,
            retourne: false
        };
        await empruntsCollection.insertOne(newEmprunt);

        // 4. Mettre à jour la disponibilité du livre
        await axios.patch(`${LIVRE_SERVICE}/livres/${idLivre}/disponibilite`, { disponible: false });

        return res.status(201).json(newEmprunt);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la création de l'emprunt" });
    }
});

// LOGIQUE PATCH /emprunts/:id/retour
app.patch('/emprunts/:id/retour', async (req, res) => {
    const id = parseInt(req.params.id);

    try {
        // 1. Retrouver l'emprunt
        const emprunt = await empruntsCollection.findOne({ id });
        if (!emprunt) return res.status(404).json({ message: "Emprunt non trouvé" });

        // 2. Vérifier si déjà retourné
        if (emprunt.retourne) return res.status(400).json({ message: "Livre déjà retourné" });

        // 3. Mettre à jour l'emprunt
        await empruntsCollection.updateOne(
            { id },
            { $set: { retourne: true, dateRetour: new Date().toISOString() } }
        );

        // 4. Repasser disponible à true dans livre-service
        await axios.patch(`${LIVRE_SERVICE}/livres/${emprunt.idLivre}/disponibilite`, { disponible: true });

        res.json({ message: "Retour enregistré avec succès" });

    } catch (error) {
        res.status(500).json({ message: "Erreur lors du retour" });
    }
});

app.delete('/emprunts/:id', async (req, res) => {
    const result = await empruntsCollection.deleteOne({ id: parseInt(req.params.id) });
    if (result.deletedCount === 0) return res.status(404).json({ message: "Emprunt non trouvé" });
    res.json({ message: "Emprunt supprimé" });
});

app.listen(3003, () => console.log('Emprunt Service running on port 3003'));