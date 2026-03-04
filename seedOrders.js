const mongoose = require("mongoose");
const Order = require("./models/Order");
const fs = require("fs");

require("dotenv").config();

const MONGO_URL = process.env.MONGO_URL;

// Helper function to parse various date formats
const parseDate = (dateValue) => {
  if (!dateValue || dateValue === " " || dateValue === null) return null;
  
  // If it's already a Date object or ISO string
  if (dateValue instanceof Date) return dateValue;
  if (typeof dateValue !== 'string') return null;
  
  // Check for placeholder text
  if (dateValue.includes("End of") || dateValue.includes("The End")) return null;
  
  // Handle ISO format (2025-08-02T00:00:00.000Z)
  if (dateValue.includes('T') && dateValue.includes('-')) {
    const date = new Date(dateValue);
    return isNaN(date.getTime()) ? null : date;
  }
  
  // Handle DD/MM/YYYY format
  const ddmmyyyy = dateValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const [_, day, month, year] = ddmmyyyy;
    const yearNum = parseInt(year);
    if (yearNum < 2020 || yearNum > 2026) return null;
    
    const date = new Date(yearNum, parseInt(month) - 1, parseInt(day));
    return isNaN(date.getTime()) ? null : date;
  }
  
  // Handle DD/MM/YY format
  const ddmmyy = dateValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (ddmmyy) {
    const [_, day, month, year] = ddmmyy;
    const fullYear = 2000 + parseInt(year);
    if (fullYear < 2020 || fullYear > 2026) return null;
    
    const date = new Date(fullYear, parseInt(month) - 1, parseInt(day));
    return isNaN(date.getTime()) ? null : date;
  }
  
  // Handle dates with extra slashes
  const cleanedDate = dateValue.replace(/\/+/g, '/');
  if (cleanedDate !== dateValue) {
    return parseDate(cleanedDate);
  }
  
  return null;
};

// Helper function to validate phone number
const formatPhoneNumber = (phoneValue) => {
  if (!phoneValue || phoneValue === " " || phoneValue === null) return null;
  
  // Convert to string and remove any non-digit characters
  const cleaned = String(phoneValue).replace(/\D/g, '');
  
  // Check if it's a valid phone number (between 6 and 9 digits for Somali numbers)
  if (cleaned.length >= 6 && cleaned.length <= 9) {
    return cleaned;
  }
  
  // Handle numbers with extra digits
  if (cleaned.length > 9 && cleaned.length <= 12) {
    return cleaned.slice(-9);
  }
  
  return null;
};

// Helper function to detect record type and extract data
const processRecord = (item) => {
  // Check if it's an Individual record (has "Order Date" field)
  if (item.hasOwnProperty("Order Date")) {
    const orderDate = parseDate(item["Order Date"]);
    const customerName = item["Customer Name"] ? item["Customer Name"].trim() : null;
    const phoneNumber = formatPhoneNumber(item["Phone Number"]);
    const type = item["Type"] ? item["Type"].replace("Indivituals", "Individuals") : "Individuals";
    
    if (!customerName || !orderDate) return null;
    
    return {
      orderDate,
      customerName,
      phoneNumber,
      type
    };
  }
  
  // Check if it's a Pre-Urban record (has "Ilhan" field)
  if (item.hasOwnProperty("Ilhan ")) {
    // The phone number is in the "3240242" field (first key)
    const phoneKey = Object.keys(item)[0];
    const phoneNumber = formatPhoneNumber(item[phoneKey]);
    
    // The date is in the "27/6/2025" field (second key)
    const dateKey = Object.keys(item)[1];
    const orderDate = parseDate(item[dateKey]);
    
    const customerName = item["Ilhan "] ? item["Ilhan "].trim() : null;
    const type = "Pre-Urban"; // Fix the typo from "Pre-Arban" to "Pre-Urban"
    
    if (!customerName || !orderDate) return null;
    
    return {
      orderDate,
      customerName,
      phoneNumber,
      type
    };
  }
  
  // Check if it's a Shop record (has "Barwaaqo Shop" field)
  if (item.hasOwnProperty("Barwaaqo Shop")) {
    // The phone number is in the "3157847" field (first key)
    const phoneKey = Object.keys(item)[0];
    const phoneNumber = formatPhoneNumber(item[phoneKey]);
    
    // The date is in the "20/2/2025" field (second key)
    const dateKey = Object.keys(item)[1];
    const orderDate = parseDate(item[dateKey]);
    
    const customerName = item["Barwaaqo Shop"] ? item["Barwaaqo Shop"].trim() : null;
    const type = "Shops";
    
    if (!customerName || !orderDate) return null;
    
    return {
      orderDate,
      customerName,
      phoneNumber,
      type
    };
  }
  
  // Check if it's a Supermarket record (has "Adna Supermarket- Axmed " field)
  if (item.hasOwnProperty("Adna Supermarket- Axmed ")) {
    // The phone number is in the "4045662" field (first key)
    const phoneKey = Object.keys(item)[0];
    const phoneNumber = formatPhoneNumber(item[phoneKey]);
    
    // The date is in the "25/8/2025" field (second key)
    const dateKey = Object.keys(item)[1];
    const orderDate = parseDate(item[dateKey]);
    
    const customerName = item["Adna Supermarket- Axmed "] ? item["Adna Supermarket- Axmed "].trim() : null;
    const type = "Supermarkets";
    
    if (!customerName || !orderDate) return null;
    
    return {
      orderDate,
      customerName,
      phoneNumber,
      type
    };
  }
  
  return null;
};

const seedOrders = async () => {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("MongoDB connected!");

    // Read the JSON file
    const rawData = fs.readFileSync("./dataindu.json", "utf-8");
    const data = JSON.parse(rawData);

    console.log(`Total records in file: ${data.length}`);

    // Process all records
    const mapped = data
      .map(item => processRecord(item))
      .filter(item => item !== null);

    console.log(`Successfully processed: ${mapped.length} records`);

    // Show breakdown by type
    const typeCount = {};
    mapped.forEach(item => {
      typeCount[item.type] = (typeCount[item.type] || 0) + 1;
    });
    console.log("\nRecords by type:", typeCount);

    // Log a few sample records
    console.log("\nSample records to be inserted:");
    mapped.slice(0, 5).forEach((item, index) => {
      console.log(`${index + 1}.`, {
        ...item,
        orderDate: item.orderDate.toISOString()
      });
    });

    // Delete all previous orders
    await Order.deleteMany({});
    console.log("\nCleared existing orders");

    // Seed new orders
    const result = await Order.insertMany(mapped);
    console.log(`✅ ${result.length} orders seeded successfully!`);
    
    // Show final type distribution
    const finalTypeCount = {};
    result.forEach(order => {
      finalTypeCount[order.type] = (finalTypeCount[order.type] || 0) + 1;
    });
    console.log("\nFinal orders by type:", finalTypeCount);
    
    mongoose.connection.close();
  } catch (error) {
    console.error("Error seeding orders:", error);
    mongoose.connection.close();
  }
};

seedOrders();