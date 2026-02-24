const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async ()=>{
   try{

 await mongoose.connect(process.env.MONGO_URL);
 console.log("mongodb ConnecteDd is on");


   }
   catch(error){
    console.error(`there is problem of connectinf db `,error)
    console.log("there is proble of connecting db ")

   }
};


module.exports=connectDB