// importing dependencies

import express from "express";
import bodyParser from "body-parser"
import dotenv from "dotenv";
import pg from "pg";
import bcrypt from "bcryptjs";
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-local";
import GoogleStrategy from "passport-google-oauth2";
import { v4 as uuidv4 } from "uuid";

// configurations

dotenv.config();
const app = express();
const saltRounds = 3;
const port = process.env.PORT||3000;


const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 ,
  }
}));

app.use(passport.initialize());
app.use(passport.session());

let task = [];
let complete = [];
let percent;
//const d = new Date();
const d = new Date().toLocaleString('en-US',{ timeZone: 'Asia/kolkata' });
let date = d.getDate() +" "+ (d.getMonth()+1) +" " + d.getFullYear();

// get routes

app.get("/", (req,res) => {
  if(req.isAuthenticated()) {
    return res.redirect("/app");
  }
  res.redirect("/login");
});


app.get("/register", (req,res) => { 
  res.render("signup.ejs", { error: req.query.error || "" });
});

app.get("/signup",(req,res)=>{
  res.render("signup.ejs",{error: req.query.error || ""});
})

app.get("/login", (req,res) => {
  res.render("signup.ejs", { error: req.query.error || "" });
});

app.get("/app", async (req,res) => {
  
  console.log(" data: "+ date);
  //console.log("old date: "+d.getDate());
  if(req.isAuthenticated()) {
    let a,b;
    try {
        const data = await db.query("select * from task where date=($1) and month=($2) and year=($3) and user_id=($4);",
          [d.getDate(),d.getMonth()+1,d.getFullYear(),req.user.id]);
        const data2 = await db.query("select * from complete_task where date=($1) and month=($2) and year=($3) and user_id=($4);",
          [d.getDate(),d.getMonth()+1,d.getFullYear(),req.user.id]);
        a=data.rowCount;
        b=data2.rowCount;
        complete=data2.rows;
        task=data.rows; 
    }
    catch(err) {
      console.error("error is executing"+err.stack);
    }
    percent = (a + b) === 0 ? 0 : Math.floor((b / (a + b)) * 100);
    if (isNaN(percent)) {
      console.error("Percent is NaN — skipping DB insert.");
      percent = 0;
    }

    // await db.query(  
    //   "INSERT INTO complete_percentage (user_id, date, percentage) VALUES ($1, $2, $3) ON CONFLICT (user_id, date) DO UPDATE SET percentage = $3;",[req.user.id,new Date().toISOString().split('T')[0],parseInt(percent)]
    // );
    try {
  await db.query(
    "INSERT INTO complete_percentage (user_id, date, percentage) VALUES ($1, $2, $3) ON CONFLICT (user_id, date) DO UPDATE SET percentage = $3;",
    [req.user.id, new Date().toISOString().split('T')[0], parseInt(percent)]
  );
} catch (err) {
  console.error("Error inserting/updating complete_percentage:", err.message);
  return res.status(500).send("Something went wrong updating progress.");
}

    // for(let i=0;i<task.length;i++){
    //   console.log("task: "+JSON.stringify(task[i]));
    // }
  let result;
  try {
    console.log(req.user); // Ensure this has { id: ... }

     result = await db.query(`
  SELECT TO_CHAR(date, 'YYYY-MM-DD') AS date, percentage
  FROM complete_percentage
  WHERE user_id = $1;
`,[req.user.id]
    );

    //console.log("-------"+JSON.stringify(result.rows)); // Log rows for debugging


    //res.render("app.ejs", { streak: result.rows }); // send data to EJS
  } catch (err) {
    console.error("Error fetching streak data:", err);
    res.status(500).send("Internal Server Error");
  }
    res.render("app.ejs", {user_id:req.user.id,task:task,date:date,complete:complete,percent:percent,streak:result.rows} );
  }
  else 
    res.redirect("/login?error=Kindly login.");
});

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});
 
app.get("/auth/google", passport.authenticate("google", {
  scope: ["profile", "email"],
  //callbackURL: process.env.GOOGLE_CALLBACK_URL,
}));

app.get("/auth/google/streaksync", passport.authenticate("google", {
  successRedirect: "/app",
  failureRedirect: "/login?error=Invalid credentials.",
}));

app.get("/app/history", async (req, res) => {
//   const d = new Date();
//   try {
//     console.log(req.user); // Ensure this has { id: ... }

//     const result = await db.query(`
//   SELECT TO_CHAR(date, 'YYYY-MM-DD') AS date, percentage
//   FROM complete_percentage
//   WHERE user_id = $1;
// `,[req.user.id]
//     );

//     console.log("-------"+JSON.stringify(result.rows)); // Log rows for debugging


//     res.render("app.ejs", { streak: result.rows }); // send data to EJS
//   } catch (err) {
//     console.error("Error fetching streak data:", err);
//     res.status(500).send("Internal Server Error");
//   }
res.redirect("/app#heatmap-container")
});


app.get("/logout", (req,res) => {
  req.logOut((err) => {
    if(err) console.log(err);
    res.redirect("/login");
  })
})

app.get("/aboutus", (req, res) => {
  if(req.isAuthenticated()) {
    res.render("aboutus.ejs");
  } else {
    res.redirect("/login?error=Kindly login.");
  }
});

app.get("/contact", (req, res) => {
  if(req.isAuthenticated()) {
    res.render("contact.ejs");
  } else {
    res.redirect("/login?error=Kindly login.");
  }
});

app.post("/register", async (req,res) => {
  const d = new Date();
  const {name, mail, password} = req.body;
  //console.log("inside register: "+JSON.stringify(req.body));
  const result = await db.query(
    "select * from users where mail = ($1)",
    [mail]);

  if (result.rows.length > 0) {
    console.log("Account already exist.");
    return res.redirect("/register?error=Account already exists.");
  }

  const hash = await bcrypt.hash(password, saltRounds);
  const uuid = uuidv4();
        
  const newUser = await db.query(
    "insert into users (id, name, mail, password) values ($1, $2, $3, $4) RETURNING *",
    [uuid, name, mail, hash]);

    req.login(newUser.rows[0], (err)=>{
      if(err) console.log(err);
      res.redirect("/app");
    });
});

// login page
app.post("/login", passport.authenticate("local", {
  successRedirect: "/app",
  failureRedirect: "/signup?error=Invalid credentials.",
}));

// add task on task list
app.post("/task", async (req, res) => {
  const d = new Date();
  //console.log("tkas:", req.body.t_name);
  const task_id = uuidv4();
  try {
    await db.query(
      'INSERT INTO task (user_id, task, task_id, date, month, year) VALUES ($1, $2, $3, $4, $5, $6)',
      [req.user.id, req.body.t_name, task_id, d.getDate(), d.getMonth() + 1, d.getFullYear()]
    );
    res.redirect("/app");
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to add task");
  }
});

// delete task on task list
app.post("/delete-task",async (req,res)=>{
  const d = new Date();
  //console.log("del id: "+req.body.task_id);
  try {    
      const data=await db.query("delete from task where task_id=($1)",[req.body.task_id]);
  }
  catch(err) {
      console.error(err);
  }
  res.redirect("/app");
});

// to mark complete on task
app.post("/complete-task", async (req, res) => {
  
  if (!req.isAuthenticated()) return res.redirect("/login");

  const d = new Date(); // fresh date
  try {
    // Delete task from `task` table
    await db.query(
      "DELETE FROM task WHERE task_id = $1",
      [req.body.task_id]
    );

    // Insert into `complete_task`
    await db.query(
      "INSERT INTO complete_task (user_id, task, task_id, date, month, year) VALUES ($1, $2, $3, $4, $5, $6)",
      [req.user.id, req.body.task, req.body.task_id, d.getDate(), d.getMonth() + 1, d.getFullYear()]
    );
    // let a,b;
    // try {
    //     const data = await db.query("select * from task where date=($1) and month=($2) and year=($3) and user_id=($4);",
    //       [d.getDate(),d.getMonth()+1,d.getFullYear(),req.user.id]);
    //     const data2 = await db.query("select * from complete_task where date=($1) and month=($2) and year=($3);",
    //       [d.getDate(),d.getMonth()+1,d.getFullYear()]);
    //     a=data.rowCount;
    //     b=data2.rowCount;
    //     complete=data2.rows;
    //     task=data.rows; 
    // }
    // catch(err) {
    //   console.error("error is executing"+err.stack);
    // }
    // percent = (a + b) === 0 ? 0 : (b / (a + b)) * 100;
    // console.log("inside: /complete-task: "+parseInt(percent) );
    
    // await db.query(
    //   "INSERT INTO complete_percentage (user_id, date, percentage) VALUES ($1, $2, $3) ON CONFLICT (user_id, date) DO UPDATE SET percentage = $3;",[req.user.id,new Date().toISOString().split('T')[0],parseInt(percent)]
    // );


    //res.render("app.ejs", {task:task,date:date,complete:complete,percent:percent} );

    res.redirect("/app");

  } catch (err) {
    console.error(err);
    res.status(500).send("Error completing task");
  }
});


// delete all completed task
app.post("/delete-complete",async  (req,res)=>{
  const d = new Date();
  try{
      await db.query("delete from complete_task where date=($1) and month=($2) and year=($3)",
        [d.getDate(), d.getMonth()+1, d.getFullYear()]);
  }
  catch(err) {
      console.error(err);
  }
  res.redirect("/app");
})


// delete all task on task list
app.post("/delete-today", async (req,res)=>{
  const d = new Date();
  try {
      await db.query("delete from task where date=($1) and month=($2) and year=($3)",
        [d.getDate(), d.getMonth()+1, d.getFullYear()]
      );
  }
  catch(err) {
      console.error(err);
  }
  res.redirect("/app");
})


// strategies
passport.use("local",
  new Strategy({ usernameField: "mail" }, async function verify(mail, password, cb) {
  try {
    const result = await db.query(
    "select * from users where mail = ($1)",
    [mail]);
  
    if (result.rows.length == 0) {
      console.log("Account does not exist.");
      return cb(null, false, { message: "Account does not exist" });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.log("Invalid Credentials");
      return cb(null, false, { message: "Invalid Credentials" });
    } 
    return cb(null, user);
  } catch(err) {
    console.error("Error during authentication:", err);
    return cb(err);
  }
}));
console.log("Using Google Strategy"+ process.env.GOOGLE_CALLBACK_URL)
passport.use(
  "google", 
  new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
  }, async (accessToken, refreshToken, profile, cb) => {
    try {
      const result = await db.query(
      "select * from users where mail = ($1)",
      [profile.email]);
      
      if (result.rows.length == 0) {
        const uuid = uuidv4();
        const newUser = await db.query(
          "insert into users (id, name, mail, password) values ($1, $2, $3, $4) RETURNING *",
          [uuid, profile.displayName, profile.email, "google"]);
        cb(null, newUser.rows[0]);
      } else {
        cb(null, result.rows[0]);
      }
    } catch(err) {
      return cb(err);
    }
  })
);

passport.serializeUser((user, cb) => {
  cb(null, user);
});

passport.deserializeUser((user, cb) => {
  cb(null, user);
});

app.listen(port, () => {
  console.log(`App is running on http://localhost:${port}.`)
});
