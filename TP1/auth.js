const jwt = require('jsonwebtoken') 
const bcrypt = require('bcryptjs') 
const users = require('./users.json') 
const SECRET = 'ma_cle_secrete_tres_longue_2024' 
 
const login = (req, res) => { 
    const { email, password } = req.body 
    const user = users.find(u => u.email === email) 
    if (!user) return res.status(401).json({ message: 'Identifiants incorrects' }) 
 
    const ok = bcrypt.compareSync(password, user.password) 
    if (!ok) return res.status(401).json({ message: 'Identifiants incorrects' }) 
 
    const token = jwt.sign({ id: user.id, email: user.email }, SECRET, { expiresIn: 
'24h' }) 
    res.status(200).json({ message: 'Connexion réussie', token }) 
} 


const verifierToken = (req, res, next) => { 
    const authHeader = req.headers['authorization'] 
    if (!authHeader) return res.status(401).json({ message: 'Token manquant' }) 
 
    const token = authHeader.split(' ')[1] 
    try { 
        const decoded = jwt.verify(token, SECRET) 
        req.user = decoded 
        next() 
    } catch (err) { 
        return res.status(403).json({ message: 'Token invalide ou expiré' }) 
    } 
} 
 
module.exports = { login, verifierToken } 