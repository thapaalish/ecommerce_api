import express from "express";
import {
  isBuyer,
  isSeller,
  isUser,
} from "../middleware/authentication.middleware.js";
import { checkMongoIdValidityFromParams } from "../middleware/mongo.id.validity.middleware.js";
import Product from "./product.model.js";
import { addProductValidationSchema } from "./product.validation.js";
import { paginationValidationSchema } from "../utils/pagination.validation.js";
import Cart from "../cart/cart.model.js";

const router = express.Router();

// add product,system user, role=> seller

router.post(
  "/product/add",
  isSeller,
  async (req, res, next) => {
    // extract new product from req.body
    const newProduct = req.body;

    // validate new product
    try {
      const validatedData = await addProductValidationSchema.validate(
        newProduct
      );
      req.body = validatedData;
      next();
    } catch (error) {
      return res.status(400).send({ message: error.message });
    }
  },
  async (req, res) => {
    // extract new product from req.body
    const newProduct = req.body;

    // add sellerId
    newProduct.sellerId = req.loggedInUserId;

    // create product
    await Product.create(newProduct);

    // send response
    return res.status(200).send({ message: "Product is added successfully." });
  }
);

// get product details
router.get(
  "/product/details/:id",
  isUser,
  checkMongoIdValidityFromParams,
  async (req, res) => {
    //  extract product id from req.params
    const productId = req.params.id;

    // find product
    const product = await Product.findOne({ _id: productId });

    // if not product, throw error
    if (!product) {
      return res.status(404).send({ message: "Product does not exist." });
    }

    // send product as response
    return res
      .status(200)
      .send({ message: "success", productDetails: product });
  }
);

// delete product
router.delete(
  "/product/delete/:id",
  isSeller,
  checkMongoIdValidityFromParams,
  async (req, res) => {
    // extract product id from req.params
    const productId = req.params.id;

    // find product
    const product = await Product.findOne({ _id: productId });

    // if not product, throw error
    if (!product) {
      return res.status(404).send({ message: "Product does not exist." });
    }

    // ?check for owner of product
    // loggedInUserId must be same with product's sellerId
    const isOwnerOfProduct =
      String(product.sellerId) === String(req.loggedInUserId);

    // if not owner of product, throw error
    if (!isOwnerOfProduct) {
      return res
        .status(403)
        .send({ message: "You are not owner of this product." });
    }

    // delete product
    await Product.deleteOne({ _id: productId });

    // delete cart
    await Cart.deleteMany({ productId: productId });

    return res
      .status(200)
      .send({ message: "Product is deleted successfully." });
  }
);

// edit product
router.put(
  "/product/edit/:id",
  isSeller,
  checkMongoIdValidityFromParams,
  async (req, res, next) => {
    // extract new product from req.body
    const newProduct = req.body;

    // validate new product
    try {
      const validatedData = await addProductValidationSchema.validate(
        newProduct
      );
      req.body = validatedData;
      next();
    } catch (error) {
      return res.status(400).send({ message: error.message });
    }
  },
  async (req, res) => {
    //  extract product id from req.params
    const productId = req.params.id;

    // find product
    const product = await Product.findOne({ _id: productId });

    // if not product, throw error
    if (!product) {
      return res.status(404).send({ message: "Product does not exist." });
    }

    // check for ownership of product
    const isOwnerOfProduct = product.sellerId.equals(req.loggedInUserId);

    // if not owner, throw error
    if (!isOwnerOfProduct) {
      return res
        .status(403)
        .send({ message: "You are not owner of this product." });
    }

    // extract new values from req.body
    const newValues = req.body;

    // edit product
    await Product.updateOne(
      { _id: productId },
      {
        $set: {
          ...newValues,
        },
      }
    );

    // send response
    return res
      .status(200)
      .send({ message: "Product is updated successfully." });
  }
);

// get product list by buyer
router.post(
  "/product/list/buyer",
  isBuyer,
  async (req, res, next) => {
    // extract pagination data from req.body
    const paginationData = req.body;

    // validate pagination data
    try {
      const validatedData = await paginationValidationSchema.validate(
        paginationData
      );
      req.body = validatedData;
      next();
    } catch (error) {
      return res.status(400).send({ message: error.message });
    }
  },
  async (req, res) => {
    // extract pagination data from req.body
    const { page, limit } = req.body;

    // calculate skip
    const skip = (page - 1) * limit;

    // run query
    const productList = await Product.aggregate([
      { $match: {} },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
      {
        $project: {
          name: 1,
          brand: 1,
          price: 1,
          description: { $substr: ["$description", 0, 150] },
          image: 1,
        },
      },
    ]);

    const totalProducts = await Product.find().countDocuments();
    const numberOfPages = Math.ceil(totalProducts / limit);

    return res
      .status(200)
      .send({ message: "success", productList: productList, numberOfPages });
  }
);

// get product list by seller
router.post(
  "/product/list/seller",
  isSeller,
  async (req, res, next) => {
    // extract pagination data from req.body
    const paginationData = req.body;

    // validate pagination data
    try {
      const validatedData = await paginationValidationSchema.validate(
        paginationData
      );
      req.body = validatedData;
      next();
    } catch (error) {
      return res.status(400).send({ message: error.message });
    }
  },
  async (req, res) => {
    // extract pagination data from req.body
    const paginationData = req.body;

    // calculate skip
    const skip = (paginationData.page - 1) * paginationData.limit;

    // run query
    const productList = await Product.aggregate([
      {
        $match: {
          sellerId: req.loggedInUserId,
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: paginationData.limit,
      },
      {
        $project: {
          name: 1,
          brand: 1,
          description: { $substr: ["$description", 0, 150] },
          image: 1,
          price: 1,
        },
      },
    ]);

    return res
      .status(200)
      .send({ message: "success", productList: productList });
  }
);

export default router;
