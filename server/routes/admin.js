const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const User = require("../models/User");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const adminLayout = "../views/layouts/admin";
const jwtSecret = process.env.JWT_SECRET


// check login
const authMiddleware = (req,res,next) => {
  const token = req.cookies.token
  if(!token) {
    return res.status(401).json({message: 'Unauthorized'})
  }
  try {
    const decoded = jwt.verify(token, jwtSecret)
    req.userId = decoded.userId
    next()
  }
  catch(error){
    return res.status(401).json({message: 'Unauthorized'})

  }
}


//home


router.get("/admin", async (req, res) => {
  try {
    const locals = {
      title: "admin",
      description: "no",
    };
    res.render("admin/index", { locals, layout: adminLayout });
  } catch (error) {
    console.log(error);
  }
});

// //login
// router.post("/admin", async (req, res) => {
//   try {
//     const { username, password } = req.body;
//     console.log(req.body);
//     if (req.body.username === "admin" && req.body.password === "password") {
//       res.send("Logged in");
//     } else {
//       res.send("Sai ten dang nhap");
//     }

//     res.redirect("/admin");
//   } catch (error) {
//     console.log(error);
//   }
// });


//dang ki
router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body
    const hashedPassword = await bcrypt.hash(password, 10)
    try {
      const user = await User.create({username, password: hashedPassword})
      res.status(201).json({message: 'User Created', user})
    
    } catch (error) {
      if(error.code!== 11000) {
        res.status(409).json({message: ' User da ton tai'})
      }
      res.status(500).json({message: 'Internal server error'})
    }
  } catch (error) {
    console.log(error);
  }
});
// kiem tra dang nhap
router.post('/admin', async(req,res) => {
  try {
    const {username, password} = req.body
    const user = await User.findOne({username})
    if(!user) {
      return res.status(401).json({message: 'Invalid credentials'})
    }
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if(!isPasswordValid) {
      return res.status(401).json({message: 'INvalid credentials'})
    }
    const token = jwt.sign({userId: user._id}, jwtSecret)
    res.cookie('token', token, {httpOnly: true})
    res.redirect('/dashboard')
  } catch (error) {
    console.log(error)
  }
})


router.get('/dashboard', authMiddleware, async(req,res) => {

  try {
    const locals = {
      title: 'dashboard',
      description: 'no'
    }
    const data = await Post.find()
    res.render('admin/dashboard', {locals, data, layout: adminLayout})

  } catch (error) {
    
  }

})


// get new post
router.get('/add-post', authMiddleware, async(req,res) => {

  try {
    const locals = {
      title: 'Add post',
      description: 'no'
    }
    const data = await Post.find()
    res.render('admin/add-post', {locals, data})

  } catch (error) {
    
  }

})

// create new post
router.post('/add-post', authMiddleware, async(req,res) => {
  try {
    console.log(req.body)
    try {
      const newPost = new Post ({
        title: req.body.title,
        body: req.body.body
      })
      await Post.create(newPost)
      res.redirect('dashboard')
    } catch (error) {
      consle.log(error)
    }
  } catch (error) {
    consle.log(error)
  }
})

// edit post
router.put('/edit-post/:id', authMiddleware, async(req,res) => {
  try {
    await Post.findByIdAndDelete(req.params.id, {
      title:  req.body.title,
      body: req.body.body,
      updateAt: Date.now(),
    })
    req.redirect(`/edit-Post/${req.params.id}`)
  } catch (error) {
    consle.log(error)
  }
})
// edit post
router.get('/edit-post/:id', authMiddleware, async(req,res) => {
  try {
    const locals = {
      title: "No",
      description: "No"
    }
    const data = await Post.findOne({_id: req.params.id})
    res.render('admin/edit-post', {
    locals,
      data,
      layout: adminLayout
    }
    )
  } catch (error) {
    consle.log(error)
  }
})

// delelte
router.delete('/delete-post/:id', authMiddleware, async(req, res) => {
  try {
    await Post.deleteOne({_id: req.params.id})
    res.redirect('/dashboard')
  } catch (error) {
    console.log(error)
  }
})

// logout

/**
 * GET /
 * Admin Logout
*/
router.get('/logout', (req, res) => {
  res.clearCookie('token');
  //res.json({ message: 'Logout successful.'});
  res.redirect('/');
});

module.exports = router;
