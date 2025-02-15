const express = require('express');
const mongoose = require('mongoose');
const Product = require('./models/product'); // ✅ Ensure correct import
const User = require('./models/user');
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

const secretKey = "secret123"
const app = express();
const port = 3000;

app.use(express.json());

// ✅ MongoDB Connection (Ensure IP Whitelist in MongoDB Atlas)
async function main() {
    await mongoose.connect('mongodb+srv://athulk8888:1234@e-48.boyru.mongodb.net/e48db', );
}

main()
    .then(() => console.log("✅ DB Connected"))
    .catch((error) => console.log("❌ DB Connection Error:", error));

app.get('/', (req, res) => {
    res.send("✅ Server is Running");
});


//token authentication
const authenticateToken = (req,res,next)=>{
    const token = req.headers["authorization"]?.split(' ')[1];

    if(!token) return res.status(404).json({error:"token not provided"})

        jwt.verify(token,secretKey,(err,user)=>{
            if(err) return res.status(403).json({error:"token invalid",err:err})
                req.user = user
            next()

        })
}

// ✅ Get All Products
app.get('/products',authenticateToken, async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).json(products);
    } catch (error) {
        res.status(400).json(error);
    }
});

// ✅ Create Product
app.post('/products', async (req, res) => {
    try {
        const product = new Product(req.body);
        await product.save();
        res.status(201).json(product);
    } catch (error) {
        res.status(400).json(error);
    }
});

// ✅ Get Product by ID
app.get('/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "❌ Product not found" });
        }
        res.status(200).json(product);
    } catch (error) {
        res.status(400).json(error);
    }
});

// ✅ Update Product
app.patch('/products/:id', async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json(product);
    } catch (error) {
        res.status(400).json(error);
    }
});

// ✅ Delete Product
app.delete('/products/:id', async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "❌ Product not available" });
        }
        res.status(200).json({ message: "✅ Product deleted successfully" });
    } catch (error) {
        res.status(400).json(error);
    }
});

app.get('/products/count/:price', async (req,res)=>{
    try{
        const price = Number(req.params.price)
        console.log(price)
        const productCount =  await Product.aggregate([
            {
                $match:{price:{$gt:price}}
            },
            {
                $count:"productCount"
            }
        ])
        res.status(200).send(productCount)
    }catch (error){
        res.status(400).json(error)

    }
})


//user
 app.post('/user',async (req,res)=>{
    try {
        const saltRound = 10
        bcrypt.hash(req.body.password,saltRound,async function(err,hash){ 
            if(err) {
                console.error('Error occured while hash!',err)
                res.status(500).json({error:"Internal server error"})
            }
            var userItem = {
                name:req.body.name,
                email:req.body.email,
                password:hash,
                createdAt:new Date()
            }
            var user =  new User(userItem)
            await user.save()
            res.status(201).json(user)
        })
        
    }catch(error) {
        res.status(400).json(error)
    }
 })

app.post('/login', async (req,res)=>{
    try{
        const {email,password} = req.body
        const user = await User.findOne({email:email})
        if(!user){
            return res.status(500).json({message:"user not found"})
        }
        const isValid = await bcrypt.compare(password,user.password)
        if(!isValid){
            return res.status(500).json({message:"invalid credential"})

        }

        let payload = {user:email}
        let token =  jwt.sign(payload,secretKey)
        res.status(200).json({message:"login successful",token:token})
    }catch(error){
        res.status(400).json(error)
    }
})

app.listen(port, () => console.log(`🚀 Server started on port ${port}`));
