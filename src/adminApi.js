import express from 'express';
import supabase from './supabaseClient.js';

const router = express.Router();

// Simple authentication middleware
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  const expectedAuth = `Bearer ${process.env.ADMIN_TOKEN || 'admin123'}`;
  
  if (auth && auth === expectedAuth) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

// GET /api/reports - Fetch all reports
router.get('/reports', async (req, res) => {
  try {
    const { data: reports, error } = await supabase
      .from('reports')
      .select(`
        id,
        category,
        description,
        location,
        status,
        created_at,
        users(fb_id, name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch reports' });
    }

    res.json(reports || []);
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/reports/:id - Update report status
router.put('/reports/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const validStatuses = ['Pending', 'In Progress', 'Resolved', 'Dismissed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const { data, error } = await supabase
      .from('reports')
      .update({ status })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Supabase update error:', error);
      return res.status(500).json({ error: 'Failed to update report' });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({ message: 'Report updated successfully', report: data[0] });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/stats - Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const { data: reports, error } = await supabase
      .from('reports')
      .select('status, category, created_at');

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch stats' });
    }

    const stats = {
      total: reports.length,
      pending: reports.filter(r => (r.status || 'Pending') === 'Pending').length,
      inProgress: reports.filter(r => r.status === 'In Progress').length,
      resolved: reports.filter(r => r.status === 'Resolved').length,
      dismissed: reports.filter(r => r.status === 'Dismissed').length,
      byCategory: {
        flood: reports.filter(r => r.category === 'Flood').length,
        fire: reports.filter(r => r.category === 'Fire').length,
        accident: reports.filter(r => r.category === 'Accident').length,
        other: reports.filter(r => r.category === 'Other').length
      },
      recentCount: reports.filter(r => {
        const reportDate = new Date(r.created_at);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return reportDate >= yesterday;
      }).length
    };

    res.json(stats);
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/reports/:id - Delete a report (with auth)
router.delete('/reports/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase delete error:', error);
      return res.status(500).json({ error: 'Failed to delete report' });
    }

    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;