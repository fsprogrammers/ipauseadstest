// src/routes/a2ar.js
const express = require('express');
const router = express.Router();
const A2ARMetric = require('../models/A2ARMetric');
const authMiddleware = require('../middleware/auth');

/**
 * GET /a2ar/summary
 * Get A2AR metrics summary for the authenticated user (based on scans they made)
 */
router.get('/summary', authMiddleware, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const userId = req.user.id;

    // Get scans for this user (regardless of QR code owner)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0);

    const Scan = require('../models/Scan');
    const scans = await Scan.find({
      createdAt: { $gte: startDate }
    }).lean();

    if (scans.length === 0) {
      return res.json({
        a2ar: {
          pauseOpportunities: 0,
          qrDownloads: 0,
          percentage: 0,
          tier: 1,
          label: 'Low'
        },
        asv: {
          averageSeconds: 0,
          tier: 0,
          label: 'N/A'
        },
        aci: {
          score: 0,
          level: 0,
          label: 'N/A'
        }
      });
    }

    // Calculate A2AR metrics from scans
    const totalScans = scans.length;
    const conversions = scans.filter(s => s.conversion === true).length;
    const a2ar = totalScans > 0 ? (conversions / totalScans) * 100 : 0;
    
    const a2arResult = A2ARMetric.getA2ARTier(a2ar);

    // Calculate ASV from scans with asvSeconds in meta
    const scansWithAsv = scans.filter(s => s.meta && s.meta.asvSeconds);
    console.log(`[A2AR SUMMARY] Total scans: ${scans.length}, Scans with ASV: ${scansWithAsv.length}`);
    
    if (scansWithAsv.length > 0) {
      console.log(`[A2AR SUMMARY] Scans with ASV data:`, scansWithAsv.map(s => ({
        qrId: s.qrId,
        asvSeconds: s.meta.asvSeconds
      })));
    }

    let avgAsvSeconds = 0;
    let asvTier = 0;
    let asvLabel = 'N/A';

    if (scansWithAsv.length > 0) {
      const totalAsvSeconds = scansWithAsv.reduce((sum, s) => sum + (s.meta.asvSeconds || 0), 0);
      avgAsvSeconds = totalAsvSeconds / scansWithAsv.length;
      
      console.log(`[A2AR SUMMARY] ASV Calculation:`, {
        totalAsvSeconds,
        scansCount: scansWithAsv.length,
        avgAsvSeconds,
        avgAsvSecondsRounded: parseFloat(avgAsvSeconds.toFixed(2))
      });
      
      // Calculate ASV tier based on seconds
      if (avgAsvSeconds > 40) {
        asvTier = 1;
        asvLabel = 'Low';
      } else if (avgAsvSeconds > 20) {
        asvTier = 2;
        asvLabel = 'Fair';
      } else if (avgAsvSeconds > 10) {
        asvTier = 3;
        asvLabel = 'Average';
      } else if (avgAsvSeconds > 5) {
        asvTier = 4;
        asvLabel = 'Strong';
      } else if (avgAsvSeconds >= 0) {
        asvTier = 5;
        asvLabel = 'Exceptional';
      }
      
      console.log(`[A2AR SUMMARY] ASV Tier:`, { asvTier, asvLabel });
    } else {
      console.log(`[A2AR SUMMARY] No scans with ASV data found`);
    }

    // Calculate ACI from A2AR tier and ASV tier
    let aciScore = 0;
    let aciLevel = 0;
    let aciLabel = 'N/A';

    if (a2arResult.tier > 0 && asvTier > 0) {
      const rawAci = (a2arResult.tier + asvTier) / 2;
      aciScore = rawAci * 2;
      
      if (aciScore >= 9) {
        aciLevel = 5;
        aciLabel = 'Exceptional';
      } else if (aciScore >= 8) {
        aciLevel = 4;
        aciLabel = 'Strong';
      } else if (aciScore >= 6) {
        aciLevel = 3;
        aciLabel = 'Average';
      } else if (aciScore >= 4) {
        aciLevel = 2;
        aciLabel = 'Fair';
      } else if (aciScore >= 2) {
        aciLevel = 1;
        aciLabel = 'Low';
      }
    }

    res.json({
      a2ar: {
        pauseOpportunities: totalScans,
        qrDownloads: conversions,
        percentage: parseFloat(a2ar.toFixed(2)),
        tier: a2arResult.tier,
        label: a2arResult.label
      },
      asv: {
        averageSeconds: parseFloat(avgAsvSeconds.toFixed(2)),
        tier: asvTier,
        label: asvLabel
      },
      aci: {
        score: parseFloat(aciScore.toFixed(2)),
        level: aciLevel,
        label: aciLabel
      }
    });
  } catch (error) {
    console.error('Error fetching A2AR summary:', error);
    res.status(500).json({ error: 'Failed to fetch A2AR summary' });
  }
});

/**
 * GET /a2ar/by-program
 * Get A2AR breakdown by program
 */
router.get('/by-program', authMiddleware, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const advertiserId = req.user.id;

    const programs = await A2ARMetric.getByProgram(advertiserId, parseInt(days));
    res.json({ programs });
  } catch (error) {
    console.error('Error fetching A2AR by program:', error);
    res.status(500).json({ error: 'Failed to fetch program A2AR' });
  }
});

/**
 * GET /a2ar/by-publisher
 * Get A2AR breakdown by publisher
 */
router.get('/by-publisher', authMiddleware, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const advertiserId = req.user.id;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0);

    const publishers = await A2ARMetric.aggregate([
      {
        $match: {
          advertiser: require('mongoose').Types.ObjectId.createFromHexString(advertiserId),
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$publisher',
          pauseOpportunities: { $sum: '$pauseOpportunities' },
          qrScans: { $sum: '$qrScans' },
          verifiedConversions: { $sum: '$verifiedConversions' },
          avgA2AR: { $avg: '$a2arPercentage' }
        }
      },
      {
        $project: {
          _id: 0,
          publisher: '$_id',
          pauseOpportunities: 1,
          qrScans: 1,
          verifiedConversions: 1,
          avgA2AR: { $round: ['$avgA2AR', 2] }
        }
      },
      { $sort: { pauseOpportunities: -1 } }
    ]);

    res.json({ publishers });
  } catch (error) {
    console.error('Error fetching A2AR by publisher:', error);
    res.status(500).json({ error: 'Failed to fetch publisher A2AR' });
  }
});

/**
 * GET /a2ar/daily
 * Get daily A2AR metrics for charting
 */
router.get('/daily', authMiddleware, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const advertiserId = req.user.id;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0);

    const daily = await A2ARMetric.aggregate([
      {
        $match: {
          advertiser: require('mongoose').Types.ObjectId.createFromHexString(advertiserId),
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$date',
          pauseOpportunities: { $sum: '$pauseOpportunities' },
          qrScans: { $sum: '$qrScans' },
          verifiedConversions: { $sum: '$verifiedConversions' }
        }
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          pauseOpportunities: 1,
          qrScans: 1,
          verifiedConversions: 1,
          a2ar: {
            $cond: [
              { $eq: ['$pauseOpportunities', 0] },
              0,
              {
                $round: [
                  { $multiply: [{ $divide: ['$verifiedConversions', '$pauseOpportunities'] }, 100] },
                  2
                ]
              }
            ]
          }
        }
      },
      { $sort: { date: 1 } }
    ]);

    res.json({ daily });
  } catch (error) {
    console.error('Error fetching daily A2AR:', error);
    res.status(500).json({ error: 'Failed to fetch daily A2AR' });
  }
});

/**
 * GET /a2ar/tiers
 * Get A2AR tier definitions (UPDATED)
 */
router.get('/tiers', (req, res) => {
  res.json({
    a2ar: [
      { tier: 1, label: 'Low', min: 0.2, max: 0.4, description: 'Below standard CTV response' },
      { tier: 2, label: 'Fair', min: 0.5, max: 0.7, description: 'Matches typical QR CTV ads' },
      { tier: 3, label: 'Average', min: 0.8, max: 1.5, description: 'Healthy baseline' },
      { tier: 4, label: 'Strong', min: 1.6, max: 2.5, description: 'Clear advantage' },
      { tier: 5, label: 'Exceptional', min: 2.6, max: 3.0, description: 'Rare, premium, context-perfect' }
    ],
    asv: [
      { tier: 1, label: 'Low', min: 40, max: null, description: 'Slow scan response (>40s)' },
      { tier: 2, label: 'Fair', min: 20, max: 40, description: 'Moderate scan response (20-40s)' },
      { tier: 3, label: 'Average', min: 10, max: 20, description: 'Standard scan response (10-20s)' },
      { tier: 4, label: 'Strong', min: 5, max: 10, description: 'Quick scan response (5-10s)' },
      { tier: 5, label: 'Exceptional', min: 0, max: 5, description: 'Instant scan response (<5s)' }
    ],
    aci: [
      { level: 1, label: 'Low', min: 2, max: 3, description: 'Low attention quality' },
      { level: 2, label: 'Fair', min: 4, max: 5, description: 'Fair attention quality' },
      { level: 3, label: 'Average', min: 6, max: 7, description: 'Average attention quality' },
      { level: 4, label: 'Strong', min: 8, max: 9, description: 'Strong attention quality' },
      { level: 5, label: 'Exceptional', min: 9, max: 10, description: 'Exceptional attention quality' }
    ]
  });
});

/**
 * GET /a2ar/attention-metrics/summary
 * Get comprehensive attention metrics (A2AR, ASV, ACI)
 */
router.get('/attention-metrics/summary', authMiddleware, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const advertiserId = req.user.id;

    const summary = await A2ARMetric.getSummary(advertiserId, parseInt(days));
    res.json(summary);
  } catch (error) {
    console.error('Error fetching attention metrics summary:', error);
    res.status(500).json({ error: 'Failed to fetch attention metrics' });
  }
});

/**
 * GET /a2ar/attention-metrics/by-program
 * Get attention metrics breakdown by program
 */
router.get('/attention-metrics/by-program', authMiddleware, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const advertiserId = req.user.id;

    const programs = await A2ARMetric.getByProgram(advertiserId, parseInt(days));
    res.json({ programs });
  } catch (error) {
    console.error('Error fetching attention metrics by program:', error);
    res.status(500).json({ error: 'Failed to fetch program metrics' });
  }
});

module.exports = router;
