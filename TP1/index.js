const express = require('express')
const app = express();
app.use(express.json());

const { login, verifierToken } = require('./auth') 
const equipes = require('./equipes.json');

app.post('/login', login)

app.get('/equipes', verifierToken, (req,res)=>{
    res.status(200).json(equipes)
})

app.get('/equipes/:id', verifierToken, (req,res)=>{
    const id = parseInt(req.params.id)
    const equipe = equipes.find(equipe => equipe.id === id)
    res.status(200).json(equipe)
})


app.post('/equipes', verifierToken, (req,res)=>{
    equipes.push(req.body)
    res.status(200).json(equipes)
})

app.put('/equipes/:id', verifierToken, (req,res)=>{
    const id = parseInt(req.params.id)
    let equipe = equipes.find(equipe => equipe.id === id)
    equipe.name = req.body.name;
    equipe.country = req.body.country;
    res.status(200).json(equipe)
})

app.delete('/equipes/:id', verifierToken, (req,res)=>{
    const id = parseInt(req.params.id)
    let equipe = equipes.find(equipe => equipe.id === id)
    equipes.splice(equipes.indexOf(equipe),1)
    res.status(200).json(equipes)
})

app.listen(82, ()=> {
    console.log('Rest api via expressJS');
})