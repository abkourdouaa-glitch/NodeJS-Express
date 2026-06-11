import express from 'express';
import { MongoClient } from 'mongodb';

const app = express();
app.use(express.json());

const url = 'mongodb://127.0.0.1:27017';
const dbName = 'bibliotheque_membres';
let db, membresCollection, countersCollection;

async function initDB() {
    const client = await MongoClient.connect(url);
    db = client.db(dbName);
    membresCollection = db.collection('membres');
    countersCollection = db.collection('counters');

    await membresCollection.createIndex({ email: 1 }, { unique: true });
    console.log('Connected to MongoDB: bibliotheque_membres');
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
app.get('/membres', async (req, res) => {
    const membres = await membresCollection.find({}).toArray();
    res.json(membres);
});

app.get('/membres/:id', async (req, res) => {
    const membre = await membresCollection.findOne({ id: parseInt(req.params.id) });
    if (!membre) return res.status(404).json({ message: "Membre non trouvé" });
    res.json(membre);
});

app.post('/membres', async (req, res) => {
    try {
        const { nom, email } = req.body;
        const nextId = await getNextSequenceValue('membreId');
        const newMembre = { id: nextId, nom, email, actif: true };
        await membresCollection.insertOne(newMembre);
        res.status(201).json(newMembre);
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ message: "Email déjà utilisé" });
        res.status(500).json({ message: "Erreur serveur" });
    }
});

app.put('/membres/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const { nom, email, actif } = req.body;
    try {
        const result = await membresCollection.replaceOne(
            { id: id },
            { id, nom, email, actif: actif ?? true }
        );
        if (result.matchedCount === 0) return res.status(404).json({ message: "Membre non trouvé" });
        res.json({ message: "Membre remplacé avec succès" });
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ message: "Email déjà utilisé" });
        res.status(500).json({ message: "Erreur" });
    }
});

app.patch('/membres/:id/statut', async (req, res) => {
    const id = parseInt(req.params.id);
    const { actif } = req.body;
    const result = await membresCollection.updateOne(
        { id: id },
        { $set: { actif } }
    );
    if (result.matchedCount === 0) return res.status(404).json({ message: "Membre non trouvé" });
    res.json({ message: "Statut membre mis à jour" });
});

app.delete('/membres/:id', async (req, res) => {
    const result = await membresCollection.deleteOne({ id: parseInt(req.params.id) });
    if (result.deletedCount === 0) return res.status(404).json({ message: "Membre non trouvé" });
    res.json({ message: "Membre supprimé" });
});

app.listen(3002, () => console.log('Membre Service running on port 3002'));