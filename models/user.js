import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  firstname: String,
  lastname: String,
  email: String,
  phone: Number,
  password: String
});

const User = mongoose.model("User", UserSchema, "Users");

export default User;