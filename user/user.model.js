import mongoose from "mongoose";

// set rule
const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 25,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 25,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true,
    maxlength: 55,
  },
  password: {
    type: String,
    required: true,
    trim: true,
  },
  dob: {
    type: Date,
    required: false,
    default: null,
  },
  gender: {
    type: String,
    required: false,
    default: null,
    trim: true,
    enum: ["male", "female", "other"],
  },
  role: {
    type: String,
    required: true,
    trim: true,
    enum: ["buyer", "seller"],
  },
});

// to remove password field
userSchema.methods.toJSON = function () {
  let obj = this.toObject();
  delete obj.password;
  return obj;
};

// create table
const User = mongoose.model("User", userSchema);

export default User;
