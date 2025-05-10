const mongoose = require('mongoose');
const CustomerSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        phone: { type: String, default:'-'},
        address: { type: String, default:'-'},
        img: { type: String,default:'-' },
    },
    {
        timestamps: true
    }
)
const Customer = mongoose.model("Customer", CustomerSchema);
module.exports = Customer;