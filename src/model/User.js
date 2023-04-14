const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
    name: String,
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, },
    role: { type: String, required: true, default: "editor", enum: ['admin', 'editor', ] },
    password: { type: String, required: true, },
    img: { type: String, default: '-' },
    color: { type: String, default: '-' },

})
const User = mongoose.model("User", UserSchema);

module.exports = User;