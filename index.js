import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "1234",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;
async function users_list(){
const result = await db.query("SELECT * FROM users");

return result.rows;
}
async function checkVisisted() {
  const result = await db.query("SELECT travel_tracker.country_code FROM travel_tracker JOIN users ON users.id=travel_tracker.user_id WHERE users.id=$1",
  [currentUserId]);
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}
async function track_users(){
  var users=await users_list();
  var current_user= users.find((el)=>el.id==currentUserId);
  console.log(current_user);
  return current_user;
}
app.get("/", async (req, res) => {
  const countries = await checkVisisted();
  console.log(countries);
  const currentuser=await track_users();
  console.log(currentuser.color);
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: await users_list(),
    color: currentuser.color,
  });
});
app.post("/add", async (req, res) => {
  const input = req.body["country"];
  const currentuser = await track_users();

  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      await db.query(
        "INSERT INTO travel_tracker (country_code,user_id) VALUES ($1,$2)",
        [countryCode,currentuser.id]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
});
app.post("/user", async (req, res) => {
  if(req.body["add"]==="new")
  {
    res.render("new.ejs");
  }
  else{
    currentUserId=req.body.user;
    console.log(currentUserId);
    res.redirect("/");
  }

});


app.post("/new", async (req, res) => {

  const user_name= req.body.name;
  console.log(user_name);
  const user_color=req.body.color;
  console.log(user_color);
  const result= await db.query("INSERT INTO users(name,color) VALUES($1,$2) RETURNING id",[user_name,user_color] );
  console.log(result.rows[0].id);
  currentUserId=result.rows[0].id
  res.redirect("/");
  //Hint: The RETURNING keyword can return the data that was inserted.
  //https://www.postgresql.org/docs/current/dml-returning.html
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
