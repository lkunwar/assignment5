/********************************************************************************
*  WEB322 – Assignment 05
* 
*  I declare that this assignment is my own work in accordance with Seneca's
*  Academic Integrity Policy:
* 
*  https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
* 
*  Name: ______________________ Student ID: ______________ Date: ______________
*
*  Published URL: ___________________________________________________________
*
********************************************************************************/



const express = require('express');
const path = require('path');
const projectData = require('./modules/projects');

const app = express();
const PORT = process.env.PORT || 3000;

// Set up EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.render("home", { page: "/" });
});

app.get('/about', (req, res) => {
  res.render("about", { page: "/about" });
});

// Get all projects (grouped by sector)
app.get('/solutions/projects', async (req, res) => {
  try {
    const projects = await projectData.getAllProjects();
    
    // Group by sector
    const grouped = projects.reduce((acc, project) => {
      const sector = project.Sector.sector_name;
      if (!acc[sector]) acc[sector] = [];
      acc[sector].push(project);
      return acc;
    }, {});

    res.render("projects", { 
      grouped,
      page: "/solutions/projects"
    });
  } catch (err) {
    res.render("500", { 
      message: `Error loading projects: ${err.message}` 
    });
  }
});

// Get projects by sector
app.get('/solutions/projects/sector', async (req, res) => {
  const sector = req.query.sector;
  
  try {
    const projects = await projectData.getProjectsBySector(sector);
    res.render("projects", { 
      projects,
      page: "/solutions/projects"
    });
  } catch (err) {
    res.status(404).render("404", { 
      message: err.message 
    });
  }
});

// Get single project
app.get('/solutions/projects/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  
  try {
    const project = await projectData.getProjectById(id);
    res.render("project", { 
      project,
      page: "" 
    });
  } catch (err) {
    res.status(404).render("404", { 
      message: "Project not found" 
    });
  }
});

// Add project (form)
app.get('/solutions/addProject', async (req, res) => {
  try {
    const sectors = await projectData.getAllSectors();
    res.render("addProject", { 
      sectors,
      page: "/solutions/addProject" 
    });
  } catch (err) {
    res.render("500", { 
      message: `Error loading form: ${err.message}` 
    });
  }
});

// Add project (submit)
app.post('/solutions/addProject', async (req, res) => {
  try {
    await projectData.addProject(req.body);
    res.redirect('/solutions/projects');
  } catch (err) {
    res.render("500", { 
      message: `Error adding project: ${err.message}` 
    });
  }
});

// Edit project (form)
app.get('/solutions/editProject/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  
  try {
    const [project, sectors] = await Promise.all([
      projectData.getProjectById(id),
      projectData.getAllSectors()
    ]);
    
    res.render("editProject", { 
      project,
      sectors,
      page: "" 
    });
  } catch (err) {
    res.status(404).render("404", { 
      message: "Project not found" 
    });
  }
});

// Edit project (submit)
app.post('/solutions/editProject', async (req, res) => {
  try {
    await projectData.editProject(req.body.id, req.body);
    res.redirect('/solutions/projects');
  } catch (err) {
    res.render("500", { 
      message: `Error updating project: ${err.message}` 
    });
  }
});

// Delete project
app.get('/solutions/deleteProject/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  
  try {
    await projectData.deleteProject(id);
    res.redirect('/solutions/projects');
  } catch (err) {
    res.render("500", { 
      message: `Error deleting project: ${err.message}` 
    });
  }
});

// 404 Handler
app.use((req, res) => {
  res.status(404).render("404", { 
    message: "Page not found",
    page: "" 
  });
});

// Initialize and start server
projectData.initialize()
  .then(() => {
    if (process.env.VERCEL !== '1') {
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    }
  })
  .catch(err => {
    console.error("Failed to initialize data:", err);
  });

module.exports = app;