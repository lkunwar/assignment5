require('dotenv').config();
require('pg');
const Sequelize = require('sequelize');

let sequelize = new Sequelize(process.env.PGDATABASE, process.env.PGUSER, process.env.PGPASSWORD, {
  host: process.env.PGHOST,
  dialect: 'postgres',
  port: 5432,
  dialectOptions: {
    ssl: {
      require: true
    }
  }
});


const Sector = sequelize.define('Sector', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sector_name: {
    type: Sequelize.STRING
  }
}, {
  timestamps: false
});


const Project = sequelize.define('Project', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: Sequelize.STRING
  },
  feature_img_url: {
    type: Sequelize.STRING
  },
  summary_short: {
    type: Sequelize.TEXT
  },
  intro_short: {
    type: Sequelize.TEXT
  },
  impact: {
    type: Sequelize.TEXT
  },
  original_source_url: {
    type: Sequelize.STRING
  },
  sector_id: {
    type: Sequelize.INTEGER
  }
}, {
  timestamps: false
});


Project.belongsTo(Sector, { foreignKey: 'sector_id' });


const projectData = require("../data/projectData");
const sectorData = require("../data/sectorData");


function bulkInsert() {
  return Sector.bulkCreate(sectorData)
    .then(() => {
      return Project.bulkCreate(projectData);
    })
    .then(() => {
      console.log("Data inserted successfully");
    })
    .catch(err => {
      console.error("Error inserting data:", err);
    });
}


function initialize() {
  return sequelize.sync()
    .then(() => {
      
      return;
    })
    .catch(err => {
      throw new Error("Failed to sync database: " + err.message);
    });
}


function getAllProjects() {
  return Project.findAll({
    include: [Sector],
    attributes: [
      'id',
      'title',
      'feature_img_url', 
      'summary_short',
      'intro_short',
      'impact',
      'original_source_url',
      'sector_id'
    ],
    group: ['Project.id', 'Sector.id'],  
    order: [['title', 'ASC']]           
  })
  .then(projects => {
    if (projects.length > 0) {
      return projects;
    } else {
      throw new Error("No projects found");
    }
  })
  .catch(err => {
    console.error("Error fetching projects:", err);
    throw err; 
  });
}


function getProjectById(id) {
  return Project.findAll({
    where: { id: id },
    include: [Sector]
  })
  .then(projects => {
    if (projects.length > 0) {
      return projects[0];
    } else {
      throw new Error("Unable to find requested project");
    }
  });
}


function getProjectsBySector(sector) {
  return Project.findAll({
    include: [Sector],
    where: {
      '$Sector.sector_name$': {
        [Sequelize.Op.iLike]: `%${sector}%`
      }
    }
  })
  .then(projects => {
    if (projects.length > 0) {
      return projects;
    } else {
      throw new Error("Unable to find requested projects");
    }
  });
}


function getAllSectors() {
  return Sector.findAll()
    .then(sectors => {
      return sectors;
    })
    .catch(err => {
      throw new Error("Unable to retrieve sectors");
    });
}

function addProject(projectData) {
  return Project.create(projectData)
    .then(() => {
      return;
    })
    .catch(err => {
      throw new Error(err.errors[0].message);
    });
}

function editProject(id, projectData) {
  return Project.update(projectData, {
    where: { id: id }
  })
  .then(() => {
    return;
  })
  .catch(err => {
    throw new Error(err.errors[0].message);
  });
}

function deleteProject(id) {
  return Project.destroy({
    where: { id: id }
  })
  .then(() => {
    return;
  })
  .catch(err => {
    throw new Error(err.errors[0].message);
  });
}

module.exports = {
  initialize,
  getAllProjects,
  getProjectById,
  getProjectsBySector,
  getAllSectors,
  addProject,
  editProject,
  deleteProject
};