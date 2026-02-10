import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String },
  username: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true,   
    lowercase: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true 
  },
  role: { 
    type: String, 
    default: "user" 
  },
  password: { 
    type: String,
    default: "GOOGLE_ACCOUNT_NO_PASSWORD" 
  },
  // NEW: Field to track when the password was last updated
  passwordLastChanged: { 
    type: Date, 
    default: Date.now 
  },
  picture: { 
    type: String 
  }
}, { timestamps: true });

export default mongoose.model("User", userSchema);