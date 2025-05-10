const express = require('express');
const { createUser, login, updateUser, deleteUser, getUser, getUsers, createAdmin, getMyProfile } = require('./../controller/userC.js');
const { getIndex, } = require('./../controller/settingsC.js');
const { createOrder, updateOrder, getOrder, deleteOrder, payOrder, getUnpaidOrders, partialPaidOrder } = require('./../controller/orderC.js');
const { isAdmin, isEditor, isViewer } = require('./../middleware/accessControl.js');
const { imgUpload } = require('./../middleware/file.js');
const { getCustomer, createCustomer, updateCustomer, getCustomers, deleteCustomer, getUnpaidCustomers } = require('../controller/customerC.js');

const router = express();

router.get('/', function (req, res) {
    res.send('ok')
})
router.post('/init', createAdmin)
router.post('/login', login)
router.get('/profile', isViewer, getMyProfile)
//----------------------------------------------------------------
router.get('/users', isAdmin, getUsers)
router.post('/users', isAdmin, imgUpload, createUser)
router.get('/user/:userId', isAdmin, getUser)
router.post('/user/:userId', isAdmin, imgUpload, updateUser)
router.delete('/user/:userId', isAdmin, deleteUser)
//----------------------------------------------------------------

//----------------------------------------------------------------
router.get('/home', isViewer, getIndex)
router.get('/order/:orderId', isViewer, getOrder)
router.post('/order/pay/:orderId', isEditor, payOrder)
router.get('/orders/unpaid', isEditor, getUnpaidOrders)
router.post('/orders', isEditor, imgUpload, createOrder)
router.post('/order/:orderId', isEditor, imgUpload, updateOrder)
router.post('/order/part-select/:orderId', isEditor, partialPaidOrder)
router.delete('/order/:orderId', isAdmin, deleteOrder)
//----------------------------------------------------------------
router.get('/customers', isEditor, getCustomers)
router.get('/customers/unpaid', isEditor, getUnpaidCustomers)
router.get('/customer/:customerId', isViewer, getCustomer)
router.post('/customers', isEditor, imgUpload, createCustomer)
router.post('/customer/:customerId', isEditor, imgUpload, updateCustomer)
router.delete('/customer/:customerId', isAdmin, deleteCustomer)

module.exports = router;