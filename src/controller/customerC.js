const Customer = require('./../model/Customer.js')
const Order = require('./../model/Order.js')
const fs = require("fs");
const createCustomer = async (req, res) => {
    const file = req.file?.path.replace("public", "").split("\\").join("/");
    try {
        const customer = await new Customer({
            name: req.body.name,
            phone: req.body.phone,
            address: req.body.address,
            img: file,
        })
        await customer.save()
        res.status(200).json({ msg: 'success', customer: customer })
    } catch (error) {
        res.status(500).json({ err: 'error' })
    }
}

const getCustomers = async (req, res) => {
    const page = req.query.page || 1;
    const search = req.query.search || '';
    const getCustomersArray = async (page, search) => {
        const match = {
            name: { $regex: search, $options: "i" }
        }
        if (search !== '') {
            const customers = await Customer.aggregate([
                {
                    $match: match
                },
                {
                    $addFields: {
                        isPaid: true
                    },
                },
                {
                    $project: {
                        img: 1,
                        name: 1,
                        phone: 1,
                        address: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        isPaid: 1,
                    },
                },
            ]);
            const orders = await Order.find({ "products.name": { $regex: search, $options: "i" } });
            const customerIds = orders.map(order => order.cusId);
            const customersFromOrders = await Customer.find({ _id: { $in: customerIds } });
            const customerOrderMap = orders.reduce((acc, order) => {
                if (!acc[order.cusId]) {
                    acc[order.cusId] = {
                        img: null,
                        name: null,
                        phone: null,
                        address: null,
                        createdAt: null,
                        updatedAt: null,
                        orders: [],
                        isPaid: true
                    };
                }
                const customer = customersFromOrders.find(c => c._id.toString() === order.cusId.toString());
                const orderObjs = order.products.map(product => ({
                    name: product.name,
                    price: product.price,
                    qty: product.qty,
                    type: product.type,
                    img: product.img,
                    isPaid: order.isPaid
                }));
                acc[order.cusId].orders = acc[order.cusId].orders.concat(orderObjs);
                acc[order.cusId].isPaid = acc[order.cusId].isPaid && order.isPaid;
                if (customer) {
                    acc[order.cusId].img = customer.img;
                    acc[order.cusId].name = customer.name;
                    acc[order.cusId].phone = customer.phone;
                    acc[order.cusId].address = customer.address;
                    acc[order.cusId].createdAt = customer.createdAt;
                    acc[order.cusId].updatedAt = customer.updatedAt;
                }
                return acc;
            }, {});

            const mergedCustomers = Object.keys(customerOrderMap).map(customerId => {
                const customerOrderInfo = customerOrderMap[customerId];
                return {
                    _id: customerId,
                    img: customerOrderInfo.img,
                    name: customerOrderInfo.name,
                    phone: customerOrderInfo.phone,
                    address: customerOrderInfo.address,
                    createdAt: customerOrderInfo.createdAt,
                    updatedAt: customerOrderInfo.updatedAt,
                    isPaid: customerOrderInfo.isPaid,
                    orders: customerOrderInfo.orders
                };
            });
            const allCustomers = customers.concat(mergedCustomers);
            return allCustomers;

        } else {
            const customers = await Customer.aggregate([
                {
                    $addFields: {
                        isPaid: true
                    },
                },
                {
                    $project: {
                        img: 1,
                        name: 1,
                        email: 1,
                        address: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        isPaid: 1,
                    },
                },
                {
                    $sort: { updatedAt: -1 },
                },
                {
                    $skip: (page - 1) * 100,
                },
                {
                    $limit: 100,
                },
            ]);
            return customers;
        }
    }

    try {
        const customers = await getCustomersArray(page, search)
        function paginateArray(array, page_size, page_number) {
            return array.slice(((page_number - 1) * page_size), (page_number * page_size));
        }
        const totalDocs = customers.length
        const pages = Math.ceil(totalDocs / 100);
        if (customers) {
            res.status(200).send({
                customers: paginateArray(customers, 100, page),
                lastPage: page * 100 >= totalDocs ? true : false,
                pages: pages,
                current: page,
            });
        } else {
            res.status(400).send({
                customers: [],
                pages: 1,
                current: 1,
            });
        }
    } catch (error) {
        if (error.message.includes("Cannot read properties of undefined (reading 'length')")) {
            res.status(400).send({
                customers: [],
                pages: 1,
                current: 1,
            });
        } else {
            console.log(error)
            res.status(500).json({ err: 'error' });
        }
    }
};
const getUnpaidCustomers = async (req, res) => {
    const page = req.query.page || 1;
    const search = req.query.search || '';
    const getCustomersArray = async (page, search) => {
        const match = {
            name: { $regex: search, $options: "i" }
        }

        const orders = await Order.find({ isPaid: false });
        const customerIds = orders.map(order => order.cusId);
        const customersFromOrders = await Customer.find({ _id: { $in: customerIds } });
        const customerOrderMap = orders.reduce((acc, order) => {
            if (!acc[order.cusId]) {
                acc[order.cusId] = {
                    img: null,
                    name: null,
                    phone: null,
                    address: null,
                    createdAt: null,
                    updatedAt: null,
                    orders: [],
                    isPaid: true
                };
            }
            const customer = customersFromOrders.find(c => c._id.toString() === order.cusId.toString());
            const orderObjs = order.products.map(product => ({
                name: product.name,
                price: product.price,
                qty: product.qty,
                type: product.type,
                img: product.img,
                isPaid: order.isPaid
            }));
            acc[order.cusId].orders = acc[order.cusId].orders.concat(orderObjs);
            acc[order.cusId].isPaid = acc[order.cusId].isPaid && order.isPaid;
            if (customer) {
                acc[order.cusId].img = customer.img;
                acc[order.cusId].name = customer.name;
                acc[order.cusId].phone = customer.phone;
                acc[order.cusId].address = customer.address;
                acc[order.cusId].createdAt = customer.createdAt;
                acc[order.cusId].updatedAt = customer.updatedAt;
            }
            return acc;
        }, {});

        const mergedCustomers = Object.keys(customerOrderMap).map(customerId => {
            const customerOrderInfo = customerOrderMap[customerId];
            return {
                _id: customerId,
                img: customerOrderInfo.img,
                name: customerOrderInfo.name,
                phone: customerOrderInfo.phone,
                address: customerOrderInfo.address,
                createdAt: customerOrderInfo.createdAt,
                updatedAt: customerOrderInfo.updatedAt,
                isPaid: customerOrderInfo.isPaid,
                orders: customerOrderInfo.orders
            };
        });
        return mergedCustomers;


    }

    try {
        const customers = await getCustomersArray(page, search)
        function paginateArray(array, page_size, page_number) {
            return array.slice(((page_number - 1) * page_size), (page_number * page_size));
        }
        const totalDocs = customers.length
        const pages = Math.ceil(totalDocs / 100);
        if (customers) {
            res.status(200).send({
                customers: paginateArray(customers, 100, page),
                lastPage: page * 100 >= totalDocs ? true : false,
                pages: pages,
                current: page,
            });
        } else {
            res.status(400).send({
                customers: [],
                pages: 1,
                current: 1,
            });
        }
    } catch (error) {
        if (error.message.includes("Cannot read properties of undefined (reading 'length')")) {
            res.status(400).send({
                customers: [],
                pages: 1,
                current: 1,
            });
        } else {
            console.log(error)
            res.status(500).json({ err: 'error' });
        }
    }
};

const getCustomer = async (req, res) => {
    try {
        const customer = await Customer.findOne({ _id: req.params.customerId })
        const unPaidOrders = await Order.aggregate([
            {
                $match: {
                    // @ts-ignore
                    cusId: customer._id,
                    isPaid:false
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
                    let: { createdBy: '$createdBy', editedBy: '$editedBy', paidBy: '$paidBy' },
                    pipeline: [
                        { $match: { $expr: { $in: ['$_id', ['$$createdBy', '$$editedBy', '$$paidBy']] } } },
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
                    paidBy: {
                        $arrayElemAt: [
                            {
                                $filter: {
                                    input: '$users',
                                    cond: { $eq: ['$$this._id', '$paidBy'] }
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
                    paidBy: { $first: '$paidBy' },
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
                    paidBy: {
                        _id: '$paidBy._id',
                        name: '$paidBy.name',
                        img: '$paidBy.img',
                        role: '$paidBy.role',
                    },
                },
            },
            { $sort: { updatedAt: -1, _id: -1 } },
            {
                $project: {
                    'products.totalPrice': 0,

                },
            },
        ]);
        const paidOrders = await Order.aggregate([
            {
                $match: {
                    // @ts-ignore
                    cusId: customer._id,
                    isPaid:true
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
                    let: { createdBy: '$createdBy', editedBy: '$editedBy', paidBy: '$paidBy' },
                    pipeline: [
                        { $match: { $expr: { $in: ['$_id', ['$$createdBy', '$$editedBy', '$$paidBy']] } } },
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
                    paidBy: {
                        $arrayElemAt: [
                            {
                                $filter: {
                                    input: '$users',
                                    cond: { $eq: ['$$this._id', '$paidBy'] }
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
                    paidBy: { $first: '$paidBy' },
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
                    paidBy: {
                        _id: '$paidBy._id',
                        name: '$paidBy.name',
                        img: '$paidBy.img',
                        role: '$paidBy.role',
                    },
                },
            },
            { $sort: { updatedAt: -1, _id: -1 } },
            {
                $project: {
                    'products.totalPrice': 0,

                },
            },
        ]);
        if (customer) {
            res.status(200).json({ msg: 'success', customer: customer, orders: unPaidOrders.concat(paidOrders), })
        } else {
            res.status(404).json({ err: 'notFound', })
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ err: 'error' })
    }
}

const updateCustomer = async (req, res) => {
    const file = req.file?.path.replace("public", "").split("\\").join("/");
    try {
        const customer = await Customer.findOne({ _id: req.params.customerId })
        if (customer) {
            customer.name = req.body.name;
            customer.phone = req.body.phone;
            customer.address = req.body.address;
            if (req.file) {
                fs.unlink("./public" + customer.img, (err) => {
                    console.log(err);
                })
                customer.img = file;
            }
            await customer.save()

            res.status(200).json({ msg: 'success', customer: customer })
        } else {
            res.status(404).json({ err: 'notFound', })
        }
    } catch (error) {
        res.status(500).json({ err: 'error' })
    }
}
const deleteCustomer = async (req, res) => {
    try {
        const customer = await Customer.findOne({ _id: req.params.customerId })
        if (customer) {
            const orders = await Order.find({ cusId: customer?._id });
            orders.map(
                (item) => {
                    fs.unlink("./public" + item.img, (err) => {
                        console.log(err);
                    })
                }
            )
            fs.unlink("./public" + customer.img, (err) => {
                console.log(err);
            })
            await Order.deleteMany({ cusId: customer?._id })
            await Customer.deleteOne({ _id: req.params.customerId })
            res.status(200).json({ msg: 'success' })
        } else {
            res.status(404).json({ err: 'notFound', })
        }
    } catch (error) {
        res.status(500).json({ err: 'error' })
    }
}
module.exports = {
    createCustomer,
    getCustomers,
    getUnpaidCustomers,
    getCustomer,
    updateCustomer,
    deleteCustomer,
}