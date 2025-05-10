import mongoose from "mongoose";

import '@/models/user';
import '@/models/audienceSegment';
import '@/models/communicationLog';
import '@/models/customer';
import '@/models/campaign';
import '@/models/order';


type ConnectionObject = {
    isConnected? : number;
};

const connection: ConnectionObject={};

async function dbConnect(): Promise<void>{
    if(connection.isConnected){
        console.log("Already connected to database");
        return;
    }
    try {
      const db = await mongoose.connect(process.env.MONGODB_URI || '',{})
      
      connection.isConnected = db.connections[0].readyState;  
        console.log("DB Connected Successfully");
    
    } catch (error) {
        console.log("DB Connection False",error);
        process.exit(1);

    }
}

export default dbConnect;