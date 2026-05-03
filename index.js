import express from 'express';
import 'dotenv/config';
import mongoose from 'mongoose';
import userRoutes from "./routes/userRoutes.js";



console.log(process.env.MONGO_URL);
mongoose.connect(process.env.MONGO_URL).then(() => {
console.log('Connected to MongoDB');
}) .catch(err => {
console.error('Initial connection error:', err);
});

const app = express();
app.use(express.static("public"));
app.use(express.json());      
app.use(express.urlencoded({ extended: true }));
const hostname = "127.0.0.1";
const port = 3000;
app.use("/user",userRoutes)


app.listen(port, () =>
    console.log(`Server running at http://${hostname}:${port}/`));



