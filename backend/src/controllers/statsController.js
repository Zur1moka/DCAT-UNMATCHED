const db = require('../config/database');

exports.getOverviewStats = (req, res) => {
  const queries = {
    totalUsers: 'SELECT COUNT(*) as count FROM users',
    totalMatches: 'SELECT COUNT(*) as count FROM matches',
    totalCheckins: 'SELECT COUNT(*) as count FROM checkins',
    totalQuestsCompleted: 'SELECT COUNT(*) as count FROM user_quests',
  };

  const results = {};

  const runQuery = (key, sql) => {
    return new Promise((resolve, reject) => {
      db.get(sql, (err, row) => {
        if (err) reject(err);
        results[key] = row ? row.count : 0;
        resolve();
      });
    });
  };

  Promise.all(Object.keys(queries).map(key => runQuery(key, queries[key])))
    .then(() => {
      db.all(
        `
        SELECT name, tier, usage_count, wins, losses,
               ROUND(1.0 * wins / NULLIF(usage_count, 0) * 100, 1) as winrate
        FROM heroes
        WHERE usage_count > 0
        ORDER BY usage_count DESC
        LIMIT 5
        `,
        (err, topHeroes) => {
          if (err) return res.status(500).json({ error: err.message });
          results.topHeroes = topHeroes || [];
          res.json(results);
        }
      );
    })
    .catch(err => res.status(500).json({ error: err.message }));
};

exports.getDailyStats = (req, res) => {
  const { days = 7 } = req.query;
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - days);

  db.all(
    `
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as matches,
      SUM(xp_awarded) as total_xp
    FROM matches
    WHERE created_at >= ?
    GROUP BY DATE(created_at)
    ORDER BY date ASC
    `,
    [daysAgo.toISOString()],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows || []);
    }
  );
};

exports.getLevelDistribution = (req, res) => {
  db.all(
    `
    SELECT 
      level,
      COUNT(*) as count
    FROM users
    GROUP BY level
    ORDER BY level ASC
    `,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows || []);
    }
  );
};