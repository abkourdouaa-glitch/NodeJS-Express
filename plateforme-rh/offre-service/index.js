import express from 'express';
import { MongoClient } from 'mongodb';
import amqp from 'amqplib';

const app = express();
app.use(express.json());

const url = 'mongodb://127.0.0.1:27017';
let db, offresCollection, countersCollection;

async function initDB() {
    const client = await MongoClient.connect(url);
    db = client.db('rh_offres');
    offresCollection = db.collection('offres');
    countersCollection = db.collection('counters');
    console.log('Connected to MongoDB: rh_offres');
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
        const channel = await connection.createChannel();
        const queue = 'nouvelle_candidature';

        await channel.assertQueue(queue, { durable: false });
        console.log(`[RabbitMQ] Waiting for messages in queue: ${queue}`);

        channel.consume(queue, async (msg) => {
            if (msg !== null) {
                const data = JSON.parse(msg.content.toString());
                console.log("[RabbitMQ] Message reçu :", data);

                if (data.action === 'NOUVELLE_CANDIDATURE') {
                    await offresCollection.updateOne(
                        { id: parseInt(data.idOffre) },
                        { $inc: { nbCandidatures: 1 } }
                    );
                    console.log(`Offre ${data.idOffre} : nbCandidatures + 1`);
                }
                channel.ack(msg); 
            }
        });
    } catch (err) {
        console.error("RabbitMQ connection error f offre-service:", err);
    }
}

// Routes
app.get('/offres', async (req, res) => {
    const offres = await offresCollection.find({}).toArray();
    res.json(offres);
});

app.get('/offres/:id', async (req, res) => {
    const offre = await offresCollection.findOne({ id: parseInt(req.params.id) });
    if (!offre) return res.status(404).json({ message: "Offre non trouvée" });
    res.json(offre);
});

app.post('/offres', async (req, res) => {
    const { titre, description, statut } = req.body;
    const nextId = await getNextSequenceValue('offreId');
    const newOffre = { id: nextId, titre, description, statut, nbCandidatures: 0 };
    await offresCollection.insertOne(newOffre);
    res.status(201).json(newOffre);
});

// Start
await initDB();
await connectRabbitMQ();
app.listen(3001, () => console.log('Offre Service running on port 3001'));