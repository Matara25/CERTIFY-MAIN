const fs = require('fs');
const path = require('path');

// Path to the admin.js file
const adminJsPath = path.join(__dirname, 'routes', 'admin.js');

// Read the file
fs.readFile(adminJsPath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  // Check if the subjects route is already correctly set up
  if (data.includes("res.render('admin/subjects'")) {
    console.log('Subjects route is already correctly set up to render the view.');
    return;
  }

  // Replace the JSON response with view rendering
  const updatedData = data.replace(
    /router\.get\('\/subjects', isAdmin, async \(req, res\) => \{[\s\S]*?res\.json\(subjects\);/,
    `router.get('/subjects', isAdmin, async (req, res) => {
  try {
    const subjects = await Subject.find()
      .sort({ code: 1 });
    res.render('admin/subjects', {
      user: req.session.user,
      subjects,
      message: req.query.message
    });
  } catch (error) {
    res.status(500).render('error', { 
      message: 'Error loading subjects page',
      error: error.message 
    });
  }
});`
  );

  // Write the updated data back to the file
  fs.writeFile(adminJsPath, updatedData, 'utf8', (err) => {
    if (err) {
      console.error('Error writing file:', err);
      return;
    }
    console.log('Subjects route has been updated to render the view instead of returning JSON.');
  });
}); 