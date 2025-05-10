
const Order = require('../model/Order.js');
const Customer = require('../model/Customer.js');
const getIndex = async (req, res) => {
    try {
        const totalCustomers = await Customer.countDocuments();
        const totalOrders = await Order.countDocuments();
        const totalPaidOrders = await Order.countDocuments({ isPaid: true });
        res.status(200).json({ msg: 'success', totalCustomers: totalCustomers, totalOrders: totalOrders, totalPaidOrders: totalPaidOrders, });
    } catch (error) {
        res.status(500).json({ err: 'error', });
    }
}
module.exports = {
    getIndex,
}

