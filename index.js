import express from "express";
import bcrypt from "bcrypt";
import db from "./db.js";
import bodyParser from "body-parser";
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
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required!" });
  }
  try {
    const userChcekQuery = "SELECT * FROM users WHERE email =$1 OR name = $2";
    const userCheckResult = await db.query(userChcekQuery, [email, name]);
    if (userCheckResult.rows.length > 0) {
      return res.status(400).json({ message: "User alredy exists!" });
    }

    const saltRound = 10;
    const hashedPassword = await bcrypt.hash(password, saltRound);

    const insertUserQuery =
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id , name, password";

    const newUser = await db.query(insertUserQuery, [
      name,
      email,
      hashedPassword,
    ]);

    res.status(201).json({
      id: newUser.rows[0].id,
      name: newUser.rows[0].name,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error, please try agian later." });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required!" });
  }
  try {
    // Update the query to select the id and password
    const checkDatabaseQuery = "SELECT id, name, password FROM users WHERE email=$1";
    const resultDatabase = await db.query(checkDatabaseQuery, [email]);

    // Check if a user was found
    if (resultDatabase.rows.length === 0) {
      return res.status(400).json({ message: "User does not exist." });
    }

    const user = resultDatabase.rows[0]; // The user row from database
    const storedHashedPassword = user.password;

    // Compare the given password with the stored hashed password
    const isPasswordValid = await bcrypt.compare(password, storedHashedPassword);

    if (isPasswordValid) {
      // Send the userId in the response along with a success message
      return res.status(200).json({
        message: "Login successful",
        id: user.id // Include user ID in the response
      });
    } else {
      return res.status(400).json({ message: "Wrong password" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error, please try again later." });
  }
});


app.post('/submit-stats', (req, res) => {
  const {
    userId,
    name,
    transportationMode,
    distance,
    electricityUsage,
    wasteGenerated,
    gasConsumption,
    carbonFootprint
  } = req.body;

  console.log('Parsed values before DB query:', {
    userId,
    name,
    transportationMode,
    distance,
    electricityUsage,
    wasteGenerated,
    gasConsumption,
    carbonFootprint
  });
  if (!userId || !name) {
    return res.status(400).json({ error: 'User ID and Name are required.' });
  }

  // Convert values to their appropriate types and handle NaN cases
  const parsedDistance = isNaN(parseFloat(distance)) ? null : parseFloat(distance);
  const parsedElectricityUsage = isNaN(parseFloat(electricityUsage)) ? null : parseFloat(electricityUsage);
  const parsedWasteGenerated = isNaN(parseFloat(wasteGenerated)) ? null : parseFloat(wasteGenerated);
  const parsedGasConsumption = isNaN(parseFloat(gasConsumption)) ? null : parseFloat(gasConsumption);
  const parsedUserId = isNaN(parseInt(userId, 10)) ? null : parseInt(userId, 10);
  const parsedCarbonFootprint = isNaN(parseFloat(carbonFootprint)) ? null : parseFloat(carbonFootprint);

  // Prepare the query and values
  const query = `
    INSERT INTO data (
      name, transportmode, distance, electricity, waste, gas, userid, carbonfootprint
    ) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `;
  const values = [
    name,
    transportationMode || null,
    parsedDistance,
    parsedElectricityUsage,
    parsedWasteGenerated,
    parsedGasConsumption,
    parsedUserId,
    parsedCarbonFootprint
  ];
  console.log(values)
  // Execute the query
  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Database error:', err.message, err.stack);
      return res.status(500).json({ error: 'Database error.', details: err.message });
    }
    console.log('Database result:', result);
    res.status(200).json({ message: 'Data submitted successfully!', data: result });
  });
});



// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
