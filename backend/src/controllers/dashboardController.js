const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

// @desc    Get dashboard statistics (manual or automatic)
// @route   GET /api/dashboard/stats
const getDashboardStats = async (req, res) => {
  try {
    // 1. Fetch manual settings from the database
    const manualSettingsRaw = await prisma.dashboardSetting.findMany();
    const manualSettings = manualSettingsRaw.reduce((acc, setting) => {
      acc[setting.key] = parseInt(setting.value, 10);
      return acc;
    }, {});

    // 2. Fetch automatic counts from source playlists
    const automaticCountsRaw = await prisma.sourcePlaylist.groupBy({
      by: ['type'],
      _sum: {
        streamCount: true,
      },
    });

    const automaticCounts = {
      LIVE: 0,
      MOVIE: 0,
      SERIES: 0,
    };

    automaticCountsRaw.forEach(group => {
      automaticCounts[group.type] = group._sum.streamCount || 0;
    });

    // 3. Combine counts, giving priority to manual settings
    const finalCounts = {
      liveChannels: manualSettings.manual_live_tv_count ?? automaticCounts.LIVE,
      movies: manualSettings.manual_movie_count ?? automaticCounts.MOVIE,
      series: manualSettings.manual_series_count ?? automaticCounts.SERIES,
    };

    // Fetch other stats like client and reseller counts
    const totalClients = await prisma.client.count();
    const totalResellers = await prisma.user.count({ where: { role: 'RESELLER' } });

    res.status(200).json({
      contentCounts: finalCounts,
      totalClients,
      totalResellers,
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

// @desc    Get all manual dashboard settings
// @route   GET /api/dashboard/settings
// @access  SUPER_ADMIN
const getDashboardSettings = async (req, res) => {
    try {
        const settings = await prisma.dashboardSetting.findMany();
        // Convert to a simple key-value object for the frontend
        const settingsObj = settings.reduce((acc, setting) => {
            acc[setting.key] = setting.value;
            return acc;
        }, {});
        res.status(200).json(settingsObj);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch dashboard settings.', error });
    }
};

// @desc    Update manual dashboard settings
// @route   PUT /api/dashboard/settings
// @access  SUPER_ADMIN
const updateDashboardSettings = async (req, res) => {
    const { settings } = req.body; // Expecting an object like { manual_movie_count: "1500" }

    if (typeof settings !== 'object' || settings === null) {
        return res.status(400).json({ message: 'Request body must contain a "settings" object.' });
    }

    try {
        const updatePromises = Object.entries(settings).map(([key, value]) => {
            return prisma.dashboardSetting.upsert({
                where: { key },
                update: { value: String(value) },
                create: { key, value: String(value) },
            });
        });

        await prisma.$transaction(updatePromises);

        res.status(200).json({ message: 'Settings updated successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update dashboard settings.', error });
    }
};

module.exports = {
  getDashboardStats,
  getDashboardSettings,
  updateDashboardSettings,
};
