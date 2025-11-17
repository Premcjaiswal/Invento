const express = require('express');
const router = express.Router();
const ActivityLog = require('../models/ActivityLog');
const { protect } = require('../middleware/auth');

// Get activity logs with filters
router.get('/', protect, async (req, res) => {
  try {
    const { user, action, entity, startDate, endDate, limit = 100 } = req.query;
    
    let query = {};
    if (user) query.user = user;
    if (action) query.action = action;
    if (entity) query.entity = entity;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const logs = await ActivityLog.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get activity logs for specific entity
router.get('/entity/:entity/:entityId', protect, async (req, res) => {
  try {
    const logs = await ActivityLog.find({
      entity: req.params.entity,
      entityId: req.params.entityId
    })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user activity summary
router.get('/user/:userId/summary', protect, async (req, res) => {
  try {
    const logs = await ActivityLog.find({ user: req.params.userId });
    
    const summary = {
      totalActions: logs.length,
      byAction: {},
      byEntity: {},
      recentActivity: []
    };
    
    logs.forEach(log => {
      if (!summary.byAction[log.action]) summary.byAction[log.action] = 0;
      if (!summary.byEntity[log.entity]) summary.byEntity[log.entity] = 0;
      summary.byAction[log.action]++;
      summary.byEntity[log.entity]++;
    });
    
    summary.recentActivity = logs.slice(0, 10);
    
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create activity log (internal use)
router.post('/', protect, async (req, res) => {
  try {
    const log = new ActivityLog({
      ...req.body,
      user: req.user.id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });
    await log.save();
    res.status(201).json({ success: true, data: log });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;

