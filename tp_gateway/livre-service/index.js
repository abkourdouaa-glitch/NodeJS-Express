import express from 'express';
import { MongoClient } from 'mongodb';

const app = express();
app.use(express.json());

const url = 'mongodb://127.0.0.1:27017';
const dbName = 'bibliotheque_livres';
let db, livresCollection, countersCollection;

// Connexion MongoDB
async function initDB() {
    const client = await MongoClient.connect(url);
    db = client.db(dbName);
    livresCollection = db.collection('livres');
    countersCollection = db.collection('counters');
    console.log('Connected to MongoDB: bibliotheque_livres');
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
app.get('/livres', async (req, res) => {
    const livres = await livresCollection.find({}).toArray();
    res.json(livres);
});

app.get('/livres/disponibles', async (req, res) => {
    const livres = await livresCollection.find({ disponible: true }).toArray();
    res.json(livres);
});

app.get('/livres/:id', async (req, res) => {
    const livre = await livresCollection.findOne({ id: parseInt(req.params.id) });
    if (!livre) return res.status(404).json({ message: "Livre non trouvé" });
    res.json(livre);
});

app.post('/livres', async (req, res) => {
    const { titre, auteur, isbn } = req.body;
    const nextId = await getNextSequenceValue('livreId');
    const newLivre = { id: nextId, titre, auteur, isbn, disponible: true };
    await livresCollection.insertOne(newLivre);
    res.status(201).json(newLivre);
});

app.put('/livres/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const { titre, auteur, isbn, disponible } = req.body;
    const result = await livresCollection.replaceOne(
        { id: id },
        { id, titre, auteur, isbn, disponible: disponible ?? true }
    );
    if (result.matchedCount === 0) return res.status(404).json({ message: "Livre non trouvé" });
    res.json({ message: "Livre remplacé avec succès" });
});

app.patch('/livres/:id/disponibilite', async (req, res) => {
    const id = parseInt(req.params.id);
    const { disponible } = req.body;
    const result = await livresCollection.updateOne(
        { id: id },
        { $set: { disponible } }
    );
    if (result.matchedCount === 0) return res.status(404).json({ message: "Livre non trouvé" });
    res.json({ message: "Disponibilité mise à jour" });
});

app.delete('/livres/:id', async (req, res) => {
    const result = await livresCollection.deleteOne({ id: parseInt(req.params.id) });
    if (result.deletedCount === 0) return res.status(404).json({ message: "Livre non trouvé" });
    res.json({ message: "Livre supprimé" });
});

app.listen(3001, () => console.log('Livre Service running on port 3001'));