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

    try {
        const customers = await Customer.aggregate([
            {
                $lookup: {
                    from: 'orders',
                    localField: '_id',
                    foreignField: 'cusId',
                    as: 'orders',
                },
            },

            {
                $match: {
                    $or: [
                        { name: { $regex: search, $options: 'i' } },
                        {
                            orders: {
                                $elemMatch: {
                                    products: {
                                        $elemMatch: {
                                            name: { $regex: search, $options: 'i' },

                                        }
                                    },

                                }
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    isPaid: {
                        $cond: {
                            if: { $eq: [{ $size: '$orders' }, 0] },
                            then: true,
                            else: { $allElementsTrue: '$orders.isPaid' }
                        },
                    },
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

        const totalDocs = await Customer.countDocuments({
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { orders: { $elemMatch: { 'products.name': { $regex: search, $options: 'i' } } } },
            ],

        });

        const pages = Math.ceil(totalDocs / 100);

        if (customers) {
            res.status(200).send({
                customers: customers,
                lastPage: page * 100 >= totalDocs ? true : false,
                pages: pages,
                current: page,
            });
        } else {
            res.status(400).send({
                customers: [],
                lastPage: true,
                pages: 1,
                current: 1,
            });
        }
    } catch (error) {
        if (error.message.includes("Cannot read properties of undefined (reading 'length')")) {
            res.status(400).send({
                customers: [],
                lastPage: true,
                pages: 1,
                current: 1,
            });
        } else {
            console.log(error)
            res.status(500).json({ err: 'error' });
        }
    }
};


// const getCustomers = async (req, res) => {
//     const page = req.query.page || 1;
//     const search = req.query.search || '';



//     try {
//         const customers = await Customer.aggregate([
//             {
//                 $lookup: {
//                     from: 'orders',
//                     localField: '_id',
//                     foreignField: 'cusId',
//                     as: 'orders',
//                 },
//             },
//             {
//                 $match: {
//                     $or: [
//                         { name: { $regex: search, $options: 'i' }, 'orders.isPaid': true },
//                         { name: { $regex: search, $options: 'i' }, orders: { $size: 0 } },
//                         { 'orders.products.name': { $regex: search, $options: 'i' } },
//                     ],
//                 },
//             },
//             {
//                 $addFields: {
//                     isPaid: {
//                         $cond: {
//                             if: { $eq: [{ $size: '$orders' }, 0] },
//                             then: true,
//                             else: { $allElementsTrue: '$orders.isPaid' }
//                         },
//                     },
//                 },
//             },
//             {
//                 $project: {
//                     img: 1,
//                     name: 1,
//                     email: 1,
//                     address: 1,
//                     createdAt: 1,
//                     updatedAt: 1,
//                     isPaid: 1,

//                 },
//             },
//             {
//                 $sort: { updatedAt: -1 },
//             },
//             {
//                 $skip: (page - 1) * 100,
//             },
//             {
//                 $limit: 100,
//             },
//         ]);

//         const totalDocs = await Customer.countDocuments({
//             $or: [
//                 { name: { $regex: search, $options: 'i' }, 'orders.isPaid': true },
//                 { name: { $regex: search, $options: 'i' }, orders: { $size: 0 } },
//                 { 'orders.products.name': { $regex: search, $options: 'i' } },
//             ],
//         });

//         const pages = Math.ceil(totalDocs / 100);

//         if (customers) {
//             res.status(200).send({
//                 customers: customers,
//                 lastPage: page * 100 >= totalDocs ? true : false,
//                 pages: pages,
//                 current: page,
//             });
//         } else {
//             res.status(400).send({
//                 customers: [],
//                 lastPage: true,
//                 pages: 1,
//                 current: 1,
//             });
//         }
//     } catch (error) {
//         res.status(500).json({ err: 'error' });
//     }
// };










const getCustomer = async (req, res) => {
    try {
        const customer = await Customer.findOne({ _id: req.params.customerId })
        const orders = await Order.aggregate([
            {
                $match: {
                    // @ts-ignore
                    cusId: customer._id,
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
            { $sort: { updatedAt: -1 }, },
            {
                $project: {
                    'products.totalPrice': 0,

                },
            },
        ]);
        if (customer) {
            res.status(200).json({ msg: 'success', customer: customer, orders: orders, })
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
        console.log(customer)
        const orders = await Order.find({ cusId: customer?._id });
        orders.map(
            (item) => {
                fs.unlink("./public" + item.img, (err) => {
                    console.log(err);
                })
            }
        )
        if (customer) {
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
    getCustomer,
    updateCustomer,
    deleteCustomer,
}