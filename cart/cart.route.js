import express from "express";
import { isBuyer } from "../middleware/authentication.middleware.js";
import {
  addItemToCartValidationSchema,
  updateQuantityValidationSchema,
} from "./cart.validation.js";
import mongoose from "mongoose";
import Product from "../product/product.model.js";
import Cart from "./cart.model.js";
import { checkMongoIdValidityFromParams } from "../middleware/mongo.id.validity.middleware.js";

const router = express.Router();

// add item to cart
// role => buyer

router.post(
  "/cart/item/add",
  isBuyer,
  async (req, res, next) => {
    // extract cart item from req.body
    const cartItem = req.body;
    // validate cart item
    try {
      const validatedData = await addItemToCartValidationSchema.validate(
        cartItem
      );
      req.body = validatedData;
      next();
    } catch (error) {
      return res.status(400).send({ message: error.message });
    }
  },
  (req, res, next) => {
    // extract productId from req.body
    const productId = req.body.productId;

    // validate product Id for mongo id
    const isValidMongoId = mongoose.isValidObjectId(productId);

    // if not valid, throw error
    if (!isValidMongoId) {
      return res.status(400).send({ message: "Invalid product id." });
    }

    // call next function
    next();
  },
  async (req, res) => {
    // extract cart item from req.body
    const cartItem = req.body;

    // attach buyerId to cart item
    cartItem.buyerId = req.loggedInUserId;

    // check if the item is already added to cart
    const cart = await Cart.findOne({
      productId: cartItem.productId,
      buyerId: req.loggedInUserId,
    });

    // if item is already in cart, throw error
    if (cart) {
      return res
        .status(409)
        .send({ message: "Item is already added to cart." });
    }

    // find product
    const product = await Product.findOne({ _id: cartItem.productId });

    // if ordered quantity is greater than product quantity, throw error
    if (cartItem.orderedQuantity > product.quantity) {
      return res.status(403).send({ message: "Product is outnumbered." });
    }

    // create cart
    await Cart.create(cartItem);

    // send response
    return res
      .status(200)
      .send({ message: "Item is added to cart successfully." });
  }
);

// flush cart
router.delete("/cart/flush", isBuyer, async (req, res) => {
  await Cart.deleteMany({ buyerId: req.loggedInUserId });

  return res.status(200).send({ message: "Cart is flushed successfully." });
});

// remove single item from cart
router.delete(
  "/cart/item/remove/:id",
  isBuyer,
  checkMongoIdValidityFromParams,
  async (req, res) => {
    // extract product id from req.params
    const productId = req.params.id;

    // remove that item from cart for logged in buyer
    await Cart.deleteOne({ productId: productId, buyerId: req.loggedInUserId });

    // send response
    return res
      .status(200)
      .send({ message: "Item is removed from cart successfully." });
  }
);

// list cart item
router.get("/cart/item/list", isBuyer, async (req, res) => {
  const cartItemList = await Cart.aggregate([
    {
      $match: { buyerId: req.loggedInUserId },
    },
    {
      $lookup: {
        from: "products",
        localField: "productId",
        foreignField: "_id",
        as: "productDetails",
      },
    },
    {
      $project: {
        name: { $first: "$productDetails.name" },
        brand: { $first: "$productDetails.brand" },
        price: { $first: "$productDetails.price" },
        image: { $first: "$productDetails.image" },
        productId: 1,
        orderedQuantity: 1,
        subTotal: {
          $multiply: [{ $first: "$productDetails.price" }, "$orderedQuantity"],
        },
      },
    },
  ]);

  let subTotalOfAllProducts = 0;

  cartItemList.forEach((item) => {
    subTotalOfAllProducts = subTotalOfAllProducts + item.subTotal;
  });

  const discount = 0.05 * subTotalOfAllProducts;

  const grandTotal = subTotalOfAllProducts - discount;

  return res.status(200).send({
    message: "success",
    cartItems: cartItemList,
    orderSummary: [
      { name: "sub total", value: subTotalOfAllProducts.toFixed(2) },
      { name: "discount", value: discount.toFixed(2) },
      { name: "grandTotal", value: grandTotal.toFixed(2) },
    ],
  });
});

router.get("/cart/item/count", isBuyer, async (req, res) => {
  const cartItemCount = await Cart.find({
    buyerId: req.loggedInUserId,
  }).countDocuments();

  return res.status(200).send({ message: "success", itemCount: cartItemCount });
});

router.put(
  "/cart/update/quantity/:id",
  isBuyer,
  checkMongoIdValidityFromParams,

  async (req, res, next) => {
    // extract values from req.body
    const values = req.body;
    // validate cart item
    try {
      const validatedData = await updateQuantityValidationSchema.validate(
        values
      );
      req.body = validatedData;
      next();
    } catch (error) {
      return res.status(400).send({ message: error.message });
    }
  },
  async (req, res) => {
    // extract product id from req.params
    const productId = req.params.id;

    // check if cart exists using product Id and buyerId
    const cart = await Cart.findOne({ productId, buyerId: req.loggedInUserId });

    // if not cart, throw error
    if (!cart) {
      return res.status(404).send({ message: "Product is not added to cart." });
    }

    // extract values from req.body
    const actionData = req.body;

    let newOrderedQuantity =
      actionData.action === "inc"
        ? cart.orderedQuantity + 1
        : cart.orderedQuantity - 1;

    const product = await Product.findOne({ _id: productId });
    const availableQuantity = product.quantity;

    if (newOrderedQuantity > availableQuantity) {
      return res.status(403).send({ message: "Product is outnumbered." });
    }

    if (newOrderedQuantity < 1) {
      return res.status(403).send({ message: "Please remove item from cart." });
    }

    await Cart.updateOne(
      { productId: productId, buyerId: req.loggedInUserId },
      {
        $set: {
          orderedQuantity: newOrderedQuantity,
        },
      }
    );

    return res
      .status(200)
      .send({ message: "Quantity is updated successfully." });
  }
);
export default router;
