import express from "express";
import connectDB from "./connect.db.js";
import userRoutes from "./user/user.route.js";
import productRoutes from "./product/product.route.js";
import cartRoutes from "./cart/cart.route.js";
import cors from "cors";

const app = express();
// to make app understand json
app.use(express.json());

// cors
app.use(cors());

// connect database
connectDB();

// register routes
app.use(userRoutes);
app.use(productRoutes);
app.use(cartRoutes);

// server and network port
const PORT = process.env.API_PORT;

app.listen(PORT, () => {
  console.log(`App is listening on port ${PORT}`);
});
