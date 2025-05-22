const Order = require('../model/Order.js')
const fs = require("fs");
const createOrder = async (req, res) => {

    try {
        const order = await new Order({
            cusId: req.body.cusId,
            createdBy: req.query.requesterId,
            isPaid: false,
            date: req.body.date,
            products: JSON.parse(req.body.products),
            img: req.files?.img?.[0]?.path.replace("public", "").split("\\").join("/") || '-',
            nid: req.files?.nid?.[0]?.path.replace("public", "").split("\\").join("/") || '-',
            fingerprint: req.files?.fingerprint?.[0]?.path.replace("public", "").split("\\").join("/") || '-',

        })
        await order.save()
        res.status(200).json({ msg: 'success', order: order })
    } catch (error) {
        res.status(500).json({ err: 'error' })
    }
}

const getUnpaidOrders = async (req, res) => {
    const page = req.query.page || 1;

    try {
        const orders = await Order.aggregate([
            {
                $match: {
                    isPaid: false
                },
            },
            {
                $unwind: '$products',
            },
            {
                $addFields: {
                    'products.totalPrice': { $multiply: ['$products.price', '$products.qty'] },
                },
            },
            {
                $lookup: {
                    from: 'users',
                    let: { createdBy: '$createdBy', editedBy: '$editedBy', },
                    pipeline: [
                        { $match: { $expr: { $in: ['$_id', ['$$createdBy', '$$editedBy',]] } } },
                        {
                            $project: {
                                _id: 1,
                                name: 1,
                                img: 1,
                                role: 1,
                            }
                        }
                    ],
                    as: 'users',
                },
            },
            {
                $lookup: {
                    from: 'customers',
                    let: { cusId: '$cusId', },
                    pipeline: [
                        { $match: { $expr: { $in: ['$_id', ['$$cusId']] } } },
                        {
                            $project: {
                                _id: 1,
                                name: 1,
                                img: 1,
                                phone: 1,
                            }
                        }
                    ],
                    as: 'customers',
                },
            },

            {
                $addFields: {
                    createdBy: {
                        $arrayElemAt: [
                            {
                                $filter: {
                                    input: '$users',
                                    cond: { $eq: ['$$this._id', '$createdBy'] }
                                }
                            },
                            0
                        ]
                    },
                    editedBy: {
                        $arrayElemAt: [
                            {
                                $filter: {
                                    input: '$users',
                                    cond: { $eq: ['$$this._id', '$editedBy'] }
                                }
                            },
                            0
                        ]
                    },
                    cusId: {
                        $arrayElemAt: [
                            {
                                $filter: {
                                    input: '$customers',
                                    cond: { $eq: ['$$this._id', '$cusId'] }
                                }
                            },
                            0
                        ]
                    },


                }
            },
            {
                $group: {
                    _id: '$_id',
                    totalPrice: { $sum: '$products.totalPrice' },
                    totalProducts: { $sum: "$products.qty" },
                    products: { $push: "$products" },
                    createdBy: { $first: '$createdBy' },
                    editedBy: { $first: '$editedBy' },
                    cusId: { $first: '$cusId' },
                    date: { $first: '$date' },
                    isPaid: { $first: '$isPaid' },
                },
            },
            {
                $addFields: {
                    createdBy: {
                        _id: '$createdBy._id',
                        name: '$createdBy.name',
                        img: '$createdBy.img',
                        role: '$createdBy.role',
                    },
                    editedBy: {
                        _id: '$editedBy._id',
                        name: '$editedBy.name',
                        img: '$editedBy.img',
                        role: '$editedBy.role',
                    },
                    cusId: {
                        _id: '$cusId._id',
                        name: '$cusId.name',
                        img: '$cusId.img',
                        phone: '$cusId.phone',
                    },


                },
            },
            { $sort: { updatedAt: -1 }, },
            {
                $skip: (page - 1) * 100
            },
            {
                $limit: 100
            },
            {
                $project: {
                    'products.totalPrice': 0,

                },
            },
        ]);
        const totalDocs = await Order.countDocuments({ isPaid: false })
        const pages = Math.ceil(totalDocs / 100);
        if (orders) {
            console.log(orders)
            res.status(200).json({
                msg: 'success',
                pages: pages,
                current: 1,
                orders: orders
            })
        } else {
            res.status(404).json({ err: 'notFound', })
        }
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
            order.payDate = req.body.payDate;
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
    const img = req.files?.img?.[0]?.path.replace("public", "").split("\\").join("/");
    const nid = req.files?.nid?.[0]?.path.replace("public", "").split("\\").join("/");
    const fingerprint = req.files?.fingerprint?.[0]?.path.replace("public", "").split("\\").join("/");
    try {
        const order = await Order.findOne({ _id: req.params.orderId })
        if (order) {
            if (order?.isPaid !== true) {
                order.products = JSON.parse(req.body.products);
                order.editedBy = req.query.requesterId;
                order.date = req.body.date;
                if (img) {
                    fs.unlink("./public" + order.img, (err) => {
                        console.log(err);
                    })
                    order.img = img;
                }
                if (nid) {
                    fs.unlink("./public" + order.nid, (err) => {
                        console.log(err);
                    })
                    order.nid = nid;
                }
                if (fingerprint) {
                    fs.unlink("./public" + order.fingerprint, (err) => {
                        console.log(err);
                    })
                    order.fingerprint = fingerprint;
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
const partialPaidOrder = async (req, res) => {
    const file = req?.file?.path.replace("public", "").split("\\").join("/");
    try {
        const order = await Order.findOne({ _id: req.params.orderId })
        if (order) {
            function filterOut(bigArray, smallArray, key = '_id') {
                const smallSet = new Set(smallArray.map(item => item[key]));
                const newArray = bigArray.map((item) => {
                    const obj = JSON.parse(JSON.stringify(item));
                    return { ...obj, _id: (obj._id).toString() }
                }).filter(item => !smallSet.has(item[key]));
                return newArray;
            }

            if (req.body.products.length == 0) {
                return res.status(500).json({ err: 'No products selected', order: order })
            }
            const newOrder = await new Order({
                cusId: order.cusId,
                createdBy: order.createdBy,
                paidBy: req.query.requesterId,
                isPaid: true,
                payDate: req.body.payDate,
                date: order.date,
                products: req.body.products,
                img: order.img
            })

            order.products = filterOut(order.products, req.body.products);
            await newOrder.save()
            await order.save()
            const orderFinal = await Order.findOne({ _id: req.params.orderId })
                .populate('cusId', ' name img phone')
                .populate('createdBy', 'role name img')
                .populate('editedBy', 'role name img')
                .populate('paidBy', 'role name img')
            return res.status(200).json({ msg: 'success', order: orderFinal, newOrder: newOrder })

        } else {
            res.status(404).json({ err: 'notFound', })
        }
    } catch (error) {
        console.log(error)
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
    getUnpaidOrders,
    payOrder,
    updateOrder,
    deleteOrder,
    partialPaidOrder,
}