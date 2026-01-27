// src/routes/analytics.js
const express = require('express');
const Scan = require('../models/Scan');
const User = require('../models/User');
const auth = require('../middleware/auth');
const createCsvWriter = require('csv-writer').createObjectCsvStringifier;
const moment = require('moment-timezone');

const router = express.Router();

// Helper function to get date range
const getDateRange = (days = 7) => {
  const end = moment().endOf('day');
  const start = moment().subtract(days - 1, 'days').startOf('day');
  return { start, end };
};

// Helper function to build date series
const buildDateSeries = (start, end, timezone = 'UTC') => {
  const series = {};
  const current = moment.tz(start, timezone);
  const last = moment.tz(end, timezone);
  
  while (current.isSameOrBefore(last, 'day')) {
    const dateKey = current.format('YYYY-MM-DD');
    series[dateKey] = 0;
    current.add(1, 'day');
  }
  
  return series;
};

/**
 * @route GET /analytics/summary
 * @desc Get summary statistics for QR code scans
 * @access Private
 */
router.get('/summary', auth, async (req, res) => {
  try {
    const { 
      days = 7, 
      qrId, 
      source, 
      medium, 
      campaign, 
      device, 
      os, 
      browser, 
      country,
      timezone = 'UTC'
    } = req.query;

    // Build filter query
    const filter = {};
    if (qrId) filter.qrId = qrId;
    if (source) filter.source = source;
    if (medium) filter.medium = medium;
    if (campaign) filter.campaign = campaign;
    if (device) filter['deviceInfo.deviceType'] = device.toLowerCase();
    if (os) filter['deviceInfo.os'] = new RegExp(os, 'i');
    if (browser) filter['deviceInfo.browser'] = new RegExp(browser, 'i');
    if (country) filter['deviceInfo.geo.country'] = country;

    // Set date range
    const { start, end } = getDateRange(parseInt(days, 10));
    filter.timestamp = { 
      $gte: start.toDate(),
      $lte: end.toDate()
    };

    // Get total scans, conversions, and registered users in date range
    const [totalScans, totalConversions, totalRegisteredUsers] = await Promise.all([
      Scan.countDocuments(filter),
      Scan.countDocuments({ ...filter, conversion: true }),
      User.countDocuments({
        createdAt: {
          $gte: start.toDate(),
          $lte: end.toDate()
        }
      })
    ]);

    // Get unique visitors (by hashed IP)
    const uniqueVisitors = await Scan.distinct('hashedIp', filter);

    // Get device breakdown
    const deviceBreakdown = await Scan.aggregate([
      { $match: filter },
      { 
        $group: {
          _id: '$deviceInfo.deviceType',
          count: { $sum: 1 },
          conversions: { 
            $sum: { $cond: [{ $eq: ['$conversion', true] }, 1, 0] } 
          }
        }
      },
      { 
        $project: {
          _id: 0,
          device: '$_id',
          count: 1,
          conversions: 1,
          conversionRate: { 
            $cond: [
              { $eq: ['$count', 0] },
              0,
              { $multiply: [{ $divide: ['$conversions', '$count'] }, 100] }
            ]
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get OS breakdown
    const osBreakdown = await Scan.aggregate([
      { $match: filter },
      { 
        $group: {
          _id: '$deviceInfo.os',
          count: { $sum: 1 },
          versions: { 
            $push: {
              version: '$deviceInfo.osVersion',
              device: '$deviceInfo.deviceType'
            }
          }
        }
      },
      { 
        $project: {
          _id: 0,
          os: '$_id',
          count: 1,
          versions: {
            $reduce: {
              input: '$versions',
              initialValue: [],
              in: {
                $concatArrays: [
                  '$$value',
                  {
                    $cond: [
                      { $in: ['$$this.version', '$$value.version'] },
                      [],
                      ['$$this']
                    ]
                  }
                ]
              }
            }
          }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get browser breakdown
    const browserBreakdown = await Scan.aggregate([
      { $match: filter },
      { 
        $group: {
          _id: '$deviceInfo.browser',
          count: { $sum: 1 },
          versions: { $addToSet: '$deviceInfo.browserVersion' }
        }
      },
      { 
        $project: {
          _id: 0,
          browser: '$_id',
          count: 1,
          versions: 1
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get country breakdown
    const countryBreakdown = await Scan.aggregate([
      { 
        $match: { 
          ...filter,
          'deviceInfo.geo.country': { $exists: true, $ne: null }
        } 
      },
      { 
        $group: {
          _id: '$deviceInfo.geo.country',
          count: { $sum: 1 },
          cities: { 
            $addToSet: {
              city: '$deviceInfo.geo.city',
              region: '$deviceInfo.geo.region'
            }
          },
          conversions: { 
            $sum: { $cond: [{ $eq: ['$conversion', true] }, 1, 0] } 
          }
        }
      },
      { 
        $project: {
          _id: 0,
          country: '$_id',
          count: 1,
          cities: { $size: '$cities' },
          conversions: 1,
          conversionRate: { 
            $cond: [
              { $eq: ['$count', 0] },
              0,
              { $multiply: [{ $divide: ['$conversions', '$count'] }, 100] }
            ]
          }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    // Get time series data
    const timeSeries = await Scan.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            $dateToString: { 
              format: '%Y-%m-%d', 
              date: '$timestamp',
              timezone: timezone
            }
          },
          scans: { $sum: 1 },
          conversions: { 
            $sum: { $cond: [{ $eq: ['$conversion', true] }, 1, 0] } 
          },
          uniqueVisitors: { $addToSet: '$hashedIp' }
        }
      },
      { 
        $project: {
          _id: 0,
          date: '$_id',
          scans: 1,
          conversions: 1,
          uniqueVisitors: { $size: '$uniqueVisitors' },
          conversionRate: {
            $cond: [
              { $eq: ['$scans', 0] },
              0,
              { $multiply: [{ $divide: ['$conversions', '$scans'] }, 100] }
            ]
          }
        }
      },
      { $sort: { date: 1 } }
    ]);

    // Fill in missing dates in time series
    const dateSeries = buildDateSeries(start, end, timezone);
    const filledTimeSeries = Object.keys(dateSeries).map(date => {
      const existing = timeSeries.find(item => item.date === date);
      return existing || {
        date,
        scans: 0,
        conversions: 0,
        uniqueVisitors: 0,
        conversionRate: 0
      };
    });

    // Get recent scans
    const recentScans = await Scan.find(filter)
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();

    // Prepare response
    const response = {
      summary: {
        totalScans,
        totalConversions,
        uniqueVisitors: uniqueVisitors.length,
        totalRegisteredUsers,
        conversionRate: totalScans > 0 
          ? (totalConversions / totalScans) * 100 
          : 0,
        dateRange: {
          start: start.toISOString(),
          end: end.toISOString(),
          timezone
        }
      },
      breakdowns: {
        devices: deviceBreakdown,
        os: osBreakdown,
        browsers: browserBreakdown,
        countries: countryBreakdown
      },
      timeSeries: filledTimeSeries,
      recentScans: recentScans.map(scan => ({
        id: scan._id,
        qrId: scan.qrId,
        timestamp: scan.timestamp,
        device: scan.device,
        os: scan.deviceInfo?.os,
        browser: scan.deviceInfo?.browser,
        country: scan.deviceInfo?.geo?.country,
        city: scan.deviceInfo?.geo?.city,
        conversion: scan.conversion,
        conversionAction: scan.conversionAction
      }))
    };

    res.json(response);
  } catch (error) {
    console.error('Analytics summary error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch analytics summary',
      details: error.message 
    });
  }
});

// GET /analytics/scans
// Protected. Returns recent scans with full IP
router.get('/scans', auth, async (req, res) => {
  try {
    const { qrId, from, to, page = 1, limit = 50, deviceType, conversionStatus, ip, sortBy = 'timestamp', sortOrder = 'desc' } = req.query;
    const q = {};
    if (qrId) q.qrId = new RegExp(qrId, 'i');
    if (from || to) q.timestamp = {};
    if (from) q.timestamp.$gte = new Date(from);
    if (to) q.timestamp.$lte = new Date(to);
    if (deviceType && deviceType !== 'All') q['deviceInfo.type'] = deviceType.toLowerCase();
    if (conversionStatus === 'Converted') q.conversion = true;
    if (conversionStatus === 'Not Converted') q.conversion = false;
    if (ip) q.ip = new RegExp(ip, 'i');

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    const totalCount = await Scan.countDocuments(q);
    const scans = await Scan.find(q).sort(sortObj).skip(skip).limit(parseInt(limit, 10)).lean();

    // send full IPs now
    const sanitized = scans.map(s => ({
      _id: s._id,
      qrId: s.qrId,
      timestamp: s.timestamp,
      ip: s.ip, // full IP
      deviceInfo: s.deviceInfo,
      conversion: s.conversion,
      conversionAction: s.conversionAction,
      publisher: s.publisher,
      program: s.program,
    }));

    res.json({ 
      scans: sanitized,
      pagination: {
        total: totalCount,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(totalCount / parseInt(limit, 10))
      }
    });
  } catch (err) {
    console.error('analytics/scans error', err);
    res.status(500).json({ error: 'server error' });
  }
});

// GET /analytics/scans/export
router.get('/scans/export', auth, async (req, res) => {
  try {
    const { qrId, from, to } = req.query;
    const q = {};
    if (qrId) q.qrId = qrId;
    if (from || to) q.timestamp = {};
    if (from) q.timestamp.$gte = new Date(from);
    if (to) q.timestamp.$lte = new Date(to);

    const scans = await Scan.find(q).sort({ timestamp: -1 }).lean();

    const csvStringifier = createCsvWriter({
      header: [
        { id: 'timestamp', title: 'Timestamp' },
        { id: 'date', title: 'Date' },
        { id: 'qrId', title: 'QR ID' },
        { id: 'ip', title: 'IP Address' },
        { id: 'device', title: 'Device' },
        { id: 'conversion', title: 'Conversion' },
        { id: 'conversionAction', title: 'Conversion Action' },
        { id: 'publisher', title: 'Publisher' },
        { id: 'program', title: 'Program' }
      ]
    });

    const records = scans.map(s => {
      const deviceStr = s.deviceInfo 
        ? `${s.deviceInfo.deviceName || s.deviceInfo.model}, ${s.deviceInfo.os} ${s.deviceInfo.osVersion || ''}`.trim()
        : (s.device || '');
      
      return {
        timestamp: s.timestamp.toISOString(),
        date: s.timestamp.toISOString().split('T')[0],
        qrId: s.qrId || '',
        ip: s.ip, // full IP
        device: deviceStr,
        conversion: s.conversion ? 'Yes' : 'No',
        conversionAction: s.conversionAction || 'No Conversion',
        publisher: s.publisher || '',
        program: s.program || ''
      };
    });

    const header = csvStringifier.getHeaderString();
    const body = csvStringifier.stringifyRecords(records);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="scans_export.csv"`);
    res.send(header + body);
  } catch (err) {
    console.error('analytics/export error', err);
    res.status(500).json({ error: 'server error' });
  }
});

// GET /analytics/scans/by-period
router.get('/scans/by-period', auth, async (req, res) => {
  try {
    const { period = 'past7', limit = 50, page = 1 } = req.query;
    
    const days = period === 'past7' ? 7 : 30;
    const { start, end } = getDateRange(days);
    
    const filter = {
      timestamp: { 
        $gte: start.toDate(),
        $lte: end.toDate()
      }
    };
    
    const totalCount = await Scan.countDocuments(filter);
    const scans = await Scan.find(filter)
      .sort({ timestamp: -1 })
      .skip((Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10))
      .limit(parseInt(limit, 10))
      .lean();
    
    const formattedScans = scans.map(scan => ({
      _id: scan._id,
      qrId: scan.qrId,
      timestamp: scan.timestamp,
      date: scan.timestamp.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }),
      time: scan.timestamp.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false
      }),
      deviceInfo: scan.deviceInfo,
      city: scan.deviceInfo?.geo?.city || 'Unknown',
      region: scan.deviceInfo?.geo?.region || '',
      country: scan.deviceInfo?.geo?.country || '',
      creativeId: scan.creativeId || 'N/A',
      campaign: scan.campaign || 'N/A',
      publisher: scan.publisher || 'Direct',
      program: scan.program || 'N/A',
      conversion: scan.conversion || false,
      conversionAction: scan.conversionAction || null,
      ip: scan.ip,
      userAgent: scan.userAgent
    }));
    
    res.json({
      scans: formattedScans,
      pagination: {
        total: totalCount,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(totalCount / parseInt(limit, 10))
      },
      period,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString()
      }
    });
  } catch (error) {
    console.error('Analytics scans/by-period error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch scans',
      details: error.message 
    });
  }
});

// GET /analytics/scans/:scanId
router.get('/scans/:scanId', auth, async (req, res) => {
  try {
    const scan = await Scan.findById(req.params.scanId).lean();
    
    if (!scan) {
      return res.status(404).json({ error: 'Scan not found' });
    }
    
    const formattedScan = {
      _id: scan._id,
      qrId: scan.qrId,
      timestamp: scan.timestamp,
      date: scan.timestamp.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }),
      time: scan.timestamp.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false
      }),
      deviceInfo: {
        deviceType: scan.deviceInfo?.deviceType || 'unknown',
        os: scan.deviceInfo?.os || 'unknown',
        osVersion: scan.deviceInfo?.osVersion || '',
        browser: scan.deviceInfo?.browser || 'unknown',
        browserVersion: scan.deviceInfo?.browserVersion || '',
        device: scan.deviceInfo?.device || 'unknown',
        isMobile: scan.deviceInfo?.isMobile || false,
        isTablet: scan.deviceInfo?.isTablet || false,
        isDesktop: scan.deviceInfo?.isDesktop || true
      },
      geo: {
        city: scan.deviceInfo?.geo?.city || 'Unknown',
        region: scan.deviceInfo?.geo?.region || '',
        country: scan.deviceInfo?.geo?.country || '',
        timezone: scan.deviceInfo?.geo?.timezone || 'UTC'
      },
      creativeId: scan.creativeId || 'N/A',
      campaign: scan.campaign || 'N/A',
      publisher: scan.publisher || 'Direct',
      program: scan.program || 'N/A',
      conversion: scan.conversion || false,
      conversionAction: scan.conversionAction || null,
      ip: scan.ip,
      userAgent: scan.userAgent,
      referrer: scan.referrer || null,
      meta: scan.meta || {}
    };
    
    res.json(formattedScan);
  } catch (error) {
    console.error('Analytics scans/:scanId error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch scan details',
      details: error.message 
    });
  }
});

module.exports = router;
