const mongoose = require('mongoose');
const OrderSchema = new mongoose.Schema(
    {
        cusId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        editedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        paidBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        isPaid: { type: Boolean, },
        date: { type: String, default: '-' },
        payDate: { type: String, default: '-' },
        products: [
            {
                name: { type: String, default: '-' },
                price: { type: Number, default: 0 },
                qty: { type: Number, default: 0 },
                type: { type: String, default: '-' },
                img: { type: String, default: '-' },
            }
        ],
        img: { type: String, default: '-' },
        nid: { type: String, default: '-' },
        fingerprint: { type: String, default: '-' },
    },
    {
        timestamps: true
    }
)
const Order = mongoose.model("Order", OrderSchema);
module.exports = Order;