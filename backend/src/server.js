import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/db.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`MedAlert API running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Unable to start MedAlert API", error);
  process.exit(1);
});
