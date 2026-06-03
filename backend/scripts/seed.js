import dotenv from "dotenv";
import mongoose from "mongoose";
import Admin from "../src/models/Admin.js";
import EmergencyContact from "../src/models/EmergencyContact.js";
import Hospital from "../src/models/Hospital.js";
import User from "../src/models/User.js";

dotenv.config();

const hospitals = [
  {
    name: "Apollo Emergency Care",
    phone: "+91 44 2829 3333",
    address: "Greams Road, Chennai, Tamil Nadu",
    latitude: 13.0635,
    longitude: 80.2516,
    services: ["Emergency", "ICU", "Trauma", "Ambulance"]
  },
  {
    name: "Fortis Malar Hospital",
    phone: "+91 44 4289 2222",
    address: "Adyar, Chennai, Tamil Nadu",
    latitude: 13.0102,
    longitude: 80.2586,
    services: ["Emergency", "Cardiology", "ICU", "Ambulance"]
  },
  {
    name: "SIMS Hospital",
    phone: "+91 44 2000 2000",
    address: "Vadapalani, Chennai, Tamil Nadu",
    latitude: 13.0506,
    longitude: 80.2121,
    services: ["Emergency", "Neurology", "ICU", "Ambulance"]
  },
  {
    name: "Global Hospitals",
    phone: "+91 44 4477 7000",
    address: "Perumbakkam, Chennai, Tamil Nadu",
    latitude: 12.9063,
    longitude: 80.2067,
    services: ["Emergency", "Transplant", "ICU", "Ambulance"]
  }
];

const upsertUser = async ({
  email,
  password,
  role,
  fullName,
  phone,
  medicalProfile
}) => {
  let user = await User.findOne({ email }).select("+password");

  if (!user) {
    user = await User.create({
      email,
      password,
      role,
      fullName,
      phone,
      medicalProfile
    });
  }

  return user;
};

const seed = async () => {
  console.log("=================================");
  console.log("NODE_ENV:", process.env.NODE_ENV);
  console.log("MONGO_URI exists:", !!process.env.MONGO_URI);
  console.log(
    "MONGO_URI:",
    process.env.MONGO_URI
      ? process.env.MONGO_URI.replace(/\/\/.*?:.*?@/, "//***:***@")
      : "NOT FOUND"
  );
  console.log("=================================");

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required to seed data.");
  }

  mongoose.set("strictQuery", false);

  console.log("Connecting to MongoDB Atlas...");

  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000
  });

  console.log("MongoDB Connected Successfully");

  const admin = await upsertUser({
    email: "admin@medalert.local",
    password: "Admin@12345",
    role: "admin",
    fullName: "MedAlert Administrator",
    phone: "+91 90000 00001",
    medicalProfile: {}
  });

  await Admin.updateOne(
    { user: admin._id },
    {
      user: admin._id,
      employeeCode: "MED-ADMIN-001",
      department: "Emergency Operations"
    },
    { upsert: true }
  );

  const demoUser = await upsertUser({
    email: "user@medalert.local",
    password: "User@12345",
    role: "user",
    fullName: "Demo Patient",
    phone: "+91 90000 00002",
    medicalProfile: {
      age: 22,
      gender: "male",
      bloodGroup: "O+",
      allergies: ["Penicillin"],
      existingDiseases: ["Asthma"],
      currentMedications: ["Salbutamol inhaler"],
      address: "Chennai, Tamil Nadu"
    }
  });

  await EmergencyContact.deleteMany({ user: demoUser._id });

  await EmergencyContact.insertMany([
    {
      user: demoUser._id,
      name: "Ravi Kumar",
      relation: "Father",
      phone: "+91 98765 43210",
      isPrimary: true
    },
    {
      user: demoUser._id,
      name: "Anita Kumar",
      relation: "Mother",
      phone: "+91 98765 43211",
      isPrimary: false
    }
  ]);

  for (const hospital of hospitals) {
    await Hospital.findOneAndUpdate(
      { name: hospital.name },
      {
        ...hospital,
        location: {
          type: "Point",
          coordinates: [hospital.longitude, hospital.latitude]
        }
      },
      {
        upsert: true,
        new: true,
        runValidators: true
      }
    );
  }

  console.log("=================================");
  console.log("Seed completed successfully");
  console.log("=================================");
  console.log("Admin login:");
  console.log("Email: admin@medalert.local");
  console.log("Password: Admin@12345");
  console.log("");
  console.log("User login:");
  console.log("Email: user@medalert.local");
  console.log("Password: User@12345");
  console.log("=================================");

  await mongoose.disconnect();
};

seed().catch(async (error) => {
  console.error("=================================");
  console.error("SEED ERROR:");
  console.error(error);
  console.error("=================================");

  try {
    await mongoose.disconnect();
  } catch {}

  process.exit(1);
});