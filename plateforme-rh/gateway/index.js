import express from 'express';
import axios from 'axios';

const app = express();
app.use(express.json());

const OFFRE_SERVICE = 'http://localhost:3001';
const CANDIDATURE_SERVICE = 'http://localhost:3002';

app.get('/offres', async (req, res) => {
    const r = await axios.get(`${OFFRE_SERVICE}/offres`);
    res.json(r.data);
});
app.get('/offres/:id', async (req, res) => {
    const r = await axios.get(`${OFFRE_SERVICE}/offres/${req.params.id}`);
    res.json(r.data);
});
app.post('/offres', async (req, res) => {
    const r = await axios.post(`${OFFRE_SERVICE}/offres`, req.body);
    res.status(201).json(r.data);
});



app.get('/candidatures', async (req, res) => {
    const r = await axios.get(`${CANDIDATURE_SERVICE}/candidatures`);
    res.json(r.data);
});
app.get('/candidatures/offre/:id', async (req, res) => {
    const r = await axios.get(`${CANDIDATURE_SERVICE}/candidatures/offre/${req.params.id}`);
    res.json(r.data);
});
app.post('/candidatures', async (req, res) => {
    const r = await axios.post(`${CANDIDATURE_SERVICE}/candidatures`, req.body);
    res.status(201).json(r.data);
});

app.listen(3000, () => console.log('Gateway running on port 3000'));