const mongoose = require('mongoose');
const Incident = require('./src/models/Incident');
const Issue = require('./src/models/Issue');

mongoose.connect('mongodb://localhost:27017/resolvr', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function checkIncidents() {
  try {
    const incidents = await Incident.find({}).populate('issue project triggeredBy');
    console.log(`\n✅ Found ${incidents.length} incidents in database:\n`);
    
    incidents.forEach(incident => {
      console.log(`  - ${incident._id}`);
      console.log(`    Status: ${incident.status}`);
      console.log(`    Severity: ${incident.severity}`);
      console.log(`    Issue: ${incident.issue?.key || 'N/A'}`);
      console.log(`    Created: ${incident.createdAt}\n`);
    });

    // Also check critical issues
    const criticalIssues = await Issue.find({ 
      $or: [
        { priority: 'critical' },
        { type: 'incident' }
      ]
    }).populate('project');
    
    console.log(`\n📋 Found ${criticalIssues.length} critical/incident issues:\n`);
    criticalIssues.forEach(issue => {
      console.log(`  - ${issue.key}: ${issue.title}`);
      console.log(`    Priority: ${issue.priority}, Type: ${issue.type}\n`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkIncidents();
