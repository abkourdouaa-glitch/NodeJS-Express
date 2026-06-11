import express from 'express';
import { MongoClient } from 'mongodb';
import amqp from 'amqplib';

const app = express();
app.use(express.json());

const url = 'mongodb://127.0.0.1:27017';
let db, candidaturesCollection, countersCollection;
let rabbitChannel;

async function initDB() {
    const client = await MongoClient.connect(url);
    db = client.db('rh_candidatures');
    candidaturesCollection = db.collection('candidatures');
    countersCollection = db.collection('counters');
    console.log('Connected to MongoDB: rh_candidatures');
}

async function getNextSequenceValue(sequenceName) {
    const doc = await countersCollection.findOneAndUpdate(
        { _id: sequenceName },
        { $inc: { sequence_value: 1 } },
        { upsert: true, returnDocument: 'after' }
    );
    return doc.sequence_value;
}

async function connectRabbitMQ() {
    try {
        const connection = await amqp.connect('amqp://localhost');
        rabbitChannel = await connection.createChannel();
        await rabbitChannel.assertQueue('nouvelle_candidature', { durable: false });
        console.log('Connected to RabbitMQ as Publisher');
    } catch (err) {
        console.error("RabbitMQ connection error f candidature-service:", err);
    }
}

// Routes
app.get('/candidatures', async (req, res) => {
    const cands = await candidaturesCollection.find({}).toArray();
    res.json(cands);
});

app.get('/candidatures/offre/:idOffre', async (req, res) => {
    const cands = await candidaturesCollection.find({ idOffre: parseInt(req.params.idOffre) }).toArray();
    res.json(cands);
});

app.post('/candidatures', async (req, res) => {
    const { idOffre, nomCandidat, email, cv } = req.body;
    const nextId = await getNextSequenceValue('candidatureId');
    
    const newCand = { id: nextId, idOffre: parseInt(idOffre), nomCandidat, email, cv };
    await candidaturesCollection.insertOne(newCand);

    // Envoyer le message à RabbitMQ
    const message = {
        idOffre: parseInt(idOffre),
        nomCandidat: nomCandidat,
        action: 'NOUVELLE_CANDIDATURE'
    };
    
    rabbitChannel.sendToQueue('nouvelle_candidature', Buffer.from(JSON.stringify(message)));
    console.log("[RabbitMQ] Message envoyé dans nouvelle_candidature :", message);

    res.status(201).json(newCand);
});

await initDB();
await connectRabbitMQ();
app.listen(3002, () => console.log('Candidature Service running on port 3002'));