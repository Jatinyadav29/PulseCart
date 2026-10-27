import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
  },
  { timestamps: true },
);

userSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this._id.toString(),
    username: this.username,
    email: this.email,
    createdAt: this.createdAt,
  };
};

export const User = mongoose.model("User", userSchema);
