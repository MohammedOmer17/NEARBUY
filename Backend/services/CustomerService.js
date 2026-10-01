const CustomerModel = require('../models/CustomerModel').default;

module.exports.createCustomer = ({ name, email, phone, password }) => {
    return CustomerModel.create({ name, email, phone, password });
};