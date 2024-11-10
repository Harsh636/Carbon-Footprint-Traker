import express from 'express';
import bcrypt from 'bcrypt';
import db from './db.js';
import bodyParser from 'body-parser';
import dotenv from "dotenv";
import cors from "cors";
const app = express();
dotenv.config();
const port = process.env.PORT || 5000;

// Middleware to parse JSON requests
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: false }));
app.use(express.json()); // Parse JSON bodies
app.use(cors());
db.connect();
// Basic route
app.post('/register', async (req, res)=>{
    const {name, email, password} = req.body;
    if (!name || !email || !password){
        return res.status(400).json({message: 'All fields are required!'});
    }
    try{
        const userChcekQuery = 'SELECT * FROM users WHERE email =$1 OR name = $2';
        const userCheckResult = await db.query(userChcekQuery, [email, name]);
        if (userCheckResult.rows.length > 0){
            return res.status(400).json({message: 'User alredy exists!'});
        }

        const saltRound = 10;
        const hashedPassword = await bcrypt.hash(password, saltRound);

        const insertUserQuery = 'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id , name, password';

        const newUser = await db.query(insertUserQuery, [name, email, hashedPassword]);

        res.status(201).json({
            id: newUser.rows[0].id,
            name: newUser.rows[0].name
        });
    } catch (error){
        console.error(error);
        res.status(500).json({message: 'Server error, please try agian later.'});
    }
});

app.post('/login', async(req, res)=>{
    const {email, password} = req.body;
    if (!email || !password){
        return res.status(400).json({message: 'All fields are required!'});
    }
    try{
    const checkDatabaseQuery = 'SELECT name, password FROM users WHERE email=$1';
    const resultDatabase = await db.query(checkDatabaseQuery,[email]);
    if (resultDatabase.rows[0].length===0){
        return res.status(400).json({message: 'User does not exist.'});
    }
    const user = resultDatabase.rows[0]; // The user row from database
    const storedHashedPassword = user.password;
    const isPasswordValid = await bcrypt.compare(password, storedHashedPassword);
        
        if (isPasswordValid) {
            return res.status(200).json({ message: 'Login successful' });
        } else {
            return res.status(400).json({ message: 'Wrong password' });
        }
    } catch (error){
        console.error(error);
        res.status(500).json({message: 'Server error, please try agian later.'});
    }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
