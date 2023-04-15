const Order = require('../model/Order.js')
const fs = require("fs");
const createOrder = async (req, res) => {
    const file = req.file?.path.replace("public", "").split("\\").join("/");
    console.log(req.query)
    try {
        const order = await new Order({
            cusId: req.body.cusId,
            createdBy: req.query.requesterId,
            isPaid: false,
            date: req.body.date,
            products: JSON.parse(req.body.products),
            img: file
        })
        await order.save()
        res.status(200).json({ msg: 'success', order: order })
    } catch (error) {
        res.status(500).json({ err: 'error' })
    }
}

const getOrder = async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.orderId })
            .populate('cusId', ' name img phone address')
            .populate('createdBy', 'role name img')
            .populate('editedBy', 'role name img')
            .populate('paidBy', 'role name img')

        if (order) {
            res.status(200).json({ msg: 'success', order: order })
        } else {
            res.status(404).json({ err: 'notFound', })
        }
    } catch (error) {
        res.status(500).json({ err: 'error' })
    }
}
const payOrder = async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.orderId })
        if (order) {
            order.paidBy = req.query.requesterId;
            order.isPaid = true;
            await order.save()
            const orderFinal = await Order.findOne({ _id: req.params.orderId })
                .populate('cusId', ' name img phone')
                .populate('createdBy', 'role name img')
                .populate('editedBy', 'role name img')
                .populate('paidBy', 'role name img')
            res.status(200).json({ msg: 'success', order: orderFinal })
        } else {
            res.status(404).json({ err: 'notFound', })
        }
    } catch (error) {
        res.status(500).json({ err: 'error' })
    }
}
const updateOrder = async (req, res) => {
    const file = req?.file?.path.replace("public", "").split("\\").join("/");
    try {
        const order = await Order.findOne({ _id: req.params.orderId })
        if (order) {
            if (order?.isPaid !== true) {
                order.products = JSON.parse(req.body.products);
                order.editedBy = req.query.requesterId;
                order.date = req.body.date;
                if (req.file) {
                    fs.unlink("./public" + order.img, (err) => {
                        console.log(err);
                    })
                    order.img = file;
                }
                await order.save()
                const orderFinal = await Order.findOne({ _id: req.params.orderId })
                    .populate('cusId', ' name img phone')
                    .populate('createdBy', 'role name img')
                    .populate('editedBy', 'role name img')
                    .populate('paidBy', 'role name img')
                res.status(200).json({ msg: 'success', order: orderFinal })
            } else {
                res.status(200).json({ err: 'You can not edit an order which is paid' })
            }
        } else {
            res.status(404).json({ err: 'notFound', })
        }
    } catch (error) {
        res.status(500).json({ err: 'error' })
    }
}
const deleteOrder = async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.orderId })
        if (order) {
            fs.unlink("./public" + order.img, (err) => {
                console.log(err);
            })
            await Order.deleteOne({ _id: req.params.orderId })
            res.status(200).json({ msg: 'success' })
        } else {
            res.status(404).json({ err: 'notFound', })
        }
    } catch (error) {
        res.status(500).json({ err: 'error' })
    }
}
module.exports = {
    createOrder,
    getOrder,
    payOrder,
    updateOrder,
    deleteOrder,
}