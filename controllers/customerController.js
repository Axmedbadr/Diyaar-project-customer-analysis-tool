const Customer = require("../models/Customers");

const createCustomer = async (req, res) => {
    try {
        const { name, phoneNumber, type } = req.body;
        const customer = new Customer({ name, phoneNumber, type });
        await customer.save();
        res.status(201).json(customer);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getCustomers = async (req, res) => {
    try {
        const customers = await Customer.find();
        res.status(200).json(customers);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteCustomer = async (req, res) => {
    try {
        const customer = await Customer.findByIdAndDelete(req.params.id);
        if (!customer) return res.status(404).json({ message: "Customer not found" });
        res.json({ message: "Customer deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createCustomer, getCustomers, deleteCustomer };