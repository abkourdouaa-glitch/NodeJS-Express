const { MongoClient } = require('mongodb');

const url = 'mongodb://127.0.0.1:27017';
const client = new MongoClient(url);

const dbName = 'boutiqueDB';
let db;

async function connectDB() {
    try {
        await client.connect();
        console.log('Connexion réussie à MongoDB via MongoClient!');
        db = client.db(dbName);
    } catch (err) {
        console.error('Erreur de connexion à MongoDB:', err);
        process.exit(1);
    }
}

function getDb() {
    if (!db) {
        throw new Error('Database non initialisée!');
    }
    return db;
}

module.exports = { connectDB, getDb };