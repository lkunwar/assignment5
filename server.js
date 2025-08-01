/********************************************************************************
*  WEB322 – Assignment 06
* 
*  I declare that this assignment is my own work in accordance with Seneca's
*  Academic Integrity Policy:
* 
* https://www.senecapolytechnic.ca/about/policies/academic-integrity-policy.html
* 
*  Name: Laba Kunwar Student ID: 162983233 Date: 08/01/2025
*
*  Published URL: ___________________________________________________________
*
********************************************************************************/


const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const clientSessions = require("client-sessions");

const app = express();
const HTTP_PORT = process.env.PORT || 8080;
dotenv.config();

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

const projectData = require("./modules/projects");
const authData = require("./modules/auth-service");

app.use(clientSessions({
  cookieName: "session",
  secret: "assignment6_secret_cookie",
  duration: 2 * 60 * 1000,
  activeDuration: 1000 * 60
}));

app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

function ensureLogin(req, res, next) {
  if (!req.session.user) return res.redirect("/login");
  next();
}

app.get("/", (req, res) => res.redirect("/about"));

app.get("/about", (req, res) => res.render("about", { page: "/about" }));

app.get("/solutions/projects", (req, res) => {
  projectData.getAllProjects()
    .then(data => res.render("projects", { projects: data, page: "/solutions/projects" }))
    .catch(() => res.render("projects", { projects: [], page: "/solutions/projects" }));
});

app.get("/solutions/projects/:id", (req, res) => {
  projectData.getProjectById(req.params.id)
    .then(project => {
      if (!project) {
        return res.status(404).render("404", { message: "Project not found", page: "" });
      }
      res.render("project", { project, page: `/solutions/projects/${req.params.id}` });
    })
    .catch(() => res.status(500).render("500", { message: "Failed to load project", page: "" }));
});

app.get("/solutions/addProject", ensureLogin, (req, res) => {
  projectData.getAllSectors()
    .then(sectors => {
      res.render("addProject", { page: "/solutions/addProject", sectors });
    })
    .catch(() => {
      res.render("addProject", { page: "/solutions/addProject", sectors: [] });
    });
});

app.post("/solutions/addProject", ensureLogin, (req, res) => {
  projectData.addProject(req.body)
    .then(() => res.redirect("/solutions/projects"))
    .catch(err => res.status(500).send(err));
});

app.get("/solutions/edit/:id", ensureLogin, (req, res) => {
  Promise.all([
    projectData.getProjectById(req.params.id),
    projectData.getAllSectors()
  ])
    .then(([project, sectors]) => {
      if (!project) return res.status(404).render("404", { message: "Project not found", page: "" });
      res.render("editProject", { project, sectors });
    })
    .catch(() => res.redirect("/solutions/projects"));
});

app.post("/solutions/edit/:id", ensureLogin, (req, res) => {
  projectData.editProject(req.params.id, req.body)
    .then(() => res.redirect("/solutions/projects"))
    .catch(() => res.status(500).send("Unable to update project"));
});

app.get("/solutions/delete/:id", ensureLogin, (req, res) => {
  projectData.deleteProject(req.params.id)
    .then(() => res.redirect("/solutions/projects"))
    .catch(() => res.status(500).send("Unable to delete project"));
});

// Auth
app.get("/login", (req, res) => {
  res.render("login", { errorMessage: "", userName: "", page: "/login" });
});

app.post("/login", (req, res) => {
  req.body.userAgent = req.get("User-Agent");
  authData.checkUser(req.body)
    .then(user => {
      req.session.user = {
        userName: user.userName,
        email: user.email,
        loginHistory: user.loginHistory
      };
      res.redirect("/solutions/projects");
    })
    .catch(err => {
      res.render("login", { errorMessage: err, userName: req.body.userName, page: "/login" });
    });
});

app.get("/register", (req, res) => {
  res.render("register", { errorMessage: "", successMessage: "", userName: "", page: "/register" });
});

app.post("/register", (req, res) => {
  authData.registerUser(req.body)
    .then(() => res.render("register", {
      successMessage: "User created",
      errorMessage: "",
      userName: "",
      page: "/register"
    }))
    .catch(err => res.render("register", {
      errorMessage: err,
      successMessage: "",
      userName: req.body.userName,
      page: "/register"
    }));
});

app.get("/logout", (req, res) => {
  req.session.reset();
  res.redirect("/");
});

app.get("/userHistory", ensureLogin, (req, res) => {
  res.render("userHistory", { page: "/userHistory" });
});

app.use((req, res) => {
  res.status(404).render("404", { message: "Page Not Found", page: "" });
});

projectData.initialize()
  .then(authData.initialize)
  .then(() => {
    app.listen(HTTP_PORT, () => console.log("🚀 Server running on port " + HTTP_PORT));
  })
  .catch(err => {
    console.log("❌ Failed to start server:", err);
  });
