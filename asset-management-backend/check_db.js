
const { MaintenanceRequest, MaintenanceDamageImage } = require('./src/models');
const sequelize = require('./src/config/database');

async function check() {
  try {
    const requests = await MaintenanceRequest.findAll({
      order: [['id', 'DESC']],
      limit: 10,
      include: [{ model: MaintenanceDamageImage, as: 'damageImages' }]
    });
    
    requests.forEach(req => {
      console.log('Maintenance:', {
        id: req.id,
        request_type: req.request_type,
        status: req.status,
        damageImagesCount: req.damageImages ? req.damageImages.length : 0,
        damageImages: req.damageImages ? req.damageImages.map(img => ({
          id: img.id,
          path: img.image_path,
          url: img.url
        })) : []
      });
    });
  } catch (err) {
    console.error('Error:', err);
  } finally {
    // await sequelize.close(); 
  }
}

check();
